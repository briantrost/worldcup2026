import { useState, useEffect, useRef } from 'react'
import { ALL_PRE_TOURNAMENT_QUESTIONS, CATEGORIES } from '../data/questions'
import { getFlag, HOST_TEAMS } from '../data/teams'
import { isPastDeadline, timeUntilDeadline } from '../data/tournament'
import { getUserPredictions, submitPredictions } from '../firebase'

export default function Predictions({ userId }) {
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0])
  const locked = isPastDeadline()

  useEffect(() => {
    getUserPredictions(userId).then(preds => {
      if (preds.preTournament) {
        setAnswers(preds.preTournament)
        setSubmitted(!!preds.preTournament.submittedAt)
      }
      setLoading(false)
    })
  }, [userId])

  function setAnswer(questionId, value) {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
  }

  async function handleSubmit() {
    setSaving(true)
    await submitPredictions(userId, 'preTournament', answers)
    setSubmitted(true)
    setSaving(false)
  }

  const answeredCount = ALL_PRE_TOURNAMENT_QUESTIONS.filter(q => answers[q.id] !== undefined).length
  const totalCount = ALL_PRE_TOURNAMENT_QUESTIONS.length
  const progress = Math.round((answeredCount / totalCount) * 100)

  if (loading) return <div className="loading">Loading your predictions...</div>

  const categoryQuestions = ALL_PRE_TOURNAMENT_QUESTIONS.filter(q => q.category === activeCategory)
  const isGroupStage = activeCategory === 'Group Stage'
  const groupTableQuestions = categoryQuestions.filter(q => q.type === 'group-winner')
  const regularQuestions = categoryQuestions.filter(q => q.type !== 'group-winner')

  return (
    <div className="predictions">
      <div className="predictions-header">
        <h2>Pre-Tournament Predictions</h2>
        <p className="predictions-subtitle">Lock in your picks before the first whistle!</p>

        <div className="progress-bar-container">
          <div className="progress-bar" style={{ width: `${progress}%` }} />
          <span className="progress-text">{answeredCount}/{totalCount} answered</span>
        </div>
      </div>

      <div className="category-pills">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            className={`pill ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
            {ALL_PRE_TOURNAMENT_QUESTIONS.filter(q => q.category === cat && answers[q.id] !== undefined).length ===
              ALL_PRE_TOURNAMENT_QUESTIONS.filter(q => q.category === cat).length && ' ✓'}
          </button>
        ))}
      </div>

      {groupTableQuestions.length > 0 && (
        <div className="groups-grid">
          {groupTableQuestions.map(q => (
            <GroupTable
              key={q.id}
              question={q}
              value={answers[q.id]}
              onChange={val => setAnswer(q.id, val)}
              disabled={submitted || locked}
            />
          ))}
        </div>
      )}

      {regularQuestions.length > 0 && (
        <div className="questions-list" style={groupTableQuestions.length > 0 ? { marginTop: 20 } : undefined}>
          {regularQuestions.map(q => (
            <QuestionCard
              key={q.id}
              question={q}
              value={answers[q.id]}
              onChange={val => setAnswer(q.id, val)}
              disabled={submitted || locked}
            />
          ))}
        </div>
      )}

      {!submitted && !locked && (
        <div className="submit-section">
          <p className="deadline-note">Submissions lock June 11 at 3:00 PM EST{timeUntilDeadline() ? ` (${timeUntilDeadline()} left)` : ''}</p>
          <button
            className="submit-btn"
            onClick={() => setShowConfirm(true)}
            disabled={answeredCount < totalCount || saving}
          >
            {saving ? 'Locking in...' : answeredCount < totalCount
              ? `Answer all ${totalCount} questions to submit`
              : '🔒 Lock In Predictions'}
          </button>
        </div>
      )}

      {!submitted && locked && (
        <div className="deadline-banner">
          Submissions are closed! The tournament has started.
        </div>
      )}

      {submitted && (
        <div className="submitted-banner">
          Your predictions are locked in! Good luck 🍀
        </div>
      )}

      {showConfirm && (
        <div className="modal-overlay" onClick={() => setShowConfirm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-icon">🔒</div>
            <h3>Lock in your predictions?</h3>
            <p>Once submitted, you won't be able to change your picks.</p>
            <div className="modal-actions">
              <button className="modal-btn cancel" onClick={() => setShowConfirm(false)}>
                Go Back
              </button>
              <button className="modal-btn confirm" onClick={() => {
                setShowConfirm(false)
                handleSubmit()
              }}>
                Lock It In!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function GroupTable({ question, value, onChange, disabled }) {
  const { group, teams, points } = question

  return (
    <div className={`group-table ${value ? 'answered' : ''}`}>
      <div className="group-table-header">
        <span className="group-letter">Group {group}</span>
        <span className="question-points">{points} pts</span>
      </div>
      <div className="group-table-body">
        <div className="group-table-columns">
          <span className="gt-col gt-col-pos">#</span>
          <span className="gt-col gt-col-team">Team</span>
          <span className="gt-col gt-col-pick">Pick</span>
        </div>
        {teams.map((team, i) => {
          const isHost = HOST_TEAMS.includes(team)
          const isSelected = value === team
          return (
            <div key={team} className={`group-table-row ${isSelected ? 'selected' : ''}`}>
              <span className="gt-col gt-col-pos">{i + 1}</span>
              <span className="gt-col gt-col-team">
                <span className="team-flag">{getFlag(team)}</span>
                <span>{team}</span>
                {isHost && <span className="host-badge">H</span>}
              </span>
              <span className="gt-col gt-col-pick">
                <button
                  className={`group-pick-btn ${isSelected ? 'picked' : ''}`}
                  onClick={() => !disabled && onChange(team)}
                  disabled={disabled}
                >
                  {isSelected ? '✓ Winner' : 'Pick'}
                </button>
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function QuestionCard({ question, value, onChange, disabled }) {
  const { text, type, options, points, freeText, subtitle } = question

  return (
    <div className={`question-card ${value !== undefined ? 'answered' : ''}`}>
      <div className="question-header">
        <span className="question-text">{text}</span>
        <span className="question-points">{points} pts</span>
      </div>
      {subtitle && <p className="question-subtitle">{subtitle}</p>}

      <div className="question-input">
        {freeText && (
          <input
            type="text"
            value={value || ''}
            onChange={e => onChange(e.target.value || undefined)}
            placeholder="Type a player name..."
            disabled={disabled}
            className="number-input"
            style={{ width: '100%', maxWidth: 320 }}
          />
        )}

        {(type === 'pick-one' || type === 'yes-no') && !freeText && (
          <div className="options-grid">
            {options.map(opt => {
              const optValue = typeof opt === 'object' ? opt.value : opt
              const optLabel = typeof opt === 'object' ? opt.label : opt
              return (
                <button
                  key={optValue}
                  className={`option-btn ${value === optValue ? 'selected' : ''}`}
                  onClick={() => !disabled && onChange(optValue)}
                  disabled={disabled}
                >
                  {optLabel}
                </button>
              )
            })}
          </div>
        )}

        {type === 'pick-team' && (
          <TeamDropdown
            options={options}
            value={value}
            onChange={onChange}
            disabled={disabled}
          />
        )}

        {type === 'exact-number' && (
          <input
            type="number"
            min="0"
            value={value ?? ''}
            onChange={e => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
            placeholder="Your prediction"
            disabled={disabled}
            className="number-input"
          />
        )}

        {type === 'exact-score' && (
          <input
            type="text"
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            placeholder="e.g. 2-1"
            disabled={disabled}
            className="score-input"
            pattern="\d+-\d+"
          />
        )}
      </div>
    </div>
  )
}

function TeamDropdown({ options, value, onChange, disabled }) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filtered = options.filter(t =>
    t.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="team-dropdown" ref={wrapperRef}>
      {value && !open ? (
        <button
          className="team-dropdown-selected"
          onClick={() => !disabled && setOpen(true)}
          disabled={disabled}
        >
          <span className="team-flag">{getFlag(value)}</span>
          <span>{value}</span>
          {!disabled && <span className="team-dropdown-change">Change</span>}
        </button>
      ) : (
        <>
          <input
            type="text"
            className="team-dropdown-search"
            placeholder="Search for a team..."
            value={search}
            onChange={e => { setSearch(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
            disabled={disabled}
            autoFocus={open}
          />
          {open && (
            <div className="team-dropdown-list">
              {filtered.map(team => (
                <button
                  key={team}
                  className="team-dropdown-item"
                  onClick={() => {
                    onChange(team)
                    setOpen(false)
                    setSearch('')
                  }}
                >
                  <span className="team-flag">{getFlag(team)}</span>
                  <span>{team}</span>
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="team-dropdown-empty">No teams found</div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
