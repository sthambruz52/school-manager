import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, query, where, onSnapshot, doc, setDoc } from "firebase/firestore";
import { Printer } from "lucide-react";
import { theme, formatNaira } from "../theme";
import Header from "./ui/Header";
import Card from "./ui/Card";
import Avatar from "./ui/Avatar";
import StatCard from "./ui/StatCard";
import StatusPill from "./ui/StatusPill";
import ProgressBar from "./ui/ProgressBar";
import { printReportCard, gradeInfo } from "../utils/printReportCard";

const DEFAULT_CLASSES = [
  "Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6",
  "JSS1", "JSS2", "JSS3",
  "SS1", "SS2", "SS3"
];
const TERMS = ["First Term", "Second Term", "Third Term"];
const FEE_TERM = { "First Term": "Term 1", "Second Term": "Term 2", "Third Term": "Term 3" };
const LETTERS = [["A", "Excellent"], ["B", "Very Good"], ["C", "Good"], ["D", "Fair"], ["F", "Poor"]];
const OTHER_VALUE = "__OTHER__";

const fieldStyle = {
  padding: "10px",
  borderRadius: theme.radius.sm,
  border: `1px solid ${theme.colors.border}`,
  background: "white",
  fontSize: "14px",
  flex: "1 1 140px",
  minWidth: 0
};

const pctColor = (pct) => (pct >= 60 ? theme.colors.success : pct >= 40 ? theme.colors.warning : theme.colors.danger);

