import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, addDoc, deleteDoc, doc, onSnapshot, orderBy, query } from "firebase/firestore";
import { Megaphone, Plus, X, Trash2 } from "lucide-react";
import { theme, field } from "../theme";
import Header from "./ui/Header";
import HeaderAction from "./ui/HeaderAction";
import Card from "./ui/Card";
import Button from "./ui/Button";
import StatusPill from "./ui/StatusPill";
import EmptyState from "./ui/EmptyState";

const when = (ts) => {
  const d = ts?.toDate ? ts.toDate() : ts ? new Date(ts) : null;
  return d && !isNaN(d.getTime())
    ? d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : "";
};

export default function NoticeBoard({ isAdmin }) {
  const [notices, setNotices] = useState([]);
  const [showForm, setShowForm] = useState(false);
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
    try {
      await addDoc(collection(db, "notices"), {
        title: title.trim(),
        message: message.trim(),
        urgent,
        createdAt: new Date()
      });
      setTitle("");
      setMessage("");
      setUrgent(false);
      setShowForm(false);
    } catch (err) {
      alert("Could not post the notice. Please try again.");
    }
    setSaving(false);
  };

  const removeNotice = async (id) => {
    if (confirm("Remove this notice?")) await deleteDoc(doc(db, "notices", id));
  };

  const ordered = [...notices].sort((a, b) => (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0));

  return (
    <div style={{ marginTop: "10px" }}>
      <Header
        title="Notice Board"
        subtitle="Announcements from the school"
        rightSlot={
          isAdmin ? (
            <HeaderAction
              icon={showForm ? <X size={16} /> : <Plus size={16} />}
              label={showForm ? "Close" : "New Notice"}
              onClick={() => setShowForm(!showForm)}
            />
          ) : null
        }
      />

      {isAdmin && showForm && (
        <Card style={{ marginTop: "14px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Notice title" style={field} />
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write the announcement..."
              rows={4}
              style={{ ...field, resize: "vertical", fontFamily: "Arial" }}
            />
            <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: theme.colors.text }}>
              <input type="checkbox" checked={urgent} onChange={(e) => setUrgent(e.target.checked)} />
              Mark as urgent (shows at the top)
            </label>
            <Button full onClick={addNotice} disabled={saving}>
              {saving ? "Posting..." : "Post Notice"}
            </Button>
          </div>
        </Card>
      )}

      {ordered.length === 0 ? (
        <EmptyState icon={Megaphone} text="No notices posted yet." />
      ) : (
        <div style={{ marginTop: "14px" }}>
          {ordered.map((n) => (
            <Card
              key={n.id}
              style={{ borderLeft: `5px solid ${n.urgent ? theme.colors.danger : theme.colors.primary}` }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    {n.urgent && <StatusPill label="URGENT" variant="danger" />}
                    <span style={{ fontWeight: "800", fontSize: "16px", color: theme.colors.text }}>{n.title}</span>
                  </div>
                  <div style={{ fontSize: "12px", color: theme.colors.textMuted, marginTop: "4px" }}>{when(n.createdAt)}</div>
                </div>
                {isAdmin && (
                  <Button size="sm" variant="danger" icon={<Trash2 size={14} />} onClick={() => removeNotice(n.id)} />
                )}
              </div>
              <p style={{ margin: "10px 0 0", color: "#374151", fontSize: "14px", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                {n.message}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}