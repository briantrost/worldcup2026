import { useState, useEffect } from 'react'
import Login from './components/Login'
import Predictions from './components/Predictions'
import Leaderboard from './components/Leaderboard'
import Admin from './components/Admin'
import { getUser } from './firebase'
import './App.css'

const ADMIN_PW = 'btrost'

export default function App() {
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('Predictions')
  const [loading, setLoading] = useState(true)
  const [adminUnlocked, setAdminUnlocked] = useState(
    () => sessionStorage.getItem('oracle_admin') === 'true'
  )
  const [showAdminPrompt, setShowAdminPrompt] = useState(false)
  const [adminPw, setAdminPw] = useState('')
  const [adminError, setAdminError] = useState(false)

  useEffect(() => {
    const savedId = localStorage.getItem('oracle_userId')
    if (savedId) {
      getUser(savedId).then(u => {
        if (u) setUser({ id: savedId, ...u })
        setLoading(false)
      })
    } else {
      setLoading(false)
    }
  }, [])

  function handleAdminUnlock(e) {
    e.preventDefault()
    if (adminPw === ADMIN_PW) {
      setAdminUnlocked(true)
      sessionStorage.setItem('oracle_admin', 'true')
      setShowAdminPrompt(false)
      setActiveTab('Admin')
      setAdminPw('')
      setAdminError(false)
    } else {
      setAdminError(true)
    }
  }

  if (loading) {
    return (
      <div className="app loading-screen">
        <div className="loading-spinner">⚽</div>
      </div>
    )
  }

  if (!user) {
    return <Login onLogin={setUser} />
  }

  const tabs = adminUnlocked
    ? ['Predictions', 'Leaderboard', 'Admin']
    : ['Predictions', 'Leaderboard']

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-top">
          <h1>⚽ IG Creators Analytics - World Cup Oracle 2026 🏆</h1>
          <div className="user-badge">
            <span className="user-name">{user.displayName}</span>
            {!adminUnlocked && (
              <button className="admin-key-btn" onClick={() => setShowAdminPrompt(true)} title="Admin">
                🔑
              </button>
            )}
            <button className="logout-btn" onClick={() => {
              localStorage.removeItem('oracle_userId')
              setUser(null)
            }}>×</button>
          </div>
        </div>
        <nav className="tab-bar">
          {tabs.map(tab => (
            <button
              key={tab}
              className={`tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </nav>
      </header>

      <main className="main-content">
        {activeTab === 'Predictions' && <Predictions userId={user.id} />}
        {activeTab === 'Leaderboard' && <Leaderboard currentUserId={user.id} />}
        {activeTab === 'Admin' && adminUnlocked && <Admin />}
      </main>

      {showAdminPrompt && (
        <div className="modal-overlay" onClick={() => { setShowAdminPrompt(false); setAdminPw(''); setAdminError(false) }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-icon">🔑</div>
            <h3>Admin Access</h3>
            <p>Enter the admin password to manage results.</p>
            <form onSubmit={handleAdminUnlock}>
              <input
                type="password"
                className="admin-pw-input"
                placeholder="Password"
                value={adminPw}
                onChange={e => { setAdminPw(e.target.value); setAdminError(false) }}
                autoFocus
              />
              {adminError && <p className="admin-pw-error">Wrong password</p>}
              <div className="modal-actions">
                <button type="button" className="modal-btn cancel" onClick={() => { setShowAdminPrompt(false); setAdminPw(''); setAdminError(false) }}>
                  Cancel
                </button>
                <button type="submit" className="modal-btn confirm">
                  Unlock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
