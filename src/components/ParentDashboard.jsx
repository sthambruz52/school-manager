import { useState } from "react";
import { auth } from "../firebase";
import { sendEmailVerification } from "firebase/auth";
import { theme } from "../theme";
import Header from "./ui/Header";
import Card from "./ui/Card";
import Button from "./ui/Button";
import StudentOverview from "./StudentOverview";
import { useMyChildren } from "../hooks/useAccessScope";

export default function ParentDashboard() {
  const { children, loading, unverified } = useMyChildren(true);
  const [selected, setSelected] = useState("");
  const [mail, setMail] = useState("idle");

  const email = auth.currentUser?.email || "";
  const active = children.find((c) => c.uid === selected) || children[0];

  const resend = async () => {
    setMail("sending");
    try {
      await sendEmailVerification(auth.currentUser);
      setMail("sent");
    } catch (err) {
      setMail("error");
    }
  };

  const refresh = async () => {
    try {
      await auth.currentUser.reload();
      await auth.currentUser.getIdToken(true);
    } catch (err) {
      /* ignore */
    }
    window.location.reload();
  };

  const muted = { color: theme.colors.textMuted, fontSize: "14px", lineHeight: 1.6, margin: 0 };

  return (
    <div style={{ maxWidth: "700px", margin: "10px auto 0", padding: "0 16px" }}>
      <Header
        title={children.length > 1 ? "My Children" : "My Child"}
        subtitle={active ? active.name : "Grades, fees and attendance"}
      />

      {unverified ? (
        <Card style={{ marginTop: "14px" }}>
          <div style={{ fontWeight: "800", color: theme.colors.text, marginBottom: "6px" }}>Verify your email first</div>
          <p style={muted}>
            To protect your child's records, we only show them once your email address ({email}) is verified. Open the email we sent you and tap the link.
          </p>
          {mail === "sent" && <p style={{ ...muted, color: theme.colors.success, marginTop: "8px" }}>A new link was sent. Check your inbox and spam folder.</p>}
          {mail === "error" && <p style={{ ...muted, color: theme.colors.danger, marginTop: "8px" }}>Could not send the email. Please try again later.</p>}
          <div style={{ display: "flex", gap: "10px", marginTop: "12px", flexWrap: "wrap" }}>
            <Button onClick={resend} disabled={mail === "sending"}>{mail === "sending" ? "Sending..." : "Resend email"}</Button>
            <Button variant="outline" onClick={refresh}>I've verified</Button>
          </div>
        </Card>
      ) : loading ? (
        <p style={{ textAlign: "center", color: theme.colors.textMuted, margin: "30px 0" }}>Loading...</p>
      ) : children.length === 0 ? (
        <Card style={{ marginTop: "14px" }}>
          <div style={{ fontWeight: "800", color: theme.colors.text, marginBottom: "6px" }}>No child linked yet</div>
          <p style={muted}>
            Your child appears here automatically once they are registered with <strong>{email}</strong> as the parent email. If they used a different email, ask the school office to correct it.
          </p>
        </Card>
      ) : (
        <>
          {children.length > 1 && (
            <div style={{ display: "flex", gap: "8px", overflowX: "auto", padding: "14px 0 2px" }}>
              {children.map((c) => (
                <button
                  key={c.uid}
                  onClick={() => setSelected(c.uid)}
                  style={{
                    flexShrink: 0,
                    border: "none",
                    borderRadius: "999px",
                    padding: "9px 16px",
                    fontSize: "13px",
                    fontWeight: "700",
                    background: active.uid === c.uid ? theme.colors.primary : "white",
                    color: active.uid === c.uid ? "white" : theme.colors.text,
                    boxShadow: theme.shadow
                  }}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}
          <StudentOverview key={active.uid} studentId={active.uid} fallbackName={active.name} showExtras selfLabel="Your child" />
        </>
      )}
    </div>
  );
}