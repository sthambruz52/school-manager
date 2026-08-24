import { useState, useEffect } from "react";
import { db } from "../firebase";
import { doc, setDoc, onSnapshot } from "firebase/firestore";

export default function SchoolInfo() {
  const [schoolName, setSchoolName] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "schoolInfo"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSchoolName(data.schoolName || "");
        setTagline(data.tagline || "");
        setDescription(data.description || "");
      }
    });
    return () => unsub();
  }, []);

  const save = async () => {
    setSaving(true);
    await setDoc(doc(db, "settings", "schoolInfo"), { schoolName, tagline, description });
    setSaving(false);
    alert("School info updated.");
  };

  const inputStyle = { padding: "10px", borderRadius: "6px", width: "100%", boxSizing: "border-box" };

  return (
    <div style={{ marginTop: "20px" }}>
      <h2 style={{ textAlign: "center" }}>School Info</h2>
      <p style={{ textAlign: "center", color: "#666", fontSize: "13px" }}>
        This shows on the public welcome page visitors see before logging in.
      </p>

      <div style={{ background: "white", padding: "16px", borderRadius: "10px", display: "flex", flexDirection: "column", gap: "10px" }}>
        <input value={schoolName} onChange={(e) => setSchoolName(e.target.value)} placeholder="School name" style={inputStyle} />
        <input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Short tagline (e.g. Excellence in every child)" style={inputStyle} />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief introduction about the school..."
          rows={5}
          style={{ ...inputStyle, resize: "vertical", fontFamily: "Arial" }}
        />
        <button onClick={save} disabled={saving} style={{ background: "#1f4d3a", color: "white", padding: "10px", borderRadius: "6px", border: "none" }}>
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}