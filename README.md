# U12 Coach — 3-4-1 Lineup Planner

A coaching app for a U12 girls soccer team (9v9, 3-4-1 formation). Rate your
players once, and the app tells you who fits where, suggests the strongest
lineup, and helps you plan game day period by period with fair playing time.

Everything runs in the browser and saves to local storage — no account, no
server, works offline on the sideline.

## Run it

```bash
npm install
npm run dev      # local development
npm run build    # production build in dist/
npm test         # engine unit tests
```

## How it works

### Player ratings

Each player is rated 1–5 on twelve attributes, written to be age-appropriate
for U12: Speed, Endurance, First Touch, Dribbling, Passing, Finishing,
Defending, Game Sense, Strength, Work Rate, Leadership, and GK Hands.

### Position profiles

Every position in the 3-4-1 (GK, LB, CB, RB, LM, LCM, RCM, RM, ST) has a
weight from 0 (not needed) to 5 (critical) for each attribute — e.g. wide
mids prize Speed and Dribbling, the center back prizes Defending, Game Sense,
and Leadership. The defaults are sensible for 9v9, and all of them are
editable on the **Positions** tab.

### Fit scores

A player's fit for a position is her weighted attribute total as a percentage
of a perfect score:

```
fit = Σ(weight × rating) / Σ(weight × 5) × 100
```

A player's **overall** rating is her fit at her best position, so a
specialist keeper isn't punished for weak outfield skills.

### Lineup suggestion

The **Best XI** tab assigns the nine available players to the nine positions
using the Hungarian algorithm — it maximizes the *team's* total fit, which is
not the same as giving each player her individually best spot. It also shows
the runner-up for every position and a full player × position fit matrix.

### Game day

The **Game Day** tab plans a match in periods (default 4). Tap a bench player
then tap a pitch slot — or drag and drop — to place her; tap two filled slots
to swap. **Auto-plan whole game** fills every period, keeping anyone you
placed manually, trading a little fit for balanced minutes so everyone gets a
fair share. The playing-time table shows who plays which position in which
period at a glance. Players marked unavailable on the Roster tab are removed
from the plan automatically.

### Stats and the season

Game Day has a **Live stats** view for the sideline: one tap per event across
five concrete stats (goals, assists, shots on target, defensive stops, saves),
with undo and a running score. **End game & review** opens an optional
60-second review — 1–5 stars per player plus one-tap tags like *Great hustle*
or *Strong passing*, each mapped to an attribute — then archives the whole
game to the **Season** tab.

Season shows totals, the game log, and **rating suggestions**: once a player
has 3+ games of evidence (a stat rate well above the team, normalized by
periods played, or repeated review tags), the app proposes a +1 to the mapped
attribute with the evidence spelled out. Suggestions are accept/dismiss only —
ratings never change automatically, nudges to a 5 need extra games of proof,
and downward changes stay a coach judgment call (consistently low stars just
get a gentle "worth a second look" note).

### Team sync (multiple coaches)

The **Team sync** button in the header connects devices to one shared copy of
the data, stored in a Firestore document. One coach creates the team (which
uploads that device's data and generates a private share link); other coaches
open the link once and stay connected. Changes sync in real time,
last-write-wins, and keep working offline thanks to Firestore's persistent
local cache. Security model is "anyone with the link": the team code is an
unguessable random UUID, like a private document link.

Firestore rules should allow access only to the `teams` collection:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /teams/{teamId} {
      allow read, write: if true;
    }
  }
}
```

### Data

The app seeds a 14-player demo roster so you can explore. Use
**Export / Import** on the Roster tab to back up or move your data, and
**Clear all** to start fresh with your real team. Without team sync, data
lives in the browser's localStorage on each device.

## Tech

Vite + React + TypeScript, no runtime dependencies beyond React. State lives
in a single reducer persisted to `localStorage`. The rating/assignment engine
in `src/lib/` is covered by Vitest unit tests.
