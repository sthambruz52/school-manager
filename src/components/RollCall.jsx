import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, query, where, onSnapshot, doc, writeBatch, updateDoc } from "firebase/firestore";
import { Check, Clock, X, ChevronDown, ChevronUp } from "lucide-react";
import { theme } from "../theme";
import Header from "./ui/Header";
import Card from "./ui/Card";
import Avatar from "./ui/Avatar";
import ProgressBar from "./ui/ProgressBar";
import StatusPill from "./ui/StatusPill";

const STATUSES = ["Present", "Late", "Absent"];
const STATUS_META = {
  Present: { color: theme.colors.success, icon: Check },
  Late: { color: theme.colors.warning, icon: Clock },
  Absent: { color: theme.colors.danger, icon: X }
};
const MODES = [["today", "Today"], ["single", "Single Day"], ["range", "Range"]];

const localDate = (d = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const prettyDate = (str) => {
  const d = new Date(str + "T00:00:00");
  if (isNaN(d.getTime())) return str;
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
};

const fieldStyle = {
  padding: "10px",
  borderRadius: theme.radius.sm,
  border: `1px solid ${theme.colors.border}`,
  background: "white",
  fontSize: "14px",
  minWidth: 0
};

export default function RollCall() {
  const today = localDate();
  const [students, setStudents] = useState([]);
  const [records, setRecords] = useState([]);
  const [mode, setMode] = useState("today");
  const [singleDate, setSingleDate] = useState(today);
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [openClass, setOpenClass] = useState(null);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);

  const isRange = mode === "range";
  const activeDate = mode === "today" ? today : singleDate;
  const rangeInvalid = isRange && fromDate > toDate;

  useEffect(() => {
    const q = query(collection(db, "users"), where("role", "==", "Student"));
    const unsub = onSnapshot(q, (snap) => setStudents(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, []);

  useEffect(() => {
    let q;
    if (isRange) {
      if (!fromDate || !toDate || fromDate > toDate) { setRecords([]); return; }
      q = query(collection(db, "attendance"), where("date", ">=", fromDate), where("date", "<=", toDate));
    } else {
      if (!activeDate) { setRecords([]); return; }
      q = query(collection(db, "attendance"), where("date", "==", activeDate));
    }
    const unsub = onSnapshot(q, (snap) => setRecords(snap.docs.map((d) => d.data())));
    return () => unsub();
  }, [isRange, activeDate, fromDate, toDate]);

  const statusOf = (sid) => records.find((r) => r.studentId === sid)?.status || "";

  const rangeStats = (sid) => {
    const rs = records.filter((r) => r.studentId === sid);
    const p = rs.filter((r) => r.status === "Present").length;
    const l = rs.filter((r) => r.status === "Late").length;
    const a = rs.filter((r) => r.status === "Absent").length;
    const total = p + l + a;
    return { p, l, a, total, pct: total ? Math.round(((p + l) / total) * 100) : null };
  };

  const classNames = [...new Set(students.map((s) => s.classLevel).filter(Boolean))].sort();
  const rosterFor = (cls) =>
    students
      .filter((s) => s.classLevel === cls)
      .sort((a, b) => (a.fullName || "").localeCompare(b.fullName || ""))
      .map((s, i) => ({ ...s, roll: i + 1 }));

  const marked = students.filter((s) => statusOf(s.id)).length;
  const presentish = students.filter((s) => ["Present", "Late"].includes(statusOf(s.id))).length;

  const rangeTotals = students.reduce((acc, s) => {
    const st = rangeStats(s.id);
    acc.good += st.p + st.l;
    acc.total += st.total;
    return acc;
  }, { good: 0, total: 0 });
  const overallPct = rangeTotals.total ? Math.round((rangeTotals.good / rangeTotals.total) * 100) : null;

  const mark = async (list, status) => {
    if (list.length === 0) return;
    try {
      const batch = writeBatch(db);
      list.forEach((s) => {
        batch.set(doc(db, "attendance", `${s.id}_${activeDate}`), {
          studentId: s.id,
          date: activeDate,
          status,
          classLevel: s.classLevel || "",
          session: s.session || "",
          term: s.term || ""
        }, { merge: true });
      });
      await batch.commit();
    } catch (err) {
      alert("Could not save attendance. Check your connection and try again.");
      return;
    }

    if (activeDate === today) {
      await Promise.allSettled(
        list.map((s) => updateDoc(doc(db, "users", s.id), { present: status !== "Absent" }))
      );
    }
  };

  const markClass = async (cls, roster, status) => {
    if (!window.confirm(`Mark all ${roster.length} students in ${cls} as ${status}?`)) return;
    setBusy(true);
    await mark(roster, status);
    setBusy(false);
  };

  return (
    <div style={{ marginTop: "10px" }}>
      <Header title="Roll Call" subtitle="Mark and review attendance" />

      <div style={{ display: "flex", background: "#e6e8f5", borderRadius: theme.radius.md, padding: "4px", margin: "14px 0" }}>
        {MODES.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setMode(key)}
            style={{
              flex: 1,
              border: "none",
              borderRadius: theme.radius.sm,
              padding: "10px 4px",
              fontWeight: "700",
              fontSize: "13px",
              background: mode === key ? theme.colors.primary : "transparent",
              color: mode === key ? "white" : theme.colors.textMuted
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <Card>
        {mode === "today" && (
          <div style={{ fontWeight: "700", color: theme.colors.text }}>Today • {prettyDate(today)}</div>
        )}
        {mode === "single" && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "13px", color: theme.colors.textMuted }}>Date</span>
            <input
              type="date"
              value={singleDate}
              max={today}
              onChange={(e) => setSingleDate(e.target.value || today)}
              style={{ ...fieldStyle, flex: "0 1 180px" }}
            />
            <span style={{ fontSize: "13px", color: theme.colors.textMuted }}>{prettyDate(singleDate)}</span>
          </div>
        )}
        {isRange && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "13px", color: theme.colors.textMuted }}>From</span>
            <input type="date" value={fromDate} max={today} onChange={(e) => setFromDate(e.target.value || today)} style={{ ...fieldStyle, flex: "0 1 160px" }} />
            <span style={{ fontSize: "13px", color: theme.colors.textMuted }}>To</span>
            <input type="date" value={toDate} max={today} onChange={(e) => setToDate(e.target.value || today)} style={{ ...fieldStyle, flex: "0 1 160px" }} />
            {rangeInvalid && (
              <span style={{ fontSize: "12px", color: theme.colors.danger, width: "100%" }}>The start date must be before the end date.</span>
            )}
          </div>
        )}
      </Card>

      {students.length === 0 ? (
        <p style={{ textAlign: "center", color: theme.colors.textMuted, margin: "30px 0" }}>No students registered yet.</p>
      ) : (
        <>
          <Card>
            {isRange ? (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "8px" }}>
                  <strong>Overall attendance</strong>
                  <span style={{ color: theme.colors.textMuted }}>{overallPct === null ? "No records" : `${overallPct}%`}</span>
                </div>
                <ProgressBar value={overallPct || 0} max={100} />
              </>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "8px" }}>
                  <strong>{presentish} present or late</strong>
                  <span style={{ color: theme.colors.textMuted }}>{marked} / {students.length} marked</span>
                </div>
                <ProgressBar value={marked} max={students.length || 1} />
              </>
            )}
          </Card>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student..."
            style={{ ...fieldStyle, width: "100%", boxSizing: "border-box", margin: "6px 0 4px" }}
          />

          {classNames.map((cls) => {
            const roster = rosterFor(cls);
            const visible = roster.filter((s) => !search || (s.fullName || "").toLowerCase().includes(search.toLowerCase()));
            if (visible.length === 0) return null;

            const isOpen = openClass === cls || !!search;
            const classMarked = roster.filter((s) => statusOf(s.id)).length;
            const classTotals = roster.reduce((acc, s) => {
              const st = rangeStats(s.id);
              acc.good += st.p + st.l;
              acc.total += st.total;
              return acc;
            }, { good: 0, total: 0 });
            const classPct = classTotals.total ? Math.round((classTotals.good / classTotals.total) * 100) : null;

            return (
              <Card key={cls} style={{ padding: 0, overflow: "hidden" }}>
                <div
                  onClick={() => setOpenClass(openClass === cls ? null : cls)}
                  style={{ padding: "14px 16px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                >
                  <div>
                    <div style={{ fontWeight: "700", color: theme.colors.text }}>{cls}</div>
                    <div style={{ fontSize: "12px", color: theme.colors.textMuted }}>
                      {isRange
                        ? (classPct === null ? "No records" : `${classPct}% attendance`)
                        : `${classMarked} / ${roster.length} marked`}
                    </div>
                  </div>
                  {isOpen ? <ChevronUp size={20} color={theme.colors.textMuted} /> : <ChevronDown size={20} color={theme.colors.textMuted} />}
                </div>

                {isOpen && (
                  <div style={{ borderTop: `1px solid ${theme.colors.border}` }}>
                    {!isRange && (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px", background: "#f8f8fd", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "12px", fontWeight: "700", color: theme.colors.textMuted }}>Mark whole class:</span>
                        {STATUSES.map((st) => (
                          <button
                            key={st}
                            disabled={busy}
                            onClick={() => markClass(cls, roster, st)}
                            style={{
                              border: `1.5px solid ${STATUS_META[st].color}`,
                              background: "white",
                              color: STATUS_META[st].color,
                              borderRadius: "999px",
                              padding: "5px 12px",
                              fontSize: "12px",
                              fontWeight: "700"
                            }}
                          >
                            {busy ? "..." : st}
                          </button>
                        ))}
                      </div>
                    )}

                    {visible.map((s) => {
                      const current = statusOf(s.id);
                      const st = isRange ? rangeStats(s.id) : null;
                      return (
                        <div
                          key={s.id}
                          style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 16px", borderBottom: "1px solid #f1f1f8" }}
                        >
                          <Avatar name={s.fullName} photoURL={s.photoURL} size={40} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: "600", fontSize: "14px", color: theme.colors.text }}>{s.fullName}</div>
                            <div style={{ fontSize: "12px", color: theme.colors.textMuted }}>
                              {isRange ? `Present ${st.p} • Late ${st.l} • Absent ${st.a}` : `#${s.roll}`}
                            </div>
                          </div>

                          {isRange ? (
                            st.pct === null ? (
                              <StatusPill label="No records" variant="info" />
                            ) : (
                              <StatusPill label={`${st.pct}%`} variant={st.pct >= 75 ? "success" : st.pct >= 50 ? "warning" : "danger"} />
                            )
                          ) : (
                            <div style={{ display: "flex", gap: "6px" }}>
                              {STATUSES.map((status) => {
                                const meta = STATUS_META[status];
                                const Icon = meta.icon;
                                const active = current === status;
                                return (
                                  <button
                                    key={status}
                                    title={status}
                                    aria-label={status}
                                    onClick={() => mark([s], status)}
                                    style={{
                                      width: "38px",
                                      height: "38px",
                                      padding: 0,
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      borderRadius: theme.radius.sm,
                                      border: `1.5px solid ${meta.color}`,
                                      background: active ? meta.color : "white",
                                      color: active ? "white" : meta.color
                                    }}
                                  >
                                    <Icon size={18} />
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            );
          })}
        </>
      )}
    </div>
  );
}