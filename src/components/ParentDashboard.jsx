import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, query, where, onSnapshot, doc } from "firebase/firestore";

function ChildSection({ child }) {
  const [grades, setGrades] = useState([]);
  const [fees, setFees] = useState([]);
  const [studentData, setStudentData] = useState(null);
  const [classTeacher, setClassTeacher] = useState(null);

  useEffect(() => {
    const q = query(collection(db, "grades"), where("studentId", "==", child.uid));
    const unsub = onSnapshot(q, (snap) => setGrades(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, [child.uid]);

  useEffect(() => {
    const q = query(collection(db, "fees"), where("studentId", "==", child.uid));
    const unsub = onSnapshot(q, (snap) => setFees(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, [child.uid]);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "users", child.uid), (docSnap) => {
      if (docSnap.exists()) setStudentData(docSnap.data());
    });
    return () => unsub();
  }, [child.uid]);

  useEffect(() => {
    if (!studentData?.classLevel) return;
    const unsub = onSnapshot(doc(db, "classTeachers", studentData.classLevel), (docSnap) => {
      setClassTeacher(docSnap.exists() ? docSnap.data() : null);
    });
    return () => unsub();
  }, [studentData?.classLevel]);

  const cardStyle = { background: "white", padding: "12px", margin: "8px 0", borderRadius: "8px" };

  return (
    <div style={{ marginTop: "30px", border: "1px solid #eee", borderRadius: "10px", padding: "16px" }}>
      <h2 style={{ textAlign: "center", color: "#1f4d3a" }}>{child.name} — {studentData?.classLevel}</h2>

      <h3 style={{ textAlign: "center" }}>Grades</h3>
      {grades.length === 0 ? (
        <p style={{ textAlign: "center", color: "#666" }}>No grades yet.</p>
      ) : (
        grades.map((g) => {
          const pct = g.maxScore ? Math.round((g.score / g.maxScore) * 100) : 0;
          return (
            <div key={g.id} style={{ ...cardStyle, display: "flex", justifyContent: "space-between" }}>
              <span>{g.subject}</span>
              <span style={{ color: pct >= 60 ? "#1f4d3a" : "#c2704e", fontWeight: "bold" }}>
                {g.score}/{g.maxScore} ({pct}%)
              </span>
            </div>
          );
        })
      )}

      <h3 style={{ textAlign: "center" }}>Fees</h3>
      {fees.length === 0 ? (
        <p style={{ textAlign: "center", color: "#666" }}>No fee records yet.</p>
      ) : (
        fees.map((f) => (
          <div key={f.id} style={{ ...cardStyle, display: "flex", justifyContent: "space-between" }}>
            <span>{f.term} — ₦{f.amount.toLocaleString()}</span>
            <span style={{ background: f.status === "Paid" ? "#1f4d3a" : "#c2704e", color: "white", padding: "4px 12px", borderRadius: "12px" }}>
              {f.status}
            </span>
          </div>
        ))
      )}

      <h3 style={{ textAlign: "center" }}>Attendance Today</h3>
      <div style={cardStyle}>
        <strong style={{ color: studentData?.present ? "#1f4d3a" : "#c2704e" }}>
          {studentData?.present ? "Present" : "Absent"}
        </strong>
      </div>

      <h3 style={{ textAlign: "center" }}>Class Teacher</h3>
      <div style={cardStyle}>{classTeacher?.teacherName || "Not assigned yet"}</div>
    </div>
  );
}

export default function ParentDashboard({ userData }) {
  const children = userData.children || [];

  return (
    <div style={{ maxWidth: "700px", margin: "20px auto" }}>
      {children.length === 0 ? (
        <p style={{ textAlign: "center", color: "#666" }}>
          No ward linked yet. Go to "My Profile" to search and link your child.
        </p>
      ) : (
        children.map((child) => <ChildSection key={child.uid} child={child} />)
      )}
    </div>
  );
}