import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import "./Auth.css";

export default function Login() {
  const navigate = useNavigate();

  const login = useAuthStore((state) => state.login);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setError("");
    setIsLoading(true);

    try {
      await login({
        email: email.trim(),
        password,
      });

      navigate("/");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to log in"
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-container">

        <section className="auth-intro">
          <Link to="/" className="auth-logo">
            ReLoop
          </Link>

          <div className="auth-intro-content">
            <span className="auth-eyebrow">
              <Sparkles size={16} />
              Intelligent recommerce
            </span>

            <h1>
              Welcome
              <br />
              back.
            </h1>

            <p>
              Continue discovering great pre-loved products
              and give your unused things a second life.
            </p>
          </div>
        </section>

        <section className="auth-form-section">
          <div className="auth-form-container">

            <div className="auth-heading">
              <h2>Welcome back</h2>

              <p>
                Log in to continue to your ReLoop account.
              </p>
            </div>

            {error && (
              <div className="auth-error">
                {error}
              </div>
            )}

            <form
              className="auth-form"
              onSubmit={handleSubmit}
            >

              <div className="form-field">
                <label htmlFor="login-email">
                  Email address
                </label>

                <input
                  id="login-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="login-password">
                  Password
                </label>

                <input
                  id="login-password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="auth-submit"
                disabled={isLoading}
              >
                {isLoading ? "Logging in..." : "Log in"}

                {!isLoading && <ArrowRight size={18} />}
              </button>

            </form>

            <p className="auth-switch">
              Don't have an account?{" "}
              <Link to="/register">
                Create one
              </Link>
            </p>

          </div>
        </section>

      </div>
    </main>
  );
}