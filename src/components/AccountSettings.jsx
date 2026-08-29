import { useState } from "react";
import { db, auth } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";

export default function AccountSettings({ userData }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [notifSaving, setNotifSaving] = useState(false);
  const notificationsEnabled = userData?.notificationsEnabled !== false;

  const handleChangePassword = async () => {
    setPasswordError("");
    setPasswordMessage("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Fill in all three fields.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirmation don't match.");
      return;
    }

    setPasswordSaving(true);
    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);
      setPasswordMessage("Password updated successfully.");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (err) {
      setPasswordError(err.message.replace("Firebase: ", ""));
    }
    setPasswordSaving(false);
  };

  const toggleNotifications = async () => {
    setNotifSaving(true);
    await updateDoc(doc(db, "users", auth.currentUser.uid), {
      notificationsEnabled: !notificationsEnabled
    });
    setNotifSaving(false);
  };

  const inputStyle = { padding: "10px", borderRadius: "6px", width: "100%", boxSizing: "border-box" };

  return (
    <div style={{ maxWidth: "480px", margin: "20px auto", padding: "0 20px" }}>
      <h2 style={{ textAlign: "center" }}>Account Settings</h2>

      <div style={{ background: "white", padding: "16px", borderRadius: "10px", marginBottom: "20px" }}>
        <h3 style={{ marginTop: 0 }}>Change Password</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Current password"
            style={inputStyle}
          />
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password"
            style={inputStyle}
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            style={inputStyle}
          />
          {passwordError && <p style={{ color: "#c2704e", fontSize: "13px", margin: 0 }}>{passwordError}</p>}
          {passwordMessage && <p style={{ color: "#1f4d3a", fontSize: "13px", margin: 0 }}>{passwordMessage}</p>}
          <button
            onClick={handleChangePassword}
            disabled={passwordSaving}
            style={{ background: "#1f4d3a", color: "white", border: "none", padding: "10px", borderRadius: "6px" }}
          >
            {passwordSaving ? "Updating..." : "Update Password"}
          </button>
        </div>
      </div>

      <div style={{ background: "white", padding: "16px", borderRadius: "10px" }}>
        <h3 style={{ marginTop: 0 }}>Notifications</h3>
        <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={notificationsEnabled}
            onChange={toggleNotifications}
            disabled={notifSaving}
          />
          <span>Show popup alerts for new chat messages</span>
        </label>
      </div>
    </div>
  );
}