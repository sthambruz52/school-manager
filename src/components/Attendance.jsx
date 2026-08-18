import { useState, useEffect } from 'react'
import { db } from '../firebase'
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore'

function Attendance() {
  const [students, setStudents] = useState([])
  const [records, setRecords] = useState({})

  const today = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'students'), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setStudents(data)
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'attendance', today, 'records'),
      (snapshot) => {
        const data = {}
        snapshot.docs.forEach((docSnap) => {
          data[docSnap.id] = docSnap.data().status
        })
        setRecords(data)
      }
    )
    return () => unsubscribe()
  }, [today])

  async function markStatus(studentId, status) {
    await setDoc(doc(db, 'attendance', today, 'records', studentId), {
      status: status,
    })
  }

  const presentCount = Object.values(records).filter(
    (status) => status === 'present'
  ).length

  return (
    <div className="attendance">
      <h2>Roll Call</h2>
      <p className="attendance-summary">
        {presentCount}/{students.length} present today
      </p>

      {students.length === 0 ? (
        <p className="attendance-summary">No students yet — add some in the Students section above.</p>
      ) : (
        <ul>
          {students.map((student) => {
            const status = records[student.id]
            return (
              <li key={student.id} className="attendance-row">
                <span>
                  {student.name} — Roll {student.rollNo}
                </span>
                <div className="attendance-buttons">
                  <button
                    className={status === 'present' ? 'present active' : 'present'}
                    onClick={() => markStatus(student.id, 'present')}
                  >
                    Present
                  </button>
                  <button
                    className={status === 'absent' ? 'absent active' : 'absent'}
                    onClick={() => markStatus(student.id, 'absent')}
                  >
                    Absent
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export default Attendance