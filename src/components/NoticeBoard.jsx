import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, addDoc, deleteDoc, doc, onSnapshot, orderBy, query } from "firebase/firestore";

export default function NoticeBoard({ isAdmin }) {
  const [notices, setNotices] = useState([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "notices"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setNotices(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const addNotice = async () => {
    if (!title.trim() || !message.trim()) return alert("Enter a title and message.");

    setSaving(true);
    await addDoc(collection(db, "notices"), {
      title: title.trim(),
      message: message.trim(),
      urgent,
      createdAt: new Date()
    });
    setTitle(""); setMessage(""); setUrgent(false);
    setSaving(false);
  };

  const removeNotice = async (id) => {
    if (confirm("Remove this notice?")) await deleteDoc(doc(db, "notices", id));
  };

  const inputStyle = { padding: "10px", borderRadius: "6px" };

  return (
    <div style={{ marginTop: "20px" }}>
      <h2 style={{ textAlign: "center" }}>Notice Board</h2>

      {isAdmin && (
        <div style={{ background: "white", padding: "16px", borderRadius: "10px", marginBottom: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Notice title" style={inputStyle} />
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write the announcement..."
            rows={4}
            style={{ ...inputStyle, resize: "vertical", fontFamily: "Arial" }}
          />
          <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
            <input type="checkbox" checked={urgent} onChange={(e) => setUrgent(e.target.checked)} />
            Mark as urgent
          </label>
          <button onClick={addNotice} disabled={saving} style={{ background: "#1f4d3a", color: "white", padding: "10px", borderRadius: "6px", border: "none" }}>
            {saving ? "Posting..." : "Post Notice"}
          </button>
        </div>
      )}

      {notices.length === 0 ? (
        <p style={{ textAlign: "center", color: "#666" }}>No notices posted yet.</p>
      ) : (
        notices.map((n) => (
          <div
            key={n.id}
            style={{
              background: "white",
              padding: "14px",
              margin: "10px 0",
              borderRadius: "10px",
              borderLeft: n.urgent ? "5px solid #c2704e" : "5px solid #1f4d3a"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                {n.urgent && (
                  <span style={{ background: "#c2704e", color: "white", fontSize: "11px", fontWeight: "bold", padding: "2px 8px", borderRadius: "10px", marginRight: "8px" }}>
                    URGENT
                  </span>
                )}
                <strong style={{ fontSize: "16px" }}>{n.title}</strong>
              </div>
              {isAdmin && (
                <button onClick={() => removeNotice(n.id)} style={{ background: "#c2704e", color: "white", border: "none", borderRadius: "4px", padding: "2px 8px" }}>x</button>
              )}
            </div>
            <p style={{ margin: "8px 0 0", color: "#444", fontSize: "14px", whiteSpace: "pre-wrap" }}>{n.message}</p>
          </div>
        ))
      )}
    </div>
  );
}