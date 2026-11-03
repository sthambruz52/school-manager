import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { BookOpen } from "lucide-react";
import { theme } from "../theme";
import Header from "./ui/Header";
import Card from "./ui/Card";
import Avatar from "./ui/Avatar";
import EmptyState from "./ui/EmptyState";

const TILES = [
  { bg: "#eef0ff", fg: "#4f46e5" },
  { bg: "#e0f2fe", fg: "#0284c7" },
  { bg: "#f3e8ff", fg: "#9333ea" },
  { bg: "#dcfce7", fg: "#16a34a" },
  { bg: "#fef3c7", fg: "#d97706" },
  { bg: "#fee2e2", fg: "#dc2626" }
];

export default function MySubjects({ userData }) {
  const [teachers, setTeachers] = useState([]);
  const [codes, setCodes] = useState({});

  useEffect(() => {
    const q = query(collection(db, "users"), where("role", "==", "Teacher"));
    const unsub = onSnapshot(q, (snap) => setTeachers(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "subjects"), (snap) => {
      const map = {};
      snap.docs.forEach((d) => { map[d.data().name] = d.data().code || ""; });
      setCodes(map);
    });
    return () => unsub();
  }, []);

  const subjects = userData.subjects || [];
  const teachersFor = (name) =>
    teachers.filter((t) => t.status !== "disabled" && (t.subjects || []).includes(name));

  return (
    <div style={{ marginTop: "10px" }}>
      <Header
        title="My Subjects"
        subtitle={`${subjects.length} subject${subjects.length !== 1 ? "s" : ""}${userData.classLevel ? ` • ${userData.classLevel}` : ""}`}
      />

      {subjects.length === 0 ? (
        <EmptyState icon={BookOpen} text='No subjects selected yet. Open "My Profile" from the menu to add them.' />
      ) : (
        <div style={{ marginTop: "14px" }}>
          {subjects.map((s, i) => {
            const tone = TILES[i % TILES.length];
            const list = teachersFor(s);
            return (
              <Card key={s}>
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "12px",
                      background: tone.bg,
                      color: tone.fg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "800",
                      fontSize: "13px",
                      flexShrink: 0
                    }}
                  >
                    {(codes[s] || s.slice(0, 3)).toUpperCase()}
                  </div>
                  <div style={{ fontWeight: "800", fontSize: "16px", color: theme.colors.text }}>{s}</div>
                </div>

                <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: `1px solid ${theme.colors.border}` }}>
                  {list.length === 0 ? (
                    <div style={{ fontSize: "13px", color: theme.colors.textMuted }}>No teacher assigned yet</div>
                  ) : (
                    list.map((t) => (
                      <div key={t.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "5px 0" }}>
                        <Avatar name={t.fullName} photoURL={t.photoURL} size={40} />
                        <div style={{ fontSize: "14px", fontWeight: "600", color: theme.colors.text }}>{t.fullName}</div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}