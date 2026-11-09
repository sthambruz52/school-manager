import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, sendEmailVerification } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { Mail, Lock, Eye, EyeOff, ChevronLeft, GraduationCap, Users, Briefcase, ShieldCheck } from "lucide-react";
import { theme, field } from "../theme";
import Card from "./ui/Card";
import Button from "./ui/Button";
import SelectWithManual from "./ui/SelectWithManual";
import PolicyLink from "./PolicyLink";
const ROLES = [
  ["Student", GraduationCap],
  ["Parent", Users],
  ["Teacher", Briefcase],
  ["Management", ShieldCheck]
];

const friendly = (err) => {
  const code = err?.code || "";
  if (code.includes("invalid-credential") || code.includes("wrong-password") || code.includes("user-not-found")) {
    return "Incorrect email or password.";
  }
  if (code.includes("email-already-in-use")) return "An account with this email already exists. Try logging in instead.";
  if (code.includes("invalid-email")) return "That email address doesn't look right.";
  if (code.includes("weak-password")) return "Choose a stronger password (at least 6 characters).";
  if (code.includes("too-many-requests")) return "Too many attempts. Please wait a few minutes and try again.";
  if (code.includes("network")) return "No connection. Check your internet and try again.";
  if (code.includes("permission-denied")) return "We couldn't finish setting up your account. Please contact the school.";
  return "Something went wrong. Please try again.";
};

const isTransient = (err) => {
  const msg = (err?.message || "").toLowerCase();
  return msg.includes("database") || msg.includes("indexeddb") || msg.includes("closing");
};

const withRetry = async (fn) => {
  try {
    return await fn();
  } catch (err) {
    if (isTransient(err)) {
      await new Promise((res) => setTimeout(res, 900));
      return fn();
    }
    throw err;
  }
};

function IconInput({ icon: Icon, right, ...props }) {
  return (
    <div style={{ position: "relative" }}>
      <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", display: "flex" }}>
        <Icon size={18} />
      </span>
      <input {...props} style={{ ...field, width: "100%", padding: "13px 44px 13px 40px", fontSize: "15px" }} />
      {right}
    </div>
  );
}

