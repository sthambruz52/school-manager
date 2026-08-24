import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, addDoc, deleteDoc, doc, onSnapshot, orderBy, query } from "firebase/firestore";

const CLOUDINARY_CLOUD_NAME = "tatfep5k";
const CLOUDINARY_UPLOAD_PRESET = "School Photos";

export default function Gallery({ isAdmin }) {
  const [photos, setPhotos] = useState([]);
  const [caption, setCaption] = useState("");
  const [pendingURL, setPendingURL] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  useEffect(() => {
    const q = query(collection(db, "gallery"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setPhotos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const handleFileChange = async (e) => {
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
        setPendingURL(data.secure_url);
      } else {
        alert("Upload failed. Please try again.");
      }
    } catch (err) {
      alert("Upload failed. Check your internet connection.");
    }
    setUploading(false);
  };

  const addPhoto = async () => {
    if (!pendingURL) return alert("Choose a photo to upload first.");

    setSaving(true);
    await addDoc(collection(db, "gallery"), {
      imageURL: pendingURL,
      caption: caption.trim(),
      createdAt: new Date()
    });
    setCaption("");
    setPendingURL("");
    setSaving(false);
  };

  const removePhoto = async (id) => {
    if (confirm("Remove this photo?")) await deleteDoc(doc(db, "gallery", id));
  };

  return (
    <div style={{ marginTop: "20px" }}>
      <h2 style={{ textAlign: "center" }}>Gallery</h2>

      {isAdmin && (
        <div style={{ background: "white", padding: "16px", borderRadius: "10px", marginBottom: "20px", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
          {pendingURL && (
            <img src={pendingURL} alt="" style={{ width: "140px", height: "140px", objectFit: "cover", borderRadius: "8px" }} />
          )}
          <label style={{ background: "#1f4d3a", color: "white", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontSize: "14px" }}>
            {uploading ? "Uploading..." : pendingURL ? "Choose Different Photo" : "Choose Photo"}
            <input type="file" accept="image/*" onChange={handleFileChange} disabled={uploading} style={{ display: "none" }} />
          </label>
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Caption (e.g. Sports Day 2026)"
            style={{ padding: "8px", borderRadius: "6px", width: "260px", maxWidth: "100%" }}
          />
          <button onClick={addPhoto} disabled={saving || uploading || !pendingURL} style={{ background: "#1f4d3a", color: "white", padding: "8px 20px", borderRadius: "6px", border: "none" }}>
            {saving ? "Saving..." : "Add to Gallery"}
          </button>
        </div>
      )}

      {photos.length === 0 ? (
        <p style={{ textAlign: "center", color: "#666" }}>No photos yet.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "10px" }}>
          {photos.map((p) => (
            <div key={p.id} style={{ position: "relative", borderRadius: "8px", overflow: "hidden", background: "white" }}>
              <img
                src={p.imageURL}
                alt={p.caption || ""}
                onClick={() => setSelectedPhoto(p)}
                style={{ width: "100%", height: "140px", objectFit: "cover", cursor: "pointer", display: "block" }}
              />
              {p.caption && (
                <div style={{ padding: "6px 8px", fontSize: "12px", color: "#333" }}>{p.caption}</div>
              )}
              {isAdmin && (
                <button
                  onClick={() => removePhoto(p.id)}
                  style={{ position: "absolute", top: "6px", right: "6px", background: "#c2704e", color: "white", border: "none", borderRadius: "4px", padding: "2px 8px" }}
                >
                  x
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "20px" }}
        >
          <img src={selectedPhoto.imageURL} alt="" style={{ maxWidth: "90%", maxHeight: "80vh", borderRadius: "8px" }} />
          {selectedPhoto.caption && (
            <p style={{ color: "white", marginTop: "10px", fontSize: "15px" }}>{selectedPhoto.caption}</p>
          )}
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px" }}>Tap anywhere to close</p>
        </div>
      )}
    </div>
  );
}