import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, orderBy, query } from "firebase/firestore";
import { Plus, X, Pencil, Trash2, Star } from "lucide-react";
import { theme, field } from "../theme";
import Header from "./ui/Header";
import HeaderAction from "./ui/HeaderAction";
import Card from "./ui/Card";
import Button from "./ui/Button";
import Avatar from "./ui/Avatar";
import EmptyState from "./ui/EmptyState";

export default function TestimonialsAdmin() {
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [quote, setQuote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "testimonials"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, []);

  const reset = () => {
    setEditingId(null);
    setName("");
    setRole("");
    setQuote("");
    setShowForm(false);
  };

  const startEdit = (t) => {
    setEditingId(t.id);
    setName(t.name || "");
    setRole(t.role || "");
    setQuote(t.quote || "");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const save = async () => {
    if (!name.trim() || !role.trim() || !quote.trim()) return alert("Fill in the name, role and testimonial.");
    setSaving(true);
    const payload = { name: name.trim(), role: role.trim(), quote: quote.trim() };
    try {
      if (editingId) {
        await updateDoc(doc(db, "testimonials", editingId), payload);
      } else {
        await addDoc(collection(db, "testimonials"), { ...payload, createdAt: new Date() });
      }
      reset();
    } catch (err) {
      alert("Could not save. Please try again.");
    }
    setSaving(false);
  };

  const remove = async (id) => {
    if (confirm("Remove this testimonial?")) await deleteDoc(doc(db, "testimonials", id));
  };

  return (
    <div style={{ marginTop: "10px" }}>
      <Header
        title="Testimonials"
        subtitle={`${items.length} • the 6 newest show on your landing page`}
        rightSlot={
          <HeaderAction
            icon={showForm ? <X size={16} /> : <Plus size={16} />}
            label={showForm ? "Close" : "Add"}
            onClick={() => (showForm ? reset() : setShowForm(true))}
          />
        }
      />

      {showForm && (
        <Card style={{ marginTop: "14px" }}>
          <div style={{ fontWeight: "800", marginBottom: "10px", color: theme.colors.text }}>
            {editingId ? "Edit testimonial" : "New testimonial"}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name (e.g. Mrs. Adaobi Nwankwo)" style={field} />
            <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Role (e.g. Parent, Primary 3)" style={field} />
            <textarea
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              placeholder="What they said..."
              rows={4}
              style={{ ...field, resize: "vertical", fontFamily: "Arial" }}
            />
            <div style={{ display: "flex", gap: "10px" }}>
              <Button full onClick={save} disabled={saving}>
                {saving ? "Saving..." : editingId ? "Update Testimonial" : "Add Testimonial"}
              </Button>
              {editingId && <Button variant="ghost" onClick={reset}>Cancel</Button>}
            </div>
          </div>
        </Card>
      )}

      {items.length === 0 ? (
        <EmptyState icon={Star} text="No testimonials yet. Add one to show it on the landing page." />
      ) : (
        <div style={{ marginTop: "14px" }}>
          {items.map((t) => (
            <Card key={t.id}>
              <div style={{ color: "#d4a017", fontSize: "15px", letterSpacing: "2px" }}>★★★★★</div>
              <p style={{ fontStyle: "italic", color: "#374151", fontSize: "14px", lineHeight: 1.6, margin: "8px 0 12px", whiteSpace: "pre-wrap" }}>
                "{t.quote}"
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Avatar name={t.name} size={44} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: "700", fontSize: "14px", color: theme.colors.text }}>{t.name}</div>
                  <div style={{ fontSize: "12px", color: theme.colors.textMuted }}>{t.role}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                <Button size="sm" variant="outline" icon={<Pencil size={14} />} onClick={() => startEdit(t)}>Edit</Button>
                <Button size="sm" variant="danger" icon={<Trash2 size={14} />} onClick={() => remove(t.id)}>Delete</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}