import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, orderBy, query } from "firebase/firestore";

const CLOUDINARY_CLOUD_NAME = "tatfep5k";
const CLOUDINARY_UPLOAD_PRESET = "School Photos";

export default function StaffDirectory({ isAdmin }) {
  const [staff, setStaff] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "staff"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setStaff(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingPhoto(true);
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
        alert("Photo upload failed. Please try again.");
      }
    } catch (err) {
      alert("Photo upload failed. Check your internet connection.");
    }
    setUploadingPhoto(false);
  };

  const resetForm = () => {
    setEditingId(null);
    setName(""); setTitle(""); setDepartment(""); setPhone(""); setEmail(""); setPhotoURL("");
  };

  const startEdit = (s) => {
    setEditingId(s.id);
    setName(s.name || "");
    setTitle(s.title || "");
    setDepartment(s.department || "");
    setPhone(s.phone || "");
    setEmail(s.email || "");
    setPhotoURL(s.photoURL || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const saveStaff = async () => {
    if (!name || !title) return alert("Enter at least a name and title/position.");

    setSaving(true);

    if (editingId) {
      await updateDoc(doc(db, "staff", editingId), {
        name, title, department, phone, email, photoURL
      });
    } else {
      await addDoc(collection(db, "staff"), {
        name, title, department, phone, email, photoURL,
        createdAt: new Date()
      });
    }

    resetForm();
    setSaving(false);
  };

  const removeStaff = async (id) => {
    if (confirm("Remove this staff member?")) await deleteDoc(doc(db, "staff", id));
  };

  const inputStyle = { padding: "8px", borderRadius: "6px" };

  return (
    <div style={{ marginTop: "20px" }}>
      <h2 style={{ textAlign: "center" }}>Staff & Management</h2>

      {isAdmin && (
        <div style={{ background: "white", padding: "16px", borderRadius: "10px", marginBottom: "20px" }}>
          {editingId && (
            <p style={{ textAlign: "center", color: "#1f4d3a", fontWeight: "bold", marginTop: 0 }}>
              Editing {name || "staff member"}
            </p>
          )}

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
            {photoURL ? (
              <img src={photoURL} alt="" style={{ width: "70px", height: "70px", borderRadius: "50%", objectFit: "cover" }} />
            ) : (
              <div style={{ width: "70px", height: "70px", borderRadius: "50%", background: "#fdf6e9", border: "2px dashed #ccc" }} />
            )}
            <label style={{ background: "#1f4d3a", color: "white", padding: "6px 14px", borderRadius: "6px", cursor: "pointer", fontSize: "13px" }}>
              {uploadingPhoto ? "Uploading..." : "Upload Photo"}
              <input type="file" accept="image/*" onChange={handlePhotoChange} disabled={uploadingPhoto} style={{ display: "none" }} />
            </label>
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center" }}>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" style={inputStyle} />
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (e.g. Principal, Bursar)" style={inputStyle} />
            <input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Department (optional)" style={inputStyle} />
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" style={inputStyle} />
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" style={inputStyle} />
          </div>
          <div style={{ textAlign: "center", marginTop: "10px", display: "flex", gap: "8px", justifyContent: "center" }}>
            <button onClick={saveStaff} disabled={saving || uploadingPhoto} style={{ background: "#1f4d3a", color: "white", padding: "8px 20px", borderRadius: "6px", border: "none" }}>
              {saving ? "Saving..." : editingId ? "Update Staff Member" : "Add Staff Member"}
            </button>
            {editingId && (
              <button onClick={resetForm} style={{ background: "white", color: "#1f4d3a", border: "1px solid #1f4d3a", padding: "8px 20px", borderRadius: "6px" }}>
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      {staff.length === 0 ? (
        <p style={{ textAlign: "center", color: "#666" }}>No staff added yet.</p>
      ) : (
        staff.map((s) => (
          <div key={s.id} style={{ background: "white", padding: "14px", margin: "8px 0", borderRadius: "10px", display: "flex", alignItems: "center", gap: "14px" }}>
            {s.photoURL ? (
              <img src={s.photoURL} alt="" style={{ width: "56px", height: "56px", borderRadius: "50%", objectFit: "cover" }} />
            ) : (
              <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "#fdf6e9", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", color: "#1f4d3a" }}>
                {s.name?.charAt(0).toUpperCase()}
              </div>
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: "bold" }}>{s.name}</div>
              <div style={{ color: "#1f4d3a" }}>{s.title}{s.department && ` — ${s.department}`}</div>
              {(s.phone || s.email) && (
                <div style={{ fontSize: "13px", color: "#666" }}>{s.phone} {s.phone && s.email && "·"} {s.email}</div>
              )}
            </div>
            {isAdmin && (
              <div style={{ display: "flex", gap: "6px" }}>
                <button onClick={() => startEdit(s)} style={{ background: "#1f4d3a", color: "white", border: "none", borderRadius: "4px", padding: "4px 10px" }}>Edit</button>
                <button onClick={() => removeStaff(s.id)} style={{ background: "#c2704e", color: "white", border: "none", borderRadius: "4px", padding: "4px 10px" }}>x</button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}