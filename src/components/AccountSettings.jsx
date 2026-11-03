import { useState } from "react";
import { db, auth } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { Lock, Bell, Eye, EyeOff } from "lucide-react";
import { theme, field } from "../theme";
import Header from "./ui/Header";
import Card from "./ui/Card";
import Button from "./ui/Button";
import Avatar from "./ui/Avatar";
import StatusPill from "./ui/StatusPill";

const friendly = (err) => {
  const code = err?.code || "";
  if (code.includes("wrong-password") || code.includes("invalid-credential")) return "Your current password is incorrect.";
  if (code.includes("weak-password")) return "Choose a stronger password (at least 6 characters).";
  if (code.includes("too-many-requests")) return "Too many attempts. Please wait a few minutes and try again.";
  if (code.includes("requires-recent-login")) return "For security, please log out, log in again, then try once more.";
  if (code.includes("network")) return "No connection. Check your internet and try again.";
  return "Could not update the password. Please try again.";
};

export default function AccountSettings({ userData }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirmNext, setConfirmNext] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwDone, setPwDone] = useState("");
  const [notifBusy, setNotifBusy] = useState(false);

  const supported = typeof Notification !== "undefined";
  const [perm, setPerm] = useState(supported ? Notification.permission : "unsupported");

  const email = auth.currentUser?.email || "";
  const name = userData?.fullName || email;
  const notificationsOn = userData?.notificationsEnabled !== false;
  const pwType = showPw ? "text" : "password";

  const changePassword = async () => {
    setPwError("");
    setPwDone("");
    if (!current || !next || !confirmNext) return setPwError("Fill in all three fields.");
    if (next.length < 6) return setPwError("The new password must be at least 6 characters.");
    if (next !== confirmNext) return setPwError("The new password and the confirmation don't match.");
    if (next === current) return setPwError("The new password must be different from the current one.");

    setBusy(true);
    try {
      const credential = EmailAuthProvider.credential(email, current);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, next);
      setPwDone("Password updated successfully.");
      setCurrent("");
      setNext("");
      setConfirmNext("");
    } catch (err) {
      setPwError(friendly(err));
    }
    setBusy(false);
  };

  const toggleNotifications = async () => {
    setNotifBusy(true);
    try {
      await updateDoc(doc(db, "users", auth.currentUser.uid), { notificationsEnabled: !notificationsOn });
    } catch (err) {
      alert("Could not save that setting. Please try again.");
    }
    setNotifBusy(false);
  };

  const askPermission = async () => {
    try {
      setPerm(await Notification.requestPermission());
    } catch (err) {
      /* ignore */
    }
  };

  const pwField = { ...field, width: "100%" };

  return (
    <div style={{ maxWidth: "700px", margin: "10px auto 0", padding: "0 16px" }}>
      <Header title="Account Settings" subtitle="Password and notifications" />

      <Card style={{ marginTop: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <Avatar name={name} photoURL={userData?.photoURL} size={72} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: "800", fontSize: "17px", color: theme.colors.text }}>{name}</div>
            <div style={{ fontSize: "13px", color: theme.colors.textMuted, wordBreak: "break-all" }}>{email}</div>
            <div style={{ marginTop: "6px" }}>
              <StatusPill label={userData?.role || "Account"} variant="info" />
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#eef0ff", color: "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Lock size={20} />
          </div>
          <div style={{ fontWeight: "800", color: theme.colors.text }}>Change Password</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <input type={pwType} value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="Current password" style={pwField} autoComplete="current-password" />
          <input type={pwType} value={next} onChange={(e) => setNext(e.target.value)} placeholder="New password" style={pwField} autoComplete="new-password" />
          <input type={pwType} value={confirmNext} onChange={(e) => setConfirmNext(e.target.value)} placeholder="Confirm new password" style={pwField} autoComplete="new-password" />

          <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: theme.colors.textMuted, cursor: "pointer" }}>
            <input type="checkbox" checked={showPw} onChange={(e) => setShowPw(e.target.checked)} />
            {showPw ? <Eye size={15} /> : <EyeOff size={15} />} Show passwords
          </label>

          {pwError && <div style={{ color: theme.colors.danger, fontSize: "13px", fontWeight: "600" }}>{pwError}</div>}
          {pwDone && <div style={{ color: theme.colors.success, fontSize: "13px", fontWeight: "600" }}>{pwDone}</div>}

          <Button full onClick={changePassword} disabled={busy}>{busy ? "Updating..." : "Update Password"}</Button>
        </div>
      </Card>

      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#fef3c7", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Bell size={20} />
          </div>
          <div style={{ fontWeight: "800", color: theme.colors.text }}>Notifications</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: "600", fontSize: "14px", color: theme.colors.text }}>Popup alerts for new chat messages</div>
            <div style={{ fontSize: "12px", color: theme.colors.textMuted }}>The unread dot in the menu always shows.</div>
          </div>
          <button
            role="switch"
            aria-checked={notificationsOn}
            aria-label="Popup alerts for new chat messages"
            onClick={toggleNotifications}
            disabled={notifBusy}
            style={{
              width: "52px",
              height: "30px",
              borderRadius: "999px",
              border: "none",
              padding: "3px",
              display: "flex",
              justifyContent: notificationsOn ? "flex-end" : "flex-start",
              background: notificationsOn ? theme.colors.primary : "#d1d5db",
              flexShrink: 0
            }}
          >
            <span style={{ width: "24px", height: "24px", borderRadius: "50%", background: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
          </button>
        </div>

        <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: `1px solid ${theme.colors.border}`, fontSize: "13px", color: theme.colors.textMuted }}>
          {perm === "granted" && <StatusPill label="Allowed in this browser" variant="success" />}
          {perm === "default" && (
            <Button size="sm" variant="outline" onClick={askPermission}>Allow in this browser</Button>
          )}
          {perm === "denied" && "Blocked in this browser. Allow notifications for this site in your browser settings to get popups."}
          {perm === "unsupported" && "This browser can't show popups. You'll still see the unread dot in the menu."}
        </div>
      </Card>
    </div>
  );
}