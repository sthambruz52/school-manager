import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";

const DEFAULT_CLASS_LEVELS = [
  "Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6",
  "JSS1", "JSS2", "JSS3",
  "SS1", "SS2", "SS3"
];

export default function Classes({ isAdmin }) {
  const [students, setStudents] = useState([]);
  const [openClass, setOpenClass] = useState(null);
  const [expandedStudent, setExpandedStudent] = useState(null);

  useEffect(() => {
    const q = query(collection(db, "users"), where("role", "==", "Student"));
    const unsub = onSnapshot(q, (snap) => setStudents(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, []);

  const toggleStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === "disabled" ? "active" : "disabled";
    if (!confirm(`${newStatus === "disabled" ? "Disable" : "Enable"} this student's account?`)) return;
    await updateDoc(doc(db, "users", userId), { status: newStatus });
  };

  const extraClasses = [...new Set(students.map((s) => s.classLevel).filter(Boolean))]
    .filter((c) => !DEFAULT_CLASS_LEVELS.includes(c));

  const allClasses = [...DEFAULT_CLASS_LEVELS, ...extraClasses];

  const studentsInClass = (classLevel) =>
    students
      .filter((s) => s.classLevel === classLevel)
      .sort((a, b) => (a.fullName || "").localeCompare(b.fullName || ""));

  return (
    <div style={{ marginTop: "20px" }}>
      <h2 style={{ textAlign: "center" }}>Classes</h2>

      {allClasses.map((c) => {
        const roster = studentsInClass(c);
        return (
          <div key={c} style={{ background: "white", borderRadius: "10px", margin: "8px 0", overflow: "hidden" }}>
            <div
              onClick={() => setOpenClass(openClass === c ? null : c)}
              style={{ padding: "14px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: "bold", color: "#1f4d3a" }}
            >
              <span>{c}</span>
              <span style={{ fontSize: "13px", color: "#666", fontWeight: "normal" }}>{roster.length} student{roster.length !== 1 ? "s" : ""}</span>
            </div>

            {openClass === c && (
              <div style={{ borderTop: "1px solid #eee" }}>
                {roster.length === 0 ? (
                  <p style={{ padding: "14px", color: "#666", margin: 0 }}>No students registered in this class yet.</p>
                ) : (
                  roster.map((s, i) => (
                    <div key={s.id} style={{ padding: "12px 14px", borderBottom: "1px solid #f4f0e6" }}>
                      <div
                        onClick={() => setExpandedStudent(expandedStudent === s.id ? null : s.id)}
                        style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}
                      >
                        <span style={{ fontWeight: "bold", color: "#c2704e", width: "24px" }}>{i + 1}.</span>
                        {s.photoURL ? (
                          <img src={s.photoURL} alt="" style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover" }} />
                        ) : (
                          <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#fdf6e9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: "bold", color: "#1f4d3a" }}>
                            {s.fullName?.charAt(0).toUpperCase() || "?"}
                          </div>
                        )}
                        <span style={{ flex: 1 }}>{s.fullName || "(no name)"}</span>
                        {s.status === "disabled" && (
                          <span style={{ background: "#c2704e", color: "white", fontSize: "11px", padding: "2px 8px", borderRadius: "10px" }}>Disabled</span>
                        )}
                      </div>

                      {expandedStudent === s.id && (
                        <div style={{ marginTop: "10px", paddingLeft: "34px", fontSize: "13px", color: "#666", display: "flex", flexDirection: "column", gap: "4px" }}>
                          <div><strong>Subjects:</strong> {s.subjects?.length ? s.subjects.join(", ") : "—"}</div>
                          <div><strong>Parent:</strong> {s.parentName || "—"} {s.parentPhone && `(${s.parentPhone})`}</div>
                          {isAdmin && (
                            <button
                              onClick={() => toggleStatus(s.id, s.status)}
                              style={{ marginTop: "6px", alignSelf: "flex-start", background: s.status === "disabled" ? "#1f4d3a" : "#c2704e", color: "white", border: "none", padding: "5px 12px", borderRadius: "6px", fontSize: "12px" }}
                            >
                              {s.status === "disabled" ? "Enable Account" : "Disable Account"}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}