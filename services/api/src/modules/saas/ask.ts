import {
  buildBrief,
  formatFormula,
  kpiPoints,
  type KpiPoint,
  type SaasWorkspace,
  type WorkspaceAskResponse,
} from "@orbit/contracts";

type Fact = WorkspaceAskResponse["facts"][number];
export type FactAnswer = Omit<WorkspaceAskResponse, "mode">;

const STOP = new Set(["the", "and", "for", "per", "vs", "was", "are", "how", "what", "our", "this", "that", "with", "from", "does", "did", "last", "month", "period"]);
const tokens = (text: string): string[] =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 3 && !STOP.has(t));
/** Words too common in KPI names to identify one on their own. */
const GENERIC = new Set(["rate", "ratio", "average", "total", "growth", "share", "index", "days", "time", "number", "cost", "score", "value"]);
const has = (text: string, pattern: RegExp) => pattern.test(text);

const MAX_FACTS = 12;

function fact(point: KpiPoint, withUnit: boolean): Fact {
  const where = withUnit ? ` · ${point.unitName}` : "";
  const target =
    point.result.target !== null && point.number !== null
      ? ` (target ${point.result.target.replace(/\.?0+$/, "")})`
      : "";
  return {
    label: `${point.kpi.name}${where}`,
    value: `${point.display}${target}${point.change ? `, ${point.change}` : ""}`,
    tone: point.tone,
  };
}

function nameMatches(points: KpiPoint[], question: string): KpiPoint["kpi"][] {
  const asked = new Set(tokens(question));
  const kpis = new Map(points.map((p) => [p.kpi.id, p.kpi]));
  const full = [...kpis.values()].filter((k) => {
    const words = tokens(k.name);
    return words.length > 0 && words.every((w) => asked.has(w));
  });
  // Keep the most specific names: "gross margin per transaction" beats "gross margin".
  return full.filter(
    (k) =>
      !full.some(
        (other) => other.id !== k.id && tokens(other.name).length > tokens(k.name).length && tokens(k.name).every((w) => tokens(other.name).includes(w)),
      ),
  );
}

/** KPIs sharing one distinctive word with the question, for a "did you mean". */
function partialMatches(points: KpiPoint[], question: string): KpiPoint["kpi"][] {
  const asked = tokens(question).filter((word) => !GENERIC.has(word));
  const kpis = [...new Map(points.map((p) => [p.kpi.id, p.kpi])).values()];
  const seen = new Set<string>();
  for (const word of asked) {
    const hits = kpis.filter((k) => tokens(k.name).includes(word));
    if (hits.length > 0 && hits.length <= 6) hits.forEach((k) => seen.add(k.id));
  }
  return kpis.filter((k) => seen.has(k.id)).slice(0, 5);
}

function unitMentioned(workspace: SaasWorkspace, question: string) {
  const q = question.toLowerCase();
  return [...workspace.units]
    .sort((a, b) => b.name.length - a.name.length)
    .find((u) => u.parentId !== null && q.includes(u.name.toLowerCase()));
}

function suggestionsFor(points: KpiPoint[]): string[] {
  const first = points[0]?.kpi.name;
  return [
    "Give me the morning brief",
    "Which KPIs are off target?",
    ...(first ? [`How is ${first} doing?`] : []),
    "What is waiting for approval?",
    "Which actions are overdue?",
  ].slice(0, 5);
}

const empty = (topic: string, answer: string, suggestions: string[] = []): FactAnswer => ({
  answer,
  topic,
  facts: [],
  resultIds: [],
  suggestions,
});

function listAnswer(topic: string, lead: string, points: KpiPoint[], withUnit: boolean, suggestions: string[]): FactAnswer {
  const shown = points.slice(0, MAX_FACTS);
  return {
    answer: `${lead}${points.length > shown.length ? ` Showing the first ${shown.length}.` : ""}`,
    topic,
    facts: shown.map((p) => fact(p, withUnit)),
    resultIds: shown.map((p) => p.result.id),
    suggestions,
  };
}

