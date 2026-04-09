import asyncio
import json
import os
import threading
import uuid
from datetime import datetime, timezone
from time import perf_counter

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel
import requests
from dotenv import load_dotenv
from globalState import (
    consume_job_events,
    currentJob,
    init_job_events,
    job_results,
    publish_job_event,
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUTS_DIR = os.path.join(BASE_DIR, "outputs")
os.makedirs(OUTPUTS_DIR, exist_ok=True)
load_dotenv(dotenv_path=os.path.join(BASE_DIR, ".env"), override=True)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ExecuteRequest(BaseModel):
    user_data: str
    user_query: str


AGENT_BLUEPRINTS = [
    ("Manager Agent", "Coordinate all agent findings into a coherent strategy."),
    ("Data Collection Agent", "Extract and structure all relevant financial facts from the input."),
    ("Data Analyst Agent", "Analyze financial patterns, surplus, and optimization opportunities."),
    ("Debt Management Agent", "Recommend debt strategy, repayment order, and risk from liabilities."),
    ("Budget Optimization Agent", "Provide budget category optimization and cost-control actions."),
    ("Goal-Based Planning Agent", "Create timeline-driven plans for each financial goal."),
    ("Risk Advisor Agent", "Assess risk exposure and provide mitigation safeguards."),
    ("Trading Strategy Developer Agent", "Suggest practical strategy across selected asset classes."),
    ("Execution Agent", "Provide execution sequence and allocation implementation steps."),
    ("Crypto Investment Agent", "Give crypto-specific allocation and volatility controls."),
    ("Real Estate Investment Agent", "Evaluate real-estate suitability and capital planning."),
    ("Gold Investment Agent", "Assess role of gold/precious metals in portfolio protection."),
    ("Mutual Funds Agent", "Recommend fund/ETF style selection and allocation logic."),
    ("Fixed Income Agent", "Recommend fixed-income allocation for stability and liquidity."),
]


def _get_ollama_generate_config() -> tuple[str, str, str]:
    api_key = (os.getenv("OLLAMA_API_KEY") or "").strip()
    if not api_key:
        raise ValueError("Missing OLLAMA_API_KEY in environment/.env")

    model = (os.getenv("OLLAMA_MODEL") or "deepseek-v3.1:671b-cloud").strip()
    raw_base_url = (os.getenv("OLLAMA_BASE_URL") or "https://ollama.com/api").rstrip("/")
    base_url = raw_base_url if raw_base_url.endswith("/api") else f"{raw_base_url}/api"
    return api_key, model, base_url


def _call_ollama_generate(prompt: str) -> dict:
    api_key, model, base_url = _get_ollama_generate_config()
    headers = {"Authorization": f"Bearer {api_key}"}
    payload = {"model": model, "prompt": prompt, "stream": False}
    response = requests.post(f"{base_url}/generate", headers=headers, json=payload, timeout=120)
    response.raise_for_status()
    return {
        "model": model,
        "base_url": base_url,
        "raw": response.json(),
    }


def _build_agent_prompt(user_inputs: dict, agent_name: str, focus: str) -> str:
    return (
        f"You are acting as {agent_name}.\n"
        f"Focus: {focus}\n\n"
        f"User financial data:\n{user_inputs.get('user_data', '')}\n\n"
        f"User query:\n{user_inputs.get('user_query', '')}\n\n"
        "Write a clear, practical, and detailed analysis using markdown headings and bullets.\n"
        "Mandatory sections:\n"
        "1) Situation Snapshot (numbers extracted from input)\n"
        "2) Key Observations (at least 5)\n"
        "3) Strategy Options (at least 3 distinct strategies: conservative, balanced, aggressive)\n"
        "4) Detailed Recommendation (allocation/steps/timelines)\n"
        "5) Risks, assumptions, and mitigation\n"
        "6) Immediate action checklist (next 7 days)\n"
        "Be explicit with numbers, percentages, and rationale. Avoid generic advice.\n"
    )


def _build_synthesis_prompt(user_inputs: dict, agent_analyses: list[dict]) -> str:
    sections = []
    for analysis in agent_analyses:
        sections.append(f"{analysis['agent']}:\n{analysis['raw']}")
    joined_sections = "\n\n".join(sections)
    return (
        "You are the lead financial strategist. Merge the following agent-wise analyses into one final report.\n\n"
        f"User financial data:\n{user_inputs.get('user_data', '')}\n\n"
        f"User query:\n{user_inputs.get('user_query', '')}\n\n"
        f"Agent analyses:\n{joined_sections}\n\n"
        "Create a very clear, highly detailed report with explicit calculations and alternatives.\n"
        "Final report format (markdown):\n"
        "1) Executive Summary (5-8 crisp bullets)\n"
        "2) Financial Baseline Table (income/expenses/surplus/debt/goals)\n"
        "3) Agent-wise Findings (one subsection per agent with what each agent recommends)\n"
        "4) Multi-Strategy Plans:\n"
        "   - Strategy A: Conservative (low risk)\n"
        "   - Strategy B: Balanced (medium risk)\n"
        "   - Strategy C: Growth (higher risk)\n"
        "   For each strategy provide: monthly allocation %, INR split, expected return range, pros/cons.\n"
        "5) Goal-wise roadmap (each goal with monthly contribution and timeline feasibility)\n"
        "6) Debt & cashflow plan (if debt exists, prepayment vs regular schedule)\n"
        "7) Risk controls and contingency triggers\n"
        "8) 30/90/180-day action plan\n"
        "9) Monitoring KPIs (what to track monthly)\n"
        "Important: Include at least 3 actionable alternatives in major sections, and use concrete numbers.\n"
    )


def _extract_usage(raw_payload: dict) -> dict:
    return {
        "prompt_eval_count": raw_payload.get("prompt_eval_count"),
        "eval_count": raw_payload.get("eval_count"),
        "total_duration": raw_payload.get("total_duration"),
        "load_duration": raw_payload.get("load_duration"),
        "prompt_eval_duration": raw_payload.get("prompt_eval_duration"),
        "eval_duration": raw_payload.get("eval_duration"),
    }


def _to_int(value) -> int:
    return int(value) if isinstance(value, (int, float)) else 0


def _utc_timestamp_slug() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")


def _build_workflow_json(
    job_id: str,
    user_inputs: dict,
    report_timestamp: str,
    started_at: str,
    agent_runs: list[dict],
    final_payload: dict,
) -> dict:
    completed_at = datetime.now(timezone.utc).isoformat()
    started_dt = datetime.fromisoformat(started_at)
    completed_dt = datetime.fromisoformat(completed_at)
    duration_seconds = max((completed_dt - started_dt).total_seconds(), 0.0)
    final_raw = final_payload.get("raw", {})
    final_usage = _extract_usage(final_raw)

    total_prompt_tokens = _to_int(final_usage.get("prompt_eval_count"))
    total_completion_tokens = _to_int(final_usage.get("eval_count"))
    for run in agent_runs:
        usage = run.get("usage") or {}
        total_prompt_tokens += _to_int(usage.get("prompt_eval_count"))
        total_completion_tokens += _to_int(usage.get("eval_count"))

    return {
        "job_id": job_id,
        "report_timestamp": report_timestamp,
        "started_at": started_at,
        "completed_at": completed_at,
        "duration_seconds": round(duration_seconds, 3),
        "provider": "ollama_generate_multi_agent",
        "model": final_payload.get("model"),
        "base_url": final_payload.get("base_url"),
        "usage_totals": {
            "prompt_eval_count": total_prompt_tokens,
            "eval_count": total_completion_tokens,
        },
        "agent_runs": agent_runs,
        "final_synthesis_usage": final_usage,
        "input_stats": {
            "user_data_chars": len(user_inputs.get("user_data", "")),
            "user_query_chars": len(user_inputs.get("user_query", "")),
        },
        "raw_response": final_raw,
    }


def _complete_job(job_id: str, report_text: str, completion_message: str, workflow_json: dict) -> None:
    report_timestamp = _utc_timestamp_slug()
    workflow_json["report_timestamp"] = report_timestamp
    report_filename = f"report_{report_timestamp}_{job_id}.txt"
    analysis_filename = f"agent_analysis_{report_timestamp}_{job_id}.json"
    workflow_filename = f"workflow_{report_timestamp}_{job_id}.json"

    report_file_path = os.path.join(OUTPUTS_DIR, report_filename)
    analysis_file_path = os.path.join(OUTPUTS_DIR, analysis_filename)
    workflow_file_path = os.path.join(OUTPUTS_DIR, workflow_filename)

    with open(report_file_path, "w", encoding="utf-8") as report_file:
        report_file.write(report_text)

    with open(analysis_file_path, "w", encoding="utf-8") as analysis_file:
        json.dump(job_results[job_id]["result"], analysis_file, ensure_ascii=False, indent=2)

    with open(workflow_file_path, "w", encoding="utf-8") as workflow_file:
        json.dump(workflow_json, workflow_file, ensure_ascii=False, indent=2)

    job_results[job_id]["status"] = "completed"
    job_results[job_id]["file_path"] = report_file_path
    job_results[job_id]["final_report"] = report_text
    job_results[job_id]["report_timestamp"] = report_timestamp
    job_results[job_id]["output_files"] = {
        "report": report_file_path,
        "agent_analysis": analysis_file_path,
        "workflow_json": workflow_file_path,
    }
    job_results[job_id]["workflow_json"] = workflow_json
    job_results[job_id]["completed_at"] = workflow_json["completed_at"]

    publish_job_event(
        job_id,
        "completed",
        completion_message,
        status="completed",
        file_path=report_file_path,
        report_timestamp=report_timestamp,
        final_report=report_text,
        agent_analysis=job_results[job_id]["result"],
        workflow_json=workflow_json,
        output_files=job_results[job_id]["output_files"],
        result=job_results[job_id]["result"],
    )


def _fail_job(job_id: str, error_message: str) -> None:
    job_results[job_id]["status"] = "failed"
    job_results[job_id]["error"] = error_message
    job_results[job_id]["completed_at"] = datetime.now(timezone.utc).isoformat()
    publish_job_event(job_id, "job_error", error_message, status="failed", error=error_message)


def execute_crew_job(job_id: str, user_inputs: dict) -> None:
    """Run the primary analysis job using direct Ollama generate API."""
    try:
        publish_job_event(job_id, "log", f"Executing job {job_id} with direct Ollama generate API.")
        agent_runs: list[dict] = []
        for agent_name, focus in AGENT_BLUEPRINTS:
            publish_job_event(job_id, "log", f"Running {agent_name}")
            agent_started = perf_counter()
            payload = _call_ollama_generate(_build_agent_prompt(user_inputs, agent_name, focus))
            agent_duration = perf_counter() - agent_started
            agent_text = (payload["raw"].get("response") or "").strip()
            if not agent_text:
                raise RuntimeError(f"{agent_name} returned an empty response.")

            agent_message = {
                "name": agent_name,
                "description": focus,
                "summary": agent_text[:500],
                "expected_output": "Agent-specific analysis",
                "raw": agent_text,
                "json_dict": {"message": agent_text},
                "agent": agent_name,
            }
            job_results[job_id]["result"].append(agent_message)
            publish_job_event(job_id, "task_update", f"{agent_name} completed analysis.", task_output=agent_message)

            agent_runs.append(
                {
                    "agent": agent_name,
                    "focus": focus,
                    "duration_seconds": round(agent_duration, 3),
                    "response_chars": len(agent_text),
                    "usage": _extract_usage(payload["raw"]),
                }
            )

        synthesis_prompt = _build_synthesis_prompt(user_inputs, job_results[job_id]["result"])
        synthesis_payload = _call_ollama_generate(synthesis_prompt)
        report_text = (synthesis_payload["raw"].get("response") or "").strip()
        if not report_text:
            report_text = "\n\n".join(
                [f"## {item['name']}\n{item['raw']}" for item in job_results[job_id]["result"]]
            )

        workflow_json = _build_workflow_json(
            job_id=job_id,
            user_inputs=user_inputs,
            report_timestamp="pending",
            started_at=job_results[job_id]["started_at"],
            agent_runs=agent_runs,
            final_payload=synthesis_payload,
        )
        _complete_job(job_id, report_text, "Job completed successfully via direct multi-agent analysis.", workflow_json)
    except Exception as exc:
        _fail_job(job_id, str(exc))


@app.post("/api/execute")
async def execute_crew_script(request: ExecuteRequest):
    try:
        user_data = request.user_data
        user_query = request.user_query

        if not isinstance(user_data, str) or not isinstance(user_query, str):
            raise HTTPException(
                status_code=400,
                detail="Both user_data and user_query must be strings.",
            )
        if not user_data.strip() or not user_query.strip():
            raise HTTPException(
                status_code=400,
                detail="Both user_data and user_query must be non-empty strings.",
            )

        user_inputs = {"user_data": user_data, "user_query": user_query}

        job_id = str(uuid.uuid4())
        job_results[job_id] = {
            "status": "processing",
            "result": [],
            "error": None,
            "file_path": None,
            "final_report": None,
            "report_timestamp": None,
            "started_at": datetime.now(timezone.utc).isoformat(),
            "completed_at": None,
            "output_files": None,
            "workflow_json": None,
        }
        init_job_events(job_id)
        publish_job_event(job_id, "start", "Job started")
        currentJob["job_id"] = job_id

        thread = threading.Thread(target=execute_crew_job, args=(job_id, user_inputs), daemon=True)
        thread.start()

        return {"job_id": job_id, "message": "Job started successfully!"}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/api/stream/{job_id}")
async def stream_job_events(job_id: str, request: Request):
    if job_id not in job_results:
        raise HTTPException(status_code=404, detail="Job not found")

    async def event_generator():
        last_event_id = 0
        while True:
            if await request.is_disconnected():
                break

            events = consume_job_events(job_id, last_event_id)
            if events:
                for event in events:
                    last_event_id = event["id"]
                    yield f"id: {event['id']}\n"
                    yield f"event: {event['type']}\n"
                    yield f"data: {json.dumps(event)}\n\n"

            job_info = job_results.get(job_id, {})
            if job_info.get("status") in {"completed", "failed"} and not events:
                break

            yield ": keepalive\n\n"
            await asyncio.sleep(1)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@app.get("/api/download/{job_id}")
def download_job_result(job_id: str, artifact: str = "report"):
    if job_id not in job_results:
        raise HTTPException(status_code=404, detail="Job not found")

    job_info = job_results[job_id]
    if job_info["status"] != "completed":
        raise HTTPException(status_code=400, detail="Job is not yet completed")

    output_files = job_info.get("output_files") or {}
    if artifact == "report":
        file_path = output_files.get("report") or job_info.get("file_path")
        media_type = "text/plain"
    elif artifact == "agent_analysis":
        file_path = output_files.get("agent_analysis")
        media_type = "application/json"
    elif artifact == "workflow_json":
        file_path = output_files.get("workflow_json")
        media_type = "application/json"
    else:
        raise HTTPException(status_code=400, detail="Invalid artifact type")

    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(
        path=file_path,
        filename=os.path.basename(file_path),
        media_type=media_type,
    )


@app.get("/")
async def read_root():
    return {"message": "Welcome to the API!"}


@app.get("/api/generate/{prompt}")
def generate_with_ollama(prompt: str):
    """Direct LLM health/test endpoint using Ollama Cloud generate API."""
    try:
        data = _call_ollama_generate(prompt)
        return {
            "model": data["model"],
            "base_url": data["base_url"],
            "message": data["raw"].get("response", ""),
            "raw": data["raw"],
        }
    except ValueError as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    except requests.exceptions.RequestException as exc:
        raise HTTPException(status_code=500, detail=f"Ollama Request failed: {str(exc)}")

