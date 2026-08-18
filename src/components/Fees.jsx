import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, addDoc, getDocs, updateDoc, doc, onSnapshot } from "firebase/firestore";

export default function Fees({ students }) {
  const [fees, setFees] = useState([]);
  const [studentId, setStudentId] = useState("");
  const [amount, setAmount] = useState("");
  const [term, setTerm] = useState("Term 1");

  // Load fees in real-time
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "fees"), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setFees(data);
    });
    return () => unsub();
  }, []);

  const addFee = async () => {
    if (!studentId || !amount) return alert("Select student and amount");
    const student = students.find(s => s.id === studentId);
    await addDoc(collection(db, "fees"), {
      studentId,
      studentName: student?.name || studentId,
      amount: Number(amount),
      term,
      status: "Unpaid",
      date: new Date().toISOString()
    });
    setAmount("");
  };

  const toggleStatus = async (fee) => {
    const newStatus = fee.status === "Paid" ? "Unpaid" : "Paid";
    await updateDoc(doc(db, "fees", fee.id), { status: newStatus });
  };

  const totalPaid = fees.filter(f => f.status === "Paid").reduce((sum, f) => sum + f.amount, 0);

  return (
    <div style={{ marginTop: '40px' }}>
      <h2 style={{ textAlign: 'center' }}>Fees</h2>
      <p style={{ textAlign: 'center', color: '#666' }}>{totalPaid.toLocaleString()} collected / {fees.length} records</p>
      
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '15px', flexWrap: 'wrap' }}>
        <select value={studentId} onChange={e => setStudentId(e.target.value)} style={{ padding: '8px', borderRadius: '6px' }}>
          <option value="">Select student</option>
          {students.map(s => <option key={s.id} value={s.id}>{s.name} — {s.roll}</option>)}
        </select>
        <input type="number" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} style={{ padding: '8px', borderRadius: '6px' }} />
        <select value={term} onChange={e => setTerm(e.target.value)} style={{ padding: '8px', borderRadius: '6px' }}>
          <option>Term 1</option><option>Term 2</option><option>Term 3</option>
        </select>
        <button onClick={addFee} style={{ background: '#1f4d3a', color: 'white', padding: '8px 16px', borderRadius: '6px', border: 'none' }}>Add Fee</button>
      </div>

      {fees.map(f => (
        <div key={f.id} style={{ background: 'white', padding: '12px', margin: '8px auto', maxWidth: '600px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
          <span>{f.studentName} — {f.term} — ₦{f.amount.toLocaleString()}</span>
          <button onClick={() => toggleStatus(f)} style={{ 
            background: f.status === 'Paid' ? '#1f4d3a' : '#c2704e', 
            color: 'white', padding: '4px 12px', borderRadius: '12px', border: 'none' 
          }}>{f.status}</button>
        </div>
      ))}
    </div>
  );
}