import asyncio
import json
import mimetypes
import os
import re
import smtplib
import threading
import uuid
from datetime import datetime, timezone
from email.message import EmailMessage
from time import perf_counter
from typing import Optional

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
    recipient_email: Optional[str] = None


class TestEmailRequest(BaseModel):
    recipient_email: str
    subject: Optional[str] = None
    message: Optional[str] = None


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


CORE_AGENT_NAMES = {
    "Manager Agent",
    "Data Collection Agent",
    "Data Analyst Agent",
    "Budget Optimization Agent",
    "Goal-Based Planning Agent",
    "Risk Advisor Agent",
    "Execution Agent",
}

OPTIONAL_AGENT_KEYWORDS = {
    "Debt Management Agent": ("debt", "loan", "emi", "credit card", "liability"),
    "Trading Strategy Developer Agent": ("trading", "stocks", "equity", "swing", "intraday", "options"),
    "Crypto Investment Agent": ("crypto", "bitcoin", "btc", "eth", "ethereum", "altcoin"),
    "Real Estate Investment Agent": ("real estate", "property", "house", "home", "land", "rent yield"),
    "Gold Investment Agent": ("gold", "sgb", "precious metal"),
    "Mutual Funds Agent": ("mutual fund", "sip", "index fund", "etf", "fund"),
    "Fixed Income Agent": ("fixed income", "bond", "fd", "debt fund", "safe", "conservative"),
}


def _get_ollama_generate_config() -> tuple[str, str, str]:
    api_key = (os.getenv("OLLAMA_API_KEY") or "").strip()
    if not api_key:
        raise ValueError("Missing OLLAMA_API_KEY in environment/.env")

    model = (os.getenv("OLLAMA_MODEL") or "deepseek-v3.1:671b-cloud").strip()
    raw_base_url = (os.getenv("OLLAMA_BASE_URL") or "https://ollama.com/api").rstrip("/")
    base_url = raw_base_url if raw_base_url.endswith("/api") else f"{raw_base_url}/api"
    return api_key, model, base_url


def _call_ollama_generate(prompt: str, num_predict: Optional[int] = None, temperature: Optional[float] = 0.35) -> dict:
    api_key, model, base_url = _get_ollama_generate_config()
    timeout_seconds_raw = (os.getenv("OLLAMA_REQUEST_TIMEOUT_SECONDS") or "360").strip()
    try:
        timeout_seconds = max(60, int(timeout_seconds_raw))
    except ValueError:
        timeout_seconds = 360
    headers = {"Authorization": f"Bearer {api_key}"}
    payload: dict = {
        "model": model,
        "prompt": prompt,
        "stream": False,
    }
    options: dict = {}
    if num_predict is not None:
        options["num_predict"] = num_predict
    if temperature is not None:
        options["temperature"] = temperature
    if options:
        payload["options"] = options
    response = requests.post(
        f"{base_url}/generate",
        headers=headers,
        json=payload,
        timeout=timeout_seconds,
    )
    response.raise_for_status()
    return {
        "model": model,
        "base_url": base_url,
        "raw": response.json(),
    }


def _select_agent_blueprints(user_inputs: dict) -> tuple[list[tuple[str, str]], list[str]]:
    input_text = f"{user_inputs.get('user_data', '')}\n{user_inputs.get('user_query', '')}".lower()
    selected_names = set(CORE_AGENT_NAMES)

    for agent_name, keywords in OPTIONAL_AGENT_KEYWORDS.items():
        if any(keyword in input_text for keyword in keywords):
            selected_names.add(agent_name)

    selected_blueprints = [item for item in AGENT_BLUEPRINTS if item[0] in selected_names]
    skipped = [item[0] for item in AGENT_BLUEPRINTS if item[0] not in selected_names]
    return selected_blueprints, skipped


