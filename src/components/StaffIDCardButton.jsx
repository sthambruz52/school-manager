import { useState, useEffect, useRef } from "react";
import { db } from "../firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { renderIDCard, downloadCanvas, ROLE_COLORS } from "../utils/generateIDCard";

export default function StaffIDCardButton({ staffMember }) {
  const [open, setOpen] = useState(false);
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

  const staffId = "STF-" + new Date().getFullYear() + "-" + staffMember.id.slice(0, 6).toUpperCase();

  useEffect(() => {
    if (!open || !frontCanvasRef.current || !backCanvasRef.current) return;
    renderIDCard(frontCanvasRef.current, backCanvasRef.current, {
      schoolInfo,
      contactInfo,
      name: staffMember.name,
      photoURL: staffMember.photoURL,
      idNumber: staffId,
      roleLabel: (staffMember.title || "STAFF").toUpperCase(),
      dateOfBirth: staffMember.dateOfBirth,
      sex: staffMember.sex,
      accentColor: ROLE_COLORS.Staff,
      lines: [
        { label: "Title:", value: staffMember.title },
        { label: "Department:", value: staffMember.department },
        { label: "Phone:", value: staffMember.phone }
      ]
    });
    // eslint-disable-next-line
  }, [open, schoolInfo, contactInfo]);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} style={{ background: "#1f4d3a", color: "white", border: "none", borderRadius: "4px", padding: "4px 10px", fontSize: "12px" }}>
        ID Card
      </button>
    );
  }

  return (
    <div
      onClick={() => setOpen(false)}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: "20px" }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ background: "white", borderRadius: "10px", padding: "20px", maxWidth: "480px", width: "100%" }}>
        <h3 style={{ textAlign: "center", marginTop: 0 }}>{staffMember.name}'s ID Card</h3>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "16px" }}>
          <div>
            <canvas ref={frontCanvasRef} style={{ width: "180px", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }} />
            <div style={{ textAlign: "center", marginTop: "6px" }}>
              <button onClick={() => downloadCanvas(frontCanvasRef.current, `${staffMember.name}-front.png`)} style={{ background: "#1f4d3a", color: "white", border: "none", padding: "6px 14px", borderRadius: "6px", fontSize: "13px" }}>
                Download Front
              </button>
            </div>
          </div>
          <div>
            <canvas ref={backCanvasRef} style={{ width: "180px", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }} />
            <div style={{ textAlign: "center", marginTop: "6px" }}>
              <button onClick={() => downloadCanvas(backCanvasRef.current, `${staffMember.name}-back.png`)} style={{ background: "#1f4d3a", color: "white", border: "none", padding: "6px 14px", borderRadius: "6px", fontSize: "13px" }}>
                Download Back
              </button>
            </div>
          </div>
        </div>
        <div style={{ textAlign: "center", marginTop: "14px" }}>
          <button onClick={() => setOpen(false)} style={{ background: "white", color: "#1f4d3a", border: "1px solid #1f4d3a", padding: "6px 20px", borderRadius: "6px" }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}