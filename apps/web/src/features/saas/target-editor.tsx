import { useState, type FormEvent } from "react";
import { DecimalSchema, formatKpiValue, type SaasWorkspace } from "@orbit/contracts";

type Kpi = SaasWorkspace["kpis"][number];

/** A target as people write it: `25`, not `25.0000000000`. */
const plain = (target: string | null) => (target === null ? "" : target.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, ""));

/** Set or clear the target of a KPI without creating a new version. */
export function TargetEditor({
  kpi,
  change,
}: {
  kpi: Kpi;
  change: (path: string, body: unknown) => Promise<boolean>;
}) {
  const initial = plain(kpi.target);
  const [value, setValue] = useState(initial);
  const clean = value.trim();
  const valid = clean === "" || DecimalSchema.safeParse(clean).success;
  const dirty = clean !== initial;

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!valid || !dirty) return;
    await change(`/kpis/${kpi.id}/target`, { target: clean === "" ? null : clean });
  }
  return (
    <form onSubmit={(e) => void save(e)} style={{ display: "flex", gap: 6, alignItems: "center", margin: 0 }} aria-label={`Target for ${kpi.name}`}>
      <input
        inputMode="decimal"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="none"
        aria-label={`Target for ${kpi.name}`}
        aria-invalid={!valid}
        style={{ width: 96, padding: "6px 8px" }}
      />
      {dirty && valid && <button style={{ padding: "6px 10px" }}>Save</button>}
      {!valid && <small role="alert">Enter a number</small>}
      {valid && !dirty && kpi.target !== null && <small className="muted">{formatKpiValue(kpi.target, kpi.unit)}</small>}
    </form>
  );
}
