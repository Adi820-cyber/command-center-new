import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  InviteMembersResponseSchema,
  RequestRoleOtpResponseSchema,
  ResetPasswordResponseSchema,
  roleDraftFromGrants,
  TemplateListSchema,
  type Capability,
  type SaasWorkspace,
  type TemplateSummary,
} from "@orbit/contracts";
import { AccessPanel, type IssuedSet } from "./access-panel";
import { request } from "./client";
import { domainTitle } from "./domains";
import { parseEmails } from "./emails";
import { OrgKpis } from "./org-kpis";

type Change = (path: string, body: unknown) => Promise<boolean>;
type Section = "Overview" | "Roles & Permissions" | "KPIs (Predefined & Custom)" | "People & Logins" | "Units & Structure";
const SECTIONS: Section[] = ["Overview", "Roles & Permissions", "KPIs (Predefined & Custom)", "People & Logins", "Units & Structure"];

const CAPABILITIES: { key: Capability; label: string; help: string }[] = [
  { key: "view", label: "See results", help: "Sees the chosen KPIs on their dashboard and in Ask." },
  { key: "act", label: "Assign actions", help: "Can turn a result into an action for someone to follow up." },
  { key: "submit", label: "Upload data", help: "Can download the CSV format and upload figures." },
  { key: "approve", label: "Approve data", help: "Checks uploaded figures and publishes the results." },
  { key: "configure", label: "Set up KPIs and units", help: "Can add units, inputs and draft KPIs for the whole organization." },
];
const capabilityLabel = (c: Capability) => CAPABILITIES.find((x) => x.key === c)?.label ?? c;

/**
 * The owner's home: run the organization without asking anyone. Rename it, see
 * what is left to set up, decide what every role can do and see, manage people
 * and the unit structure.
 */
export function OrgHub({
  workspace: w,
  change,
  goto,
  governance,
  tenant,
  reload,
  initialSection = "Overview",
}: {
  workspace: SaasWorkspace;
  change: Change;
  /** The organization's id, for calls that do not go through `change`. */
  tenant: string;
  /** Reloads the workspace after a change made outside `change`. */
  reload: () => Promise<void>;
  /** Opens another workspace tab, such as "KPI library". */
  goto: (tab: "KPI library" | "Data & approvals" | "Dashboard") => void;
  /** Approval policy and setup proposals, owned by the page. */
  governance?: ReactNode;
  /** Initial section to open */
  initialSection?: Section;
}) {
  const [section, setSection] = useState<Section>(initialSection);

  useEffect(() => {
    if (initialSection) {
      setSection(initialSection);
    }
  }, [initialSection]);
  return (
    <>
      <nav className="hub-tabs" aria-label="Organization">
        {SECTIONS.map((s) => (
          <button key={s} type="button" className={s === section ? "selected" : ""} aria-current={s === section ? "page" : undefined} onClick={() => setSection(s)}>
            {s}
          </button>
        ))}
      </nav>
      {section === "Overview" && <Overview w={w} change={change} goto={goto} open={setSection} governance={governance} />}
      {section === "Roles & Permissions" && <Roles w={w} change={change} tenant={tenant} reload={reload} />}
      {section === "KPIs (Predefined & Custom)" && <OrgKpis workspace={w} change={change} reload={reload} />}
      {section === "People & Logins" && <People w={w} change={change} tenant={tenant} reload={reload} />}
      {section === "Units & Structure" && <Units w={w} change={change} />}
    </>
  );
}

// ---------------------------------------------------------------------------

function Overview({
  w,
  change,
  goto,
  open,
  governance,
}: {
  w: SaasWorkspace;
  change: Change;
  goto: (tab: "KPI library" | "Data & approvals" | "Dashboard") => void;
  open: (s: Section) => void;
  governance: ReactNode;
}) {
  const [name, setName] = useState(w.organization.name);
  const active = w.kpis.filter((k) => k.state === "active");
  const withTarget = active.filter((k) => k.target !== null).length;
  const people = w.members.filter((m) => m.active && !m.owner);
  const peopleWithRoles = people.filter((m) => m.roleIds.length > 0).length;
  const fresh = w.kpis.length === 0 && w.roles.length === 0;
  const steps: { done: boolean; title: string; detail: string; action: () => void; cta: string }[] = [
    {
      done: !fresh,
      title: "Starting point",
      detail: fresh
        ? "Start from an industry template, or build your roles and KPIs yourself."
        : `${w.kpis.length} KPIs and ${w.roles.length} roles. Change any of them at any time.`,
      action: () => (fresh ? document.getElementById("starting-point")?.scrollIntoView({ behavior: "smooth" }) : open("KPIs (Predefined & Custom)")),
      cta: fresh ? "Choose" : "KPIs",
    },
    {
      done: w.units.length > 1,
      title: "Your structure",
      detail: w.units.length > 1 ? `${w.units.length} units` : "Add branches, sites or departments, so figures can be reported and rolled up per unit.",
      action: () => open("Units & Structure"),
      cta: "Units",
    },
    {
      done: w.roles.length > 0,
      title: "Roles and what they see",
      detail: w.roles.length ? `${w.roles.length} roles` : "Create roles and choose which KPIs each one sees.",
      action: () => open("Roles & Permissions"),
      cta: "Roles & Permissions",
    },
    {
      done: people.length > 0 && peopleWithRoles === people.length,
      title: "People with roles",
      detail: people.length ? `${peopleWithRoles} of ${people.length} people have a role` : "Invite your team and give each person a role.",
      action: () => open("People & Logins"),
      cta: "People & Logins",
    },
    {
      done: active.length > 0 && withTarget === active.length,
      title: "Targets",
      detail: active.length ? `${withTarget} of ${active.length} KPIs have a target. Without one, nothing can be on or off target.` : "Add KPIs first.",
      action: () => open("KPIs (Predefined & Custom)"),
      cta: "Set KPIs & Targets",
    },
    {
      done: w.results.length > 0,
      title: "First figures",
      detail: w.results.length ? "Results are being calculated." : "Upload a CSV for a reporting period and approve it.",
      action: () => goto("Data & approvals"),
      cta: "Data & approvals",
    },
  ];
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <>
      {fresh && <StartingPoint change={change} open={open} />}
      <div className="saas-columns">
        <section className="saas-card">
          <h2>Organization details</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void change("/organization", { name });
            }}
          >
            <label>
              Organization name
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} required />
            </label>
            <button disabled={!name.trim() || name.trim() === w.organization.name}>Save name</button>
          </form>
          <div className="saas-stats" style={{ gridTemplateColumns: "repeat(2, 1fr)", marginTop: 18 }}>
            <div><span>People</span><strong>{people.length + 1}</strong></div>
            <div><span>Roles</span><strong>{w.roles.length}</strong></div>
            <div><span>Active KPIs</span><strong>{active.length}</strong></div>
            <div><span>Units</span><strong>{w.units.length}</strong></div>
          </div>
        </section>
        <section className="saas-card">
          <div className="saas-card-title">
            <h2>Getting set up</h2>
            <span className={`saas-badge ${doneCount === steps.length ? "good" : ""}`}>{doneCount} of {steps.length} done</span>
          </div>
          <ol className="check-list">
            {steps.map((s) => (
              <li key={s.title} className={s.done ? "done" : ""}>
                <span className="check-mark" aria-hidden="true">{s.done ? "✓" : ""}</span>
                <div>
                  <strong>{s.title}</strong>
                  <p className="muted">{s.detail}</p>
                </div>
                <button type="button" className="secondary" onClick={s.action}>{s.cta}</button>
              </li>
            ))}
          </ol>
        </section>
      </div>
      {governance}
    </>
  );
}

