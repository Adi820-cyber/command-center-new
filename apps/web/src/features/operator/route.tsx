import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ControlOrganizationListSchema,
  InviteMembersResponseSchema,
  MutationResponseSchema,
  PurgeOrganizationResponseSchema,
  ProvisionResponseSchema,
  TemplateListSchema,
  type TemplateSummary,
} from "@orbit/contracts";
import { getCurrentSession, signOut } from "../../lib/auth";
import { mutate, request } from "../saas/client";
import { parsePeople, type Person, type RoleOption } from "./people";
import { AccessPanel, type IssuedSet } from "../saas/access-panel";
import "../saas/saas.css";
import "../saas/v2.css";

type Organizations = ReturnType<typeof ControlOrganizationListSchema.parse>;

const onSubmitAsync =
  (fn: (event: FormEvent<HTMLFormElement>) => Promise<void>) =>
  (event: FormEvent<HTMLFormElement>) => {
    void fn(event);
  };


/** Rows of email + roles, with a box to paste a whole list. */
function PeopleEditor({
  roles,
  people,
  setPeople,
}: {
  roles: readonly RoleOption[];
  people: Person[];
  setPeople: (people: Person[]) => void;
}) {
  const [paste, setPaste] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  function addPasted() {
    const parsed = parsePeople(paste, roles);
    setErrors(parsed.errors);
    const have = new Set(people.map((p) => p.email.toLowerCase()));
    const fresh = parsed.people.filter((p) => !have.has(p.email.toLowerCase()));
    if (fresh.length) setPeople([...people, ...fresh]);
    if (!parsed.errors.length) setPaste("");
  }
  const update = (index: number, change: Partial<Person>) =>
    setPeople(people.map((p, i) => (i === index ? { ...p, ...change } : p)));
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <details>
        <summary>Paste a list of people</summary>
        <p className="muted">
          One person per line: an email, a comma, then the role or roles
          separated by semicolons. For example{" "}
          <code>anita@acme.com, operations; data reviewer</code>
        </p>
        <textarea
          aria-label="List of people"
          value={paste}
          onChange={(e) => setPaste(e.target.value)}
          placeholder={"ceo@acme.com, executive\nentry1@acme.com, data_contributor"}
        />
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <button type="button" className="secondary" onClick={addPasted} disabled={!paste.trim()}>
            Add these people
          </button>
        </div>
        {errors.length > 0 && (
          <ul className="errors" role="alert">
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        )}
      </details>
      {people.length > 0 && (
        <table className="people-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Roles</th>
              <th><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {people.map((p, i) => (
              <tr key={i}>
                <td>
                  <input
                    aria-label={`Email of person ${i + 1}`}
                    type="email"
                    value={p.email}
                    onChange={(e) => update(i, { email: e.target.value })}
                    placeholder="name@company.com"
                  />
                </td>
                <td>
                  <div className="console-roles">
                    {roles.map((r) => (
                      <label key={r.key}>
                        <input
                          type="checkbox"
                          aria-label={r.name}
                          checked={p.roleKeys.includes(r.key)}
                          onChange={(e) =>
                            update(i, {
                              roleKeys: e.target.checked
                                ? [...p.roleKeys, r.key]
                                : p.roleKeys.filter((k) => k !== r.key),
                            })
                          }
                        />
                        {r.name}
                      </label>
                    ))}
                  </div>
                </td>
                <td>
                  <button type="button" className="secondary" onClick={() => setPeople(people.filter((_, j) => j !== i))}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div>
        <button type="button" className="secondary" onClick={() => setPeople([...people, { email: "", roleKeys: [] }])}>
          + Add a person
        </button>{" "}
        <span className="muted">{people.length} {people.length === 1 ? "person" : "people"}</span>
      </div>
    </div>
  );
}


type Access = "checking" | "granted" | "denied";

export function OperatorConsoleRoute() {
  const [access, setAccess] = useState<Access>("checking");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [organizations, setOrganizations] = useState<Organizations>([]);
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [templateId, setTemplateId] = useState("");
  const [people, setPeople] = useState<Person[]>([]);
  const [issued, setIssued] = useState<IssuedSet>();
  const [addTo, setAddTo] = useState("");
  const [confirming, setConfirming] = useState<{ id: string; kind: "delete" | "erase"; typed: string }>();
  const [morePeople, setMorePeople] = useState<Person[]>([]);

  useEffect(() => {
    let active = true;
    void getCurrentSession().then((session) => {
      if (active) setEmail(session?.user.email ?? "");
    });
    // Find out first whether this account is a platform operator, so a customer
    // account gets an explanation instead of a form that cannot work.
    request("/api/control/me", MutationResponseSchema)
      .then(() => {
        if (!active) return;
        setAccess("granted");
        request("/api/control/organizations", ControlOrganizationListSchema)
          .then((rows) => active && setOrganizations(rows))
          .catch((e) => active && setMessage(e.message));
        request("/api/control/templates", TemplateListSchema)
          .then((rows) => active && setTemplates(rows))
          .catch((e) => active && setMessage(`The industry templates could not be loaded: ${e.message}`));
      })
      .catch((e) => {
        if (!active) return;
        setAccess("denied");
        setMessage(e instanceof Error ? e.message : "Access could not be checked.");
      });
    return () => {
      active = false;
    };
  }, []);

  const byId = useMemo(() => new Map(templates.map((t) => [t.id, t])), [templates]);
  const template = byId.get(templateId);
  const roleOptions: RoleOption[] = template?.roles.map((r) => ({ key: r.key, name: r.name })) ?? [];
  const industries = useMemo(() => [...new Set(templates.map((t) => t.industry))], [templates]);

  function checkPeople(list: Person[]): string | null {
    for (const [i, p] of list.entries()) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email.trim())) return `Person ${i + 1}: enter a valid email address.`;
      if (p.roleKeys.length === 0) return `${p.email}: choose at least one role.`;
    }
    return null;
  }

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const field = (name: string) => {
      const value = data.get(name);
      return typeof value === "string" ? value : "";
    };
    const problem = checkPeople(people);
    if (problem) {
      setMessage(problem);
      return;
    }
    setBusy(true);
    setIssued(undefined);
    setMessage("");
    try {
      const result = await request("/api/control/organizations", ProvisionResponseSchema, {
        name: field("name"),
        ownerEmail: field("email"),
        ownerEmailVerified: true,
        activate: data.get("activate") === "on",
        ...(templateId ? { templateId } : {}),
        members: people.map((p) => ({ email: p.email.trim(), roleKeys: p.roleKeys })),
      });
      setIssued({ title: "Organization created", mode: result.mode, people: [result.owner, ...result.members] });
      setMessage(
        template
          ? `Created from “${template.name}”: ${template.kpiCount} KPIs and ${template.roles.length} roles are ready.`
          : "Organization created, empty.",
      );
      setPeople([]);
      setOrganizations(await request("/api/control/organizations", ControlOrganizationListSchema));
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Unable to provision organization.");
    } finally {
      setBusy(false);
    }
  }

  // The time, kept current while the page is open, to decide whether a deleted organization may be erased.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);
  const canErase = (purgeAfter: string | null) => purgeAfter !== null && new Date(purgeAfter).getTime() <= now;

  const refresh = async () => setOrganizations(await request("/api/control/organizations", ControlOrganizationListSchema));

  /** Moves an organization to a new status, then refreshes the list. */
  async function moveTo(org: Organizations[number], status: "active" | "suspended" | "deleted", confirmName?: string) {
    setBusy(true);
    setMessage("");
    try {
      await request(`/api/control/organizations/${org.id}/status`, MutationResponseSchema, { status, ...(confirmName ? { confirmName } : {}) });
      await refresh();
      setMessage(
        status === "active"
          ? `“${org.name}” is active.`
          : status === "suspended"
            ? org.status === "deleted"
              ? `“${org.name}” was restored. It is suspended until you activate it.`
              : `“${org.name}” is suspended. Nobody in it can work until you activate it again.`
            : `“${org.name}” was deleted. You can restore it for 30 days, then delete it permanently.`,
      );
      setConfirming(undefined);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "That did not work.");
    } finally {
      setBusy(false);
    }
  }

  async function erase(org: Organizations[number], confirmName: string) {
    setBusy(true);
    setMessage("");
    try {
      const result = await request(`/api/control/organizations/${org.id}/purge`, PurgeOrganizationResponseSchema, { confirmName });
      await refresh();
      setMessage(
        `“${org.name}” was permanently deleted, with ${result.removedLogins} login${result.removedLogins === 1 ? "" : "s"} removed.` +
          (result.failedLogins ? ` ${result.failedLogins} could not be removed; delete them in Supabase.` : ""),
      );
      setConfirming(undefined);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "That did not work.");
    } finally {
      setBusy(false);
    }
  }

  async function addMembers(tenantId: string) {
    const problem = checkPeople(morePeople);
    if (problem || morePeople.length === 0) {
      setMessage(problem ?? "Add at least one person.");
      return;
    }
    setBusy(true);
    setIssued(undefined);
    try {
      const result = await request(`/api/control/organizations/${tenantId}/members`, InviteMembersResponseSchema, {
        members: morePeople.map((p) => ({ email: p.email.trim(), roleKeys: p.roleKeys })),
      });
      setIssued({ title: result.mode === "logins" ? "People added" : "People invited", mode: result.mode, people: result.members });
      setMessage(
        result.mode === "logins"
          ? `${result.members.length} ${result.members.length === 1 ? "person" : "people"} added with a login.`
          : `${result.members.length} invitation${result.members.length === 1 ? "" : "s"} created.`,
      );
      setMorePeople([]);
      setAddTo("");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Unable to add people.");
    } finally {
      setBusy(false);
    }
  }

  if (access !== "granted") {
    return (
      <main className="saas-console">
        <p className="eyebrow">PLATFORM SETUP</p>
        <h1>{access === "checking" ? "Checking your access…" : "This account is not a platform operator"}</h1>
        {access === "denied" && (
          <>
            <p>
              {email ? <>You are signed in as <strong>{email}</strong>. </> : null}
              Only platform operator accounts can create organizations. A customer account (an owner or a member) works in its own workspace instead.
            </p>
            <p className="muted">{message}</p>
            <div className="csv-actions">
              <a href="/">
                <button type="button">Open my workspace</button>
              </a>
              <button
                type="button"
                className="secondary"
                onClick={() => void signOut().then(() => window.location.assign("/login"))}
              >
                Sign out and use another account
              </button>
            </div>
          </>
        )}
      </main>
    );
  }

  return (
    <main className="saas-console">
      <a href="/">← Customer workspace</a>
      <p className="muted" style={{ margin: "6px 0 0" }}>
        Signed in as <strong>{email || "…"}</strong> ·{" "}
        <button
          type="button"
          className="secondary"
          style={{ padding: "2px 8px", fontSize: 12 }}
          onClick={() => void signOut().then(() => window.location.assign("/login"))}
        >
          Sign out
        </button>
      </p>
      <p className="eyebrow">PLATFORM SETUP</p>
      <h1>Create an organization</h1>
      <p>
        Start from an industry template. It sets up the KPIs, the roles and what
        each role can see. Then add the people and give each one their roles.
        This console never shows customer figures.
      </p>

      <form onSubmit={(event) => void create(event)}>
        <div className="console-grid">
          <label>
            Organization name
            <input name="name" required maxLength={120} />
          </label>
          <label>
            Owner’s sign-in email
            <input name="email" type="email" required />
          </label>
        </div>
        <label>
          Industry template
          <select value={templateId} onChange={(e) => { setTemplateId(e.target.value); setPeople([]); }}>
            <option value="">Empty organization (no template)</option>
            {industries.map((industry) => (
              <optgroup key={industry} label={industry.replaceAll("_", " ")}>
                {templates
                  .filter((t) => t.industry === industry)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
        </label>
        {template && (
          <div className="console-template">
            <strong>{template.name}</strong>
            <span>{template.description}</span>
            <span className="muted">
              {template.kpiCount} KPIs across {template.roles.length} roles. A person sees only the KPIs of their roles.
            </span>
            <details>
              <summary>Roles in this template</summary>
              <table>
                <thead>
                  <tr>
                    <th>Role</th>
                    <th>What it is for</th>
                    <th>KPIs</th>
                    <th>Can</th>
                  </tr>
                </thead>
                <tbody>
                  {template.roles.map((r) => (
                    <tr key={r.key}>
                      <td>{r.name}</td>
                      <td>{r.description}</td>
                      <td>{r.kpiCount}</td>
                      <td>{r.capabilities.map((c) => ({ act: "assign actions", submit: "upload data", approve: "approve data", configure: "configure", view: "view" })[c]).join(", ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          </div>
        )}
        {template ? (
          <>
            <h2>People</h2>
            <PeopleEditor roles={roleOptions} people={people} setPeople={setPeople} />
          </>
        ) : (
          <p className="muted">Choose a template to add people with roles.</p>
        )}
        <div className="console-checks">
          <label className="check-line">
            <input type="checkbox" name="verified" required />
            <span>
              I have verified that this email address belongs to the owner.
              <small className="muted"> The owner signs in with a temporary password and must choose their own.</small>
            </span>
          </label>
          <label className="check-line">
            <input type="checkbox" name="activate" defaultChecked />
            <span>
              Activate immediately.
              <small className="muted"> Untick to keep it pending; nobody can work in it until you activate it.</small>
            </span>
          </label>
        </div>
        <div>
          <button disabled={busy}>{busy ? "Creating…" : "Create organization"}</button>
        </div>
      </form>
      {message && <output className="saas-message">{message}</output>}
      {issued && <AccessPanel set={issued} />}

      <section>
        <h2>Organizations</h2>
        {organizations.length === 0 ? (
          <p className="muted">No organizations yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th>Owner</th>
                <th>Template</th>
                <th><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {organizations.map((o) => {
                const t = o.templateId ? byId.get(o.templateId) : undefined;
                return (
                  <tr key={o.id}>
                    <td>
                      {o.name}
                      {addTo === o.id && t && (
                        <div style={{ marginTop: 12 }}>
                          <PeopleEditor
                            roles={t.roles.map((r) => ({ key: r.key, name: r.name }))}
                            people={morePeople}
                            setPeople={setMorePeople}
                          />
                          <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                            <button type="button" disabled={busy} onClick={() => void addMembers(o.id)}>
                              Create invitations
                            </button>
                            <button type="button" className="secondary" onClick={() => { setAddTo(""); setMorePeople([]); }}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`saas-badge ${o.status === "active" ? "good" : o.status === "pending" ? "" : "bad"}`}>{o.status}</span>
                      {o.status === "deleted" && o.purgeAfter && (
                        <small className="muted" style={{ display: "block", marginTop: 4 }}>
                          Permanent deletion from {new Date(o.purgeAfter).toLocaleDateString()}
                        </small>
                      )}
                    </td>
                    <td>
                      {o.ownerEmail ?? "—"}
                      {o.ownerEmailVerifiedAt && (
                        <small className="muted" style={{ display: "block" }}>
                          email verified {new Date(o.ownerEmailVerifiedAt).toLocaleDateString()}
                        </small>
                      )}
                    </td>
                    <td>{t?.name ?? (o.templateId ? o.templateId : "None")}</td>
                    <td>
                      <div className="csv-actions" style={{ marginTop: 0 }}>
                        {(o.status === "pending" || o.status === "suspended") && (
                          <button type="button" disabled={busy} onClick={() => void moveTo(o, "active")}>Activate</button>
                        )}
                        {o.status === "active" && (
                          <button type="button" className="secondary" disabled={busy} onClick={() => void moveTo(o, "suspended")}>Suspend</button>
                        )}
                        {o.status === "deleted" && (
                          <button type="button" disabled={busy} onClick={() => void moveTo(o, "suspended")}>Restore</button>
                        )}
                        {t && addTo !== o.id && o.status !== "deleted" && (
                          <button type="button" className="secondary" onClick={() => { setAddTo(o.id); setMorePeople([]); }}>
                            Add people
                          </button>
                        )}
                        {o.status !== "deleted" && (
                          <button type="button" className="secondary" disabled={busy} onClick={() => setConfirming({ id: o.id, kind: "delete", typed: "" })}>
                            Delete
                          </button>
                        )}
                        {o.status === "deleted" && (
                          <button
                            type="button"
                            className="secondary"
                            disabled={busy || !canErase(o.purgeAfter)}
                            title={canErase(o.purgeAfter) ? undefined : "Allowed after the 30-day restore window"}
                            onClick={() => setConfirming({ id: o.id, kind: "erase", typed: "" })}
                          >
                            Delete permanently
                          </button>
                        )}
                      </div>
                      {confirming?.id === o.id && (
                        <div className="warn" style={{ marginTop: 10 }}>
                          <p style={{ margin: "0 0 8px" }}>
                            {confirming.kind === "delete"
                              ? "Everyone in this organization is blocked at once. Nothing is erased, and you can restore it for 30 days."
                              : "This erases the organization's data and the logins that belong only to it. It cannot be undone."}
                            {" "}Type <strong>{o.name}</strong> to confirm.
                          </p>
                          <input
                            aria-label="Type the organization name to confirm"
                            value={confirming.typed}
                            onChange={(e) => setConfirming({ ...confirming, typed: e.target.value })}
                          />
                          <div className="csv-actions">
                            <button
                              type="button"
                              disabled={busy || confirming.typed.trim() !== o.name}
                              onClick={() => void (confirming.kind === "delete" ? moveTo(o, "deleted", confirming.typed.trim()) : erase(o, confirming.typed.trim()))}
                            >
                              {confirming.kind === "delete" ? "Delete organization" : "Delete permanently"}
                            </button>
                            <button type="button" className="secondary" onClick={() => setConfirming(undefined)}>Cancel</button>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      <section>
        <h2>Propose a starter KPI</h2>
        <details>
          <summary>For organizations without a template</summary>
          <p>
            The customer reviews this setup proposal. It creates a draft, never
            an automatically activated calculation.
          </p>
          <form
            onSubmit={onSubmitAsync(async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              const v = (key: string) => {
                const value = f.get(key);
                return typeof value === "string" ? value.trim() : "";
              };
              setBusy(true);
              const percent = v("calculation") === "percent";
              const measureUnit = v("measureUnit");
              try {
                await mutate(`/api/control/organizations/${v("tenant")}/proposals`, {
                  title: v("name"),
                  measures: [
                    { key: v("inputA"), name: v("inputA"), unit: measureUnit },
                    ...(percent ? [{ key: v("inputB"), name: v("inputB"), unit: measureUnit }] : []),
                  ],
                  kpis: [
                    {
                      key: v("key"),
                      name: v("name"),
                      description: v("description"),
                      unit: percent ? "%" : measureUnit,
                      formula: percent
                        ? { op: "percent", left: { op: "measure", key: v("inputA") }, right: { op: "measure", key: v("inputB") } }
                        : { op: "measure", key: v("inputA") },
                      direction: "neutral",
                      target: null,
                    },
                  ],
                  roles: [],
                });
                setMessage("Proposal sent for customer review.");
              } catch (error) {
                setMessage(error instanceof Error ? error.message : "Unable to propose setup.");
              } finally {
                setBusy(false);
              }
            })}
          >
            <label>
              Organization
              <select name="tenant" required>
                {organizations.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="console-grid">
              <label>
                KPI name
                <input name="name" required maxLength={120} />
              </label>
              <label>
                KPI key
                <input name="key" required pattern="[a-z][a-z0-9_]*" />
              </label>
            </div>
            <label>
              Business definition
              <input name="description" required maxLength={2000} />
            </label>
            <div className="console-grid">
              <label>
                Calculation
                <select name="calculation">
                  <option value="direct">Direct measure</option>
                  <option value="percent">A ÷ B × 100</option>
                </select>
              </label>
              <label>
                Input unit
                <input name="measureUnit" required placeholder="orders, hours…" />
              </label>
              <label>
                Input A key
                <input name="inputA" required pattern="[a-z][a-z0-9_]*" />
              </label>
              <label>
                Input B key (for percentage)
                <input name="inputB" pattern="[a-z][a-z0-9_]*" />
              </label>
            </div>
            <div>
              <button disabled={busy || !organizations.length}>Send setup proposal</button>
            </div>
          </form>
        </details>
      </section>
    </main>
  );
}
