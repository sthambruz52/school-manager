import { useState } from 'react'

const roster = [
  { id: 1, name: 'Amara Chen', rollNo: '501' },
  { id: 2, name: 'Diego Fuentes', rollNo: '502' },
  { id: 3, name: 'Priya Nair', rollNo: '503' },
]

function Attendance() {
  const [records, setRecords] = useState({})

  function markStatus(studentId, status) {
    setRecords({
      ...records,
      [studentId]: status,
    })
  }

  const presentCount = Object.values(records).filter(
    (status) => status === 'present'
  ).length

  return (
    <div className="attendance">
      <h2>Roll Call</h2>
      <p className="attendance-summary">
        {presentCount}/{roster.length} present today
      </p>

      <ul>
        {roster.map((student) => {
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
    </div>
  )
}

export default Attendance