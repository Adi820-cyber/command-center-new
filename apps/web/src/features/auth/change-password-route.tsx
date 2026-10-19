import { useEffect, useState, type FormEvent } from "react";
import { getAuthClient, getCurrentSession } from "../../lib/auth";
export function ChangePasswordRoute() {
  // A person given a temporary password is sent here before anything else.
  const [firstTime, setFirstTime] = useState(false);
  useEffect(() => {
    void getCurrentSession().then((session) => {
      setFirstTime(session?.user.user_metadata?.must_change_password === true);
    });
  }, []);
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
      const { error } = await client.auth.updateUser({ password, data: { must_change_password: false } });
      setMessage(
        error
          ? "Password could not be changed. Check your session and password requirements."
          : "Your password has been changed.",
      );
      if (!error && firstTime) setTimeout(() => window.location.assign("/"), 1200);
    } catch {
      setMessage("Authentication is unavailable.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="saas-auth">
      <h1>{firstTime ? "Choose your own password" : "Change password"}</h1>
      {firstTime && (
        <p>
          You signed in with a temporary password. Choose your own now; it takes a few seconds, and then your workspace opens.
        </p>
      )}
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
