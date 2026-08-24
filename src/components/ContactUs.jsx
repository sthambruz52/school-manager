import { useState, useEffect } from "react";
import { db } from "../firebase";
import { doc, setDoc, onSnapshot } from "firebase/firestore";

export default function ContactUs({ isAdmin }) {
  const [address, setAddress] = useState("");
  const [phone1, setPhone1] = useState("");
  const [phone2, setPhone2] = useState("");
  const [email, setEmail] = useState("");
  const [officeHours, setOfficeHours] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "contactInfo"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setAddress(data.address || "");
        setPhone1(data.phone1 || "");
        setPhone2(data.phone2 || "");
        setEmail(data.email || "");
        setOfficeHours(data.officeHours || "");
      }
    });
    return () => unsub();
  }, []);

  const save = async () => {
    setSaving(true);
    await setDoc(doc(db, "settings", "contactInfo"), { address, phone1, phone2, email, officeHours });
    setSaving(false);
    alert("Contact info updated.");
  };

  const inputStyle = { padding: "10px", borderRadius: "6px", width: "100%", boxSizing: "border-box" };

  return (
    <div style={{ marginTop: "20px" }}>
      <h2 style={{ textAlign: "center" }}>Contact Us</h2>

      {isAdmin ? (
        <div style={{ background: "white", padding: "16px", borderRadius: "10px", display: "flex", flexDirection: "column", gap: "10px", maxWidth: "500px", margin: "0 auto" }}>
          <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="School address" style={inputStyle} />
          <input value={phone1} onChange={(e) => setPhone1(e.target.value)} placeholder="Phone number" style={inputStyle} />
          <input value={phone2} onChange={(e) => setPhone2(e.target.value)} placeholder="Second phone number (optional)" style={inputStyle} />
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="School email" style={inputStyle} />
          <input value={officeHours} onChange={(e) => setOfficeHours(e.target.value)} placeholder="Office hours (e.g. Mon-Fri, 8am-4pm)" style={inputStyle} />
          <button onClick={save} disabled={saving} style={{ background: "#1f4d3a", color: "white", padding: "10px", borderRadius: "6px", border: "none" }}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      ) : (
        <div style={{ background: "white", padding: "24px", borderRadius: "10px", maxWidth: "500px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "16px" }}>
          {address && (
            <div>
              <div style={{ fontWeight: "bold", color: "#1f4d3a" }}>Address</div>
              <div>{address}</div>
            </div>
          )}
          {(phone1 || phone2) && (
            <div>
              <div style={{ fontWeight: "bold", color: "#1f4d3a" }}>Phone</div>
              <div>{phone1}{phone1 && phone2 && ", "}{phone2}</div>
            </div>
          )}
          {email && (
            <div>
              <div style={{ fontWeight: "bold", color: "#1f4d3a" }}>Email</div>
              <div>{email}</div>
            </div>
          )}
          {officeHours && (
            <div>
              <div style={{ fontWeight: "bold", color: "#1f4d3a" }}>Office Hours</div>
              <div>{officeHours}</div>
            </div>
          )}
          {!address && !phone1 && !email && (
            <p style={{ textAlign: "center", color: "#666" }}>Contact info not added yet.</p>
          )}
        </div>
      )}
    </div>
  );
}