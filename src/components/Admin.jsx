import { useState, useEffect } from 'react'
import { ALL_PRE_TOURNAMENT_QUESTIONS, CATEGORIES } from '../data/questions'
import { getFlag } from '../data/teams'
import {
  savePreTournamentQuestions,
  getPreTournamentQuestions,
  resolveQuestion,
  gradeAllPredictions,
  getAllUsers,
  deleteUser
} from '../firebase'

export default function Admin() {
  const [status, setStatus] = useState('')
  const [activeTab, setActiveTab] = useState('results')
  const [savedAnswers, setSavedAnswers] = useState({})
  const [loading, setLoading] = useState(true)
  const [gradedCount, setGradedCount] = useState(0)
  const [users, setUsers] = useState({})
  const [confirmDelete, setConfirmDelete] = useState(null)

  useEffect(() => {
    loadSavedAnswers()
    getAllUsers().then(setUsers)
  }, [])

  async function loadSavedAnswers() {
    const questions = await getPreTournamentQuestions()
    const answers = {}
    let count = 0
    for (const [id, q] of Object.entries(questions || {})) {
      if (q.answer != null) {
        answers[id] = q.answer
        count++
      }
    }
    setSavedAnswers(answers)
    setGradedCount(count)
    setLoading(false)
  }

  async function seedQuestions() {
    setStatus('Seeding pre-tournament questions...')
    const qMap = {}
    ALL_PRE_TOURNAMENT_QUESTIONS.forEach(q => {
      qMap[q.id] = { ...q }
      delete qMap[q.id].id
    })
    await savePreTournamentQuestions(qMap)
    setStatus('Pre-tournament questions seeded!')
    setTimeout(() => setStatus(''), 3000)
  }

  async function handleSetAnswer(questionId, answer) {
    setSavedAnswers(prev => ({ ...prev, [questionId]: answer }))
    await resolveQuestion(`preTournament/${questionId}`, answer)
    await gradeAllPredictions()
    setGradedCount(prev => {
      const wasAlreadySet = savedAnswers[questionId] != null
      return wasAlreadySet ? prev : prev + 1
    })
    setStatus(`✓ Saved & graded: ${questionId}`)
    setTimeout(() => setStatus(''), 2000)
  }

  async function handleClearAnswer(questionId) {
    setSavedAnswers(prev => {
      const next = { ...prev }
      delete next[questionId]
      return next
    })
    await resolveQuestion(`preTournament/${questionId}`, null)
    await gradeAllPredictions()
    setGradedCount(prev => prev - 1)
    setStatus(`Cleared: ${questionId}`)
    setTimeout(() => setStatus(''), 2000)
  }

  if (loading) return <div className="loading">Loading admin...</div>

  const totalQuestions = ALL_PRE_TOURNAMENT_QUESTIONS.length

  return (
    <div className="admin">
      <h2>Admin Panel</h2>

      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === 'results' ? 'active' : ''}`}
          onClick={() => setActiveTab('results')}
        >
          Set Results ({gradedCount}/{totalQuestions})
        </button>
        <button
          className={`admin-tab ${activeTab === 'players' ? 'active' : ''}`}
          onClick={() => { setActiveTab('players'); getAllUsers().then(setUsers) }}
        >
          Players ({Object.keys(users).length})
        </button>
        <button
          className={`admin-tab ${activeTab === 'setup' ? 'active' : ''}`}
          onClick={() => setActiveTab('setup')}
        >
          Setup
        </button>
      </div>

      {activeTab === 'players' && (
        <section className="admin-section">
          <h3>Manage Players</h3>
          <p className="admin-hint">Remove a player and all their predictions.</p>
          {Object.entries(users).length === 0 ? (
            <p className="admin-hint">No players yet.</p>
          ) : (
            <div className="player-list">
              {Object.entries(users).map(([id, user]) => (
                <div key={id} className="player-row">
                  <div className="player-info">
                    <span className="player-name">{user.displayName}</span>
                    <span className="player-id">{id}</span>
                  </div>
                  {confirmDelete === id ? (
                    <div className="player-confirm">
                      <span className="player-confirm-text">Delete?</span>
                      <button className="player-delete-yes" onClick={async () => {
                        await deleteUser(id)
                        setUsers(prev => { const next = { ...prev }; delete next[id]; return next })
                        setConfirmDelete(null)
                        setStatus(`Deleted ${user.displayName}`)
                        setTimeout(() => setStatus(''), 2000)
                      }}>Yes</button>
                      <button className="player-delete-no" onClick={() => setConfirmDelete(null)}>No</button>
                    </div>
                  ) : (
                    <button className="player-delete-btn" onClick={() => setConfirmDelete(id)}>
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === 'setup' && (
        <section className="admin-section">
          <h3>Seed Questions</h3>
          <p className="admin-hint">Push the question set to Firebase. Safe to re-run — overwrites existing questions but preserves saved answers.</p>
          <button className="admin-btn" onClick={seedQuestions}>
            Seed Pre-Tournament Questions
          </button>
        </section>
      )}

      {activeTab === 'results' && (
        <div className="results-panel">
          <p className="admin-hint">
            Set the actual result for each question. Scores auto-update for all players when you save.
          </p>

          {CATEGORIES.map(cat => {
            const questions = ALL_PRE_TOURNAMENT_QUESTIONS.filter(q => q.category === cat)
            return (
              <section key={cat} className="admin-section">
                <h3>{cat}</h3>
                {questions.map(q => (
                  <ResultRow
                    key={q.id}
                    question={q}
                    savedAnswer={savedAnswers[q.id]}
                    onSave={answer => handleSetAnswer(q.id, answer)}
                    onClear={() => handleClearAnswer(q.id)}
                  />
                ))}
              </section>
            )
          })}
        </div>
      )}

      {status && <div className="admin-status">{status}</div>}
    </div>
  )
}

function ResultRow({ question, savedAnswer, onSave, onClear }) {
  const [draft, setDraft] = useState('')
  const { id, text, type, options, group, teams } = question
  const isResolved = savedAnswer != null

  const displayText = type === 'group-winner' ? `Group ${group} Winner` : text

  return (
    <div className={`result-row ${isResolved ? 'resolved' : ''}`}>
      <div className="result-question">
        <span className="result-q-text">{displayText}</span>
        {isResolved && (
          <span className="result-saved">
            ✓ {type === 'pick-team' || type === 'group-winner'
              ? `${getFlag(savedAnswer)} ${savedAnswer}`
              : savedAnswer}
          </span>
        )}
      </div>

      <div className="result-input">
        {(type === 'pick-one' || type === 'yes-no') && !question.freeText && (
          <div className="result-options">
            {(options || []).map(opt => {
              const optValue = typeof opt === 'object' ? opt.value : opt
              const optLabel = typeof opt === 'object' ? opt.label : opt
              return (
                <button
                  key={optValue}
                  className={`result-opt ${savedAnswer === optValue ? 'active' : ''}`}
                  onClick={() => onSave(optValue)}
                >
                  {optLabel}
                </button>
              )
            })}
          </div>
        )}

        {(type === 'pick-team' || type === 'group-winner') && (
          <select
            className="result-select"
            value={savedAnswer || ''}
            onChange={e => e.target.value && onSave(e.target.value)}
          >
            <option value="">Select...</option>
            {(teams || options || []).map(t => (
              <option key={t} value={t}>{getFlag(t)} {t}</option>
            ))}
          </select>
        )}

        {type === 'exact-number' && (
          <div className="result-number">
            <input
              type="number"
              min="0"
              value={draft || (savedAnswer ?? '')}
              onChange={e => setDraft(e.target.value)}
              placeholder="Answer"
              className="result-num-input"
            />
            <button
              className="result-save-btn"
              onClick={() => { onSave(Number(draft || savedAnswer)); setDraft('') }}
              disabled={!draft && savedAnswer == null}
            >
              Save
            </button>
          </div>
        )}

        {question.freeText && (
          <div className="result-number">
            <input
              type="text"
              value={draft || (savedAnswer ?? '')}
              onChange={e => setDraft(e.target.value)}
              placeholder="Player name"
              className="result-num-input"
              style={{ width: '200px' }}
            />
            <button
              className="result-save-btn"
              onClick={() => { onSave(draft || savedAnswer); setDraft('') }}
              disabled={!draft && savedAnswer == null}
            >
              Save
            </button>
          </div>
        )}

        {isResolved && (
          <button className="result-clear" onClick={onClear}>Clear</button>
        )}
      </div>
    </div>
  )
}
