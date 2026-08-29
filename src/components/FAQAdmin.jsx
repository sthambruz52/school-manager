import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, addDoc, deleteDoc, doc, onSnapshot, orderBy, query } from "firebase/firestore";

export default function FAQAdmin() {
  const [faqs, setFaqs] = useState([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "faqs"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setFaqs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const addFaq = async () => {
    if (!question.trim() || !answer.trim()) return alert("Fill in both the question and answer.");
    setSaving(true);
    await addDoc(collection(db, "faqs"), {
      question: question.trim(),
      answer: answer.trim(),
      createdAt: new Date()
    });
    setQuestion(""); setAnswer("");
    setSaving(false);
  };

  const removeFaq = async (id) => {
    if (confirm("Remove this question?")) await deleteDoc(doc(db, "faqs", id));
  };

  const inputStyle = { padding: "10px", borderRadius: "6px" };

  return (
    <div style={{ marginTop: "20px" }}>
      <h2 style={{ textAlign: "center" }}>FAQ</h2>
      <p style={{ textAlign: "center", fontSize: "12px", color: "#999" }}>
        These appear on your public landing page.
      </p>

      <div style={{ background: "white", padding: "16px", borderRadius: "10px", marginBottom: "20px", display: "flex", flexDirection: "column", gap: "10px", maxWidth: "500px", margin: "0 auto 20px" }}>
        <input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Question" style={inputStyle} />
        <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Answer" rows={3} style={{ ...inputStyle, resize: "vertical", fontFamily: "Arial" }} />
        <button onClick={addFaq} disabled={saving} style={{ background: "#1f4d3a", color: "white", padding: "10px", borderRadius: "6px", border: "none" }}>
          {saving ? "Adding..." : "Add Question"}
        </button>
      </div>

      {faqs.length === 0 ? (
        <p style={{ textAlign: "center", color: "#666" }}>No FAQ questions added yet.</p>
      ) : (
        faqs.map((f) => (
          <div key={f.id} style={{ background: "white", padding: "14px", margin: "8px 0", borderRadius: "10px", maxWidth: "500px", marginLeft: "auto", marginRight: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <strong style={{ fontSize: "14px" }}>{f.question}</strong>
              <button onClick={() => removeFaq(f.id)} style={{ background: "#c2704e", color: "white", border: "none", borderRadius: "4px", padding: "2px 8px" }}>x</button>
            </div>
            <p style={{ fontSize: "13px", color: "#666", margin: "6px 0 0" }}>{f.answer}</p>
          </div>
        ))
      )}
    </div>
  );
}