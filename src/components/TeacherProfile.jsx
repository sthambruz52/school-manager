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
import FormSection from "./ui/FormSection";
import Labeled from "./ui/Labeled";

const PHONE_OK = /^\+?\d{10,15}$/;
const BLANK_ADDRESS = { street: "", lga: "", city: "", state: "", country: "Nigeria" };

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const full = { ...field, width: "100%" };

export default function TeacherProfile({ onComplete, existingData, targetUid }) {
  const d = existingData || {};
  const isEditMode = !!existingData;

  const [fullName, setFullName] = useState(d.fullName || "");
  const [phone, setPhone] = useState(d.phone || "");
  const [dateOfBirth, setDateOfBirth] = useState(d.dateOfBirth || "");
  const [sex, setSex] = useState(d.sex || "");
  const [subjects, setSubjects] = useState(d.subjects || []);
  const [address, setAddress] = useState({ ...BLANK_ADDRESS, ...(d.address || {}) });
  const [photoURL, setPhotoURL] = useState(d.photoURL || "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();

    if (!fullName.trim() || !phone.trim() || !dateOfBirth || !sex) {
      return alert("Please fill in all the required fields (marked with *).");
    }
    if (!PHONE_OK.test(phone.replace(/\s/g, ""))) {
      return alert("Please enter a valid phone number (10-15 digits).");
    }

    setSaving(true);
    let ok = false;
    try {
      const uid = targetUid || auth.currentUser.uid;
      const extra = isEditMode
        ? {}
        : { staffId: "STF-" + new Date().getFullYear() + "-" + uid.slice(0, 6).toUpperCase() };

      await setDoc(
        doc(db, "users", uid),
        {
          ...extra,
          fullName: fullName.trim(),
          phone: phone.trim(),
          dateOfBirth,
          sex,
          subjects,
          photoURL,
          address,
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
          subtitle={isEditMode ? "Update the teacher's details" : "A few details to set up your account"}
          onBack={isEditMode ? onComplete : undefined}
        />

        <form onSubmit={submit}>
          <FormSection title="Passport photo">
            <PhotoField name={fullName} photoURL={photoURL} onChange={setPhotoURL} onBusyChange={setUploading} />
          </FormSection>

          <FormSection title="About you">
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name *" style={full} />
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number *" style={full} />
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

          <FormSection title="Subjects you teach" hint="Students will see you listed under these subjects.">
            <SubjectPicker selected={subjects} onChange={setSubjects} />
          </FormSection>

          <FormSection title="Address">
            <AddressFields value={address} onChange={setAddress} />
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