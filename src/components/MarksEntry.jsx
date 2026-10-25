import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, query, where, onSnapshot, doc, writeBatch } from "firebase/firestore";
import { Cloud, CloudOff, UserX, FileX, Check } from "lucide-react";
import { theme } from "../theme";
import Header from "./ui/Header";
import Card from "./ui/Card";
import Avatar from "./ui/Avatar";
import ProgressBar from "./ui/ProgressBar";
import StickyActionBar from "./ui/StickyActionBar";

const DEFAULT_CLASSES = [
  "Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6",
  "JSS1", "JSS2", "JSS3",
  "SS1", "SS2", "SS3"
];
const TERMS = ["First Term", "Second Term", "Third Term"];
const TEST_TYPES = ["Exam", "Test 1", "Test 2", "Test 3"];
const OTHER_VALUE = "__OTHER__";

const fieldStyle = {
  padding: "10px",
  borderRadius: theme.radius.sm,
  border: `1px solid ${theme.colors.border}`,
  background: "white",
  fontSize: "14px",
  flex: "1 1 140px",
  minWidth: 0
};

function SelectWithManual({ value, onChange, options, placeholder, manualPlaceholder }) {
  const [manual, setManual] = useState(false);
  return (
    <>
      <select
        value={manual ? OTHER_VALUE : value}
        onChange={(e) => {
          if (e.target.value === OTHER_VALUE) { setManual(true); onChange(""); }
          else { setManual(false); onChange(e.target.value); }
        }}
        style={fieldStyle}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
        <option value={OTHER_VALUE}>Manual Input</option>
      </select>
      {manual && (
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={manualPlaceholder} style={fieldStyle} />
      )}
    </>
  );
}