/**
 * Shown while the organization has no KPIs and no roles: the owner decides how
 * to begin. A template brings KPIs, roles and what each role sees; every part of
 * it can be changed afterwards. Or the owner builds everything themselves.
 */
function StartingPoint({
  change,
  open,
}: {
  change: Change;
  open: (s: Section) => void;
}) {
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [chosen, setChosen] = useState("");
  const [problem, setProblem] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    request("/api/saas/templates", TemplateListSchema)
      .then((rows) => active && setTemplates(rows))
      .catch((e: unknown) => active && setProblem(e instanceof Error ? e.message : "Templates could not be loaded."));
    return () => {
      active = false;
    };
  }, []);
  const industries = useMemo(() => [...new Set(templates.map((t) => t.industry))], [templates]);
  const template = templates.find((t) => t.id === chosen);

  return (
    <section className="saas-card" id="starting-point">
      <h2>Choose your starting point</h2>
      <p>
        Your organization is ready and empty. Start from an industry template (its KPIs, roles and what each role sees), then
        change anything you like. Or build your own roles and KPIs from the KPI library.
      </p>
      <label>
        Industry template
        <select value={chosen} onChange={(e) => setChosen(e.target.value)}>
          <option value="">Choose a template…</option>
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
            {template.kpiCount} KPIs and {template.roles.length} roles: {template.roles.map((r) => r.name).join(", ")}.
          </span>
        </div>
      )}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
        <button
          type="button"
          disabled={!template || busy}
          onClick={() => {
            setBusy(true);
            void change("/template", { templateId: chosen }).finally(() => setBusy(false));
          }}
        >
          {busy ? "Setting up…" : "Use this template"}
        </button>
        <button type="button" className="secondary" onClick={() => open("KPIs (Predefined & Custom)")}>
          🌟 Pick Predefined &amp; Custom KPIs
        </button>
        <button type="button" className="secondary" onClick={() => open("Roles & Permissions")}>
          👤 Set Up Roles &amp; Permissions
        </button>
      </div>
      {problem && <p className="muted">{problem}</p>}
    </section>
  );
}

// ---------------------------------------------------------------------------

interface Editing {
  roleId?: string;
  name: string;
  capabilities: Capability[];
  scopeUnitId: string | null;
  allKpis: boolean;
  kpiIds: string[];
  custom: boolean;
}

function makeRandomPassword(): string {
  const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const LOWER = "abcdefghijkmnpqrstuvwxyz";
  const DIGITS = "23456789";
  const pick = (set: string) => set[Math.floor(Math.random() * set.length)]!;
  const chars = [pick(UPPER), pick(UPPER), pick(UPPER), pick(LOWER), pick(LOWER), pick(LOWER), pick(LOWER), pick(DIGITS), pick(DIGITS), pick(DIGITS)];
  const all = UPPER + LOWER + DIGITS;
  while (chars.length < 12) chars.push(pick(all));
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j]!, chars[i]!];
  }
  const text = chars.join("");
  return `${text.slice(0, 4)}-${text.slice(4, 8)}-${text.slice(8, 12)}`;
}

