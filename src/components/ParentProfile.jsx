import { useState } from "react";
import { db, auth } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { theme, field } from "../theme";
import Header from "./ui/Header";
import Button from "./ui/Button";
import Avatar from "./ui/Avatar";
import StatusPill from "./ui/StatusPill";
import FormSection from "./ui/FormSection";
import { useMyChildren } from "../hooks/useAccessScope";

const PHONE_OK = /^\+?\d{10,15}$/;
const full = { ...field, width: "100%" };

export default function ParentProfile({ onComplete, existingData, targetUid }) {
  const d = existingData || {};
  const isEditMode = !!existingData;
  const own = !targetUid || targetUid === auth.currentUser?.uid;

  const { children: found } = useMyChildren(own);
  const kids = own ? found : d.children || [];

  const [fullName, setFullName] = useState(d.fullName || "");
  const [phone, setPhone] = useState(d.phone || "");
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();

    if (!fullName.trim() || !phone.trim()) return alert("Please fill in your name and phone number.");
    if (!PHONE_OK.test(phone.replace(/\s/g, ""))) return alert("Please enter a valid phone number (10-15 digits).");

    setSaving(true);
    let ok = false;
    try {
      await setDoc(
        doc(db, "users", targetUid || auth.currentUser.uid),
        { fullName: fullName.trim(), phone: phone.trim(), profileComplete: true },
        { merge: true }
      );
      ok = true;
    } catch (err) {
      alert("Could not save the profile. Check your connection and try again.");
    }
    setSaving(false);
    if (ok && onComplete) onComplete();
  };

  return (
    <div style={{ background: theme.colors.bg, minHeight: "100vh" }}>
      <div style={{ maxWidth: "700px", margin: "0 auto", padding: "0 16px 40px" }}>
        <Header
          title={isEditMode ? "Edit Profile" : "Complete Your Profile"}
          subtitle={isEditMode ? "Update your details" : "Set up your parent account"}
          onBack={isEditMode ? onComplete : undefined}
        />

        <form onSubmit={submit}>
          <FormSection title="About you">
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name *" style={full} />
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Your phone number *" style={full} />
          </FormSection>

          <FormSection
            title="Your children"
            hint="Children are linked automatically when they are registered with your email as the parent email."
          >
            {kids.length === 0 ? (
              <div style={{ fontSize: "13px", color: theme.colors.textMuted }}>
                No child is linked yet. This also needs your email to be verified.
              </div>
            ) : (
              kids.map((c) => (
                <div key={c.uid} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <Avatar name={c.name} size={44} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: "600", fontSize: "14px", color: theme.colors.text }}>{c.name}</div>
                    <div style={{ fontSize: "12px", color: theme.colors.textMuted }}>{c.classLevel || "No class"}</div>
                  </div>
                  <StatusPill label="Linked" variant="success" />
                </div>
              ))
            )}
          </FormSection>

          <div style={{ marginTop: "16px" }}>
            <Button type="submit" full disabled={saving}>
              {saving ? "Saving..." : isEditMode ? "Update Profile" : "Save Profile"}
            </Button>
          </div>

          {!isEditMode && !targetUid && (
            <div style={{ textAlign: "center", marginTop: "14px" }}>
              <Button variant="ghost" size="sm" onClick={() => signOut(auth)}>Log out</Button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}