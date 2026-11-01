import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, addDoc, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { BookOpen, Plus, X, Trash2 } from "lucide-react";
import { theme, field } from "../theme";
import Header from "./ui/Header";
import HeaderAction from "./ui/HeaderAction";
import Card from "./ui/Card";
import Button from "./ui/Button";
import EmptyState from "./ui/EmptyState";

const PRESET_SUBJECTS = [
  { name: "English", code: "ENG" },
  { name: "Mathematics", code: "MTH" },
  { name: "Agric Science", code: "AGR" },
  { name: "Basic Science", code: "BSC" },
  { name: "Basic Technology", code: "BTC" },
  { name: "Business Studies", code: "BUS" },
  { name: "Civic Education", code: "CIV" },
  { name: "Computer Studies", code: "CMP" },
  { name: "Creative Arts", code: "CRA" },
  { name: "French", code: "FRE" },
  { name: "PHE", code: "PHE" },
  { name: "Social Studies", code: "SOS" }
];
const OTHER_VALUE = "__OTHER__";
const TILES = [
  { bg: "#eef0ff", fg: "#4f46e5" },
  { bg: "#e0f2fe", fg: "#0284c7" },
  { bg: "#f3e8ff", fg: "#9333ea" },
  { bg: "#dcfce7", fg: "#16a34a" },
  { bg: "#fef3c7", fg: "#d97706" },
  { bg: "#fee2e2", fg: "#dc2626" }
];

export default function Subjects() {
  const [subjects, setSubjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState("");
  const [manualName, setManualName] = useState("");
  const [manualCode, setManualCode] = useState("");
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const isManual = selected === OTHER_VALUE;

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "subjects"), (snap) => {
      setSubjects(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const taken = subjects.map((s) => (s.name || "").toLowerCase());
  const availablePresets = PRESET_SUBJECTS.filter((p) => !taken.includes(p.name.toLowerCase()));

  const addSubject = async () => {
    let name;
    let code;
    if (isManual) {
      if (!manualName.trim()) return alert("Enter the subject name.");
      name = manualName.trim();
      code = manualCode.trim().toUpperCase();
    } else {
      if (!selected) return alert("Select a subject.");
      const preset = PRESET_SUBJECTS.find((p) => p.name === selected);
      name = preset.name;
      code = preset.code;
    }
    if (taken.includes(name.toLowerCase())) return alert(`${name} is already in your subjects list.`);

    setSaving(true);
    try {
      await addDoc(collection(db, "subjects"), { name, code, createdAt: new Date() });
      setSelected("");
      setManualName("");
      setManualCode("");
      setShowForm(false);
    } catch (err) {
      alert("Could not add the subject. Please try again.");
    }
    setSaving(false);
  };

  const removeSubject = async (id) => {
    if (confirm("Delete this subject? Marks already recorded for it are not affected.")) {
      await deleteDoc(doc(db, "subjects", id));
    }
  };

  const visible = subjects
    .filter((s) => !search || (s.name || "").toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (a.name || "").localeCompare(b.name || ""));

  return (
    <div style={{ marginTop: "10px" }}>
      <Header
        title="Subjects"
        subtitle={`${subjects.length} subject${subjects.length !== 1 ? "s" : ""} offered`}
        rightSlot={
          <HeaderAction
            icon={showForm ? <X size={16} /> : <Plus size={16} />}
            label={showForm ? "Close" : "Add Subject"}
            onClick={() => setShowForm(!showForm)}
          />
        }
      />

      {showForm && (
        <Card style={{ marginTop: "14px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <select value={selected} onChange={(e) => setSelected(e.target.value)} style={field}>
              <option value="">Select subject</option>
              {availablePresets.map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}
              <option value={OTHER_VALUE}>Manual Input</option>
            </select>

            {isManual && (
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <input value={manualName} onChange={(e) => setManualName(e.target.value)} placeholder="Subject name" style={{ ...field, flex: "2 1 160px" }} />
                <input value={manualCode} onChange={(e) => setManualCode(e.target.value.toUpperCase())} placeholder="Code (e.g. MTH)" maxLength={5} style={{ ...field, flex: "1 1 100px" }} />
              </div>
            )}

            <Button full onClick={addSubject} disabled={saving}>
              {saving ? "Adding..." : "Add Subject"}
            </Button>
          </div>
        </Card>
      )}

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search subjects..."
        style={{ ...field, width: "100%", margin: "14px 0 4px" }}
      />

      {visible.length === 0 ? (
        <EmptyState icon={BookOpen} text={search ? "No subject matches that search." : "No subjects added yet."} />
      ) : (
        visible.map((s, i) => {
          const tone = TILES[i % TILES.length];
          return (
            <Card key={s.id}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    background: tone.bg,
                    color: tone.fg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "800",
                    fontSize: "13px",
                    flexShrink: 0
                  }}
                >
                  {(s.code || (s.name || "?").slice(0, 3)).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: "700", color: theme.colors.text }}>{s.name}</div>
                  <div style={{ fontSize: "12px", color: theme.colors.textMuted }}>{s.code ? `Code: ${s.code}` : "No code set"}</div>
                </div>
                <Button size="sm" variant="danger" icon={<Trash2 size={14} />} onClick={() => removeSubject(s.id)} />
              </div>
            </Card>
          );
        })
      )}
    </div>
  );
}