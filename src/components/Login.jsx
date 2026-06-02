import { useState } from 'react'
import { registerUser } from '../firebase'

export default function Login({ onLogin }) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)

    const userId = name.trim().toLowerCase().replace(/\s+/g, '_')
    const user = await registerUser(userId, name.trim())
    localStorage.setItem('oracle_userId', userId)
    onLogin({ id: userId, ...user })
  }

  return (
    <div className="app">
      <div className="login-screen">
        <div className="login-card">
          <div className="login-logo">⚽🏆</div>
          <p className="login-team">IG Creators Analytics</p>
          <h1>World Cup Oracle</h1>
          <h2>2026</h2>
          <p className="login-subtitle">Predict. Compete. Brag.</p>

          <form onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={20}
              autoFocus
            />
            <button type="submit" disabled={!name.trim() || loading}>
              {loading ? 'Joining...' : 'Enter the Oracle'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
