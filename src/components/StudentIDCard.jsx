import { useState, useEffect, useRef } from "react";
import { db } from "../firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { renderIDCard, downloadCanvas, ROLE_COLORS } from "../utils/generateIDCard";

export default function StudentIDCard({ userData, studentUid }) {
  const [schoolInfo, setSchoolInfo] = useState(null);
  const [contactInfo, setContactInfo] = useState(null);
  const frontCanvasRef = useRef(null);
  const backCanvasRef = useRef(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "schoolInfo"), (docSnap) => {
      if (docSnap.exists()) setSchoolInfo(docSnap.data());
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "contactInfo"), (docSnap) => {
      if (docSnap.exists()) setContactInfo(docSnap.data());
    });
    return () => unsub();
  }, []);

  const regNumber = userData.regNumber || ("REG-" + new Date().getFullYear() + "-" + studentUid.slice(0, 6).toUpperCase());

  useEffect(() => {
    if (!frontCanvasRef.current || !backCanvasRef.current) return;
    const address = [userData.address?.street, userData.address?.lga, userData.address?.city, userData.address?.state, userData.address?.country].filter(Boolean).join(", ");

    renderIDCard(frontCanvasRef.current, backCanvasRef.current, {
      schoolInfo,
      contactInfo,
      name: userData.fullName,
      photoURL: userData.photoURL,
      idNumber: regNumber,
      roleLabel: `${userData.classLevel || "-"} — STUDENT`,
      dateOfBirth: userData.dateOfBirth,
      sex: userData.sex,
      accentColor: ROLE_COLORS.Student,
      lines: [
        { label: "Parent/Guardian:", value: userData.parentName },
        { label: "Parent Phone:", value: userData.parentPhone },
        { label: "Address:", value: address }
      ]
    });
    // eslint-disable-next-line
  }, [userData, schoolInfo, contactInfo]);

  return (
    <div style={{ maxWidth: "700px", margin: "20px auto", padding: "0 20px" }}>
      <h2 style={{ textAlign: "center" }}>My ID Card</h2>

      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "24px" }}>
        <div>
          <p style={{ textAlign: "center", fontWeight: "bold", color: "#1f4d3a" }}>Front</p>
          <canvas ref={frontCanvasRef} style={{ width: "220px", borderRadius: "10px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }} />
          <div style={{ textAlign: "center", marginTop: "8px" }}>
            <button onClick={() => downloadCanvas(frontCanvasRef.current, "id-card-front.png")} style={{ background: "#1f4d3a", color: "white", border: "none", padding: "8px 20px", borderRadius: "6px" }}>
              Download Front
            </button>
          </div>
        </div>

        <div>
          <p style={{ textAlign: "center", fontWeight: "bold", color: "#1f4d3a" }}>Back</p>
          <canvas ref={backCanvasRef} style={{ width: "220px", borderRadius: "10px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }} />
          <div style={{ textAlign: "center", marginTop: "8px" }}>
            <button onClick={() => downloadCanvas(backCanvasRef.current, "id-card-back.png")} style={{ background: "#1f4d3a", color: "white", border: "none", padding: "8px 20px", borderRadius: "6px" }}>
              Download Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}