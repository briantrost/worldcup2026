import { useState, useEffect } from 'react'
import { subscribeToScores, getAllPredictions, getPreTournamentQuestions, getManualGrades, scoreAnswer, maxPointsFor } from '../firebase'
import { isPastDeadline, timeUntilDeadline } from '../data/tournament'
import { ALL_PRE_TOURNAMENT_QUESTIONS, CATEGORIES } from '../data/questions'
import { getFlag } from '../data/teams'

export default function Leaderboard({ currentUserId }) {
  const [scores, setScores] = useState([])
  const [allPredictions, setAllPredictions] = useState({})
  const [expandedUser, setExpandedUser] = useState(null)
  const [resolvedAnswers, setResolvedAnswers] = useState({})
  const [manualGrades, setManualGrades] = useState({})
  const pastDeadline = isPastDeadline()

  useEffect(() => {
    const unsub = subscribeToScores(setScores)
    return unsub
  }, [])

  useEffect(() => {
    getAllPredictions().then(setAllPredictions)
    getManualGrades().then(setManualGrades)
    getPreTournamentQuestions().then(qs => {
      const answers = {}
      for (const [id, q] of Object.entries(qs || {})) {
        if (q.answer != null) answers[id] = q.answer
      }
      setResolvedAnswers(answers)
    })
  }, [])

  if (scores.length === 0) {
    return (
      <div className="leaderboard empty-state">
        <div className="empty-icon">🏆</div>
        <h2>No Players Yet</h2>
        <p>Invite your teammates to join and submit their predictions!</p>
      </div>
    )
  }

  if (!pastDeadline) {
    return (
      <div className="leaderboard">
        <h2>Submission Tracker</h2>
        <p className="predictions-subtitle">
          Picks are hidden until kickoff! {timeUntilDeadline() && `${timeUntilDeadline()} remaining`}
        </p>

        <div className="tracker-list">
          {scores.map(player => {
            const hasPredictions = allPredictions[player.id]?.preTournament?.submittedAt
            return (
              <div key={player.id} className={`tracker-row ${player.id === currentUserId ? 'current-user' : ''}`}>
                <span className="tracker-name">{player.displayName}</span>
                <span className={`tracker-status ${hasPredictions ? 'done' : 'pending'}`}>
                  {hasPredictions ? '✓ Submitted' : 'Not yet'}
                </span>
              </div>
            )
          })}
        </div>

        <div className="tracker-summary">
          {scores.length} player{scores.length !== 1 ? 's' : ''} joined
        </div>
      </div>
    )
  }

  return (
    <div className="leaderboard">
      <h2>Leaderboard</h2>

      {scores.slice(0, 3).length > 0 && (
        <div className="podium">
          {scores.slice(0, 3).map((player, i) => (
            <div key={player.id} className={`podium-spot place-${i + 1}`}>
              <div className="podium-medal">{['🥇', '🥈', '🥉'][i]}</div>
              <div className="podium-name">{player.displayName}</div>
              <div className="podium-score">{player.totalScore} pts</div>
            </div>
          ))}
        </div>
      )}

      <div className="scores-table">
        <div className="table-header">
          <span className="col-rank">#</span>
          <span className="col-name">Player</span>
          <span className="col-total">Score</span>
        </div>
        {scores.map((player, i) => (
          <div key={player.id}>
            <div
              className={`table-row clickable ${player.id === currentUserId ? 'current-user' : ''} ${expandedUser === player.id ? 'expanded' : ''}`}
              onClick={() => setExpandedUser(expandedUser === player.id ? null : player.id)}
            >
              <span className="col-rank">{i + 1}</span>
              <span className="col-name">
                {player.displayName}
                <span className="expand-hint">{expandedUser === player.id ? '▲' : '▼'}</span>
              </span>
              <span className="col-total">{player.totalScore} pts</span>
            </div>
            {expandedUser === player.id && (
              <PicksDetail
                userId={player.id}
                predictions={allPredictions[player.id]}
                resolvedAnswers={resolvedAnswers}
                manualGrades={manualGrades}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function PicksDetail({ userId, predictions, resolvedAnswers, manualGrades }) {
  if (!predictions?.preTournament) {
    return (
      <div className="picks-detail">
        <p className="picks-empty">No predictions submitted</p>
      </div>
    )
  }

  const preds = predictions.preTournament

  return (
    <div className="picks-detail">
      {CATEGORIES.map(cat => {
        const questions = ALL_PRE_TOURNAMENT_QUESTIONS.filter(q => q.category === cat)
        return (
          <div key={cat} className="picks-category">
            <h4 className="picks-category-title">{cat}</h4>
            {questions.map(q => {
              const userPick = preds[q.id]
              if (userPick === undefined) return null

              const isManual = q.freeText || q.manualGrade
              const grade = manualGrades?.[q.id]?.[userId]
              const actual = isManual ? undefined : resolvedAnswers[q.id]
              const isResolved = isManual ? grade != null : actual != null

              const earned = isResolved ? scoreAnswer({ ...q, answer: actual }, userPick, grade) : 0
              const maxPts = maxPointsFor(q)
              const tier = !isResolved ? '' : earned === 0 ? 'wrong' : earned >= maxPts ? 'correct' : 'close'

              const formatAnswer = (val) => {
                if (q.type === 'group-winner' || q.type === 'pick-team') {
                  return `${getFlag(val)} ${val}`
                }
                return val
              }

              return (
                <div key={q.id} className={`picks-row ${tier}`}>
                  <span className="picks-question">
                    {q.type === 'group-winner' ? `Group ${q.group}` : q.text}
                  </span>
                  <span className="picks-answer-group">
                    <span className={`picks-answer ${tier}`}>
                      {formatAnswer(userPick)}
                    </span>
                    {isResolved && earned < maxPts && actual != null && (
                      <span className="picks-actual">
                        → {formatAnswer(actual)}
                      </span>
                    )}
                    {isResolved && (
                      <span className={`picks-points ${tier}`}>+{earned}</span>
                    )}
                  </span>
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
