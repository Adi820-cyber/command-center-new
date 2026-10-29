import { useState, useRef, useEffect } from "react";
import { Sparkles, X, Send } from "lucide-react";
import "./executive.css";

interface ChatMessage {
  id: string;
  sender: "bot" | "user";
  text: string;
  time: string;
}

interface Props {
  isOpen: boolean;
  onToggle: () => void;
  seedPrompt?: string;
  onClearSeed?: () => void;
}

const KNOWLEDGE_RESPONSES: Record<string, string> = {
  exceptions:
    "There are 3 active exceptions this morning:\n1. Group Capex Variance in Region 1 (+6.8% over threshold due to Kikuyu linac bunker civil works, absorbed within contingency reserve).\n2. NHIF Aged Receivables Overdue (KSh 14.8M >60 days across Region 2 public schemes; MoH liaison meeting scheduled).\n3. Jubilee Corporate Tariff Renewal (standardized rate-card ready for your endorsement).",
  ebitda:
    "Group EBITDA is currently at 87.8% (KSh 31.5M), exceeding the approved budget target of 80.2% by +7.6 percentage points. Kikuyu leads with 24.2% margin (KSh 15.1M EBITDA), followed by Meru at 21.5% and Bungoma at 19.8%.",
  capex:
    "Region 1 capex variance is +6.8% over quarterly budget, driven by lead shielding and civil bunker works for the Kikuyu oncology linac accelerator. The KSh 8.2M delta is fully covered by the approved group capex contingency pool.",
  receivables:
    "NHIF receivables over 60 days total KSh 14.8M across Western and Rift public schemes (Eldoret KSh 6.4M, Bungoma KSh 5.2M, Migori KSh 3.2M). Reconciliations are completed, and a bilateral liaison session with the Ministry of Health is scheduled for next Tuesday.",
  decisions:
    "There are 4 pending executive decisions in your queue:\n1. Board Audit & Risk Committee Q3 review pack sign-off (Due Tomorrow - Critical)\n2. Jubilee & AAR Strategic Agreement endorsement (Due Sep 12 - High)\n3. Eldoret Cath Lab Phase-1 capex proposal KSh 18.5M (Due Sep 16 - High)\n4. Hospital Medical Director KSh 6.2M incentive pool (Due Sep 18 - Medium)",
  occupancy:
    "Group bed occupancy is at 87.0% across all 6 hospitals against a target of 90.5% (-0.4 pp vs Jun 2026). Kikuyu is at 92.4%, Meru at 88.6%, while Western facilities average 83.5% due to surgical scheduling adjustments.",
};

export function ExecutiveChatbot({ isOpen, onToggle, seedPrompt, onClearSeed }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "m-init",
      sender: "bot",
      text: "Good morning, Chairman. I am your Executive AI Assistant for the Command Center. How can I assist with your Morning Brief or decision queue today?",
      time: "08:30 AM",
    },
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (seedPrompt) {
      if (!isOpen) onToggle();
      handleSend(seedPrompt);
      onClearSeed?.();
    }
  }, [seedPrompt]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const handleSend = (textToSend?: string) => {
    const q = (textToSend || input).trim();
    if (!q) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: "user",
      text: q,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");

    // Simulate smart context response
    setTimeout(() => {
      const lower = q.toLowerCase();
      let reply =
        "All figures reflect verified executive reporting across the 6 Lifecare facilities as of July 2026. Data provenance: illustrative verified.";

      if (lower.includes("exception") || lower.includes("attention")) {
        reply = KNOWLEDGE_RESPONSES.exceptions ?? reply;
      } else if (lower.includes("ebitda") || lower.includes("profit") || lower.includes("margin")) {
        reply = KNOWLEDGE_RESPONSES.ebitda ?? reply;
      } else if (lower.includes("capex") || lower.includes("linac") || lower.includes("bunker") || lower.includes("variance")) {
        reply = KNOWLEDGE_RESPONSES.capex ?? reply;
      } else if (lower.includes("nhif") || lower.includes("receivable") || lower.includes("overdue") || lower.includes("claim")) {
        reply = KNOWLEDGE_RESPONSES.receivables ?? reply;
      } else if (lower.includes("decision") || lower.includes("queue") || lower.includes("sign") || lower.includes("pending")) {
        reply = KNOWLEDGE_RESPONSES.decisions ?? reply;
      } else if (lower.includes("bed") || lower.includes("occupancy") || lower.includes("capacity")) {
        reply = KNOWLEDGE_RESPONSES.occupancy ?? reply;
      }

      const botMsg: ChatMessage = {
        id: `b-${Date.now()}`,
        sender: "bot",
        text: reply,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botMsg]);
    }, 450);
  };

  return (
    <>
      {/* ─── Floating Launcher in Bottom-Right Corner (Strict requirement) ─── */}
      <button
        type="button"
        className="exec-floating-chatbot-launcher"
        onClick={onToggle}
        aria-label="Open AI Assistant"
      >
        <Sparkles size={18} color="#38bdf8" />
        <span>{isOpen ? "Close Assistant" : "✦ Ask AI Assistant"}</span>
      </button>

      {/* ─── Sliding AI Assistant Panel in Bottom-Right Corner ─── */}
      {isOpen && (
        <div className="exec-chatbot-panel" role="region" aria-label="Command Center Assistant">
          <div className="exec-chatbot-header">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  background: "#2563eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Sparkles size={16} color="#ffffff" />
              </div>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 800, margin: 0, color: "#ffffff" }}>
                  Command Center Assistant
                </h3>
                <span style={{ fontSize: 11, color: "#60a5fa", fontWeight: 600 }}>
                  Answering as Chairman (Group)
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onToggle}
              style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          <div className="exec-chatbot-messages">
            {messages.map((m) => (
              <div key={m.id} className={`exec-chat-bubble ${m.sender}`}>
                <div style={{ whiteSpace: "pre-wrap" }}>{m.text}</div>
                <div
                  style={{
                    fontSize: 10,
                    marginTop: 4,
                    textAlign: m.sender === "user" ? "right" : "left",
                    opacity: 0.65,
                  }}
                >
                  {m.time}
                </div>
              </div>
            ))}

            {messages.length <= 2 && (
              <div className="exec-chat-starters">
                <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                  Suggested Questions
                </span>
                <button
                  type="button"
                  className="exec-chat-starter-btn"
                  onClick={() => handleSend("What exceptions require my executive attention this morning?")}
                >
                  What exceptions require my attention this morning?
                </button>
                <button
                  type="button"
                  className="exec-chat-starter-btn"
                  onClick={() => handleSend("Summarize Group EBITDA vs budget")}
                >
                  Summarize Group EBITDA vs budget
                </button>
                <button
                  type="button"
                  className="exec-chat-starter-btn"
                  onClick={() => handleSend("Explain the NHIF aged receivables overdue")}
                >
                  Explain the NHIF aged receivables overdue
                </button>
                <button
                  type="button"
                  className="exec-chat-starter-btn"
                  onClick={() => handleSend("What are the 4 pending executive decisions in my queue?")}
                >
                  What are the 4 pending executive decisions?
                </button>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form
            className="exec-chatbot-composer"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <input
              type="text"
              className="exec-chatbot-input"
              placeholder="Ask about facilities, EBITDA, capex, or decisions…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button
              type="submit"
              className="exec-btn-primary"
              style={{ padding: "8px 14px", borderRadius: 8 }}
              disabled={!input.trim()}
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
