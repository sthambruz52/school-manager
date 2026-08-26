import { useState, useEffect } from 'react'
import { db } from '../firebase'
import { collection, query, where, onSnapshot, addDoc } from 'firebase/firestore'

const CLASS_LEVELS = [
  "Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6",
  "JSS1", "JSS2", "JSS3",
  "SS1", "SS2", "SS3"
]

const TERMS = ["First Term", "Second Term", "Third Term"]
const TEST_TYPES = ["Test 1", "Test 2", "Test 3"]
const OTHER_VALUE = "__OTHER__"

export default function PeriodicTest() {
  const [students, setStudents] = useState([])
  const [grades, setGrades] = useState([])
  const [subjects, setSubjects] = useState([])

  const [classSelect, setClassSelect] = useState('')
  const [manualClass, setManualClass] = useState('')
  const [termFilter, setTermFilter] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [studentId, setStudentId] = useState('')
  const [subject, setSubject] = useState('')
  const [testTypeSelect, setTestTypeSelect] = useState('Test 1')
  const [manualTestType, setManualTestType] = useState('')
  const [score, setScore] = useState('')
  const [maxScore, setMaxScore] = useState('20')

  const isManualClass = classSelect === OTHER_VALUE
  const classFilter = isManualClass ? manualClass.trim() : classSelect
  const isManualTestType = testTypeSelect === OTHER_VALUE
  const finalTestType = isManualTestType ? manualTestType.trim() : testTypeSelect

  useEffect(() => {
    const q = query(collection(db, 'users'), where('role', '==', 'Student'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setStudents(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'grades'), (snapshot) => {
      setGrades(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'subjects'), (snapshot) => {
      setSubjects(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
    })
    return () => unsubscribe()
  }, [])

  const filteredStudents = students.filter((s) => {
    if (classFilter && s.classLevel !== classFilter) return false
    if (searchTerm && !(s.fullName || '').toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  })

  async function handleAddTest() {
    if (!studentId || !subject || !score) {
      alert(`Missing: ${!studentId ? "student " : ""}${!subject ? "subject " : ""}${!score ? "score" : ""}`)
      return
    }

    if (Number(score) < 0 || Number(maxScore) <= 0) {
      alert("Score and Max Score must be positive numbers.")
      return
    }

    if (Number(score) > Number(maxScore)) {
      alert(`Score (${score}) cannot be higher than Max Score (${maxScore}).`)
      return
    }

    if (!finalTestType) {
      alert("Select or type a test type.")
      return
    }

    const student = students.find((s) => s.id === studentId)

    await addDoc(collection(db, 'grades'), {
      studentId: studentId,
      subject: subject,
      score: Number(score),
      maxScore: Number(maxScore),
      testType: finalTestType,
      classLevel: student?.classLevel || '',
      term: termFilter || student?.term || ''
    })

    setScore('')
  }

  function studentName(id) {
    const s = students.find((s) => s.id === id)
    return s ? s.fullName : 'Unknown student'
  }

  const visibleTests = grades.filter((g) => {
    if (!g.testType || g.testType === 'Exam') return false
    if (classFilter && g.classLevel !== classFilter) return false
    if (termFilter && g.term !== termFilter) return false
    return true
  })

  const inputStyle = { padding: '8px', borderRadius: '6px' }

  return (
    <div style={{ marginTop: '40px' }}>
      <h2 style={{ textAlign: 'center' }}>Periodic Test</h2>
      <p style={{ textAlign: 'center', color: '#888', fontSize: '13px', marginTop: '-10px' }}>
        For Test 1, 2, 3 scores — main Exam scores are entered in Grades.
      </p>

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '15px', flexWrap: 'wrap' }}>
        <select value={classSelect} onChange={(e) => { setClassSelect(e.target.value); setStudentId('') }} style={inputStyle}>
          <option value="">Select class</option>
          {CLASS_LEVELS.map((c) => <option key={c} value={c}>{c}</option>)}
          <option value={OTHER_VALUE}>Other (type manually)</option>
        </select>

        {isManualClass && (
          <input
            value={manualClass}
            onChange={(e) => { setManualClass(e.target.value); setStudentId('') }}
            placeholder="Type class name"
            style={inputStyle}
          />
        )}

        <select value={termFilter} onChange={(e) => setTermFilter(e.target.value)} style={inputStyle}>
          <option value="">Select term</option>
          {TERMS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>

        <div style={{ position: 'relative' }}>
          <input
            value={studentId ? students.find((s) => s.id === studentId)?.fullName || '' : searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setStudentId(''); }}
            placeholder="Search student..."
            style={{ ...inputStyle, width: '160px' }}
          />
          {searchTerm && !studentId && filteredStudents.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, background: 'white', border: '1px solid #ddd', borderRadius: '6px', width: '160px', maxHeight: '160px', overflowY: 'auto', zIndex: 10 }}>
              {filteredStudents.map((s) => (
                <div
                  key={s.id}
                  onClick={() => { setStudentId(s.id); setSearchTerm(''); }}
                  style={{ padding: '8px', cursor: 'pointer' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#fdf6e9'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                >
                  {s.fullName}
                </div>
              ))}
            </div>
          )}
        </div>

        <select value={subject} onChange={(e) => setSubject(e.target.value)} style={inputStyle}>
          <option value="">Select subject</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.name}>{s.name}</option>
          ))}
        </select>

        <select value={testTypeSelect} onChange={(e) => setTestTypeSelect(e.target.value)} style={inputStyle}>
          {TEST_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          <option value={OTHER_VALUE}>Manual Input</option>
        </select>

        {isManualTestType && (
          <input
            value={manualTestType}
            onChange={(e) => setManualTestType(e.target.value)}
            placeholder="Type test name"
            style={inputStyle}
          />
        )}

        <input
          type="number"
          placeholder="Score"
          value={score}
          onChange={(e) => setScore(e.target.value)}
          style={{ ...inputStyle, width: '80px' }}
        />
        <input
          type="number"
          placeholder="Max"
          value={maxScore}
          onChange={(e) => setMaxScore(e.target.value)}
          style={{ ...inputStyle, width: '70px' }}
        />
        <button onClick={handleAddTest} style={{ background: '#1f4d3a', color: 'white', padding: '8px 16px', borderRadius: '6px', border: 'none' }}>
          Add Test Score
        </button>
      </div>

      {visibleTests.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#666' }}>No periodic test scores recorded yet.</p>
      ) : (
        visibleTests.map((g) => {
          const pct = g.maxScore ? Math.round((g.score / g.maxScore) * 100) : 0
          return (
            <div key={g.id} style={{ background: 'white', padding: '12px', margin: '8px 0', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
              <span>{studentName(g.studentId)} — {g.subject} <span style={{ color: '#888', fontSize: '12px' }}>({g.testType})</span></span>
              <span style={{ color: pct >= 60 ? '#1f4d3a' : '#c2704e', fontWeight: 'bold' }}>
                {g.score}/{g.maxScore} ({pct}%)
              </span>
            </div>
          )
        })
      )}
    </div>
  )
}