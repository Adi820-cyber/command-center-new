import "./saas.css";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  MutationResponseSchema,
  SettingsSchema,
  ProposalListSchema,
  AuditResponseSchema,
  BatchDetailSchema,
  TenantListSchema,
  WorkspaceSchema,
  type SaasWorkspace,
} from "@orbit/contracts";
import { getAuthClient, getCurrentSession, signOut } from "../../lib/auth";
import { mustChangePassword } from "../auth/change-password-route";
import { mutate, request } from "./client";
import { AskPanel } from "./ask-panel";
import { CatalogBrowser } from "./catalog-browser";
import { CsvImport } from "./csv-import";
import { TargetEditor } from "./target-editor";
import { CustomKpiForm } from "./custom-kpi";
import { KpiActions } from "./kpi-actions";
import { Dashboard } from "./dashboard";
import { OrgHub } from "./org-hub";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { ContextBar } from "./components/ContextBar";
import { ToastContainer, type ToastItem } from "./components/ToastContainer";
import { AskAnythingModal } from "./components/AskAnythingModal";
import { KpiDashboardView } from "./kpi-dashboard-view";
import { ActionCenterView } from "./action-center-view";
import { UnitsView } from "./units-view";
import "./v2.css";

export type Tab =
  | "Dashboard"
  | "KPI Dashboard"
  | "Actions"
  | "Units"
  | "KPI library"
  | "Data & approvals"
  | "Organization"
  | "Activity"
  | "Ask";
const text = (data: FormData, key: string) => {
  const value = data.get(key);
  return typeof value === "string" ? value.trim() : "";
};
function Field({ title, children }: { title: string; children: ReactNode }) {
  return (
    <label>
      {title}
      {children}
    </label>
  );
}
const onClickAsync = (fn: () => Promise<void>) => () => {
  void fn();
};
const onSubmitAsync =
  (fn: (event: FormEvent<HTMLFormElement>) => Promise<void>) =>
  (event: FormEvent<HTMLFormElement>) => {
    void fn(event);
  };
