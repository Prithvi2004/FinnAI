const DEFAULT_BACKEND_URL = "http://localhost:8000";

const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_BACKEND_API_URL;
  if (!envUrl) {
    return DEFAULT_BACKEND_URL;
  }
  return envUrl.replace(/\/+$/, "");
};

const API_BASE_URL = getApiBaseUrl();

export interface ExecuteResponse {
  message: string;
  job_id: string;
}

export interface AgentMessage {
  name: string;
  description: string;
  summary: string;
  expected_output: string;
  raw: string;
  json_dict?: { message?: string } | Record<string, unknown>;
  agent: string;
}

export interface JobLogEvent {
  id: number;
  type: string;
  message: string;
  timestamp: string;
  status?: string;
  error?: string;
  report_timestamp?: string;
  final_report?: string;
  result?: AgentMessage[];
  agent_analysis?: AgentMessage[];
  workflow_json?: Record<string, unknown>;
  output_files?: {
    report?: string;
    agent_analysis?: string;
    workflow_json?: string;
  };
  task_output?: AgentMessage | Record<string, unknown>;
  file_path?: string;
}

const getErrorMessage = async (response: Response): Promise<string> => {
  try {
    const body = await response.json();
    if (typeof body?.detail === "string") return body.detail;
    if (typeof body?.error === "string") return body.error;
  } catch {
    // Non-JSON error payload; fallback below.
  }
  return `${response.status} ${response.statusText}`.trim();
};

export const executeAnalysis = async (payload: {
  user_data: string;
  user_query: string;
}): Promise<ExecuteResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Failed to execute analysis: ${await getErrorMessage(response)}`);
  }

  return response.json() as Promise<ExecuteResponse>;
};

export const getDownloadUrl = (
  jobId: string,
  artifact: "report" | "agent_analysis" | "workflow_json" = "report",
): string => `${API_BASE_URL}/api/download/${jobId}?artifact=${artifact}`;
export const getStreamUrl = (jobId: string): string => `${API_BASE_URL}/api/stream/${jobId}`;

export { API_BASE_URL };