def _compact_agent_output(text: str, max_chars: int = 3500) -> str:
    cleaned = [line.strip() for line in text.splitlines() if line.strip()]
    priority_lines = []
    for line in cleaned:
        if (
            line.startswith("#")
            or line.startswith("-")
            or line.startswith("*")
            or line[:2].isdigit()
            or "₹" in line
            or "%" in line
        ):
            priority_lines.append(line)

    if not priority_lines:
        priority_lines = cleaned

    compact = "\n".join(priority_lines)
    return compact[:max_chars]


def _build_agent_prompt(user_inputs: dict, agent_name: str, focus: str) -> str:
    return (
        f"You are acting as {agent_name}.\n"
        f"Focus: {focus}\n\n"
        f"User financial data:\n{user_inputs.get('user_data', '')}\n\n"
        f"User query:\n{user_inputs.get('user_query', '')}\n\n"
        "Write an in-depth, practical analysis in markdown.\n"
        "Requirements:\n"
        "- Include explicit numbers, percentages, timelines, and assumptions.\n"
        "- Give concrete implementation details and alternatives.\n"
        "- Include relevant India-specific instrument examples where appropriate.\n"
        "Mandatory sections:\n"
        "1) Situation Snapshot (core extracted numbers)\n"
        "2) Key Observations (at least 6 bullets)\n"
        "3) Strategy Options (conservative/balanced/growth with full allocation logic)\n"
        "4) Recommended Plan (exact INR allocation and monthly actions)\n"
        "5) Risks & Mitigations (at least 5 bullets)\n"
        "6) Product/Fund examples and rationale (where relevant)\n"
    )


def _build_synthesis_prompt(user_inputs: dict, agent_analyses: list[dict]) -> str:
    sections = []
    for analysis in agent_analyses:
        compact_text = analysis.get("compact") or analysis.get("summary") or analysis.get("raw", "")
        sections.append(f"{analysis['agent']}:\n{compact_text}")
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
        "Output should be comprehensive, clear, and highly informative.\n"
        "Do not artificially shorten the report. Prefer depth over brevity while avoiding fluff.\n"
        "Also include:\n"
        "- Detailed asset-class rationale with implementation caveats\n"
        "- Goal-wise monthly contribution math and sensitivity (if return is 2% lower)\n"
        "- Named execution options (broker/platform/fund category examples)\n"
        "- Rebalancing triggers with concrete thresholds\n"
    )


def _extract_first_amount(text: str, patterns: list[str]) -> Optional[float]:
    for pattern in patterns:
        match = re.search(pattern, text, flags=re.IGNORECASE)
        if match:
            value = match.group(1).replace(",", "").strip()
            try:
                return float(value)
            except ValueError:
                continue
    return None


def _extract_financial_baseline(user_inputs: dict) -> dict:
    source = (user_inputs.get("user_data") or "") + "\n" + (user_inputs.get("user_query") or "")
    income = _extract_first_amount(
        source,
        [
            r"(?:monthly\s+)?income[^0-9]{0,20}([0-9][0-9,]*(?:\.[0-9]+)?)",
            r"salary[^0-9]{0,20}([0-9][0-9,]*(?:\.[0-9]+)?)",
        ],
    )
    expenses = _extract_first_amount(
        source,
        [
            r"(?:monthly\s+)?expenses?[^0-9]{0,20}([0-9][0-9,]*(?:\.[0-9]+)?)",
            r"spend(?:ing)?[^0-9]{0,20}([0-9][0-9,]*(?:\.[0-9]+)?)",
        ],
    )
    surplus = income - expenses if income is not None and expenses is not None else None
    return {
        "income": income,
        "expenses": expenses,
        "computed_surplus": surplus,
    }


def _safe_parse_json_object(raw_text: str) -> Optional[dict]:
    cleaned = raw_text.strip()
    if not cleaned:
        return None
    try:
        data = json.loads(cleaned)
        return data if isinstance(data, dict) else None
    except json.JSONDecodeError:
        pass

    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start >= 0 and end > start:
        snippet = cleaned[start : end + 1]
        try:
            data = json.loads(snippet)
            return data if isinstance(data, dict) else None
        except json.JSONDecodeError:
            return None
    return None


