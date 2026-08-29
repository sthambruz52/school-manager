import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, addDoc, updateDoc, doc, onSnapshot } from "firebase/firestore";

const FEE_TYPES = ["School Fees", "Exam Fees", "PTA Fees", "Other"];
const CLASS_LEVELS = [
  "Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6",
  "JSS1", "JSS2", "JSS3",
  "SS1", "SS2", "SS3"
];
const OTHER_VALUE = "__OTHER__";
const OTHER_CLASS_VALUE = "__OTHER_CLASS__";

export default function Fees({ students }) {
  const [fees, setFees] = useState([]);
  const [classSelect, setClassSelect] = useState("");
  const [manualClass, setManualClass] = useState("");
  const [studentId, setStudentId] = useState("");
  const [feeTypeSelect, setFeeTypeSelect] = useState("School Fees");
  const [manualFeeType, setManualFeeType] = useState("");
  const [totalDue, setTotalDue] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [term, setTerm] = useState("Term 1");
  const [receiptFee, setReceiptFee] = useState(null);

  const isManualFeeType = feeTypeSelect === OTHER_VALUE;
  const finalFeeType = isManualFeeType ? manualFeeType.trim() : feeTypeSelect;
  const isManualClass = classSelect === OTHER_CLASS_VALUE;
  const classFilter = isManualClass ? manualClass.trim() : classSelect;
  const filteredStudents = students.filter(s => !classFilter || s.classLevel === classFilter);
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "fees"), (snap) => {
      setFees(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const addFee = async () => {
    if (!studentId || !totalDue || !amountPaid) return alert("Select a student and fill in the amounts.");
    if (!finalFeeType) return alert("Select or type a fee type.");
    if (Number(amountPaid) < 0 || Number(totalDue) <= 0) return alert("Amounts must be positive numbers.");
    if (Number(amountPaid) > Number(totalDue)) return alert("Amount paid cannot exceed the total due.");

    const student = students.find(s => s.id === studentId);
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

  const addMorePayment = async (fee, extraAmount) => {
    const newPaid = Math.min(fee.amountPaid + Number(extraAmount), fee.totalDue);
    await updateDoc(doc(db, "fees", fee.id), { amountPaid: newPaid });
  };

  const paymentStatus = (fee) => {
    if (fee.amountPaid >= fee.totalDue) return "Full Payment";
    if (fee.amountPaid > 0) return "Part Payment";
    return "Unpaid";
  };

  const statusColor = (status) => {
    if (status === "Full Payment") return "#1f4d3a";
    if (status === "Part Payment") return "#d4a017";
    return "#c2704e";
  };

  const totalCollected = fees.reduce((sum, f) => sum + (f.amountPaid || 0), 0);
  const inputStyle = { padding: "8px", borderRadius: "6px" };

  return (
    <div style={{ marginTop: '40px' }}>
      <h2 style={{ textAlign: 'center' }}>Fees</h2>
      <p style={{ textAlign: 'center', color: '#666' }}>₦{totalCollected.toLocaleString()} collected / {fees.length} records</p>

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '15px', flexWrap: 'wrap' }}>
        <select value={classSelect} onChange={e => { setClassSelect(e.target.value); setStudentId(''); }} style={inputStyle}>
          <option value="">Select class</option>
          {CLASS_LEVELS.map(c => <option key={c} value={c}>{c}</option>)}
          <option value={OTHER_CLASS_VALUE}>Manual Input</option>
        </select>
        {isManualClass && (
          <input value={manualClass} onChange={e => { setManualClass(e.target.value); setStudentId(''); }} placeholder="Type class name" style={inputStyle} />
        )}

        <select value={studentId} onChange={e => setStudentId(e.target.value)} style={inputStyle}>
          <option value="">Select student</option>
          {filteredStudents.map(s => <option key={s.id} value={s.id}>{s.name} — {s.classLevel}</option>)}
        </select>

        <select value={feeTypeSelect} onChange={e => setFeeTypeSelect(e.target.value)} style={inputStyle}>
          {FEE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          <option value={OTHER_VALUE}>Manual Input</option>
        </select>
        {isManualFeeType && (
          <input value={manualFeeType} onChange={e => setManualFeeType(e.target.value)} placeholder="Type fee name" style={inputStyle} />
        )}

        <select value={term} onChange={e => setTerm(e.target.value)} style={inputStyle}>
          <option>Term 1</option><option>Term 2</option><option>Term 3</option>
        </select>

        <input type="number" placeholder="Total Due" value={totalDue} onChange={e => setTotalDue(e.target.value)} style={{ ...inputStyle, width: '100px' }} />
        <input type="number" placeholder="Amount Paid" value={amountPaid} onChange={e => setAmountPaid(e.target.value)} style={{ ...inputStyle, width: '110px' }} />

        <button onClick={addFee} style={{ background: '#1f4d3a', color: 'white', padding: '8px 16px', borderRadius: '6px', border: 'none' }}>Add Fee</button>
      </div>

      {fees.filter(f => f.totalDue !== undefined && f.amountPaid !== undefined).map(f => {
        const status = paymentStatus(f);
        const balance = f.totalDue - f.amountPaid;
        return (
          <div key={f.id} style={{ background: 'white', padding: '14px', margin: '8px auto', maxWidth: '650px', borderRadius: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <strong>{f.studentName}</strong> <span style={{ fontSize: '13px', color: '#888' }}>({f.classLevel})</span>
                <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#444' }}>
                  {f.feeType} — {f.term} — ₦{f.amountPaid.toLocaleString()} of ₦{f.totalDue.toLocaleString()}
                  {balance > 0 && ` (₦${balance.toLocaleString()} balance)`}
                </p>
              </div>
              <span style={{ background: statusColor(status), color: 'white', padding: '4px 12px', borderRadius: '12px', fontSize: '13px', fontWeight: 'bold' }}>
                {status}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
              {status !== "Full Payment" && (
                <button
                  onClick={() => {
                    const extra = prompt(`Enter additional amount paid (balance: ₦${balance.toLocaleString()}):`);
                    if (extra && Number(extra) > 0) addMorePayment(f, extra);
                  }}
                  style={{ background: '#1f4d3a', color: 'white', border: 'none', padding: '6px 14px', borderRadius: '6px', fontSize: '13px' }}
                >
                  Record Payment
                </button>
              )}
              <button
                onClick={() => setReceiptFee(f)}
                style={{ background: 'white', color: '#1f4d3a', border: '1px solid #1f4d3a', padding: '6px 14px', borderRadius: '6px', fontSize: '13px' }}
              >
                View / Download Receipt
              </button>
            </div>
          </div>
        );
      })}

      {receiptFee && (
        <div
          className="no-print"
          onClick={() => setReceiptFee(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '20px' }}
        >
          <div onClick={(e) => e.stopPropagation()} className="receipt-print-only" style={{ background: 'white', borderRadius: '10px', padding: '30px', maxWidth: '400px', width: '100%' }}>
            <h2 style={{ textAlign: 'center', color: '#1f4d3a', marginTop: 0 }}>Payment Receipt</h2>
            <div style={{ borderTop: '2px solid #1f4d3a', borderBottom: '2px solid #1f4d3a', padding: '14px 0', margin: '14px 0' }}>
              <p style={{ margin: '4px 0' }}><strong>Receipt No:</strong> {receiptFee.id.slice(0, 8).toUpperCase()}</p>
              <p style={{ margin: '4px 0' }}><strong>Student:</strong> {receiptFee.studentName}</p>
              <p style={{ margin: '4px 0' }}><strong>Class:</strong> {receiptFee.classLevel}</p>
              <p style={{ margin: '4px 0' }}><strong>Fee Type:</strong> {receiptFee.feeType}</p>
              <p style={{ margin: '4px 0' }}><strong>Term:</strong> {receiptFee.term}</p>
              <p style={{ margin: '4px 0' }}><strong>Amount Paid:</strong> ₦{receiptFee.amountPaid.toLocaleString()}</p>
              <p style={{ margin: '4px 0' }}><strong>Total Due:</strong> ₦{receiptFee.totalDue.toLocaleString()}</p>
              <p style={{ margin: '4px 0' }}><strong>Status:</strong> {paymentStatus(receiptFee)}</p>
              <p style={{ margin: '4px 0' }}><strong>Date:</strong> {new Date(receiptFee.date).toLocaleDateString()}</p>
            </div>
            <div className="no-print" style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={() => {
                  document.body.classList.add('printing-receipt');
                  window.print();
                  setTimeout(() => document.body.classList.remove('printing-receipt'), 1000);
                }}
                style={{ background: '#1f4d3a', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '6px' }}
              >
                Print / Save as PDF
              </button>
              <button onClick={() => setReceiptFee(null)} style={{ background: 'white', color: '#1f4d3a', border: '1px solid #1f4d3a', padding: '8px 20px', borderRadius: '6px' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}