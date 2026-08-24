import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";
import StudentProfile from "./StudentProfile";
import ParentProfile from "./ParentProfile";
import { exportToCSV } from "../utils/exportCSV";

export default function AdminStudents({ isAdmin = true }) {
  const [activeTab, setActiveTab] = useState("students");
  const [students, setStudents] = useState([]);
  const [parents, setParents] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    const q = query(collection(db, "users"), where("role", "==", "Student"));
    const unsub = onSnapshot(q, (snap) => setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "users"), where("role", "==", "Parent"));
    const unsub = onSnapshot(q, (snap) => setParents(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, []);

  const toggleStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === "disabled" ? "active" : "disabled";
    if (!confirm(`${newStatus === "disabled" ? "Disable" : "Enable"} this account?`)) return;
    await updateDoc(doc(db, "users", userId), { status: newStatus });
  };
    const handleExport = () => {
    if (activeTab === "students") {
      const headers = ["Full Name", "Class", "Session", "Term", "Subjects", "Parent Name", "Parent Phone", "Parent Email", "Status"];
      const rows = students.map((s) => [
        s.fullName || "",
        s.classLevel || "",
        s.session || "",
        s.term || "",
        (s.subjects || []).join("; "),
        s.parentName || "",
        s.parentPhone || "",
        s.parentEmail || "",
        s.status || "active"
      ]);
      exportToCSV("students.csv", headers, rows);
    } else {
      const headers = ["Full Name", "Phone", "Email", "Children", "Status"];
      const rows = parents.map((p) => [
        p.fullName || "",
        p.phone || "",
        p.email || "",
        (p.children || []).map((c) => c.name).join("; "),
        p.status || "active"
      ]);
      exportToCSV("parents.csv", headers, rows);
    }
  };

  if (editingUser) {
    const Comp = editingUser.role === "Student" ? StudentProfile : ParentProfile;
    return (
      <Comp
        existingData={editingUser.data}
        targetUid={editingUser.uid}
        onComplete={() => setEditingUser(null)}
      />
    );
  }

  const cardStyle = { background: "white", padding: "12px", margin: "8px 0", borderRadius: "8px" };
  const tabStyle = (active) => ({
    padding: "8px 16px",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
    background: active ? "#1f4d3a" : "white",
    color: active ? "white" : "#1f4d3a",
    fontWeight: "bold"
  });

  return (
    <div style={{ marginTop: "20px" }}>
      <h2 style={{ textAlign: "center" }}>Students & Parents</h2>

      <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
        <button onClick={() => setActiveTab("students")} style={tabStyle(activeTab === "students")}>Students ({students.length})</button>
        <button onClick={() => setActiveTab("parents")} style={tabStyle(activeTab === "parents")}>Parents ({parents.length})</button>
        {isAdmin && (
          <button onClick={handleExport} style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #1f4d3a", background: "white", color: "#1f4d3a", fontWeight: "bold", cursor: "pointer" }}>
            Export CSV
          </button>
        )}
      </div>

      <input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search by name..."
        style={{ display: "block", margin: "0 auto 16px", padding: "10px", borderRadius: "6px", width: "260px", maxWidth: "90%" }}
      />

      {activeTab === "students" && (
        students.filter((s) => (s.fullName || "").toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
          <p style={{ textAlign: "center", color: "#666" }}>No students registered yet.</p>
        ) : (
          students.filter((s) => (s.fullName || "").toLowerCase().includes(searchTerm.toLowerCase())).map((s) => (
            <div key={s.id} style={cardStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }} onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}>
                {s.photoURL ? (
                  <img src={s.photoURL} alt="" style={{ width: "44px", height: "44px", borderRadius: "50%", objectFit: "cover" }} />
                ) : (
                  <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "#fdf6e9", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", color: "#1f4d3a" }}>
                    {s.fullName?.charAt(0).toUpperCase() || "?"}
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: "bold" }}>{s.fullName || "(no name)"}</div>
                  <div style={{ fontSize: "13px", color: "#666" }}>{s.classLevel || "No class set"}</div>
                </div>
                {s.status === "disabled" && (
                  <span style={{ background: "#c2704e", color: "white", fontSize: "11px", padding: "2px 8px", borderRadius: "10px" }}>Disabled</span>
                )}
              </div>

              {expandedId === s.id && (
                <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #eee", fontSize: "14px", display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div><strong>Session:</strong> {s.session || "—"} &nbsp; <strong>Term:</strong> {s.term || "—"}</div>
                  <div><strong>Subjects:</strong> {s.subjects?.length ? s.subjects.join(", ") : "—"}</div>
                  <div><strong>Address:</strong> {[s.address?.street, s.address?.lga, s.address?.city, s.address?.state, s.address?.country].filter(Boolean).join(", ") || "—"}</div>
                  <div style={{ marginTop: "6px" }}><strong>Parent:</strong> {s.parentName || "—"}</div>
                  <div><strong>Parent Phone:</strong> {s.parentPhone || "—"}</div>
                  <div><strong>Parent Email:</strong> {s.parentEmail || "—"}</div>
                  <div><strong>Parent Address:</strong> {[s.parentAddress?.street, s.parentAddress?.lga, s.parentAddress?.city, s.parentAddress?.state, s.parentAddress?.country].filter(Boolean).join(", ") || "—"}</div>

                  {isAdmin && (
                    <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                      <button onClick={() => setEditingUser({ uid: s.id, role: "Student", data: s })} style={{ background: "#1f4d3a", color: "white", border: "none", padding: "6px 14px", borderRadius: "6px" }}>Edit</button>
                      <button onClick={() => toggleStatus(s.id, s.status)} style={{ background: s.status === "disabled" ? "#1f4d3a" : "#c2704e", color: "white", border: "none", padding: "6px 14px", borderRadius: "6px" }}>
                        {s.status === "disabled" ? "Enable Account" : "Disable Account"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )
      )}

      {activeTab === "parents" && (
        parents.filter((p) => (p.fullName || "").toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
          <p style={{ textAlign: "center", color: "#666" }}>No parents registered yet.</p>
        ) : (
          parents.filter((p) => (p.fullName || "").toLowerCase().includes(searchTerm.toLowerCase())).map((p) => (
            <div key={p.id} style={cardStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }} onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}>
                <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "#fdf6e9", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", color: "#1f4d3a" }}>
                  {p.fullName?.charAt(0).toUpperCase() || "?"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: "bold" }}>{p.fullName || "(no name)"}</div>
                  <div style={{ fontSize: "13px", color: "#666" }}>{p.children?.length ? `${p.children.length} ward(s) linked` : "No ward linked"}</div>
                </div>
                {p.status === "disabled" && (
                  <span style={{ background: "#c2704e", color: "white", fontSize: "11px", padding: "2px 8px", borderRadius: "10px" }}>Disabled</span>
                )}
              </div>

              {expandedId === p.id && (
                <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #eee", fontSize: "14px", display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div><strong>Phone:</strong> {p.phone || "—"}</div>
                  <div><strong>Email:</strong> {p.email || "—"}</div>
                  <div><strong>Ward(s):</strong> {p.children?.length ? p.children.map(c => c.name).join(", ") : "—"}</div>

                  <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                    <button onClick={() => setEditingUser({ uid: p.id, role: "Parent", data: p })} style={{ background: "#1f4d3a", color: "white", border: "none", padding: "6px 14px", borderRadius: "6px" }}>Edit</button>
                    <button onClick={() => toggleStatus(p.id, p.status)} style={{ background: p.status === "disabled" ? "#1f4d3a" : "#c2704e", color: "white", border: "none", padding: "6px 14px", borderRadius: "6px" }}>
                      {p.status === "disabled" ? "Enable Account" : "Disable Account"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )
      )}
    </div>
  );
}