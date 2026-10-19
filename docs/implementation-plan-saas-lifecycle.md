# Implementation plan: the SaaS service model

Date: 19 October 2026. Status: plan, with implementation tracked in section 9.

This turns the product owner's description into work, using what the platform already does. The rule for every part: **extend an existing piece, never add a second one that does the same thing.**

## 1. The three kinds of person

| Who | What they do | Where they work |
|---|---|---|
| **Service provider** (platform operator) | Creates, activates, suspends and deletes business organizations. Gives each owner a first login. Never sees a customer's figures. | `/operator` (control API) |
| **Business owner** | Runs one organization: roles, KPIs and formulas, people. Gives each person a first login when assigning them a role. Has their own all-organization dashboard. | `/` → Organization page and Dashboard (customer API) |
| **Role holder** | Sees a dashboard of only the KPIs their role allows. Uploads or approves data if their role says so. | `/` → Dashboard (customer API) |

## 2. What the platform already does (so we do not rebuild it)

| Requirement | Already built | Gap |
|---|---|---|
| Create an organization | Operator console: template, owner, people | None for creation itself |
| Owner gets a temporary login, changes it at first sign-in | Control API creates the login; first sign-in forces a new password | The operator does not state that the owner's email was verified |
| Activate / suspend / delete an organization | Nothing. An organization is simply live once created. | **Whole lifecycle** |
| Owner's management page | Organization page: details, roles and their KPIs, people, units | Owner cannot give a person a login (only an invitation link) |
| Role initialization, formulas, owner adds a KPI | Roles editor; custom KPI form with live formula check; catalog of 592 KPIs | None |
| Owner has a separate dashboard | Dashboard shows everything the owner may see (all KPIs) | None |
| Each role has its own dashboard | Dashboard shows exactly the KPIs the person's roles allow | The page does not say which role the person is viewing as |
| "Who is logged in" at bottom left | Sidebar footer has a slogan, a security link and Sign out | **Show the signed-in person** |

So the real work is four items: the organization lifecycle, owner-issued logins, the signed-in person at bottom left, and a stated email verification.

## 3. Decisions made, and why

Each is easy to reverse. Tell me if one is wrong.

1. **"Validate the owner's email" means the operator attests it.** At creation the operator ticks "I have verified this email belongs to the owner". It is stored with who and when. The owner is still forced to choose their own password at first sign-in. An email-sent confirmation by the platform itself is not built: Supabase's built-in mailer only reaches a few addresses per hour, so it needs the project's own mail service first (an infrastructure step, section 8).
2. **"Who is logged in" means the person using this dashboard.** The bottom-left corner shows their name or email, their role(s), their organization, and Sign out. It does not show other people online. A live "online now" list is a different feature, left out until asked for.
3. **Creating an organization leaves it pending only if the operator wants that.** The creation form has "Activate immediately" (on by default). Otherwise the organization waits as pending and nobody can sign in to it until the operator activates it. This covers "create, then activate" without forcing two steps on everyone.
4. **Delete is two stages, to protect against mistakes.** Delete first moves the organization to *deleted*: access stops, nothing is erased, and it can be restored for 30 days. After that the operator can delete it permanently, which erases its data and removes logins that belong to no other organization.
5. **Owner-issued logins need a dedicated small service.** Creating a login needs Supabase's admin key. That key must not sit in the customer API, which reads customer data. So a third process, the *identity API*, holds the key and can do exactly one thing: let a verified owner add a person to their own organization and create their login. It has its own narrow database login, no read access to customer figures. The control API keeps its own copy of the same pattern for the operator. Both reuse one login-creation module, so there is no duplicate code.

## 4. Organization lifecycle

States: **pending → active ⇄ suspended → deleted → (restored to suspended) → permanently deleted.**

| Action | Who | Effect |
|---|---|---|
| Create | Operator | Organization exists as pending or active (their choice), owner login issued |
| Activate | Operator | People can sign in and work |
| Suspend | Operator | Everyone is blocked, with a clear message. Data is kept. Used for non-payment or a dispute. Reversible. |
| Delete | Operator, after typing the organization's name | Blocked, marked deleted, 30-day restore window |
| Restore | Operator, within 30 days | Back to suspended; the operator then activates |
| Delete permanently | Operator, after 30 days | Data and orphaned logins are erased. Cannot be undone. |

**One enforcement point.** The database function that every access rule already calls (`kpi.is_member` and `kpi.is_owner`) now also requires the organization to be active. Nothing else needs to remember the check, so a missed route cannot leave a suspended organization usable. The web page asks a separate function for the person's organizations and their status, so a blocked person sees "Your organization is suspended. Contact your provider." and not an empty page.

**What a blocked person sees:** a page naming the organization, its status, and the provider's contact message; Sign out is available.

## 5. Owner-issued logins (owner adds a person)

Today the owner creates an invitation link. New: the **Add a person** form on People offers "Create a login with a temporary password" as the main option, with the invitation link kept for people who already have an account.

Flow, in the order it runs:
1. The browser calls the identity API with the owner's own sign-in.
2. The identity API checks, in the database, that the caller is the owner of that organization **before** it touches the admin key. (The mistake made earlier with the operator route must not be repeated; there is a test for it.)
3. It creates one login per person with a random temporary password, then records the memberships and roles in a single database step. If anything fails, the logins just created are removed.
4. The owner is shown each person's temporary password once, with a copy button. The person must choose their own password at first sign-in.

Reused, not duplicated: the login-creation module, the temporary-password generator, `add_people`, the all-or-nothing undo, the access panel in the operator console (moved to a shared component).

