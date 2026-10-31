import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, addDoc, deleteDoc, doc, onSnapshot, orderBy, query } from "firebase/firestore";
import { Trophy, Plus, X, Trash2 } from "lucide-react";
import { theme, field } from "../theme";
import Header from "./ui/Header";
import HeaderAction from "./ui/HeaderAction";
import Card from "./ui/Card";
import Button from "./ui/Button";
import EmptyState from "./ui/EmptyState";
import ImagePicker from "./ui/ImagePicker";

const CATEGORIES = ["Sports", "Awards", "Quiz Competition", "Debate Competition", "Events"];
const OTHER_VALUE = "__OTHER__";
const COLORS = {
  Sports: "#16a34a",
  Awards: "#d97706",
  "Quiz Competition": "#9333ea",
  "Debate Competition": "#0284c7",
  Events: "#4f46e5"
};

const when = (ts) => {
  const d = ts?.toDate ? ts.toDate() : ts ? new Date(ts) : null;
  return d && !isNaN(d.getTime())
    ? d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : "";
};

export default function Activities({ isAdmin }) {
  const [posts, setPosts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Sports");
  const [manualCategory, setManualCategory] = useState("");
  const [description, setDescription] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const isManual = category === OTHER_VALUE;

  useEffect(() => {
    const q = query(collection(db, "activities"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const addPost = async () => {
    if (!title.trim() || !description.trim()) return alert("Enter a title and description.");
    const finalCategory = isManual ? manualCategory.trim() : category;
    if (!finalCategory) return alert("Enter a category name.");

    setSaving(true);
    try {
      await addDoc(collection(db, "activities"), {
        title: title.trim(),
        category: finalCategory,
        description: description.trim(),
        photoURL,
        createdAt: new Date()
      });
      setTitle("");
      setDescription("");
      setPhotoURL("");
      setManualCategory("");
      setShowForm(false);
    } catch (err) {
      alert("Could not post the update. Please try again.");
    }
    setSaving(false);
  };

  const removePost = async (id) => {
    if (confirm("Remove this post?")) await deleteDoc(doc(db, "activities", id));
  };

  return (
    <div style={{ marginTop: "10px" }}>
      <Header
        title="School Activities"
        subtitle="Sports, awards and events"
        rightSlot={
          isAdmin ? (
            <HeaderAction
              icon={showForm ? <X size={16} /> : <Plus size={16} />}
              label={showForm ? "Close" : "New Post"}
              onClick={() => setShowForm(!showForm)}
            />
          ) : null
        }
      />

      {isAdmin && showForm && (
        <Card style={{ marginTop: "14px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (e.g. Inter-House Sports 2026)" style={field} />

            <select value={category} onChange={(e) => setCategory(e.target.value)} style={field}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              <option value={OTHER_VALUE}>Manual Input</option>
            </select>
            {isManual && (
              <input value={manualCategory} onChange={(e) => setManualCategory(e.target.value)} placeholder="Type category name" style={field} />
            )}

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What happened?"
              rows={3}
              style={{ ...field, resize: "vertical", fontFamily: "Arial" }}
            />

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {photoURL && (
                <img src={photoURL} alt="" style={{ width: "88px", height: "64px", objectFit: "cover", borderRadius: "8px" }} />
              )}
              <ImagePicker
                label={photoURL ? "Change Photo" : "Add Photo (optional)"}
                onUploaded={setPhotoURL}
                onBusyChange={setUploading}
              />
            </div>

            <Button full onClick={addPost} disabled={saving || uploading}>
              {saving ? "Posting..." : "Post Update"}
            </Button>
          </div>
        </Card>
      )}

      {posts.length === 0 ? (
        <EmptyState icon={Trophy} text="No activities posted yet." />
      ) : (
        <div style={{ marginTop: "14px" }}>
          {posts.map((p) => {
            const color = COLORS[p.category] || "#64748b";
            return (
              <Card key={p.id} style={{ padding: 0, overflow: "hidden" }}>
                {p.photoURL && (
                  <img src={p.photoURL} alt="" style={{ width: "100%", maxHeight: "230px", objectFit: "cover", display: "block" }} />
                )}
                <div style={{ padding: "14px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
                    <span
                      style={{
                        background: `${color}22`,
                        color,
                        fontWeight: "700",
                        fontSize: "12px",
                        padding: "4px 10px",
                        borderRadius: "999px"
                      }}
                    >
                      {p.category}
                    </span>
                    <span style={{ fontSize: "12px", color: theme.colors.textMuted }}>{when(p.createdAt)}</span>
                  </div>
                  <div style={{ fontWeight: "800", fontSize: "17px", color: theme.colors.text, margin: "10px 0 4px" }}>{p.title}</div>
                  <p style={{ margin: 0, color: "#374151", fontSize: "14px", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{p.description}</p>
                  {isAdmin && (
                    <div style={{ marginTop: "12px" }}>
                      <Button size="sm" variant="danger" icon={<Trash2 size={14} />} onClick={() => removePost(p.id)}>
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}