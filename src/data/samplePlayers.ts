import type { Player, Ratings } from '../types'

function r(p: Partial<Ratings>): Ratings {
  return {
    speed: 3,
    endurance: 3,
    ballControl: 3,
    dribbling: 3,
    passing: 3,
    shooting: 3,
    tackling: 3,
    positioning: 3,
    strength: 3,
    workRate: 3,
    communication: 3,
    handling: 1,
    ...p,
  }
}

/**
 * A demo roster so the app is useful out of the box. Replace these with your
 * real players from the Roster tab (or Clear All in the header).
 */
export const SAMPLE_PLAYERS: Player[] = [
  {
    id: 'sample-1',
    name: 'Avery',
    jersey: '1',
    available: true,
    notes: 'Loves playing in goal, brave on crosses.',
    ratings: r({ handling: 5, positioning: 4, communication: 4, strength: 3, speed: 2, passing: 3 }),
  },
  {
    id: 'sample-2',
    name: 'Brooklyn',
    jersey: '4',
    available: true,
    notes: 'Vocal organizer, strong in the tackle.',
    ratings: r({ tackling: 5, positioning: 4, strength: 4, communication: 5, speed: 3, passing: 3, endurance: 3 }),
  },
  {
    id: 'sample-3',
    name: 'Camila',
    jersey: '2',
    available: true,
    notes: 'Fast recovery defender.',
    ratings: r({ speed: 5, tackling: 4, workRate: 4, endurance: 4, positioning: 3, ballControl: 2 }),
  },
  {
    id: 'sample-4',
    name: 'Delaney',
    jersey: '3',
    available: true,
    notes: '',
    ratings: r({ tackling: 4, speed: 3, workRate: 4, endurance: 4, strength: 3, positioning: 3 }),
  },
  {
    id: 'sample-5',
    name: 'Emerson',
    jersey: '8',
    available: true,
    notes: 'Best passer on the team, sees everything.',
    ratings: r({ passing: 5, positioning: 5, ballControl: 4, endurance: 4, workRate: 4, dribbling: 3, communication: 4 }),
  },
  {
    id: 'sample-6',
    name: 'Finley',
    jersey: '6',
    available: true,
    notes: 'Never stops running.',
    ratings: r({ endurance: 5, workRate: 5, passing: 4, tackling: 4, positioning: 3, ballControl: 3 }),
  },
  {
    id: 'sample-7',
    name: 'Gabriela',
    jersey: '7',
    available: true,
    notes: 'Loves to take players on down the wing.',
    ratings: r({ speed: 5, dribbling: 5, ballControl: 4, endurance: 3, shooting: 3, workRate: 3 }),
  },
  {
    id: 'sample-8',
    name: 'Harper',
    jersey: '11',
    available: true,
    notes: '',
    ratings: r({ speed: 4, dribbling: 4, ballControl: 3, endurance: 4, workRate: 4, passing: 3 }),
  },
  {
    id: 'sample-9',
    name: 'Isla',
    jersey: '9',
    available: true,
    notes: 'Natural finisher, always in the right spot.',
    ratings: r({ shooting: 5, positioning: 4, ballControl: 4, speed: 4, dribbling: 3, strength: 3 }),
  },
  {
    id: 'sample-10',
    name: 'Jordyn',
    jersey: '10',
    available: true,
    notes: 'Creative, good with both feet.',
    ratings: r({ ballControl: 5, dribbling: 4, passing: 4, shooting: 4, positioning: 4, speed: 3 }),
  },
  {
    id: 'sample-11',
    name: 'Kinsley',
    jersey: '5',
    available: true,
    notes: 'Strong and steady, can fill in anywhere.',
    ratings: r({ strength: 4, tackling: 3, passing: 3, positioning: 3, workRate: 4, endurance: 3 }),
  },
  {
    id: 'sample-12',
    name: 'Luna',
    jersey: '13',
    available: true,
    notes: 'Backup keeper, also solid at the back.',
    ratings: r({ handling: 4, tackling: 3, positioning: 3, strength: 3, communication: 3 }),
  },
  {
    id: 'sample-13',
    name: 'Mia',
    jersey: '14',
    available: true,
    notes: 'Quick and fearless, still working on first touch.',
    ratings: r({ speed: 4, workRate: 5, endurance: 4, ballControl: 2, dribbling: 2, tackling: 3 }),
  },
  {
    id: 'sample-14',
    name: 'Nora',
    jersey: '12',
    available: true,
    notes: '',
    ratings: r({ passing: 4, ballControl: 3, positioning: 3, endurance: 3, shooting: 3, dribbling: 3 }),
  },
]
