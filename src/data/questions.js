import { ALL_TEAMS, GROUPS } from './teams'

const POT_1_AND_FAVORITES = [
  'United States', 'Mexico', 'Canada',
  'Spain', 'Argentina', 'France', 'England',
  'Brazil', 'Portugal', 'Netherlands', 'Belgium', 'Germany',
  'Croatia', 'Morocco'
]

const DARK_HORSE_TEAMS = ALL_TEAMS.filter(t => !POT_1_AND_FAVORITES.includes(t))

export const GROUP_WINNER_QUESTIONS = Object.entries(GROUPS).map(([letter, teams]) => ({
  id: `group_${letter}_winner`,
  text: `Group ${letter} Winner`,
  type: 'group-winner',
  group: letter,
  teams,
  points: 10,
  category: 'Group Stage'
}))

export const PRE_TOURNAMENT_QUESTIONS = [
  // ─── Tournament Picks ───
  {
    id: 'winner',
    text: 'Who will win the 2026 World Cup?',
    type: 'pick-team',
    options: ALL_TEAMS,
    points: 50,
    category: 'Tournament Picks'
  },
  {
    id: 'runner_up',
    text: 'Who will be the runner-up?',
    type: 'pick-team',
    options: ALL_TEAMS,
    points: 30,
    category: 'Tournament Picks'
  },
  {
    id: 'golden_boot',
    text: 'Who will win the Golden Boot (top scorer)?',
    type: 'pick-one',
    options: [
      { label: '🇫🇷 Kylian Mbappé', value: 'Kylian Mbappé' },
      { label: '🏴󠁧󠁢󠁥󠁮󠁧󠁿 Harry Kane', value: 'Harry Kane' },
      { label: '🇦🇷 Lionel Messi', value: 'Lionel Messi' },
      { label: '🇪🇸 Lamine Yamal', value: 'Lamine Yamal' },
      { label: '🇳🇴 Erling Haaland', value: 'Erling Haaland' },
      { label: '🇧🇷 Raphinha', value: 'Raphinha' },
      { label: '🇫🇷 Ousmane Dembélé', value: 'Ousmane Dembélé' },
      { label: '🇵🇹 Cristiano Ronaldo', value: 'Cristiano Ronaldo' },
      { label: '🇦🇷 Lautaro Martínez', value: 'Lautaro Martínez' },
      { label: '🇧🇷 Vinicius Junior', value: 'Vinicius Junior' },
      { label: '🏴󠁧󠁢󠁥󠁮󠁧󠁿 Bukayo Saka', value: 'Bukayo Saka' },
      { label: '🇪🇸 Mikel Oyarzabal', value: 'Mikel Oyarzabal' },
      { label: '🇨🇴 Luis Díaz', value: 'Luis Díaz' },
      { label: '🇳🇱 Cody Gakpo', value: 'Cody Gakpo' },
      { label: '🇦🇷 Julián Álvarez', value: 'Julián Álvarez' },
      { label: '🇺🇾 Darwin Núñez', value: 'Darwin Núñez' },
      { label: '🇩🇪 Kai Havertz', value: 'Kai Havertz' },
      { label: '🇪🇬 Mohamed Salah', value: 'Mohamed Salah' },
      { label: 'Other', value: 'Other' }
    ],
    points: 40,
    category: 'Tournament Picks'
  },
  // ─── Group Stage ───
  {
    id: 'first_team_out',
    text: 'Name a team that will NOT make it out of the group stage.',
    type: 'pick-team',
    options: ALL_TEAMS,
    points: 10,
    category: 'Group Stage'
  },
  {
    id: 'group_stage_goals',
    text: 'How many total goals will be scored in the group stage? (within 10)',
    type: 'exact-number',
    points: 10,
    tolerance: 10,
    category: 'Group Stage'
  },
  // ─── Knockout Stage ───
  {
    id: 'dark_horse',
    text: 'Name a dark horse that will reach the quarterfinals.',
    subtitle: 'Excludes Pot 1 teams (hosts + top 9 ranked) and recent QF makers Croatia & Morocco.',
    type: 'pick-team',
    options: DARK_HORSE_TEAMS,
    points: 30,
    category: 'Knockout Stage'
  },
  {
    id: 'host_best',
    text: 'Which host nation will go furthest? (USA, Mexico, Canada)',
    type: 'pick-one',
    options: ['United States', 'Mexico', 'Canada'],
    points: 10,
    category: 'Knockout Stage'
  },
  {
    id: 'usa_finish',
    text: 'How far will the USA go?',
    type: 'pick-one',
    options: ['Group stage exit', 'Round of 32', 'Round of 16', 'Quarterfinals', 'Semifinals', 'Final', 'Winner'],
    points: 15,
    category: 'Knockout Stage'
  },
  {
    id: 'biggest_ko_upset',
    text: 'Will a team ranked outside the top 20 reach the quarterfinals?',
    subtitle: 'Outside top 20: Algeria, Australia, Austria, Bosnia & Herzegovina, Canada, Cape Verde, Czech Republic, Curaçao, DR Congo, Ecuador, Egypt, Ghana, Haiti, Iran, Iraq, Ivory Coast, Jordan, New Zealand, Norway, Panama, Paraguay, Qatar, Saudi Arabia, Scotland, South Africa, South Korea, Sweden, Tunisia, Turkey, Uzbekistan',
    type: 'yes-no',
    options: ['Yes', 'No'],
    points: 15,
    category: 'Knockout Stage'
  },
  {
    id: 'extra_time_finals',
    text: 'Will the final go to extra time?',
    type: 'yes-no',
    options: ['Yes', 'No'],
    points: 15,
    category: 'Knockout Stage'
  },
  {
    id: 'african_qf',
    text: 'Will an African team reach the quarterfinals?',
    type: 'yes-no',
    options: ['Yes', 'No'],
    points: 15,
    category: 'Knockout Stage'
  },
  {
    id: 'highest_scoring_ko',
    text: 'What will the most goals in a single knockout match be?',
    type: 'exact-number',
    points: 10,
    category: 'Knockout Stage'
  },
  // ─── Players & Wildcards ───
  {
    id: 'sleeper_scorer',
    text: 'Name someone NOT on the Golden Boot list who will score a goal.',
    type: 'pick-one',
    options: ['Other'],
    freeText: true,
    points: 30,
    category: 'Players & Wildcards'
  },
  {
    id: 'messi_goals',
    text: 'How many goals will Messi score? (if he plays)',
    type: 'exact-number',
    points: 10,
    category: 'Players & Wildcards'
  },
  {
    id: 'youngest_scorer',
    text: 'Will a player under 20 score in the tournament?',
    type: 'yes-no',
    options: ['Yes', 'No'],
    points: 10,
    category: 'Players & Wildcards'
  },
  {
    id: 'hat_trick',
    text: 'Will anyone score a hat trick?',
    type: 'yes-no',
    options: ['Yes', 'No'],
    points: 15,
    category: 'Players & Wildcards'
  },
  {
    id: 'var_overturns',
    text: 'How many VAR-overturned goals will there be in the whole tournament?',
    type: 'exact-number',
    points: 10,
    category: 'Players & Wildcards'
  },
  {
    id: 'earliest_red',
    text: 'Will a player get a red card in the first 15 minutes of any match?',
    type: 'yes-no',
    options: ['Yes', 'No'],
    points: 15,
    category: 'Players & Wildcards'
  }
]

export const ALL_PRE_TOURNAMENT_QUESTIONS = [...PRE_TOURNAMENT_QUESTIONS, ...GROUP_WINNER_QUESTIONS]

export const CATEGORIES = ['Tournament Picks', 'Group Stage', 'Knockout Stage', 'Players & Wildcards']
