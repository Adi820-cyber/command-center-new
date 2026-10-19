import { useState } from "react";
import { accessCsv, accessMessage, type PersonAccess } from "./access";

export interface IssuedSet {
  title: string;
  mode: "logins" | "invitations";
  people: PersonAccess[];
}

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

/** Each person's access, shown once, with copy and download. */
export function AccessPanel({ set, roleName }: { set: IssuedSet; /** Turns a role identifier into a name to show. */ roleName?: (key: string) => string }) {
  const [copied, setCopied] = useState("");
  const origin = window.location.origin;
  async function copy(text: string, id: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(""), 1500);
    } catch {
      setCopied("");
    }
  }
  const logins = set.people.filter((p) => p.temporaryPassword).length;
  const links = set.people.length - logins;
  return (
    <section>
      <h2>{set.title}</h2>
      <p className="warn">
        {logins > 0 && (
          <>
            These temporary passwords are shown <strong>only now</strong>. Send each person their own details privately.
            They are asked to choose a new password the first time they sign in.{" "}
          </>
        )}
        {links > 0 && (
          <>
            {logins > 0 ? "People who already had an account " : "Each link "}
            {logins > 0 ? "get a one-time invitation link instead: they sign in with their existing password, then open it. " : "works once, for the matching email, and expires in seven days. "}
          </>
        )}
      </p>
      <table className="console-links">
        <thead>
          <tr>
            <th>Person</th>
            <th>Roles</th>
            <th>{logins > 0 && links === 0 ? "Temporary password" : "Password or link"}</th>
            <th><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {set.people.map((p) => (
            <tr key={p.email}>
              <td>{p.email}</td>
              <td>{p.roleKeys.length ? p.roleKeys.map((k) => roleName?.(k) ?? k).join(", ") : "owner"}</td>
              <td>
                <input
                  readOnly
                  value={p.temporaryPassword ?? `${origin}/invite#${p.token ?? ""}`}
                  onFocus={(e) => e.target.select()}
                  aria-label={`${p.temporaryPassword ? "Temporary password" : "Invitation"} for ${p.email}`}
                  style={p.temporaryPassword ? { fontFamily: "ui-monospace, monospace" } : undefined}
                />
              </td>
              <td>
                <button type="button" className="secondary" onClick={() => void copy(accessMessage(p, origin), p.email)}>
                  {copied === p.email ? "Copied" : "Copy message"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ display: "flex", gap: 10 }}>
        <button type="button" className="secondary" onClick={() => download("people-access.csv", accessCsv(set.people, origin))}>
          Download all (CSV)
        </button>
      </div>
    </section>
  );
}
