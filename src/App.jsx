import './App.css'
import Header from './components/Header'
import Dashboard from './components/Dashboard'
import StudentList from './components/StudentList'
import Attendance from './components/Attendance'
import Grades from './components/Grades'

function App() {
  return (
    <div className="app">
      <Header />
      <Dashboard />
      <StudentList />
      <Attendance />
      <Grades />
    </div>
  )
}

export default App