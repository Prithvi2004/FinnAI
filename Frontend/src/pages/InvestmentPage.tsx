import { useState, useRef, useEffect } from "react";
import {
  Send,
  Loader2,
  Bot,
  BrainCircuit,
  Terminal,
  Eye,
  EyeOff,
  ChevronRight,
  CheckCircle2,
  Clock,
  FileText,
  BarChart3,
  ArrowLeft,
} from "lucide-react";
import { Link } from "react-router-dom";
import { FinnAILogo } from "../components/FinnAILogo";
import { FinancialAgents } from "../components/FinancialAgents";
import { useFinancialContext } from "../contexts/FinancialContext";
import { motion, AnimatePresence } from "framer-motion";

interface ApiResponse {
  message: string;
  job_id: string;
}
interface AgentMessage {
  name: string;
  description: string;
  summary: string;
  expected_output: string;
  raw: string;
  json_dict?: any;
  agent: string;
}
interface JobStatusResponse {
  status: string;
  result: AgentMessage[];
}

export function InvestmentPage() {
  const [userData, setUserData] = useState("");
  const [userQuery, setUserQuery] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { summaryStatement } = useFinancialContext();
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string>("idle");
  const [agentMessages, setAgentMessages] = useState<AgentMessage[]>([]);
  const [lastMessageCount, setLastMessageCount] = useState(0);
  const conversationRef = useRef<HTMLDivElement>(null);

  // UI toggles
  const [showTerminal, setShowTerminal] = useState(true);

  const isComplete = jobStatus === "completed";

  useEffect(() => {
    if (summaryStatement) setUserData(summaryStatement);
  }, [summaryStatement]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (jobId) {
      fetchJobStatus();
      intervalId = setInterval(fetchJobStatus, 2000);
    }
    return () => { if (intervalId) clearInterval(intervalId); };
  }, [jobId]);

  useEffect(() => {
    if (agentMessages && agentMessages.length > lastMessageCount && conversationRef.current) {
      conversationRef.current.scrollTop = conversationRef.current.scrollHeight;
      setLastMessageCount(agentMessages.length);
    }
  }, [agentMessages, lastMessageCount]);

  const fetchJobStatus = async () => {
    if (!jobId) return;
    try {
      const res = await fetch(`http://localhost:8000/api/${jobId}`);
      if (!res.ok) throw new Error("Failed to fetch job status");
      const data: JobStatusResponse = await res.json();
      setJobStatus(data.status);
      setAgentMessages(data.result || []);
      if (data.status === "completed" && data.result.length > 0) {
        const lastMessage = data.result[data.result.length - 1];
        if (lastMessage.json_dict?.message) {
          setResponse(lastMessage.json_dict.message);
        } else if (lastMessage.raw) {
          try {
            const rawJson = JSON.parse(lastMessage.raw);
            setResponse(rawJson.message || "Processing complete");
          } catch { setResponse(lastMessage.raw); }
        }
        setLoading(false);
      }
    } catch (err) {
      console.error("Error fetching job status:", err);
    }
  };

  const handleSubmit = async () => {
    if (!userData || !userQuery) { setError("Both user data and query are required"); return; }
    setLoading(true);
    setError(null);
    setResponse(null);
    setJobId(null);
    setJobStatus("idle");
    setAgentMessages([]);
    setLastMessageCount(0);
    setShowTerminal(true); // auto-open terminal on submit
    try {
      const res = await fetch("http://localhost:8000/api/execute/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_data: userData, user_query: userQuery }),
      });
      if (!res.ok) throw new Error("Failed to execute query");
      const data: ApiResponse = await res.json();
      setJobId(data.job_id);
      setResponse(data.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setLoading(false);
    }
  };

  const formatAgentMessage = (message: AgentMessage) => {
    if (message.json_dict?.message) return message.json_dict.message;
    if (message.raw) {
      try {
        const rawJson = JSON.parse(message.raw);
        return rawJson.message || message.summary;
      } catch { return message.summary; }
    }
    return message.summary;
  };

  return (
    <div className="min-h-screen bg-charcoal-950 text-warmGrey-100 flex flex-col relative">
      <div className="particles-bg absolute inset-0 z-0" />

      {/* ── Tiny Navbar ── */}
      <nav className="sticky top-0 z-50 w-full bg-charcoal-950/80 backdrop-blur-xl border-b border-charcoal-800/40 shrink-0">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-12 flex items-center justify-between">
          {/* Back to Home */}
          <Link
            to="/"
            className="flex items-center gap-1.5 text-warmGrey-400 hover:text-bronze transition-colors group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-xs font-medium">Home</span>
          </Link>

          {/* Brand + breadcrumb */}
          <div className="flex items-center gap-2 text-[11px] font-mono text-warmGrey-600 tracking-widest">
            <FinnAILogo size={22} />
            <span className="text-bronze font-semibold tracking-wide text-xs">Finn<span className="text-warmGrey-300">AI</span></span>
            <span>/</span>
            <span>INVEST</span>
            <span>/</span>
            <span>WORKSPACE</span>
          </div>

          {/* Status pill */}
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${
              loading ? "bg-green-400 animate-pulse" : isComplete ? "bg-bronze" : "bg-charcoal-700"
            }`} />
            <span className="text-[10px] font-mono text-warmGrey-600">
              {loading ? "Running" : isComplete ? "Done" : "Idle"}
            </span>
          </div>
        </div>
      </nav>

      {/* ── Main Workspace ── */}
      <div className="relative z-10 w-full max-w-[1400px] mx-auto px-4 sm:px-6 py-8 md:py-10 flex flex-col gap-6 md:gap-8">

        {/* ── ROW 1: Agent Network + Input Controls ── */}
        <div className="flex flex-col md:flex-row gap-6 md:gap-8">

          {/* Left – Agent Network */}
          <div className="w-full md:w-[40%]">
            <div className="h-[420px] md:h-[520px] bg-charcoal-900/40 rounded-2xl p-5 md:p-6 backdrop-blur-md border border-charcoal-800/50 flex flex-col shadow-lg">
              <div className="flex items-center space-x-2 mb-3 pb-3 border-b border-charcoal-800/60">
                <BrainCircuit className="w-5 h-5 text-bronze" />
                <h2 className="text-base md:text-lg font-serif text-warmGrey-100">AI Agent Network</h2>
              </div>
              <div className="flex-1 overflow-hidden min-h-0">
                <FinancialAgents />
              </div>
            </div>
          </div>

          {/* Right – Input Controls */}
          <div className="w-full md:w-[60%] flex flex-col gap-4">
            {/* Financial Data */}
            <div
              data-lenis-prevent="true"
              className="relative flex flex-col rounded-xl border border-charcoal-800/50 bg-charcoal-900/50 backdrop-blur-sm"
              style={{ resize: "vertical", overflow: "hidden", minHeight: "200px", height: "280px" }}
            >
              <div className="flex items-center gap-2 px-4 pt-3 pb-1 border-b border-charcoal-800/30">
                <BarChart3 className="w-3.5 h-3.5 text-bronze/70" />
                <span className="text-[10px] font-mono text-warmGrey-500 tracking-widest uppercase">Financial Data</span>
              </div>
              <textarea
                value={userData || ""}
                onChange={(e) => setUserData(e.target.value)}
                onWheel={(e) => e.stopPropagation()}
                placeholder="Paste your financial data here..."
                className="flex-1 w-full bg-transparent px-4 py-2 focus:outline-none font-mono text-xs md:text-sm resize-none overflow-y-scroll custom-scrollbar text-warmGrey-100 placeholder:text-warmGrey-600"
              />
            </div>

            {/* Your Query */}
            <div
              data-lenis-prevent="true"
              className="relative flex flex-col rounded-xl border border-charcoal-800/50 bg-charcoal-900/80 shadow-lg"
              style={{ resize: "vertical", overflow: "hidden", minHeight: "130px", height: "160px" }}
            >
              <div className="flex items-center gap-2 px-4 pt-3 pb-1 border-b border-charcoal-800/30">
                <Bot className="w-3.5 h-3.5 text-bronze/70" />
                <span className="text-[10px] font-mono text-warmGrey-500 tracking-widest uppercase">Your Query</span>
              </div>
              <textarea
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                onWheel={(e) => e.stopPropagation()}
                placeholder="What would you like to analyse?"
                className="flex-1 w-full bg-transparent px-4 py-2 focus:outline-none font-mono text-xs md:text-sm resize-none overflow-y-scroll custom-scrollbar text-warmGrey-100 placeholder:text-warmGrey-600"
              />
            </div>

            {/* Run Button */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl bg-bronze text-charcoal-950 font-bold text-sm tracking-wide transition-all shadow-lg shadow-bronze/20 hover:shadow-bronze/40 hover:-translate-y-0.5 hover:bg-bronze-light disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 group"
            >
              {loading
                ? <><Loader2 className="w-5 h-5 animate-spin text-charcoal-900" /><span>Running Analysis...</span></>
                : <><Send className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" /><span>Run Analysis</span></>
              }
            </button>

            {/* Error */}
            {error && (
              <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 font-mono">
                ⚠ {error}
              </div>
            )}
          </div>
        </div>

        {/* ── ROW 2: Monitor Control Bar ── */}
        <div className="flex items-center justify-between px-5 py-3 rounded-2xl bg-charcoal-900/70 border border-charcoal-800/50 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className={`w-2 h-2 rounded-full ${loading ? "bg-green-400 animate-pulse" : isComplete ? "bg-bronze" : "bg-charcoal-700"}`} />
            <span className="text-xs font-mono text-warmGrey-400 tracking-wide">
              {loading ? "Analysis running — monitoring logs in real-time..." : isComplete ? "Analysis complete" : "Monitor analysis logs in real-time"}
            </span>
          </div>
          <button
            onClick={() => setShowTerminal((v) => !v)}
            className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all duration-200
              ${showTerminal
                ? "bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20"
                : "bg-charcoal-800/50 border-charcoal-700 text-warmGrey-400 hover:border-bronze hover:text-bronze"
              }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            {showTerminal ? <><EyeOff className="w-3 h-3" /> Hide Terminal</> : <><Eye className="w-3 h-3" /> Show Terminal</>}
          </button>
        </div>

        {/* ── ROW 3: Terminal (collapsible) ── */}
        <AnimatePresence initial={false}>
          {showTerminal && (
            <motion.div
              key="terminal"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="h-[400px] md:h-[480px] bg-[#050505] rounded-2xl border border-charcoal-700/80 shadow-[0_0_40px_rgba(0,0,0,0.5),inset_0_0_40px_rgba(0,0,0,0.8)] flex flex-col font-sans overflow-hidden relative">
                {/* CRT Scanline FX */}
                <div className="absolute inset-0 pointer-events-none z-10 opacity-70 mix-blend-overlay" style={{
                  background: "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))",
                  backgroundSize: "100% 2px, 3px 100%"
                }} />

                {/* Terminal Header */}
                <div className="h-10 bg-[#121214]/95 flex items-center px-4 shrink-0 border-b border-white/10 relative z-20">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e] shadow-[0_0_5px_rgba(255,95,86,0.4)]" />
                    <div className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123] shadow-[0_0_5px_rgba(255,189,46,0.4)]" />
                    <div className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29] shadow-[0_0_5px_rgba(39,201,63,0.4)]" />
                  </div>
                  <div className="flex-1 text-center text-[11px] text-warmGrey-500 font-mono tracking-wide flex items-center justify-center space-x-2 opacity-80">
                    <Terminal className="w-3.5 h-3.5" />
                    <span>user@finn-ai: ~/workspace/fin-analysis (ssh)</span>
                  </div>
                </div>
                {/* Terminal Body */}
                <div ref={conversationRef} className="flex-1 p-5 overflow-y-auto font-mono text-[13px] custom-scrollbar relative z-20">
                  {loading ? (
                    jobId ? (
                      <div className="space-y-4">
                        <div className="text-green-400 flex items-center gap-2 mb-4" style={{ textShadow: "0 0 8px rgba(74,222,128,0.4)" }}>
                          <span>{jobStatus === "processing" ? "$ executing multi-agent routing..." : "$ initializing..."}</span>
                          <div className="w-2 h-3.5 bg-green-500 animate-pulse" />
                        </div>
                        {agentMessages && agentMessages.length > 0 ? (
                          agentMessages.map((msg, i) => (
                            <div key={i} className="animate-slideUp" style={{ animationDelay: `${i * 0.08}s` }}>
                              <div className="flex items-center gap-2 text-cyan-400 text-[11px] tracking-wide" style={{ textShadow: "0 0 8px rgba(34,211,238,0.4)" }}>
                                <span>[{new Date().toLocaleTimeString()}]</span>
                                <span className="font-bold text-amber-300" style={{ textShadow: "0 0 8px rgba(252,211,77,0.4)" }}>{msg.name || msg.agent}</span>
                                {msg.description && <span className="opacity-70 text-warmGrey-400">— {msg.description}</span>}
                              </div>
                              <div className="pl-3 border-l-2 border-charcoal-700/60 py-1 text-green-400/90 whitespace-pre-wrap mt-1 leading-relaxed" style={{ textShadow: "0 0 8px rgba(74,222,128,0.3)" }}>
                                &gt; {formatAgentMessage(msg)}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-warmGrey-400 flex gap-2 font-medium"><span>$ orchestrator waiting on socket_accept</span><span className="animate-pulse text-cyan-400">...</span></div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 text-cyan-400" style={{ textShadow: "0 0 8px rgba(34,211,238,0.4)" }}>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>$ establishing secure 256-bit connection to mainframe...</span>
                      </div>
                    )
                  ) : isComplete ? (
                    <div className="text-green-400" style={{ textShadow: "0 0 8px rgba(74,222,128,0.4)" }}>
                      <div className="text-cyan-400 mb-2" style={{ textShadow: "0 0 8px rgba(34,211,238,0.4)" }}>$ execution sequence complete. SIGTERM received.</div>
                      <div className="text-warmGrey-500 flex items-center gap-2 mt-4">
                        <span className="text-cyan-400 font-bold">user@finn-ai:~$</span>
                        <div className="w-2 h-4 bg-warmGrey-500 animate-pulse" />
                      </div>
                    </div>
                  ) : (
                    <div className="text-green-500/80 space-y-1" style={{ textShadow: "0 0 8px rgba(74,222,128,0.3)" }}>
                      <div>FinnAI Cognitive Core v2.4.1 initialized.</div>
                      <div>Kernel: x86_64-ai-darwin, Data Node: Active</div>
                      <div className="opacity-60">* System strictly firewalled. Data ingestion threaded.</div>
                      <div className="mt-4 flex items-center gap-2">
                        <span className="text-cyan-400 font-bold opacity-90" style={{ textShadow: "0 0 8px rgba(34,211,238,0.4)" }}>user@finn-ai:~$</span>
                        <div className="w-2 h-4 bg-cyan-400/80 animate-pulse" shadow-cyan-400="true" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── ROW 4: Results Cards (vertical) ── */}
        <div className="flex flex-col gap-4 md:gap-6 pb-10">

          {/* Agent Wise Analysis */}
          <div className={`flex-1 rounded-2xl border backdrop-blur-md overflow-hidden transition-all duration-500
            ${isComplete ? "border-bronze/30 bg-charcoal-900/60" : "border-charcoal-800/40 bg-charcoal-900/20"}`}>
            {/* Card Header */}
            <div className={`flex items-center justify-between px-4 py-3 border-b transition-colors duration-500
              ${isComplete ? "border-bronze/20" : "border-charcoal-800/30"}`}>
              <div className="flex items-center gap-2.5">
                <BarChart3 className={`w-4 h-4 transition-colors duration-500 ${isComplete ? "text-bronze" : "text-charcoal-600"}`} />
                <span className={`text-sm font-serif transition-colors duration-500 ${isComplete ? "text-warmGrey-100" : "text-charcoal-600"}`}>
                  Agent Wise Analysis
                </span>
              </div>
              <div className={`flex items-center gap-1.5 text-[10px] sm:text-xs font-mono px-3 py-1.5 rounded-full border transition-all duration-500 shadow-sm
                ${isComplete
                  ? "text-green-400 bg-green-400/10 border-green-400/30 shadow-green-500/10"
                  : loading
                  ? "text-amber-400 bg-amber-400/10 border-amber-400/40 shadow-amber-500/20"
                  : "text-warmGrey-400 bg-charcoal-700/50 border-charcoal-600/50"}`}>
                {isComplete ? <CheckCircle2 className="w-3.5 h-3.5" /> : loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Clock className="w-3.5 h-3.5" />}
                {isComplete ? "Completed" : loading ? "Processing..." : "Waiting to Execute"}
              </div>
            </div>
            {/* Card Body */}
            <div className="px-5 py-4 min-h-[120px] overflow-y-auto custom-scrollbar">
              {isComplete && agentMessages.length > 0 ? (
                <div className="space-y-3">
                  {agentMessages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex gap-3"
                    >
                      <div className="mt-1 w-2 h-2 rounded-full bg-bronze/60 shrink-0" />
                      <div>
                        <div className="text-[11px] font-bold text-bronze/80 mb-0.5">{msg.name || msg.agent}</div>
                        <div className="text-xs text-warmGrey-400 leading-relaxed">{formatAgentMessage(msg)}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : loading ? (
                <div className="flex items-center gap-2 text-xs text-warmGrey-600 font-mono">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-bronze/50" />
                  <span>Agents processing...</span>
                </div>
              ) : (
                <div className="flex items-center gap-3 h-full">
                  <ChevronRight className="w-4 h-4 text-charcoal-700" />
                  <span className="text-xs text-charcoal-600 font-mono">Run the analysis to see agent-wise breakdown.</span>
                </div>
              )}
            </div>
          </div>

          {/* Final Report */}
          <div className={`flex-1 rounded-2xl border backdrop-blur-md overflow-hidden transition-all duration-500
            ${isComplete ? "border-bronze/30 bg-charcoal-900/60" : "border-charcoal-800/40 bg-charcoal-900/20"}`}>
            {/* Card Header */}
            <div className={`flex items-center justify-between px-4 py-3 border-b transition-colors duration-500
              ${isComplete ? "border-bronze/20" : "border-charcoal-800/30"}`}>
              <div className="flex items-center gap-2.5">
                <FileText className={`w-4 h-4 transition-colors duration-500 ${isComplete ? "text-bronze" : "text-charcoal-600"}`} />
                <span className={`text-sm font-serif transition-colors duration-500 ${isComplete ? "text-warmGrey-100" : "text-charcoal-600"}`}>
                  Final Report
                </span>
              </div>
              <div className={`flex items-center gap-1.5 text-[10px] sm:text-xs font-mono px-3 py-1.5 rounded-full border transition-all duration-500 shadow-sm
                ${isComplete
                  ? "text-green-400 bg-green-400/10 border-green-400/30 shadow-green-500/10"
                  : loading
                  ? "text-amber-400 bg-amber-400/10 border-amber-400/40 shadow-amber-500/20"
                  : "text-warmGrey-400 bg-charcoal-700/50 border-charcoal-600/50"}`}>
                {isComplete ? <CheckCircle2 className="w-3.5 h-3.5" /> : loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Clock className="w-3.5 h-3.5" />}
                {isComplete ? "Completed" : loading ? "Generating Report..." : "Waiting to Execute"}
              </div>
            </div>
            {/* Card Body */}
            <div className="px-5 py-4 min-h-[120px] overflow-y-auto custom-scrollbar">
              {isComplete && response ? (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-warmGrey-300 leading-relaxed whitespace-pre-wrap font-sans"
                >
                  {response}
                </motion.div>
              ) : loading ? (
                <div className="flex items-center gap-2 text-xs text-warmGrey-600 font-mono">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-bronze/50" />
                  <span>Generating final report...</span>
                </div>
              ) : (
                <div className="flex items-center gap-3 h-full">
                  <ChevronRight className="w-4 h-4 text-charcoal-700" />
                  <span className="text-xs text-charcoal-600 font-mono">Final report will appear here after analysis.</span>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Global styles */}
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-slideUp { animation: slideUp 0.4s ease-out forwards; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(184,154,122,0.3); border-radius: 10px; }
      `}</style>
    </div>
  );
}
