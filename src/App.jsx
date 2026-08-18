import { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, addDoc, onSnapshot, updateDoc, doc } from "firebase/firestore";
import Fees from "./components/Fees"; // <-- THIS IS THE NEW LINE 4

function App() {
  const [students, setStudents] = useState([]);
  const [name, setName] = useState("");
  const [roll, setRoll] = useState("");
  const [grades, setGrades] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [subject, setSubject] = useState("");
  const [score, setScore] = useState("");
  const [total, setTotal] = useState("100");

  useEffect(() => {
    onSnapshot(collection(db, "students"), (snap) => {
      setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    onSnapshot(collection(db, "grades"), (snap) => {
      setGrades(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, []);

  const addStudent = async () => {
    if (!name || !roll) return alert("Enter name and roll");
    await addDoc(collection(db, "students"), { name, roll, present: true });
    setName(""); setRoll("");
  };

  const togglePresent = async (student) => {
    await updateDoc(doc(db, "students", student.id), { present: !student.present });
  };

  const addGrade = async () => {
    if (!selectedStudent || !subject || !score) return alert("Fill all");
    const student = students.find(s => s.id === selectedStudent);
    await addDoc(collection(db, "grades"), {
      studentId: selectedStudent,
      studentName: student.name,
      subject,
      score: Number(score),
      total: Number(total),
      percent: Math.round((Number(score) / Number(total)) * 100)
    });
    setSubject(""); setScore("");
  };

  const presentCount = students.filter(s => s.present).length;

  return (
    <div style={{ background: '#fdf6e9', minHeight: '100vh', padding: '20px', fontFamily: 'Arial' }}>
      <div style={{ background: '#1f4d3a', color: 'white', padding: '30px', textAlign: 'center', maxWidth: '700px', margin: '0 auto', borderRadius: '8px' }}>
        <h1>Roll & Ledger</h1>
        <p>School Management System</p>
      </div>

      <div style={{ maxWidth: '700px', margin: '20px auto' }}>
        <h2 style={{ textAlign: 'center' }}>Dashboard</h2>
        <p style={{ textAlign: 'center' }}>Welcome back, Admin.</p>

        <h2 style={{ textAlign: 'center', marginTop: '30px' }}>Students</h2>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '15px' }}>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Student name" style={{ padding: '8px', borderRadius: '6px' }} />
          <input value={roll} onChange={e => setRoll(e.target.value)} placeholder="Roll no." style={{ padding: '8px', borderRadius: '6px' }} />
          <button onClick={addStudent} style={{ background: '#1f4d3a', color: 'white', padding: '8px 16px', borderRadius: '6px' }}>Add Student</button>
        </div>
        {students.map(s => (
          <div key={s.id} style={{ background: 'white', padding: '12px', margin: '8px 0', borderRadius: '8px', textAlign: 'center' }}>{s.name} — Roll {s.roll}</div>
        ))}

        <h2 style={{ textAlign: 'center', marginTop: '40px' }}>Roll Call</h2>
        <p style={{ textAlign: 'center', color: '#666' }}>{presentCount}/{students.length} present today</p>
        {students.map(s => (
          <div key={s.id} style={{ background: 'white', padding: '12px', margin: '8px 0', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
            <span>{s.name} — Roll {s.roll}</span>
            <div>
              <button onClick={() => togglePresent(s)} style={{ background: s.present ? '#1f4d3a' : 'white', color: s.present ? 'white' : 'black', marginRight: '5px', padding: '4px 10px', borderRadius: '12px' }}>Present</button>
              <button onClick={() => togglePresent(s)} style={{ background: !s.present ? '#c2704e' : 'white', color: !s.present ? 'white' : 'black', padding: '4px 10px', borderRadius: '12px' }}>Absent</button>
            </div>
          </div>
        ))}

        <h2 style={{ textAlign: 'center', marginTop: '40px' }}>Grades</h2>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '15px', flexWrap: 'wrap' }}>
          <select value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)} style={{ padding: '8px', borderRadius: '6px' }}>
            <option value="">Select student</option>
            {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject" style={{ padding: '8px', borderRadius: '6px' }} />
          <input value={score} onChange={e => setScore(e.target.value)} placeholder="Score" style={{ padding: '8px', borderRadius: '6px', width: '70px' }} />
          <input value={total} onChange={e => setTotal(e.target.value)} type="number" style={{ padding: '8px', borderRadius: '6px', width: '60px' }} />
          <button onClick={addGrade} style={{ background: '#1f4d3a', color: 'white', padding: '8px 16px', borderRadius: '6px' }}>Add Grade</button>
        </div>
        {grades.map(g => (
          <div key={g.id} style={{ background: 'white', padding: '12px', margin: '8px 0', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
            <span>{g.studentName} — {g.subject}</span><span style={{ color: '#1f4d3a', fontWeight: 'bold' }}>{g.score}/{g.total} ({g.percent}%)</span>
          </div>
        ))}

        {/* THIS IS THE NEW FEES SECTION - IT WILL APPEAR HERE */}
        <Fees students={students} />

      </div>
    </div>
  );
}
export default App;