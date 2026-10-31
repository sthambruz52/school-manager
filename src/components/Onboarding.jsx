import { useState, useEffect, useRef } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { LayoutGrid, FileText, ClipboardCheck, MessageCircle, GraduationCap, ArrowRight, ShieldCheck } from "lucide-react";

const SLIDES = [
  {
    icon: LayoutGrid,
    from: "#8b5cf6",
    to: "#6d28d9",
    title: "Your School, All in One Place",
    text: "Grades, attendance, fees and report cards for students, parents and teachers, together in one simple app."
  },
  {
    icon: FileText,
    from: "#0ea5e9",
    to: "#0369a1",
    title: "Results Made Easy",
    text: "Teachers enter marks once. Averages, grades and printable report cards are worked out automatically."
  },
  {
    icon: ClipboardCheck,
    from: "#10b981",
    to: "#047857",
    title: "Attendance and Fees",
    text: "Daily roll call with clear attendance rates, plus full or part fee payments with downloadable receipts."
  },
  {
    icon: MessageCircle,
    from: "#f59e0b",
    to: "#d97706",
    title: "Always Connected",
    text: "Parents follow their child's progress, read school notices, and chat with the school office any time."
  },
  {
    icon: GraduationCap,
    from: "#4f46e5",
    to: "#312e81",
    title: "Ready to Get Started?",
    text: "Create your account in minutes, or log in if you already have one."
  }
];

export default function Onboarding({ onDone }) {
  const [index, setIndex] = useState(0);
  const [school, setSchool] = useState(null);
  const touchX = useRef(null);

  const slide = SLIDES[index];
  const Icon = slide.icon;
  const last = index === SLIDES.length - 1;

  useEffect(() => {
    getDoc(doc(db, "settings", "schoolInfo"))
      .then((s) => { if (s.exists()) setSchool(s.data()); })
      .catch(() => {});
  }, []);

  const next = () => (last ? onDone() : setIndex(index + 1));

  const onTouchStart = (e) => { touchX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (dx < -50 && !last) setIndex(index + 1);
    else if (dx > 50 && index > 0) setIndex(index - 1);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "white", overflowY: "auto" }}>
      <style>{`@keyframes obFade { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: none; } }`}</style>

      <div
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        style={{
          maxWidth: "480px",
          margin: "0 auto",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          padding: "20px 24px calc(24px + env(safe-area-inset-bottom, 0px))",
          boxSizing: "border-box"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <img src="/logo.jpg" alt="" style={{ width: "46px", height: "46px", borderRadius: "10px", objectFit: "contain" }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "18px", fontWeight: "800", color: "#1e1b2e", lineHeight: 1.2 }}>
              {school?.schoolName || "Welcome"}
            </div>
            {school?.tagline && (
              <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>{school.tagline}</div>
            )}
          </div>
          {!last && (
            <button
              onClick={onDone}
              style={{ background: "transparent", border: "none", color: "#6b7280", fontWeight: "700", fontSize: "14px", padding: "8px" }}
            >
              Skip
            </button>
          )}
        </div>

        <div
          key={index}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "24px 0",
            animation: "obFade 0.35s ease"
          }}
        >
          <div style={{
            width: "170px",
            height: "170px",
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${slide.from}, ${slide.to})`,
            boxShadow: `0 14px 30px ${slide.to}55`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white"
          }}>
            <Icon size={72} />
          </div>
          <h2 style={{ fontSize: "26px", fontWeight: "800", color: "#1e1b2e", margin: "34px 0 12px" }}>{slide.title}</h2>
          <p style={{ fontSize: "16px", lineHeight: 1.6, color: "#6b7280", margin: 0, maxWidth: "340px" }}>{slide.text}</p>
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginBottom: "20px" }}>
          {SLIDES.map((s, i) => (
            <div
              key={i}
              onClick={() => setIndex(i)}
              style={{
                height: "10px",
                width: i === index ? "28px" : "10px",
                borderRadius: "999px",
                background: i === index ? slide.from : "#e5e7eb",
                transition: "all 0.25s ease",
                cursor: "pointer"
              }}
            />
          ))}
        </div>

        <button
          onClick={next}
          style={{
            width: "100%",
            border: "none",
            borderRadius: "16px",
            padding: "16px",
            color: "white",
            fontSize: "17px",
            fontWeight: "800",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            background: `linear-gradient(135deg, ${slide.from}, ${slide.to})`,
            boxShadow: `0 8px 20px ${slide.to}55`
          }}
        >
          {last ? "Get Started" : "Next"} <ArrowRight size={20} />
        </button>

        <div style={{
          marginTop: "16px",
          background: "#f6f7fb",
          borderRadius: "12px",
          padding: "12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          fontSize: "13px",
          color: "#4b5563"
        }}>
          <ShieldCheck size={18} color="#10b981" />
          Secure login for students, parents and staff
        </div>
      </div>
    </div>
  );
}