import { useEffect, useRef, useState, type FormEvent } from "react";
import { WorkspaceAskResponseSchema, type WorkspaceAskResponse } from "@orbit/contracts";
import { request } from "./client";
import "./v2.css";

interface Turn {
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

/**
 * Ask in plain words. The answer is built on the server from the figures this
 * person's own role can read, so it can never mention a KPI they cannot see.
 */
export function AskPanel({ tenant, seed, onSeedUsed }: { tenant: string; seed: string; onSeedUsed: () => void }) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);

  async function ask(text: string) {
    const q = text.trim();
    if (q.length < 2 || busy) return;
    setBusy(true);
    setQuestion("");
    const index = turns.length;
    setTurns((t) => [...t, { question: q }]);
    try {
      const answer = await request(`/api/saas/${tenant}/ask`, WorkspaceAskResponseSchema, { question: q });
      setTurns((t) => t.map((turn, i) => (i === index ? { ...turn, answer } : turn)));
    } catch (e) {
      setTurns((t) => t.map((turn, i) => (i === index ? { ...turn, error: e instanceof Error ? e.message : "Could not answer." } : turn)));
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
  const suggestions = last?.suggestions.length ? last.suggestions : STARTERS;

  return (
    <section className="saas-card">
      <h2>Ask about your numbers</h2>
      <p className="ask-note">
        Answers come only from the KPIs your role can see. Every figure is a stored result, not a guess.
      </p>
      <div className="ask-log" aria-live="polite">
        {turns.length === 0 && <p className="muted">Try one of the questions below, or type your own.</p>}
        {turns.map((turn, i) => (
          <div key={i} style={{ display: "grid", gap: 10 }}>
            <div className="ask-q">{turn.question}</div>
            <div className="ask-a">
              {turn.error && <p role="alert">{turn.error}</p>}
              {!turn.answer && !turn.error && <p className="muted">Looking at your results…</p>}
              {turn.answer && (
                <>
                  <p>{turn.answer.answer}</p>
                  {turn.answer.facts.length > 0 && (
                    <ul className="ask-facts">
                      {turn.answer.facts.map((f, j) => (
                        <li key={j}>
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