export default function MarksEntry() {
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [online, setOnline] = useState(navigator.onLine);
  const [fromCache, setFromCache] = useState(false);

  const [className, setClassName] = useState("");
  const [term, setTerm] = useState("");
  const [subject, setSubject] = useState("");
  const [testType, setTestType] = useState("");
  const [maxScore, setMaxScore] = useState("100");
  const [search, setSearch] = useState("");

  const [drafts, setDrafts] = useState({});
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "users"), where("role", "==", "Student"));
    const unsub = onSnapshot(q, (snap) => setStudents(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "grades"), (snap) => {
      setGrades(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setFromCache(snap.metadata.fromCache);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "gradeStatus"), (snap) => {
      setStatuses(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "subjects"), (snap) => {
      setSubjects(snap.docs.map((d) => d.data().name).filter(Boolean));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  const ready = className && term && subject && testType;
  const selectionKey = `${className}|${term}|${subject}|${testType}`;

  useEffect(() => {
    setDrafts({});
    const existing = grades.find(
      (g) => g.subject === subject && g.classLevel === className && g.term === term &&
             (g.testType || "Exam") === testType && g.maxScore
    );
    if (existing) setMaxScore(String(existing.maxScore));
    // eslint-disable-next-line
  }, [selectionKey]);

  const extraClasses = [...new Set(students.map((s) => s.classLevel).filter(Boolean))]
    .filter((c) => !DEFAULT_CLASSES.includes(c));
  const classOptions = [...DEFAULT_CLASSES, ...extraClasses];

  const matches = (g) => g.subject === subject && g.term === term && (g.testType || "Exam") === testType;
  const gradeFor = (sid) => grades.find((g) => g.studentId === sid && matches(g));
  const statusFor = (sid) => statuses.find((x) => x.studentId === sid && matches(x))?.status || "";

  const roster = students
    .filter((s) => s.classLevel === className)
    .sort((a, b) => (a.fullName || "").localeCompare(b.fullName || ""))
    .map((s, i) => ({ ...s, roll: i + 1 }));

  const rows = roster.filter((s) => !search || (s.fullName || "").toLowerCase().includes(search.toLowerCase()));
  const doneCount = ready ? roster.filter((s) => gradeFor(s.id) || statusFor(s.id)).length : 0;
  const draftCount = Object.keys(drafts).length;

  const editDraft = (sid, patch) => {
    setDrafts((prev) => {
      const base = prev[sid] || { score: gradeFor(sid)?.score ?? "", status: statusFor(sid) };
      return { ...prev, [sid]: { ...base, ...patch } };
    });
  };

  const onScoreChange = (sid, value) => editDraft(sid, { score: value, status: "" });
  const toggleStatus = (sid, status, current) =>
    editDraft(sid, current === status ? { status: "" } : { status, score: "" });

  const saveAll = async () => {
    const entries = Object.entries(drafts);
    if (entries.length === 0) return alert("No changes to save.");
    const max = Number(maxScore);
    if (!(max > 0)) return alert("Enter a valid max score first.");

    for (const [sid, d] of entries) {
      if (!d.status && d.score !== "") {
        const n = Number(d.score);
        const name = students.find((s) => s.id === sid)?.fullName || "A student";
        if (isNaN(n) || n < 0) return alert(`${name}'s score must be a positive number.`);
        if (n > max) return alert(`${name}'s score (${n}) cannot be higher than the max score (${max}).`);
      }
    }

    setSaving(true);
    try {
      const batch = writeBatch(db);
      const slug = [subject, testType, term].join("_").replace(/[^a-zA-Z0-9]+/g, "-");

      for (const [sid, d] of entries) {
        const existing = gradeFor(sid);
        const gradeRef = existing ? doc(db, "grades", existing.id) : doc(db, "grades", `${sid}_${slug}`);
        const statusRef = doc(db, "gradeStatus", `${sid}_${slug}`);
        const base = { studentId: sid, subject, testType, term, classLevel: className };

        if (d.status) {
          batch.set(statusRef, { ...base, status: d.status });
          if (existing) batch.delete(gradeRef);
        } else if (d.score !== "") {
          batch.set(gradeRef, { ...base, score: Number(d.score), maxScore: max }, { merge: true });
          batch.delete(statusRef);
        } else {
          if (existing) batch.delete(gradeRef);
          batch.delete(statusRef);
        }
      }

      await batch.commit();
      setDrafts({});
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    } catch (err) {
      alert("Could not save marks. Check your connection and try again.");
    }
    setSaving(false);
  };

  const live = online && !fromCache;

  return (
    <div style={{ marginTop: "10px" }}>
      <Header title="Marks Entry" subtitle="Enter and track assessment marks" />

      <div style={{
        background: live ? theme.colors.success : theme.colors.warning,
        color: "white",
        borderRadius: theme.radius.md,
        padding: "12px 14px",
        margin: "14px 0",
        display: "flex",
        alignItems: "center",
        gap: "12px"
      }}>
        {live ? <Cloud size={22} /> : <CloudOff size={22} />}
        <div>
          <div style={{ fontWeight: "700", fontSize: "14px" }}>{live ? "Live Sync Active" : "Offline Mode"}</div>
          <div style={{ fontSize: "12px", opacity: 0.9 }}>
            {live ? "Connected • Everything is up to date" : "Showing saved data • Changes sync when you're back online"}
          </div>
        </div>
      </div>

      <Card>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
          <SelectWithManual value={className} onChange={setClassName} options={classOptions} placeholder="Select class" manualPlaceholder="Type class name" />
          <select value={term} onChange={(e) => setTerm(e.target.value)} style={fieldStyle}>
            <option value="">Select term</option>
            {TERMS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <SelectWithManual value={subject} onChange={setSubject} options={subjects} placeholder="Select subject" manualPlaceholder="Type subject name" />
          <SelectWithManual value={testType} onChange={setTestType} options={TEST_TYPES} placeholder="Select assessment" manualPlaceholder="Type assessment name" />
          <input
            type="number"
            value={maxScore}
            onChange={(e) => setMaxScore(e.target.value)}
            placeholder="Max score"
            style={fieldStyle}
          />
        </div>
      </Card>

      {!ready ? (
        <p style={{ textAlign: "center", color: theme.colors.textMuted, margin: "30px 0" }}>
          Choose a class, term, subject and assessment to start entering marks.
        </p>
      ) : roster.length === 0 ? (
        <p style={{ textAlign: "center", color: theme.colors.textMuted, margin: "30px 0" }}>
          No students in this class yet.
        </p>
      ) : (
        <>
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "8px" }}>
              <strong>{subject} • {testType}</strong>
              <span style={{ color: theme.colors.textMuted }}>{doneCount} / {roster.length} students</span>
            </div>
            <ProgressBar value={doneCount} max={roster.length} />
          </Card>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student..."
            style={{ ...fieldStyle, width: "100%", boxSizing: "border-box", margin: "6px 0 4px" }}
          />

          {rows.map((s) => {
            const draft = drafts[s.id];
            const saved = gradeFor(s.id);
            const shownScore = draft ? draft.score : (saved?.score ?? "");
            const shownStatus = draft ? draft.status : statusFor(s.id);
            const isSaved = !draft && (saved || shownStatus);

            return (
              <Card key={s.id}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <Avatar name={s.fullName} photoURL={s.photoURL} size={42} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: "700", color: theme.colors.text }}>{s.fullName}</div>
                    <div style={{ fontSize: "12px", color: theme.colors.textMuted }}>#{s.roll}</div>
                  </div>
                  {isSaved && (
                    <span style={{ width: "26px", height: "26px", borderRadius: "50%", background: theme.colors.success, color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Check size={16} />
                    </span>
                  )}
                  {draft && (
                    <span style={{ fontSize: "11px", fontWeight: "700", color: theme.colors.warning, background: theme.colors.warningBg, padding: "3px 8px", borderRadius: "999px" }}>
                      Unsaved
                    </span>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "12px", border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.sm, padding: "0 12px", background: shownStatus ? "#f9fafb" : "white" }}>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    value={shownScore}
                    disabled={!!shownStatus}
                    onChange={(e) => onScoreChange(s.id, e.target.value)}
                    placeholder={shownStatus ? (shownStatus === "absent" ? "Absent" : "Missing") : "Score"}
                    style={{ flex: 1, border: "none", outline: "none", fontSize: "20px", padding: "12px 0", background: "transparent", minWidth: 0 }}
                  />
                  <span style={{ color: theme.colors.textMuted, fontSize: "15px" }}>/ {maxScore || "-"}</span>
                </div>

                <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                  <button
                    onClick={() => toggleStatus(s.id, "absent", shownStatus)}
                    style={{
                      flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                      padding: "10px", borderRadius: theme.radius.sm, fontWeight: "600", fontSize: "13px",
                      border: `1.5px solid ${theme.colors.warning}`,
                      background: shownStatus === "absent" ? theme.colors.warning : "white",
                      color: shownStatus === "absent" ? "white" : theme.colors.warning
                    }}
                  >
                    <UserX size={16} /> Absent
                  </button>
                  <button
                    onClick={() => toggleStatus(s.id, "missing", shownStatus)}
                    style={{
                      flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                      padding: "10px", borderRadius: theme.radius.sm, fontWeight: "600", fontSize: "13px",
                      border: `1.5px solid ${theme.colors.danger}`,
                      background: shownStatus === "missing" ? theme.colors.danger : "white",
                      color: shownStatus === "missing" ? "white" : theme.colors.danger
                    }}
                  >
                    <FileX size={16} /> Missing
                  </button>
                </div>
              </Card>
            );
          })}

          <StickyActionBar>
            <button
              onClick={saveAll}
              disabled={saving || draftCount === 0}
              style={{
                width: "100%", background: theme.colors.primary, color: "white", border: "none",
                padding: "14px", borderRadius: theme.radius.md, fontWeight: "700", fontSize: "15px"
              }}
            >
              {saving ? "Saving..." : justSaved ? "✓ Saved!" : draftCount > 0 ? `Save All Marks (${draftCount})` : "Save All Marks"}
            </button>
          </StickyActionBar>
        </>
      )}
    </div>
  );
}