import { useState } from "react";
import { sendEmailVerification } from "firebase/auth";
import { MailCheck, X } from "lucide-react";
import { theme } from "../theme";

const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

const wasHidden = () => {
  try {
    return sessionStorage.getItem("hideVerifyBanner") === "1";
  } catch {
    return false;
  }
};

export default function VerifyEmailBanner({ user }) {
  const [hidden, setHidden] = useState(wasHidden);
  const [state, setState] = useState("idle");

  if (!user || user.emailVerified || hidden) return null;

  const created = new Date(user.metadata?.creationTime || 0).getTime();
  if (!created || Date.now() - created > THIRTY_DAYS) return null;

  const hide = () => {
    try {
      sessionStorage.setItem("hideVerifyBanner", "1");
    } catch {
      /* ignore */
    }
    setHidden(true);
  };

  const resend = async () => {
    setState("sending");
    try {
      await sendEmailVerification(user);
      setState("sent");
    } catch (err) {
      setState(String(err?.code || "").includes("too-many-requests") ? "wait" : "error");
    }
  };

  const message =
    state === "sent"
      ? `We sent a new link to ${user.email}. Check your inbox and your spam folder.`
      : state === "wait"
      ? "Please wait a few minutes before asking for another email."
      : state === "error"
      ? "Could not send the email. Please try again later."
      : `Please verify your email. We sent a link to ${user.email}.`;

  const small = {
    border: "none",
    borderRadius: theme.radius.sm,
    padding: "7px 12px",
    fontSize: "12px",
    fontWeight: "700"
  };

  return (
    <div
      style={{
        position: "fixed",
        left: "12px",
        right: "12px",
        bottom: "96px",
        maxWidth: "520px",
        margin: "0 auto",
        zIndex: 35,
        background: "white",
        borderRadius: theme.radius.md,
        boxShadow: "0 8px 24px rgba(30,27,46,0.22)",
        padding: "12px 14px",
        display: "flex",
        alignItems: "flex-start",
        gap: "10px"
      }}
    >
      <div style={{ color: theme.colors.primary, marginTop: "2px" }}>
        <MailCheck size={20} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "13px", color: theme.colors.text, lineHeight: 1.5 }}>{message}</div>
        <div style={{ display: "flex", gap: "8px", marginTop: "8px", flexWrap: "wrap" }}>
          <button
            onClick={resend}
            disabled={state === "sending"}
            style={{ ...small, background: theme.colors.primary, color: "white" }}
          >
            {state === "sending" ? "Sending..." : "Resend email"}
          </button>
          <button
                        onClick={async () => {
              try {
                await user.reload();
                await user.getIdToken(true);
              } catch (e) {
                /* ignore */
              }
              window.location.reload();
            }}
            style={{ ...small, background: "#eef0ff", color: theme.colors.primary }}
          >
            I've verified
          </button>
        </div>
      </div>
      <button
        onClick={hide}
        aria-label="Dismiss"
        style={{ background: "transparent", border: "none", color: theme.colors.textMuted, padding: "2px", display: "flex" }}
      >
        <X size={18} />
      </button>
    </div>
  );
}