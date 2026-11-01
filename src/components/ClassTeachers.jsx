import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, query, where, onSnapshot, doc, setDoc } from "firebase/firestore";
import { theme, field } from "../theme";
import Header from "./ui/Header";
import Card from "./ui/Card";
import Avatar from "./ui/Avatar";
import StatusPill from "./ui/StatusPill";

const DEFAULT_CLASS_LEVELS = [
  "Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6",
  "JSS1", "JSS2", "JSS3",
  "SS1", "SS2", "SS3"
];

export default function ClassTeachers() {
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [assigned, setAssigned] = useState({});

  useEffect(() => {
    const q = query(collection(db, "users"), where("role", "==", "Teacher"));
    const unsub = onSnapshot(q, (snap) => setTeachers(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "users"), where("role", "==", "Student"));
    const unsub = onSnapshot(q, (snap) => setStudents(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "classTeachers"), (snap) => {
      const map = {};
      snap.docs.forEach((d) => { map[d.id] = d.data().teacherId || ""; });
      setAssigned(map);
    });
    return () => unsub();
  }, []);

  const handleAssign = async (classLevel, teacherId) => {
    const teacher = teachers.find((t) => t.id === teacherId);
    try {
      await setDoc(doc(db, "classTeachers", classLevel), {
        teacherId: teacherId || "",
        teacherName: teacher?.fullName || "",
        classLevel
      });
    } catch (err) {
      alert("Could not save that assignment. Please try again.");
    }
  };

  const extraClasses = [...new Set(students.map((s) => s.classLevel).filter(Boolean))].filter(
    (c) => !DEFAULT_CLASS_LEVELS.includes(c)
  );
  const allClasses = [...DEFAULT_CLASS_LEVELS, ...extraClasses];
  const assignedCount = allClasses.filter((c) => assigned[c]).length;

  return (
    <div style={{ marginTop: "10px" }}>
      <Header title="Class Teachers" subtitle={`${assignedCount} of ${allClasses.length} classes have a class teacher`} />

      {teachers.length === 0 && (
        <p style={{ textAlign: "center", color: theme.colors.textMuted, margin: "20px 0" }}>No teachers registered yet.</p>
      )}

      {allClasses.map((c) => {
        const teacherId = assigned[c] || "";
        const current = teachers.find((t) => t.id === teacherId);
        const count = students.filter((s) => s.classLevel === c).length;
        const options = teachers.filter((t) => t.status !== "disabled" || t.id === teacherId);

        return (
          <Card key={c}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <div>
                <div style={{ fontWeight: "800", color: theme.colors.text }}>{c}</div>
                <div style={{ fontSize: "12px", color: theme.colors.textMuted }}>{count} student{count !== 1 ? "s" : ""}</div>
              </div>
              <StatusPill label={teacherId ? "Assigned" : "Not assigned"} variant={teacherId ? "success" : "warning"} />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Avatar name={current?.fullName || "?"} photoURL={current?.photoURL} size={44} />
              <select value={teacherId} onChange={(e) => handleAssign(c, e.target.value)} style={{ ...field, flex: 1 }}>
                <option value="">Not assigned</option>
                {options.map((t) => (
                  <option key={t.id} value={t.id}>{t.fullName}{t.status === "disabled" ? " (disabled)" : ""}</option>
                ))}
              </select>
            </div>
          </Card>
        );
      })}
    </div>
  );
}