## 6. The signed-in person at bottom left

The sidebar footer becomes: initial in a circle, name or email, "Owner" or the role names, the organization name, then **Account security** and **Sign out**. The slogan goes. Role names come from the person's own memberships, so no new data is needed. The dashboard heading also says whose view it is ("Operations head view") so a person with two roles knows what they are looking at.

## 7. Data changes (additive only)

| Change | Why |
|---|---|
| `kpi.organizations`: `status`, `status_changed_at`, `deleted_at`, `purge_after` | The lifecycle. Existing organizations become `active`. |
| `kpi_control.registry`: `owner_email`, `owner_email_verified_by`, `owner_email_verified_at` | The operator's attestation |
| `kpi.is_member`, `kpi.is_owner` also require an active organization | One enforcement point |
| `kpi_control.set_org_status`, `purge_organization`; `kpi.my_organizations` | Lifecycle actions and the web's organization list |
| `kpi.add_people_as_owner` (owner-checked wrapper over `kpi_control.add_people`) | The identity API's one capability |
| New database login `cc_kpi_identity_login` in a new role `kpi_identity_app` | The identity API's narrow access |

## 8. Phases, each with its own tests

| Phase | Delivers | Done when |
|---|---|---|
| **1. Lifecycle** | Statuses, enforcement in the database, operator actions (activate, suspend, delete, restore, delete permanently), blocked-organization screen, operator's email attestation | A suspended organization's members are refused at the database and see the message; a deleted one can be restored; permanent deletion erases data and only orphaned logins; all existing suites still pass |
| **2. Who is signed in** | Bottom-left person badge, role in the dashboard heading | Browser test reads the right name and roles for owner, executive and a two-role person |
| **3. Owner-issued logins** | Identity API, owner's "create a login" form, deployment as a third service | An owner creates a login; a member and an anonymous caller cause no login to be created; the key is absent from the customer API |
| **4. Hardening of what this adds** | Operator and owner audit entries for every lifecycle and login action; runbook and tests documented | Activity log shows each action; runbook covers the new service |

Infrastructure steps that are not code, listed so they are not forgotten: set the project's own mail service in Supabase so that password-reset emails work; create the identity API's Vercel project and its two settings; set `VITE_IDENTITY_API_BASE_URL` on the web project.

## 9. Implementation record

**Phase 1, lifecycle: done.** Migration `20261021000100_org_lifecycle.sql`. Statuses on organizations; `kpi.is_member` and `kpi.is_owner` require an active organization, so every access rule enforces it; `kpi.my_organizations` lets a blocked person see why; `kpi_control.set_org_status` allows only the listed moves; `kpi_control.purge_organization` erases one organization and returns only the logins that belong to nobody else; `kpi_control.lifecycle` keeps the history after deletion. Creation requires the operator's email attestation (`ownerEmailVerified: true`), stored with who and when, and takes "activate immediately". Operator console: status, owner email, Activate, Suspend, Delete (typed name), Restore, Delete permanently (after 30 days, typed name). People in a closed organization see a page that says pending, suspended or removed. Each API process now answers only its own routes (`/api/saas`, `/api/control`, `/api/identity`).
Verified: database checks (pending/suspended/deleted block everyone, invalid moves refused, purge only after 30 days, purge keeps other organizations and shared logins), 36 API checks, 17 browser checks.

**Phase 2, who is signed in: done.** Migration `20261022000100_my_roles.sql` (`kpi.my_roles`: the caller's own roles only). The workspace carries `me`. Bottom left: initial, email, Owner or role names, organization. The dashboard heading says whose view it is.
Verified: database checks (a stranger and the operator get nothing), 10 browser checks (owner, one role, two roles, contributor, position and width).

**Phase 3, owner-issued logins: done.** Migration `20261023000100_owner_logins.sql`: `kpi_control.add_people` extended to take role ids; `kpi.add_people_as_owner` (owner-checked); new role `kpi_identity_app` that can call only `kpi.is_owner` and that function, with no table access. The identity API is the same codebase started with `IDENTITY_DATABASE_URL` and `SUPABASE_SECRET_KEY`; it checks ownership before using the key. People page: "Add people with a login" (one email per line, roles for all), shown once with copy and CSV; invitation link kept as the fallback.
Verified: database checks (the identity role cannot read or change anything else), 32 API checks including that an anonymous caller, a member, another owner and the operator cause no login to be created, 12 browser checks.

**Phase 4, hardening: done in the same commits.** Every lifecycle and login action is in the activity log or the operator's lifecycle history; runbook updated; test suites in `tools/local-demo`.

**Phase 5, the owner as manager: done.** Migration `20261024000100_owner_manager.sql`: `kpi.retire_kpi`, `kpi.set_kpi_audience` (by key, across versions), `kpi.rename_unit`, `kpi.delete_unit` (only when nothing depends on it), `kpi.prepare_password_reset` (owner only; refuses anyone who also belongs to another organization). KPI activation is one shared helper used by "Approve & activate", "Add & activate" and "Create and activate". The identity API resets passwords.
Verified: database checks, 33 API checks, 17 browser checks; all earlier suites still pass.

**Left (not code):** Supabase mail service for password resets; the identity API's Vercel project and database login (runbook section 5).

## 10. Deliberately not built (to avoid mess)

- A second dashboard system per role. The existing dashboard already shows exactly what a role may see.
- A second place to manage people. The operator manages organizations and owners; the owner manages everyone else.
- Billing, plans and usage limits. They need the organization status from this plan, and come after it.
- Presence ("who is online now").
- Enterprise single sign-on and multi-factor sign-in.
