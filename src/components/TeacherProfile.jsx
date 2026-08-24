import { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { doc, setDoc, collection, onSnapshot } from "firebase/firestore";

const CLOUDINARY_CLOUD_NAME = "tatfep5k";
const CLOUDINARY_UPLOAD_PRESET = "School Photos";

export default function TeacherProfile({ onComplete, existingData }) {
  const [subjects, setSubjects] = useState([]);
  const [fullName, setFullName] = useState(existingData?.fullName || "");
  const [phone, setPhone] = useState(existingData?.phone || "");

  const [selectedSubjects, setSelectedSubjects] = useState(existingData?.subjects || []);
  const [customSubject, setCustomSubject] = useState("");

  const [street, setStreet] = useState(existingData?.address?.street || "");
  const [lga, setLga] = useState(existingData?.address?.lga || "");
  const [city, setCity] = useState(existingData?.address?.city || "");
  const [stateVal, setStateVal] = useState(existingData?.address?.state || "");
  const [country, setCountry] = useState(existingData?.address?.country || "Nigeria");

  const [photoURL, setPhotoURL] = useState(existingData?.photoURL || "");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);

  const isEditMode = !!existingData;

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "subjects"), (snap) => {
      setSubjects(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const toggleSubject = (name) => {
    setSelectedSubjects((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]
    );
  };

  const addCustomSubject = () => {
    const trimmed = customSubject.trim();
    if (!trimmed) return;
    if (!selectedSubjects.includes(trimmed)) {
      setSelectedSubjects((prev) => [...prev, trimmed]);
    }
    setCustomSubject("");
  };

  const removeSubject = (name) => {
    setSelectedSubjects((prev) => prev.filter((s) => s !== name));
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!fullName || !phone) {
      alert("Please fill in all required fields.");
      return;
    }

    setSaving(true);
    await setDoc(doc(db, "users", auth.currentUser.uid), {
      fullName,
      phone,
      subjects: selectedSubjects,
      photoURL,
      address: { street, lga, city, state: stateVal, country },
      profileComplete: true
    }, { merge: true });

    setSaving(false);
    if (onComplete) onComplete();
  };

  const inputStyle = { padding: "10px", borderRadius: "6px" };
  const rowStyle = { display: "flex", gap: "8px", flexWrap: "wrap" };
  const sectionLabel = { margin: "8px 0 0", fontWeight: "bold", color: "#1f4d3a" };

  return (
    <div style={{ maxWidth: "480px", margin: "40px auto", padding: "24px", background: "white", borderRadius: "10px" }}>
      <h2 style={{ textAlign: "center" }}>{isEditMode ? "Edit Your Profile" : "Complete Your Profile"}</h2>

      {isEditMode && (
        <p onClick={onComplete} style={{ textAlign: "center", color: "#1f4d3a", cursor: "pointer", marginTop: "-8px" }}>
          ← Back to Dashboard
        </p>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
          {photoURL ? (
            <img src={photoURL} alt="Passport" style={{ width: "110px", height: "130px", objectFit: "cover", borderRadius: "6px", border: "2px solid #1f4d3a" }} />
          ) : (
            <div style={{ width: "110px", height: "130px", background: "#fdf6e9", borderRadius: "6px", border: "2px dashed #ccc", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", color: "#999", textAlign: "center" }}>
              No photo yet
            </div>
          )}
          <label style={{ background: "#1f4d3a", color: "white", padding: "6px 14px", borderRadius: "6px", cursor: "pointer", fontSize: "14px" }}>
            {uploadingPhoto ? "Uploading..." : "Upload Passport Photo"}
            <input type="file" accept="image/*" onChange={handlePhotoChange} disabled={uploadingPhoto} style={{ display: "none" }} />
          </label>
        </div>

        <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" required style={inputStyle} />
        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" required style={inputStyle} />

        <p style={sectionLabel}>Subjects You Teach</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px", maxHeight: "160px", overflowY: "auto", border: "1px solid #eee", borderRadius: "6px", padding: "8px" }}>
          {subjects.map((s) => (
            <label key={s.id} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input
                type="checkbox"
                checked={selectedSubjects.includes(s.name)}
                onChange={() => toggleSubject(s.name)}
              />
              {s.name} {s.code && `(${s.code})`}
            </label>
          ))}
        </div>

        <div style={rowStyle}>
          <input
            value={customSubject}
            onChange={(e) => setCustomSubject(e.target.value)}
            placeholder="Subject not listed?"
            style={{ ...inputStyle, flex: 1 }}
          />
          <button type="button" onClick={addCustomSubject} style={{ background: "#1f4d3a", color: "white", padding: "8px 14px", borderRadius: "6px" }}>
            Add
          </button>
        </div>

        {selectedSubjects.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {selectedSubjects.map((s) => (
              <span key={s} style={{ background: "#fdf6e9", padding: "4px 8px", borderRadius: "12px", fontSize: "13px" }}>
                {s} <span onClick={() => removeSubject(s)} style={{ cursor: "pointer", color: "#c2704e", marginLeft: "4px" }}>×</span>
              </span>
            ))}
          </div>
        )}

        <p style={sectionLabel}>Address</p>
        <input value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Street" style={inputStyle} />
        <div style={rowStyle}>
          <input value={lga} onChange={(e) => setLga(e.target.value)} placeholder="LGA" style={{ ...inputStyle, flex: 1 }} />
          <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" style={{ ...inputStyle, flex: 1 }} />
        </div>
        <div style={rowStyle}>
          <input value={stateVal} onChange={(e) => setStateVal(e.target.value)} placeholder="State" style={{ ...inputStyle, flex: 1 }} />
          <input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Country" style={{ ...inputStyle, flex: 1 }} />
        </div>

        <button type="submit" disabled={saving || uploadingPhoto} style={{ background: "#1f4d3a", color: "white", padding: "10px", borderRadius: "6px", marginTop: "8px" }}>
          {saving ? "Saving..." : isEditMode ? "Update Profile" : "Save Profile"}
        </button>
      </form>
    </div>
  );
}