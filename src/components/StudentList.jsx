import { useState, useEffect } from 'react'
import { db } from '../firebase'
import {
  collection,
  addDoc,
  onSnapshot,
} from 'firebase/firestore'

function StudentList() {
  const [students, setStudents] = useState([])
  const [name, setName] = useState('')
  const [rollNo, setRollNo] = useState('')

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

  async function handleAddStudent() {
    if (!name.trim() || !rollNo.trim()) return

    await addDoc(collection(db, 'students'), {
      name: name,
      rollNo: rollNo,
    })

    setName('')
    setRollNo('')
  }

  return (
    <div className="student-list">
      <h2>Students</h2>

      <div className="add-student-form">
        <input
          type="text"
          placeholder="Student name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Roll no."
          value={rollNo}
          onChange={(e) => setRollNo(e.target.value)}
        />
        <button onClick={handleAddStudent}>Add Student</button>
      </div>

      <ul>
        {students.map((student) => (
          <li key={student.id}>
            {student.name} — Roll {student.rollNo}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default StudentList