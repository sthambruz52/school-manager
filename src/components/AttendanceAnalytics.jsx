import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { TrendingUp } from "lucide-react";
import { theme, field } from "../theme";
import Header from "./ui/Header";
import Card from "./ui/Card";
import Avatar from "./ui/Avatar";
import StatCard from "./ui/StatCard";
import StatusPill from "./ui/StatusPill";
import ProgressBar from "./ui/ProgressBar";
import EmptyState from "./ui/EmptyState";
import SelectWithManual from "./ui/SelectWithManual";

const DEFAULT_CLASSES = [
  "Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6",
  "JSS1", "JSS2", "JSS3",
  "SS1", "SS2", "SS3"
];
const TERMS = ["First Term", "Second Term", "Third Term"];
const THRESHOLD = 75;

export default function AttendanceAnalytics() {
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);

  const [classFilter, setClassFilter] = useState("");
  const [session, setSession] = useState("");
  const [term, setTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [lowOnly, setLowOnly] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "users"), where("role", "==", "Student"));
    const unsub = onSnapshot(q, (snap) => setStudents(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "attendance"), (snap) => setAttendance(snap.docs.map((d) => d.data())));
    return () => unsub();
  }, []);

  const extraClasses = [...new Set(students.map((s) => s.classLevel).filter(Boolean))].filter((c) => !DEFAULT_CLASSES.includes(c));
  const classOptions = [...DEFAULT_CLASSES, ...extraClasses];

  const byStudent = {};
  attendance.forEach((a) => {
    if (session && a.session !== session) return;
    if (term && a.term !== term) return;
    (byStudent[a.studentId] = byStudent[a.studentId] || []).push(a);
  });

  const rows = students
    .filter((s) => !classFilter || s.classLevel === classFilter)
    .map((s) => {
      const recs = byStudent[s.id] || [];
      const present = recs.filter((r) => r.status === "Present").length;
      const late = recs.filter((r) => r.status === "Late").length;
      const absent = recs.filter((r) => r.status === "Absent").length;
      const total = recs.length;
      const pct = total ? Math.round(((present + late) / total) * 100) : null;
      return { id: s.id, name: s.fullName, photoURL: s.photoURL, classLevel: s.classLevel, present, late, absent, total, pct };
    });

  const totalGood = rows.reduce((sum, r) => sum + r.present + r.late, 0);
  const totalDays = rows.reduce((sum, r) => sum + r.total, 0);
  const overallPct = totalDays ? Math.round((totalGood / totalDays) * 100) : 0;
  const lowCount = rows.filter((r) => r.pct !== null && r.pct < THRESHOLD).length;
  const noRecords = rows.filter((r) => r.pct === null).length;

  const list = rows
    .filter((r) => !lowOnly || (r.pct !== null && r.pct < THRESHOLD))
    .sort((a, b) =>
      sortBy === "pct"
        ? (a.pct ?? 101) - (b.pct ?? 101)
        : (a.name || "").localeCompare(b.name || "")
    );

  return (
    <div style={{ marginTop: "10px" }}>
      <Header title="Attendance Analytics" subtitle="Attendance rates by student" />

      <Card style={{ marginTop: "14px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
          <SelectWithManual value={classFilter} onChange={setClassFilter} options={classOptions} placeholder="All classes" manualPlaceholder="Type class name" />
          <input value={session} onChange={(e) => setSession(e.target.value)} placeholder="Session (e.g. 2025/2026)" style={{ ...field, flex: "1 1 150px" }} />
          <select value={term} onChange={(e) => setTerm(e.target.value)} style={{ ...field, flex: "1 1 150px" }}>
            <option value="">All terms</option>
            {TERMS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ ...field, flex: "1 1 150px" }}>
            <option value="name">Sort: Name (A-Z)</option>
            <option value="pct">Sort: Lowest attendance first</option>
          </select>
        </div>
      </Card>

      {rows.length === 0 ? (
        <EmptyState icon={TrendingUp} text="No students match this filter yet." />
      ) : (
        <>
          <div style={{ margin: "10px 0" }}>
            <StatCard
              label="Attendance Rate"
              value={totalDays ? `${overallPct}%` : "-"}
              subLabel={totalDays ? `${totalGood} of ${totalDays} days` : "No records yet"}
              badge={`${rows.length} student${rows.length !== 1 ? "s" : ""}`}
              gradientFrom="#0ea5e9"
              gradientTo="#0369a1"
              stats={[
                { value: rows.length, label: "Students" },
                { value: lowCount, label: `Below ${THRESHOLD}%` },
                { value: noRecords, label: "No records" }
              ]}
            />
          </div>

          <button
            onClick={() => setLowOnly(!lowOnly)}
            style={{
              border: "none",
              borderRadius: "999px",
              padding: "8px 14px",
              fontSize: "12px",
              fontWeight: "700",
              margin: "4px 0 6px",
              background: lowOnly ? theme.colors.danger : "#e6e8f5",
              color: lowOnly ? "white" : theme.colors.textMuted
            }}
          >
            Below {THRESHOLD}% only ({lowCount})
          </button>

          {list.length === 0 ? (
            <EmptyState icon={TrendingUp} text="Nobody is below the threshold." />
          ) : (
            list.map((r) => {
              const low = r.pct !== null && r.pct < THRESHOLD;
              return (
                <Card key={r.id} style={{ borderLeft: `5px solid ${low ? theme.colors.danger : theme.colors.primary}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <Avatar name={r.name} photoURL={r.photoURL} size={48} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: "700", color: theme.colors.text }}>{r.name}</div>
                      <div style={{ fontSize: "12px", color: theme.colors.textMuted }}>
                        {r.classLevel} • {r.total ? `Present ${r.present} • Late ${r.late} • Absent ${r.absent}` : "No records"}
                      </div>
                    </div>
                    {r.pct !== null && <StatusPill label={`${r.pct}%`} variant={r.pct >= THRESHOLD ? "success" : r.pct >= 50 ? "warning" : "danger"} />}
                  </div>
                  {r.pct !== null && (
                    <div style={{ marginTop: "10px" }}>
                      <ProgressBar value={r.pct} max={100} height={6} color={low ? theme.colors.danger : theme.colors.success} />
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </>
      )}
    </div>
  );
}