def _run_fact_check_pass(user_inputs: dict, report_text: str, agent_analyses: list[dict]) -> tuple[dict, dict]:
    compact_analyses = "\n\n".join(
        [
            f"{item.get('agent', 'Agent')}:\n{item.get('compact') or item.get('summary') or ''}"
            for item in agent_analyses
        ]
    )
    prompt = (
        "You are pass-1 validator for a financial planning report.\n"
        "Task: fact-check report claims ONLY against provided user input and agent notes.\n"
        "If any factual mismatch exists, provide corrected report text.\n"
        "Respond in strict JSON with keys:\n"
        "{\n"
        '  "pass": "fact_check",\n'
        '  "status": "ok" | "needs_revision",\n'
        '  "issues": ["..."],\n'
        '  "corrected_report": "full corrected markdown report or empty if status ok"\n'
        "}\n\n"
        f"User Input:\n{user_inputs.get('user_data', '')}\n\n"
        f"User Query:\n{user_inputs.get('user_query', '')}\n\n"
        f"Agent Notes:\n{compact_analyses}\n\n"
        f"Report To Validate:\n{report_text}\n"
    )
    payload = _call_ollama_generate(prompt, num_predict=None, temperature=0.1)
    parsed = _safe_parse_json_object(payload["raw"].get("response", "")) or {
        "pass": "fact_check",
        "status": "ok",
        "issues": ["Validator returned non-JSON output; original report retained."],
        "corrected_report": "",
    }
    return parsed, payload


def _run_arithmetic_consistency_pass(user_inputs: dict, report_text: str) -> tuple[dict, dict]:
    baseline = _extract_financial_baseline(user_inputs)
    baseline_text = json.dumps(baseline, ensure_ascii=False)
    prompt = (
        "You are pass-2 validator for arithmetic consistency in a financial plan.\n"
        "Recompute all numeric relationships and monthly allocations in the report.\n"
        "Check: income-expense-surplus consistency, goal monthly requirements, allocation totals.\n"
        "Use baseline values when present; if baseline value is null, skip that check.\n"
        "Respond in strict JSON with keys:\n"
        "{\n"
        '  "pass": "arithmetic_consistency",\n'
        '  "status": "ok" | "needs_revision",\n'
        '  "issues": ["..."],\n'
        '  "computed_checks": {"surplus_check":"...","allocation_check":"...","goal_check":"..."},\n'
        '  "corrected_report": "full corrected markdown report or empty if status ok"\n'
        "}\n\n"
        f"Extracted Baseline JSON:\n{baseline_text}\n\n"
        f"User Input:\n{user_inputs.get('user_data', '')}\n\n"
        f"Report To Validate:\n{report_text}\n"
    )
    payload = _call_ollama_generate(prompt, num_predict=None, temperature=0.05)
    parsed = _safe_parse_json_object(payload["raw"].get("response", "")) or {
        "pass": "arithmetic_consistency",
        "status": "ok",
        "issues": ["Validator returned non-JSON output; original report retained."],
        "computed_checks": {},
        "corrected_report": "",
    }
    return parsed, payload


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
    skipped_agents: list[str],
    validator_passes: list[dict],
    validator_usage: list[dict],
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
    for usage in validator_usage:
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
        "selected_agents_count": len(agent_runs),
        "skipped_agents": skipped_agents,
        "validator_passes": validator_passes,
        "validator_usage": validator_usage,
        "final_synthesis_usage": final_usage,
        "input_stats": {
            "user_data_chars": len(user_inputs.get("user_data", "")),
            "user_query_chars": len(user_inputs.get("user_query", "")),
        },
        "raw_response": final_raw,
    }


