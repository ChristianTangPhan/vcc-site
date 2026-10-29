import { useEffect, useState } from 'react'
import './App.css'

// Shapes of the data coming from the API (matches the DB functions)
type Pastor = {
  p_id: number
  p_name: string
  p_phone_number: string
  p_email: string
  p_image: string | null
}

type Service = {
  s_id: number
  s_name: string
  s_description: string | null
  s_location: string
  s_day: number // 1 = Sunday ... 7 = Saturday
  s_start: string
  s_end: string
}

// s_day 1-7 -> name (index 0-6, so use s_day - 1)
const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

// 24-hour to 12-hour: "19:00:00" -> "7:00 PM"
function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, '0')} ${suffix}`
}

function App() {
  // Data starts empty, then gets filled from the API
  const [pastors, setPastors] = useState<Pastor[]>([])
  const [services, setServices] = useState<Service[]>([])

  // Runs once when the page loads
  useEffect(() => {
    fetch('/api/pastors').then((r) => r.json()).then(setPastors)
    fetch('/api/services').then((r) => r.json()).then(setServices)
  }, [])

  return (
    <>
      <header className="nav">
        <span className="nav-title">Church Name</span>
        <nav>
          <a href="#services">Services</a>
          <a href="#calendar">Calendar</a>
          <a href="#pastors">Pastors</a>
          <a href="#about">About</a>
        </nav>
      </header>

      <section className="hero">
        <h1>Welcome to Church Name</h1>
        <p>Join us this Sunday!</p>
      </section>

      <section id="services">
        <h2>Service Times</h2>
        {services.map((s) => (
          <div className="card" key={s.s_id}>
            <h3>{s.s_name}</h3>
            <p>{dayNames[s.s_day - 1]} · {formatTime(s.s_start)} – {formatTime(s.s_end)}</p>
            <p className="muted">{s.s_location}</p>
            {s.s_description && <p>{s.s_description}</p>}
          </div>
        ))}
      </section>

      <section id="calendar">
        <h2>Calendar</h2>
        <p className="muted">Coming soon</p>
      </section>

      <section id="pastors">
        <h2>Our Pastors</h2>
        {pastors.map((p) => (
          <div className="card" key={p.p_id}>
            <h3>{p.p_name}</h3>
            <p><a href={`tel:${p.p_phone_number}`}>{p.p_phone_number}</a></p>
            <p><a href={`mailto:${p.p_email}`}>{p.p_email}</a></p>
          </div>
        ))}
      </section>

      <section id="about">
        <h2>About Us</h2>
        <p>Write a few sentences about the church here.</p>
      </section>

      <footer>
        <p>123 Church St, Gulf Breeze, FL</p>
        <p className="muted">© 2026 Church Name</p>
      </footer>
    </>
  )
}

export default App