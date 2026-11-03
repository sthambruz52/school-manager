import { useState } from "react";
import { db, auth } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { theme, field } from "../theme";
import Header from "./ui/Header";
import Button from "./ui/Button";
import PhotoField from "./ui/PhotoField";
import AddressFields from "./ui/AddressFields";
import SubjectPicker from "./ui/SubjectPicker";
import SelectWithManual from "./ui/SelectWithManual";
import FormSection from "./ui/FormSection";
import Labeled from "./ui/Labeled";

const CLASS_LEVELS = [
  "Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6",
  "JSS1", "JSS2", "JSS3",
  "SS1", "SS2", "SS3"
];
const TERMS = ["First Term", "Second Term", "Third Term"];
const PHONE_OK = /^\+?\d{10,15}$/;
const BLANK_ADDRESS = { street: "", lga: "", city: "", state: "", country: "Nigeria" };

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const full = { ...field, width: "100%" };
const fullSelect = { flex: "none", width: "100%" };

export default function StudentProfile({ onComplete, existingData, targetUid }) {
  const d = existingData || {};
  const isEditMode = !!existingData;

  const [fullName, setFullName] = useState(d.fullName || "");
  const [classLevel, setClassLevel] = useState(d.classLevel || "");
  const [term, setTerm] = useState(d.term || "");
  const [session, setSession] = useState(d.session || "");
  const [dateOfBirth, setDateOfBirth] = useState(d.dateOfBirth || "");
  const [sex, setSex] = useState(d.sex || "");
  const [subjects, setSubjects] = useState(d.subjects || []);
  const [address, setAddress] = useState({ ...BLANK_ADDRESS, ...(d.address || {}) });
  const [parentName, setParentName] = useState(d.parentName || "");
  const [parentPhone, setParentPhone] = useState(d.parentPhone || "");
  const [parentEmail, setParentEmail] = useState(d.parentEmail || "");
  const [parentAddress, setParentAddress] = useState({ ...BLANK_ADDRESS, ...(d.parentAddress || {}) });
  const [photoURL, setPhotoURL] = useState(d.photoURL || "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();

    if (!fullName.trim() || !classLevel.trim() || !dateOfBirth || !sex || !parentName.trim() || !parentPhone.trim()) {
      return alert("Please fill in all the required fields (marked with *).");
    }
    if (!PHONE_OK.test(parentPhone.replace(/\s/g, ""))) {
      return alert("Please enter a valid parent phone number (10-15 digits).");
    }

    setSaving(true);
    let ok = false;
    try {
      const uid = targetUid || auth.currentUser.uid;
      const extra = isEditMode
        ? {}
        : { regNumber: "REG-" + new Date().getFullYear() + "-" + uid.slice(0, 6).toUpperCase() };

      await setDoc(
        doc(db, "users", uid),
        {
          ...extra,
          fullName: fullName.trim(),
          classLevel: classLevel.trim(),
          session: session.trim(),
          term,
          dateOfBirth,
          sex,
          subjects,
          photoURL,
          address,
          parentName: parentName.trim(),
          parentEmail: parentEmail.trim(),
          parentPhone: parentPhone.trim(),
          parentAddress,
          profileComplete: true
        },
        { merge: true }
      );
      ok = true;
    } catch (err) {
      alert("Could not save the profile. Check your connection and try again.");
    }
    setSaving(false);
    if (ok && onComplete) onComplete();
  };

  return (
    <div style={{ background: theme.colors.bg, minHeight: "100vh" }}>
      <div style={{ maxWidth: "700px", margin: "0 auto", padding: "0 16px 40px" }}>
        <Header
          title={isEditMode ? "Edit Profile" : "Complete Your Profile"}
          subtitle={isEditMode ? "Update the student's details" : "A few details to set up the student account"}
          onBack={isEditMode ? onComplete : undefined}
        />

        <form onSubmit={submit}>
          <FormSection title="Passport photo">
            <PhotoField name={fullName} photoURL={photoURL} onChange={setPhotoURL} onBusyChange={setUploading} />
          </FormSection>

          <FormSection title="About the student">
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name *" style={full} />

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <Labeled label="Class *">
                <SelectWithManual
                  value={classLevel}
                  onChange={setClassLevel}
                  options={CLASS_LEVELS}
                  placeholder="Select class"
                  manualPlaceholder="Type class name"
                  style={fullSelect}
                />
              </Labeled>
              <Labeled label="Term">
                <select value={term} onChange={(e) => setTerm(e.target.value)} style={full}>
                  <option value="">Select term</option>
                  {TERMS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </Labeled>
            </div>

            <Labeled label="Session">
              <input value={session} onChange={(e) => setSession(e.target.value)} placeholder="e.g. 2025/2026" style={full} />
            </Labeled>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <Labeled label="Date of birth *">
                <input type="date" value={dateOfBirth} max={todayStr()} onChange={(e) => setDateOfBirth(e.target.value)} style={full} />
              </Labeled>
              <Labeled label="Sex *">
                <select value={sex} onChange={(e) => setSex(e.target.value)} style={full}>
                  <option value="">Select sex</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </Labeled>
            </div>
          </FormSection>

          <FormSection title="Subjects" hint="Tick every subject the student takes.">
            <SubjectPicker selected={subjects} onChange={setSubjects} />
          </FormSection>

          <FormSection title="Home address">
            <AddressFields value={address} onChange={setAddress} />
          </FormSection>

          <FormSection title="Parent / Guardian">
            <input value={parentName} onChange={(e) => setParentName(e.target.value)} placeholder="Parent's full name *" style={full} />
            <input type="tel" value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} placeholder="Parent's phone number *" style={full} />
            <input type="email" value={parentEmail} onChange={(e) => setParentEmail(e.target.value)} placeholder="Parent's email (optional)" style={full} />
          </FormSection>

          <FormSection title="Parent's address">
            <AddressFields value={parentAddress} onChange={setParentAddress} />
          </FormSection>

          <div style={{ marginTop: "16px" }}>
            <Button type="submit" full disabled={saving || uploading}>
              {saving ? "Saving..." : uploading ? "Uploading photo..." : isEditMode ? "Update Profile" : "Save Profile"}
            </Button>
          </div>

          {!isEditMode && !targetUid && (
            <div style={{ textAlign: "center", marginTop: "14px" }}>
              <Button variant="ghost" size="sm" onClick={() => signOut(auth)}>Log out</Button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}