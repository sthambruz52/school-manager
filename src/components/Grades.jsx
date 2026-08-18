import { useState, useEffect } from 'react'
import { db } from '../firebase'
import { collection, onSnapshot, addDoc } from 'firebase/firestore'

function Grades() {
  const [students, setStudents] = useState([])
  const [grades, setGrades] = useState([])

  const [studentId, setStudentId] = useState('')
  const [subject, setSubject] = useState('')
  const [score, setScore] = useState('')
  const [maxScore, setMaxScore] = useState('100')

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'students'), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      setStudents(data)
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'grades'), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      setGrades(data)
    })
    return () => unsubscribe()
  }, [])

  async function handleAddGrade() {
    if (!studentId || !subject.trim() || !score) return

    await addDoc(collection(db, 'grades'), {
      studentId: studentId,
      subject: subject,
      score: Number(score),
      maxScore: Number(maxScore),
    })

    setSubject('')
    setScore('')
    setMaxScore('100')
  }

  function studentName(id) {
    const s = students.find((s) => s.id === id)
    return s ? s.name : 'Unknown student'
  }

  return (
    <div className="grades">
      <h2>Grades</h2>

      <div className="add-grade-form">
        <select value={studentId} onChange={(e) => setStudentId(e.target.value)}>
          <option value="">Select student</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
        <input
          type="number"
          placeholder="Score"
          value={score}
          onChange={(e) => setScore(e.target.value)}
        />
        <input
          type="number"
          placeholder="Max"
          value={maxScore}
          onChange={(e) => setMaxScore(e.target.value)}
        />
        <button onClick={handleAddGrade}>Add Grade</button>
      </div>

      {grades.length === 0 ? (
        <p className="attendance-summary">No grades recorded yet.</p>
      ) : (
        <ul>
          {grades.map((g) => {
            const pct = g.maxScore ? Math.round((g.score / g.maxScore) * 100) : 0
            return (
              <li key={g.id} className="grade-row">
                <span>
                  {studentName(g.studentId)} — {g.subject}
                </span>
                <span className={pct >= 60 ? 'grade-pct good' : 'grade-pct bad'}>
                  {g.score}/{g.maxScore} ({pct}%)
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export default Grades