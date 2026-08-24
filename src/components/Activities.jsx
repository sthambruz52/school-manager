import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, addDoc, deleteDoc, doc, onSnapshot, orderBy, query } from "firebase/firestore";

const CLOUDINARY_CLOUD_NAME = "tatfep5k";
const CLOUDINARY_UPLOAD_PRESET = "School Photos";

const CATEGORIES = ["Sports", "Awards", "Quiz Competition", "Debate Competition", "Events"];
const OTHER_VALUE = "__OTHER__";

export default function Activities({ isAdmin }) {
  const [posts, setPosts] = useState([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Sports");
  const [manualCategory, setManualCategory] = useState("");
  const [description, setDescription] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const isManualCategory = category === OTHER_VALUE;

  useEffect(() => {
    const q = query(collection(db, "activities"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData }
      );
      const data = await res.json();

      if (data.secure_url) {
        setPhotoURL(data.secure_url);
      } else {
        alert("Upload failed. Please try again.");
      }
    } catch (err) {
      alert("Upload failed. Check your internet connection.");
    }
    setUploading(false);
  };

  const addPost = async () => {
    if (!title.trim() || !description.trim()) return alert("Enter a title and description.");

    const finalCategory = isManualCategory ? manualCategory.trim() : category;
    if (!finalCategory) return alert("Enter a category name.");

    setSaving(true);
    await addDoc(collection(db, "activities"), {
      title: title.trim(),
      category: finalCategory,
      description: description.trim(),
      photoURL,
      createdAt: new Date()
    });
    setTitle(""); setDescription(""); setPhotoURL(""); setManualCategory("");
    setSaving(false);
  };

  const removePost = async (id) => {
    if (confirm("Remove this post?")) await deleteDoc(doc(db, "activities", id));
  };

  const categoryColor = (c) => {
    if (c === "Sports") return "#1f4d3a";
    if (c === "Awards") return "#c2704e";
    if (c === "Quiz Competition") return "#8e44ad";
    if (c === "Debate Competition") return "#d4a017";
    if (c === "Events") return "#3a6ea5";
    return "#666";
  };

  const inputStyle = { padding: "8px", borderRadius: "6px" };

  return (
    <div style={{ marginTop: "20px" }}>
      <h2 style={{ textAlign: "center" }}>School Activities</h2>

      {isAdmin && (
        <div style={{ background: "white", padding: "16px", borderRadius: "10px", marginBottom: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (e.g. Inter-House Sports 2026)" style={inputStyle} />

          <select value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            <option value={OTHER_VALUE}>Manual Input</option>
          </select>

          {isManualCategory && (
            <input
              value={manualCategory}
              onChange={(e) => setManualCategory(e.target.value)}
              placeholder="Type category name"
              style={inputStyle}
            />
          )}

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What happened?"
            rows={3}
            style={{ ...inputStyle, resize: "vertical", fontFamily: "Arial" }}
          />

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {photoURL && <img src={photoURL} alt="" style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "6px" }} />}
            <label style={{ background: "#1f4d3a", color: "white", padding: "6px 14px", borderRadius: "6px", cursor: "pointer", fontSize: "13px" }}>
              {uploading ? "Uploading..." : photoURL ? "Change Photo" : "Add Photo (optional)"}
              <input type="file" accept="image/*" onChange={handlePhotoChange} disabled={uploading} style={{ display: "none" }} />
            </label>
          </div>

          <button onClick={addPost} disabled={saving || uploading} style={{ background: "#1f4d3a", color: "white", padding: "8px 20px", borderRadius: "6px", border: "none" }}>
            {saving ? "Posting..." : "Post Update"}
          </button>
        </div>
      )}

      {posts.length === 0 ? (
        <p style={{ textAlign: "center", color: "#666" }}>No activities posted yet.</p>
      ) : (
        posts.map((p) => (
          <div key={p.id} style={{ background: "white", borderRadius: "10px", margin: "10px 0", overflow: "hidden" }}>
            {p.photoURL && <img src={p.photoURL} alt="" style={{ width: "100%", maxHeight: "220px", objectFit: "cover", display: "block" }} />}
            <div style={{ padding: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ background: categoryColor(p.category), color: "white", padding: "2px 10px", borderRadius: "10px", fontSize: "12px", fontWeight: "bold" }}>
                  {p.category}
                </span>
                {isAdmin && (
                  <button onClick={() => removePost(p.id)} style={{ background: "#c2704e", color: "white", border: "none", borderRadius: "4px", padding: "2px 8px" }}>x</button>
                )}
              </div>
              <h3 style={{ margin: "8px 0 4px" }}>{p.title}</h3>
              <p style={{ margin: 0, color: "#444", fontSize: "14px" }}>{p.description}</p>
            </div>
          </div>
        ))
      )}
    </div>
  );
}