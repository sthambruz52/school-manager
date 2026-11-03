import { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { doc, setDoc, collection, query, where, onSnapshot } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { Check, X } from "lucide-react";
import { theme, field } from "../theme";
import Header from "./ui/Header";
import Button from "./ui/Button";
import Avatar from "./ui/Avatar";
import FormSection from "./ui/FormSection";

const PHONE_OK = /^\+?\d{10,15}$/;
const full = { ...field, width: "100%" };

export default function ParentProfile({ onComplete, existingData, targetUid }) {
  const d = existingData || {};
  const isEditMode = !!existingData;

  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [fullName, setFullName] = useState(d.fullName || "");
  const [phone, setPhone] = useState(d.phone || "");
  const [selected, setSelected] = useState(d.children || []);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "users"), where("role", "==", "Student"));
    const unsub = onSnapshot(q, (snap) => setStudents(snap.docs.map((x) => ({ id: x.id, ...x.data() }))));
    return () => unsub();
  }, []);

  const isLinked = (id) => selected.some((c) => c.uid === id);

  const toggle = (s) =>
    setSelected((prev) =>
      isLinked(s.id)
        ? prev.filter((c) => c.uid !== s.id)
        : [...prev, { uid: s.id, name: s.fullName || "", classLevel: s.classLevel || "" }]
    );

  const matches = students
    .filter((s) => !search || (s.fullName || "").toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (a.fullName || "").localeCompare(b.fullName || ""));
  const list = search ? matches : matches.slice(0, 40);

  const submit = async (e) => {
    e.preventDefault();

    if (!fullName.trim() || !phone.trim()) return alert("Please fill in your name and phone number.");
    if (!PHONE_OK.test(phone.replace(/\s/g, ""))) return alert("Please enter a valid phone number (10-15 digits).");

    setSaving(true);
    let ok = false;
    try {
      await setDoc(
        doc(db, "users", targetUid || auth.currentUser.uid),
        { fullName: fullName.trim(), phone: phone.trim(), children: selected, profileComplete: true },
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
          subtitle={isEditMode ? "Update your details and wards" : "Set up your parent account"}
          onBack={isEditMode ? onComplete : undefined}
        />

        <form onSubmit={submit}>
          <FormSection title="About you">
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name *" style={full} />
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Your phone number *" style={full} />
          </FormSection>

          <FormSection title="Link your ward(s)" hint="Find your child and tap to link. You can also do this later from My Profile.">
            {selected.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {selected.map((c) => (
                  <span
                    key={c.uid}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      background: "#eef0ff",
                      color: theme.colors.primary,
                      fontSize: "13px",
                      fontWeight: "600",
                      padding: "5px 10px",
                      borderRadius: "999px"
                    }}
                  >
                    {c.name}
                    <X
                      size={14}
                      style={{ cursor: "pointer" }}
                      onClick={() => setSelected((prev) => prev.filter((x) => x.uid !== c.uid))}
                    />
                  </span>
                ))}
              </div>
            )}

            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search for your child by name..." style={full} />

            <div style={{ maxHeight: "280px", overflowY: "auto" }}>
              {list.length === 0 ? (
                <div style={{ fontSize: "13px", color: theme.colors.textMuted, padding: "10px 4px" }}>
                  No matching students found. Your child may not have registered yet.
                </div>
              ) : (
                list.map((s) => {
                  const on = isLinked(s.id);
                  return (
                    <div
                      key={s.id}
                      onClick={() => toggle(s)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "8px 10px",
                        borderRadius: theme.radius.sm,
                        cursor: "pointer",
                        background: on ? "#eef0ff" : "transparent"
                      }}
                    >
                      <Avatar name={s.fullName} photoURL={s.photoURL} size={44} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: "600", fontSize: "14px", color: theme.colors.text }}>{s.fullName}</div>
                        <div style={{ fontSize: "12px", color: theme.colors.textMuted }}>{s.classLevel || "No class"}</div>
                      </div>
                      {on && <Check size={20} color={theme.colors.primary} />}
                    </div>
                  );
                })
              )}
              {!search && matches.length > 40 && (
                <div style={{ fontSize: "12px", color: theme.colors.textMuted, padding: "8px 4px" }}>
                  Showing the first 40. Type a name to narrow the list.
                </div>
              )}
            </div>
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