export function SaasRoute() {
  const [organizations, setOrganizations] = useState<
    ReturnType<typeof TenantListSchema.parse>
  >([]);
  const [tenant, setTenant] = useState("");
  const [workspace, setWorkspace] = useState<SaasWorkspace>();
  const [tab, setTab] = useState<Tab>("Dashboard");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const generation = useRef(0);
  const [askSeed, setAskSeed] = useState("");
  const [email, setEmail] = useState("");

  // Executive Shell UI States
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("all");
  const [selectedPeriodType, setSelectedPeriodType] = useState<"M" | "Q" | "YTD" | "Y">("M");
  const [isAskAiOpen, setIsAskAiOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((t: Omit<ToastItem, "id">) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { ...t, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const reload = useCallback(async () => {
    if (!tenant) return;
    const current = generation.current;
    const updated = await request(`/api/saas/${tenant}/workspace`, WorkspaceSchema);
    if (current === generation.current) setWorkspace(updated);
  }, [tenant]);

  const selectTenant = useCallback((id: string) => {
    ++generation.current;
    setWorkspace(undefined);
    setMessage("");
    setTab("Dashboard");
    setLoading(!!id);
    setTenant(id);
  }, []);

  useEffect(() => {
    let active = true;
    void getCurrentSession().then((session) => {
      if (!active) return;
      setEmail(session?.user.email ?? "");
      if (mustChangePassword(session?.user)) window.location.replace("/change-password");
    });
    request("/api/saas/organizations", TenantListSchema)
      .then((rows) => {
        if (!active) return;
        setOrganizations(rows);
        selectTenant((rows.find((r) => r.status === "active") ?? rows[0])?.id ?? "");
        if (rows.length === 0) {
          request("/api/control/me", MutationResponseSchema)
            .then(() => {
              if (active) window.location.replace("/operator");
            })
            .catch(() => undefined);
        }
      })
      .catch((e) => {
        if (active) {
          setMessage(e.message);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [selectTenant]);

  const closed = organizations.find((o) => o.id === tenant && o.status !== "active");
  const isClosed = closed !== undefined;

  useEffect(() => {
    const current = generation.current;
    if (!tenant || isClosed) return;
    request(`/api/saas/${tenant}/workspace`, WorkspaceSchema)
      .then((value) => {
        if (current !== generation.current) return;
        setWorkspace(value);
        if (value.organization.owner) setTab("Organization");
      })
      .catch((e) => {
        if (current === generation.current) setMessage(e.message);
      })
      .finally(() => {
        if (current === generation.current) setLoading(false);
      });
  }, [tenant, isClosed]);

  async function change(path: string, body: unknown): Promise<boolean> {
    const current = generation.current;
    setBusy(true);
    setMessage("");
    try {
      const result = await mutate(`/api/saas/${tenant}${path}`, body);
      const updated = await request(
        `/api/saas/${tenant}/workspace`,
        WorkspaceSchema,
      );
      if (current === generation.current) {
        setWorkspace(updated);
        const notice = result.token
          ? `Invitation: ${window.location.origin}/invite#${result.token}`
          : "Saved. Your workspace is up to date.";
        setMessage(notice);
        addToast({
          type: "success",
          title: "Saved Successfully",
          message: notice,
        });
      }
      return true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unable to save.";
      if (current === generation.current) {
        setMessage(msg);
        addToast({
          type: "error",
          title: "Operation Failed",
          message: msg,
        });
      }
      return false;
    } finally {
      if (current === generation.current) setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex overflow-x-hidden relative">
      {/* Persistent / Responsive Left Sidebar */}
      <Sidebar
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        isMobileMenuOpen={isMobileMenuOpen}
        closeMobileMenu={() => setIsMobileMenuOpen(false)}
        activeTab={tab}
        onSelectTab={setTab}
        workspace={workspace}
        email={email}
        onSignOut={() => void signOut().then(() => window.location.assign("/login"))}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        {/* Sticky Header */}
        <Header
          sidebarCollapsed={sidebarCollapsed}
          toggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          activeTab={tab}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          organizations={organizations}
          tenant={tenant}
          selectTenant={selectTenant}
          workspace={workspace}
          openAskAi={() => setIsAskAiOpen(true)}
          onSelectTab={setTab}
          email={email}
        />

        {/* Sticky Context Bar */}
        <ContextBar
          sidebarCollapsed={sidebarCollapsed}
          workspace={workspace}
          selectedUnitId={selectedUnitId}
          onSelectUnitId={setSelectedUnitId}
          selectedDomain={selectedDomain}
          onSelectDomain={setSelectedDomain}
          selectedPeriodType={selectedPeriodType}
          onSelectPeriodType={setSelectedPeriodType}
        />

        {/* Page Body */}
        <main
          className={`flex-1 px-3.5 py-4 sm:px-6 sm:py-6 lg:px-8 transition-all duration-300 ml-0 ${
            sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
          }`}
        >
          <div className="max-w-7xl mx-auto space-y-6">
            {message && (
              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-semibold flex items-center justify-between">
                <span>{message}</span>
                <button onClick={() => setMessage("")} className="text-blue-500 hover:text-blue-700 font-bold ml-2">×</button>
              </div>
            )}

            {loading && !closed && (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-sm font-semibold text-slate-500">
                Loading your authorized workspace…
              </div>
            )}

            {!loading && !tenant && (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
                <h2 className="text-lg font-black text-slate-900">Your workspace starts with an invitation</h2>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Ask your organization owner for an invitation. Platform operators can provision an empty organization.
                </p>
                <a href="/operator" className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold shadow-xs">
                  Open platform setup
                </a>
              </div>
            )}

            {closed && (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{closed.name}</p>
                <h2 className="text-lg font-black text-slate-900">
                  {closed.status === "pending"
                    ? "Your organization is waiting to be activated"
                    : closed.status === "suspended"
                      ? "Your organization is suspended"
                      : "This organization has been removed"}
                </h2>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {closed.status === "pending"
                    ? "Your service provider is setting it up. You will be able to sign in as soon as it is active."
                    : closed.status === "suspended"
                      ? "Access has been paused. Nothing has been lost. Contact your service provider to restore access."
                      : "It is no longer available. Contact your administrator if you think this is a mistake."}
                </p>
                <button
                  type="button"
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold cursor-pointer"
                  onClick={() => void signOut().then(() => window.location.assign("/login"))}
                >
                  Sign out
                </button>
              </div>
            )}

            {workspace && !closed && (
              <fieldset disabled={busy} className="space-y-6 border-0 p-0 m-0" key={tenant}>
                {tab === "Dashboard" && (
                  <Dashboard
                    workspace={workspace}
                    change={change}
                    ask={(q) => {
                      setAskSeed(q);
                      setIsAskAiOpen(true);
                    }}
                    goto={setTab}
                    selectedUnitId={selectedUnitId}
                    selectedDomain={selectedDomain}
                  />
                )}
                {tab === "KPI Dashboard" && (
                  <KpiDashboardView
                    workspace={workspace}
                    onAskKpi={(k) => {
                      setAskSeed(`Tell me about ${k}`);
                      setIsAskAiOpen(true);
                    }}
                  />
                )}
                {tab === "Actions" && (
                  <ActionCenterView
                    workspace={workspace}
                    change={change}
                  />
                )}
                {tab === "Units" && (
                  <UnitsView
                    workspace={workspace}
                    change={change}
                    onSelectUnit={(uId) => {
                      setSelectedUnitId(uId);
                      setTab("Dashboard");
                    }}
                  />
                )}
                {tab === "Ask" && (
                  <AskPanel tenant={tenant} seed={askSeed} onSeedUsed={() => setAskSeed("")} />
                )}
                {tab === "KPI library" && (
                  <Kpis workspace={workspace} change={change} />
                )}
                {tab === "Data & approvals" && (
                  <div className="space-y-6">
                    <CsvImport workspace={workspace} reload={reload} />
                    <DataEntry
                      workspace={workspace}
                      change={change}
                      tenant={tenant}
                    />
                  </div>
                )}
                {tab === "Organization" &&
                  (workspace.organization.owner ? (
                    <OrgHub
                      workspace={workspace}
                      change={change}
                      goto={setTab}
                      tenant={tenant}
                      reload={reload}
                      governance={<Governance tenant={tenant} workspace={workspace} change={change} />}
                    />
                  ) : (
                    <Organization workspace={workspace} change={change} />
                  ))}
                {tab === "Activity" && <Activity tenant={tenant} />}
              </fieldset>
            )}
          </div>
        </main>
      </div>

      {/* Global Modals & Toasts */}
      <AskAnythingModal
        isOpen={isAskAiOpen}
        onClose={() => {
          setIsAskAiOpen(false);
          setAskSeed("");
        }}
        tenant={tenant}
        initialQuestion={askSeed}
      />
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

type Props = {
  workspace: SaasWorkspace;
  change: (path: string, body: unknown) => Promise<boolean>;
};
function Kpis({ workspace: w, change }: Props) {
  const [search, setSearch] = useState("");
  const [showRetired, setShowRetired] = useState(false);
  const [editing, setEditing] = useState<SaasWorkspace["kpis"][number]>();
  const startEdit = (kpi: SaasWorkspace["kpis"][number]) => {
    setEditing(kpi);
    setTimeout(() => document.getElementById("kpi-form")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  };
  const [limit, setLimit] = useState(25);
  const needle = search.trim().toLowerCase();
  const retiredCount = w.kpis.filter((k) => k.state === "retired").length;
  const matching = w.kpis.filter((k) => showRetired || k.state !== "retired").filter(
    (k) => !needle || `${k.name} ${k.description} ${k.catalogId ?? ""} ${k.state}`.toLowerCase().includes(needle),
  );
  async function measure(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    await change("/measures", {
      key: text(f, "key"),
      name: text(f, "name"),
      unit: text(f, "unit"),
    });
  }
  return (
    <>
      <section className="saas-card">
        <div className="saas-card-title">
          <h2>Your KPIs</h2>
          {w.kpis.length > 8 && (
            <input
              type="search"
              aria-label="Search your KPIs"
              placeholder="Search your KPIs"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setLimit(25);
              }}
              style={{ maxWidth: 280 }}
            />
          )}
        </div>
        {!w.kpis.length ? (
          <p>No KPIs yet.</p>
        ) : (
          <div className="saas-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>KPI</th>
                  <th>Version</th>
                  <th>Unit</th>
                  <th>Target</th>
                  <th>Status</th>
                  <th><span className="sr-only">Manage</span></th>
                </tr>
              </thead>
              <tbody>
                {matching.slice(0, limit).map((k) => (
                  <tr key={k.id}>
                    <td>
                      <strong>{k.name}</strong>
                      <small>{k.description}</small>
                      <details>
                        <summary>Calculation</summary>
                        <pre>{JSON.stringify(k.formula, null, 2)}</pre>
                        <p>
                          Target: {k.target ?? "None"} · {k.direction}
                        </p>
                      </details>
                    </td>
                    <td>{k.version}</td>
                    <td>{k.unit}</td>
                    <td>
                      {k.state !== "retired" && w.organization.owner ? (
                        <TargetEditor key={`${k.id}:${k.target}`} kpi={k} change={change} />
                      ) : (
                        (k.target ?? "—")
                      )}
                    </td>
                    <td>{k.state}</td>
                    <td>
                      <KpiActions w={w} kpi={k} change={change} onEdit={startEdit} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {matching.length > limit && (
          <div className="csv-actions">
            <button type="button" className="secondary" onClick={() => setLimit(limit + 25)}>
              Show {Math.min(25, matching.length - limit)} more of {matching.length - limit}
            </button>
          </div>
        )}
        {needle && matching.length === 0 && <p className="muted">No KPI matches that search.</p>}
        {retiredCount > 0 && (
          <label className="saas-checkbox" style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 10 }}>
            <input type="checkbox" checked={showRetired} onChange={(e) => setShowRetired(e.target.checked)} style={{ width: "auto" }} />
            Show {retiredCount} retired version{retiredCount === 1 ? "" : "s"}
          </label>
        )}
      </section>
      <CatalogBrowser workspace={w} change={change} startOpen={!w.kpis.length} />
      <div className="saas-columns">
        <section className="saas-card">
          <h2>Define an input</h2>
          <p>
            Use aggregate values, such as completed orders or available hours.
            Do not upload individual records.
          </p>
          <form onSubmit={(event) => void measure(event)}>
            <Field title="Measure key">
              <input
                name="key"
                pattern="[a-z][a-z0-9_]*"
                maxLength={64}
                placeholder="completed_orders"
                required
              />
            </Field>
            <Field title="Display name">
              <input name="name" maxLength={120} required />
            </Field>
            <Field title="Unit">
              <input
                name="unit"
                placeholder="orders, hours, INR…"
                maxLength={32}
                required
              />
            </Field>
            <button>Add measure</button>
          </form>
        </section>
        <CustomKpiForm key={editing?.id ?? "new"} workspace={w} change={change} editing={editing} onDone={() => setEditing(undefined)} />
      </div>
    </>
  );
}
function DataEntry({
  workspace: w,
  change,
  tenant,
}: Props & { tenant: string }) {
  const [review, setReview] =
    useState<ReturnType<typeof BatchDetailSchema.parse>>();
  const [error, setError] = useState("");
  const [csv, setCsv] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const f = new FormData(e.currentTarget);
    let rows = w.measures.flatMap((m) =>
      text(f, m.key) ? [{ measure: m.key, value: text(f, m.key) }] : [],
    );
    if (csv.trim()) {
      const lines = csv.trim().split(/\r?\n/);
      if (lines.shift()?.trim() !== "measure,value") {
        setError("CSV must begin with measure,value.");
        return;
      }
      if (lines.some((line) => line.split(",").length !== 2)) {
        setError(
          "Each row must contain exactly a measure key and decimal value.",
        );
        return;
      }
      rows = lines.map((line) => {
        const [measure = "", value = ""] = line.split(",");
        return { measure: measure.trim(), value: value.trim() };
      });
    }
    await change("/batches", {
      idempotencyKey: crypto.randomUUID(),
      unitId: text(f, "unitId"),
      period: { start: text(f, "start"), end: text(f, "end") },
      origin: csv.trim() ? "import" : text(f, "origin"),
      rows,
    });
  }
  async function inspect(id: string) {
    setError("");
    try {
      setReview(
        await request(`/api/saas/${tenant}/batches/${id}`, BatchDetailSchema),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to review.");
    }
  }
  return (
    <>
      <details className="saas-card">
        <summary>
          <strong>Enter figures by hand instead</strong>
        </summary>
        <h2>Submit a reporting period</h2>
        <p>
          Leave unavailable measures blank. To correct a value, submit a new
          batch for the same unit and exact period. Earlier approved inputs
          remain in history.
        </p>
        <form onSubmit={(event) => void submit(event)}>
          <div className="saas-form-grid">
            <Field title="Organization unit">
              <select name="unitId" required>
                {w.units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field title="Period start">
              <input name="start" type="date" required />
            </Field>
            <Field title="Period end">
              <input name="end" type="date" required />
            </Field>
            <Field title="Source">
              <select name="origin">
                <option value="manual">Manual aggregate entry</option>
                <option value="synthetic">Synthetic demonstration</option>
              </select>
            </Field>
          </div>
          <div className="saas-form-grid">
            {w.measures.map((m) => (
              <Field title={`${m.name} (${m.unit})`} key={m.key}>
                <input
                  name={m.key}
                  inputMode="decimal"
                  disabled={!!csv.trim()}
                />
              </Field>
            ))}
          </div>
          <details>
            <summary>Import aggregate CSV instead</summary>
            <p>
              Paste a two-column file. Maximum 500 measures. Format:
              measure,value. Use plain decimal values; no formulas or personal
              records.
            </p>
            <textarea
              aria-label="CSV aggregate data"
              value={csv}
              onChange={(e) => setCsv(e.target.value)}
              placeholder={"measure,value\ncompleted_orders,90"}
              maxLength={60000}
            />
          </details>
          <button disabled={!w.measures.length}>Submit for approval</button>
        </form>
      </details>
      {error && <p role="alert">{error}</p>}
      {review && (
        <section className="saas-card">
          <h2>Review submitted inputs</h2>
          <p>
            {
              w.units.find(
                (u) =>
                  u.id === w.batches.find((b) => b.id === review.id)?.unitId,
              )?.name
            }{" "}
            · {w.batches.find((b) => b.id === review.id)?.start} —{" "}
            {w.batches.find((b) => b.id === review.id)?.end}
          </p>
          <p>
            Status: {review.status}. Confirm units, reporting period and source
            before approval.
          </p>
          <table>
            <thead>
              <tr>
                <th>Measure</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              {review.rows.map((r) => (
                <tr key={r.measure}>
                  <td>{r.measure}</td>
                  <td>{r.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {review.status === "submitted" && (
            <button
              onClick={onClickAsync(async () => {
                await change(`/batches/${review.id}/approve`, {});
                setReview(undefined);
              })}
            >
              Approve & calculate
            </button>
          )}
          {review.status === "submitted" && (
            <button
              className="secondary"
              onClick={onClickAsync(async () => {
                await change(`/batches/${review.id}/reject`, {});
                setReview(undefined);
              })}
            >
              Reject submission
            </button>
          )}
          <button className="secondary" onClick={() => setReview(undefined)}>
            Close review
          </button>
        </section>
      )}
      <section className="saas-card">
        <h2>Submission history</h2>
        {!w.batches.length ? (
          <p>No submissions yet.</p>
        ) : (
          <div className="saas-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Unit</th>
                  <th>Period</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th>Review</th>
                </tr>
              </thead>
              <tbody>
                {w.batches.map((b) => (
                  <tr key={b.id}>
                    <td>{w.units.find((u) => u.id === b.unitId)?.name}</td>
                    <td>
                      {b.start} — {b.end}
                    </td>
                    <td>{b.origin}</td>
                    <td>{b.status}</td>
                    <td>
                      <button
                        className="secondary"
                        onClick={() => void inspect(b.id)}
                      >
                        Inspect inputs
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
function Organization({ workspace: w, change }: Props) {
  return (
    <>
      <div className="saas-columns">
        <section className="saas-card">
          <h2>Organization structure</h2>
          <ul>
            {w.units.map((u) => (
              <li key={u.id}>
                {u.name}{" "}
                <small>
                  · {u.kind}
                  {u.parentId
                    ? ` · under ${w.units.find((p) => p.id === u.parentId)?.name}`
                    : ""}
                </small>
              </li>
            ))}
          </ul>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              void change("/units", {
                name: text(f, "name"),
                kind: text(f, "kind"),
                parentId: text(f, "parentId") || null,
              });
            }}
          >
            <Field title="Unit name">
              <input name="name" required maxLength={120} />
            </Field>
            <Field title="Unit type">
              <input
                name="kind"
                placeholder="Branch, team, department…"
                required
                maxLength={60}
              />
            </Field>
            <Field title="Parent">
              <select name="parentId">
                {w.units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </Field>
            <button>Add unit</button>
          </form>
        </section>
        {w.organization.owner && (
          <section className="saas-card">
            <h2>Create a business role</h2>
            <p>
              Role names do not grant authority. Choose explicit capabilities
              and a unit scope. This form grants all KPIs within that scope.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                void change("/roles", {
                  name: text(f, "name"),
                  grants: f
                    .getAll("capability")
                    .flatMap((capability) => {
                      const selected=f.getAll('kpis');
                      const ids=(capability==='view'||capability==='act')&&selected.length?selected:[null];
                      return ids.map(kpiId=>({capability,unitId:capability==='configure'?null:text(f,'unitId')||null,kpiId}));
                    }),
                });
              }}
            >
              <Field title="Role name">
                <input name="name" required maxLength={120} />
              </Field>
              <Field title="Scope">
                <select name="unitId">
                  <option value="">Entire organization</option>
                  {w.units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} and descendants
                    </option>
                  ))}
                </select>
              </Field>
              {["view", "submit", "approve", "act", "configure"].map((c) => (
                <label className="saas-checkbox" key={c}>
                  <input type="checkbox" name="capability" value={c} />
                  {c === "configure"
                    ? "Configure definitions and units (organization-wide)"
                    : c}
                </label>
              ))}
              <Field title="Visible/actionable KPIs (optional)">
                <select name="kpis" multiple size={Math.min(5,Math.max(2,w.kpis.length))}>
                  {w.kpis.filter(k=>k.state==='active').map(k=><option key={k.id} value={k.id}>{k.name} (all versions)</option>)}
                </select>
              </Field>
              <p>Leave KPI selection empty to include all KPIs in scope. Submit and approve apply to aggregate input data for the selected unit.</p>
              <button>Create role</button>
            </form>
          </section>
        )}
      </div>
      {w.organization.owner && (
        <section className="saas-card">
          <h2>Invite a team member</h2>
          <p>
            Choose one or more roles. The recipient must sign in with this
            verified email before accepting the private invitation.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              void change("/invitations", {
                email: text(f, "email"),
                roleIds: f.getAll("roles"),
              });
            }}
          >
            <Field title="Work email">
              <input name="email" type="email" required />
            </Field>
            {w.roles.map((r) => (
              <label className="saas-checkbox" key={r.id}>
                <input name="roles" type="checkbox" value={r.id} />
                {r.name}
              </label>
            ))}
            <button disabled={!w.roles.length}>
              Create private invitation
            </button>
          </form>
        </section>
      )}
      <section className="saas-card">
        <h2>Members</h2>
        <p>
          There is no fixed number of users or business roles. Member
          identifiers are shown until profile names are configured.
        </p>
        <table>
          <thead>
            <tr>
              <th>Member</th>
              <th>Access</th>
              <th>Status</th>
              <th>Manage</th>
            </tr>
          </thead>
          <tbody>
            {w.members.map((m) => (
              <tr key={m.id}>
                <td>{m.subject === w.subject ? "You" : m.displayName}</td>
                <td>{m.owner ? "Owner" : "Assigned roles"}</td>
                <td>{m.active ? "Active" : "Revoked"}</td>
                <td>
                  {w.organization.owner && !m.owner && m.active && (
                    <button
                      className="secondary"
                      onClick={() => void change(`/members/${m.id}/revoke`, {})}
                    >
                      Revoke access
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {w.organization.owner&&<form onSubmit={e=>{
          e.preventDefault();const f=new FormData(e.currentTarget);
          void change(`/members/${text(f,'member')}/roles`,{roleIds:f.getAll('roles')});
        }}><h3>Replace a member’s role assignments</h3><Field title="Member"><select name="member" required>{w.members.filter(m=>m.active&&!m.owner).map(m=><option key={m.id} value={m.id}>{m.displayName}</option>)}</select></Field>
          {w.roles.map(r=><label className="saas-checkbox" key={r.id}><input type="checkbox" name="roles" value={r.id}/>{r.name}</label>)}
          <p>This replaces all existing assignments. Selecting none removes all role capabilities.</p><button disabled={!w.members.some(m=>m.active&&!m.owner)}>Replace assignments</button></form>}
      </section>
    </>
  );
}

function Activity({ tenant }: { tenant: string }) {
  const [rows, setRows] = useState<
    ReturnType<typeof AuditResponseSchema.parse>
  >([]);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    request(`/api/saas/${tenant}/audit`, AuditResponseSchema)
      .then((r) => {
        if (active) setRows(r);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [tenant]);
  return (
    <section className="saas-card">
      <h2>Recent changes</h2>
      <p>
        Latest 200 events. Audit events record operations without copying input
        values.
      </p>
      {error && <p role="alert">{error}</p>}
      <table>
        <thead>
          <tr>
            <th>When</th>
            <th>Event</th>
            <th>Actor</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{r.createdAt}</td>
              <td>{r.event}</td>
              <td>{r.subject}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
function Governance({
  tenant,
  workspace: w,
  change,
}: Props & { tenant: string }) {
  const [proposals, setProposals] = useState<
    ReturnType<typeof ProposalListSchema.parse>
  >([]);
  const [selfApproval, setSelfApproval] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    let live = true;
    Promise.all([
      request(`/api/saas/${tenant}/proposals`, ProposalListSchema),
      request(`/api/saas/${tenant}/settings`, SettingsSchema),
    ])
      .then(([p, s]) => {
        if (live) {
          setProposals(p);
          setSelfApproval(s.allowSelfApproval);
        }
      })
      .catch((e) => {
        if (live) setMessage(e.message);
      });
    return () => {
      live = false;
    };
  }, [tenant]);
  return (
    <>
      <section className="saas-card">
        <h2>Approval policy</h2>
        <p>
          By default, another member must approve a submission. Small
          organizations can explicitly allow the submitter to approve their own
          data. This change is audited.
        </p>
        <label className="saas-checkbox">
          <input
            type="checkbox"
            checked={selfApproval}
            onChange={(e) => setSelfApproval(e.target.checked)}
          />
          Allow self-approval of data
        </label>
        <button
          onClick={() =>
            void change("/settings", { allowSelfApproval: selfApproval })
          }
        >
          Save approval policy
        </button>
        <h3>Close a reporting period</h3>
        <p>
          Closing a period prevents overlapping submissions and approvals.
          Reopening is not available in this pilot; confirm the dates carefully.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            void change("/period-locks", {
              unitId: text(f, "unitId"),
              period: { start: text(f, "start"), end: text(f, "end") },
            });
          }}
        >
          <div className="saas-form-grid">
            <Field title="Unit">
              <select name="unitId">
                {w.units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field title="Start">
              <input type="date" name="start" required />
            </Field>
            <Field title="End">
              <input type="date" name="end" required />
            </Field>
          </div>
          <label className="saas-checkbox">
            <input type="checkbox" required />I confirm this period is ready to
            close.
          </label>
          <button>Close period</button>
        </form>
      </section>
      <section className="saas-card">
        <h2>Setup proposals</h2>
        <p>
          Platform proposals contain configuration only. Accepting imports draft
          definitions; you still approve activation in the KPI library.
          Suggested roles apply organization-wide.
        </p>
        {message && <p role="alert">{message}</p>}
        {!proposals.length && <p>No setup proposals.</p>}
        {proposals.map((p) => (
          <div className="saas-observation" key={p.id}>
            <h3>{p.configuration.title}</h3>
            <p>Status: {p.state}</p>
            <ul>
              {p.configuration.measures.map((m) => (
                <li key={m.key}>
                  Input: {m.name} · {m.unit}
                </li>
              ))}
              {p.configuration.kpis.map((k) => (
                <li key={k.key}>
                  KPI: {k.name} — {k.description} · {k.unit} · target{" "}
                  {k.target ?? "none"}
                  <pre>{JSON.stringify(k.formula, null, 2)}</pre>
                </li>
              ))}
              {p.configuration.roles.map((r) => (
                <li key={r.name}>
                  Role: {r.name} · {r.capabilities.join(", ")}
                </li>
              ))}
            </ul>
            {p.state === "pending" && (
              <>
                <button
                  onClick={() => void change(`/proposals/${p.id}/accept`, {})}
                >
                  Accept setup as drafts
                </button>{" "}
                <button
                  className="secondary"
                  onClick={() => void change(`/proposals/${p.id}/reject`, {})}
                >
                  Reject proposal
                </button>
              </>
            )}
          </div>
        ))}
      </section>
    </>
  );
}
export function InvitationRoute() {
  const [token] = useState(() => window.location.hash.slice(1));
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  // Who is signed in, so a person can see at once whether it is the invited account.
  const [signedInAs, setSignedInAs] = useState<string | null>();
  useEffect(() => {
    void getCurrentSession().then((session) => setSignedInAs(session?.user.email ?? null));
  }, []);
  return (
    <main className="saas-auth">
      <p className="eyebrow">YOUR WORKSPACE INVITATION</p>
      <h1>Join your organization</h1>
      <p>
        Sign in with the email that received this invitation, then accept. Your
        organization controls your access.
      </p>
      {signedInAs !== undefined && (
        <p className="warn" style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          {signedInAs ? (
            <>
              <span>
                You are signed in as <strong>{signedInAs}</strong>. If that is not the invited email, sign out first.
              </span>
              <button type="button" className="secondary" onClick={() => void signOut().then(() => window.location.reload())}>
                Sign out
              </button>
            </>
          ) : (
            <span>You are not signed in. Sign in (or create your account) with the invited email, then come back to this link.</span>
          )}
        </p>
      )}
      <button
        disabled={busy || !token}
        onClick={onClickAsync(async () => {
          setBusy(true);
          try {
            await mutate("/api/saas/invitations/accept", { token });
            window.history.replaceState(null, "", "/invite");
            window.location.assign("/");
          } catch (e) {
            setMessage(
              e instanceof Error ? e.message : "Unable to accept invitation.",
            );
          } finally {
            setBusy(false);
          }
        })}
      >
        Accept invitation
      </button>
      <output>{message}</output>
      <p>
        Keep this invitation link private. If you need to sign in, open sign-in
        in a separate tab and return here.
      </p>
      <a href="/login" target="_blank" rel="noreferrer">
        Sign in
      </a>
      <details>
        <summary>Create a sign-in account</summary>
        <p>
          Use the invited email. Confirm it using the email from the sign-in
          service, then return to this invitation.
        </p>
        <form
          onSubmit={onSubmitAsync(async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            setBusy(true);
            try {
              const client = await getAuthClient();
              const { error } = await client.auth.signUp({
                email: text(f, "email"),
                password: text(f, "password"),
              });
              setMessage(
                error
                  ? "Unable to create account. Check the email and password requirements."
                  : "Check your email to confirm your account, then sign in and accept this invitation.",
              );
            } catch {
              setMessage("Sign-in service unavailable.");
            } finally {
              setBusy(false);
            }
          })}
        >
          <label>
            Email
            <input name="email" type="email" required autoComplete="email" />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              minLength={12}
              required
              autoComplete="new-password"
            />
          </label>
          <button disabled={busy}>Create account</button>
        </form>
      </details>
    </main>
  );
}
