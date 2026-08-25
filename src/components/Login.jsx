import { useState } from "react";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

export default function Login({ onLoginSuccess, initialMode }) {
  const [isSignup, setIsSignup] = useState(initialMode === "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Parent");
  const [error, setError] = useState("");
    const [resetSent, setResetSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const isTransientError = (msg) => {
    const lower = (msg || "").toLowerCase();
    return lower.includes("database") || lower.includes("indexeddb") || lower.includes("closing");
  };

  const attemptAuth = async (action, retrying = false) => {
    try {
      await action();
    } catch (err) {
      if (!retrying && isTransientError(err.message)) {
        await new Promise((res) => setTimeout(res, 900));
        return attemptAuth(action, true);
      }
      throw err;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignup) {
        await attemptAuth(async () => {
          const cred = await createUserWithEmailAndPassword(auth, email, password);
          await setDoc(doc(db, "users", cred.user.uid), {
            email,
            role,
            status: "active",
            createdAt: new Date()
          });
        });
      } else {
        await attemptAuth(async () => {
          await signInWithEmailAndPassword(auth, email, password);
        });
      }
      if (onLoginSuccess) onLoginSuccess();
    } catch (err) {
      setError(err.message.replace("Firebase: ", ""));
    }

    setLoading(false);
  };
  const handleForgotPassword = async () => {
    if (!email) {
      setError("Enter your email above first, then tap 'Forgot password?'");
      return;
    }
    setError("");
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
    } catch (err) {
      setError(err.message.replace("Firebase: ", ""));
    }
  };
  return (
    <div style={{ maxWidth: "360px", margin: "60px auto", padding: "24px", background: "white", borderRadius: "10px" }}>
      <h2 style={{ textAlign: "center" }}>{isSignup ? "Create Account" : "Login"}</h2>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ padding: "10px", borderRadius: "6px" }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          style={{ padding: "10px", borderRadius: "6px" }}
        />

        {isSignup && (
          <select value={role} onChange={(e) => setRole(e.target.value)} style={{ padding: "10px", borderRadius: "6px" }}>
            <option value="Parent">Parent</option>
            <option value="Student">Student</option>
            <option value="Teacher">Teacher</option>
          </select>
        )}

        {error && <p style={{ color: "#c2704e", fontSize: "14px" }}>{error}</p>}
        {resetSent && <p style={{ color: "#1f4d3a", fontSize: "14px" }}>Password reset email sent! Check your inbox — and your spam/junk folder if you don't see it within a few minutes.</p>}

        {!isSignup && (
          <p onClick={handleForgotPassword} style={{ color: "#1f4d3a", fontSize: "13px", cursor: "pointer", textAlign: "right", margin: "-4px 0 0" }}>
            Forgot password?
          </p>
        )}

        <button type="submit" disabled={loading} style={{ background: "#1f4d3a", color: "white", padding: "10px", borderRadius: "6px" }}>
          {loading ? "Please wait..." : isSignup ? "Sign Up" : "Login"}
        </button>
      </form>

      <p style={{ textAlign: "center", marginTop: "12px" }}>
        {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
        <span
          onClick={() => { setIsSignup(!isSignup); setError(""); }}
          style={{ color: "#1f4d3a", cursor: "pointer", fontWeight: "bold" }}
        >
          {isSignup ? "Login" : "Sign Up"}
        </span>
      </p>
    </div>
  );
}