def _get_smtp_config() -> dict:
    smtp_host = (os.getenv("SMTP_HOST") or "").strip()
    smtp_port_raw = (os.getenv("SMTP_PORT") or "587").strip()
    smtp_user = (os.getenv("SMTP_USER") or "").strip()
    smtp_password = (os.getenv("SMTP_PASSWORD") or "").strip()
    smtp_from = (os.getenv("SMTP_FROM") or smtp_user).strip()
    smtp_use_tls = (os.getenv("SMTP_USE_TLS") or "true").strip().lower() in {"1", "true", "yes", "on"}
    smtp_use_ssl = (os.getenv("SMTP_USE_SSL") or "false").strip().lower() in {"1", "true", "yes", "on"}

    if not smtp_host:
        raise ValueError("Missing SMTP_HOST in environment/.env")
    if not smtp_from:
        raise ValueError("Missing SMTP_FROM (or SMTP_USER) in environment/.env")

    try:
        smtp_port = int(smtp_port_raw)
    except ValueError as exc:
        raise ValueError("SMTP_PORT must be a valid integer") from exc

    return {
        "host": smtp_host,
        "port": smtp_port,
        "user": smtp_user,
        "password": smtp_password,
        "from": smtp_from,
        "use_tls": smtp_use_tls,
        "use_ssl": smtp_use_ssl,
    }


def _normalize_smtp_password(raw_password: str, smtp_host: str) -> str:
    # Gmail app passwords are often copied with spaces; auth expects contiguous chars.
    if "gmail.com" in smtp_host.lower():
        return raw_password.replace(" ", "")
    return raw_password


def _send_smtp_message(email_message: EmailMessage) -> dict:
    smtp_cfg = _get_smtp_config()
    stage = "connect"
    try:
        if smtp_cfg["use_ssl"]:
            with smtplib.SMTP_SSL(smtp_cfg["host"], smtp_cfg["port"], timeout=45) as smtp_client:
                stage = "login"
                if smtp_cfg["user"]:
                    smtp_client.login(
                        smtp_cfg["user"],
                        _normalize_smtp_password(smtp_cfg["password"], smtp_cfg["host"]),
                    )
                stage = "send"
                smtp_client.send_message(email_message)
        else:
            with smtplib.SMTP(smtp_cfg["host"], smtp_cfg["port"], timeout=45) as smtp_client:
                stage = "ehlo"
                smtp_client.ehlo()
                if smtp_cfg["use_tls"]:
                    stage = "starttls"
                    smtp_client.starttls()
                    smtp_client.ehlo()
                stage = "login"
                if smtp_cfg["user"]:
                    smtp_client.login(
                        smtp_cfg["user"],
                        _normalize_smtp_password(smtp_cfg["password"], smtp_cfg["host"]),
                    )
                stage = "send"
                smtp_client.send_message(email_message)
    except Exception as exc:
        raise RuntimeError(f"SMTP failure at stage '{stage}': {type(exc).__name__}: {str(exc)}") from exc

    return {
        "smtp_host": smtp_cfg["host"],
        "smtp_port": smtp_cfg["port"],
        "smtp_use_tls": smtp_cfg["use_tls"],
        "smtp_use_ssl": smtp_cfg["use_ssl"],
        "smtp_from": smtp_cfg["from"],
    }


def _send_report_email(
    recipient_email: str,
    report_timestamp: str,
    output_files: dict,
    user_query: str,
) -> None:
    smtp_cfg = _get_smtp_config()

    message = EmailMessage()
    message["Subject"] = f"FinnAI Report Ready - {report_timestamp}"
    message["From"] = smtp_cfg["from"]
    message["To"] = recipient_email
    message.set_content(
        "Your FinnAI report is ready.\n\n"
        f"Timestamp: {report_timestamp}\n"
        f"Query: {user_query}\n\n"
        "Attached files:\n"
        "- Final report (.txt)\n"
        "- Agent-wise analysis (.json)\n"
        "- Workflow metrics (.json)\n"
    )

    attachments = [
        output_files.get("report"),
        output_files.get("agent_analysis"),
        output_files.get("workflow_json"),
    ]
    for file_path in attachments:
        if not file_path or not os.path.exists(file_path):
            continue

        guessed_type, _ = mimetypes.guess_type(file_path)
        content_type = guessed_type or "application/octet-stream"
        maintype, subtype = content_type.split("/", 1)
        with open(file_path, "rb") as file_obj:
            message.add_attachment(
                file_obj.read(),
                maintype=maintype,
                subtype=subtype,
                filename=os.path.basename(file_path),
            )

    _send_smtp_message(message)


