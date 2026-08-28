import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, query, where, onSnapshot, doc, setDoc } from "firebase/firestore";

const DEFAULT_CLASS_LEVELS = [
  "Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6",
  "JSS1", "JSS2", "JSS3",
  "SS1", "SS2", "SS3"
];

export default function ClassTeachers() {
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [assignments, setAssignments] = useState({});

  useEffect(() => {
    const q = query(collection(db, "users"), where("role", "==", "Teacher"));
    const unsub = onSnapshot(q, (snap) => {
      setTeachers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "users"), where("role", "==", "Student"));
    const unsub = onSnapshot(q, (snap) => {
      setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "classTeachers"), (snap) => {
      const map = {};
      snap.docs.forEach(d => { map[d.id] = d.data().teacherId; });
      setAssignments(map);
    });
    return () => unsub();
  }, []);

  const handleAssign = async (classLevel, teacherId) => {
    setAssignments((prev) => ({ ...prev, [classLevel]: teacherId }));

    if (!teacherId) {
      await setDoc(doc(db, "classTeachers", classLevel), { teacherId: "", teacherName: "", classLevel });
      return;
    }

    const teacher = teachers.find((t) => t.id === teacherId);
    await setDoc(doc(db, "classTeachers", classLevel), {
      teacherId,
      teacherName: teacher?.fullName || "",
      classLevel
    });
  };

  const extraClasses = [...new Set(students.map((s) => s.classLevel).filter(Boolean))]
    .filter((c) => !DEFAULT_CLASS_LEVELS.includes(c));

  const allClasses = [...DEFAULT_CLASS_LEVELS, ...extraClasses];

  return (
    <div style={{ marginTop: "40px" }}>
      <h2 style={{ textAlign: "center" }}>Class Teacher Assignment</h2>
      {teachers.length === 0 && (
        <p style={{ textAlign: "center", color: "#999" }}>No teachers registered yet.</p>
      )}
      {allClasses.map((c) => (
        <div key={c} style={{ background: "white", padding: "12px", margin: "8px 0", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>{c}</span>
          <select
            value={assignments[c] || ""}
            onChange={(e) => handleAssign(c, e.target.value)}
            style={{ padding: "6px", borderRadius: "6px" }}
          >
            <option value="">Not assigned</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>{t.fullName}</option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}