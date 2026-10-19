import { useEffect, useMemo, useState } from "react";
import { CatalogResponseSchema, unitLabel, type CatalogResponse, type SaasWorkspace } from "@orbit/contracts";
import { request } from "./client";
import { domainTitle } from "./domains";
import "./v2.css";

const PAGE = 30;

function unitText(unit: string): string {
  if (unit === "%") return "percentage";
  if (unit === "1") return "ratio";
  const label = unitLabel(unit).trim();
  return label || (unit === "currency" ? "amount" : unit === "count" ? "number" : unit);
}

/** Browse the ready-made KPIs and add the ones this organization wants. */
export function CatalogBrowser({
  workspace: w,
  change,
  startOpen = false,
}: {
  workspace: SaasWorkspace;
  change: (path: string, body: unknown) => Promise<boolean>;
  startOpen?: boolean;
}) {
  const [open, setOpen] = useState(startOpen);
  const [data, setData] = useState<CatalogResponse>();
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [domain, setDomain] = useState("");
  const [industry, setIndustry] = useState("");
  const [shown, setShown] = useState(PAGE);
  const [added, setAdded] = useState<string[]>([]);

  useEffect(() => {
    if (!open || data) return;
    request("/api/saas/catalog", CatalogResponseSchema)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load the catalog."));
  }, [open, data]);

  const mine = useMemo(() => new Set([...w.kpis.map((k) => k.catalogId).filter(Boolean), ...added]), [w.kpis, added]);
  const measureName = useMemo(() => new Map(data?.measures.map((m) => [m.key, m.name]) ?? []), [data]);
  const domains = useMemo(() => [...new Set(data?.kpis.map((k) => k.domain) ?? [])], [data]);
  const industries = useMemo(
    () => [...new Set(data?.kpis.flatMap((k) => k.industries).filter((i) => i !== "*") ?? [])].sort(),
    [data],
  );

  const matches = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    return (data?.kpis ?? []).filter(
      (k) =>
        (!domain || k.domain === domain) &&
        (!industry || k.industries.includes("*") || k.industries.includes(industry)) &&
        words.every((word) => `${k.name} ${k.description} ${k.id}`.toLowerCase().includes(word)),
    );
  }, [data, query, domain, industry]);

  async function add(id: string) {
    await change(`/catalog/${id}/add`, {});
    setAdded((a) => [...a, id]);
  }

  return (
    <section className="saas-card">
      <div className="saas-card-title">
        <h2>Add from the KPI catalog</h2>
        <button type="button" className="secondary" aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? "Hide the catalog" : "Browse 592 ready-made KPIs"}
        </button>
      </div>
      {open && (
        <p>
          Each KPI comes with its formula. Add the ones you want; each is added as a draft that the owner activates.
          Definitions vary between companies, so read the formula and check it matches how you work.
        </p>
      )}
      {open && error && <p role="alert">{error}</p>}
      {open && !data && !error && <p className="muted">Loading the catalog…</p>}
      {open && data && (
        <>
          <div className="cat-filters">
            <label>
              Search
              <input
                type="search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShown(PAGE);
                }}
                placeholder="margin, attrition, occupancy…"
              />
            </label>
            <label>
              Area
              <select
                value={domain}
                onChange={(e) => {
                  setDomain(e.target.value);
                  setShown(PAGE);
                }}
              >
                <option value="">All areas</option>
                {domains.map((d) => (
                  <option key={d} value={d}>
                    {domainTitle(d)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Industry
              <select
                value={industry}
                onChange={(e) => {
                  setIndustry(e.target.value);
                  setShown(PAGE);
                }}
              >
                <option value="">Every industry</option>
                {industries.map((i) => (
                  <option key={i} value={i}>
                    {i.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className="muted" aria-live="polite">
            {matches.length} KPI{matches.length === 1 ? "" : "s"} match.
          </p>
          <div className="cat-list">
            {matches.slice(0, shown).map((k) => {
              const have = mine.has(k.id);
              return (
                <article key={k.id} className="cat-item">
                  <div>
                    <div className="cat-tags">
                      <span className="saas-badge">{k.id}</span>
                      <span className="saas-badge">{domainTitle(k.domain)}</span>
                      <span className="saas-badge">{unitText(k.unit)}</span>
                      <span className="saas-badge">{k.direction === "neutral" ? "monitor" : `${k.direction} is better`}</span>
                      {k.needsHistory && <span className="saas-badge">needs the previous period</span>}
                    </div>
                    <h3>{k.name}</h3>
                    <p>{k.description}</p>
                    <code>{k.formulaText}</code>
                    <details>
                      <summary>Inputs and sources</summary>
                      <p>
                        Needs: {k.measures.map((m) => measureName.get(m) ?? m).join(", ")}.
                      </p>
                      <p>
                        Checked against:{" "}
                        {k.sources.map((s, i) => (
                          <span key={s}>
                            {i > 0 && ", "}
                            <a href={s} target="_blank" rel="noreferrer noopener">
                              {new URL(s).hostname.replace(/^www\./, "")}
                            </a>
                          </span>
                        ))}
                      </p>
                    </details>
                  </div>
                  <div>
                    {w.organization.owner ? (
                      <button type="button" disabled={have} onClick={() => void add(k.id)}>
                        {have ? "Added" : "Add"}
                      </button>
                    ) : have ? (
                      <span className="saas-badge good">In use</span>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
          {matches.length > shown && (
            <div className="csv-actions">
              <button type="button" className="secondary" onClick={() => setShown(shown + PAGE)}>
                Show {Math.min(PAGE, matches.length - shown)} more
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