export default function ReportCard({ isAdmin, fixedStudentId, fixedStudentName }) {
  const [students, setStudents] = useState([]);
  const [classSelect, setClassSelect] = useState("");
  const [manualClass, setManualClass] = useState("");
  const [studentId, setStudentId] = useState(fixedStudentId || "");
  const [session, setSession] = useState("");
  const [term, setTerm] = useState("");

  const [schoolInfo, setSchoolInfo] = useState(null);
  const [contactInfo, setContactInfo] = useState(null);
  const [studentDoc, setStudentDoc] = useState(null);
  const [grades, setGrades] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [fees, setFees] = useState([]);
  const [remark, setRemark] = useState("");
  const [savingRemark, setSavingRemark] = useState(false);

  const isManualClass = classSelect === OTHER_VALUE;
  const classFilter = isManualClass ? manualClass.trim() : classSelect;
  const activeStudentId = fixedStudentId || studentId;

  useEffect(() => {
    if (!isAdmin || fixedStudentId) return;
    const q = query(collection(db, "users"), where("role", "==", "Student"));
    const unsub = onSnapshot(q, (snap) => setStudents(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, [isAdmin, fixedStudentId]);

  useEffect(() => {
    const u1 = onSnapshot(doc(db, "settings", "schoolInfo"), (s) => { if (s.exists()) setSchoolInfo(s.data()); });
    const u2 = onSnapshot(doc(db, "settings", "contactInfo"), (s) => { if (s.exists()) setContactInfo(s.data()); });
    return () => { u1(); u2(); };
  }, []);

  useEffect(() => {
    if (!activeStudentId) { setStudentDoc(null); return; }
    const unsub = onSnapshot(doc(db, "users", activeStudentId), (s) => setStudentDoc(s.exists() ? s.data() : null));
    return () => unsub();
  }, [activeStudentId]);

  useEffect(() => {
    if (!activeStudentId) { setGrades([]); return; }
    const q = query(collection(db, "grades"), where("studentId", "==", activeStudentId));
    const unsub = onSnapshot(q, (snap) => {
      let data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      if (term) data = data.filter((g) => g.term === term);
      setGrades(data);
    });
    return () => unsub();
  }, [activeStudentId, term]);

  useEffect(() => {
    if (!activeStudentId) { setAttendance([]); return; }
    const q = query(collection(db, "attendance"), where("studentId", "==", activeStudentId));
    const unsub = onSnapshot(q, (snap) => {
      let data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      if (session) data = data.filter((a) => a.session === session);
      if (term) data = data.filter((a) => a.term === term);
      setAttendance(data);
    });
    return () => unsub();
  }, [activeStudentId, session, term]);

  useEffect(() => {
    if (!activeStudentId) { setFees([]); return; }
    const q = query(collection(db, "fees"), where("studentId", "==", activeStudentId));
    const unsub = onSnapshot(q, (snap) => {
      let data = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((f) => f.totalDue !== undefined && f.amountPaid !== undefined);
      if (term) data = data.filter((f) => f.term === FEE_TERM[term]);
      setFees(data);
    });
    return () => unsub();
  }, [activeStudentId, term]);

  useEffect(() => {
    if (!activeStudentId || !session || !term) { setRemark(""); return; }
    const unsub = onSnapshot(doc(db, "reportRemarks", `${activeStudentId}_${session}_${term}`), (s) => {
      setRemark(s.exists() ? s.data().remark || "" : "");
    });
    return () => unsub();
  }, [activeStudentId, session, term]);

  const saveRemark = async () => {
    if (!activeStudentId || !session || !term) return alert("Select session and term first.");
    setSavingRemark(true);
    await setDoc(doc(db, "reportRemarks", `${activeStudentId}_${session}_${term}`), {
      studentId: activeStudentId, session, term, remark
    });
    setSavingRemark(false);
  };

  const extraClasses = [...new Set(students.map((s) => s.classLevel).filter(Boolean))]
    .filter((c) => !DEFAULT_CLASSES.includes(c));
  const classOptions = [...DEFAULT_CLASSES, ...extraClasses];
  const pickableStudents = students
    .filter((s) => !classFilter || s.classLevel === classFilter)
    .sort((a, b) => (a.fullName || "").localeCompare(b.fullName || ""));

  const student = studentDoc || {};
  const studentName = student.fullName || fixedStudentName || "";

  const groups = {};
  grades.forEach((g) => {
    if (!g.subject || !g.maxScore) return;
    (groups[g.subject] = groups[g.subject] || []).push(g);
  });

  const subjects = Object.entries(groups)
    .map(([subject, entries]) => {
      const totalScore = entries.reduce((sum, e) => sum + Number(e.score), 0);
      const totalMax = entries.reduce((sum, e) => sum + Number(e.maxScore), 0);
      const pct = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;
      return { subject, entries, totalScore, totalMax, pct, ...gradeInfo(pct) };
    })
    .sort((a, b) => a.subject.localeCompare(b.subject));

  const average = subjects.length
    ? Math.round(subjects.reduce((sum, x) => sum + x.pct, 0) / subjects.length)
    : 0;
  const overall = gradeInfo(average);
  const byPct = [...subjects].sort((a, b) => b.pct - a.pct);
  const best = byPct[0];
  const lowest = byPct[byPct.length - 1];

  const presentDays = attendance.filter((a) => a.status === "Present" || a.status === "Late").length;
  const totalDays = attendance.length;
  const attendancePct = totalDays ? Math.round((presentDays / totalDays) * 100) : null;

  const feeBilled = fees.reduce((sum, f) => sum + Number(f.totalDue), 0);
  const feePaid = fees.reduce((sum, f) => sum + Number(f.amountPaid), 0);
  const feeBalance = feeBilled - feePaid;

  const handlePrint = () =>
    printReportCard({
      accent: schoolInfo?.accentColor,
      school: schoolInfo,
      contact: contactInfo,
      student: { ...student, fullName: studentName },
      session,
      term,
      subjects,
      average,
      attendance: { present: presentDays, total: totalDays, pct: attendancePct },
      fees: fees.length ? { billed: feeBilled, paid: feePaid, balance: feeBalance } : null,
      remark
    });

  return (
    <div style={{ marginTop: "10px" }}>
      <Header
        title="Report Card"
        subtitle="Termly results and remarks"
        rightSlot={
          activeStudentId ? (
            <button
              onClick={handlePrint}
              style={{
                background: "rgba(255,255,255,0.2)", color: "white", border: "none",
                borderRadius: theme.radius.sm, padding: "8px 12px", fontWeight: "700", fontSize: "13px",
                display: "flex", alignItems: "center", gap: "6px"
              }}
            >
              <Printer size={16} /> Print
            </button>
          ) : null
        }
      />

      <Card>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
          {isAdmin && !fixedStudentId && (
            <>
              <select value={classSelect} onChange={(e) => { setClassSelect(e.target.value); setStudentId(""); }} style={fieldStyle}>
                <option value="">All classes</option>
                {classOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                <option value={OTHER_VALUE}>Manual Input</option>
              </select>
              {isManualClass && (
                <input value={manualClass} onChange={(e) => { setManualClass(e.target.value); setStudentId(""); }} placeholder="Type class name" style={fieldStyle} />
              )}
              <select value={studentId} onChange={(e) => setStudentId(e.target.value)} style={fieldStyle}>
                <option value="">Select student</option>
                {pickableStudents.map((s) => <option key={s.id} value={s.id}>{s.fullName}</option>)}
              </select>
            </>
          )}
          <input value={session} onChange={(e) => setSession(e.target.value)} placeholder="Session (e.g. 2025/2026)" style={fieldStyle} />
          <select value={term} onChange={(e) => setTerm(e.target.value)} style={fieldStyle}>
            <option value="">All terms</option>
            {TERMS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </Card>

      {!activeStudentId ? (
        <p style={{ textAlign: "center", color: theme.colors.textMuted, margin: "30px 0" }}>
          Select a student to see their report card.
        </p>
      ) : (
        <>
          <Card>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <Avatar name={studentName} photoURL={student.photoURL} size={92} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: "800", fontSize: "18px", color: theme.colors.text }}>{studentName}</div>
                <div style={{ fontSize: "13px", color: theme.colors.textMuted, marginTop: "2px" }}>
                  {student.classLevel || "-"}{session ? ` • ${session}` : ""}{term ? ` • ${term}` : ""}
                </div>
                {student.regNumber && (
                  <div style={{ fontSize: "12px", color: theme.colors.primary, fontWeight: "700", marginTop: "4px" }}>{student.regNumber}</div>
                )}
              </div>
            </div>
          </Card>

          {subjects.length === 0 ? (
            <Card>
              <p style={{ textAlign: "center", color: theme.colors.textMuted, margin: "10px 0" }}>
                No grades recorded for this period.
              </p>
            </Card>
          ) : (
            <>
              <div style={{ margin: "10px 0" }}>
                <StatCard
                  label="Overall Result"
                  value={`${average}%`}
                  subLabel={`Grade ${overall.letter} • ${overall.label}`}
                  badge={`${subjects.length} subject${subjects.length !== 1 ? "s" : ""}`}
                  stats={[
                    { value: best ? `${best.pct}%` : "-", label: "Best" },
                    { value: lowest ? `${lowest.pct}%` : "-", label: "Lowest" },
                    { value: attendancePct === null ? "-" : `${attendancePct}%`, label: "Attendance" }
                  ]}
                />
              </div>

              <Card>
                <div style={{ fontWeight: "800", marginBottom: "6px", color: theme.colors.text }}>Subject Results</div>
                {subjects.map((x, i) => (
                  <div key={x.subject} style={{ padding: "12px 0", borderTop: i > 0 ? `1px solid ${theme.colors.border}` : "none" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px", marginBottom: "8px" }}>
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

              <Card>
                <div style={{ fontWeight: "800", marginBottom: "10px", color: theme.colors.text }}>Grade Analysis</div>
                {LETTERS.map(([letter, label]) => {
                  const count = subjects.filter((x) => x.letter === letter).length;
                  return (
                    <div key={letter} style={{ display: "flex", alignItems: "center", gap: "10px", margin: "8px 0" }}>
                      <div style={{ width: "92px", fontSize: "13px", color: theme.colors.text }}>
                        <strong>{letter}</strong> <span style={{ color: theme.colors.textMuted }}>{label}</span>
                      </div>
                      <div style={{ flex: 1 }}>
                        <ProgressBar value={count} max={subjects.length} height={8} color={theme.colors.primaryLight} />
                      </div>
                      <div style={{ width: "20px", textAlign: "right", fontWeight: "700", fontSize: "13px" }}>{count}</div>
                    </div>
                  );
                })}
              </Card>
            </>
          )}

          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <div style={{ fontWeight: "800", color: theme.colors.text }}>Fees{term ? ` • ${FEE_TERM[term]}` : ""}</div>
              {fees.length > 0 && (
                <StatusPill
                  label={feeBalance <= 0 ? "Cleared" : feePaid > 0 ? "Part Payment" : "Unpaid"}
                  variant={feeBalance <= 0 ? "success" : feePaid > 0 ? "warning" : "danger"}
                />
              )}
            </div>
            {fees.length === 0 ? (
              <p style={{ color: theme.colors.textMuted, margin: 0, fontSize: "14px" }}>No fee records for this period.</p>
            ) : (
              <div style={{ display: "flex", textAlign: "center" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: "800", fontSize: "15px" }}>{formatNaira(feeBilled)}</div>
                  <div style={{ fontSize: "12px", color: theme.colors.textMuted }}>Billed</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: "800", fontSize: "15px", color: theme.colors.success }}>{formatNaira(feePaid)}</div>
                  <div style={{ fontSize: "12px", color: theme.colors.textMuted }}>Paid</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: "800", fontSize: "15px", color: feeBalance > 0 ? theme.colors.danger : theme.colors.success }}>
                    {formatNaira(feeBalance)}
                  </div>
                  <div style={{ fontSize: "12px", color: theme.colors.textMuted }}>Balance</div>
                </div>
              </div>
            )}
          </Card>

          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <div style={{ fontWeight: "800", color: theme.colors.text }}>Attendance</div>
              {attendancePct !== null && (
                <StatusPill label={`${attendancePct}%`} variant={attendancePct >= 75 ? "success" : attendancePct >= 50 ? "warning" : "danger"} />
              )}
            </div>
            {totalDays === 0 ? (
              <p style={{ color: theme.colors.textMuted, margin: 0, fontSize: "14px" }}>No attendance records for this period yet.</p>
            ) : (
              <>
                <div style={{ fontSize: "14px", marginBottom: "8px" }}>{presentDays} of {totalDays} days present</div>
                <ProgressBar value={presentDays} max={totalDays} />
              </>
            )}
          </Card>

          <Card>
            <div style={{ fontWeight: "800", marginBottom: "10px", color: theme.colors.text }}>Class Teacher's Remark</div>
            {isAdmin ? (
              <>
                <textarea
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  rows={3}
                  placeholder="Write a remark..."
                  style={{ ...fieldStyle, width: "100%", boxSizing: "border-box", resize: "vertical", fontFamily: "Arial" }}
                />
                <button
                  onClick={saveRemark}
                  disabled={savingRemark}
                  style={{ marginTop: "10px", width: "100%", background: theme.colors.primary, color: "white", border: "none", padding: "12px", borderRadius: theme.radius.md, fontWeight: "700" }}
                >
                  {savingRemark ? "Saving..." : "Save Remark"}
                </button>
                {(!session || !term) && (
                  <p style={{ fontSize: "12px", color: theme.colors.textMuted, margin: "8px 0 0" }}>
                    Choose a session and a term above before saving a remark.
                  </p>
                )}
              </>
            ) : (
              <p style={{ fontStyle: "italic", margin: 0, color: theme.colors.text }}>{remark || "No remark yet."}</p>
            )}
          </Card>
        </>
      )}
    </div>
  );
}