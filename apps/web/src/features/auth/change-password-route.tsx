import { useState, type FormEvent } from "react";
import { getAuthClient } from "../../lib/auth";
export function ChangePasswordRoute() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const passwordValue = data.get("password"),
      confirmationValue = data.get("confirmation");
    const password = typeof passwordValue === "string" ? passwordValue : "";
    const confirmation =
      typeof confirmationValue === "string" ? confirmationValue : "";
    if (password !== confirmation) {
      setMessage("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const client = await getAuthClient();
      const { error } = await client.auth.updateUser({ password });
      setMessage(
        error
          ? "Password could not be changed. Check your session and password requirements."
          : "Your password has been changed.",
      );
    } catch {
      setMessage("Authentication is unavailable.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="saas-auth">
      <h1>Change password</h1>
      <form onSubmit={(event) => void submit(event)}>
        <label>
          New password
          <input
            name="password"
            type="password"
            minLength={12}
            required
            autoComplete="new-password"
          />
        </label>
        <label>
          Confirm password
          <input
            name="confirmation"
            type="password"
            minLength={12}
            required
            autoComplete="new-password"
          />
        </label>
        <button disabled={busy}>Save password</button>
      </form>
      <output>{message}</output>
      <a href="/">Return to workspace</a>
    </main>
  );
}