function Roles({
  w,
  change,
  tenant,
  reload,
}: {
  w: SaasWorkspace;
  change: Change;
  tenant: string;
  reload: () => Promise<void>;
}) {
  const [editing, setEditing] = useState<Editing>();
  const [addingRoleId, setAddingRoleId] = useState<string>();
  const [loginEmail, setLoginEmail] = useState("");
  const [loginName, setLoginName] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginBusy, setLoginBusy] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [issuedForRole, setIssuedForRole] = useState<{ roleId: string; set: IssuedSet }>();

  const [resettingMemberId, setResettingMemberId] = useState<string>();
  const [resetPasswordValue, setResetPasswordValue] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);

  const [editingMemberId, setEditingMemberId] = useState<string>();
  const [editingMemberRoles, setEditingMemberRoles] = useState<string[]>([]);

  const canCreateLogins = Boolean(import.meta.env.VITE_IDENTITY_API_BASE_URL?.trim());
  const roleName = new Map(w.roles.map((r) => [r.id, r.name]));
  const holders = (roleId: string) => w.members.filter((m) => m.active && m.roleIds.includes(roleId)).length;
  const unitName = (id: string | null) => (id ? w.units.find((u) => u.id === id)?.name ?? "a unit" : "The whole organization");
  const kpiName = new Map(w.kpis.map((k) => [k.id, k.name]));

  function edit(roleId?: string) {
    const role = w.roles.find((r) => r.id === roleId);
    if (!role) {
      setEditing({ name: "", capabilities: ["view"], scopeUnitId: null, allKpis: false, kpiIds: [], custom: false });
      return;
    }
    const draft = roleDraftFromGrants(role.grants);
    setEditing({ roleId: role.id, name: role.name, ...draft });
  }

  async function handleCreateRoleLogin(roleId: string, roleNameStr: string) {
    if (!loginName.trim() || !loginEmail.trim() || loginPassword.length < 8) return;
    setLoginBusy(true);
    setLoginError("");
    setIssuedForRole(undefined);
    try {
      const result = await request(
        `/api/identity/organizations/${tenant}/people`,
        InviteMembersResponseSchema,
        {
          members: [{
            displayName: loginName.trim(),
            email: loginEmail.trim(),
            roleIds: [roleId],
            password: loginPassword.trim() || undefined,
          }],
        }
      );
      setIssuedForRole({
        roleId,
        set: {
          title: `Credentials created for ${roleNameStr}`,
          mode: result.mode,
          people: result.members,
        },
      });
      setLoginName("");
      setLoginEmail("");
      setLoginPassword(makeRandomPassword());
      setAddingRoleId(undefined);
      await reload();
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Unable to create login.");
    } finally {
      setLoginBusy(false);
    }
  }

  async function handleResetPassword(member: SaasWorkspace["members"][number], roleId: string) {
    const who = member.email ?? member.displayName;
    if (resetPasswordValue.length < 8) {
      alert("Password must be at least 8 characters.");
      return;
    }
    setResetBusy(true);
    try {
      const result = await request(
        `/api/identity/organizations/${tenant}/members/${member.id}/reset-password`,
        ResetPasswordResponseSchema,
        { password: resetPasswordValue.trim() || undefined }
      );
      setIssuedForRole({
        roleId,
        set: {
          title: `New credentials for ${who}`,
          mode: "logins",
          people: [{
            email: who,
            roleKeys: member.roleIds,
            temporaryPassword: result.temporaryPassword,
          }],
        },
      });
      setResettingMemberId(undefined);
      await reload();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Unable to change credentials.");
    } finally {
      setResetBusy(false);
    }
  }

  return (
    <>
      <section className="saas-card">
        <div className="saas-card-title">
          <div>
            <h2>Roles</h2>
            <p className="muted" style={{ margin: 0 }}>
              A role decides what a person can do and which KPIs they see. A person can hold several roles; they see what any of them allows.
            </p>
          </div>
          <button type="button" onClick={() => edit()}>+ New role</button>
        </div>
      </section>
      {editing && !editing.roleId && <RoleEditor w={w} change={change} value={editing} onChange={setEditing} onClose={() => setEditing(undefined)} tenant={tenant} />}
      <div className="role-list">
        {w.roles.map((role) => {
          const draft = roleDraftFromGrants(role.grants);
          const count = holders(role.id);
          const isOpen = editing?.roleId === role.id;
          const sees = draft.capabilities.some((c) => c === "view" || c === "act" || c === "submit");
          const isAddingLogin = addingRoleId === role.id;
          const roleMembers = w.members.filter((m) => m.roleIds.includes(role.id));

          return (
            <section key={role.id} className={`saas-card role-card ${isOpen ? "open" : ""}`}>
              <div className="saas-card-title">
                <div>
                  <h3>{role.name}</h3>
                  <p className="muted" style={{ margin: "4px 0 0" }}>
                    {count} {count === 1 ? "person" : "people"} · {unitName(draft.scopeUnitId)}
                    {sees && <> · {draft.allKpis ? "every KPI" : `${draft.kpiIds.length} KPIs`}</>}
                  </p>
                </div>
                <div className="csv-actions" style={{ marginTop: 0 }}>
                  {canCreateLogins && (
                    <button
                      type="button"
                      className={isAddingLogin ? "" : "secondary"}
                      onClick={() => {
                        if (isAddingLogin) {
                          setAddingRoleId(undefined);
                        } else {
                          setAddingRoleId(role.id);
                          setLoginEmail("");
                          setLoginPassword(makeRandomPassword());
                          setLoginError("");
                        }
                      }}
                    >
                      {isAddingLogin ? "Close login form" : "+ Add employee login"}
                    </button>
                  )}
                  <button type="button" className="secondary" onClick={() => (isOpen ? setEditing(undefined) : edit(role.id))}>
                    {isOpen ? "Close" : "Edit"}
                  </button>
                  <button
                    type="button"
                    className="secondary"
                    disabled={count > 0}
                    title={count > 0 ? "Move these people to another role first" : undefined}
                    onClick={() => {
                      if (window.confirm(`Delete the role “${role.name}”?`)) void change(`/roles/${role.id}/delete`, {});
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="chip-row" style={{ marginTop: 10 }}>
                {draft.capabilities.length === 0 && <span className="saas-badge">Can do nothing yet</span>}
                {draft.capabilities.map((c) => (
                  <span key={c} className="saas-badge">{capabilityLabel(c)}</span>
                ))}
              </div>
              {sees && !draft.allKpis && !isOpen && (
                <details style={{ marginTop: 8 }}>
                  <summary>Which KPIs</summary>
                  <p className="muted">{draft.kpiIds.map((id) => kpiName.get(id) ?? "Retired KPI").join(" · ")}</p>
                </details>
              )}

              {/* Add login credentials panel for this role */}
              {isAddingLogin && (
                <div className="role-add-login-panel">
                  <h4>Add employee login for {role.name}</h4>
                  <p className="muted" style={{ margin: "2px 0 10px", fontSize: 13 }}>
                    Set up an email and password for this employee. You can provide these credentials directly to them.
                  </p>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      void handleCreateRoleLogin(role.id, role.name);
                    }}
                  >
                    <div style={{ display: "grid", gap: 10 }}>
                      <label>
                        Name
                        <input
                          type="text"
                          required
                          maxLength={120}
                          placeholder="Employee name"
                          value={loginName}
                          onChange={(e) => setLoginName(e.target.value)}
                        />
                      </label>
                      <label>
                        Employee email
                        <input
                          type="email"
                          required
                          placeholder="employee@company.com"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                        />
                      </label>
                      <label>
                        Password
                        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                          <input
                            type={showPassword ? "text" : "password"}
                            required
                            minLength={8}
                            placeholder="Min 8 characters"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            style={{ flex: 1, fontFamily: "ui-monospace, monospace" }}
                          />
                          <button
                            type="button"
                            className="secondary"
                            title="Generate a secure temporary password"
                            onClick={() => setLoginPassword(makeRandomPassword())}
                          >
                            🎲 Random
                          </button>
                          <button
                            type="button"
                            className="secondary"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? "Hide" : "Show"}
                          </button>
                        </div>
                        <small className="muted" style={{ display: "block", marginTop: 4 }}>
                          Min 8 characters. You can provide this password directly to the employee.
                        </small>
                      </label>
                      {loginError && <p role="alert" className="errors">{loginError}</p>}
                      <div className="csv-actions" style={{ marginTop: 4 }}>
                        <button type="submit" disabled={loginBusy || !loginName.trim() || !loginEmail.trim() || loginPassword.length < 8}>
                          {loginBusy ? "Creating login…" : "Create employee login"}
                        </button>
                        <button type="button" className="secondary" onClick={() => setAddingRoleId(undefined)}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              )}

              {/* Show newly issued credentials banner for this role */}
              {issuedForRole?.roleId === role.id && (
                <div className="role-issued-credentials">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <strong style={{ color: "var(--good)" }}>✓ Credentials created — ready to provide to employee</strong>
                    <button type="button" className="secondary" style={{ padding: "3px 8px", fontSize: 12 }} onClick={() => setIssuedForRole(undefined)}>
                      Done
                    </button>
                  </div>
                  <AccessPanel set={issuedForRole.set} roleName={(key) => roleName.get(key) ?? key} />
                </div>
              )}

              {/* People assigned to this role */}
              <div className="role-members-box">
                <div className="role-members-header">
                  <strong>People in this role ({roleMembers.length})</strong>
                </div>
                {roleMembers.length === 0 ? (
                  <p className="muted" style={{ margin: "4px 0 0", fontSize: 13 }}>
                    No one has been assigned to this role yet. Click <strong>+ Add employee login</strong> above to create credentials.
                  </p>
                ) : (
                  <div className="role-members-list">
                    {roleMembers.map((m) => (
                      <div key={m.id} className="role-member-item">
                        <div className="role-member-top">
                          <div className="role-member-info">
                            <strong>{m.subject === w.subject ? `${m.displayName} (You)` : m.displayName}</strong>
                            {m.email && <span className="muted">({m.email})</span>}
                            {!m.active && <span className="saas-badge bad">Revoked</span>}
                            {m.owner && <span className="saas-badge good">Owner</span>}
                            {m.roleIds.length > 1 && (
                              <span className="muted" style={{ fontSize: 12 }}>
                                +{m.roleIds.length - 1} other role{m.roleIds.length > 2 ? "s" : ""}
                              </span>
                            )}
                          </div>
                          {!m.owner && (
                            <div className="role-member-actions">
                              {m.active && canCreateLogins && (
                                <button
                                  type="button"
                                  className="secondary"
                                  onClick={() => {
                                    setResettingMemberId(resettingMemberId === m.id ? undefined : m.id);
                                    setResetPasswordValue(makeRandomPassword());
                                  }}
                                >
                                  {resettingMemberId === m.id ? "Cancel" : "Change credentials"}
                                </button>
                              )}
                              {m.active && (
                                <button
                                  type="button"
                                  className="secondary"
                                  onClick={() => {
                                    setEditingMemberId(editingMemberId === m.id ? undefined : m.id);
                                    setEditingMemberRoles(m.roleIds);
                                  }}
                                >
                                  {editingMemberId === m.id ? "Cancel" : "Edit roles"}
                                </button>
                              )}
                              {m.active && (
                                <button
                                  type="button"
                                  className="secondary"
                                  onClick={() => {
                                    if (window.confirm(`Remove ${m.email ?? m.displayName} from the role "${role.name}"?`)) {
                                      const newRoles = m.roleIds.filter((id) => id !== role.id);
                                      void change(`/members/${m.id}/roles`, { roleIds: newRoles }).then(() => reload());
                                    }
                                  }}
                                >
                                  Remove from role
                                </button>
                              )}
                              {m.active ? (
                                <button
                                  type="button"
                                  className="secondary"
                                  onClick={() => {
                                    if (window.confirm(`Revoke access for ${m.email ?? m.displayName}?`)) {
                                      void change(`/members/${m.id}/revoke`, {}).then(() => reload());
                                    }
                                  }}
                                >
                                  Revoke
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="secondary"
                                  onClick={() => void change(`/members/${m.id}/restore`, {}).then(() => reload())}
                                >
                                  Restore
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Inline Change Credentials */}
                        {resettingMemberId === m.id && (
                          <div className="role-member-inline-form">
                            <h5>Change credentials for {m.email ?? m.displayName}</h5>
                            <p className="muted" style={{ margin: "2px 0 8px", fontSize: 12 }}>
                              Enter a new password or generate a random one. Provide it directly to the employee.
                            </p>
                            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                              <input
                                type={showResetPassword ? "text" : "password"}
                                value={resetPasswordValue}
                                minLength={8}
                                onChange={(e) => setResetPasswordValue(e.target.value)}
                                placeholder="New password (min 8 chars)"
                                style={{ flex: "1 1 200px", fontFamily: "ui-monospace, monospace" }}
                              />
                              <button
                                type="button"
                                className="secondary"
                                onClick={() => setResetPasswordValue(makeRandomPassword())}
                              >
                                🎲 Random
                              </button>
                              <button
                                type="button"
                                className="secondary"
                                onClick={() => setShowResetPassword(!showResetPassword)}
                              >
                                {showResetPassword ? "Hide" : "Show"}
                              </button>
                              <button
                                type="button"
                                disabled={resetBusy || resetPasswordValue.length < 8}
                                onClick={() => void handleResetPassword(m, role.id)}
                              >
                                {resetBusy ? "Updating…" : "Update credentials"}
                              </button>
                              <button
                                type="button"
                                className="secondary"
                                onClick={() => setResettingMemberId(undefined)}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Inline Edit Roles */}
                        {editingMemberId === m.id && (
                          <div className="role-member-inline-form">
                            <h5>Edit roles for {m.email ?? m.displayName}</h5>
                            <div className="console-roles" style={{ margin: "8px 0" }}>
                              {w.roles.map((r) => (
                                <label key={r.id}>
                                  <input
                                    type="checkbox"
                                    checked={editingMemberRoles.includes(r.id)}
                                    onChange={() =>
                                      setEditingMemberRoles(
                                        editingMemberRoles.includes(r.id)
                                          ? editingMemberRoles.filter((id) => id !== r.id)
                                          : [...editingMemberRoles, r.id]
                                      )
                                    }
                                  />
                                  {r.name}
                                </label>
                              ))}
                            </div>
                            <div className="csv-actions" style={{ marginTop: 4 }}>
                              <button
                                type="button"
                                onClick={() => void (async () => {
                                  const ok = await change(`/members/${m.id}/roles`, { roleIds: editingMemberRoles });
                                  if (ok) {
                                    setEditingMemberId(undefined);
                                    await reload();
                                  }
                                })()}
                              >
                                Save roles
                              </button>
                              <button type="button" className="secondary" onClick={() => setEditingMemberId(undefined)}>
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {isOpen && editing && <RoleEditor w={w} change={change} value={editing} onChange={setEditing} onClose={() => setEditing(undefined)} tenant={tenant} />}
            </section>
          );
        })}
      </div>
      {w.roles.length === 0 && !editing && <p className="muted">No roles yet. Create one to start giving people access.</p>}
    </>
  );
}

function RoleEditor({
  w,
  change,
  value,
  onChange,
  onClose,
  tenant,
}: {
  w: SaasWorkspace;
  change: Change;
  value: Editing;
  onChange: (v: Editing) => void;
  onClose: () => void;
  tenant: string;
}) {
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);

  // OTP Validation State for Role Creation
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpSentTo, setOtpSentTo] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpRequesting, setOtpRequesting] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(600);
  const [cooldown, setCooldown] = useState(0);
  const [successMessage, setSuccessMessage] = useState("");

  const active = useMemo(() => w.kpis.filter((k) => k.state === "active"), [w.kpis]);
  const groups = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const map = new Map<string, typeof active>();
    for (const k of active) {
      if (needle && !`${k.name} ${k.description}`.toLowerCase().includes(needle)) continue;
      const key = k.domain ?? "";
      map.set(key, [...(map.get(key) ?? []), k]);
    }
    return [...map.entries()].sort(([a], [b]) => domainTitle(a || null).localeCompare(domainTitle(b || null)));
  }, [active, search]);
  const set = (patch: Partial<Editing>) => onChange({ ...value, ...patch });
  const toggle = <T,>(list: T[], item: T) => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);
  const usesKpis = value.capabilities.includes("view") || value.capabilities.includes("act") || value.capabilities.includes("submit");
  const usesScope = value.capabilities.some((c) => c !== "configure");
  const chosen = new Set(value.kpiIds);

  // Timer countdowns
  useEffect(() => {
    if (!otpModalOpen) return undefined;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => {
      clearInterval(timer);
    };
  }, [otpModalOpen]);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => {
      clearInterval(timer);
    };
  }, [cooldown]);

  async function requestRoleOtp() {
    setOtpRequesting(true);
    setOtpError("");
    try {
      const res = await request(
        `/api/saas/${tenant}/roles/request-otp`,
        RequestRoleOtpResponseSchema,
        { roleName: value.name.trim() }
      );
      setOtpSentTo(res.sentTo);
      setSecondsLeft(res.expiresInMinutes * 60);
      setCooldown(30);
      return true;
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : "Unable to generate verification code.");
      return false;
    } finally {
      setOtpRequesting(false);
    }
  }

  async function handleStartSave() {
    if (problem) return;
    // When creating a new role (or saving as owner), prompt for OTP verification!
    setOtpModalOpen(true);
    setOtpCode("");
    setOtpError("");
    setSuccessMessage("");
    await requestRoleOtp();
  }

  async function handleVerifyAndCreateRole() {
    if (otpCode.trim().length !== 6) {
      setOtpError("Please enter the complete 6-digit OTP code.");
      return;
    }
    setOtpVerifying(true);
    setOtpError("");
    try {
      const ok = await change("/roles/save", {
        ...(value.roleId ? { roleId: value.roleId } : {}),
        name: value.name.trim(),
        capabilities: value.capabilities,
        scopeUnitId: usesScope ? value.scopeUnitId : null,
        kpiIds: usesKpis && !value.allKpis ? value.kpiIds : [],
        otpCode: otpCode.trim(),
      });
      if (ok) {
        setSuccessMessage(`✓ Role "${value.name.trim()}" authorized and created successfully!`);
        setTimeout(() => {
          setOtpModalOpen(false);
          onClose();
        }, 900);
      } else {
        setOtpError("Verification code was rejected. Please check the code and try again.");
      }
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : "Failed to verify OTP.");
    } finally {
      setOtpVerifying(false);
    }
  }

  async function directSaveWithoutOtp() {
    setBusy(true);
    const ok = await change("/roles/save", {
      ...(value.roleId ? { roleId: value.roleId } : {}),
      name: value.name.trim(),
      capabilities: value.capabilities,
      scopeUnitId: usesScope ? value.scopeUnitId : null,
      kpiIds: usesKpis && !value.allKpis ? value.kpiIds : [],
    });
    setBusy(false);
    if (ok) onClose();
  }

  const problem =
    !value.name.trim()
      ? "Give the role a name."
      : value.capabilities.length === 0
        ? "Choose at least one thing this role can do."
        : usesKpis && !value.allKpis && value.kpiIds.length === 0
          ? "Choose the KPIs this role can access, or choose every KPI."
          : "";

  return (
    <div className="role-editor">
      {value.custom && (
        <p className="warn">
          This role was set up with permissions these controls cannot show exactly (for example from a template). What you see is the closest match. Saving replaces its permissions with exactly what is chosen here.
        </p>
      )}
      <label>
        Role name
        <input value={value.name} onChange={(e) => set({ name: e.target.value })} maxLength={120} placeholder="For example: Branch manager" />
      </label>

      <fieldset className="cap-grid">
        <legend>What this role can do</legend>
        {CAPABILITIES.map((c) => (
          <label key={c.key} className="cap-option">
            <input type="checkbox" aria-label={c.label} checked={value.capabilities.includes(c.key)} onChange={() => set({ capabilities: toggle(value.capabilities, c.key) })} />
            <span>
              <strong>{c.label}</strong>
              <small className="muted">{c.help}</small>
            </span>
          </label>
        ))}
      </fieldset>

      {usesScope && (
        <label>
          Where
          <select value={value.scopeUnitId ?? ""} onChange={(e) => set({ scopeUnitId: e.target.value || null })}>
            <option value="">The whole organization</option>
            {w.units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} and everything under it
              </option>
            ))}
          </select>
        </label>
      )}

      {usesKpis && (
        <fieldset className="kpi-pick">
          <legend>Which KPIs this role can see or update</legend>
          <div className="console-roles">
            <label>
              <input type="radio" name="kpi-mode" checked={value.allKpis} onChange={() => set({ allKpis: true })} />
              Every KPI, including ones added later
            </label>
            <label>
              <input type="radio" name="kpi-mode" checked={!value.allKpis} onChange={() => set({ allKpis: false })} />
              Only the KPIs I choose ({value.kpiIds.length} chosen)
            </label>
          </div>
          {!value.allKpis && (
            <>
              <div className="csv-actions">
                <input type="search" aria-label="Search KPIs" placeholder="Search KPIs" value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 280 }} />
                <button type="button" className="secondary" onClick={() => set({ kpiIds: [] })}>Clear</button>
              </div>
              <div className="kpi-groups">
                {groups.map(([domain, list]) => {
                  const all = list.every((k) => chosen.has(k.id));
                  return (
                    <div key={domain} className="kpi-group">
                      <label className="kpi-group-title">
                        <input
                          type="checkbox"
                          checked={all}
                          onChange={() =>
                            set({
                              kpiIds: all
                                ? value.kpiIds.filter((id) => !list.some((k) => k.id === id))
                                : [...new Set([...value.kpiIds, ...list.map((k) => k.id)])],
                            })
                          }
                        />
                        <strong>{domainTitle(domain || null)}</strong>
                        <small className="muted">{list.filter((k) => chosen.has(k.id)).length} of {list.length}</small>
                      </label>
                      {list.map((k) => (
                        <label key={k.id} className="kpi-item">
                          <input type="checkbox" checked={chosen.has(k.id)} onChange={() => set({ kpiIds: toggle(value.kpiIds, k.id) })} />
                          {k.name}
                        </label>
                      ))}
                    </div>
                  );
                })}
                {groups.length === 0 && <p className="muted">No KPI matches that search.</p>}
              </div>
            </>
          )}
        </fieldset>
      )}

      {problem && <p className="muted">{problem}</p>}
      <div className="csv-actions">
        <button
          type="button"
          disabled={busy || otpRequesting || !!problem}
          onClick={() => {
            if (!value.roleId) {
              void handleStartSave();
            } else {
              void directSaveWithoutOtp();
            }
          }}
        >
          {busy || otpRequesting ? "Initializing…" : value.roleId ? "Save role" : "🔐 Create role with OTP"}
        </button>
        <button type="button" className="secondary" onClick={onClose}>Cancel</button>
      </div>

      {/* Role Creation OTP Validation Modal */}
      {otpModalOpen && (
        <div className="role-otp-backdrop" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) setOtpModalOpen(false); }}>
          <dialog open className="role-otp-modal" aria-labelledby="role-otp-modal-title">
            <div className="role-otp-header">
              <div className="role-otp-shield" aria-hidden="true">🛡️</div>
              <div className="role-otp-title-group">
                <h3 id="role-otp-modal-title">Authorize Role Creation</h3>
                <p>An owner security code is required to create <strong>&ldquo;{value.name.trim()}&rdquo;</strong>.</p>
              </div>
            </div>

            <div className="role-otp-notice">
              <span>✉️</span>
              <span>
                A 6-digit one-time password (OTP) was issued to: <strong>{otpSentTo || "registered organization owner"}</strong>.
              </span>
            </div>


            <div className="role-otp-input-box">
              <label htmlFor="role-otp-field" style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>
                Enter 6-Digit Verification Code
              </label>
              <input
                id="role-otp-field"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]*"
                maxLength={6}
                autoFocus
                className="role-otp-input"
                value={otpCode}
                onChange={(e) => {
                  const clean = e.target.value.replace(/\D/g, "");
                  setOtpCode(clean);
                  if (clean.length === 6) setOtpError("");
                }}
                placeholder="······"
              />
              <div className={`role-otp-timer ${secondsLeft < 120 ? "expiring" : ""}`}>
                ⏱️ Code valid for {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, "0")}
              </div>
            </div>

            {otpError && (
              <p role="alert" className="errors" style={{ textAlign: "center", margin: 0 }}>
                {otpError}
              </p>
            )}

            {successMessage && (
              <div style={{ background: "#f0fdf4", color: "#166534", padding: "10px", borderRadius: 8, textAlign: "center", fontWeight: 600, fontSize: 13 }}>
                {successMessage}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
              <button
                type="button"
                className="secondary"
                disabled={cooldown > 0 || otpRequesting}
                onClick={() => void requestRoleOtp()}
                style={{ fontSize: 12, padding: "6px 10px" }}
              >
                {otpRequesting ? "Sending…" : cooldown > 0 ? `Resend in ${cooldown}s` : "↻ Resend code"}
              </button>
              <div className="role-otp-actions" style={{ margin: 0 }}>
                <button type="button" className="secondary" onClick={() => setOtpModalOpen(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={otpCode.length !== 6 || otpVerifying || !!successMessage}
                  onClick={() => void handleVerifyAndCreateRole()}
                  style={{ minWidth: 160 }}
                >
                  {otpVerifying ? "Verifying OTP…" : "Verify & Create"}
                </button>
              </div>
            </div>
          </dialog>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

function People({ w, change, tenant, reload }: { w: SaasWorkspace; change: Change; tenant: string; reload: () => Promise<void> }) {
  const [editingId, setEditingId] = useState("");
  const [roleIds, setRoleIds] = useState<string[]>([]);
  const [inviteRoles, setInviteRoles] = useState<string[]>([]);
  const [email, setEmail] = useState("");
  const [emailsText, setEmailsText] = useState("");
  const [loginRoles, setLoginRoles] = useState<string[]>([]);
  const [issued, setIssued] = useState<IssuedSet>();
  const [loginBusy, setLoginBusy] = useState(false);
  const [loginMessage, setLoginMessage] = useState("");
  // Creating logins needs the identity API. Without it, people are added by invitation link.
  const canCreateLogins = Boolean(import.meta.env.VITE_IDENTITY_API_BASE_URL?.trim());
  const parsed = useMemo(() => parseEmails(emailsText), [emailsText]);
  async function resetPassword(member: SaasWorkspace["members"][number]) {
    const who = member.email ?? member.displayName;
    if (!window.confirm(`Give ${who} a new temporary password? Their current password stops working.`)) return;
    setLoginMessage("");
    setIssued(undefined);
    try {
      const result = await request(`/api/identity/organizations/${tenant}/members/${member.id}/reset-password`, ResetPasswordResponseSchema, {});
      setIssued({ title: `New temporary password for ${who}`, mode: "logins", people: [{ email: who, roleKeys: member.roleIds, temporaryPassword: result.temporaryPassword }] });
    } catch (error) {
      setLoginMessage(error instanceof Error ? error.message : "That did not work.");
    }
  }
  const roleName = new Map(w.roles.map((r) => [r.id, r.name]));
  const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  const sorted = [...w.members].sort((a, b) => Number(b.owner) - Number(a.owner) || Number(b.active) - Number(a.active) || (a.email ?? a.displayName).localeCompare(b.email ?? b.displayName));

  return (
    <>
      <section className="saas-card">
        <h2>People</h2>
        <div className="saas-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Person</th>
                <th>Roles</th>
                <th>Status</th>
                <th><span className="sr-only">Manage</span></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((m) => (
                <tr key={m.id}>
                  <td>
                    <strong>{m.subject === w.subject ? "You" : m.displayName}</strong>
                    {m.email && <small>{m.email}</small>}
                  </td>
                  <td>
                    {m.owner ? (
                      <span className="saas-badge good">Owner: everything</span>
                    ) : editingId === m.id ? (
                      <div className="console-roles">
                        {w.roles.map((r) => (
                          <label key={r.id}>
                            <input type="checkbox" checked={roleIds.includes(r.id)} onChange={() => setRoleIds(toggle(roleIds, r.id))} />
                            {r.name}
                          </label>
                        ))}
                      </div>
                    ) : m.roleIds.length ? (
                      <div className="chip-row">
                        {m.roleIds.map((id) => (
                          <span key={id} className="saas-badge">{roleName.get(id) ?? "Role"}</span>
                        ))}
                      </div>
                    ) : (
                      <span className="saas-badge bad">No role: sees nothing</span>
                    )}
                  </td>
                  <td>{m.active ? "Active" : "Access revoked"}</td>
                  <td>
                    {!m.owner && editingId === m.id && (
                      <div className="csv-actions" style={{ marginTop: 0 }}>
                        <button
                          type="button"
                          onClick={() =>
                            void change(`/members/${m.id}/roles`, { roleIds }).then((ok) => ok && setEditingId(""))
                          }
                        >
                          Save roles
                        </button>
                        <button type="button" className="secondary" onClick={() => setEditingId("")}>Cancel</button>
                      </div>
                    )}
                    {!m.owner && editingId !== m.id && (
                      <div className="csv-actions" style={{ marginTop: 0 }}>
                        {m.active && (
                          <button type="button" className="secondary" onClick={() => { setEditingId(m.id); setRoleIds(m.roleIds); }}>
                            Change roles
                          </button>
                        )}
                        {m.active && canCreateLogins && (
                          <button type="button" className="secondary" onClick={() => void resetPassword(m)}>
                            Reset password
                          </button>
                        )}
                        {m.active ? (
                          <button
                            type="button"
                            className="secondary"
                            onClick={() => {
                              if (window.confirm(`Revoke access for ${m.email ?? m.displayName}? They keep their roles and can be restored.`))
                                void change(`/members/${m.id}/revoke`, {});
                            }}
                          >
                            Revoke access
                          </button>
                        ) : (
                          <button type="button" className="secondary" onClick={() => void change(`/members/${m.id}/restore`, {})}>
                            Restore access
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {loginMessage && <p role="alert" className="errors">{loginMessage}</p>}
        {issued && <AccessPanel set={issued} roleName={(key) => roleName.get(key) ?? key} />}
      </section>

      {canCreateLogins && (
        <section className="saas-card">
          <h2>Add people with a login</h2>
          <p className="muted">
            Each person gets an email and a temporary password, shown to you once. They sign in, choose their own password, and see only what their roles allow.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (parsed.errors.length || parsed.emails.length === 0 || loginRoles.length === 0) return;
              setLoginBusy(true);
              setLoginMessage("");
              setIssued(undefined);
              request(`/api/identity/organizations/${tenant}/people`, InviteMembersResponseSchema, {
                members: parsed.emails.map((address) => ({ email: address, roleIds: loginRoles })),
              })
                .then(async (result) => {
                  setIssued({ title: result.members.length === 1 ? "Person added" : "People added", mode: result.mode, people: result.members });
                  setEmailsText("");
                  setLoginRoles([]);
                  await reload();
                })
                .catch((error) => setLoginMessage(error instanceof Error ? error.message : "That did not work."))
                .finally(() => setLoginBusy(false));
            }}
          >
            <label>
              Work emails, one per line
              <textarea value={emailsText} onChange={(e) => setEmailsText(e.target.value)} rows={4} placeholder={"anita@acme.com\nravi@acme.com"} />
            </label>
            <fieldset className="kpi-pick">
              <legend className="muted">They all get these roles</legend>
              <div className="console-roles">
                {w.roles.map((r) => (
                  <label key={r.id}>
                    <input type="checkbox" checked={loginRoles.includes(r.id)} onChange={() => setLoginRoles(toggle(loginRoles, r.id))} />
                    {r.name}
                  </label>
                ))}
              </div>
            </fieldset>
            {parsed.errors.length > 0 && (
              <ul className="errors">
                {parsed.errors.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            )}
            <button disabled={loginBusy || parsed.emails.length === 0 || parsed.errors.length > 0 || loginRoles.length === 0}>
              {loginBusy ? "Creating…" : `Create ${parsed.emails.length || ""} login${parsed.emails.length === 1 ? "" : "s"}`.replace("  ", " ")}
            </button>
          </form>
        </section>
      )}

      <section className="saas-card">
        <h2>Add a person & send invitation email</h2>
        <p className="muted">
          Enter their work email and assign their roles. A secure email will be sent directly to that address with an option to set their password. Their email serves as their permanent Login ID.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const targetEmail = email.trim();
            void change("/invitations", { email: targetEmail, roleIds: inviteRoles }).then((ok) => {
              if (ok) {
                setEmail("");
                setInviteRoles([]);
              }
            });
          }}
        >
          <label>
            Work email (will receive password setup email & serves as Login ID)
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@example.com"
              required
            />
          </label>
          <fieldset className="kpi-pick" style={{ border: "none", padding: 0, margin: "14px 0" }}>
            <legend className="muted" style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Assign Roles</legend>
            <div className="console-roles">
              {w.roles.map((r) => (
                <label key={r.id}>
                  <input type="checkbox" checked={inviteRoles.includes(r.id)} onChange={() => setInviteRoles(toggle(inviteRoles, r.id))} />
                  {r.name}
                </label>
              ))}
            </div>
          </fieldset>
          <button type="submit" disabled={!email.trim() || inviteRoles.length === 0} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <span>✉</span>
            <span>Send invitation & password setup email</span>
          </button>
        </form>
      </section>
    </>
  );
}

// ---------------------------------------------------------------------------

function Units({ w, change }: { w: SaasWorkspace; change: Change }) {
  const [name, setName] = useState("");
  const [kind, setKind] = useState("");
  const root = w.units.find((u) => u.parentId === null);
  const [parentId, setParentId] = useState(root?.id ?? "");
  const [renaming, setRenaming] = useState<{ id: string; name: string; kind: string }>();
  const tree = useMemo(() => {
    const out: { id: string; name: string; kind: string; depth: number }[] = [];
    const walk = (parent: string | null, depth: number) => {
      for (const u of w.units.filter((x) => x.parentId === parent).sort((a, b) => a.name.localeCompare(b.name))) {
        out.push({ id: u.id, name: u.name, kind: u.kind, depth });
        walk(u.id, depth + 1);
      }
    };
    walk(null, 0);
    return out;
  }, [w.units]);

  return (
    <div className="saas-columns">
      <section className="saas-card">
        <h2>Structure</h2>
        <p className="muted">Figures are reported per unit. A unit's results add up the units under it.</p>
        <ul className="unit-tree">
          {tree.map((u) => (
            <li key={u.id} style={{ paddingLeft: u.depth * 22 }}>
              {renaming?.id === u.id ? (
                <span className="unit-edit">
                  <input aria-label="Unit name" value={renaming.name} onChange={(e) => setRenaming({ ...renaming, name: e.target.value })} maxLength={120} />
                  <input aria-label="Unit type" value={renaming.kind} onChange={(e) => setRenaming({ ...renaming, kind: e.target.value })} maxLength={60} />
                  <button
                    type="button"
                    disabled={!renaming.name.trim() || !renaming.kind.trim()}
                    onClick={() => void change(`/units/${u.id}/rename`, { name: renaming.name.trim(), kind: renaming.kind.trim() }).then((ok) => ok && setRenaming(undefined))}
                  >
                    Save
                  </button>
                  <button type="button" className="secondary" onClick={() => setRenaming(undefined)}>Cancel</button>
                </span>
              ) : (
                <span className="unit-row">
                  <span>
                    <strong>{u.name}</strong> <small className="muted">{u.kind}</small>
                  </span>
                  <span className="unit-actions">
                    <button type="button" className="secondary" onClick={() => setRenaming({ id: u.id, name: u.name, kind: u.kind })}>Rename</button>
                    {u.depth > 0 && (
                      <button
                        type="button"
                        className="secondary"
                        onClick={() => {
                          if (window.confirm(`Delete the unit “${u.name}”? This is only possible while nothing depends on it.`))
                            void change(`/units/${u.id}/delete`, {});
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </span>
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>
      <section className="saas-card">
        <h2>Add a unit</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void change("/units", { name: name.trim(), kind: kind.trim(), parentId: parentId || null }).then((ok) => {
              if (ok) {
                setName("");
                setKind("");
              }
            });
          }}
        >
          <label>
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={120} placeholder="For example: Pune branch" />
          </label>
          <label>
            Type
            <input value={kind} onChange={(e) => setKind(e.target.value)} required maxLength={60} placeholder="Branch, site, department…" />
          </label>
          <label>
            Under
            <select value={parentId} onChange={(e) => setParentId(e.target.value)}>
              {tree.map((u) => (
                <option key={u.id} value={u.id}>
                  {"— ".repeat(u.depth)}
                  {u.name}
                </option>
              ))}
            </select>
          </label>
          <button disabled={!name.trim() || !kind.trim()}>Add unit</button>
        </form>
      </section>
    </div>
  );
}
