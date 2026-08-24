import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, query, where, onSnapshot, doc, setDoc } from "firebase/firestore";

const CLASS_LEVELS = [
  "Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6",
  "JSS1", "JSS2", "JSS3",
  "SS1", "SS2", "SS3"
];
const TERMS = ["First Term", "Second Term", "Third Term"];
const OTHER_VALUE = "__OTHER__";

function gradeLetter(pct) {
  if (pct >= 70) return "A";
  if (pct >= 60) return "B";
  if (pct >= 50) return "C";
  if (pct >= 40) return "D";
  return "F";
}

export default function ReportCard({ isAdmin, fixedStudentId, fixedStudentName }) {
  const [students, setStudents] = useState([]);
  const [classSelect, setClassSelect] = useState('');
  const [manualClass, setManualClass] = useState('');
  const [studentId, setStudentId] = useState(fixedStudentId || '');
  const [session, setSession] = useState('');
  const [term, setTerm] = useState('');

  const [grades, setGrades] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [remark, setRemark] = useState('');
  const [savingRemark, setSavingRemark] = useState(false);

  const isManualClass = classSelect === OTHER_VALUE;
  const classFilter = isManualClass ? manualClass.trim() : classSelect;

  useEffect(() => {
    if (isAdmin) {
      const q = query(collection(db, 'users'), where('role', '==', 'Student'));
      const unsub = onSnapshot(q, (snap) => setStudents(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
      return () => unsub();
    }
  }, [isAdmin]);

  const filteredStudents = students.filter((s) => !classFilter || s.classLevel === classFilter);
  const currentStudent = isAdmin ? students.find((s) => s.id === studentId) : null;
  const activeStudentId = fixedStudentId || studentId;
  const activeStudentName = fixedStudentName || currentStudent?.fullName || '';
  const activeClassLevel = fixedStudentId ? '' : currentStudent?.classLevel || '';

  useEffect(() => {
    if (!activeStudentId) { setGrades([]); return; }
    const q = query(collection(db, 'grades'), where('studentId', '==', activeStudentId));
    const unsub = onSnapshot(q, (snap) => {
      let data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      if (term) data = data.filter((g) => g.term === term);
      setGrades(data);
    });
    return () => unsub();
  }, [activeStudentId, term]);

  useEffect(() => {
    if (!activeStudentId) { setAttendance([]); return; }
    const q = query(collection(db, 'attendance'), where('studentId', '==', activeStudentId));
    const unsub = onSnapshot(q, (snap) => {
      let data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      if (session) data = data.filter((a) => a.session === session);
      if (term) data = data.filter((a) => a.term === term);
      setAttendance(data);
    });
    return () => unsub();
  }, [activeStudentId, session, term]);

  useEffect(() => {
    if (!activeStudentId || !session || !term) { setRemark(''); return; }
    const unsub = onSnapshot(doc(db, 'reportRemarks', `${activeStudentId}_${session}_${term}`), (docSnap) => {
      setRemark(docSnap.exists() ? docSnap.data().remark || '' : '');
    });
    return () => unsub();
  }, [activeStudentId, session, term]);

  const saveRemark = async () => {
    if (!activeStudentId || !session || !term) return alert('Select session and term first.');
    setSavingRemark(true);
    await setDoc(doc(db, 'reportRemarks', `${activeStudentId}_${session}_${term}`), {
      studentId: activeStudentId, session, term, remark
    });
    setSavingRemark(false);
  };

  const average = grades.length > 0
    ? Math.round(grades.reduce((sum, g) => sum + (g.score / g.maxScore) * 100, 0) / grades.length)
    : 0;

  const presentCount = attendance.filter((a) => a.status === 'Present').length;
  const totalDays = attendance.length;
  const attendancePct = totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 0;

  const inputStyle = { padding: '8px', borderRadius: '6px' };

  return (
    <div style={{ marginTop: '20px' }}>
      <h2 style={{ textAlign: 'center' }}>Report Card</h2>

      <div className="no-print" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '20px' }}>
        {isAdmin && !fixedStudentId && (
          <>
            <select value={classSelect} onChange={(e) => { setClassSelect(e.target.value); setStudentId(''); }} style={inputStyle}>
              <option value="">Select class</option>
              {CLASS_LEVELS.map((c) => <option key={c} value={c}>{c}</option>)}
              <option value={OTHER_VALUE}>Manual Input</option>
            </select>
            {isManualClass && (
              <input value={manualClass} onChange={(e) => setManualClass(e.target.value)} placeholder="Type class name" style={inputStyle} />
            )}
            <select value={studentId} onChange={(e) => setStudentId(e.target.value)} style={inputStyle}>
              <option value="">Select student</option>
              {filteredStudents.map((s) => <option key={s.id} value={s.id}>{s.fullName}</option>)}
            </select>
          </>
        )}

        <input value={session} onChange={(e) => setSession(e.target.value)} placeholder="Session (e.g. 2025/2026)" style={inputStyle} />

        <select value={term} onChange={(e) => setTerm(e.target.value)} style={inputStyle}>
          <option value="">Select term</option>
          {TERMS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>

        {activeStudentId && (
          <button onClick={() => window.print()} style={{ background: '#1f4d3a', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px' }}>
            Print
          </button>
        )}
      </div>

      {!activeStudentId ? (
        <p style={{ textAlign: 'center', color: '#666' }}>Select a student to generate a report card.</p>
      ) : (
        <div style={{ background: 'white', padding: '20px', borderRadius: '10px', maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0 }}>{activeStudentName}</h3>
            <p style={{ margin: 0, color: '#666' }}>{activeClassLevel} {session && `— ${session}`} {term && `— ${term}`}</p>
          </div>

          <h4>Grades</h4>
          {grades.length === 0 ? (
            <p style={{ color: '#666' }}>No grades recorded for this period.</p>
          ) : (
            <>
              {grades.map((g) => {
                const pct = g.maxScore ? Math.round((g.score / g.maxScore) * 100) : 0;
                return (
                  <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #eee' }}>
                    <span>{g.subject}</span>
                    <span>{g.score}/{g.maxScore} ({pct}%) — {gradeLetter(pct)}</span>
                  </div>
                );
              })}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontWeight: 'bold' }}>
                <span>Average</span>
                <span>{average}% — {gradeLetter(average)}</span>
              </div>
            </>
          )}

          <h4 style={{ marginTop: '20px' }}>Attendance Summary</h4>
          {totalDays === 0 ? (
            <p style={{ color: '#666' }}>No attendance records for this period yet.</p>
          ) : (
            <p>{presentCount}/{totalDays} days present ({attendancePct}%)</p>
          )}

          <h4 style={{ marginTop: '20px' }}>Class Teacher's Remark</h4>
          {isAdmin ? (
            <>
              <textarea
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                rows={3}
                placeholder="Write a remark..."
                style={{ ...inputStyle, width: '100%', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'Arial' }}
              />
              <button onClick={saveRemark} disabled={savingRemark} className="no-print" style={{ marginTop: '8px', background: '#1f4d3a', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px' }}>
                {savingRemark ? 'Saving...' : 'Save Remark'}
              </button>
            </>
          ) : (
            <p style={{ fontStyle: 'italic' }}>{remark || 'No remark yet.'}</p>
          )}
        </div>
      )}
    </div>
  );
}