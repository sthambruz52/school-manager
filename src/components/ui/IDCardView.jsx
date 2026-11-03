import { useState, useEffect, useRef } from "react";
import { db } from "../../firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { Download } from "lucide-react";
import { theme } from "../../theme";
import { renderIDCard, downloadCanvas } from "../../utils/generateIDCard";
import Button from "./Button";

export default function IDCardView({ options, fileBase = "id-card", width = 220 }) {
  const [schoolInfo, setSchoolInfo] = useState(null);
  const [contactInfo, setContactInfo] = useState(null);
  const frontRef = useRef(null);
  const backRef = useRef(null);

  useEffect(() => {
    const u1 = onSnapshot(doc(db, "settings", "schoolInfo"), (s) => { if (s.exists()) setSchoolInfo(s.data()); });
    const u2 = onSnapshot(doc(db, "settings", "contactInfo"), (s) => { if (s.exists()) setContactInfo(s.data()); });
    return () => { u1(); u2(); };
  }, []);

  const optionsKey = JSON.stringify(options);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!frontRef.current || !backRef.current) return;
      renderIDCard(frontRef.current, backRef.current, { ...options, schoolInfo, contactInfo }).catch(() => {});
    }, 200);
    return () => clearTimeout(timer);
    // eslint-disable-next-line
  }, [optionsKey, schoolInfo, contactInfo]);

  const sides = [["Front", frontRef, "front"], ["Back", backRef, "back"]];

  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "24px" }}>
      {sides.map(([label, ref, key]) => (
        <div key={key} style={{ textAlign: "center" }}>
          <div style={{ fontSize: "12px", fontWeight: "800", letterSpacing: "1px", color: theme.colors.textMuted, marginBottom: "8px" }}>
            {label.toUpperCase()}
          </div>
          <canvas
            ref={ref}
            style={{ width: `${width}px`, maxWidth: "100%", height: "auto", display: "block", borderRadius: "12px", boxShadow: theme.shadow }}
          />
          <div style={{ marginTop: "10px" }}>
            <Button size="sm" icon={<Download size={14} />} onClick={() => downloadCanvas(ref.current, `${fileBase}-${key}.png`)}>
              Download {label}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}