/**
 * Answers a question from the workspace the caller is allowed to see.
 *
 * The workspace was loaded under the caller's own database role, so anything
 * their role cannot see is simply not here: a data contributor has no KPIs,
 * an executive has their template's KPIs. The answer is built from facts, never
 * from a model, so every figure in it is a stored result.
 */
export function answerQuestion(question: string, workspace: SaasWorkspace, today: string): FactAnswer {
  const all = kpiPoints(workspace);
  const q = question.toLowerCase();

  if (workspace.kpis.length === 0) {
    return empty(
      "no_access",
      "Your role does not include any KPIs, so there is nothing for me to answer from. Ask your organisation owner if you need access.",
    );
  }
  if (all.length === 0) {
    return empty(
      "no_data",
      "No results have been calculated yet. Once figures are uploaded and approved, I can answer questions about them.",
      ["What is waiting for approval?"],
    );
  }
  const suggestions = suggestionsFor(all);

  const unit = unitMentioned(workspace, q);
  const scope = unit ? all.filter((p) => p.unitId === unit.id) : all;
  const withUnit = !unit;
  const kpis = nameMatches(all, q);

  // How a KPI is calculated.
  if (kpis.length > 0 && has(q, /calculat|formula|defin|meaning|mean\b|measured|computed|made up/)) {
    const k = kpis[0]!;
    return {
      answer: `${k.name} is ${formatFormula(k.formula)}. ${k.description}`,
      topic: "definition",
      facts: [],
      resultIds: [],
      suggestions,
    };
  }

  // A named KPI: its latest value in each unit.
  if (kpis.length > 0) {
    let points = scope.filter((p) => kpis.some((k) => k.id === p.kpi.id));
    if (has(q, /lowest|worst|smallest|least|bottom/)) points = [...points].sort((a, b) => (a.number ?? Infinity) - (b.number ?? Infinity));
    else if (has(q, /highest|best|largest|most|top/)) points = [...points].sort((a, b) => (b.number ?? -Infinity) - (a.number ?? -Infinity));
    if (points.length === 0)
      return empty("kpi", `${kpis[0]!.name} has no calculated result${unit ? ` for ${unit.name}` : ""} yet.`, suggestions);
    const names = [...new Set(points.map((p) => p.kpi.name))].join(" and ");
    const one = points.length === 1 ? points[0]! : null;
    return listAnswer(
      "kpi",
      one
        ? `${one.kpi.name}${unit ? ` for ${unit.name}` : one.unitName ? ` in ${one.unitName}` : ""} is ${one.display} for ${one.period}${one.change ? `, ${one.change}` : ""}.`
        : `Here is ${names} for the latest period in each unit.`,
      points,
      points.length > 1 || withUnit,
      suggestions,
    );
  }

  // Off target / problems.
  if (has(q, /off.?target|behind|below target|missed|miss(ing)? (the )?target|worst|at risk|problem|concern|attention|trouble|red\b|not meeting|under.?perform/)) {
    const bad = scope.filter((p) => p.tone === "bad" && p.number !== null).sort((a, b) => (a.onTarget === false ? 0 : 1) - (b.onTarget === false ? 0 : 1));
    const anyTarget = scope.some((p) => p.result.target !== null);
    if (!anyTarget)
      return {
        ...listAnswer("off_target", "No targets are set on the KPIs you can see, so I cannot say what is off target. Ask your owner to set targets. Meanwhile, here is what got worse since the previous period.", scope.filter((p) => p.changeTone === "bad"), withUnit, suggestions),
      };
    return bad.length === 0
      ? empty("off_target", `Nothing is off target${unit ? ` in ${unit.name}` : ""} right now.`, suggestions)
      : listAnswer("off_target", `${bad.length} result${bad.length === 1 ? " needs" : "s need"} attention${unit ? ` in ${unit.name}` : ""}.`, bad, withUnit, suggestions);
  }

  // Doing well.
  if (has(q, /on.?track|meeting (the )?target|achiev|healthy|green|doing well|going well|good news|wins?\b|best/)) {
    const good = scope.filter((p) => p.tone === "good" && p.number !== null);
    return good.length === 0
      ? empty("on_track", `No result is clearly on track${unit ? ` in ${unit.name}` : ""} yet.`, suggestions)
      : listAnswer("on_track", `${good.length} result${good.length === 1 ? " is" : "s are"} on track or improving${unit ? ` in ${unit.name}` : ""}.`, good, withUnit, suggestions);
  }

  // Movement.
  if (has(q, /improv|increas|grew|growth|going up|\bup\b/)) {
    const up = scope.filter((p) => p.changeTone === "good" && p.change);
    return up.length === 0
      ? empty("improving", "Nothing has clearly improved since the previous period.", suggestions)
      : listAnswer("improving", `${up.length} result${up.length === 1 ? " has" : "s have"} improved since the previous period.`, up, withUnit, suggestions);
  }
  if (has(q, /declin|drop|fell|fall|decreas|worse|going down|\bdown\b/)) {
    const down = scope.filter((p) => p.changeTone === "bad" && p.change);
    return down.length === 0
      ? empty("declining", "Nothing has clearly got worse since the previous period.", suggestions)
      : listAnswer("declining", `${down.length} result${down.length === 1 ? " has" : "s have"} got worse since the previous period.`, down, withUnit, suggestions);
  }

  // Waiting for approval.
  if (has(q, /pending|waiting|approv|not submitted|submitted|upload/)) {
    const waiting = workspace.batches.filter((b) => b.status === "submitted");
    const unitName = new Map(workspace.units.map((u) => [u.id, u.name]));
    return {
      answer: waiting.length === 0 ? "Nothing is waiting for approval." : `${waiting.length} data upload${waiting.length === 1 ? " is" : "s are"} waiting for approval.`,
      topic: "pending",
      facts: waiting.slice(0, MAX_FACTS).map((b) => ({
        label: unitName.get(b.unitId) ?? "Unit",
        value: `${b.start} to ${b.end}`,
        tone: "neutral" as const,
      })),
      resultIds: [],
      suggestions,
    };
  }

  // Actions.
  if (has(q, /action|overdue|task|to.?do|act now|follow.?up/)) {
    const open = workspace.actions.filter((a) => a.state !== "done");
    const overdue = open.filter((a) => a.dueDate < today);
    const shown = (has(q, /overdue|late/) ? overdue : open).slice(0, MAX_FACTS);
    return {
      answer: open.length === 0 ? "There are no open actions." : `${open.length} action${open.length === 1 ? " is" : "s are"} open, ${overdue.length} overdue.`,
      topic: "actions",
      facts: shown.map((a) => ({ label: a.title, value: `due ${a.dueDate}, ${a.state.replace("_", " ")}`, tone: a.dueDate < today ? ("bad" as const) : ("neutral" as const) })),
      resultIds: [],
      suggestions,
    };
  }

  // A unit on its own: its brief.
  if (unit || has(q, /summar|brief|overview|status|snapshot|highlight|morning|how (are|is) (we|it|things)|doing/)) {
    const brief = buildBrief(workspace, today, unit?.id);
    const lines: Fact[] = [
      ...brief.concerns.slice(0, 4).map((p) => fact(p, withUnit)),
      ...brief.wins.slice(0, 3).map((p) => fact(p, withUnit)),
    ];
    return {
      answer: `${unit ? `${unit.name}: ` : ""}${brief.headline}`,
      topic: "brief",
      facts: lines,
      resultIds: [...brief.concerns.slice(0, 4), ...brief.wins.slice(0, 3)].map((p) => p.result.id),
      suggestions,
    };
  }

  // A word that matches a few KPI names.
  const near = partialMatches(all, q);
  if (near.length > 0) {
    const points = scope.filter((p) => near.some((k) => k.id === p.kpi.id));
    return listAnswer("kpi", `I found these KPIs that match. Ask about one by name for detail.`, points, withUnit, suggestions);
  }

  return empty(
    "unknown",
    "I could not find that among the KPIs you can see. I can answer questions about those: how one is doing, what is off target, what changed, what is waiting for approval and which actions are overdue.",
    suggestions,
  );
}
