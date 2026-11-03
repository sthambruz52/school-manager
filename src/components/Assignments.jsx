import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, setDoc } from "firebase/firestore";
import { Plus, X, Trash2, ChevronDown, ChevronUp, ClipboardCheck, Check } from "lucide-react";
import { theme, field } from "../theme";
import Header from "./ui/Header";
import HeaderAction from "./ui/HeaderAction";
import Card from "./ui/Card";
import Button from "./ui/Button";
import Avatar from "./ui/Avatar";
import StatusPill from "./ui/StatusPill";
import ProgressBar from "./ui/ProgressBar";
import EmptyState from "./ui/EmptyState";
import SelectWithManual from "./ui/SelectWithManual";

const DEFAULT_CLASSES = [
  "Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6",
  "JSS1", "JSS2", "JSS3",
  "SS1", "SS2", "SS3"
];

const ms = (a) => (a.createdAt?.toMillis ? a.createdAt.toMillis() : 0);

const prettyDay = (str) => {
  const d = new Date(str + "T00:00:00");
  return isNaN(d.getTime()) ? str : d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};

const dueInfo = (dueDate) => {
  if (!dueDate) return null;
  const d = new Date(dueDate + "T00:00:00");
  if (isNaN(d.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((d - today) / 86400000);
  if (diff < 0) return { label: `Overdue by ${-diff}d`, variant: "danger" };
  if (diff === 0) return { label: "Due today", variant: "warning" };
  if (diff <= 2) return { label: `Due in ${diff}d`, variant: "warning" };
  return { label: `Due ${prettyDay(dueDate)}`, variant: "info" };
};

const pctColor = (pct) => (pct >= 60 ? theme.colors.success : pct >= 40 ? theme.colors.warning : theme.colors.danger);

export default function Assignments({ canManage, studentView }) {
  const [assignments, setAssignments] = useState([]);
  const [subjectNames, setSubjectNames] = useState([]);
  const [students, setStudents] = useState([]);
  const [scores, setScores] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");
  const [className, setClassName] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);

  const [classFilter, setClassFilter] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [drafts, setDrafts] = useState({});
  const [flash, setFlash] = useState(null);

  const studentUid = studentView?.studentId;

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "assignments"), (snap) => {
      setAssignments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "subjects"), (snap) => {
      setSubjectNames(snap.docs.map((d) => d.data().name).filter(Boolean).sort());
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!canManage) return;
    const q = query(collection(db, "users"), where("role", "==", "Student"));
    const unsub = onSnapshot(q, (snap) => setStudents(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, [canManage]);

  useEffect(() => {
    const ref = collection(db, "assignmentScores");
    const q = studentUid ? query(ref, where("studentId", "==", studentUid)) : ref;
    const unsub = onSnapshot(q, (snap) => setScores(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, [studentUid]);

  const scoreFor = (aid, sid) => scores.find((s) => s.assignmentId === aid && s.studentId === sid);
  const setDraft = (key, patch) => setDrafts((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));

  const addAssignment = async () => {
    if (!title.trim() || !subject.trim() || !className.trim()) return alert("Enter a title, subject and class.");
    setSaving(true);
    try {
      await addDoc(collection(db, "assignments"), {
        title: title.trim(),
        description: description.trim(),
        subject: subject.trim(),
        classLevel: className.trim(),
        dueDate,
        createdAt: new Date()
      });
      setTitle("");
      setDescription("");
      setSubject("");
      setClassName("");
      setDueDate("");
      setFormKey((k) => k + 1);
      setShowForm(false);
    } catch (err) {
      alert("Could not post the assignment. Please try again.");
    }
    setSaving(false);
  };

  const removeAssignment = async (id) => {
    if (confirm("Delete this assignment? Scores already entered for it will no longer be shown.")) {
      await deleteDoc(doc(db, "assignments", id));
    }
  };

  const toggleSubmitted = async (aid, sid) => {
    const existing = scoreFor(aid, sid);
    try {
      await setDoc(
        doc(db, "assignmentScores", `${aid}_${sid}`),
        { assignmentId: aid, studentId: sid, submitted: !existing?.submitted, updatedAt: new Date() },
        { merge: true }
      );
    } catch (err) {
      alert("Could not update. Please try again.");
    }
  };

  const saveScore = async (aid, sid) => {
    const key = `${aid}_${sid}`;
    const draft = drafts[key] || {};
    const existing = scoreFor(aid, sid);
    const score = draft.score !== undefined ? draft.score : existing?.score ?? "";
    const max = draft.max !== undefined ? draft.max : existing?.maxScore ?? 100;
    if (score === "" || max === "") return alert("Enter the score and the max score.");
    if (Number(score) < 0 || Number(max) <= 0) return alert("Scores must be positive numbers.");
    if (Number(score) > Number(max)) return alert("The score cannot be higher than the max score.");
    try {
      await setDoc(
        doc(db, "assignmentScores", key),
        { assignmentId: aid, studentId: sid, score: Number(score), maxScore: Number(max), gradedAt: new Date() },
        { merge: true }
      );
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      setFlash(key);
      setTimeout(() => setFlash(null), 1500);
    } catch (err) {
      alert("Could not save the score. Please try again.");
    }
  };

  if (studentView) {
    const mine = assignments
      .filter((a) => a.classLevel === studentView.classLevel)
      .sort((a, b) => ms(b) - ms(a));

    return (
      <div style={{ marginTop: "10px" }}>
        <Header title="Assignments" subtitle={`${mine.length} for ${studentView.classLevel || "your class"}`} />
        {mine.length === 0 ? (
          <EmptyState icon={ClipboardCheck} text="No assignments posted yet." />
        ) : (
          <div style={{ marginTop: "14px" }}>
            {mine.map((a) => {
              const rec = scoreFor(a.id, studentUid);
              const due = dueInfo(a.dueDate);
              const graded = rec?.score !== undefined;
              const pct = graded && rec.maxScore ? Math.round((rec.score / rec.maxScore) * 100) : null;
              return (
                <Card key={a.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: "800", color: theme.colors.text }}>{a.title}</div>
                      <div style={{ fontSize: "12px", color: theme.colors.textMuted }}>{a.subject}</div>
                    </div>
                    {due && !rec?.submitted && <StatusPill label={due.label} variant={due.variant} />}
                  </div>
                  {a.description && (
                    <p style={{ fontSize: "13px", color: "#374151", margin: "8px 0 0", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{a.description}</p>
                  )}
                  <div style={{ display: "flex", gap: "10px", alignItems: "center", marginTop: "12px", flexWrap: "wrap" }}>
                    <StatusPill
                      label={rec?.submitted ? "Submitted" : "Not submitted"}
                      variant={rec?.submitted ? "success" : "danger"}
                      icon={rec?.submitted ? <Check size={12} /> : null}
                    />
                    {graded ? (
                      <span style={{ fontWeight: "800", color: pctColor(pct ?? 0) }}>
                        {rec.score}/{rec.maxScore}{pct !== null ? ` (${pct}%)` : ""}
                      </span>
                    ) : (
                      <span style={{ fontSize: "13px", color: theme.colors.textMuted }}>Not graded yet</span>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  const extraClasses = [...new Set(students.map((s) => s.classLevel).filter(Boolean))].filter((c) => !DEFAULT_CLASSES.includes(c));
  const classOptions = [...DEFAULT_CLASSES, ...extraClasses];
  const filterOptions = [...new Set(assignments.map((a) => a.classLevel).filter(Boolean))].sort();

  const shown = assignments
    .filter((a) => !classFilter || a.classLevel === classFilter)
    .sort((a, b) => ms(b) - ms(a));

  return (
    <div style={{ marginTop: "10px" }}>
      <Header
        title="Assignments"
        subtitle={`${assignments.length} posted`}
        rightSlot={
          canManage ? (
            <HeaderAction
              icon={showForm ? <X size={16} /> : <Plus size={16} />}
              label={showForm ? "Close" : "New"}
              onClick={() => setShowForm(!showForm)}
            />
          ) : null
        }
      />

      {canManage && showForm && (
        <Card style={{ marginTop: "14px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Assignment title" style={field} />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Instructions (optional)"
              rows={3}
              style={{ ...field, resize: "vertical", fontFamily: "Arial" }}
            />
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              <SelectWithManual key={`s${formKey}`} value={subject} onChange={setSubject} options={subjectNames} placeholder="Select subject" manualPlaceholder="Type subject name" />
              <SelectWithManual key={`c${formKey}`} value={className} onChange={setClassName} options={classOptions} placeholder="Select class" manualPlaceholder="Type class name" />
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={{ ...field, flex: "1 1 150px" }} />
            </div>
            <Button full onClick={addAssignment} disabled={saving}>{saving ? "Posting..." : "Post Assignment"}</Button>
          </div>
        </Card>
      )}

      {filterOptions.length > 1 && (
        <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} style={{ ...field, width: "100%", margin: "14px 0 4px" }}>
          <option value="">All classes</option>
          {filterOptions.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      )}

      {shown.length === 0 ? (
        <EmptyState icon={ClipboardCheck} text="No assignments posted yet." />
      ) : (
        <div style={{ marginTop: "10px" }}>
          {shown.map((a) => {
            const roster = students
              .filter((s) => s.classLevel === a.classLevel)
              .sort((x, y) => (x.fullName || "").localeCompare(y.fullName || ""));
            const submittedCount = roster.filter((s) => scoreFor(a.id, s.id)?.submitted).length;
            const gradedCount = roster.filter((s) => scoreFor(a.id, s.id)?.score !== undefined).length;
            const due = dueInfo(a.dueDate);
            const open = expandedId === a.id;

            return (
              <Card key={a.id} style={{ padding: 0, overflow: "hidden" }}>
                <div onClick={() => setExpandedId(open ? null : a.id)} style={{ padding: "14px 16px", cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: "800", color: theme.colors.text }}>{a.title}</div>
                      <div style={{ fontSize: "12px", color: theme.colors.textMuted }}>{a.subject} • {a.classLevel}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                      {due && <StatusPill label={due.label} variant={due.variant} />}
                      {open ? <ChevronUp size={20} color={theme.colors.textMuted} /> : <ChevronDown size={20} color={theme.colors.textMuted} />}
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: theme.colors.textMuted, margin: "12px 0 6px" }}>
                    <span>{submittedCount} of {roster.length} submitted</span>
                    <span>{gradedCount} graded</span>
                  </div>
                  <ProgressBar value={submittedCount} max={roster.length || 1} height={6} />
                </div>

                {open && (
                  <div style={{ borderTop: `1px solid ${theme.colors.border}`, padding: "6px 16px 14px" }}>
                    {a.description && (
                      <p style={{ fontSize: "13px", color: "#374151", lineHeight: 1.5, whiteSpace: "pre-wrap", margin: "10px 0" }}>{a.description}</p>
                    )}

                    {roster.length === 0 ? (
                      <p style={{ color: theme.colors.textMuted, fontSize: "13px" }}>No students in this class yet.</p>
                    ) : (
                      roster.map((s) => {
                        const rec = scoreFor(a.id, s.id);
                        const key = `${a.id}_${s.id}`;
                        const draft = drafts[key] || {};
                        const shownScore = draft.score !== undefined ? draft.score : rec?.score ?? "";
                        const shownMax = draft.max !== undefined ? draft.max : rec?.maxScore ?? 100;
                        return (
                          <div
                            key={s.id}
                            style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px", padding: "10px 0", borderTop: `1px solid ${theme.colors.border}` }}
                          >
                            <Avatar name={s.fullName} photoURL={s.photoURL} size={40} />
                            <div style={{ flex: "1 1 110px", minWidth: 0, fontWeight: "600", fontSize: "14px", color: theme.colors.text }}>{s.fullName}</div>
                            <button
                              onClick={() => toggleSubmitted(a.id, s.id)}
                              style={{
                                border: "none",
                                borderRadius: "999px",
                                padding: "6px 12px",
                                fontSize: "12px",
                                fontWeight: "700",
                                background: rec?.submitted ? theme.colors.successBg : theme.colors.dangerBg,
                                color: rec?.submitted ? theme.colors.success : theme.colors.danger
                              }}
                            >
                              {rec?.submitted ? "Submitted" : "Not submitted"}
                            </button>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <input
                                type="number"
                                inputMode="decimal"
                                min="0"
                                value={shownScore}
                                onChange={(e) => setDraft(key, { score: e.target.value })}
                                placeholder="Score"
                                style={{ ...field, width: "66px", padding: "8px" }}
                              />
                              <span style={{ color: theme.colors.textMuted }}>/</span>
                              <input
                                type="number"
                                inputMode="decimal"
                                min="1"
                                value={shownMax}
                                onChange={(e) => setDraft(key, { max: e.target.value })}
                                style={{ ...field, width: "66px", padding: "8px" }}
                              />
                              <Button size="sm" onClick={() => saveScore(a.id, s.id)}>{flash === key ? "Saved ✓" : "Save"}</Button>
                            </div>
                          </div>
                        );
                      })
                    )}

                    {canManage && (
                      <div style={{ marginTop: "12px" }}>
                        <Button size="sm" variant="danger" icon={<Trash2 size={14} />} onClick={() => removeAssignment(a.id)}>
                          Delete assignment
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}