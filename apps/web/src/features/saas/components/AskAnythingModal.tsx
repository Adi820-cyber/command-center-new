import React, { useState, useEffect, useRef } from "react";
import { Sparkles, X, Send, User, Bot, Loader2 } from "lucide-react";
import {
  WorkspaceAskResponseSchema,
  type WorkspaceAskResponse,
} from "@orbit/contracts";
import { request } from "../client";

interface AskAnythingModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: string;
  initialQuestion?: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  facts?: WorkspaceAskResponse["facts"];
  suggestions?: string[];
}

const QUICK_QUESTIONS = [
  "Which KPIs are off target?",
  "What got better since the last period?",
  "What got worse since the last period?",
  "What is waiting for approval?",
];

export const AskAnythingModal: React.FC<AskAnythingModalProps> = ({
  isOpen,
  onClose,
  tenant,
  initialQuestion,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "greeting",
      role: "assistant",
      text: "Hello! I am your Executive Performance Assistant. Ask me anything about your KPIs, unit operations, target variances, or pending approvals. Answers are strictly calculated from your authorized evidence.",
      suggestions: QUICK_QUESTIONS,
    },
  ]);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
      if (initialQuestion) {
        void handleSend(initialQuestion);
      }
    }
  }, [isOpen, initialQuestion]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  if (!isOpen) return null;

  const handleSend = async (questionText: string) => {
    const q = questionText.trim();
    if (!q || busy || !tenant) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: q,
    };

    setMessages((prev) => [...prev, userMsg]);
    setQuery("");
    setBusy(true);

    try {
      const resp = await request(
        `/api/saas/${tenant}/ask`,
        WorkspaceAskResponseSchema,
        { question: q },
      );

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        text: resp.answer,
        facts: resp.facts,
        suggestions: resp.suggestions,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text:
            e instanceof Error
              ? e.message
              : "Unable to calculate response for this question.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl h-[640px] max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-start justify-between bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white shrink-0">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-blue-500/20 text-blue-300 border border-blue-400/30">
                <Sparkles className="w-4 h-4" />
              </span>
              <h2 className="text-base font-black tracking-tight text-white">
                Executive Decision & KPI Intelligence
              </h2>
            </div>
            <p className="text-xs text-blue-200/80">
              Grounded in verified data for your organization. No hallucinated figures.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            aria-label="Close assistant"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Thread */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((m) => {
            const isUser = m.role === "user";
            return (
              <div
                key={m.id}
                className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? "bg-blue-600 text-white font-medium rounded-br-xs"
                      : "bg-slate-50 border border-slate-200 text-slate-800 rounded-bl-xs"
                  }`}
                >
                  <p>{m.text}</p>

                  {/* Grounded facts */}
                  {m.facts && m.facts.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Verified Evidence Points
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {m.facts.map((f, i) => (
                          <div
                            key={i}
                            className={`p-2 rounded-lg border text-xs flex items-center justify-between gap-2 ${
                              f.tone === "good"
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : f.tone === "bad"
                                ? "bg-rose-50 text-rose-800 border-rose-200"
                                : "bg-white text-slate-700 border-slate-200"
                            }`}
                          >
                            <span className="font-semibold truncate">{f.label}</span>
                            <span className="font-mono font-bold shrink-0">
                              {f.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Follow-up suggestions */}
                  {m.suggestions && m.suggestions.length > 0 && (
                    <div className="mt-3 pt-2.5 flex flex-wrap gap-1.5">
                      {m.suggestions.map((s) => (
                        <button
                          key={s}
                          onClick={() => void handleSend(s)}
                          className="px-2.5 py-1 text-xs rounded-full bg-white hover:bg-blue-50 border border-slate-200 text-slate-700 hover:text-blue-700 transition-colors font-medium cursor-pointer"
                        >
                          {s} →
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {busy && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-slate-50 border border-slate-200 text-slate-600 rounded-2xl p-3.5 text-xs flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                <span>Computing verified metrics across your units…</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-200 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSend(query);
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              placeholder="Ask anything about KPIs, targets, or operations..."
              value={query}
              disabled={busy}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 px-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={busy || !query.trim()}
              className="p-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer shrink-0 flex items-center gap-1.5 text-xs"
            >
              <span>Ask</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
