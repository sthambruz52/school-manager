import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";

export default function MySubjects({ userData }) {
  const [teachers, setTeachers] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "users"), where("role", "==", "Teacher"));
    const unsub = onSnapshot(q, (snap) => setTeachers(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, []);

  const subjects = userData.subjects || [];

  const teachersFor = (subjectName) =>
    teachers.filter((t) => (t.subjects || []).includes(subjectName)).map((t) => t.fullName);

  return (
    <div style={{ maxWidth: "700px", margin: "20px auto", padding: "0 20px" }}>
      <h2 style={{ textAlign: "center" }}>My Subjects</h2>

      {subjects.length === 0 ? (
        <p style={{ textAlign: "center", color: "#666" }}>
          No subjects selected yet. Go to "My Profile" to add them.
        </p>
      ) : (
        subjects.map((s) => {
          const subjectTeachers = teachersFor(s);
          return (
            <div key={s} style={{ background: "white", padding: "14px", margin: "8px 0", borderRadius: "8px" }}>
              <div style={{ fontWeight: "bold", color: "#1f4d3a" }}>{s}</div>
              <div style={{ fontSize: "13px", color: "#666", marginTop: "4px" }}>
                {subjectTeachers.length > 0
                  ? `Taught by ${subjectTeachers.join(", ")}`
                  : "No teacher assigned yet"}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}