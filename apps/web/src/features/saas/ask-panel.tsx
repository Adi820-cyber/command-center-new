import { useEffect, useRef, useState, type FormEvent } from "react";
import { WorkspaceAskResponseSchema, type WorkspaceAskResponse } from "@orbit/contracts";
import { request } from "./client";
import "./v2.css";

interface Turn {
  id: string;
  question: string;
  answer?: WorkspaceAskResponse;
  error?: string;
}
const STARTERS = [
  "Give me the morning brief",
  "Which KPIs are off target?",
  "What got better since the last period?",
  "What is waiting for approval?",
  "Which actions are overdue?",
];
const ignoreSeed = () => undefined;

/**
 * Ask in plain words. The answer is built on the server from the figures this
 * person's own role can read, so it can never mention a KPI they cannot see.
 */
interface AskPanelProps {
  tenant?: string;
  seed?: string;
  onSeedUsed?: () => void;
  endpoint?: string;
  title?: string;
  note?: string;
  starters?: readonly string[];
  compact?: boolean;
}

export function AskPanel({
  tenant,
  seed = "",
  onSeedUsed = ignoreSeed,
  endpoint,
  title = "Ask about your numbers",
  note = "Answers come only from the KPIs your role can see. Every figure is a stored result, not a guess.",
  starters = STARTERS,
  compact = false,
}: AskPanelProps) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);

  async function ask(text: string) {
    const q = text.trim();
    if (q.length < 2 || busy) return;
    setBusy(true);
    setQuestion("");
    const id = crypto.randomUUID();
    setTurns((t) => [...t, { id, question: q }]);
    try {
      const url = endpoint ?? `/api/saas/${tenant}/ask`;
      const answer = await request(url, WorkspaceAskResponseSchema, { question: q });
      setTurns((t) => t.map((turn) => (turn.id === id ? { ...turn, answer } : turn)));
    } catch (e) {
      setTurns((t) => t.map((turn) => (turn.id === id ? { ...turn, error: e instanceof Error ? e.message : "Could not answer." } : turn)));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (seed) {
      onSeedUsed();
      void ask(seed);
    }
    // Only when a new seed arrives.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [seed]);
  useEffect(() => {
    bottom.current?.scrollIntoView?.({ behavior: "smooth", block: "end" });
  }, [turns]);

  const last = turns.at(-1)?.answer;
  const suggestions = last?.suggestions.length ? last.suggestions : starters;

  return (
    <section className={`saas-card ask-panel${compact ? " compact" : ""}`}>
      <h2>{title}</h2>
      <p className="ask-note">{note}</p>
      <div className="ask-log" aria-live="polite">
        {turns.length === 0 && <p className="muted">Try one of the questions below, or type your own.</p>}
        {turns.map((turn) => (
          <div key={turn.id} style={{ display: "grid", gap: 10 }}>
            <div className="ask-q">{turn.question}</div>
            <div className="ask-a">
              {turn.error && <p role="alert">{turn.error}</p>}
              {!turn.answer && !turn.error && <p className="muted">Looking at your results…</p>}
              {turn.answer && (
                <>
                  <p>{turn.answer.answer}</p>
                  {turn.answer.facts.length > 0 && (
                    <ul className="ask-facts">
                      {turn.answer.facts.map((f) => (
                        <li key={`${f.label}:${f.value}`}>
                          <span className={`dot ${f.tone}`} aria-hidden="true" />
                          <span>
                            <strong>{f.label}</strong>: {f.value}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <small className="muted">
                    {turn.answer.mode === "ai" ? "Wording improved by AI; figures unchanged." : "Built directly from your results."}
                  </small>
                </>
              )}
            </div>
          </div>
        ))}
        <div ref={bottom} />
      </div>
      <form
        className="ask-form"
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          void ask(question);
        }}
      >
        <input
          aria-label="Your question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="For example: how is the operating margin in Mumbai?"
          maxLength={500}
        />
        <button disabled={busy || question.trim().length < 2}>{busy ? "Thinking…" : "Ask"}</button>
      </form>
      <div className="ask-suggestions">
        {suggestions.map((s) => (
          <button key={s} type="button" disabled={busy} onClick={() => void ask(s)}>
            {s}
          </button>
        ))}
      </div>
    </section>
  );
}
