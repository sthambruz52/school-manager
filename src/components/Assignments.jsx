import { useState, useEffect } from 'react'
import { db } from '../firebase'
import { collection, query, where, onSnapshot, addDoc, doc, setDoc } from 'firebase/firestore'

const CLASS_LEVELS = [
  "Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6",
  "JSS1", "JSS2", "JSS3",
  "SS1", "SS2", "SS3"
]
const OTHER_VALUE = "__OTHER__"

export default function Assignments({ canManage, studentView }) {
  const [assignments, setAssignments] = useState([])
  const [subjects, setSubjects] = useState([])
  const [students, setStudents] = useState([])
  const [scores, setScores] = useState([])

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [subject, setSubject] = useState('')
  const [classSelect, setClassSelect] = useState('')
  const [manualClass, setManualClass] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [saving, setSaving] = useState(false)

  const [expandedId, setExpandedId] = useState(null)
  const [scoreDrafts, setScoreDrafts] = useState({})
  const [savedFlash, setSavedFlash] = useState(null)
  const isManualClass = classSelect === OTHER_VALUE
  const classFinal = isManualClass ? manualClass.trim() : classSelect

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'assignments'), (snap) => {
      setAssignments(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'subjects'), (snap) => {
      setSubjects(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    const q = query(collection(db, 'users'), where('role', '==', 'Student'))
    const unsub = onSnapshot(q, (snap) => {
      setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'assignmentScores'), (snap) => {
      setScores(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [])

  const addAssignment = async () => {
    if (!title.trim() || !subject || !classFinal) return alert('Enter a title, subject, and class.')
    setSaving(true)
    await addDoc(collection(db, 'assignments'), {
      title: title.trim(),
      description: description.trim(),
      subject,
      classLevel: classFinal,
      dueDate,
      createdAt: new Date()
    })
    setTitle(''); setDescription(''); setDueDate('')
    setSaving(false)
  }

  const studentsInClass = (classLevel) => students.filter(s => s.classLevel === classLevel)
  const scoreFor = (assignmentId, studentId) => scores.find(s => s.assignmentId === assignmentId && s.studentId === studentId)

  const updateDraft = (key, field, value) => {
    setScoreDrafts(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }))
  }

  const toggleSubmitted = async (assignmentId, studentId) => {
    const key = `${assignmentId}_${studentId}`
    const existing = scoreFor(assignmentId, studentId)
    await setDoc(doc(db, 'assignmentScores', key), {
      assignmentId, studentId,
      submitted: !(existing?.submitted),
      updatedAt: new Date()
    }, { merge: true })
  }

  const saveScoreFor = async (assignmentId, studentId) => {
    const key = `${assignmentId}_${studentId}`
    const draft = scoreDrafts[key] || {}
    const existing = scoreFor(assignmentId, studentId)
    const score = draft.score !== undefined ? draft.score : existing?.score ?? ''
    const maxScore = draft.maxScore !== undefined ? draft.maxScore : existing?.maxScore ?? '100'
    if (score === '' || maxScore === '') return alert('Enter score and max score.')
    if (Number(score) > Number(maxScore)) return alert('Score cannot exceed max score.')
    await setDoc(doc(db, 'assignmentScores', key), {
      assignmentId, studentId, score: Number(score), maxScore: Number(maxScore), gradedAt: new Date()
    }, { merge: true })
    setSavedFlash(key)
    setTimeout(() => setSavedFlash(null), 1500)
  }

  const inputStyle = { padding: '8px', borderRadius: '6px' }

  if (studentView) {
    const relevant = assignments.filter(a => a.classLevel === studentView.classLevel)
    return (
      <div style={{ marginTop: '20px' }}>
        <h2 style={{ textAlign: 'center' }}>Assignments</h2>
        {relevant.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666' }}>No assignments posted yet.</p>
        ) : (
          relevant.map(a => {
            const mine = scoreFor(a.id, studentView.studentId)
            return (
              <div key={a.id} style={{ background: 'white', padding: '14px', margin: '8px 0', borderRadius: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong>{a.title}</strong>
                  <span style={{ fontSize: '12px', color: '#888' }}>{a.subject}</span>
                </div>
                {a.description && <p style={{ fontSize: '13px', color: '#666', margin: '6px 0' }}>{a.description}</p>}
                {a.dueDate && <p style={{ fontSize: '12px', color: '#c2704e', margin: 0 }}>Due: {a.dueDate}</p>}
                <div style={{ marginTop: '8px', display: 'flex', gap: '10px', alignItems: 'center', fontSize: '13px' }}>
                  <span style={{
                    background: mine?.submitted ? '#1f4d3a' : '#c2704e',
                    color: 'white',
                    padding: '2px 10px',
                    borderRadius: '10px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    {mine?.submitted ? 'Submitted' : 'Not Submitted'}
                  </span>
                  {mine?.score !== undefined ? (
                    <span style={{ color: '#1f4d3a', fontWeight: 'bold' }}>Score: {mine.score}/{mine.maxScore}</span>
                  ) : (
                    <span style={{ color: '#999' }}>Not graded yet</span>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    )
  }

  return (
    <div style={{ marginTop: '20px' }}>
      <h2 style={{ textAlign: 'center' }}>Assignments</h2>

      {canManage && (
        <div style={{ background: 'white', padding: '16px', borderRadius: '10px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Assignment title" style={inputStyle} />
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (optional)" rows={3} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'Arial' }} />
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <select value={subject} onChange={e => setSubject(e.target.value)} style={inputStyle}>
              <option value="">Select subject</option>
              {subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
            <select value={classSelect} onChange={e => setClassSelect(e.target.value)} style={inputStyle}>
              <option value="">Select class</option>
              {CLASS_LEVELS.map(c => <option key={c} value={c}>{c}</option>)}
              <option value={OTHER_VALUE}>Manual Input</option>
            </select>
            {isManualClass && <input value={manualClass} onChange={e => setManualClass(e.target.value)} placeholder="Type class name" style={inputStyle} />}
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={inputStyle} />
          </div>
          <button onClick={addAssignment} disabled={saving} style={{ background: '#1f4d3a', color: 'white', padding: '8px 20px', borderRadius: '6px', border: 'none' }}>
            {saving ? 'Posting...' : 'Post Assignment'}
          </button>
        </div>
      )}

      {assignments.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#666' }}>No assignments posted yet.</p>
      ) : (
        assignments.map(a => (
          <div key={a.id} style={{ background: 'white', borderRadius: '10px', margin: '8px 0', overflow: 'hidden' }}>
            <div onClick={() => setExpandedId(expandedId === a.id ? null : a.id)} style={{ padding: '14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>{a.title}</strong>
                <div style={{ fontSize: '12px', color: '#888' }}>{a.subject} — {a.classLevel} {a.dueDate && `— Due ${a.dueDate}`}</div>
              </div>
            </div>
            {expandedId === a.id && (
              <div style={{ borderTop: '1px solid #eee', padding: '12px 14px' }}>
                {a.description && <p style={{ fontSize: '13px', color: '#666' }}>{a.description}</p>}
                {studentsInClass(a.classLevel).length === 0 ? (
                  <p style={{ color: '#666', fontSize: '13px' }}>No students in this class yet.</p>
                ) : (
                  studentsInClass(a.classLevel).map(s => {
                    const existing = scoreFor(a.id, s.id)
                    const key = `${a.id}_${s.id}`
                    const draft = scoreDrafts[key] || {}
                    return (
                      <div key={s.id} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', padding: '8px 0', borderBottom: '1px solid #f4f0e6' }}>
                        <span style={{ flex: 1, minWidth: '100px', fontSize: '14px' }}>{s.fullName}</span>
                        <button
                          onClick={() => toggleSubmitted(a.id, s.id)}
                          style={{
                            background: existing?.submitted ? '#1f4d3a' : '#c2704e',
                            color: 'white',
                            border: 'none',
                            padding: '5px 10px',
                            borderRadius: '10px',
                            fontSize: '11px',
                            fontWeight: 'bold'
                          }}
                        >
                          {existing?.submitted ? 'Submitted' : 'Not Submitted'}
                        </button>
                        <input
                          type="number"
                          value={draft.score !== undefined ? draft.score : existing?.score ?? ''}
                          onChange={(e) => updateDraft(key, 'score', e.target.value)}
                          placeholder="Score"
                          style={{ ...inputStyle, width: '60px' }}
                        />
                        <input
                          type="number"
                          value={draft.maxScore !== undefined ? draft.maxScore : existing?.maxScore ?? '100'}
                          onChange={(e) => updateDraft(key, 'maxScore', e.target.value)}
                          placeholder="Max"
                          style={{ ...inputStyle, width: '60px' }}
                        />
                        <button
                          onClick={() => saveScoreFor(a.id, s.id)}
                          style={{ background: '#1f4d3a', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '6px', fontSize: '12px' }}
                        >
                          {savedFlash === key ? '✓ Saved!' : 'Save Score'}
                        </button>
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}