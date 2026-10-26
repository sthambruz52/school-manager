import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";

const CLASS_LEVELS = [
  "Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6",
  "JSS1", "JSS2", "JSS3",
  "SS1", "SS2", "SS3"
];
const TERMS = ["First Term", "Second Term", "Third Term"];
const OTHER_VALUE = "__OTHER__";
const LOW_ATTENDANCE_THRESHOLD = 75;

export default function AttendanceAnalytics() {
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);

  const [classSelect, setClassSelect] = useState("");
  const [manualClass, setManualClass] = useState("");
  const [session, setSession] = useState("");
  const [term, setTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");

  const isManualClass = classSelect === OTHER_VALUE;
  const classFilter = isManualClass ? manualClass.trim() : classSelect;

  useEffect(() => {
    const q = query(collection(db, "users"), where("role", "==", "Student"));
    const unsub = onSnapshot(q, (snap) => setStudents(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "attendance"), (snap) => {
      setAttendance(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const filteredStudents = students.filter((s) => !classFilter || s.classLevel === classFilter);

  const rows = filteredStudents.map((s) => {
    const records = attendance.filter((a) => {
      if (a.studentId !== s.id) return false;
      if (session && a.session !== session) return false;
      if (term && a.term !== term) return false;
      return true;
    });
    const present = records.filter((r) => r.status === "Present" || r.status === "Late").length;
    const total = records.length;
    const pct = total > 0 ? Math.round((present / total) * 100) : null;
    return { id: s.id, name: s.fullName, classLevel: s.classLevel, present, total, pct };
  });

  const sortedRows = [...rows].sort((a, b) => {
    if (sortBy === "pct") return (a.pct ?? -1) - (b.pct ?? -1);
    return (a.name || "").localeCompare(b.name || "");
  });

  const overallPresent = rows.reduce((sum, r) => sum + r.present, 0);
  const overallTotal = rows.reduce((sum, r) => sum + r.total, 0);
  const overallPct = overallTotal > 0 ? Math.round((overallPresent / overallTotal) * 100) : 0;

  const inputStyle = { padding: "8px", borderRadius: "6px" };

  return (
    <div style={{ marginTop: "20px" }}>
      <h2 style={{ textAlign: "center" }}>Attendance Analytics</h2>

      <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginBottom: "15px", flexWrap: "wrap" }}>
        <select value={classSelect} onChange={(e) => setClassSelect(e.target.value)} style={inputStyle}>
          <option value="">All classes</option>
          {CLASS_LEVELS.map((c) => <option key={c} value={c}>{c}</option>)}
          <option value={OTHER_VALUE}>Manual Input</option>
        </select>
        {isManualClass && (
          <input value={manualClass} onChange={(e) => setManualClass(e.target.value)} placeholder="Type class name" style={inputStyle} />
        )}

        <input value={session} onChange={(e) => setSession(e.target.value)} placeholder="Session (e.g. 2025/2026)" style={inputStyle} />

        <select value={term} onChange={(e) => setTerm(e.target.value)} style={inputStyle}>
          <option value="">All terms</option>
          {TERMS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>

        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={inputStyle}>
          <option value="name">Sort: Name (A-Z)</option>
          <option value="pct">Sort: Lowest Attendance First</option>
        </select>
      </div>

      {rows.length === 0 ? (
        <p style={{ textAlign: "center", color: "#666" }}>No students match this filter yet.</p>
      ) : (
        <>
          <p style={{ textAlign: "center", color: "#666" }}>
            Overall: {overallPresent}/{overallTotal} days present ({overallPct}%) across {rows.length} student{rows.length !== 1 ? "s" : ""}
          </p>

          <div style={{ maxWidth: "650px", margin: "0 auto" }}>
            {sortedRows.map((r) => {
              const isLow = r.pct !== null && r.pct < LOW_ATTENDANCE_THRESHOLD;
              return (
                <div
                  key={r.id}
                  style={{
                    background: "white",
                    padding: "12px 14px",
                    margin: "8px 0",
                    borderRadius: "8px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderLeft: isLow ? "5px solid #c2704e" : "5px solid #1f4d3a"
                  }}
                >
                  <div>
                    <div style={{ fontWeight: "bold" }}>{r.name}</div>
                    <div style={{ fontSize: "13px", color: "#666" }}>{r.classLevel}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    {r.pct === null ? (
                      <span style={{ color: "#999", fontSize: "13px" }}>No records</span>
                    ) : (
                      <>
                        <div style={{ fontWeight: "bold", color: isLow ? "#c2704e" : "#1f4d3a", fontSize: "16px" }}>
                          {r.pct}%
                        </div>
                        <div style={{ fontSize: "12px", color: "#888" }}>{r.present}/{r.total} days</div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}