import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ControlOrganizationListSchema,
  InviteMembersResponseSchema,
  MutationResponseSchema,
  ProvisionResponseSchema,
  TemplateListSchema,
  type TemplateSummary,
} from "@orbit/contracts";
import { getCurrentSession, signOut } from "../../lib/auth";
import { mutate, request } from "../saas/client";
import { invitationCsv, parsePeople, type Person, type RoleOption } from "./people";
import "../saas/saas.css";
import "../saas/v2.css";

type Organizations = ReturnType<typeof ControlOrganizationListSchema.parse>;
interface Issued {
  email: string;
  roleKeys: string[];
  token: string;
}

const onSubmitAsync =
  (fn: (event: FormEvent<HTMLFormElement>) => Promise<void>) =>
  (event: FormEvent<HTMLFormElement>) => {
    void fn(event);
  };
const link = (token: string) => `${window.location.origin}/invite#${token}`;

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

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

/** Invitation links, shown once, with copy and download. */
function Links({ owner, members, title }: { owner?: string; members: Issued[]; title: string }) {
  const [copied, setCopied] = useState("");
  const all = [...(owner ? [{ email: "Organization owner", roleKeys: ["owner"], token: owner }] : []), ...members];
  async function copy(text: string, id: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(""), 1500);
    } catch {
      setCopied("");
    }
  }
  return (
    <section>
      <h2>{title}</h2>
      <p className="warn">
        These links are shown only now. Send each one privately to its person.
        Each works once, for the matching email, and expires in seven days.
      </p>
      <table className="console-links">
        <thead>
          <tr>
            <th>Person</th>
            <th>Roles</th>
            <th>Invitation link</th>
            <th><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {all.map((m) => (
            <tr key={m.token}>
              <td>{m.email}</td>
              <td>{m.roleKeys.join(", ")}</td>
              <td>
                <input readOnly value={link(m.token)} onFocus={(e) => e.target.select()} aria-label={`Invitation for ${m.email}`} />
              </td>
              <td>
                <button type="button" className="secondary" onClick={() => void copy(link(m.token), m.token)}>
                  {copied === m.token ? "Copied" : "Copy"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ display: "flex", gap: 10 }}>
        <button
          type="button"
          className="secondary"
          onClick={() =>
            download(
              "invitation-links.csv",
              invitationCsv(
                all.map((m) => ({ ...m, email: m.email })),
                window.location.origin,
              ),
            )
          }
        >
          Download all links (CSV)
        </button>
      </div>
    </section>
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
  const [issued, setIssued] = useState<{ title: string; owner?: string; members: Issued[] }>();
  const [addTo, setAddTo] = useState("");
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
        ...(templateId ? { templateId } : {}),
        members: people.map((p) => ({ email: p.email.trim(), roleKeys: p.roleKeys })),
      });
      setIssued({ title: "Organization created", owner: result.token, members: result.members });
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
      setIssued({ title: "People invited", members: result.members });
      setMessage(`${result.members.length} invitation${result.members.length === 1 ? "" : "s"} created.`);
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
        <div>
          <button disabled={busy}>{busy ? "Creating…" : "Create organization"}</button>
        </div>
      </form>
      {message && <output className="saas-message">{message}</output>}
      {issued && <Links title={issued.title} owner={issued.owner} members={issued.members} />}

      <section>
        <h2>Organizations</h2>
        {organizations.length === 0 ? (
          <p className="muted">No organizations yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
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
                    <td>{t?.name ?? (o.templateId ? o.templateId : "None")}</td>
                    <td>
                      {t && addTo !== o.id && (
                        <button type="button" className="secondary" onClick={() => { setAddTo(o.id); setMorePeople([]); }}>
                          Add people
                        </button>
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
