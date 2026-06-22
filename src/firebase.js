import { initializeApp } from 'firebase/app'
import { getDatabase, ref, set, get, push, onValue, update, remove } from 'firebase/database'

const firebaseConfig = {
  apiKey: "AIzaSyCyw4vjgPDSrmrONjEWEMHhPGCbJuhe6Ko",
  authDomain: "maps-api-for-social.firebaseapp.com",
  databaseURL: "https://maps-api-for-social-default-rtdb.firebaseio.com",
  projectId: "maps-api-for-social",
  storageBucket: "maps-api-for-social.firebasestorage.app",
  messagingSenderId: "952846431732",
  appId: "1:952846431732:web:d0931d28b2919374feb5a1"
}

const app = initializeApp(firebaseConfig)
const db = getDatabase(app)

// ─── Users ───

export async function registerUser(userId, displayName) {
  const userRef = ref(db, `oracle/users/${userId}`)
  const snap = await get(userRef)
  if (snap.exists()) return snap.val()

  const user = { displayName, joinedAt: Date.now(), totalScore: 0 }
  await set(userRef, user)
  return user
}

export async function getUser(userId) {
  const snap = await get(ref(db, `oracle/users/${userId}`))
  return snap.exists() ? snap.val() : null
}

export async function getAllUsers() {
  const snap = await get(ref(db, `oracle/users`))
  return snap.exists() ? snap.val() : {}
}

export function subscribeToUsers(callback) {
  return onValue(ref(db, `oracle/users`), snap => callback(snap.val() || {}))
}

export async function deleteUser(userId) {
  await remove(ref(db, `oracle/users/${userId}`))
  await remove(ref(db, `oracle/predictions/${userId}`))
}

// ─── Questions ───

export async function getPreTournamentQuestions() {
  const snap = await get(ref(db, `oracle/questions/preTournament`))
  return snap.exists() ? snap.val() : {}
}

export async function getMatchDayQuestions(matchDayId) {
  const snap = await get(ref(db, `oracle/questions/matchDay/${matchDayId}`))
  return snap.exists() ? snap.val() : {}
}

export async function getAllMatchDayQuestions() {
  const snap = await get(ref(db, `oracle/questions/matchDay`))
  return snap.exists() ? snap.val() : {}
}

export function subscribeToQuestions(callback) {
  return onValue(ref(db, `oracle/questions`), snap => callback(snap.val() || {}))
}

export async function savePreTournamentQuestions(questions) {
  await set(ref(db, `oracle/questions/preTournament`), questions)
}

export async function saveMatchDayQuestions(matchDayId, questions) {
  await set(ref(db, `oracle/questions/matchDay/${matchDayId}`), questions)
}

export async function resolveQuestion(path, answer) {
  await update(ref(db, `oracle/questions/${path}`), { answer, resolvedAt: Date.now() })
}

// ─── Predictions ───

export async function submitPredictions(userId, section, predictions) {
  await set(ref(db, `oracle/predictions/${userId}/${section}`), {
    ...predictions,
    submittedAt: Date.now()
  })
}

export async function getUserPredictions(userId) {
  const snap = await get(ref(db, `oracle/predictions/${userId}`))
  return snap.exists() ? snap.val() : {}
}

export async function getAllPredictions() {
  const snap = await get(ref(db, `oracle/predictions`))
  return snap.exists() ? snap.val() : {}
}

export function subscribeToPredictions(callback) {
  return onValue(ref(db, `oracle/predictions`), snap => callback(snap.val() || {}))
}

// ─── Scores ───

export async function updateUserScore(userId, totalScore, breakdown) {
  await update(ref(db, `oracle/users/${userId}`), { totalScore, scoreBreakdown: breakdown })
}

export function subscribeToScores(callback) {
  return onValue(ref(db, `oracle/users`), snap => {
    const users = snap.val() || {}
    const scores = Object.entries(users).map(([id, u]) => ({
      id,
      displayName: u.displayName,
      totalScore: u.totalScore || 0,
      scoreBreakdown: u.scoreBreakdown || {}
    }))
    scores.sort((a, b) => b.totalScore - a.totalScore)
    callback(scores)
  })
}

