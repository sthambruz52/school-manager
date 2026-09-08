import { useState, useEffect, useRef } from "react";
import { db } from "../firebase";
import { doc, onSnapshot } from "firebase/firestore";

const CARD_WIDTH = 404;
const CARD_HEIGHT = 640;

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

  const studentIdNumber = "STU-" + studentUid.slice(0, 8).toUpperCase();

  const drawRoundedImage = (ctx, img, x, y, w, h, r) => {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(img, x, y, w, h);
    ctx.restore();
  };

  const wrapText = (ctx, text, x, y, maxWidth, lineHeight, centered) => {
    const words = text.split(" ");
    let line = "";
    let currentY = y;
    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + " ";
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && i > 0) {
        ctx.fillText(line, x, currentY);
        line = words[i] + " ";
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, currentY);
    return currentY;
  };

  const drawFront = (photoImg) => {
    const canvas = frontCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = CARD_WIDTH;
    canvas.height = CARD_HEIGHT;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

    ctx.fillStyle = "#1f4d3a";
    ctx.fillRect(0, 0, CARD_WIDTH, 86);
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.font = "bold 17px Arial";
    wrapText(ctx, schoolInfo?.schoolName || "School Name", CARD_WIDTH / 2, 30, CARD_WIDTH - 30, 20, true);
    ctx.font = "italic 11px Arial";
    ctx.fillText(schoolInfo?.tagline || "Student Identity Card", CARD_WIDTH / 2, 72);

    const photoW = 150;
    const photoH = 195;
    const photoX = (CARD_WIDTH - photoW) / 2;
    const photoY = 116;

    if (photoImg) {
      drawRoundedImage(ctx, photoImg, photoX, photoY, photoW, photoH, 6);
    } else {
      ctx.fillStyle = "#fdf6e9";
      ctx.fillRect(photoX, photoY, photoW, photoH);
      ctx.fillStyle = "#1f4d3a";
      ctx.font = "bold 46px Arial";
      ctx.textAlign = "center";
      ctx.fillText((userData.fullName || "?").charAt(0).toUpperCase(), photoX + photoW / 2, photoY + photoH / 2 + 16);
    }

    let ty = photoY + photoH + 46;
    ctx.fillStyle = "#1f4d3a";
    ctx.font = "bold 21px Arial";
    ctx.textAlign = "center";
    ctx.fillText(userData.fullName || "", CARD_WIDTH / 2, ty);

    ty += 28;
    ctx.fillStyle = "#444";
    ctx.font = "16px Arial";
    ctx.fillText(`Class: ${userData.classLevel || "-"}`, CARD_WIDTH / 2, ty);

    ty += 24;
    ctx.fillText(`Session: ${userData.session || "-"}`, CARD_WIDTH / 2, ty);

    ty += 24;
    const dob = userData.dateOfBirth ? new Date(userData.dateOfBirth).toLocaleDateString() : "-";
    ctx.fillText(`DOB: ${dob}   Sex: ${userData.sex || "-"}`, CARD_WIDTH / 2, ty);

    ty += 32;
    ctx.font = "bold 15px Arial";
    ctx.fillStyle = "#c2704e";
    ctx.fillText(studentIdNumber, CARD_WIDTH / 2, ty);

    ctx.fillStyle = "#1f4d3a";
    ctx.fillRect(0, CARD_HEIGHT - 14, CARD_WIDTH, 14);
  };

  const drawBack = () => {
    const canvas = backCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = CARD_WIDTH;
    canvas.height = CARD_HEIGHT;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

    ctx.fillStyle = "#1f4d3a";
    ctx.fillRect(0, 0, CARD_WIDTH, 50);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "center";
    ctx.fillText("STUDENT ID CARD", CARD_WIDTH / 2, 32);

    const address = [userData.address?.street, userData.address?.lga, userData.address?.city, userData.address?.state, userData.address?.country].filter(Boolean).join(", ");

    ctx.textAlign = "left";
    let y = 90;
    const leftX = 28;
    const maxW = CARD_WIDTH - leftX - 28;

    const drawStacked = (label, value) => {
      ctx.font = "bold 14px Arial";
      ctx.fillStyle = "#1f4d3a";
      ctx.fillText(label, leftX, y);
      y += 20;
      ctx.font = "14px Arial";
      ctx.fillStyle = "#333";
      y = wrapText(ctx, value || "-", leftX, y, maxW, 18, false);
      y += 30;
    };

    drawStacked("Parent/Guardian:", userData.parentName);
    drawStacked("Parent Phone:", userData.parentPhone);
    drawStacked("Address:", address);

    y += 10;
    ctx.font = "italic 12px Arial";
    ctx.fillStyle = "#666";
    y = wrapText(ctx, "If found, please return to:", leftX, y, maxW, 16, false);
    y += 18;
    ctx.font = "12px Arial";
    const contactLine = [contactInfo?.address, contactInfo?.phone1, contactInfo?.email].filter(Boolean).join(" | ");
    wrapText(ctx, contactLine || "School office", leftX, y, maxW, 16, false);

    ctx.strokeStyle = "#999";
    ctx.beginPath();
    ctx.moveTo(leftX, CARD_HEIGHT - 50);
    ctx.lineTo(CARD_WIDTH - 28, CARD_HEIGHT - 50);
    ctx.stroke();
    ctx.font = "12px Arial";
    ctx.fillStyle = "#888";
    ctx.fillText("Student's Signature", leftX, CARD_HEIGHT - 32);

    ctx.fillStyle = "#1f4d3a";
    ctx.fillRect(0, CARD_HEIGHT - 14, CARD_WIDTH, 14);
  };

  useEffect(() => {
    drawBack();

    if (userData.photoURL) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => drawFront(img);
      img.onerror = () => drawFront(null);
      img.src = userData.photoURL;
    } else {
      drawFront(null);
    }
    // eslint-disable-next-line
  }, [userData, schoolInfo, contactInfo]);

  const downloadCanvas = (canvasRef, filename) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const url = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
    } catch (err) {
      alert("Could not generate the image. Please try again.");
    }
  };

  return (
    <div style={{ maxWidth: "700px", margin: "20px auto", padding: "0 20px" }}>
      <h2 style={{ textAlign: "center" }}>My ID Card</h2>

      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "24px" }}>
        <div>
          <p style={{ textAlign: "center", fontWeight: "bold", color: "#1f4d3a" }}>Front</p>
          <canvas ref={frontCanvasRef} style={{ width: "220px", borderRadius: "10px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }} />
          <div style={{ textAlign: "center", marginTop: "8px" }}>
            <button onClick={() => downloadCanvas(frontCanvasRef, "id-card-front.png")} style={{ background: "#1f4d3a", color: "white", border: "none", padding: "8px 20px", borderRadius: "6px" }}>
              Download Front
            </button>
          </div>
        </div>

        <div>
          <p style={{ textAlign: "center", fontWeight: "bold", color: "#1f4d3a" }}>Back</p>
          <canvas ref={backCanvasRef} style={{ width: "220px", borderRadius: "10px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }} />
          <div style={{ textAlign: "center", marginTop: "8px" }}>
            <button onClick={() => downloadCanvas(backCanvasRef, "id-card-back.png")} style={{ background: "#1f4d3a", color: "white", border: "none", padding: "8px 20px", borderRadius: "6px" }}>
              Download Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}