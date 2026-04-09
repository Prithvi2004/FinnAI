from datetime import datetime, timezone
from threading import Lock

job_results = {}
currentJob = {"job_id": None}
job_event_queues = {}
job_event_locks = {}


def init_job_events(job_id: str) -> None:
    """Initialize per-job event queue and lock for SSE streaming."""
    if job_id not in job_event_queues:
        job_event_queues[job_id] = []
    if job_id not in job_event_locks:
        job_event_locks[job_id] = Lock()


def publish_job_event(job_id: str, event_type: str, message: str, **payload) -> None:
    """Publish an event to a job-scoped queue."""
    init_job_events(job_id)
    with job_event_locks[job_id]:
        queue = job_event_queues[job_id]
        event = {
            "id": len(queue) + 1,
            "type": event_type,
            "message": message,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            **payload,
        }
        queue.append(event)


def consume_job_events(job_id: str, last_event_id: int):
    """Get events newer than the provided event id."""
    init_job_events(job_id)
    with job_event_locks[job_id]:
        return [event for event in job_event_queues[job_id] if event["id"] > last_event_id]


__all__ = [
    "job_results",
    "currentJob",
    "init_job_events",
    "publish_job_event",
    "consume_job_events",
]
