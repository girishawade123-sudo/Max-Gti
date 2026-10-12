# MAX GTI — Gym Management System

A front-desk web app for running a gym: members, memberships, payments, attendance, trainers, slot bookings and equipment, all running on a relational database design. It has a dark theme, a neon-lime accent and dashboard-style screens, and it runs in the browser with no build step and no install.

> DBMS mini project, built on an ER diagram and relational schema for a gym management system.

---

## Features

- **Dashboard**: live gym-floor capacity, today's revenue, weekly attendance compared with last week, member of the month, renewal warnings and today's trainer floor plan
- **Members**: add, edit, delete, search, sort and paginate, with a profile page for each member showing an attendance heatmap, streaks and achievements
- **Memberships**: Monthly, Quarterly, Half-Yearly and Yearly plans priced in ₹, with expiry tracking
- **Payments**: UPI, Card, Cash and Bank Transfer, with revenue charts
- **Attendance**: entry and exit logging, including who is in the gym right now
- **Trainers and training assignments**: the many-to-many link between members and trainers, with workload per trainer
- **Slots and bookings**: hourly slots with a seat limit; full slots are blocked, and a member can hold only one booking per day
- **Equipment**: asset log with yearly upkeep cost by category, overdue-service flags and a "Mark serviced" button
- **Reports**: charts built from the data in the tables
- **Database structure page**: the schema, keys and relationships shown inside the app
- **Animations**: particle field, letter-shuffle titles and cards that glow under the cursor (switched off on mobile and for reduced-motion users)
- **Responsive**: works on desktop, tablet and phone

## Tech stack

| Layer | Used |
|---|---|
| Frontend | HTML5, CSS3, vanilla JavaScript (ES6+) |
| Charts | Custom SVG (no chart library) |
| Fonts | Manrope, JetBrains Mono (Google Fonts) |
| Database design | MySQL schema (`database/schema.sql`) |

No frameworks, no npm and no build tools.

## Database design

**Core entities (the six in the original ER design):**

| Table | Purpose |
|---|---|
| `MEMBER` | Gym members and their personal details |
| `MEMBERSHIP` | Plan, start date and end date for each member |
| `PAYMENT` | Payments made against memberships |
| `ATTENDANCE` | Entry and exit records |
| `TRAINER` | Trainers and their specialisations |
| `TRAINING_ASSIGNMENT` | Bridge table that resolves the many-to-many link between MEMBER and TRAINER |

**Extension tables:**

| Table | Purpose |
|---|---|
| `SLOT` | Hourly booking windows, each with a seat limit |
| `BOOKING` | Bridge table that resolves the many-to-many link between MEMBER and SLOT |
| `EQUIPMENT` | Standalone equipment log (no foreign keys) |

**Relationships:**

```
MEMBER 1 ──── N MEMBERSHIP 1 ──── N PAYMENT
MEMBER 1 ──── N ATTENDANCE
MEMBER N ──── M TRAINER    (via TRAINING_ASSIGNMENT)
MEMBER N ──── M SLOT       (via BOOKING)
```

Every foreign key uses `ON DELETE CASCADE`. `database/schema.sql` holds the full DDL (primary keys, foreign keys, CHECK constraints, indexes) and the SQL queries behind each dashboard figure.

## Getting started

```bash
git clone https://github.com/girishawade123-sudo/max-gti.git
cd max-gti
```

Open `index.html` in any browser. You can sign in with any email and password, because this is a demo build running on sample data.

To set up the database in MySQL:

```bash
mysql -u root -p < database/schema.sql
```

## Project structure

```
max-gti/
├── index.html          # Page shell: login, sidebar, top bar
├── styles.css          # All styling (design tokens in :root)
├── app.js              # Data layer, sample data, charts, CRUD, pages
├── effects.css         # Visual effects styling
├── effects.js          # Particle field, shuffle text, card glow
├── database/
│   └── schema.sql      # MySQL DDL and dashboard queries
└── README.md
```

## How the data works

- `app.js` holds every table as an array inside a single `DB` object, matching the SQL schema field for field.
- Dashboard numbers (revenue, attendance rate, trainer workload, renewals) are worked out from those arrays each time a page loads; no totals are stored separately.
- The sample data is the same on every load: 86 members, about 290 memberships, about 325 payments, about 1,200 attendance rows, 7 trainers and 18 weeks of history. All names and phone numbers are Indian, and all amounts are in ₹.
- Edits are kept in memory only, so reloading the page brings back the sample data.
- Deleting a member also deletes their linked rows, as `ON DELETE CASCADE` would, and the confirmation box shows how many rows will go from each table.

## Customising

| What | Where |
|---|---|
| Colours and fonts | `:root` block at the top of `styles.css` |
| Plan names and prices | `MEMBERSHIP_PLANS` in `app.js` |
| Amount of sample data | `N_MEMBERS` in `app.js` |
| Turning off the effects | Delete `effects.css`, `effects.js` and their tags in `index.html` |

## Team

- **Girish Awade**: [@girishawade123-sudo](https://github.com/girishawade123-sudo)
- **Tanish**

Computer Engineering, Vidyalankar Institute of Technology, Mumbai

## License

For academic use.
