import { useState, useEffect, useRef } from "react";
import { db } from "../firebase";
import { doc, onSnapshot } from "firebase/firestore";

const CARD_WIDTH = 404;
const CARD_HEIGHT = 640;
const GREEN = "#1f4d3a";
const ORANGE = "#c2704e";

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

  const loadImage = (src) => {
    return new Promise((resolve) => {
      if (!src) { resolve(null); return; }
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  };

  const drawRoundedRect = (ctx, x, y, w, h, r) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };

  const wrapText = (ctx, text, x, y, maxWidth, lineHeight) => {
    const words = text.split(" ");
    let line = "";
    let currentY = y;
    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + " ";
      if (ctx.measureText(testLine).width > maxWidth && i > 0) {
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

  const drawHeaderPattern = (ctx, headerHeight) => {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, CARD_WIDTH, headerHeight);
    ctx.clip();
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 14;
    [[-30, headerHeight - 20, 110], [CARD_WIDTH + 20, 40, 90], [70, headerHeight + 40, 70]].forEach(([cx, cy, r]) => {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    });
    ctx.restore();
  };

  const drawFront = (logoImg, photoImg) => {
    const canvas = frontCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = CARD_WIDTH;
    canvas.height = CARD_HEIGHT;

    const headerHeight = 190;
    const stripeHeight = 8;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

    ctx.fillStyle = GREEN;
    ctx.fillRect(0, 0, CARD_WIDTH, headerHeight);
    drawHeaderPattern(ctx, headerHeight);

    ctx.fillStyle = ORANGE;
    ctx.fillRect(0, headerHeight, CARD_WIDTH, stripeHeight);

    const logoR = 36;
    const logoCx = CARD_WIDTH / 2;
    const logoCy = 54;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(logoCx, logoCy, logoR, 0, Math.PI * 2);
    ctx.fill();
    if (logoImg) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(logoCx, logoCy, logoR - 4, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(logoImg, logoCx - (logoR - 4), logoCy - (logoR - 4), (logoR - 4) * 2, (logoR - 4) * 2);
      ctx.restore();
    }

    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 20px Arial";
    let hy = wrapText(ctx, (schoolInfo?.schoolName || "School Name").toUpperCase(), CARD_WIDTH / 2, 118, CARD_WIDTH - 40, 24);
    hy += 24;
    ctx.font = "13px Arial";
    wrapText(ctx, schoolInfo?.tagline || "Student Identity Card", CARD_WIDTH / 2, hy, CARD_WIDTH - 50, 16);

    const photoFrameW = 176;
    const photoFrameH = 220;
    const photoFrameX = (CARD_WIDTH - photoFrameW) / 2;
    const photoFrameY = 140;
    const border = 7;

    ctx.fillStyle = "#ffffff";
    drawRoundedRect(ctx, photoFrameX, photoFrameY, photoFrameW, photoFrameH, 14);
    ctx.shadowColor = "rgba(0,0,0,0.25)";
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.shadowBlur = 0;

    const innerX = photoFrameX + border;
    const innerY = photoFrameY + border;
    const innerW = photoFrameW - border * 2;
    const innerH = photoFrameH - border * 2;

    ctx.save();
    drawRoundedRect(ctx, innerX, innerY, innerW, innerH, 8);
    ctx.clip();
    if (photoImg) {
      ctx.drawImage(photoImg, innerX, innerY, innerW, innerH);
    } else {
      ctx.fillStyle = "#fdf6e9";
      ctx.fillRect(innerX, innerY, innerW, innerH);
      ctx.fillStyle = GREEN;
      ctx.font = "bold 48px Arial";
      ctx.textAlign = "center";
      ctx.fillText((userData.fullName || "?").charAt(0).toUpperCase(), innerX + innerW / 2, innerY + innerH / 2 + 16);
    }
    ctx.restore();

    let ty = photoFrameY + photoFrameH + 42;
    ctx.fillStyle = ORANGE;
    ctx.font = "bold 22px Arial";
    ctx.textAlign = "center";
    ty = wrapText(ctx, (userData.fullName || "").toUpperCase(), CARD_WIDTH / 2, ty, CARD_WIDTH - 40, 26);

    ty += 30;
    ctx.fillStyle = "#222";
    ctx.font = "bold 16px Arial";
    ctx.fillText(`(${userData.classLevel || "-"} — STUDENT)`, CARD_WIDTH / 2, ty);

    ty += 26;
    ctx.fillStyle = "#555";
    ctx.font = "13px Arial";
    const dob = userData.dateOfBirth ? new Date(userData.dateOfBirth).toLocaleDateString() : "-";
    ctx.fillText(`DOB: ${dob}   Sex: ${userData.sex || "-"}`, CARD_WIDTH / 2, ty);

    ty += 24;
    ctx.font = "bold 13px Arial";
    ctx.fillStyle = GREEN;
    ctx.fillText(regNumber, CARD_WIDTH / 2, ty);

    const footerH = 14;
    ctx.fillStyle = ORANGE;
    ctx.fillRect(0, CARD_HEIGHT - footerH, CARD_WIDTH * 0.55, footerH);
    ctx.fillStyle = GREEN;
    ctx.fillRect(CARD_WIDTH * 0.55, CARD_HEIGHT - footerH, CARD_WIDTH * 0.45, footerH);
  };

  const drawBack = (logoImg) => {
    const canvas = backCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = CARD_WIDTH;
    canvas.height = CARD_HEIGHT;

    const headerHeight = 70;
    const stripeHeight = 8;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

    ctx.fillStyle = GREEN;
    ctx.fillRect(0, 0, CARD_WIDTH, headerHeight);
    drawHeaderPattern(ctx, headerHeight);

    ctx.fillStyle = ORANGE;
    ctx.fillRect(0, headerHeight, CARD_WIDTH, stripeHeight);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 17px Arial";
    ctx.textAlign = "center";
    ctx.fillText("STUDENT ID CARD", CARD_WIDTH / 2, 42);

    const address = [userData.address?.street, userData.address?.lga, userData.address?.city, userData.address?.state, userData.address?.country].filter(Boolean).join(", ");

    ctx.textAlign = "left";
    let y = 116;
    const leftX = 28;
    const maxW = CARD_WIDTH - leftX - 28;

    const drawStacked = (label, value) => {
      ctx.font = "bold 14px Arial";
      ctx.fillStyle = GREEN;
      ctx.fillText(label, leftX, y);
      y += 20;
      ctx.font = "14px Arial";
      ctx.fillStyle = "#333";
      y = wrapText(ctx, value || "-", leftX, y, maxW, 18);
      y += 30;
    };

    drawStacked("Parent/Guardian:", userData.parentName);
    drawStacked("Parent Phone:", userData.parentPhone);
    drawStacked("Address:", address);

    y += 10;
    ctx.font = "italic 12px Arial";
    ctx.fillStyle = "#666";
    y = wrapText(ctx, "If found, please return to:", leftX, y, maxW, 16);
    y += 18;
    ctx.font = "12px Arial";
    const contactLine = [contactInfo?.address, contactInfo?.phone1, contactInfo?.email].filter(Boolean).join(" | ");
    wrapText(ctx, contactLine || "School office", leftX, y, maxW, 16);

    ctx.strokeStyle = "#999";
    ctx.beginPath();
    ctx.moveTo(leftX, CARD_HEIGHT - 50);
    ctx.lineTo(CARD_WIDTH - 28, CARD_HEIGHT - 50);
    ctx.stroke();
    ctx.font = "12px Arial";
    ctx.fillStyle = "#888";
    ctx.fillText("Student's Signature", leftX, CARD_HEIGHT - 32);

    const footerH = 14;
    ctx.fillStyle = ORANGE;
    ctx.fillRect(0, CARD_HEIGHT - footerH, CARD_WIDTH * 0.55, footerH);
    ctx.fillStyle = GREEN;
    ctx.fillRect(CARD_WIDTH * 0.55, CARD_HEIGHT - footerH, CARD_WIDTH * 0.45, footerH);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [logoImg, photoImg] = await Promise.all([
        loadImage("/logo.jpg"),
        loadImage(userData.photoURL)
      ]);
      if (cancelled) return;
      drawFront(logoImg, photoImg);
      drawBack(logoImg);
    })();
    return () => { cancelled = true; };
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
}import { useState, useEffect, useRef } from "react";
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