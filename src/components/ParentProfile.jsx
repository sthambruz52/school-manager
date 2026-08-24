import { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { doc, setDoc, collection, query, where, onSnapshot } from "firebase/firestore";

export default function ParentProfile({ onComplete, existingData, targetUid }) {
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [fullName, setFullName] = useState(existingData?.fullName || "");
  const [phone, setPhone] = useState(existingData?.phone || "");
  const [selectedChildren, setSelectedChildren] = useState(existingData?.children || []);

  const [saving, setSaving] = useState(false);
  const isEditMode = !!existingData;

  useEffect(() => {
    const q = query(collection(db, "users"), where("role", "==", "Student"));
    const unsub = onSnapshot(q, (snap) => {
      setStudents(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const isSelected = (studentId) => selectedChildren.some((c) => c.uid === studentId);

  const toggleChild = (student) => {
    setSelectedChildren((prev) =>
      isSelected(student.id)
        ? prev.filter((c) => c.uid !== student.id)
        : [...prev, { uid: student.id, name: student.fullName, classLevel: student.classLevel || "" }]
    );
  };

  const filteredStudents = students.filter((s) =>
    (s.fullName || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName || !phone) {
      alert("Please fill in your name and phone number.");
      return;
    }

    if (!/^\d{10,15}$/.test(phone.replace(/\s/g, ""))) {
      alert("Please enter a valid phone number (10-15 digits, no letters or symbols).");
      return;
    }

       setSaving(true);
    await setDoc(doc(db, "users", targetUid || auth.currentUser.uid), { 
      fullName,
      phone,
      children: selectedChildren,
      profileComplete: true
    }, { merge: true });

    setSaving(false);
    if (onComplete) onComplete();
  };

  const inputStyle = { padding: "10px", borderRadius: "6px" };
  const sectionLabel = { margin: "8px 0 0", fontWeight: "bold", color: "#1f4d3a" };

  return (
    <div style={{ maxWidth: "480px", margin: "40px auto", padding: "24px", background: "white", borderRadius: "10px" }}>
      <h2 style={{ textAlign: "center" }}>{isEditMode ? "Edit Your Profile" : "Complete Your Profile"}</h2>

      {isEditMode && (
        <p onClick={onComplete} style={{ textAlign: "center", color: "#1f4d3a", cursor: "pointer", marginTop: "-8px" }}>
          ← Back to Dashboard
        </p>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" required style={inputStyle} />
        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Your phone number" required style={inputStyle} />

        <p style={sectionLabel}>Link Your Ward(s)</p>
        <p style={{ fontSize: "13px", color: "#666", margin: 0 }}>
          Select your child if they're already registered. Don't see them yet? Skip this and link them later from "My Profile" once they've signed up.
        </p>

        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search student by name..."
          style={inputStyle}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: "4px", maxHeight: "180px", overflowY: "auto", border: "1px solid #eee", borderRadius: "6px", padding: "8px" }}>
          {filteredStudents.length === 0 && (
            <p style={{ fontSize: "13px", color: "#999", margin: 0 }}>No matching students found.</p>
          )}
          {filteredStudents.map((s) => (
            <label key={s.id} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input type="checkbox" checked={isSelected(s.id)} onChange={() => toggleChild(s)} />
              {s.fullName} {s.classLevel && `— ${s.classLevel}`}
            </label>
          ))}
        </div>

        {selectedChildren.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {selectedChildren.map((c) => (
              <span key={c.uid} style={{ background: "#fdf6e9", padding: "4px 8px", borderRadius: "12px", fontSize: "13px" }}>
                {c.name}
              </span>
            ))}
          </div>
        )}

        <button type="submit" disabled={saving} style={{ background: "#1f4d3a", color: "white", padding: "10px", borderRadius: "6px", marginTop: "8px" }}>
          {saving ? "Saving..." : isEditMode ? "Update Profile" : selectedChildren.length > 0 ? "Save Profile" : "Skip & Continue"}
        </button>
      </form>
    </div>
  );
}