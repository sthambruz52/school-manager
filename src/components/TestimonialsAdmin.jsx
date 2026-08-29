import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, addDoc, deleteDoc, doc, onSnapshot, orderBy, query } from "firebase/firestore";

export default function TestimonialsAdmin() {
  const [testimonials, setTestimonials] = useState([]);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [quote, setQuote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "testimonials"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setTestimonials(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const addTestimonial = async () => {
    if (!name.trim() || !role.trim() || !quote.trim()) return alert("Fill in all fields.");
    setSaving(true);
    await addDoc(collection(db, "testimonials"), {
      name: name.trim(),
      role: role.trim(),
      quote: quote.trim(),
      createdAt: new Date()
    });
    setName(""); setRole(""); setQuote("");
    setSaving(false);
  };

  const removeTestimonial = async (id) => {
    if (confirm("Remove this testimonial?")) await deleteDoc(doc(db, "testimonials", id));
  };

  const inputStyle = { padding: "10px", borderRadius: "6px" };

  return (
    <div style={{ marginTop: "20px" }}>
      <h2 style={{ textAlign: "center" }}>Testimonials</h2>
      <p style={{ textAlign: "center", fontSize: "12px", color: "#999" }}>
        These appear on your public landing page.
      </p>

      <div style={{ background: "white", padding: "16px", borderRadius: "10px", marginBottom: "20px", display: "flex", flexDirection: "column", gap: "10px", maxWidth: "500px", margin: "0 auto 20px" }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name (e.g. Mrs. Adaobi Nwankwo)" style={inputStyle} />
        <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Role (e.g. Parent, Primary 3)" style={inputStyle} />
        <textarea value={quote} onChange={(e) => setQuote(e.target.value)} placeholder="Their testimonial..." rows={3} style={{ ...inputStyle, resize: "vertical", fontFamily: "Arial" }} />
        <button onClick={addTestimonial} disabled={saving} style={{ background: "#1f4d3a", color: "white", padding: "10px", borderRadius: "6px", border: "none" }}>
          {saving ? "Adding..." : "Add Testimonial"}
        </button>
      </div>

      {testimonials.length === 0 ? (
        <p style={{ textAlign: "center", color: "#666" }}>No testimonials added yet.</p>
      ) : (
        testimonials.map((t) => (
          <div key={t.id} style={{ background: "white", padding: "14px", margin: "8px 0", borderRadius: "10px", maxWidth: "500px", marginLeft: "auto", marginRight: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <strong>{t.name}</strong>
              <button onClick={() => removeTestimonial(t.id)} style={{ background: "#c2704e", color: "white", border: "none", borderRadius: "4px", padding: "2px 8px" }}>x</button>
            </div>
            <div style={{ fontSize: "12px", color: "#888" }}>{t.role}</div>
            <p style={{ fontSize: "13px", color: "#444", margin: "6px 0 0", fontStyle: "italic" }}>"{t.quote}"</p>
          </div>
        ))
      )}
    </div>
  );
}