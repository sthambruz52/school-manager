import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { ShieldCheck } from "lucide-react";
import { theme } from "../theme";
import Button from "./ui/Button";

export default function PendingApproval({ userData }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2000,
        background: theme.colors.bg,
        overflowY: "auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px"
      }}
    >
      <div
        style={{
          maxWidth: "420px",
          width: "100%",
          background: "white",
          borderRadius: theme.radius.lg,
          boxShadow: theme.shadow,
          padding: "32px 24px",
          textAlign: "center"
        }}
      >
        <div
          style={{
            width: "72px",
            height: "72px",
            borderRadius: "50%",
            background: "#eef0ff",
            color: theme.colors.primary,
            margin: "0 auto 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <ShieldCheck size={36} />
        </div>
        <div style={{ fontWeight: "800", fontSize: "20px", color: theme.colors.text }}>Waiting for approval</div>
        <p style={{ color: theme.colors.textMuted, fontSize: "14px", lineHeight: 1.6, margin: "10px 0 20px" }}>
          Thank you{userData?.fullName ? `, ${userData.fullName}` : ""}. Your request for {userData?.managementTitle || "management"} access has been sent to the school administrator. You will see the dashboard as soon as it is approved.
        </p>
        <Button full onClick={() => window.location.reload()}>I've been approved. Refresh</Button>
        <div style={{ marginTop: "10px" }}>
          <Button full variant="ghost" onClick={() => signOut(auth)}>Log out</Button>
        </div>
      </div>
    </div>
  );
}