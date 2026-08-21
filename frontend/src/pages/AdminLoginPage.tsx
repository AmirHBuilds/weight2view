import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "../components/admin/AdminAuthContext";
import { ApiError } from "../lib/api";

export function AdminLoginPage() {
  const { login } = useAdminAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/admin", { replace: true });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl font-medium text-paper">
            Weight<span className="text-teal">2</span>View
          </h1>
          <p className="mt-2 text-paper-dim">Admin Login</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-line bg-ink-soft/40 p-6"
        >
          <div>
            <label className="mb-1.5 block font-mono text-xs uppercase tracking-widest text-paper-dim">
              Email
            </label>
            <input
              type="email"
              required
              autoFocus
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="mb-1.5 block font-mono text-xs uppercase tracking-widest text-paper-dim">
              Password
            </label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
            />
          </div>

          {error && (
            <p className="rounded-lg border border-clay/30 bg-clay/10 px-3 py-2 text-sm text-clay">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-teal py-3 font-medium text-ink transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>

          <p className="text-center text-xs text-paper-dim">
            Forgot password? Ask a super admin to reset it from{" "}
            <span className="font-mono">/admin/admins</span>.
          </p>
        </form>
      </div>
    </div>
  );
}
