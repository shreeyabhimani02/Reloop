import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import "./Auth.css";

export default function Register() {
  const navigate = useNavigate();

  const register = useAuthStore((state) => state.register);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [location, setLocation] = useState("");

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setError("");
    setIsLoading(true);

    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        location: location.trim(),
      });

      navigate("/");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to create your account"
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-container">

        {/* Left side */}
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
              Give things
              <br />
              a second life.
            </h1>

            <p>
              Buy pre-loved products, sell what you no longer
              need, and be part of a more circular way to shop.
            </p>
          </div>
        </section>

        {/* Right side */}
        <section className="auth-form-section">
          <div className="auth-form-container">

            <div className="auth-heading">
              <h2>Create your account</h2>

              <p>
                Start your ReLoop journey today.
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
                <label htmlFor="name">
                  Full name
                </label>

                <input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  minLength={2}
                  maxLength={50}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="email">
                  Email address
                </label>

                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="password">
                  Password
                </label>

                <input
                  id="password"
                  type="password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  maxLength={100}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="location">
                  Location
                  <span> Optional</span>
                </label>

                <input
                  id="location"
                  type="text"
                  placeholder="e.g. Mumbai"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  maxLength={100}
                />
              </div>

              <button
                type="submit"
                className="auth-submit"
                disabled={isLoading}
              >
                {isLoading
                  ? "Creating account..."
                  : "Create account"}

                {!isLoading && <ArrowRight size={18} />}
              </button>

            </form>

            <p className="auth-switch">
              Already have an account?{" "}
              <Link to="/login">
                Log in
              </Link>
            </p>

          </div>
        </section>

      </div>
    </main>
  );
}