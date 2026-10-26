import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, addDoc, updateDoc, doc, onSnapshot } from "firebase/firestore";
import { Plus, X } from "lucide-react";
import { theme, formatNaira } from "../theme";
import Header from "./ui/Header";
import Card from "./ui/Card";
import Avatar from "./ui/Avatar";
import StatusPill from "./ui/StatusPill";
import ProgressBar from "./ui/ProgressBar";
import StatCard from "./ui/StatCard";
import { printFeeReceipt } from "../utils/printReceipt";

const FEE_TYPES = ["School Fees", "Exam Fees", "PTA Fees", "Other"];
const CLASS_LEVELS = [
  "Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6",
  "JSS1", "JSS2", "JSS3",
  "SS1", "SS2", "SS3"
];
const FILTERS = ["All", "Unpaid", "Part Payment", "Full Payment"];
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

const paymentStatus = (fee) =>
  fee.amountPaid >= fee.totalDue ? "Full Payment" : fee.amountPaid > 0 ? "Part Payment" : "Unpaid";

const statusVariant = (status) =>
  status === "Full Payment" ? "success" : status === "Part Payment" ? "warning" : "danger";

export default function Fees({ students }) {
  const [fees, setFees] = useState([]);
  const [showForm, setShowForm] = useState(false);

  const [classSelect, setClassSelect] = useState("");
  const [manualClass, setManualClass] = useState("");
  const [studentId, setStudentId] = useState("");
  const [feeTypeSelect, setFeeTypeSelect] = useState("School Fees");
  const [manualFeeType, setManualFeeType] = useState("");
  const [term, setTerm] = useState("Term 1");
  const [totalDue, setTotalDue] = useState("");
  const [amountPaid, setAmountPaid] = useState("");

  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [payingId, setPayingId] = useState(null);
  const [payAmount, setPayAmount] = useState("");
  const [receiptFee, setReceiptFee] = useState(null);

  const isManualClass = classSelect === OTHER_VALUE;
  const classFilter = isManualClass ? manualClass.trim() : classSelect;
  const isManualFeeType = feeTypeSelect === OTHER_VALUE;
  const finalFeeType = isManualFeeType ? manualFeeType.trim() : feeTypeSelect;

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "fees"), (snap) => {
      setFees(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const extraClasses = [...new Set(students.map((s) => s.classLevel).filter(Boolean))]
    .filter((c) => !CLASS_LEVELS.includes(c));
  const classOptions = [...CLASS_LEVELS, ...extraClasses];
  const formStudents = students.filter((s) => !classFilter || s.classLevel === classFilter);

  const addFee = async () => {
    if (!studentId || !totalDue || !amountPaid) return alert("Select a student and fill in the amounts.");
    if (!finalFeeType) return alert("Select or type a fee type.");
    if (Number(amountPaid) < 0 || Number(totalDue) <= 0) return alert("Amounts must be positive numbers.");
    if (Number(amountPaid) > Number(totalDue)) return alert("Amount paid cannot exceed the total due.");

    const student = students.find((s) => s.id === studentId);
    await addDoc(collection(db, "fees"), {
      studentId,
      studentName: student?.name || studentId,
      classLevel: student?.classLevel || "",
      feeType: finalFeeType,
      totalDue: Number(totalDue),
      amountPaid: Number(amountPaid),
      term,
      date: new Date().toISOString()
    });
    setTotalDue("");
    setAmountPaid("");
  };

  const confirmPayment = async (fee) => {
    const extra = Number(payAmount);
    const balance = fee.totalDue - fee.amountPaid;
    if (!(extra > 0)) return alert("Enter an amount greater than zero.");
    if (extra > balance) return alert(`That is more than the balance of ${formatNaira(balance)}.`);
    await updateDoc(doc(db, "fees", fee.id), { amountPaid: fee.amountPaid + extra });
    setPayingId(null);
    setPayAmount("");
  };

  const validFees = fees.filter((f) => f.totalDue !== undefined && f.amountPaid !== undefined);
  const totalBilled = validFees.reduce((sum, f) => sum + f.totalDue, 0);
  const totalPaid = validFees.reduce((sum, f) => sum + f.amountPaid, 0);
  const outstanding = totalBilled - totalPaid;
  const collectionPct = totalBilled > 0 ? Math.round((totalPaid / totalBilled) * 100) : 0;

  const counts = {
    All: validFees.length,
    Unpaid: validFees.filter((f) => paymentStatus(f) === "Unpaid").length,
    "Part Payment": validFees.filter((f) => paymentStatus(f) === "Part Payment").length,
    "Full Payment": validFees.filter((f) => paymentStatus(f) === "Full Payment").length
  };

  const visibleFees = validFees
    .filter((f) => filter === "All" || paymentStatus(f) === filter)
    .filter((f) => !search || (f.studentName || "").toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  return (
    <div style={{ marginTop: "10px" }}>
      <Header
        title="Fees"
        subtitle="Track payments and issue receipts"
        rightSlot={
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              background: "rgba(255,255,255,0.2)", color: "white", border: "none",
              borderRadius: theme.radius.sm, padding: "8px 12px", fontWeight: "700", fontSize: "13px",
              display: "flex", alignItems: "center", gap: "4px"
            }}
          >
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? "Close" : "New Fee"}
          </button>
        }
      />

      <div style={{ margin: "14px 0" }}>
        <StatCard
          label="Fees Overview"
          value={`${collectionPct}%`}
          subLabel="collected"
          badge={`${validFees.length} records`}
          gradientFrom="#059669"
          gradientTo="#047857"
          stats={[
            { value: formatNaira(totalPaid), label: "Collected" },
            { value: formatNaira(totalBilled), label: "Billed" },
            { value: formatNaira(outstanding), label: "Outstanding" }
          ]}
        />
      </div>

      {showForm && (
        <Card>
          <div style={{ fontWeight: "700", marginBottom: "10px", color: theme.colors.text }}>Record a new fee</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            <select value={classSelect} onChange={(e) => { setClassSelect(e.target.value); setStudentId(""); }} style={fieldStyle}>
              <option value="">Select class</option>
              {classOptions.map((c) => <option key={c} value={c}>{c}</option>)}
              <option value={OTHER_VALUE}>Manual Input</option>
            </select>
            {isManualClass && (
              <input value={manualClass} onChange={(e) => { setManualClass(e.target.value); setStudentId(""); }} placeholder="Type class name" style={fieldStyle} />
            )}

            <select value={studentId} onChange={(e) => setStudentId(e.target.value)} style={fieldStyle}>
              <option value="">Select student</option>
              {formStudents.map((s) => <option key={s.id} value={s.id}>{s.name} — {s.classLevel}</option>)}
            </select>

            <select value={feeTypeSelect} onChange={(e) => setFeeTypeSelect(e.target.value)} style={fieldStyle}>
              {FEE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              <option value={OTHER_VALUE}>Manual Input</option>
            </select>
            {isManualFeeType && (
              <input value={manualFeeType} onChange={(e) => setManualFeeType(e.target.value)} placeholder="Type fee name" style={fieldStyle} />
            )}

            <select value={term} onChange={(e) => setTerm(e.target.value)} style={fieldStyle}>
              <option>Term 1</option>
              <option>Term 2</option>
              <option>Term 3</option>
            </select>

            <input type="number" inputMode="decimal" placeholder="Total due (₦)" value={totalDue} onChange={(e) => setTotalDue(e.target.value)} style={fieldStyle} />
            <input type="number" inputMode="decimal" placeholder="Amount paid (₦)" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} style={fieldStyle} />
          </div>
          <button
            onClick={addFee}
            style={{ width: "100%", marginTop: "12px", background: theme.colors.primary, color: "white", border: "none", padding: "12px", borderRadius: theme.radius.md, fontWeight: "700" }}
          >
            Add Fee
          </button>
        </Card>
      )}

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by student name..."
        style={{ ...fieldStyle, width: "100%", boxSizing: "border-box", margin: "6px 0 10px" }}
      />

      <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "6px" }}>
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              flexShrink: 0,
              border: "none",
              borderRadius: "999px",
              padding: "8px 14px",
              fontSize: "12px",
              fontWeight: "700",
              background: filter === f ? theme.colors.primary : "#e6e8f5",
              color: filter === f ? "white" : theme.colors.textMuted
            }}
          >
            {f} ({counts[f]})
          </button>
        ))}
      </div>

      {visibleFees.length === 0 ? (
        <p style={{ textAlign: "center", color: theme.colors.textMuted, margin: "30px 0" }}>
          {validFees.length === 0 ? "No fee records yet." : "No records match this filter."}
        </p>
      ) : (
        visibleFees.map((f) => {
          const status = paymentStatus(f);
          const balance = f.totalDue - f.amountPaid;
          return (
            <Card key={f.id}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <Avatar name={f.studentName} size={42} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: "700", color: theme.colors.text }}>{f.studentName}</div>
                  <div style={{ fontSize: "12px", color: theme.colors.textMuted }}>
                    {f.classLevel} • {f.feeType} • {f.term}
                  </div>
                </div>
                <StatusPill label={status} variant={statusVariant(status)} />
              </div>

              <div style={{ margin: "14px 0 8px" }}>
                <ProgressBar value={f.amountPaid} max={f.totalDue} />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "6px", fontSize: "13px" }}>
                <span>Paid <strong style={{ color: theme.colors.success }}>{formatNaira(f.amountPaid)}</strong></span>
                <span>Balance <strong style={{ color: balance > 0 ? theme.colors.danger : theme.colors.success }}>{formatNaira(balance)}</strong></span>
                <span style={{ color: theme.colors.textMuted }}>of {formatNaira(f.totalDue)}</span>
              </div>

              {payingId === f.id ? (
                <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    placeholder={`Up to ${formatNaira(balance)}`}
                    style={{ ...fieldStyle, flex: 1 }}
                  />
                  <button
                    onClick={() => confirmPayment(f)}
                    style={{ background: theme.colors.primary, color: "white", border: "none", borderRadius: theme.radius.sm, padding: "0 16px", fontWeight: "700" }}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => { setPayingId(null); setPayAmount(""); }}
                    style={{ background: "white", color: theme.colors.textMuted, border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.sm, padding: "0 12px" }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
                  {status !== "Full Payment" && (
                    <button
                      onClick={() => { setPayingId(f.id); setPayAmount(""); }}
                      style={{ flex: 1, background: theme.colors.primary, color: "white", border: "none", borderRadius: theme.radius.sm, padding: "10px", fontWeight: "700", fontSize: "13px" }}
                    >
                      Record Payment
                    </button>
                  )}
                  <button
                    onClick={() => setReceiptFee(f)}
                    style={{ flex: 1, background: "white", color: theme.colors.primary, border: `1.5px solid ${theme.colors.primary}`, borderRadius: theme.radius.sm, padding: "10px", fontWeight: "700", fontSize: "13px" }}
                  >
                    Receipt
                  </button>
                </div>
              )}
            </Card>
          );
        })
      )}

      {receiptFee && (
        <div
          onClick={() => setReceiptFee(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: "20px" }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ background: "white", borderRadius: theme.radius.md, padding: "26px", maxWidth: "400px", width: "100%" }}>
            <h2 style={{ textAlign: "center", color: theme.colors.primary, marginTop: 0 }}>Payment Receipt</h2>
            <div style={{ borderTop: `2px solid ${theme.colors.primary}`, borderBottom: `2px solid ${theme.colors.primary}`, padding: "14px 0", margin: "14px 0", fontSize: "14px" }}>
              <p style={{ margin: "5px 0" }}><strong>Receipt No:</strong> {receiptFee.id.slice(0, 8).toUpperCase()}</p>
              <p style={{ margin: "5px 0" }}><strong>Student:</strong> {receiptFee.studentName}</p>
              <p style={{ margin: "5px 0" }}><strong>Class:</strong> {receiptFee.classLevel}</p>
              <p style={{ margin: "5px 0" }}><strong>Fee Type:</strong> {receiptFee.feeType}</p>
              <p style={{ margin: "5px 0" }}><strong>Term:</strong> {receiptFee.term}</p>
              <p style={{ margin: "5px 0" }}><strong>Amount Paid:</strong> {formatNaira(receiptFee.amountPaid)}</p>
              <p style={{ margin: "5px 0" }}><strong>Total Due:</strong> {formatNaira(receiptFee.totalDue)}</p>
              <p style={{ margin: "5px 0" }}><strong>Status:</strong> {paymentStatus(receiptFee)}</p>
              <p style={{ margin: "5px 0" }}><strong>Date:</strong> {new Date(receiptFee.date).toLocaleDateString()}</p>
            </div>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <button
                onClick={() => printFeeReceipt(receiptFee)}
                style={{ background: theme.colors.primary, color: "white", border: "none", padding: "10px 20px", borderRadius: theme.radius.sm, fontWeight: "700" }}
              >
                Print / Save as PDF
              </button>
              <button
                onClick={() => setReceiptFee(null)}
                style={{ background: "white", color: theme.colors.primary, border: `1.5px solid ${theme.colors.primary}`, padding: "10px 20px", borderRadius: theme.radius.sm, fontWeight: "700" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}