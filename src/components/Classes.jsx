import { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc, deleteDoc } from "firebase/firestore";
import { ChevronDown, ChevronUp, LayoutGrid, Plus, X, Trash2 } from "lucide-react";
import { theme, field } from "../theme";
import Header from "./ui/Header";
import HeaderAction from "./ui/HeaderAction";
import Card from "./ui/Card";
import Button from "./ui/Button";
import Avatar from "./ui/Avatar";
import StatusPill from "./ui/StatusPill";
import EmptyState from "./ui/EmptyState";
import SelectWithManual from "./ui/SelectWithManual";
import { useAccessScope } from "../hooks/useAccessScope";

const DEFAULT_CLASS_LEVELS = [
  "Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6",
  "JSS1", "JSS2", "JSS3",
  "SS1", "SS2", "SS3"
];
const PRESET_NEW = ["Creche", "Nursery 1", "Nursery 2", "Nursery 3", "KG 1", "KG 2"];

export default function Classes({ isAdmin }) {
  const [students, setStudents] = useState([]);
  const [classTeachers, setClassTeachers] = useState({});
  const [customDocs, setCustomDocs] = useState([]);
  const [myRole, setMyRole] = useState("");
  const [openClass, setOpenClass] = useState(null);
  const [expandedStudent, setExpandedStudent] = useState(null);
  const [search, setSearch] = useState("");

  const [showAdd, setShowAdd] = useState(false);
  const [newClass, setNewClass] = useState("");
  const [formKey, setFormKey] = useState(0);
  const [adding, setAdding] = useState(false);

  const scope = useAccessScope();
  const canSeeContacts = myRole === "Admin" || myRole === "Teacher";

  useEffect(() => {
    const q = query(collection(db, "users"), where("role", "==", "Student"));
    const unsub = onSnapshot(q, (snap) => setStudents(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "classTeachers"), (snap) => {
      const map = {};
      snap.docs.forEach((d) => { map[d.id] = d.data().teacherName || ""; });
      setClassTeachers(map);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "schoolClasses"), (snap) => {
      setCustomDocs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const unsub = onSnapshot(doc(db, "users", uid), (snap) => setMyRole(snap.exists() ? snap.data().role || "" : ""));
    return () => unsub();
  }, []);

  const customSorted = [...customDocs].sort(
    (a, b) => (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0)
  );
  const customNames = customSorted.map((c) => c.name).filter(Boolean);
  const customByName = {};
  customSorted.forEach((c) => { if (c.name) customByName[c.name] = c; });

  const studentExtras = [...new Set(students.map((s) => s.classLevel).filter(Boolean))].filter(
    (c) => !DEFAULT_CLASS_LEVELS.includes(c) && !customNames.includes(c)
  );
  const everyClass = [...DEFAULT_CLASS_LEVELS, ...customNames, ...studentExtras];

  // Students and parents see only their own class, teachers only the classes they teach.
  const allClasses = scope.classes ? everyClass.filter((c) => scope.classes.includes(c)) : everyClass;
  const visibleStudentCount = students.filter((s) => allClasses.includes(s.classLevel)).length;

  const addClass = async () => {
    const name = newClass.trim().replace(/\s+/g, " ");
    if (!name) return alert("Choose or type a class name.");
    if (name.includes("/")) return alert("Class names can't contain a / character.");
    if (name.length > 40) return alert("That class name is too long.");
    if (everyClass.some((c) => c.toLowerCase() === name.toLowerCase())) {
      return alert(`${name} is already in the list.`);
    }

    setAdding(true);
    try {
      await addDoc(collection(db, "schoolClasses"), { name, createdAt: new Date() });
      setNewClass("");
      setFormKey((k) => k + 1);
      setShowAdd(false);
    } catch (err) {
      alert("Could not add the class. Please try again.");
    }
    setAdding(false);
  };

  const removeClass = async (docId, name) => {
    if (!confirm(`Remove ${name}? This only works for a class with no students.`)) return;
    try {
      await deleteDoc(doc(db, "schoolClasses", docId));
    } catch (err) {
      alert("Could not remove the class. Please try again.");
    }
  };

  const toggleStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === "disabled" ? "active" : "disabled";
    if (!confirm(`${newStatus === "disabled" ? "Disable" : "Enable"} this student's account?`)) return;
    await updateDoc(doc(db, "users", userId), { status: newStatus });
  };

  const phoneLink = (value) => {
    if (!value) return "-";
    const digits = String(value).replace(/[^0-9+]/g, "");
    return <a href={`tel:${digits}`} style={{ color: theme.colors.primary, fontWeight: "600" }}>{value}</a>;
  };

  if (scope.loading) {
    return <p style={{ textAlign: "center", color: theme.colors.textMuted, margin: "40px 0" }}>Loading...</p>;
  }

  const subtitle =
    `${visibleStudentCount} student${visibleStudentCount !== 1 ? "s" : ""} across ` +
    `${allClasses.length} class${allClasses.length !== 1 ? "es" : ""}`;

  return (
    <div style={{ marginTop: "10px" }}>
      <Header
        title="Classes"
        subtitle={subtitle}
        rightSlot={
          isAdmin ? (
            <HeaderAction
              icon={showAdd ? <X size={16} /> : <Plus size={16} />}
              label={showAdd ? "Close" : "Add Class"}
              onClick={() => setShowAdd(!showAdd)}
            />
          ) : null
        }
      />

      {isAdmin && showAdd && (
        <Card style={{ marginTop: "14px" }}>
          <div style={{ fontWeight: "800", color: theme.colors.text, marginBottom: "10px" }}>Add a class</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            <SelectWithManual
              key={formKey}
              value={newClass}
              onChange={setNewClass}
              options={PRESET_NEW.filter((p) => !everyClass.some((c) => c.toLowerCase() === p.toLowerCase()))}
              placeholder="Select a class"
              manualPlaceholder="Type the class name"
            />
          </div>
          <div style={{ marginTop: "12px" }}>
            <Button full onClick={addClass} disabled={adding}>{adding ? "Adding..." : "Add Class"}</Button>
          </div>
        </Card>
      )}

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search for a student..."
        style={{ ...field, width: "100%", margin: "14px 0 4px" }}
      />

      {allClasses.map((c) => {
        const roster = students
          .filter((s) => s.classLevel === c)
          .sort((a, b) => (a.fullName || "").localeCompare(b.fullName || ""))
          .map((s, i) => ({ ...s, roll: i + 1 }));
        const visible = roster.filter((s) => !search || (s.fullName || "").toLowerCase().includes(search.toLowerCase()));
        if (search && visible.length === 0) return null;

        const isOpen = openClass === c || !!search;
        const teacherName = classTeachers[c];
        const customDoc = customByName[c];

        return (
          <Card key={c} style={{ padding: 0, overflow: "hidden" }}>
            <div
              onClick={() => setOpenClass(openClass === c ? null : c)}
              style={{ padding: "14px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: "12px" }}
            >
              <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "#eef0ff", color: "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <LayoutGrid size={22} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: "700", color: theme.colors.text }}>{c}</div>
                <div style={{ fontSize: "12px", color: theme.colors.textMuted }}>
                  {teacherName ? `Class teacher: ${teacherName}` : "No class teacher yet"}
                </div>
              </div>
              <StatusPill label={`${roster.length}`} variant="info" />
              {isOpen ? <ChevronUp size={20} color={theme.colors.textMuted} /> : <ChevronDown size={20} color={theme.colors.textMuted} />}
            </div>

            {isOpen && (
              <div style={{ borderTop: `1px solid ${theme.colors.border}` }}>
                {visible.length === 0 ? (
                  <p style={{ padding: "14px 16px", margin: 0, color: theme.colors.textMuted, fontSize: "14px" }}>
                    No students registered in this class yet.
                  </p>
                ) : (
                  visible.map((s) => (
                    <div key={s.id} style={{ borderBottom: "1px solid #f1f1f8" }}>
                      <div
                        onClick={() => canSeeContacts && setExpandedStudent(expandedStudent === s.id ? null : s.id)}
                        style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 16px", cursor: canSeeContacts ? "pointer" : "default" }}
                      >
                        <span style={{ width: "24px", fontWeight: "800", color: theme.colors.textMuted, fontSize: "13px" }}>{s.roll}</span>
                        <Avatar name={s.fullName} photoURL={s.photoURL} size={44} />
                        <span style={{ flex: 1, minWidth: 0, fontWeight: "600", fontSize: "14px", color: theme.colors.text }}>{s.fullName || "(no name)"}</span>
                        {s.status === "disabled" && <StatusPill label="Disabled" variant="danger" />}
                        {canSeeContacts && (expandedStudent === s.id ? <ChevronUp size={18} color={theme.colors.textMuted} /> : <ChevronDown size={18} color={theme.colors.textMuted} />)}
                      </div>

                      {canSeeContacts && expandedStudent === s.id && (
                        <div style={{ padding: "4px 16px 14px 52px", fontSize: "13px", color: theme.colors.text }}>
                          <div style={{ padding: "3px 0" }}><span style={{ color: theme.colors.textMuted }}>Reg. No: </span>{s.regNumber || "-"}</div>
                          <div style={{ padding: "3px 0" }}><span style={{ color: theme.colors.textMuted }}>Subjects: </span>{s.subjects?.length ? s.subjects.join(", ") : "-"}</div>
                          <div style={{ padding: "3px 0" }}><span style={{ color: theme.colors.textMuted }}>Parent: </span>{s.parentName || "-"}</div>
                          <div style={{ padding: "3px 0" }}><span style={{ color: theme.colors.textMuted }}>Parent phone: </span>{phoneLink(s.parentPhone)}</div>
                          {isAdmin && (
                            <div style={{ marginTop: "8px" }}>
                              <Button size="sm" variant={s.status === "disabled" ? "primary" : "danger"} onClick={() => toggleStatus(s.id, s.status)}>
                                {s.status === "disabled" ? "Enable Account" : "Disable Account"}
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}

                {isAdmin && customDoc && roster.length === 0 && (
                  <div style={{ padding: "10px 16px 14px" }}>
                    <Button size="sm" variant="danger" icon={<Trash2 size={14} />} onClick={() => removeClass(customDoc.id, c)}>
                      Remove class
                    </Button>
                  </div>
                )}
              </div>
            )}
          </Card>
        );
      })}

      {allClasses.length === 0 && (
        <EmptyState
          icon={LayoutGrid}
          text={scope.role === "Teacher" ? "No classes have been assigned to you yet." : "No classes to show yet."}
        />
      )}
    </div>
  );
}