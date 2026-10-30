import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, query, where, onSnapshot, doc } from "firebase/firestore";
import { Download, Phone, ChevronDown, ChevronUp } from "lucide-react";
import { theme, formatNaira } from "../theme";
import Card from "./ui/Card";
import Avatar from "./ui/Avatar";
import StatCard from "./ui/StatCard";
import StatusPill from "./ui/StatusPill";
import ProgressBar from "./ui/ProgressBar";
import { printFeeReceipt } from "../utils/printReceipt";
import { gradeInfo } from "../utils/printReportCard";

const TERMS = ["First Term", "Second Term", "Third Term"];
const FEE_TERM = { "First Term": "Term 1", "Second Term": "Term 2", "Third Term": "Term 3" };
const TODAY_VARIANT = { Present: "success", Late: "warning", Absent: "danger" };

const localDate = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const pctColor = (pct) => (pct >= 60 ? theme.colors.success : pct >= 40 ? theme.colors.warning : theme.colors.danger);
const feeStatus = (f) => (f.amountPaid >= f.totalDue ? "Full Payment" : f.amountPaid > 0 ? "Part Payment" : "Unpaid");
const feeVariant = (s) => (s === "Full Payment" ? "success" : s === "Part Payment" ? "warning" : "danger");

export default function StudentOverview({ studentId, showExtras = false, fallbackName = "" }) {
  const [student, setStudent] = useState(null);
  const [grades, setGrades] = useState([]);
  const [fees, setFees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [todayRec, setTodayRec] = useState(null);
  const [classTeacher, setClassTeacher] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [classmates, setClassmates] = useState([]);

  const [termFilter, setTermFilter] = useState("All");
  const [showClassmates, setShowClassmates] = useState(false);
  const [showTeachers, setShowTeachers] = useState(false);

  const classLevel = student?.classLevel || "";

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "users", studentId), (s) => setStudent(s.exists() ? s.data() : null));
    return () => unsub();
  }, [studentId]);

  useEffect(() => {
    const q = query(collection(db, "grades"), where("studentId", "==", studentId));
    const unsub = onSnapshot(q, (snap) => setGrades(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, [studentId]);

  useEffect(() => {
    const q = query(collection(db, "fees"), where("studentId", "==", studentId));
    const unsub = onSnapshot(q, (snap) => setFees(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, [studentId]);

  useEffect(() => {
    const q = query(collection(db, "attendance"), where("studentId", "==", studentId));
    const unsub = onSnapshot(q, (snap) => setAttendance(snap.docs.map((d) => d.data())));
    return () => unsub();
  }, [studentId]);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "attendance", `${studentId}_${localDate()}`), (s) =>
      setTodayRec(s.exists() ? s.data() : null)
    );
    return () => unsub();
  }, [studentId]);

  useEffect(() => {
    if (!classLevel || classLevel.includes("/")) { setClassTeacher(null); return; }
    const unsub = onSnapshot(doc(db, "classTeachers", classLevel), (s) => setClassTeacher(s.exists() ? s.data() : null));
    return () => unsub();
  }, [classLevel]);

  useEffect(() => {
    const q = query(collection(db, "users"), where("role", "==", "Teacher"));
    const unsub = onSnapshot(q, (snap) => setTeachers(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!showExtras || !classLevel) { setClassmates([]); return; }
    const q = query(collection(db, "users"), where("role", "==", "Student"), where("classLevel", "==", classLevel));
    const unsub = onSnapshot(q, (snap) => setClassmates(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, [showExtras, classLevel]);

  const allTerms = termFilter === "All";

  const termGrades = grades.filter((g) => g.subject && g.maxScore && (allTerms || g.term === termFilter));
  const groups = {};
  termGrades.forEach((g) => { (groups[g.subject] = groups[g.subject] || []).push(g); });
  const subjects = Object.entries(groups)
    .map(([subject, entries]) => {
      const totalScore = entries.reduce((sum, e) => sum + Number(e.score), 0);
      const totalMax = entries.reduce((sum, e) => sum + Number(e.maxScore), 0);
      const pct = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;
      return { subject, entries, totalScore, totalMax, pct, ...gradeInfo(pct) };
    })
    .sort((a, b) => a.subject.localeCompare(b.subject));
  const average = subjects.length ? Math.round(subjects.reduce((sum, x) => sum + x.pct, 0) / subjects.length) : 0;
  const overall = gradeInfo(average);

  const termFees = fees
    .filter((f) => f.totalDue !== undefined && f.amountPaid !== undefined && (allTerms || f.term === FEE_TERM[termFilter]))
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  const feeBilled = termFees.reduce((sum, f) => sum + Number(f.totalDue), 0);
  const feePaid = termFees.reduce((sum, f) => sum + Number(f.amountPaid), 0);
  const feeBalance = feeBilled - feePaid;

  const termAtt = attendance.filter((a) => allTerms || a.term === termFilter);
  const presentDays = termAtt.filter((a) => a.status === "Present" || a.status === "Late").length;
  const attPct = termAtt.length ? Math.round((presentDays / termAtt.length) * 100) : null;

  const ct = classTeacher && classTeacher.teacherName ? classTeacher : null;
  const ctDoc = ct ? teachers.find((t) => t.id === ct.teacherId) : null;
  const ctPhone = ctDoc?.phone ? String(ctDoc.phone).replace(/[^0-9+]/g, "") : "";

  const roster = [...classmates].sort((a, b) => (a.fullName || "").localeCompare(b.fullName || ""));
  const activeTeachers = teachers.filter((t) => t.status !== "disabled");
  const name = student?.fullName || fallbackName;

  const heading = { fontWeight: "800", color: theme.colors.text };
  const muted = { color: theme.colors.textMuted, margin: 0, fontSize: "14px" };

  return (
    <div>
      {!showExtras && (
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <Avatar name={name} photoURL={student?.photoURL} size={84} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: "800", fontSize: "18px", color: theme.colors.text }}>{name}</div>
              <div style={{ fontSize: "13px", color: theme.colors.textMuted, marginTop: "2px" }}>
                {classLevel || "-"}{student?.session ? ` • ${student.session}` : ""}
              </div>
              {student?.regNumber && (
                <div style={{ fontSize: "12px", color: theme.colors.primary, fontWeight: "700", marginTop: "4px" }}>{student.regNumber}</div>
              )}
            </div>
          </div>
        </Card>
      )}

      <div style={{ display: "flex", gap: "8px", overflowX: "auto", padding: "10px 0 4px" }}>
        {["All", ...TERMS].map((t) => (
          <button
            key={t}
            onClick={() => setTermFilter(t)}
            style={{
              flexShrink: 0,
              border: "none",
              borderRadius: "999px",
              padding: "8px 14px",
              fontSize: "12px",
              fontWeight: "700",
              background: termFilter === t ? theme.colors.primary : "#e6e8f5",
              color: termFilter === t ? "white" : theme.colors.textMuted
            }}
          >
            {t === "All" ? "All terms" : t}
          </button>
        ))}
      </div>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
          <div>
            <div style={heading}>Today's Attendance</div>
            <div style={{ fontSize: "12px", color: theme.colors.textMuted }}>
              {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
            </div>
          </div>
          <StatusPill label={todayRec?.status || "Not marked yet"} variant={TODAY_VARIANT[todayRec?.status] || "info"} />
        </div>
      </Card>

      {subjects.length === 0 ? (
        <Card>
          <p style={{ ...muted, textAlign: "center", padding: "10px 0" }}>No grades recorded for this period yet.</p>
        </Card>
      ) : (
        <>
          <div style={{ margin: "10px 0" }}>
            <StatCard
              label="Overall Average"
              value={`${average}%`}
              subLabel={`Grade ${overall.letter} • ${overall.label}`}
              badge={`${subjects.length} subject${subjects.length !== 1 ? "s" : ""}`}
              stats={[
                { value: subjects.length, label: "Subjects" },
                { value: attPct === null ? "-" : `${attPct}%`, label: "Attendance" },
                { value: termFees.length ? formatNaira(feeBalance) : "-", label: "Fee balance" }
              ]}
            />
          </div>

          <Card>
            <div style={{ ...heading, marginBottom: "6px" }}>My Grades</div>
            {subjects.map((x, i) => (
              <div key={x.subject} style={{ padding: "12px 0", borderTop: i > 0 ? `1px solid ${theme.colors.border}` : "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", marginBottom: "8px" }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: "700", color: theme.colors.text }}>{x.subject}</div>
                    <div style={{ fontSize: "12px", color: theme.colors.textMuted }}>
                      {x.entries.map((e) => `${e.testType || "Exam"} ${e.score}/${e.maxScore}`).join(" • ")}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontWeight: "800", color: pctColor(x.pct) }}>{x.pct}% • {x.letter}</div>
                    <div style={{ fontSize: "12px", color: theme.colors.textMuted }}>{x.totalScore}/{x.totalMax}</div>
                  </div>
                </div>
                <ProgressBar value={x.pct} max={100} height={6} color={pctColor(x.pct)} />
              </div>
            ))}
          </Card>
        </>
      )}

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <div style={heading}>Fees</div>
          {termFees.length > 0 && (
            <StatusPill
              label={feeBalance <= 0 ? "Cleared" : feePaid > 0 ? "Part Payment" : "Unpaid"}
              variant={feeBalance <= 0 ? "success" : feePaid > 0 ? "warning" : "danger"}
            />
          )}
        </div>
        {termFees.length === 0 ? (
          <p style={muted}>No fee records for this period.</p>
        ) : (
          <>
            <div style={{ display: "flex", textAlign: "center", marginBottom: "6px" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "800" }}>{formatNaira(feeBilled)}</div>
                <div style={{ fontSize: "12px", color: theme.colors.textMuted }}>Billed</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "800", color: theme.colors.success }}>{formatNaira(feePaid)}</div>
                <div style={{ fontSize: "12px", color: theme.colors.textMuted }}>Paid</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "800", color: feeBalance > 0 ? theme.colors.danger : theme.colors.success }}>{formatNaira(feeBalance)}</div>
                <div style={{ fontSize: "12px", color: theme.colors.textMuted }}>Balance</div>
              </div>
            </div>

            {termFees.map((f) => {
              const status = feeStatus(f);
              return (
                <div key={f.id} style={{ borderTop: `1px solid ${theme.colors.border}`, paddingTop: "12px", marginTop: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
                    <div>
                      <div style={{ fontWeight: "700", color: theme.colors.text }}>{f.feeType}</div>
                      <div style={{ fontSize: "12px", color: theme.colors.textMuted }}>
                        {f.term} • {formatNaira(f.amountPaid)} of {formatNaira(f.totalDue)}
                      </div>
                    </div>
                    <StatusPill label={status} variant={feeVariant(status)} />
                  </div>
                  <div style={{ margin: "10px 0" }}>
                    <ProgressBar value={f.amountPaid} max={f.totalDue} height={6} />
                  </div>
                  <button
                    onClick={() => printFeeReceipt(f)}
                    style={{
                      display: "flex", alignItems: "center", gap: "6px",
                      background: "white", color: theme.colors.primary,
                      border: `1.5px solid ${theme.colors.primary}`,
                      borderRadius: theme.radius.sm, padding: "8px 14px", fontWeight: "700", fontSize: "13px"
                    }}
                  >
                    <Download size={15} /> Download Receipt
                  </button>
                </div>
              );
            })}
          </>
        )}
      </Card>

      <Card>
        <div style={{ ...heading, marginBottom: "10px" }}>Class Teacher</div>
        {ct ? (
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Avatar name={ct.teacherName} photoURL={ctDoc?.photoURL} size={60} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: "700", color: theme.colors.text }}>{ct.teacherName}</div>
              <div style={{ fontSize: "12px", color: theme.colors.textMuted }}>{classLevel}</div>
            </div>
            {ctPhone && (
              <a
                href={`tel:${ctPhone}`}
                style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  background: theme.colors.primary, color: "white", textDecoration: "none",
                  borderRadius: theme.radius.sm, padding: "9px 14px", fontWeight: "700", fontSize: "13px"
                }}
              >
                <Phone size={15} /> Call
              </a>
            )}
          </div>
        ) : (
          <p style={muted}>No class teacher assigned yet.</p>
        )}
      </Card>

      {showExtras && (
        <>
          <Card style={{ padding: 0, overflow: "hidden" }}>
            <div
              onClick={() => setShowClassmates(!showClassmates)}
              style={{ padding: "16px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
            >
              <div style={heading}>Classmates ({roster.length})</div>
              {showClassmates ? <ChevronUp size={20} color={theme.colors.textMuted} /> : <ChevronDown size={20} color={theme.colors.textMuted} />}
            </div>
            {showClassmates && (
              <div style={{ borderTop: `1px solid ${theme.colors.border}` }}>
                {roster.length === 0 ? (
                  <p style={{ ...muted, padding: "14px 16px" }}>No classmates found.</p>
                ) : (
                  roster.map((c, i) => (
                    <div
                      key={c.id}
                      style={{
                        display: "flex", alignItems: "center", gap: "12px", padding: "10px 16px",
                        borderBottom: "1px solid #f1f1f8",
                        background: c.id === studentId ? "#f5f6ff" : "transparent"
                      }}
                    >
                      <span style={{ width: "22px", fontWeight: "700", color: theme.colors.textMuted, fontSize: "13px" }}>{i + 1}</span>
                      <Avatar name={c.fullName} photoURL={c.photoURL} size={40} />
                      <span style={{ flex: 1, fontSize: "14px", fontWeight: "600", color: theme.colors.text }}>{c.fullName}</span>
                      {c.id === studentId && <StatusPill label="You" variant="info" />}
                    </div>
                  ))
                )}
              </div>
            )}
          </Card>

          <Card style={{ padding: 0, overflow: "hidden" }}>
            <div
              onClick={() => setShowTeachers(!showTeachers)}
              style={{ padding: "16px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
            >
              <div style={heading}>Our Teachers ({activeTeachers.length})</div>
              {showTeachers ? <ChevronUp size={20} color={theme.colors.textMuted} /> : <ChevronDown size={20} color={theme.colors.textMuted} />}
            </div>
            {showTeachers && (
              <div style={{ borderTop: `1px solid ${theme.colors.border}` }}>
                {activeTeachers.length === 0 ? (
                  <p style={{ ...muted, padding: "14px 16px" }}>No teachers registered yet.</p>
                ) : (
                  activeTeachers.map((t) => (
                    <div key={t.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 16px", borderBottom: "1px solid #f1f1f8" }}>
                      <Avatar name={t.fullName} photoURL={t.photoURL} size={44} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "14px", fontWeight: "700", color: theme.colors.text }}>{t.fullName}</div>
                        <div style={{ fontSize: "12px", color: theme.colors.textMuted }}>
                          {(t.subjects || []).length ? t.subjects.join(", ") : "Teacher"}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}