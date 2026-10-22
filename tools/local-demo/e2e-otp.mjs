// Changing a password with a code sent by email. LOCAL demo stack, as started by start-demo.sh:
// the identity API (3102) with MAIL_PROVIDER=outbox, and a second customer API (3103) with
// ENFORCE_PASSWORD_CHANGE=true. Set OUTBOX to the identity API's MAIL_OUTBOX file.
import { readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
const AUTH = "http://127.0.0.1:54321/auth/v1", API = "http://localhost:3100", CTL = "http://localhost:3101", IDN = "http://localhost:3102", ENF = "http://localhost:3103";
const OUTBOX = process.env.OUTBOX ?? "D:/GB Tech/cmd new/demo/outbox.jsonl";
const PSQL = process.env.PSQL ?? "C:/Program Files/PostgreSQL/18/bin/psql.exe";
const USERS = new URL("./users.json", import.meta.url);
let pass = 0, fail = 0;
const ok = (cond, label) => { cond ? pass++ : fail++; console.log(`${cond ? "PASS" : "FAIL"}  ${label}`); };
const token = async (email, password) => { const r = await fetch(`${AUTH}/token?grant_type=password`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) }); return { status: r.status, ...(await r.json()) }; };
const raw = async (base, s, method, path, body) => {
  const r = await fetch(base + path, { method, headers: { ...(s ? { Authorization: `Bearer ${s.access_token}` } : {}), "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: r.status, body: await r.json().catch(() => ({})) };
};
const call = async (...a) => { const r = await raw(...a); if (r.status >= 300) throw new Error(`${a[2]} ${a[3]} -> ${r.status} ${JSON.stringify(r.body)}`); return r.body; };
const claims = (s) => JSON.parse(Buffer.from(s.access_token.split(".")[1], "base64url").toString());
const mails = (to) => (existsSync(OUTBOX) ? readFileSync(OUTBOX, "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l)) : []).filter((m) => m.to === to);
const latestCode = (to) => /\b(\d{6})\b/.exec(mails(to).at(-1)?.text ?? "")?.[1];
const wrong = (code) => String((Number(code) + 1) % 1_000_000).padStart(6, "0");
// Superuser access to the local test database, only to look inside and to skip the one-minute wait.
const sql = (text) => spawnSync(PSQL, ["-h", "127.0.0.1", "-p", "54329", "-U", "postgres", "-d", "postgres", "-tA", "-c", text], { env: { ...process.env, PGPASSWORD: "demo-superuser-pw" }, encoding: "utf8" });
const stamp = Date.now().toString(36);
const mail = (n) => `${n}.${stamp}@otp.test`;
const op = await token("operator@demo.local", "x");

const org = await call(CTL, op, "POST", "/api/control/organizations", {
  name: `OTP ${stamp}`, industry: "Diagnostics", plan: "Pilot", ownerName: "OTP Owner",
  subscriptionStatus: "trial", ownerEmailVerified: true, ownerEmail: mail("owner"),
  templateId: "diagnostics-lab", members: [{ email: mail("ceo"), roleKeys: ["executive"] }],
});
const temp = Object.fromEntries([org.owner, ...org.members].map((p) => [p.email, p.temporaryPassword]));
const T = `/api/saas/${org.id}`;
const listedBefore = (await call(CTL, op, "GET", "/api/control/organizations")).find((item) => item.id === org.id);
ok(listedBefore?.industry === "Diagnostics" && listedBefore?.plan === "Pilot" && listedBefore?.ownerName === "OTP Owner", "the operator sees only the organization's onboarding profile");
ok(listedBefore?.credentialStatus === "pending_reset" && listedBefore?.userCount === 2 && listedBefore?.roleCount > 0, "the operator sees reset status and headcounts");
const privacy = await call(CTL, op, "POST", "/api/control/ask", { question: "Show this organization's revenue KPIs" });
ok(privacy.topic === "privacy" && privacy.facts.length === 0 && /cannot access/.test(privacy.answer), "the operator assistant refuses customer KPI data");

// 1. a temporary password opens nothing until it is replaced
let owner = await token(mail("owner"), temp[mail("owner")]);
ok(claims(owner).app_metadata?.must_change_password === true, "a new owner's token carries the server-set must-change flag");
const blocked = await raw(ENF, owner, "GET", `${T}/workspace`);
ok(blocked.status === 403 && /Choose your own password first/.test(blocked.body.error?.message), `with enforcement on, their data is refused until they choose a password (${blocked.status}: ${blocked.body.error?.message})`);
ok((await raw(API, owner, "GET", `${T}/workspace`)).status === 200, "(the same token is accepted where enforcement is off)");
const selfMade = await raw(IDN, owner, "POST", "/api/identity/me/password", { code: "123456", password: "Owner-own-pass-1" });
ok(selfMade.status === 409 && /no valid code/.test(selfMade.body.error?.message), "changing without asking for a code first is refused");

// 2. the code goes to their email; only its hash is kept
const sent = await call(IDN, owner, "POST", "/api/identity/me/password-code", {});
const code = latestCode(mail("owner"));
ok(/^\d{6}$/.test(code ?? "") && sent.expiresInMinutes === 10, `a 6-digit code is emailed (${sent.sentTo})`);
ok(sent.sentTo.includes("•") && !sent.sentTo.startsWith(mail("owner").split("@")[0]), "the reply shows the address partly hidden");
const stored = sql(`select code_hash from kpi.email_codes where subject='${claims(owner).sub}' order by created_at desc limit 1`).stdout.trim();
ok(/^[a-f0-9]{64}$/.test(stored) && !stored.includes(code), "the database keeps only a hash of the code");
const again = await raw(IDN, owner, "POST", "/api/identity/me/password-code", {});
ok(again.status === 409 && /Wait a minute/.test(again.body.error?.message) && mails(mail("owner")).length === 1, "asking again within a minute is refused, and no second email is sent");
const anon = await raw(IDN, null, "POST", "/api/identity/me/password-code", {});
ok(anon.status === 401, "nobody signed in can ask for a code");

// 3. wrong codes are counted; the right code then works
ok((await raw(IDN, owner, "POST", "/api/identity/me/password", { code: wrong(code), password: "Owner-own-pass-1" })).status === 400, "a wrong code is refused");
ok(sql(`select attempts from kpi.email_codes where subject='${claims(owner).sub}' order by created_at desc limit 1`).stdout.trim() === "1", "and the attempt is counted");
const asEmail = await raw(IDN, owner, "POST", "/api/identity/me/password", { code, password: mail("owner") });
ok(asEmail.status === 400 && /email/.test(asEmail.body.error?.message), "a password equal to the email address is refused");
const short = await raw(IDN, owner, "POST", "/api/identity/me/password", { code, password: "short" });
ok(short.status === 400, "a password shorter than 12 characters is refused");
const changed = await raw(IDN, owner, "POST", "/api/identity/me/password", { code, password: "Owner-own-pass-1" });
ok(changed.status === 200, "the right code changes the password");
ok((await token(mail("owner"), temp[mail("owner")])).status === 400, "the temporary password no longer works");
owner = await token(mail("owner"), "Owner-own-pass-1");
ok(owner.access_token && claims(owner).app_metadata?.must_change_password === false, "the new password works, and the flag is cleared");
ok((await raw(ENF, owner, "GET", `${T}/workspace`)).status === 200, "and now their workspace opens, with enforcement on");
const listedAfter = (await call(CTL, op, "GET", "/api/control/organizations")).find((item) => item.id === org.id);
ok(listedAfter?.credentialStatus === "verified", "the operator sees that the owner verified their permanent password");
const reused = await raw(IDN, owner, "POST", "/api/identity/me/password", { code, password: "Owner-other-pass-2" });
ok(reused.status === 409, "the same code cannot be used twice");

// 4. five wrong codes lock that code; a code is tied to its person
const ceo = await token(mail("ceo"), temp[mail("ceo")]);
await call(IDN, ceo, "POST", "/api/identity/me/password-code", {});
const ceoCode = latestCode(mail("ceo"));
const ownerTriesIt = await raw(IDN, owner, "POST", "/api/identity/me/password", { code: ceoCode, password: "Owner-other-pass-2" });
ok(ownerTriesIt.status >= 400 && (await token(mail("owner"), "Owner-other-pass-2")).status === 400, "someone else's code does not work for you");
for (let i = 0; i < 5; i++) await raw(IDN, ceo, "POST", "/api/identity/me/password", { code: wrong(ceoCode), password: "Ceo-own-pass-12" });
const locked = await raw(IDN, ceo, "POST", "/api/identity/me/password", { code: ceoCode, password: "Ceo-own-pass-12" });
ok(locked.status === 409 && /Too many wrong/.test(locked.body.error?.message), "after 5 wrong codes even the right one is refused");
ok((await token(mail("ceo"), "Ceo-own-pass-12")).status === 400, "and the password was not changed");
sql(`update kpi.email_codes set created_at = created_at - interval '2 minutes' where subject='${claims(ceo).sub}'`);
await call(IDN, ceo, "POST", "/api/identity/me/password-code", {});
ok((await raw(IDN, ceo, "POST", "/api/identity/me/password", { code: latestCode(mail("ceo")), password: "Ceo-own-pass-12" })).status === 200, "a new code works");
ok((await token(mail("ceo"), "Ceo-own-pass-12")).access_token, "and the member signs in with their own password");

// 5. anyone may change their password again later, always with a code
sql(`update kpi.email_codes set created_at = created_at - interval '2 minutes' where subject='${claims(owner).sub}'`);
await call(IDN, owner, "POST", "/api/identity/me/password-code", {});
ok((await raw(IDN, owner, "POST", "/api/identity/me/password", { code: latestCode(mail("owner")), password: "Owner-second-pass-3" })).status === 200 && (await token(mail("owner"), "Owner-second-pass-3")).access_token, "a later change also goes through an emailed code");
ok(sql(`select count(*) from kpi.email_codes where subject='${claims(owner).sub}' and created_at > now() - interval '1 hour'`).stdout.trim() === "2", "(each code is recorded, for the hourly limit)");

// 6. an operator's email cannot be made an organization's owner or member
const opEmail = "operator@demo.local";
const opSub = claims(op).sub;
const hadOperator = opEmail in JSON.parse(readFileSync(USERS, "utf8"));
if (!hadOperator) await fetch(`${AUTH}/admin/users`, { method: "POST", headers: { Authorization: "Bearer demo-secret", "Content-Type": "application/json" }, body: JSON.stringify({ email: opEmail, password: "x" }) });
try {
  const asOwner = await raw(CTL, op, "POST", "/api/control/organizations", { name: `Op owner ${stamp}`, ownerEmailVerified: true, ownerEmail: opEmail, templateId: "diagnostics-lab", members: [] });
  ok(asOwner.status === 400 && /platform operator account/.test(asOwner.body.error?.message), `an operator's email as owner is refused clearly (${asOwner.status}: ${asOwner.body.error?.message})`);
  const ownerRoles = (await call(API, owner, "GET", `${T}/workspace`)).roles;
  const asMember = await raw(IDN, owner, "POST", `/api/identity/organizations/${org.id}/people`, { members: [{ email: opEmail, roleIds: [ownerRoles[0].id] }] });
  ok(asMember.status === 400 && /platform operator account/.test(asMember.body.error?.message), `and an owner cannot add it as a member (${asMember.status})`);
} finally {
  if (!hadOperator) await fetch(`${AUTH}/admin/users/${opSub}`, { method: "DELETE", headers: { Authorization: "Bearer demo-secret" } });
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
