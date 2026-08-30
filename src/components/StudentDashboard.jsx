import { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { collection, query, where, onSnapshot, doc } from "firebase/firestore";
import { printFeeReceipt } from "../utils/printReceipt";
export default function StudentDashboard({ userData }) {
  const [grades, setGrades] = useState([]);
  const [fees, setFees] = useState([]);
  const [classmates, setClassmates] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classTeacher, setClassTeacher] = useState(null);

  const uid = auth.currentUser.uid;

  useEffect(() => {
    const q = query(collection(db, "grades"), where("studentId", "==", uid));
    const unsub = onSnapshot(q, (snap) => setGrades(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, [uid]);

  useEffect(() => {
    const q = query(collection(db, "fees"), where("studentId", "==", uid));
    const unsub = onSnapshot(q, (snap) => setFees(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, [uid]);

  useEffect(() => {
    if (!userData.classLevel) return;
    const q = query(collection(db, "users"), where("role", "==", "Student"), where("classLevel", "==", userData.classLevel));
    const unsub = onSnapshot(q, (snap) =>
      setClassmates(snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((s) => s.id !== uid))
    );
    return () => unsub();
  }, [userData.classLevel, uid]);

  useEffect(() => {
    const q = query(collection(db, "users"), where("role", "==", "Teacher"));
    const unsub = onSnapshot(q, (snap) => setTeachers(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!userData.classLevel) return;
    const unsub = onSnapshot(doc(db, "classTeachers", userData.classLevel), (docSnap) => {
      setClassTeacher(docSnap.exists() ? docSnap.data() : null);
    });
    return () => unsub();
  }, [userData.classLevel]);

  const cardStyle = { background: "white", padding: "12px", margin: "8px 0", borderRadius: "8px" };

   return (
    <div style={{ maxWidth: "700px", margin: "20px auto" }}>
      <div style={{ background: "white", padding: "12px", margin: "8px 0", borderRadius: "8px", textAlign: "center" }}>
        <strong>Class:</strong> {userData.classLevel || "Not set"}
        {userData.session && <> &nbsp;|&nbsp; <strong>Session:</strong> {userData.session}</>}
        {userData.term && <> &nbsp;|&nbsp; <strong>Term:</strong> {userData.term}</>}
      </div>

      <h2 style={{ textAlign: "center" }}>My Grades</h2>
      {grades.length === 0 ? (
        <p style={{ textAlign: "center", color: "#666" }}>No grades recorded yet.</p>
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

      <h2 style={{ textAlign: "center", marginTop: "30px" }}>My Fees</h2>
      {fees.filter(f => f.totalDue !== undefined).length === 0 ? (
        <p style={{ textAlign: "center", color: "#666" }}>No fee records yet.</p>
      ) : (
        fees.filter(f => f.totalDue !== undefined).map((f) => {
          const status = f.amountPaid >= f.totalDue ? "Full Payment" : f.amountPaid > 0 ? "Part Payment" : "Unpaid";
          const statusColor = status === "Full Payment" ? "#1f4d3a" : status === "Part Payment" ? "#d4a017" : "#c2704e";
          return (
            <div key={f.id} style={cardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <strong>{f.feeType}</strong>
                  <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#666" }}>
                    {f.term} — ₦{f.amountPaid.toLocaleString()} of ₦{f.totalDue.toLocaleString()}
                  </p>
                </div>
                <span style={{ background: statusColor, color: "white", padding: "4px 12px", borderRadius: "12px", fontSize: "13px" }}>
                  {status}
                </span>
              </div>
              <button
                onClick={() => printFeeReceipt(f)}
                style={{ marginTop: "8px", background: "white", color: "#1f4d3a", border: "1px solid #1f4d3a", padding: "5px 12px", borderRadius: "6px", fontSize: "13px" }}
              >
                Download Receipt
              </button>
            </div>
          );
        })
      )}

      <h2 style={{ textAlign: "center", marginTop: "30px" }}>My Attendance Today</h2>
      <div style={cardStyle}>
        <strong style={{ color: userData.present ? "#1f4d3a" : "#c2704e" }}>
          {userData.present ? "Present" : "Absent"}
        </strong>
      </div>

      <h2 style={{ textAlign: "center", marginTop: "30px" }}>My Class Teacher</h2>
      <div style={cardStyle}>
        {classTeacher && classTeacher.teacherName ? classTeacher.teacherName : "Not assigned yet"}
      </div>

      <h2 style={{ textAlign: "center", marginTop: "30px" }}>My Classmates ({userData.classLevel})</h2>
      {classmates.length === 0 ? (
        <p style={{ textAlign: "center", color: "#666" }}>No classmates found.</p>
      ) : (
        classmates.map((c) => <div key={c.id} style={cardStyle}>{c.fullName}</div>)
      )}

      <h2 style={{ textAlign: "center", marginTop: "30px" }}>Teachers</h2>
      {teachers.length === 0 ? (
        <p style={{ textAlign: "center", color: "#666" }}>No teachers registered yet.</p>
      ) : (
        teachers.map((t) => (
          <div key={t.id} style={{ ...cardStyle, display: "flex", alignItems: "center", gap: "10px" }}>
            {t.photoURL && <img src={t.photoURL} alt="" style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }} />}
            <span>{t.fullName} {t.subjects && t.subjects.length > 0 && `— ${t.subjects.join(", ")}`}</span>
          </div>
        ))
      )}
    </div>
  );
}