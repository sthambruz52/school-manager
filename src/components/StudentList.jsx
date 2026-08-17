import { useState } from 'react'

const initialStudents = [
  { id: 1, name: 'Amara Chen', rollNo: '501' },
  { id: 2, name: 'Diego Fuentes', rollNo: '502' },
  { id: 3, name: 'Priya Nair', rollNo: '503' },
]

function StudentList() {
  const [students, setStudents] = useState(initialStudents)
  const [name, setName] = useState('')
  const [rollNo, setRollNo] = useState('')

  function handleAddStudent() {
    if (!name.trim() || !rollNo.trim()) return

    const newStudent = {
      id: Date.now(),
      name: name,
      rollNo: rollNo,
    }

    setStudents([...students, newStudent])
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