import { useState, useEffect } from 'react'
import { getAllMatchDayQuestions, getUserPredictions, submitPredictions } from '../firebase'
import { getFlag } from '../data/teams'

export default function MatchDay({ userId }) {
  const [matchDays, setMatchDays] = useState({})
  const [userPreds, setUserPreds] = useState({})
  const [answers, setAnswers] = useState({})
  const [activeDay, setActiveDay] = useState(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getAllMatchDayQuestions(),
      getUserPredictions(userId)
    ]).then(([days, preds]) => {
      setMatchDays(days)
      setUserPreds(preds)

      const dayKeys = Object.keys(days).sort()
      if (dayKeys.length > 0) {
        const today = new Date().toISOString().split('T')[0]
        const currentDay = dayKeys.find(d => d >= today) || dayKeys[dayKeys.length - 1]
        setActiveDay(currentDay)

        const existing = {}
        dayKeys.forEach(d => {
          if (preds[`matchDay_${d}`]) {
            existing[d] = { ...preds[`matchDay_${d}`] }
            delete existing[d].submittedAt
          }
        })
        setAnswers(existing)
      }
      setLoading(false)
    })
  }, [userId])

  function setAnswer(dayId, questionId, value) {
    setAnswers(prev => ({
      ...prev,
      [dayId]: { ...prev[dayId], [questionId]: value }
    }))
  }

  async function handleSubmitDay(dayId) {
    setSaving(true)
    await submitPredictions(userId, `matchDay_${dayId}`, answers[dayId] || {})
    setUserPreds(prev => ({
      ...prev,
      [`matchDay_${dayId}`]: { ...answers[dayId], submittedAt: Date.now() }
    }))
    setSaving(false)
  }

  if (loading) return <div className="loading">Loading match days...</div>

  const dayKeys = Object.keys(matchDays).sort()

  if (dayKeys.length === 0) {
    return (
      <div className="match-day empty-state">
        <div className="empty-icon">📅</div>
        <h2>No Match Day Picks Yet</h2>
        <p>Match day questions will appear here once the tournament begins. Check back on June 11!</p>
      </div>
    )
  }

  const dayQuestions = activeDay ? matchDays[activeDay] : {}
  const dayQList = Object.entries(dayQuestions || {})
  const isSubmitted = !!userPreds[`matchDay_${activeDay}`]?.submittedAt
  const dayAnswers = answers[activeDay] || {}
  const answeredCount = dayQList.filter(([id]) => dayAnswers[id] !== undefined).length

  return (
    <div className="match-day">
      <h2>Match Day Picks</h2>
      <p className="predictions-subtitle">Quick picks for today's matches — answer before kickoff!</p>

      <div className="day-selector">
        {dayKeys.map(day => (
          <button
            key={day}
            className={`day-btn ${activeDay === day ? 'active' : ''} ${userPreds[`matchDay_${day}`]?.submittedAt ? 'submitted' : ''}`}
            onClick={() => setActiveDay(day)}
          >
            {formatDate(day)}
            {userPreds[`matchDay_${day}`]?.submittedAt && ' ✓'}
          </button>
        ))}
      </div>

      <div className="questions-list">
        {dayQList.map(([qId, q]) => (
          <div key={qId} className={`question-card ${dayAnswers[qId] !== undefined ? 'answered' : ''}`}>
            <div className="question-header">
              <span className="question-text">{q.text}</span>
              <span className="question-points">{q.points} pts</span>
            </div>
            <div className="question-input">
              {(q.type === 'pick-one' || q.type === 'yes-no') && (
                <div className="options-grid">
                  {(q.options || []).map(opt => (
                    <button
                      key={opt}
                      className={`option-btn ${dayAnswers[qId] === opt ? 'selected' : ''}`}
                      onClick={() => !isSubmitted && setAnswer(activeDay, qId, opt)}
                      disabled={isSubmitted}
                    >
                      {getFlag(opt) !== '🏳️' ? `${getFlag(opt)} ` : ''}{opt}
                    </button>
                  ))}
                </div>
              )}
              {q.type === 'exact-score' && (
                <input
                  type="text"
                  value={dayAnswers[qId] || ''}
                  onChange={e => setAnswer(activeDay, qId, e.target.value)}
                  placeholder="e.g. 2-1"
                  disabled={isSubmitted}
                  className="score-input"
                />
              )}
              {q.type === 'over-under' && (
                <div className="options-grid">
                  {['Over', 'Under'].map(opt => (
                    <button
                      key={opt}
                      className={`option-btn ${dayAnswers[qId] === opt ? 'selected' : ''}`}
                      onClick={() => !isSubmitted && setAnswer(activeDay, qId, opt)}
                      disabled={isSubmitted}
                    >
                      {opt} {q.line}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {!isSubmitted && dayQList.length > 0 && (
        <div className="submit-section">
          <button
            className="submit-btn"
            onClick={() => handleSubmitDay(activeDay)}
            disabled={answeredCount < dayQList.length || saving}
          >
            {saving ? 'Submitting...' : answeredCount < dayQList.length
              ? `Answer all ${dayQList.length} questions`
              : '🔒 Lock In Picks'}
          </button>
        </div>
      )}

      {isSubmitted && (
        <div className="submitted-banner">
          Picks locked for {formatDate(activeDay)}! 🔒
        </div>
      )}
    </div>
  )
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
