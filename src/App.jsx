import './App.css'
import Header from './components/Header'
import Dashboard from './components/Dashboard'
import StudentList from './components/StudentList'

function App() {
  return (
    <div className="app">
      <Header />
      <Dashboard />
      <StudentList />
    </div>
  )
}

export default App