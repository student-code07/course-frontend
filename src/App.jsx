
import { useEffect, useState } from 'react'
import './App.css'

const API_URL = 'http://localhost:8082'

function App() {
  const [username, setUsername] = useState('student')
  const [password, setPassword] = useState('student123')
  const [token, setToken] = useState('')
  const [courses, setCourses] = useState([])
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [instructor, setInstructor] = useState('')
  const [editingId, setEditingId] = useState(null)

  async function login(event) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      if (!response.ok) throw new Error('Login failed. Check credentials.')

      const data = await response.json()
      setToken(data.token)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function loadCourses() {
    const response = await fetch(`${API_URL}/api/courses`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!response.ok) throw new Error('Could not load courses.')

    const data = await response.json()
    setCourses(data)
  }

  useEffect(() => {
    if (!token) return

    async function fetchCourses() {
      setLoading(true)
      setError('')
      try {
        await loadCourses()
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchCourses()
  }, [token])

  async function saveCourse(event) {
    event.preventDefault()
    setError('')

    const url = editingId
      ? `${API_URL}/api/courses/${editingId}`
      : `${API_URL}/api/courses`

    try {
      const response = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, instructor }),
      })

      if (!response.ok) throw new Error('Could not save course.')

      setName('')
      setInstructor('')
      setEditingId(null)
      await loadCourses()
    } catch (err) {
      setError(err.message)
    }
  }

  function editCourse(course) {
    setEditingId(course.id)
    setName(course.name)
    setInstructor(course.instructor)
  }

  async function deleteCourse(id) {
    if (!window.confirm('Are you sure you want to delete this course?')) return

    setError('')
    try {
      const response = await fetch(`${API_URL}/api/courses/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) throw new Error('Could not delete course.')

      await loadCourses()
    } catch (err) {
      setError(err.message)
    }
  }

  function cancelEdit() {
    setEditingId(null)
    setName('')
    setInstructor('')
  }

  const filteredCourses = courses.filter((course) =>
    `${course.name} ${course.instructor}`
      .toLowerCase()
      .includes(search.toLowerCase())
  )

  if (!token) {
    return (
      <main className="dashboard">
        <header className="dashboard-header">
          <div>
            <p className="eyebrow">COURSE MANAGEMENT</p>
            <h1>Student Login</h1>
            <p>Sign in to manage your courses.</p>
          </div>
        </header>

        <form className="course-section" onSubmit={login}>
          <label>Username</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} required />

          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />

          <button type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Login'}
          </button>

          {error && <p role="alert">{error}</p>}
        </form>
      </main>
    )
  }

  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">COURSE MANAGEMENT</p>
          <h1>Student Dashboard</h1>
          <p>Manage your courses.</p>
        </div>
        <button onClick={() => {
          setToken('')
          setCourses([])
          cancelEdit()
        }}>
          Logout
        </button>
      </header>

      <section className="stats">
        <article className="stat-card">
          <span>Total Courses</span>
          <strong>{courses.length}</strong>
        </article>
      </section>

      <section className="course-section">
        <h2>{editingId ? 'Edit Course' : 'Add New Course'}</h2>

        <form onSubmit={saveCourse}>
          <label>Course Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter course name"
            required
          />

          <label>Instructor Name</label>
          <input
            value={instructor}
            onChange={(e) => setInstructor(e.target.value)}
            placeholder="Enter instructor name"
            required
          />

          <button type="submit">
            {editingId ? 'Update Course' : 'Add Course'}
          </button>

          {editingId && (
            <button type="button" onClick={cancelEdit}>
              Cancel
            </button>
          )}
        </form>

        <h2>My Courses</h2>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search course or instructor..."
        />

        {loading && <p>Loading...</p>}
        {error && <p role="alert">{error}</p>}

        <div className="course-list">
          {filteredCourses.map((course) => (
            <article className="course-card" key={course.id}>
              <div className="course-info">
                <span className="category">Course #{course.id}</span>
                <h3>{course.name}</h3>
                <p>Instructor: {course.instructor}</p>
              </div>

              <button onClick={() => editCourse(course)}>Edit</button>
              <button onClick={() => deleteCourse(course.id)}>Delete</button>
            </article>
          ))}

          {!loading && filteredCourses.length === 0 && (
            <p>No courses found.</p>
          )}
        </div>
      </section>

      <footer>Course Dashboard · React + Spring Boot</footer>
    </main>
  )
}

export default App
