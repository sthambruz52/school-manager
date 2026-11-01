import { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { ChevronDown, ChevronUp, LayoutGrid } from "lucide-react";
import { theme, field } from "../theme";
import Header from "./ui/Header";
import Card from "./ui/Card";
import Button from "./ui/Button";
import Avatar from "./ui/Avatar";
import StatusPill from "./ui/StatusPill";
import EmptyState from "./ui/EmptyState";

const DEFAULT_CLASS_LEVELS = [
  "Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6",
  "JSS1", "JSS2", "JSS3",
  "SS1", "SS2", "SS3"
];

export default function Classes({ isAdmin }) {
  const [students, setStudents] = useState([]);
  const [classTeachers, setClassTeachers] = useState({});
  const [myRole, setMyRole] = useState("");
  const [openClass, setOpenClass] = useState(null);
  const [expandedStudent, setExpandedStudent] = useState(null);
  const [search, setSearch] = useState("");

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
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const unsub = onSnapshot(doc(db, "users", uid), (snap) => setMyRole(snap.exists() ? snap.data().role || "" : ""));
    return () => unsub();
  }, []);

  const toggleStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === "disabled" ? "active" : "disabled";
    if (!confirm(`${newStatus === "disabled" ? "Disable" : "Enable"} this student's account?`)) return;
    await updateDoc(doc(db, "users", userId), { status: newStatus });
  };

  const extraClasses = [...new Set(students.map((s) => s.classLevel).filter(Boolean))].filter(
    (c) => !DEFAULT_CLASS_LEVELS.includes(c)
  );
  const allClasses = [...DEFAULT_CLASS_LEVELS, ...extraClasses];

  const phoneLink = (value) => {
    if (!value) return "-";
    const digits = String(value).replace(/[^0-9+]/g, "");
    return <a href={`tel:${digits}`} style={{ color: theme.colors.primary, fontWeight: "600" }}>{value}</a>;
  };

  return (
    <div style={{ marginTop: "10px" }}>
      <Header title="Classes" subtitle={`${students.length} student${students.length !== 1 ? "s" : ""} across ${allClasses.length} classes`} />

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
              </div>
            )}
          </Card>
        );
      })}

      {students.length === 0 && <EmptyState icon={LayoutGrid} text="No students registered yet." />}
    </div>
  );
}