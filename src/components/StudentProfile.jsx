import { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { doc, setDoc, collection, onSnapshot } from "firebase/firestore";

const CLASS_LEVELS = [
  "Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6",
  "JSS1", "JSS2", "JSS3",
  "SS1", "SS2", "SS3"
];

const TERMS = ["First Term", "Second Term", "Third Term"];
const OTHER_VALUE = "__OTHER__";
const CLOUDINARY_CLOUD_NAME = "tatfep5k";
const CLOUDINARY_UPLOAD_PRESET = "School Photos";

export default function StudentProfile({ onComplete, existingData, targetUid }) {
  const [subjects, setSubjects] = useState([]);
  const [fullName, setFullName] = useState(existingData?.fullName || "");
  const [classLevel, setClassLevel] = useState(existingData?.classLevel || "");
    const [manualClass, setManualClass] = useState("");
  const [session, setSession] = useState(existingData?.session || "");
  const [term, setTerm] = useState(existingData?.term || "");

  const [selectedSubjects, setSelectedSubjects] = useState(existingData?.subjects || []);
  const [customSubject, setCustomSubject] = useState("");

  const [street, setStreet] = useState(existingData?.address?.street || "");
  const [lga, setLga] = useState(existingData?.address?.lga || "");
  const [city, setCity] = useState(existingData?.address?.city || "");
  const [stateVal, setStateVal] = useState(existingData?.address?.state || "");
  const [country, setCountry] = useState(existingData?.address?.country || "Nigeria");

  const [parentName, setParentName] = useState(existingData?.parentName || "");
  const [parentEmail, setParentEmail] = useState(existingData?.parentEmail || "");
  const [parentPhone, setParentPhone] = useState(existingData?.parentPhone || "");
  const [parentStreet, setParentStreet] = useState(existingData?.parentAddress?.street || "");
  const [parentLga, setParentLga] = useState(existingData?.parentAddress?.lga || "");
  const [parentCity, setParentCity] = useState(existingData?.parentAddress?.city || "");
  const [parentState, setParentState] = useState(existingData?.parentAddress?.state || "");
  const [parentCountry, setParentCountry] = useState(existingData?.parentAddress?.country || "Nigeria");

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

    if (!fullName || !classLevel || !parentName || !parentPhone) {
      alert("Please fill in all required fields.");
      return;
    }

    if (!/^\d{10,15}$/.test(parentPhone.replace(/\s/g, ""))) {
      alert("Please enter a valid phone number (10-15 digits, no letters or symbols).");
      return;
    }

        setSaving(true);
    await setDoc(doc(db, "users", targetUid || auth.currentUser.uid), {
      fullName,
            classLevel: classLevel === OTHER_VALUE ? manualClass.trim() : classLevel,
      session,
      term,
      subjects: selectedSubjects,
      photoURL,
      address: { street, lga, city, state: stateVal, country },
      parentName,
      parentEmail,
      parentPhone,
      parentAddress: { street: parentStreet, lga: parentLga, city: parentCity, state: parentState, country: parentCountry },
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

                <div style={rowStyle}>
          <select value={classLevel === OTHER_VALUE || !CLASS_LEVELS.includes(classLevel) && classLevel ? OTHER_VALUE : classLevel} onChange={(e) => { if (e.target.value === OTHER_VALUE) { setClassLevel(OTHER_VALUE); } else { setClassLevel(e.target.value); } }} required style={{ ...inputStyle, flex: 1 }}>
            <option value="">Select class/grade</option>
            {CLASS_LEVELS.map((c) => <option key={c} value={c}>{c}</option>)}
            <option value={OTHER_VALUE}>Other (type manually)</option>
          </select>
          <select value={term} onChange={(e) => setTerm(e.target.value)} style={{ ...inputStyle, flex: 1 }}>
            <option value="">Select term</option>
            {TERMS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {classLevel === OTHER_VALUE && (
          <input
            value={manualClass}
            onChange={(e) => setManualClass(e.target.value)}
            placeholder="Type class name"
            style={inputStyle}
          />
        )}

        <input
          value={session}
          onChange={(e) => setSession(e.target.value)}
          placeholder="Session/Year (e.g. 2025/2026)"
          style={inputStyle}
        />

        <p style={sectionLabel}>Subjects</p>
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

        <p style={sectionLabel}>Your Address</p>
        <input value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Street" style={inputStyle} />
        <div style={rowStyle}>
          <input value={lga} onChange={(e) => setLga(e.target.value)} placeholder="LGA" style={{ ...inputStyle, flex: 1 }} />
          <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" style={{ ...inputStyle, flex: 1 }} />
        </div>
        <div style={rowStyle}>
          <input value={stateVal} onChange={(e) => setStateVal(e.target.value)} placeholder="State" style={{ ...inputStyle, flex: 1 }} />
          <input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Country" style={{ ...inputStyle, flex: 1 }} />
        </div>

        <p style={sectionLabel}>Parent/Guardian Info</p>
        <input value={parentName} onChange={(e) => setParentName(e.target.value)} placeholder="Parent's full name" required style={inputStyle} />
        <input type="email" value={parentEmail} onChange={(e) => setParentEmail(e.target.value)} placeholder="Parent's email" style={inputStyle} />
        <input type="tel" value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} placeholder="Parent's phone number" required style={inputStyle} />

        <p style={sectionLabel}>Parent's Address</p>
        <input value={parentStreet} onChange={(e) => setParentStreet(e.target.value)} placeholder="Street" style={inputStyle} />
        <div style={rowStyle}>
          <input value={parentLga} onChange={(e) => setParentLga(e.target.value)} placeholder="LGA" style={{ ...inputStyle, flex: 1 }} />
          <input value={parentCity} onChange={(e) => setParentCity(e.target.value)} placeholder="City" style={{ ...inputStyle, flex: 1 }} />
        </div>
        <div style={rowStyle}>
          <input value={parentState} onChange={(e) => setParentState(e.target.value)} placeholder="State" style={{ ...inputStyle, flex: 1 }} />
          <input value={parentCountry} onChange={(e) => setParentCountry(e.target.value)} placeholder="Country" style={{ ...inputStyle, flex: 1 }} />
        </div>

        <button type="submit" disabled={saving || uploadingPhoto} style={{ background: "#1f4d3a", color: "white", padding: "10px", borderRadius: "6px", marginTop: "8px" }}>
          {saving ? "Saving..." : isEditMode ? "Update Profile" : "Save Profile"}
        </button>
      </form>
    </div>
  );
}