import { useEffect, useState, type FormEvent } from "react";
import { ControlOrganizationListSchema } from "@orbit/contracts";
import { mutate, request } from "../saas/client";
import "../saas/saas.css";
const onSubmitAsync =
  (fn: (event: FormEvent<HTMLFormElement>) => Promise<void>) =>
  (event: FormEvent<HTMLFormElement>) => {
    void fn(event);
  };
export function OperatorConsoleRoute() {
  const [message, setMessage] = useState("");
  const [invitation, setInvitation] = useState("");
  const [busy, setBusy] = useState(false);
  const [organizations, setOrganizations] = useState<
    ReturnType<typeof ControlOrganizationListSchema.parse>
  >([]);
  useEffect(() => {
    request("/api/control/organizations", ControlOrganizationListSchema)
      .then(setOrganizations)
      .catch((e) => setMessage(e.message));
  }, []);
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setInvitation("");
    try {
      const result = await mutate("/api/control/organizations", {
        name: data.get("name"),
        ownerEmail: data.get("email"),
      });
      setInvitation(`${window.location.origin}/invite#${result.token}`);
      setMessage(
        "Organization created. Share this invitation privately with its owner. It expires in seven days.",
      );
      setOrganizations(
        await request(
          "/api/control/organizations",
          ControlOrganizationListSchema,
        ),
      );
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "Unable to provision organization.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="saas-auth">
      <a href="/">← Customer workspace</a>
      <p className="eyebrow">PLATFORM SETUP</p>
      <h1>Create an organization</h1>
      <p>
        Provision an empty workspace. Its owner controls membership,
        definitions, approvals and customer data.
      </p>
      <form onSubmit={(event) => void create(event)}>
        <label>
          Organization name
          <input name="name" required maxLength={120} />
        </label>
        <label>
          Owner’s verified sign-in email
          <input name="email" type="email" required />
        </label>
        <button disabled={busy}>
          {busy ? "Creating…" : "Create organization"}
        </button>
      </form>
      <output>{message}</output>
      {invitation && (
        <label>
          Private owner invitation
          <input
            readOnly
            value={invitation}
            onFocus={(e) => e.target.select()}
          />
        </label>
      )}
      <aside>
        This console has no customer values, result exports, impersonation or
        membership override.
      </aside>
      <hr />
      <h2>Propose a starter KPI</h2>
      <p>
        The customer reviews this setup proposal. It creates a draft, never an
        automatically activated calculation.
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
            await mutate(
              `/api/control/organizations/${v("tenant")}/proposals`,
              {
                title: v("name"),
                measures: [
                  { key: v("inputA"), name: v("inputA"), unit: measureUnit },
                  ...(percent
                    ? [
                        {
                          key: v("inputB"),
                          name: v("inputB"),
                          unit: measureUnit,
                        },
                      ]
                    : []),
                ],
                kpis: [
                  {
                    key: v("key"),
                    name: v("name"),
                    description: v("description"),
                    unit: percent ? "%" : measureUnit,
                    formula: percent
                      ? {
                          op: "percent",
                          left: { op: "measure", key: v("inputA") },
                          right: { op: "measure", key: v("inputB") },
                        }
                      : { op: "measure", key: v("inputA") },
                    direction: "neutral",
                    target: null,
                  },
                ],
                roles: [],
              },
            );
            setMessage("Proposal sent for customer review.");
          } catch (error) {
            setMessage(
              error instanceof Error
                ? error.message
                : "Unable to propose setup.",
            );
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
        <label>
          KPI name
          <input name="name" required maxLength={120} />
        </label>
        <label>
          KPI key
          <input name="key" required pattern="[a-z][a-z0-9_]*" />
        </label>
        <label>
          Business definition
          <input name="description" required maxLength={2000} />
        </label>
        <label>
          Calculation
          <select name="calculation">
            <option value="direct">Direct measure</option>
            <option value="percent">A ÷ B × 100</option>
          </select>
        </label>
        <label>
          Input A key
          <input name="inputA" required pattern="[a-z][a-z0-9_]*" />
        </label>
        <label>
          Input B key (for percentage)
          <input name="inputB" pattern="[a-z][a-z0-9_]*" />
        </label>
        <label>
          Input unit
          <input name="measureUnit" required placeholder="orders, hours…" />
        </label>
        <button disabled={busy || !organizations.length}>
          Send setup proposal
        </button>
      </form>
    </main>
  );
}
