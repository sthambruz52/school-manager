import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, orderBy, query } from "firebase/firestore";
import { Plus, X, Pencil, Trash2, HelpCircle } from "lucide-react";
import { theme, field } from "../theme";
import Header from "./ui/Header";
import HeaderAction from "./ui/HeaderAction";
import Card from "./ui/Card";
import Button from "./ui/Button";
import EmptyState from "./ui/EmptyState";

export default function FAQAdmin() {
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "faqs"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, []);

  const reset = () => {
    setEditingId(null);
    setQuestion("");
    setAnswer("");
    setShowForm(false);
  };

  const startEdit = (f) => {
    setEditingId(f.id);
    setQuestion(f.question || "");
    setAnswer(f.answer || "");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const save = async () => {
    if (!question.trim() || !answer.trim()) return alert("Fill in both the question and the answer.");
    setSaving(true);
    const payload = { question: question.trim(), answer: answer.trim() };
    try {
      if (editingId) {
        await updateDoc(doc(db, "faqs", editingId), payload);
      } else {
        await addDoc(collection(db, "faqs"), { ...payload, createdAt: new Date() });
      }
      reset();
    } catch (err) {
      alert("Could not save. Please try again.");
    }
    setSaving(false);
  };

  const remove = async (id) => {
    if (confirm("Remove this question?")) await deleteDoc(doc(db, "faqs", id));
  };

  return (
    <div style={{ marginTop: "10px" }}>
      <Header
        title="FAQ"
        subtitle={`${items.length} question${items.length !== 1 ? "s" : ""} on your landing page`}
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
            {editingId ? "Edit question" : "New question"}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Question" style={field} />
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Answer"
              rows={4}
              style={{ ...field, resize: "vertical", fontFamily: "Arial" }}
            />
            <div style={{ display: "flex", gap: "10px" }}>
              <Button full onClick={save} disabled={saving}>
                {saving ? "Saving..." : editingId ? "Update Question" : "Add Question"}
              </Button>
              {editingId && <Button variant="ghost" onClick={reset}>Cancel</Button>}
            </div>
          </div>
        </Card>
      )}

      {items.length === 0 ? (
        <EmptyState icon={HelpCircle} text="No questions yet. Add one to show it on the landing page." />
      ) : (
        <div style={{ marginTop: "14px" }}>
          {items.map((f) => (
            <Card key={f.id}>
              <div style={{ fontWeight: "800", fontSize: "15px", color: theme.colors.text }}>{f.question}</div>
              <p style={{ fontSize: "14px", color: "#374151", lineHeight: 1.6, margin: "6px 0 12px", whiteSpace: "pre-wrap" }}>{f.answer}</p>
              <div style={{ display: "flex", gap: "8px" }}>
                <Button size="sm" variant="outline" icon={<Pencil size={14} />} onClick={() => startEdit(f)}>Edit</Button>
                <Button size="sm" variant="danger" icon={<Trash2 size={14} />} onClick={() => remove(f.id)}>Delete</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}