export default function Login({ onLoginSuccess, initialMode, onBack }) {
  const [isSignup, setIsSignup] = useState(initialMode === "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [role, setRole] = useState("Student");
  const [fullName, setFullName] = useState("");
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [school, setSchool] = useState(null);

  useEffect(() => {
    getDoc(doc(db, "settings", "schoolInfo"))
      .then((s) => { if (s.exists()) setSchool(s.data()); })
      .catch(() => {});
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setNotice("");
    const cleanEmail = email.trim();

    if (!cleanEmail || !password) return setError("Enter your email and password.");
    if (isSignup && password.length < 6) return setError("Choose a password with at least 6 characters.");

        if (isSignup && role === "Management" && (!fullName.trim() || !title.trim())) {
      return setError("Enter your full name and choose your title.");
    }

    setLoading(true);
    try {
      if (isSignup) {
        const cred = await withRetry(() => createUserWithEmailAndPassword(auth, cleanEmail, password));
                try {
          await sendEmailVerification(cred.user);
        } catch (e) {
          /* the account is still created if the email fails */
        }        
        let needsApproval = role === "Teacher" || role === "Management";
        if (!needsApproval) {
          try {
            const sec = await getDoc(doc(db, "settings", "security"));
            needsApproval = sec.exists() && sec.data().requireApproval === true;
          } catch (e) {
            /* ignore */
          }
        }
        await withRetry(() =>
          setDoc(doc(db, "users", cred.user.uid), {
            email: cleanEmail,
            role,
            status: "active",
            ...(role === "Management" ? { fullName: fullName.trim(), managementTitle: title.trim(), approved: false } : {}),
                        ...(needsApproval ? { approved: false } : {}),
            createdAt: new Date()
          })
        );
      } else {
        await withRetry(() => signInWithEmailAndPassword(auth, cleanEmail, password));
      }
      if (onLoginSuccess) onLoginSuccess();
    } catch (err) {
      setError(friendly(err));
    }
    setLoading(false);
  };

  const forgot = async () => {
    setError("");
    setNotice("");
    if (!email.trim()) return setError("Type your email above first, then tap Forgot password.");
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (err) {
      if (!String(err?.code || "").includes("user-not-found")) return setError(friendly(err));
    }
    setNotice("If that email has an account, a reset link is on its way. Check your inbox and your spam folder.");
  };

  const switchMode = () => {
    setIsSignup(!isSignup);
    setError("");
    setNotice("");
  };

  const standalone = !!onBack;
  const page = standalone
    ? { position: "fixed", inset: 0, zIndex: 1000, overflowY: "auto", background: theme.colors.bg }
    : { margin: "20px auto", maxWidth: "420px" };

  return (
    <div style={page}>
      {standalone && (
        <div style={{ background: theme.gradient("#4338ca", "#7c3aed"), color: "white", padding: "16px 18px 96px", textAlign: "center" }}>
          <div style={{ textAlign: "left" }}>
            <button
              onClick={onBack}
              style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "rgba(255,255,255,0.18)", color: "white", border: "none", borderRadius: theme.radius.sm, padding: "8px 12px", fontWeight: "700", fontSize: "13px" }}
            >
              <ChevronLeft size={16} /> Back
            </button>
          </div>
          <img
            src="/logo.jpg"
            alt=""
            style={{ width: "68px", height: "68px", borderRadius: "16px", background: "white", objectFit: "contain", padding: "5px", marginTop: "10px" }}
          />
          <div style={{ fontWeight: "800", fontSize: "18px", marginTop: "10px", textTransform: "uppercase", padding: "0 10px" }}>
            {school?.schoolName || "Welcome"}
          </div>
          {school?.tagline && <div style={{ fontSize: "13px", opacity: 0.9, marginTop: "2px", fontStyle: "italic" }}>{school.tagline}</div>}
        </div>
      )}

      <div style={{ maxWidth: "420px", margin: standalone ? "-68px auto 0" : "0 auto", padding: standalone ? "0 16px 40px" : "0" }}>
        <Card style={{ padding: "22px" }}>
          <div style={{ fontWeight: "800", fontSize: "22px", color: theme.colors.text }}>
            {isSignup ? "Create your account" : "Welcome back"}
          </div>
          <div style={{ fontSize: "14px", color: theme.colors.textMuted, margin: "4px 0 18px" }}>
            {isSignup ? "Join in a minute. You'll finish your profile next." : "Log in to continue."}
          </div>

          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {isSignup && (
              <div>
                <div style={{ fontSize: "12px", fontWeight: "700", color: theme.colors.textMuted, marginBottom: "6px" }}>I AM A</div>
                <div style={{ display: "flex", gap: "8px" }}>
                  {ROLES.map(([name, Icon]) => {
                    const on = role === name;
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => setRole(name)}
                        style={{
                          flex: 1,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: "4px",
                          padding: "10px 4px",
                          borderRadius: theme.radius.sm,
                          fontSize: "13px",
                          fontWeight: "700",
                          border: `1.5px solid ${on ? theme.colors.primary : theme.colors.border}`,
                          background: on ? "#eef0ff" : "white",
                          color: on ? theme.colors.primary : theme.colors.textMuted
                        }}
                      >
                        <Icon size={20} /> {name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <IconInput
              icon={Mail}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              autoComplete="email"
            />

            <IconInput
              icon={Lock}
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete={isSignup ? "new-password" : "current-password"}
              right={
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  aria-label={showPw ? "Hide password" : "Show password"}
                  style={{ position: "absolute", right: "6px", top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: "#6b7280", padding: "8px", display: "flex" }}
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
            />
            {isSignup && role === "Management" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  style={{ ...field, width: "100%", padding: "13px", fontSize: "15px" }}
                />
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                  <SelectWithManual
                    value={title}
                    onChange={setTitle}
                    options={["School Owner", "Proprietor", "Director", "Principal", "Vice Principal", "Head Teacher"]}
                    placeholder="Select your title"
                    manualPlaceholder="Type your title"
                  />
                </div>
                <div style={{ background: "#eef0ff", color: theme.colors.primary, fontSize: "13px", fontWeight: "600", padding: "10px 12px", borderRadius: theme.radius.sm }}>
                  Management accounts are reviewed by the school administrator. You will see the dashboard once you are approved.
                </div>
              </div>
            )}
            {!isSignup && (
              <div style={{ textAlign: "right", marginTop: "-4px" }}>
                <button
                  type="button"
                  onClick={forgot}
                  style={{ background: "transparent", border: "none", color: theme.colors.primary, fontWeight: "700", fontSize: "13px", padding: "2px" }}
                >
                  Forgot password?
                </button>
              </div>
            )}

            {error && (
              <div style={{ background: theme.colors.dangerBg, color: theme.colors.danger, fontSize: "13px", fontWeight: "600", padding: "10px 12px", borderRadius: theme.radius.sm }}>
                {error}
              </div>
            )}
            {notice && (
              <div style={{ background: theme.colors.successBg, color: theme.colors.success, fontSize: "13px", fontWeight: "600", padding: "10px 12px", borderRadius: theme.radius.sm }}>
                {notice}
              </div>
            )}
            {isSignup && role === "Teacher" && (
              <div style={{ background: "#eef0ff", color: theme.colors.primary, fontSize: "13px", fontWeight: "600", padding: "10px 12px", borderRadius: theme.radius.sm }}>
                Teacher accounts are reviewed by the school administrator. You will see your dashboard once you are approved.
              </div>
            )}

            {isSignup && (
              <div style={{ fontSize: "12px", color: theme.colors.textMuted, textAlign: "center", lineHeight: 1.5 }}>
                By creating an account you agree to the school's <PolicyLink style={{ color: theme.colors.primary, fontWeight: "700" }} />.
              </div>
            )}
            <Button type="submit" full disabled={loading}>
              {loading ? "Please wait..." : isSignup ? "Create Account" : "Log In"}
            </Button>
          </form>

          <div style={{ textAlign: "center", marginTop: "16px", fontSize: "14px", color: theme.colors.textMuted }}>
            {isSignup ? "Already have an account? " : "Don't have an account? "}
            <button
              type="button"
              onClick={switchMode}
              style={{ background: "transparent", border: "none", color: theme.colors.primary, fontWeight: "800", fontSize: "14px", padding: 0 }}
            >
              {isSignup ? "Log in" : "Sign up"}
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}