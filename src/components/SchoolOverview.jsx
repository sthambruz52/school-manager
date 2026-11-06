import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, query, where, orderBy, limit, onSnapshot } from "firebase/firestore";
import { theme, formatNaira } from "../theme";
import Header from "./ui/Header";
import Card from "./ui/Card";
import StatCard from "./ui/StatCard";
import StatusPill from "./ui/StatusPill";
import Avatar from "./ui/Avatar";

const localDate = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const noticeDate = (ts) => {
  const d = ts?.toDate ? ts.toDate() : null;
  return d ? d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "";
};

const muted = { color: theme.colors.textMuted, fontSize: "14px", margin: 0 };
const heading = { fontWeight: "800", color: theme.colors.text, marginBottom: "10px" };

export default function SchoolOverview() {
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [parents, setParents] = useState([]);
  const [todayRecs, setTodayRecs] = useState([]);
  const [fees, setFees] = useState([]);
  const [notices, setNotices] = useState([]);

  useEffect(() => {
    const subs = [
      ["Student", setStudents],
      ["Teacher", setTeachers],
      ["Parent", setParents]
    ].map(([role, setter]) =>
      onSnapshot(query(collection(db, "users"), where("role", "==", role)), (snap) =>
        setter(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      )
    );
    return () => subs.forEach((u) => u());
  }, []);

  useEffect(() => {
    const q = query(collection(db, "attendance"), where("date", "==", localDate()));
    const unsub = onSnapshot(q, (snap) => setTodayRecs(snap.docs.map((d) => d.data())));
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "fees"), (snap) =>
      setFees(snap.docs.map((d) => d.data()).filter((f) => f.totalDue !== undefined && f.amountPaid !== undefined))
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "notices"), orderBy("createdAt", "desc"), limit(3));
    const unsub = onSnapshot(q, (snap) => setNotices(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, []);

  const activeStudents = students.filter((s) => s.status !== "disabled");
  const activeTeachers = teachers.filter((t) => t.status !== "disabled");

  const studentIds = new Set(activeStudents.map((s) => s.id));
  const recs = todayRecs.filter((r) => studentIds.has(r.studentId));
  const countOf = (status) => recs.filter((r) => r.status === status).length;
  const present = countOf("Present");
  const late = countOf("Late");
  const absent = countOf("Absent");
  const marked = recs.length;
  const attPct = marked ? Math.round(((present + late) / marked) * 100) : null;

  const statusById = new Map(recs.map((r) => [r.studentId, r.status]));
  const absentees = activeStudents
    .filter((s) => statusById.get(s.id) === "Absent")
    .sort((a, b) => (a.fullName || "").localeCompare(b.fullName || ""));

  const billed = fees.reduce((sum, f) => sum + Number(f.totalDue), 0);
  const paid = fees.reduce((sum, f) => sum + Number(f.amountPaid), 0);
  const collectionPct = billed > 0 ? Math.round((paid / billed) * 100) : 0;
  const fullCount = fees.filter((f) => Number(f.amountPaid) >= Number(f.totalDue)).length;
  const partCount = fees.filter((f) => Number(f.amountPaid) > 0 && Number(f.amountPaid) < Number(f.totalDue)).length;
  const unpaidCount = fees.filter((f) => Number(f.amountPaid) <= 0).length;

  return (
    <div style={{ marginTop: "10px" }}>
      <Header title="School Overview" subtitle="A live snapshot of the school (view only)" />

      <div style={{ display: "flex", gap: "10px", margin: "14px 0 4px" }}>
        {[["Students", activeStudents.length], ["Teachers", activeTeachers.length], ["Parents", parents.length]].map(([label, value]) => (
          <Card key={label} style={{ flex: 1, textAlign: "center", margin: 0, padding: "14px 6px" }}>
            <div style={{ fontSize: "24px", fontWeight: "800", color: theme.colors.primary }}>{value}</div>
            <div style={{ fontSize: "12px", color: theme.colors.textMuted }}>{label}</div>
          </Card>
        ))}
      </div>

      <div style={{ margin: "14px 0" }}>
        <StatCard
          label="Today's Attendance"
          value={attPct === null ? "-" : `${attPct}%`}
          subLabel={`${marked} of ${activeStudents.length} marked`}
          badge="Today"
          gradientFrom="#0ea5e9"
          gradientTo="#0369a1"
          stats={[
            { value: present, label: "Present" },
            { value: late, label: "Late" },
            { value: absent, label: "Absent" }
          ]}
        />
      </div>

      <Card>
        <div style={heading}>Absent today</div>
        {marked === 0 ? (
          <p style={muted}>Attendance has not been taken yet today.</p>
        ) : absentees.length === 0 ? (
          <p style={muted}>Nobody is marked absent today.</p>
        ) : (
          <>
            {absentees.slice(0, 12).map((s) => (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "6px 0" }}>
                <Avatar name={s.fullName} photoURL={s.photoURL} size={40} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: "600", fontSize: "14px", color: theme.colors.text }}>{s.fullName}</div>
                  <div style={{ fontSize: "12px", color: theme.colors.textMuted }}>{s.classLevel || "No class"}</div>
                </div>
              </div>
            ))}
            {absentees.length > 12 && (
              <p style={{ ...muted, marginTop: "8px", fontSize: "12px" }}>and {absentees.length - 12} more</p>
            )}
          </>
        )}
      </Card>

      <div style={{ margin: "14px 0" }}>
        <StatCard
          label="Fees"
          value={`${collectionPct}%`}
          subLabel="collected"
          badge={`${fees.length} records`}
          gradientFrom="#059669"
          gradientTo="#047857"
          stats={[
            { value: formatNaira(paid), label: "Collected" },
            { value: formatNaira(billed), label: "Billed" },
            { value: formatNaira(billed - paid), label: "Outstanding" }
          ]}
        />
      </div>

      <Card>
        <div style={heading}>Fee records</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          <StatusPill label={`${fullCount} fully paid`} variant="success" />
          <StatusPill label={`${partCount} part paid`} variant="warning" />
          <StatusPill label={`${unpaidCount} unpaid`} variant="danger" />
        </div>
      </Card>

      <Card>
        <div style={heading}>Latest notices</div>
        {notices.length === 0 ? (
          <p style={muted}>No notices posted yet.</p>
        ) : (
          notices.map((n, i) => (
            <div key={n.id} style={{ padding: "8px 0", borderTop: i > 0 ? `1px solid ${theme.colors.border}` : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                {n.urgent && <StatusPill label="URGENT" variant="danger" />}
                <span style={{ fontWeight: "700", fontSize: "14px", color: theme.colors.text }}>{n.title}</span>
              </div>
              <div style={{ fontSize: "12px", color: theme.colors.textMuted, marginTop: "2px" }}>{noticeDate(n.createdAt)}</div>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}