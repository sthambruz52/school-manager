import { useState, useEffect } from "react";
import { db } from "../../firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { X } from "lucide-react";
import { theme, field } from "../../theme";
import Button from "./Button";

export default function SubjectPicker({ selected, onChange }) {
  const [subjects, setSubjects] = useState([]);
  const [custom, setCustom] = useState("");

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "subjects"), (snap) => {
      setSubjects(
        snap.docs
          .map((d) => d.data())
          .filter((s) => s.name)
          .sort((a, b) => a.name.localeCompare(b.name))
      );
    });
    return () => unsub();
  }, []);

  const toggle = (name) =>
    onChange(selected.includes(name) ? selected.filter((s) => s !== name) : [...selected, name]);

  const addCustom = () => {
    const t = custom.trim();
    if (!t) return;
    if (!selected.some((s) => s.toLowerCase() === t.toLowerCase())) onChange([...selected, t]);
    setCustom("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <div
        style={{
          maxHeight: "220px",
          overflowY: "auto",
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.radius.sm,
          padding: "6px 10px"
        }}
      >
        {subjects.length === 0 ? (
          <div style={{ fontSize: "13px", color: theme.colors.textMuted, padding: "8px 0" }}>
            No subjects have been added yet. Type one below.
          </div>
        ) : (
          subjects.map((s) => (
            <label
              key={s.name}
              style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 0", fontSize: "14px", color: theme.colors.text }}
            >
              <input type="checkbox" checked={selected.includes(s.name)} onChange={() => toggle(s.name)} />
              {s.name}
              {s.code ? <span style={{ color: theme.colors.textMuted }}>({s.code})</span> : null}
            </label>
          ))
        )}
      </div>

      <div style={{ display: "flex", gap: "8px" }}>
        <input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCustom();
            }
          }}
          placeholder="Subject not listed? Type it here"
          style={{ ...field, flex: 1 }}
        />
        <Button size="sm" onClick={addCustom}>Add</Button>
      </div>

      {selected.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {selected.map((s) => (
            <span
              key={s}
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
              {s}
              <X size={14} style={{ cursor: "pointer" }} onClick={() => toggle(s)} />
            </span>
          ))}
        </div>
      )}
    </div>
  );
}