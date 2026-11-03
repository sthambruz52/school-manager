import { useState, useEffect } from "react";
import { db } from "../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { theme, field } from "../theme";
import Header from "./ui/Header";
import Card from "./ui/Card";
import Button from "./ui/Button";

const DEFAULT_ACCENT = "#1f4d3a";

export default function SchoolInfo() {
  const [status, setStatus] = useState("loading");
  const [schoolName, setSchoolName] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [accent, setAccent] = useState(DEFAULT_ACCENT);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getDoc(doc(db, "settings", "schoolInfo"))
      .then((snap) => {
        if (snap.exists()) {
          const d = snap.data();
          setSchoolName(d.schoolName || "");
          setTagline(d.tagline || "");
          setDescription(d.description || "");
          setAccent(/^#[0-9a-fA-F]{6}$/.test(d.accentColor || "") ? d.accentColor : DEFAULT_ACCENT);
        }
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, []);

  const save = async () => {
    if (!schoolName.trim()) return alert("Enter the school name.");
    setSaving(true);
    try {
      await setDoc(
        doc(db, "settings", "schoolInfo"),
        {
          schoolName: schoolName.trim(),
          tagline: tagline.trim(),
          description: description.trim(),
          accentColor: accent
        },
        { merge: true }
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      alert("Could not save. Please try again.");
    }
    setSaving(false);
  };

  return (
    <div style={{ marginTop: "10px" }}>
      <Header title="School Info" subtitle="Your school's name, tagline and introduction" />

      {status === "error" && (
        <div style={{ background: theme.colors.dangerBg, color: theme.colors.danger, padding: "12px 14px", borderRadius: theme.radius.sm, margin: "14px 0 0", fontSize: "14px", fontWeight: "600" }}>
          Could not load the current details. Check your connection and reload this page before editing.
        </div>
      )}

      <div
        style={{
          margin: "14px 0",
          borderRadius: theme.radius.md,
          background: accent,
          color: "white",
          padding: "20px 16px",
          textAlign: "center",
          boxShadow: theme.shadow
        }}
      >
        <div style={{ fontSize: "11px", opacity: 0.8, letterSpacing: "1px", marginBottom: "6px" }}>PREVIEW</div>
        <div style={{ fontWeight: "800", fontSize: "19px", textTransform: "uppercase" }}>{schoolName || "Your School Name"}</div>
        {(tagline || status !== "ready") && <div style={{ fontSize: "13px", marginTop: "4px", fontStyle: "italic", opacity: 0.9 }}>{tagline}</div>}
      </div>

      <Card>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <input value={schoolName} onChange={(e) => setSchoolName(e.target.value)} placeholder="School name" style={field} />
          <input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Short tagline (e.g. Excellence in every child)" style={field} />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A short introduction about the school..."
            rows={5}
            style={{ ...field, resize: "vertical", fontFamily: "Arial" }}
          />

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              style={{ width: "52px", height: "40px", padding: 0, border: "none", background: "none", cursor: "pointer" }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: "700", fontSize: "14px", color: theme.colors.text }}>School accent colour</div>
              <div style={{ fontSize: "12px", color: theme.colors.textMuted }}>Used on printed report cards</div>
            </div>
            {accent !== DEFAULT_ACCENT && (
              <Button size="sm" variant="ghost" onClick={() => setAccent(DEFAULT_ACCENT)}>Reset</Button>
            )}
          </div>

          <Button full onClick={save} disabled={saving || status !== "ready"}>
            {saving ? "Saving..." : saved ? "Saved ✓" : "Save School Info"}
          </Button>
        </div>
      </Card>
    </div>
  );
}