def _send_test_email(recipient_email: str, subject: Optional[str], message: Optional[str]) -> dict:
    smtp_cfg = _get_smtp_config()
    timestamp = datetime.now(timezone.utc).isoformat()

    email_message = EmailMessage()
    email_message["Subject"] = subject or f"FinnAI SMTP Test - {timestamp}"
    email_message["From"] = smtp_cfg["from"]
    email_message["To"] = recipient_email
    email_message.set_content(
        message
        or (
            "This is a FinnAI SMTP test email.\n\n"
            f"Timestamp (UTC): {timestamp}\n"
            "If you received this, mail functionality is working."
        )
    )

    diagnostic = _send_smtp_message(email_message)
    diagnostic["timestamp"] = timestamp
    return diagnostic


def _complete_job(job_id: str, report_text: str, completion_message: str, workflow_json: dict) -> None:
    report_timestamp = _utc_timestamp_slug()
    workflow_json["report_timestamp"] = report_timestamp
    run_folder_name = f"run_{report_timestamp}_{job_id}"
    run_folder_path = os.path.join(OUTPUTS_DIR, run_folder_name)
    os.makedirs(run_folder_path, exist_ok=True)

    report_filename = f"report_{report_timestamp}.txt"
    analysis_filename = f"agent_analysis_{report_timestamp}.json"
    workflow_filename = f"workflow_{report_timestamp}.json"

    report_file_path = os.path.join(run_folder_path, report_filename)
    analysis_file_path = os.path.join(run_folder_path, analysis_filename)
    workflow_file_path = os.path.join(run_folder_path, workflow_filename)

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
    job_results[job_id]["output_dir"] = run_folder_path
    job_results[job_id]["output_files"] = {
        "report": report_file_path,
        "agent_analysis": analysis_file_path,
        "workflow_json": workflow_file_path,
    }
    job_results[job_id]["workflow_json"] = workflow_json
    job_results[job_id]["completed_at"] = workflow_json["completed_at"]
    recipient_email = job_results[job_id].get("recipient_email")
    job_results[job_id]["email_status"] = "not_requested"
    job_results[job_id]["email_error"] = None
    if recipient_email:
        publish_job_event(job_id, "log", f"Sending report email to {recipient_email} ...")
        try:
            _send_report_email(
                recipient_email=recipient_email,
                report_timestamp=report_timestamp,
                output_files=job_results[job_id]["output_files"],
                user_query=job_results[job_id].get("user_query", ""),
            )
            job_results[job_id]["email_status"] = "sent"
            publish_job_event(job_id, "log", f"Report email sent to {recipient_email}.")
        except Exception as exc:
            job_results[job_id]["email_status"] = "failed"
            job_results[job_id]["email_error"] = str(exc)
            publish_job_event(job_id, "log", f"Report email failed: {str(exc)}")

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
        email_status=job_results[job_id].get("email_status"),
        email_recipient=recipient_email,
        email_error=job_results[job_id].get("email_error"),
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
        selected_blueprints, skipped_agents = _select_agent_blueprints(user_inputs)
        selected_names = [name for name, _ in selected_blueprints]
        publish_job_event(
            job_id,
            "log",
            f"Selected {len(selected_names)} agents for this request: {', '.join(selected_names)}",
        )

        for agent_name, focus in selected_blueprints:
            publish_job_event(job_id, "log", f"Running {agent_name}")
            agent_started = perf_counter()
            payload = _call_ollama_generate(
                _build_agent_prompt(user_inputs, agent_name, focus),
                num_predict=None,
                temperature=0.3,
            )
            agent_duration = perf_counter() - agent_started
            agent_text = (payload["raw"].get("response") or "").strip()
            if not agent_text:
                raise RuntimeError(f"{agent_name} returned an empty response.")
            compact_agent_text = _compact_agent_output(agent_text)

            agent_message = {
                "name": agent_name,
                "description": focus,
                "summary": compact_agent_text[:1400],
                "expected_output": "Agent-specific analysis",
                "raw": agent_text,
                "compact": compact_agent_text,
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
        synthesis_payload = _call_ollama_generate(synthesis_prompt, num_predict=None, temperature=0.22)
        report_text = (synthesis_payload["raw"].get("response") or "").strip()
        if not report_text:
            report_text = "\n\n".join(
                [f"## {item['name']}\n{item['raw']}" for item in job_results[job_id]["result"]]
            )

        publish_job_event(job_id, "log", "Running pass-1 validator: fact-check.")
        fact_pass, fact_payload = _run_fact_check_pass(user_inputs, report_text, job_results[job_id]["result"])
        if fact_pass.get("status") == "needs_revision" and fact_pass.get("corrected_report"):
            report_text = str(fact_pass.get("corrected_report"))
            publish_job_event(job_id, "log", "Fact-check validator revised the report.")
        else:
            publish_job_event(job_id, "log", "Fact-check validator passed.")

        publish_job_event(job_id, "log", "Running pass-2 validator: arithmetic consistency.")
        arithmetic_pass, arithmetic_payload = _run_arithmetic_consistency_pass(user_inputs, report_text)
        if arithmetic_pass.get("status") == "needs_revision" and arithmetic_pass.get("corrected_report"):
            report_text = str(arithmetic_pass.get("corrected_report"))
            publish_job_event(job_id, "log", "Arithmetic validator revised the report.")
        else:
            publish_job_event(job_id, "log", "Arithmetic validator passed.")

        workflow_json = _build_workflow_json(
            job_id=job_id,
            user_inputs=user_inputs,
            report_timestamp="pending",
            started_at=job_results[job_id]["started_at"],
            agent_runs=agent_runs,
            final_payload=synthesis_payload,
            skipped_agents=skipped_agents,
            validator_passes=[fact_pass, arithmetic_pass],
            validator_usage=[_extract_usage(fact_payload["raw"]), _extract_usage(arithmetic_payload["raw"])],
        )
        _complete_job(job_id, report_text, "Job completed successfully via direct multi-agent analysis.", workflow_json)
    except Exception as exc:
        _fail_job(job_id, str(exc))


@app.post("/api/execute")
async def execute_crew_script(request: ExecuteRequest):
    try:
        user_data = request.user_data
        user_query = request.user_query
        recipient_email = (request.recipient_email or "").strip() or None

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
        if recipient_email and "@" not in recipient_email:
            raise HTTPException(status_code=400, detail="recipient_email must be a valid email address.")

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
            "recipient_email": recipient_email,
            "email_status": "pending" if recipient_email else "not_requested",
            "email_error": None,
            "user_query": user_query,
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
        last_event_id_raw = request.query_params.get("last_event_id")
        if last_event_id_raw:
            try:
                last_event_id = max(0, int(last_event_id_raw))
            except ValueError:
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


@app.post("/api/test-email")
def test_email_endpoint(request: TestEmailRequest):
    recipient_email = (request.recipient_email or "").strip()
    if "@" not in recipient_email:
        raise HTTPException(status_code=400, detail="recipient_email must be a valid email address.")
    try:
        diagnostic = _send_test_email(
            recipient_email=recipient_email,
            subject=(request.subject or "").strip() or None,
            message=(request.message or "").strip() or None,
        )
        return {
            "status": "sent",
            "recipient_email": recipient_email,
            "diagnostic": diagnostic,
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Email test failed: {str(exc)}")


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