// ─── Matches (from API or manual) ───

export async function saveMatches(matches) {
  await set(ref(db, `oracle/matches`), matches)
}

export async function getMatches() {
  const snap = await get(ref(db, `oracle/matches`))
  return snap.exists() ? snap.val() : {}
}

export function subscribeToMatches(callback) {
  return onValue(ref(db, `oracle/matches`), snap => callback(snap.val() || {}))
}

export async function updateMatchResult(matchId, result) {
  await update(ref(db, `oracle/matches/${matchId}`), result)
}

// ─── Tournament Config ───

export async function getTournamentConfig() {
  const snap = await get(ref(db, `oracle/config`))
  return snap.exists() ? snap.val() : null
}

export async function saveTournamentConfig(config) {
  await set(ref(db, `oracle/config`), config)
}

// ─── Manual grades (per-player, for free-text questions) ───

export async function getManualGrades() {
  const snap = await get(ref(db, `oracle/manualGrades`))
  return snap.exists() ? snap.val() : {}
}

export async function setManualGrade(questionId, userId, isCorrect) {
  if (isCorrect === null) {
    await remove(ref(db, `oracle/manualGrades/${questionId}/${userId}`))
  } else {
    await set(ref(db, `oracle/manualGrades/${questionId}/${userId}`), isCorrect)
  }
}

// ─── Grading ───

export async function gradeAllPredictions() {
  const [questions, allPredictions, users, manualGrades] = await Promise.all([
    get(ref(db, `oracle/questions`)).then(s => s.val() || {}),
    get(ref(db, `oracle/predictions`)).then(s => s.val() || {}),
    get(ref(db, `oracle/users`)).then(s => s.val() || {}),
    get(ref(db, `oracle/manualGrades`)).then(s => s.val() || {})
  ])

  const updates = {}

  for (const [userId, userPreds] of Object.entries(allPredictions)) {
    let total = 0
    const breakdown = {}

    // Grade pre-tournament
    if (questions.preTournament && userPreds.preTournament) {
      let preScore = 0
      for (const [qId, q] of Object.entries(questions.preTournament)) {
        const userAnswer = userPreds.preTournament[qId]
        if (userAnswer === undefined) continue
        let pts = 0
        if (q.freeText) {
          // Per-player manual grading — admin checks each response off
          pts = manualGrades[qId]?.[userId] === true ? (q.points || 10) : 0
        } else {
          if (q.answer == null) continue
          pts = gradeAnswer(q, userAnswer)
        }
        preScore += pts
      }
      breakdown.preTournament = preScore
      total += preScore
    }

    // Grade match-day
    if (questions.matchDay && userPreds) {
      let mdScore = 0
      for (const [dayId, dayQs] of Object.entries(questions.matchDay)) {
        if (!userPreds[`matchDay_${dayId}`]) continue
        for (const [qId, q] of Object.entries(dayQs)) {
          if (q.answer == null) continue
          const userAnswer = userPreds[`matchDay_${dayId}`][qId]
          if (userAnswer === undefined) continue
          const pts = gradeAnswer(q, userAnswer)
          mdScore += pts
        }
      }
      breakdown.matchDay = mdScore
      total += mdScore
    }

    updates[`oracle/users/${userId}/totalScore`] = total
    updates[`oracle/users/${userId}/scoreBreakdown`] = breakdown
  }

  if (Object.keys(updates).length > 0) {
    await update(ref(db), updates)
  }
}

function gradeAnswer(question, userAnswer) {
  const base = question.points || 10

  switch (question.type) {
    case 'pick-one':
    case 'pick-team':
    case 'yes-no':
    case 'group-winner':
      return userAnswer === question.answer ? base : 0

    case 'exact-number': {
      const diff = Math.abs(Number(userAnswer) - Number(question.answer))
      const tol = question.tolerance || 3
      if (diff === 0) return base * 3
      if (diff <= Math.ceil(tol / 3)) return base * 2
      if (diff <= tol) return base
      return 0
    }

    default:
      return userAnswer === question.answer ? base : 0
  }
}
