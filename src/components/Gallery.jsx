import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, addDoc, deleteDoc, doc, onSnapshot, orderBy, query } from "firebase/firestore";
import { Image as ImageIcon, Plus, X, Trash2 } from "lucide-react";
import { theme, field } from "../theme";
import Header from "./ui/Header";
import HeaderAction from "./ui/HeaderAction";
import Card from "./ui/Card";
import Button from "./ui/Button";
import EmptyState from "./ui/EmptyState";
import ImagePicker from "./ui/ImagePicker";

export default function Gallery({ isAdmin }) {
  const [photos, setPhotos] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [caption, setCaption] = useState("");
  const [pendingURL, setPendingURL] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const q = query(collection(db, "gallery"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setPhotos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const addPhoto = async () => {
    if (!pendingURL) return alert("Choose a photo first.");
    setSaving(true);
    try {
      await addDoc(collection(db, "gallery"), {
        imageURL: pendingURL,
        caption: caption.trim(),
        createdAt: new Date()
      });
      setCaption("");
      setPendingURL("");
      setShowForm(false);
    } catch (err) {
      alert("Could not save the photo. Please try again.");
    }
    setSaving(false);
  };

  const removePhoto = async (id) => {
    if (confirm("Remove this photo?")) await deleteDoc(doc(db, "gallery", id));
  };

  return (
    <div style={{ marginTop: "10px" }}>
      <Header
        title="Gallery"
        subtitle={`${photos.length} photo${photos.length !== 1 ? "s" : ""}`}
        rightSlot={
          isAdmin ? (
            <HeaderAction
              icon={showForm ? <X size={16} /> : <Plus size={16} />}
              label={showForm ? "Close" : "Add Photo"}
              onClick={() => setShowForm(!showForm)}
            />
          ) : null
        }
      />

      {isAdmin && showForm && (
        <Card style={{ marginTop: "14px" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
            {pendingURL && (
              <img src={pendingURL} alt="" style={{ width: "140px", height: "140px", objectFit: "cover", borderRadius: "10px" }} />
            )}
            <ImagePicker
              label={pendingURL ? "Choose Different Photo" : "Choose Photo"}
              onUploaded={setPendingURL}
              onBusyChange={setUploading}
            />
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Caption (e.g. Sports Day 2026)"
              style={{ ...field, width: "100%" }}
            />
            <Button full onClick={addPhoto} disabled={saving || uploading || !pendingURL}>
              {saving ? "Saving..." : "Add to Gallery"}
            </Button>
          </div>
        </Card>
      )}

      {photos.length === 0 ? (
        <EmptyState icon={ImageIcon} text="No photos yet." />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
            gap: "10px",
            marginTop: "14px"
          }}
        >
          {photos.map((p) => (
            <div
              key={p.id}
              className="app-card"
              onClick={() => setSelected(p)}
              style={{
                position: "relative",
                borderRadius: theme.radius.md,
                overflow: "hidden",
                background: "white",
                boxShadow: theme.shadow,
                cursor: "pointer"
              }}
            >
              <img src={p.imageURL} alt={p.caption || ""} style={{ width: "100%", height: "130px", objectFit: "cover", display: "block" }} />
              {p.caption && (
                <div style={{ padding: "8px 10px", fontSize: "12px", color: theme.colors.text }}>{p.caption}</div>
              )}
              {isAdmin && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removePhoto(p.id);
                  }}
                  style={{
                    position: "absolute",
                    top: "6px",
                    right: "6px",
                    width: "30px",
                    height: "30px",
                    padding: 0,
                    background: "rgba(255,255,255,0.92)",
                    color: theme.colors.danger,
                    border: "none",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div
          onClick={() => setSelected(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 12, 41, 0.88)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 200,
            padding: "20px"
          }}
        >
          <img src={selected.imageURL} alt="" style={{ maxWidth: "94%", maxHeight: "78vh", borderRadius: "12px" }} />
          {selected.caption && <p style={{ color: "white", marginTop: "12px", fontSize: "15px", textAlign: "center" }}>{selected.caption}</p>}
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px" }}>Tap anywhere to close</p>
        </div>
      )}
    </div>
  );
}