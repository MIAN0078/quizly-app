
import { useState } from "react";
import { signIn } from "../lib/auth";
import { supabase } from "../lib/supabase";

interface LoginProps {
  onLogin: (name: string) => void;
}

function Login({ onLogin }: LoginProps) {
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [errors, setErrors] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const newErrors = {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    };

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (isSignup && !name.trim()) {
      newErrors.name = "Full name is required.";
    }

    if (!email.trim()) {
      newErrors.email = "Email address is required.";
    } else if (!emailPattern.test(email.trim())) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (!password) {
      newErrors.password = "Password is required.";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters.";
    } else if (!/[A-Z]/.test(password)) {
      newErrors.password = "Add at least one uppercase letter.";
    } else if (!/[a-z]/.test(password)) {
      newErrors.password = "Add at least one lowercase letter.";
    } else if (!/[0-9]/.test(password)) {
      newErrors.password = "Add at least one number.";
    }

    if (isSignup && !confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password.";
    } else if (isSignup && password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(newErrors);

    if (Object.values(newErrors).some((error) => error !== "")) {
      return;
    }

    setIsLoading(true);

    try {
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: name.trim(),
            },
          },
        });

        if (error) {
          throw error;
        }

        if (data.session) {
          onLogin(name.trim());
        } else {
          alert(
            "Account created! Please check your email for confirmation before signing in."
          );
        }
      } else {
        await signIn(email.trim(), password);

        const userName = email.trim().split("@")[0];

        onLogin(userName);
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.";

      alert(message);
    } finally {
      setIsLoading(false);
    }
  }

  function switchMode() {
    setIsSignup((prev) => !prev);
    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");

    setErrors({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
  }

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-brand">
          <span className="login-brand-icon">Q</span>
          <span>Quizly</span>
        </div>

        <div className="login-welcome">
          <span className="login-tag">LEARN. PLAY. GROW.</span>

          <h1>
            {isSignup
              ? "Start your learning journey!"
              : "Welcome back to Quizly!"}
          </h1>

          <p>
            {isSignup
              ? "Create your account, explore quizzes and track your learning progress."
              : "Continue your learning journey, test your knowledge and track your progress with Quizly."}
          </p>

          <div className="login-decoration">
            <div className="login-circle">?</div>
            <div className="login-small-card">🎯 Keep learning!</div>
            <div className="login-small-card second">
              🏆 Reach your goals!
            </div>
          </div>
        </div>

        <p className="login-copyright">
          © 2026 Quizly. All rights reserved.
        </p>
      </div>

      <div className="login-right">
        <div className="login-form-wrapper">
          <div className="login-mobile-brand">Q</div>

          <span className="login-tag">YOUR LEARNING SPACE</span>

          <h2>
            {isSignup ? "Create your account" : "Sign in to your account"}
          </h2>

          <p className="login-subtitle">
            {isSignup
              ? "Fill in your details to join Quizly."
              : "Enter your details to access your dashboard."}
          </p>

          <form onSubmit={handleSubmit} noValidate>
            {isSignup && (
              <>
                <label htmlFor="signup-name">Full Name</label>

                <input
                  id="signup-name"
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  className={errors.name ? "input-error" : ""}
                  onChange={(e) => {
                    setName(e.target.value);
                    setErrors((prev) => ({ ...prev, name: "" }));
                  }}
                />

                {errors.name && (
                  <p className="validation-error">{errors.name}</p>
                )}
              </>
            )}

            <label htmlFor="login-email">Email Address</label>

            <input
              id="login-email"
              type="email"
              placeholder="Enter your email"
              value={email}
              className={errors.email ? "input-error" : ""}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors((prev) => ({ ...prev, email: "" }));
              }}
            />

            {errors.email && (
              <p className="validation-error">{errors.email}</p>
            )}

            <div className="login-password-label">
              <label htmlFor="login-password">Password</label>
              <span>Keep it secure</span>
            </div>

            <input
              id="login-password"
              type="password"
              placeholder="Enter your password"
              value={password}
              className={errors.password ? "input-error" : ""}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors((prev) => ({ ...prev, password: "" }));
              }}
            />

            {errors.password && (
              <p className="validation-error">{errors.password}</p>
            )}

            {isSignup && (
              <>
                <label htmlFor="confirm-password">
                  Confirm Password
                </label>

                <input
                  id="confirm-password"
                  type="password"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  className={errors.confirmPassword ? "input-error" : ""}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setErrors((prev) => ({
                      ...prev,
                      confirmPassword: "",
                    }));
                  }}
                />

                {errors.confirmPassword && (
                  <p className="validation-error">
                    {errors.confirmPassword}
                  </p>
                )}
              </>
            )}

            <button
              className="login-submit"
              type="submit"
              disabled={isLoading}
            >
              {isLoading
                ? "Please wait..."
                : isSignup
                  ? "Create Account"
                  : "Sign In"}

              <span>→</span>
            </button>
          </form>

          <p className="signup-switch">
            {isSignup
              ? "Already have an account?"
              : "Don't have an account?"}{" "}
            <button type="button" onClick={switchMode}>
              {isSignup ? "Sign In" : "Sign Up"}
            </button>
          </p>

          <p className="login-note">
            Welcome to Quizly — your learning journey starts here.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
