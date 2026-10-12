/* ================================================================
   MAX GTI — Gym Management System
   Data layer mirrors the relational schema exactly:
   MEMBER, MEMBERSHIP, PAYMENT, ATTENDANCE, TRAINER, TRAINING_ASSIGNMENT
   Every dashboard number is derived from these six arrays.
   ================================================================ */

/* ---------- tiny utils ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad = n => String(n).padStart(2, '0');
const iso = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const today = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; })();  // real today — sample data is generated relative to it
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate()+n); return x; };
const parse = s => { const [y,m,d] = s.split('-').map(Number); return new Date(y, m-1, d); };
const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const fmtDate = s => { if(!s) return '—'; const d = parse(s); return `${pad(d.getDate())} ${MON[d.getMonth()]} ${d.getFullYear()}`; };
const fmtShort = s => { const d = parse(s); return `${pad(d.getDate())} ${MON[d.getMonth()]}`; };
const inr = n => '₹' + Math.round(n).toLocaleString('en-IN');
const inrK = n => n >= 100000 ? '₹' + (n/100000).toFixed(2) + 'L' : n >= 1000 ? '₹' + (n/1000).toFixed(1) + 'K' : '₹' + n;
const initials = n => n.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase();
const daysBetween = (a, b) => Math.round((parse(b) - parse(a)) / 86400000);
const uid = (prefix, arr, key) => prefix + (Math.max(0, ...arr.map(r => +String(r[key]).replace(/\D/g,''))) + 1);

/* seeded RNG so the sample data is identical on every load */
let _s = 20260820;
const rnd = () => { _s = (_s * 1664525 + 1013904223) % 4294967296; return _s / 4294967296; };
const pick = a => a[Math.floor(rnd() * a.length)];
const rint = (a, b) => a + Math.floor(rnd() * (b - a + 1));

/* ---------- icons ---------- */
const I = {
  grid:'<path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"/>',
  users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  card:'<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
  rupee:'<path d="M6 3h12M6 8h12M16 3c0 5-4 5-7 5l7 8"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  dumbbell:'<path d="M6 6v12M18 6v12M3 9v6M21 9v6M6 12h12"/>',
  link:'<path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/>',
  chart:'<path d="M3 3v18h18"/><path d="M7 15l4-5 3 3 5-7"/>',
  db:'<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
  cog:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2 2 2 0 1 1-4 0 1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 3 15a2 2 0 1 1 0-4 1.7 1.7 0 0 0 1.5-2.6l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 10 4.4a2 2 0 1 1 4 0 1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A1.7 1.7 0 0 0 21 11a2 2 0 1 1 0 4z"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
  bell:'<path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  edit:'<path d="M11 4H4v16h16v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z"/>',
  trash:'<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>',
  eye:'<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/>',
  download:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5M12 15V3"/>',
  filter:'<path d="M22 3H2l8 9.5V19l4 2v-8.5z"/>',
  x:'<path d="M18 6L6 18M6 6l12 12"/>',
  check:'<path d="M20 6L9 17l-5-5"/>',
  menu:'<path d="M3 6h18M3 12h18M3 18h18"/>',
  out:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/>',
  phone:'<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2 4.2 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.9 2.1z"/>',
  mail:'<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 6 10-6"/>',
  cal:'<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18M8 2v4M16 2v4"/>',
  login:'<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="M10 17l5-5-5-5M15 12H3"/>',
  arrow:'<path d="M12 19V5M5 12l7-7 7 7"/>',
  trend:'<path d="M23 6l-9.5 9.5-5-5L1 18"/><path d="M17 6h6v6"/>',
  badge:'<circle cx="12" cy="8" r="6"/><path d="M8.2 13.9L7 22l5-3 5 3-1.2-8.1"/>',
  file:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
  wallet:'<path d="M20 12V8H6a2 2 0 0 1 0-4h12v4"/><path d="M4 6v12a2 2 0 0 0 2 2h14v-4"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/>',
  pin:'<path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  inbox:'<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5h13l3.5 7v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6z"/>'
};
const ic = (n, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${I[n] || ''}</svg>`;

/* ================================================================
   SAMPLE DATA — the six tables
   ================================================================ */
const FIRST_M = ['Aarav','Rohan','Siddharth','Vikram','Aditya','Nikhil','Kunal','Omkar','Rajat','Harsh','Yash','Pranav','Sameer','Tejas','Aniket','Devansh','Karan','Shreyas','Manav','Ritesh','Gaurav','Abhishek','Chirag','Mihir'];
const FIRST_F = ['Ananya','Priya','Sneha','Ishita','Meera','Kavya','Riya','Neha','Divya','Tanvi','Pooja','Shruti','Aditi','Rutuja','Sakshi','Nandini','Prachi','Vaishnavi','Isha','Aarohi'];
const LAST = ['Sharma','Patil','Deshmukh','Iyer','Kulkarni','Joshi','Mehta','Nair','Reddy','Shetty','Awade','Bhosale','Rane','Gupta','Chavan','Pawar','Sawant','Malhotra','Kapoor','Menon','Salunkhe','Naik','Thakur','Varma'];
const AREAS = ['Andheri West','Bandra East','Juhu','Versova','Goregaon West','Malad East','Powai','Vile Parle','Santacruz West','Lokhandwala','Jogeshwari','Khar West'];
const STREET = ['Sai Residency','Green Acres','Shanti Nagar','Pearl Heights','Om Sadan','Silver Oak','Krishna Kunj','Vasant Vihar','Sunrise Apartments','Palm Grove'];

const MEMBERSHIP_PLANS = {
  'Monthly':      { months: 1,  price: 2200 },
  'Quarterly':    { months: 3,  price: 5800 },
  'Half-Yearly':  { months: 6,  price: 10500 },
  'Yearly':       { months: 12, price: 18500 }
};
const PLAN_NAMES = Object.keys(MEMBERSHIP_PLANS);
const PAY_METHODS = ['UPI','Card','Cash','Bank Transfer'];
const SPECIALIZATIONS = ['Strength Training','Weight Loss','Bodybuilding','CrossFit','Functional Training'];

const DB = { members: [], memberships: [], payments: [], attendance: [], trainers: [], assignments: [],
             slots: [], bookings: [], equipment: [] };

/* ---- SLOT — hourly booking windows the desk maintains by hand ---- */
[['05:30','06:30',20],['06:30','07:30',30],['07:30','08:30',30],['08:30','09:30',25],['09:30','10:30',20],
 ['17:00','18:00',30],['18:00','19:00',35],['19:00','20:00',35],['20:00','21:00',25],['21:00','22:00',15]
].forEach((sl, i) => DB.slots.push({
  Slot_ID: 'SLT' + pad(i + 1), Start_Time: sl[0], End_Time: sl[1], Capacity: sl[2], Status: 'Open'
}));

/* ---- EQUIPMENT — asset log with running maintenance cost ---- */
[['Treadmill (commercial)','Cardio',8,'2023-04-12',3200],['Elliptical cross-trainer','Cardio',5,'2023-04-12',2400],
 ['Spin bike','Cardio',10,'2024-01-20',1500],['Rowing machine','Cardio',4,'2024-07-02',1800],
 ['Smith machine','Strength',2,'2022-11-05',2600],['Leg press','Strength',2,'2022-11-05',2200],
 ['Lat pulldown','Strength',3,'2023-02-18',1600],['Chest press','Strength',2,'2023-02-18',1600],
 ['Cable crossover','Strength',2,'2023-09-30',2100],['Power rack','Strength',4,'2022-08-14',1200],
 ['Olympic barbell set','Free Weights',10,'2022-08-14',700],['Dumbbell rack (2.5–50 kg)','Free Weights',3,'2022-08-14',900],
 ['Kettlebell set','Free Weights',2,'2024-03-11',450],['Adjustable bench','Free Weights',8,'2023-06-21',600],
 ['Battle rope','Functional',4,'2024-05-08',350],['Plyo box set','Functional',3,'2024-05-08',300],
 ['Suspension trainer','Functional',6,'2025-01-15',400],['Assault bike','Functional',3,'2025-01-15',1900],
 ['Massage gun','Recovery',4,'2025-06-10',500],['Ice bath tub','Recovery',1,'2025-06-10',2800]
].forEach((e, i) => {
  const lastService = addDays(today, -rint(5, 150));
  const overdue = daysBetween(iso(lastService), iso(today)) > 90;
  DB.equipment.push({
    Equipment_ID: 'EQP' + pad(i + 1), Name: e[0], Category: e[1], Quantity: e[2],
    Purchase_Date: e[3], Last_Service_Date: iso(lastService), Maintenance_Cost: e[4],
    Status: overdue ? (rnd() < 0.25 ? 'Out of order' : 'Needs service') : (rnd() < 0.12 ? 'Needs service' : 'Working')
  });
});

/* ---- TRAINER ---- */
[
  ['Vikas Deshpande','Strength Training',62000,'2021-03-15','Active'],
  ['Sneha Kulkarni','Weight Loss',54000,'2022-07-01','Active'],
  ['Imran Shaikh','Bodybuilding',68000,'2020-11-20','Active'],
  ['Rutuja Pawar','Functional Training',48000,'2023-02-10','Active'],
  ['Arjun Nair','CrossFit',58000,'2022-01-05','Active'],
  ['Pooja Shetty','Weight Loss',46000,'2024-06-18','Active'],
  ['Mahesh Bhosale','Strength Training',51000,'2023-09-12','On Leave']
].forEach((t, i) => {
  DB.trainers.push({
    Trainer_ID: 'TRN' + pad(i + 1), Name: t[0],
    Phone: '+91 98' + rint(10000000, 99999999),
    Email: t[0].toLowerCase().replace(/\s/g, '.') + '@maxgti.in',
    Specialization: t[1], Salary: t[2], Joining_Date: t[3], Status: t[4]
  });
});

/* ---- MEMBER + MEMBERSHIP + PAYMENT + TRAINING_ASSIGNMENT ---- */
const N_MEMBERS = 86;
for (let i = 0; i < N_MEMBERS; i++) {
  const female = rnd() < 0.42;
  const name = (female ? pick(FIRST_F) : pick(FIRST_M)) + ' ' + pick(LAST);
  const id = 'MEM' + pad(i + 1);
  const joined = addDays(today, -rint(5, 1000));
  const status = rnd() < 0.84 ? 'Active' : (rnd() < 0.65 ? 'Inactive' : 'Suspended');
  DB.members.push({
    Member_ID: id, Name: name,
    Date_of_Birth: iso(new Date(rint(1978, 2006), rint(0, 11), rint(1, 28))),
    Gender: female ? 'Female' : 'Male',
    Phone: '+91 ' + rint(70, 99) + rint(10000000, 99999999),
    Email: name.toLowerCase().replace(/\s/g, '.') + rint(1, 99) + '@gmail.com',
    Address: `${rint(101, 1204)}, ${pick(STREET)}, ${pick(AREAS)}, Mumbai`,
    Emergency_Contact: '+91 ' + rint(70, 99) + rint(10000000, 99999999),
    Join_Date: iso(joined), Status: status
  });

  /* MEMBERSHIP — a renewal chain from the join date onwards.
     Active members keep renewing past today; lapsed ones stop somewhere behind. */
  const stopAt = status === 'Active' ? addDays(today, rint(1, 20)) : addDays(today, -rint(25, 420));
  let cursor = joined, guard = 0;
  while (cursor < stopAt && guard++ < 16) {
    const plan = pick(PLAN_NAMES);
    const p = MEMBERSHIP_PLANS[plan];
    const start = cursor;
    const end = addDays(start, p.months * 30);
    const msId = 'MS' + pad(DB.memberships.length + 1);
    const msStatus = start > today ? 'Pending' : (end >= today ? 'Active' : 'Expired');
    const price = p.price - (rnd() < 0.22 ? 500 : 0);
    DB.memberships.push({
      Membership_ID: msId, Member_ID: id, Membership_Type: plan,
      Start_Date: iso(start), End_Date: iso(end), Price: price, Status: msStatus
    });

    /* PAYMENT — settled at the start of the plan, sometimes in two instalments */
    const parts = rnd() < 0.2 ? 2 : 1;
    for (let k = 0; k < parts; k++) {
      const pd = addDays(start, k === 0 ? rint(0, 2) : rint(20, 34));
      if (pd > today) continue;
      let pstatus = 'Paid';
      const roll = rnd();
      if (roll > 0.955) pstatus = 'Pending';
      else if (roll > 0.925) pstatus = 'Failed';
      else if (roll > 0.905) pstatus = 'Refunded';
      const method = pick(PAY_METHODS);
      DB.payments.push({
        Payment_ID: 'PAY' + pad(DB.payments.length + 1), Member_ID: id, Membership_ID: msId,
        Amount: Math.round(price / parts), Payment_Date: iso(pd),
        Payment_Method: method, Payment_Status: pstatus,
        Transaction_ID: method === 'Cash' ? 'CASH-' + rint(100000, 999999)
          : (method === 'UPI' ? 'UPI' : method === 'Card' ? 'CRD' : 'NEFT') + rint(10000000, 99999999)
      });
    }
    /* renewals are usually immediate; occasionally the member lapses for a while */
    cursor = addDays(end, rnd() < 0.16 ? rint(15, 70) : rint(0, 4));
  }

  /* TRAINING_ASSIGNMENT — M:N between MEMBER and TRAINER */
  if (rnd() < 0.6) {
    const rounds = rnd() < 0.35 ? 2 : 1;
    let c2 = addDays(joined, rint(0, 30));
    for (let r = 0; r < rounds; r++) {
      const tr = pick(DB.trainers);
      const end = addDays(c2, rint(60, 200));
      DB.assignments.push({
        Assignment_ID: 'ASG' + pad(DB.assignments.length + 1), Member_ID: id, Trainer_ID: tr.Trainer_ID,
        Start_Date: iso(c2), End_Date: iso(end)
      });
      c2 = addDays(end, rint(5, 40));
      if (c2 > today) break;
    }
  }
}

/* ---- ATTENDANCE — last 18 weeks ----
   Each member gets a personal training rate, so some build real streaks
   instead of everyone looking equally random. ---- */
const activeIds = DB.members.filter(m => m.Status === 'Active').map(m => m.Member_ID);
const habit = {};
activeIds.forEach(id => (habit[id] = 0.22 + rnd() * 0.62));
for (let d = 125; d >= 0; d--) {
  const day = addDays(today, -d);
  const dow = day.getDay();
  const base = dow === 0 ? 0.5 : dow === 6 ? 0.72 : 1;
  activeIds.forEach(mid => {
    if (rnd() > base * habit[mid]) return;
    const morning = rnd() < 0.55;
    const eh = morning ? rint(6, 10) : rint(17, 21);
    const em = rint(0, 59);
    const dur = rint(45, 115);
    const exit = new Date(2000, 0, 1, eh, em + dur);
    const stillIn = d === 0 && (exit.getHours() * 60 + exit.getMinutes()) > 20 * 60;
    DB.attendance.push({
      Attendance_ID: 'ATT' + pad(DB.attendance.length + 1), Member_ID: mid,
      Entry_Date: iso(day), Entry_Time: `${pad(eh)}:${pad(em)}`,
      Exit_Time: stillIn ? null : `${pad(exit.getHours())}:${pad(exit.getMinutes())}`
    });
  });
}
/* ---- BOOKING — members reserve a slot for a date; capacity is respected ---- */
const slotHour = sl => +sl.Start_Time.split(':')[0];
for (let d = 14; d >= -7; d--) {
  const day = iso(addDays(today, -d));
  const seats = {};
  DB.slots.forEach(sl => (seats[sl.Slot_ID] = sl.Capacity));
  activeIds.forEach(mid => {
    if (rnd() > habit[mid] * 0.85) return;
    const morning = rnd() < 0.5;
    const pool = DB.slots.filter(sl => morning ? slotHour(sl) < 12 : slotHour(sl) >= 12);
    const sl = pick(pool);
    if (!seats[sl.Slot_ID]) return;
    seats[sl.Slot_ID]--;
    let status = 'Booked';
    if (day < iso(today)) {
      const came = DB.attendance.some(a => a.Member_ID === mid && a.Entry_Date === day &&
        a.Entry_Time >= sl.Start_Time && a.Entry_Time < sl.End_Time);
      status = came ? 'Attended' : (rnd() < 0.55 ? 'No-show' : 'Cancelled');
    }
    DB.bookings.push({
      Booking_ID: 'BKG' + pad(DB.bookings.length + 1), Member_ID: mid, Slot_ID: sl.Slot_ID,
      Booking_Date: day, Status: status
    });
  });
}

/* make sure a handful are on the floor right now */
DB.attendance.filter(a => a.Entry_Date === iso(today)).slice(0, 9).forEach(a => a.Exit_Time = null);

/* ================================================================
   DERIVED HELPERS — every stat is computed from the six tables
   ================================================================ */
const member = id => DB.members.find(m => m.Member_ID === id);
const trainer = id => DB.trainers.find(t => t.Trainer_ID === id);
const membership = id => DB.memberships.find(m => m.Membership_ID === id);
const memberName = id => (member(id) || {}).Name || 'Unknown';
const trainerName = id => (trainer(id) || {}).Name || 'Unassigned';
const currentMembership = mid => DB.memberships.filter(m => m.Member_ID === mid && m.Status === 'Active')
  .sort((a, b) => b.End_Date.localeCompare(a.End_Date))[0]
  || DB.memberships.filter(m => m.Member_ID === mid).sort((a, b) => b.End_Date.localeCompare(a.End_Date))[0];
const memberPayments = mid => DB.payments.filter(p => p.Member_ID === mid).sort((a, b) => b.Payment_Date.localeCompare(a.Payment_Date));
const memberAttendance = mid => DB.attendance.filter(a => a.Member_ID === mid).sort((a, b) => (b.Entry_Date + b.Entry_Time).localeCompare(a.Entry_Date + a.Entry_Time));
const memberAssignments = mid => DB.assignments.filter(a => a.Member_ID === mid).sort((a, b) => b.Start_Date.localeCompare(a.Start_Date));
const activeAssignment = mid => memberAssignments(mid).find(a => a.End_Date >= iso(today) && a.Start_Date <= iso(today));
const trainerLoad = tid => DB.assignments.filter(a => a.Trainer_ID === tid && a.End_Date >= iso(today)).length;
const todayAtt = () => DB.attendance.filter(a => a.Entry_Date === iso(today));
const onFloor = () => todayAtt().filter(a => !a.Exit_Time);
const paidPayments = () => DB.payments.filter(p => p.Payment_Status === 'Paid');
const revenueOn = dateStr => paidPayments().filter(p => p.Payment_Date === dateStr).reduce((s, p) => s + p.Amount, 0);
const revenueInMonth = (y, m) => paidPayments().filter(p => { const d = parse(p.Payment_Date); return d.getFullYear() === y && d.getMonth() === m; }).reduce((s, p) => s + p.Amount, 0);
const expiringSoon = () => DB.memberships.filter(m => m.Status === 'Active' && daysBetween(iso(today), m.End_Date) <= 15);
const statusClass = s => ({Active:'b-ok', Paid:'b-ok', Completed:'b-ok', Inactive:'b-mute', Expired:'b-mute',
  Suspended:'b-bad', Failed:'b-bad', Pending:'b-warn', 'On Leave':'b-warn', Refunded:'b-info', Upcoming:'b-info'}[s] || 'b-mute');
const badge = s => `<span class="badge ${statusClass(s)}">${esc(s)}</span>`;

/* ---- derived stats for the redesigned dashboard and profiles ----
   All of these read the six tables; nothing new is stored. ---- */
const monthStart = (back = 0) => new Date(today.getFullYear(), today.getMonth() - back, 1);
const visitDates = mid => [...new Set(DB.attendance.filter(a => a.Member_ID === mid).map(a => a.Entry_Date))].sort();
const visitsInMonth = (mid, back = 0) => {
  const s = monthStart(back), e = new Date(s.getFullYear(), s.getMonth() + 1, 0);
  return DB.attendance.filter(a => a.Member_ID === mid && a.Entry_Date >= iso(s) && a.Entry_Date <= iso(e)).length;
};
function streaks(mid) {
  const d = visitDates(mid);
  let longest = 0, run = 0, prev = null, current = 0;
  d.forEach(day => { run = (prev && daysBetween(prev, day) === 1) ? run + 1 : 1; longest = Math.max(longest, run); prev = day; });
  if (prev && daysBetween(prev, iso(today)) <= 1) current = run;
  return { current, longest, total: DB.attendance.filter(a => a.Member_ID === mid).length, month: visitsInMonth(mid) };
}
function memberOfMonth() {
  const tally = {};
  const from = iso(monthStart());
  DB.attendance.filter(a => a.Entry_Date >= from).forEach(a => (tally[a.Member_ID] = (tally[a.Member_ID] || 0) + 1));
  const top = Object.entries(tally).sort((a, b) => b[1] - a[1])[0];
  if (!top) return null;
  const [id, visits] = top;
  const last = visitsInMonth(id, 1);
  return { id, visits, delta: last ? Math.round((visits - last) / last * 100) : null, best: streaks(id).longest };
}
const ACHIEVEMENTS = [
  { id: 's7',  icon: 'trend',  label: '7 day streak',        test: st => st.longest >= 7 },
  { id: 's14', icon: 'trend',  label: '14 day streak',       test: st => st.longest >= 14 },
  { id: 's30', icon: 'trend',  label: '30 day streak',       test: st => st.longest >= 30 },
  { id: 'w50', icon: 'badge',  label: '50 workouts',         test: st => st.total >= 50 },
  { id: 'v100', icon: 'badge', label: '100 visits',          test: st => st.total >= 100 },
  { id: 'cc',  icon: 'check',  label: 'Consistency champion', test: st => st.month >= 12 }
];
/* weekly attendance, Monday-first, for the current and previous week */
function weekAttendance() {
  const dow = (today.getDay() + 6) % 7;                 // 0 = Monday
  const monday = addDays(today, -dow);
  const labels = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  const counts = labels.map((_, i) => DB.attendance.filter(a => a.Entry_Date === iso(addDays(monday, i))).length);
  const elapsed = dow + 1;
  const total = counts.slice(0, elapsed).reduce((a, b) => a + b, 0);
  /* only the same number of days from last week, or the comparison is unfair */
  let prev = 0;
  for (let i = 0; i < elapsed; i++) prev += DB.attendance.filter(a => a.Entry_Date === iso(addDays(monday, i - 7))).length;
  const busiest = labels[counts.indexOf(Math.max(...counts))];
  return { labels, counts, total, prev, busiest, elapsed, avg: (total / elapsed).toFixed(1),
    delta: prev ? Math.round((total - prev) / prev * 100) : null };
}
/* today's floor plan — real SLOT rows with their bookings and trainers on duty */
function todaySchedule() {
  const date = iso(today);
  return DB.slots.filter(sl => sl.Status === 'Open').sort((a, b) => a.Start_Time.localeCompare(b.Start_Time))
    .map(sl => {
      const booked = bookingsFor(sl.Slot_ID, date).length;
      return { slot: sl, booked, present: presentIn(sl.Slot_ID, date), left: sl.Capacity - booked };
    }).filter(x => x.booked > 0);
}
/* ---- SLOT / BOOKING / EQUIPMENT helpers ---- */
const slot = id => DB.slots.find(s2 => s2.Slot_ID === id);
const slotLabel = id => { const s2 = slot(id); return s2 ? `${s2.Start_Time}–${s2.End_Time}` : '—'; };
const bookingsFor = (slotId, date) => DB.bookings.filter(b => b.Slot_ID === slotId && b.Booking_Date === date && b.Status !== 'Cancelled');
const seatsLeft = (slotId, date) => { const s2 = slot(slotId); return s2 ? s2.Capacity - bookingsFor(slotId, date).length : 0; };
/* who was actually inside during a slot window, taken from ATTENDANCE entry times */
const presentIn = (slotId, date) => { const s2 = slot(slotId); if (!s2) return 0;
  return DB.attendance.filter(a => a.Entry_Date === date && a.Entry_Time >= s2.Start_Time && a.Entry_Time < s2.End_Time).length; };
const memberBookings = mid => DB.bookings.filter(b => b.Member_ID === mid).sort((a, b) => b.Booking_Date.localeCompare(a.Booking_Date));
const openSlots = date => DB.slots.filter(s2 => s2.Status === 'Open' && seatsLeft(s2.Slot_ID, date) > 0)
  .sort((a, b) => a.Start_Time.localeCompare(b.Start_Time));
const maintenanceTotal = () => DB.equipment.reduce((sum, e) => sum + e.Maintenance_Cost * e.Quantity, 0);
const serviceDue = () => DB.equipment.filter(e => e.Status !== 'Working' || daysBetween(e.Last_Service_Date, iso(today)) > 90);

const membersWithTrainers = () => new Set(DB.assignments.filter(a => a.End_Date >= iso(today)).map(a => a.Member_ID)).size;

/* ================================================================
   CHARTS — hand-built SVG, no dependencies
   ================================================================ */
function lineChart(values, labels, { h = 190, fill = true, color = 'var(--lime)', id = 'lc' + Math.random().toString(36).slice(2) } = {}) {
  const w = 640, padL = 34, padB = 22, padT = 12;
  const max = Math.max(...values, 1) * 1.15, min = 0;
  const x = i => padL + i * ((w - padL - 8) / Math.max(values.length - 1, 1));
  const y = v => padT + (1 - (v - min) / (max - min)) * (h - padT - padB);
  const pts = values.map((v, i) => [x(i), y(v)]);
  const path = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const area = path + ` L${x(values.length - 1).toFixed(1)} ${h - padB} L${padL} ${h - padB} Z`;
  const grid = [0, .25, .5, .75, 1].map(f => {
    const gy = padT + f * (h - padT - padB), v = Math.round(max - f * (max - min));
    return `<line x1="${padL}" y1="${gy}" x2="${w - 8}" y2="${gy}" stroke="rgba(255,255,255,.06)"/>
            <text x="${padL - 8}" y="${gy + 3.5}" text-anchor="end" font-size="9" font-family="var(--f-m)" fill="var(--mute-2)">${v}</text>`;
  }).join('');
  const every = Math.ceil(labels.length / 8);
  const xl = labels.map((l, i) => i % every === 0 || i === labels.length - 1
    ? `<text x="${x(i)}" y="${h - 6}" text-anchor="middle" font-size="9" font-family="var(--f-m)" fill="var(--mute-2)">${esc(l)}</text>` : '').join('');
  const dots = pts.map((p, i) => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="8" fill="transparent"><title>${esc(labels[i])} · ${values[i]}</title></circle>`).join('');
  const last = pts[pts.length - 1];
  return `<svg viewBox="0 0 ${w} ${h}" style="width:100%;height:auto" role="img">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${color}" stop-opacity=".28"/><stop offset="100%" stop-color="${color}" stop-opacity="0"/>
    </linearGradient></defs>
    ${grid}${xl}
    ${fill ? `<path d="${area}" fill="url(#${id})"/>` : ''}
    <path d="${path}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"
      stroke-dasharray="2600" stroke-dashoffset="2600"><animate attributeName="stroke-dashoffset" from="2600" to="0" dur="1.1s" fill="freeze" calcMode="spline" keySplines="0.22 1 0.36 1" keyTimes="0;1"/></path>
    <circle cx="${last[0].toFixed(1)}" cy="${last[1].toFixed(1)}" r="3.5" fill="${color}"/>
    ${dots}</svg>`;
}
function barChart(values, labels, { h = 190, color = 'var(--lime)' } = {}) {
  const w = 640, padL = 34, padB = 22, padT = 12;
  const max = Math.max(...values, 1) * 1.15;
  const step = (w - padL - 8) / values.length, bw = Math.min(step * 0.55, 34);
  const grid = [0, .5, 1].map(f => {
    const gy = padT + f * (h - padT - padB);
    return `<line x1="${padL}" y1="${gy}" x2="${w - 8}" y2="${gy}" stroke="rgba(255,255,255,.06)"/>
            <text x="${padL - 8}" y="${gy + 3.5}" text-anchor="end" font-size="9" font-family="var(--f-m)" fill="var(--mute-2)">${Math.round(max - f * max)}</text>`;
  }).join('');
  const bars = values.map((v, i) => {
    const bh = (v / max) * (h - padT - padB);
    const bx = padL + i * step + (step - bw) / 2, by = h - padB - bh;
    return `<rect x="${bx.toFixed(1)}" y="${by.toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(bh, 1).toFixed(1)}" rx="4" fill="${color}" opacity=".85">
      <animate attributeName="height" from="0" to="${Math.max(bh, 1).toFixed(1)}" dur=".7s" fill="freeze"/>
      <animate attributeName="y" from="${h - padB}" to="${by.toFixed(1)}" dur=".7s" fill="freeze"/>
      <title>${esc(labels[i])} · ${v}</title></rect>
      <text x="${(bx + bw / 2).toFixed(1)}" y="${h - 6}" text-anchor="middle" font-size="9" font-family="var(--f-m)" fill="var(--mute-2)">${esc(labels[i])}</text>`;
  }).join('');
  return `<svg viewBox="0 0 ${w} ${h}" style="width:100%;height:auto">${grid}${bars}</svg>`;
}
function donut(segments, { size = 190, thick = 22, center = '' } = {}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = size / 2 - thick / 2, c = 2 * Math.PI * r;
  let off = 0;
  const arcs = segments.map(s => {
    const len = (s.value / total) * c;
    const el = `<circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${s.color}" stroke-width="${thick}"
      stroke-dasharray="${len.toFixed(2)} ${(c - len).toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}"
      transform="rotate(-90 ${size / 2} ${size / 2})" stroke-linecap="butt"><title>${esc(s.label)} · ${s.value}</title></circle>`;
    off += len; return el;
  }).join('');
  return `<svg viewBox="0 0 ${size} ${size}" style="width:100%;max-width:${size}px;height:auto;margin:auto">
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="rgba(255,255,255,.05)" stroke-width="${thick}"/>
    ${arcs}
    ${center ? `<text x="50%" y="47%" text-anchor="middle" font-size="26" font-family="var(--f-m)" fill="var(--chalk)">${esc(center.split('|')[0])}</text>
      <text x="50%" y="61%" text-anchor="middle" font-size="9.5" letter-spacing="2" fill="var(--mute-2)">${esc(center.split('|')[1] || '')}</text>` : ''}
  </svg>`;
}
function sparkline(values, color = 'var(--lime)') {
  const w = 120, h = 46, max = Math.max(...values, 1);
  const p = values.map((v, i) => `${(i * w / (values.length - 1)).toFixed(1)},${(h - (v / max) * (h - 6) - 3).toFixed(1)}`).join(' ');
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><polyline points="${p}" fill="none" stroke="${color}" stroke-width="1.6" opacity=".55"/></svg>`;
}

/* ================================================================
   TABLE ENGINE — search, sort, pagination, filters
   ================================================================ */
const TBL = {};
let pendingTable = null;
function table(id, cfg) {
  const s = TBL[id] || (TBL[id] = { q: '', sort: cfg.defaultSort || null, dir: cfg.defaultDir || 'desc', page: 1, per: cfg.per || 8, filter: 'All' });
  s.cfg = cfg;
  /* a link from another page may have queued a filter for this table */
  if (pendingTable && pendingTable.id === id) { Object.assign(s, pendingTable.patch); pendingTable = null; }
  return `<div class="card" id="tbl-${id}">${tableInner(id)}</div>`;
}
function tableInner(id) {
  const s = TBL[id], cfg = s.cfg;
  let rows = cfg.rows.slice();
  if (s.filter && s.filter !== 'All' && cfg.filterFn) rows = rows.filter(r => cfg.filterFn(r, s.filter));
  if (s.q) { const q = s.q.toLowerCase(); rows = rows.filter(r => cfg.search(r).toLowerCase().includes(q)); }
  if (s.sort) {
    const col = cfg.cols.find(c => c.k === s.sort);
    if (col) rows.sort((a, b) => {
      const va = col.val ? col.val(a) : a[col.k], vb = col.val ? col.val(b) : b[col.k];
      const r = typeof va === 'number' ? va - vb : String(va).localeCompare(String(vb));
      return s.dir === 'asc' ? r : -r;
    });
  }
  const total = rows.length, pages = Math.max(1, Math.ceil(total / s.per));
  if (s.page > pages) s.page = pages;
  const slice = rows.slice((s.page - 1) * s.per, s.page * s.per);

  const top = `<div class="tbl-top">
    ${cfg.searchable === false ? '' : `<div class="search"><span>${ic('search')}</span>
      <input class="inp" placeholder="${esc(cfg.placeholder || 'Search…')}" value="${esc(s.q)}" data-act="tq" data-tbl="${id}"></div>`}
    ${cfg.filters ? `<div class="chips">${['All', ...cfg.filters].map(f =>
      `<button class="chip ${s.filter === f ? 'on' : ''}" data-act="tf" data-tbl="${id}" data-v="${esc(f)}">${esc(f)}</button>`).join('')}</div>` : ''}
    <div class="grow"></div>
    ${cfg.topRight || ''}
    <span class="mini">${total} record${total === 1 ? '' : 's'}</span>
  </div>`;

  const head = `<tr>${cfg.cols.map(c => `<th class="${c.sort === false ? '' : 'sortable'} ${s.sort === c.k ? s.dir : ''}"
     ${c.sort === false ? '' : `data-act="ts" data-tbl="${id}" data-col="${c.k}"`} style="${c.thStyle || ''}">${esc(c.h)}${c.sort === false ? '' : '<span class="ar">▲</span>'}</th>`).join('')}</tr>`;

  const body = slice.length ? slice.map(r => `<tr ${cfg.rowAttrs ? cfg.rowAttrs(r) : ''}>${cfg.cols.map(c =>
    `<td data-label="${esc(c.h)}" style="${c.tdStyle || ''}">${c.render ? c.render(r) : esc(r[c.k] ?? '—')}</td>`).join('')}</tr>`).join('')
    : `<tr><td colspan="${cfg.cols.length}"><div class="empty-state">${ic('inbox')}<b>Nothing here yet</b>${esc(cfg.emptyHint || 'Adjust the search or add a record to get started.')}</div></td></tr>`;

  const win = [];
  for (let p = 1; p <= pages; p++) if (p === 1 || p === pages || Math.abs(p - s.page) <= 1) win.push(p); else if (win[win.length - 1] !== '…') win.push('…');
  const pager = `<div class="pager">Showing ${total ? (s.page - 1) * s.per + 1 : 0}–${Math.min(s.page * s.per, total)} of ${total}
    <div class="pg">
      <button data-act="tp" data-tbl="${id}" data-p="${s.page - 1}" ${s.page === 1 ? 'disabled' : ''}>‹</button>
      ${win.map(p => p === '…' ? '<button disabled>…</button>' : `<button class="${p === s.page ? 'on' : ''}" data-act="tp" data-tbl="${id}" data-p="${p}">${p}</button>`).join('')}
      <button data-act="tp" data-tbl="${id}" data-p="${s.page + 1}" ${s.page === pages ? 'disabled' : ''}>›</button>
    </div></div>`;

  return top + `<div class="table-wrap"><table><thead>${head}</thead><tbody>${body}</tbody></table></div>` + pager;
}
function refreshTable(id) {
  const host = $('#tbl-' + id); if (!host) return render();
  const focus = document.activeElement, wasSearch = focus && focus.dataset && focus.dataset.tbl === id && focus.dataset.act === 'tq';
  const pos = wasSearch ? focus.selectionStart : 0;
  host.innerHTML = tableInner(id);
  if (wasSearch) { const el = host.querySelector('[data-act="tq"]'); if (el) { el.focus(); el.setSelectionRange(pos, pos); } }
}

/* ================================================================
   MODAL / TOAST / FORM
   ================================================================ */
let modalOk = null;
function openModal({ title, sub = '', body, wide = false, ok = 'Save', danger = false, onOk }) {
  modalOk = onOk;
  $('#modalRoot').innerHTML = `<div class="overlay" data-act="overlay">
    <div class="modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true">
      <header><div><h3>${esc(title)}</h3>${sub ? `<span class="mini">${esc(sub)}</span>` : ''}</div>
        <button class="ia" style="margin-left:auto" data-act="close-modal" aria-label="Close">${ic('x')}</button></header>
      <div class="body">${body}</div>
      ${onOk === null ? '' : `<footer><button class="btn btn-ghost" data-act="close-modal">Cancel</button>
        <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" id="modalOk">${esc(ok)}</button></footer>`}
    </div></div>`;
  const first = $('#modalRoot .inp'); if (first) setTimeout(() => first.focus(), 60);
}
function closeModal() { $('#modalRoot').innerHTML = ''; modalOk = null; }
function toast(title, msg = '', bad = false) {
  const el = document.createElement('div');
  el.className = 'toast' + (bad ? ' bad' : '');
  el.innerHTML = `${ic(bad ? 'x' : 'check')}<div><b>${esc(title)}</b>${msg ? `<span>${esc(msg)}</span>` : ''}</div>`;
  $('#toasts').appendChild(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 260); }, 3200);
}
/* field spec -> html */
function formHTML(fields, v = {}) {
  return `<div class="form-grid">${fields.map(f => {
    const val = v[f.k] ?? f.def ?? '';
    const inner = f.type === 'select'
      ? `<select class="inp" data-k="${f.k}">${f.options.map(o => {
          const [ov, ol] = Array.isArray(o) ? o : [o, o];
          return `<option value="${esc(ov)}" ${String(val) === String(ov) ? 'selected' : ''}>${esc(ol)}</option>`; }).join('')}</select>`
      : f.type === 'textarea'
      ? `<textarea class="inp" rows="2" data-k="${f.k}">${esc(val)}</textarea>`
      : `<input class="inp" type="${f.type || 'text'}" data-k="${f.k}" value="${esc(val)}" ${f.type === 'number' ? 'min="0"' : ''} placeholder="${esc(f.ph || '')}">`;
    return `<div class="field ${f.full ? 'full' : ''}" data-field="${f.k}">
      <label>${esc(f.label)}${f.req ? ' *' : ''}</label>${inner}
      <div class="err">${esc(f.err || 'This field is required.')}</div></div>`;
  }).join('')}</div>`;
}
function readForm(fields) {
  const out = {}; let ok = true;
  fields.forEach(f => {
    const wrap = $(`[data-field="${f.k}"]`); if (!wrap) return;
    const el = wrap.querySelector('[data-k]');
    let val = el.value.trim();
    wrap.classList.remove('bad');
    if (f.req && !val) { wrap.classList.add('bad'); ok = false; }
    if (val && f.type === 'email' && !/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(val)) { wrap.classList.add('bad'); ok = false; }
    if (f.type === 'number') val = val === '' ? 0 : Number(val);
    out[f.k] = val;
  });
  return ok ? out : null;
}
function exportCSV(filename, rows) {
  if (!rows.length) return toast('Nothing to export', 'This view has no rows right now.', true);
  const cols = Object.keys(rows[0]);
  const csv = [cols.join(','), ...rows.map(r => cols.map(c => `"${String(r[c] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = filename; a.click(); URL.revokeObjectURL(a.href);
  toast('Export ready', `${filename} — ${rows.length} rows downloaded.`);
}

/* ================================================================
   APP STATE + NAV
   ================================================================ */
const state = { page: 'dashboard', memberId: null, trainerId: null, tab: 'overview', attRange: 7, hlEntity: null, slotDate: null };
const NAV = [
  ['dashboard', 'Dashboard', 'grid'], ['members', 'Members', 'users'], ['memberships', 'Memberships', 'card'],
  ['payments', 'Payments', 'rupee'], ['attendance', 'Attendance', 'clock'], ['trainers', 'Trainers', 'dumbbell'],
  ['assignments', 'Training Assignments', 'link'], ['slots', 'Slots & Bookings', 'cal'], ['equipment', 'Equipment', 'dumbbell'],
  ['reports', 'Reports', 'chart'], ['schema', 'Database Structure', 'db'], ['settings', 'Settings', 'cog']
];
const NAV_COUNT = {
  members: () => DB.members.length, memberships: () => DB.memberships.length, payments: () => DB.payments.length,
  attendance: () => todayAtt().length, trainers: () => DB.trainers.length, assignments: () => DB.assignments.length,
  slots: () => DB.slots.length, equipment: () => DB.equipment.length
};
function renderNav() {
  $('#nav').innerHTML = `<div class="nav-label">Floor</div>` +
    NAV.slice(0, 9).map(n => navLink(n)).join('') +
    `<div class="nav-label">Insight</div>` + NAV.slice(9).map(n => navLink(n)).join('');
}
const navLink = ([p, label, icon]) => `<a href="#${p}" data-act="go" data-page="${p}" class="${state.page === p ? 'on' : ''}">
  ${ic(icon)}<span>${label}</span>${NAV_COUNT[p] ? `<span class="count">${NAV_COUNT[p]()}</span>` : ''}</a>`;

const sec = (ix, title, side = '') => `<div class="sec-head"><span class="ix">${ix}</span><h2>${title}</h2><div class="rule"></div>${side ? `<span class="side">${side}</span>` : ''}</div>`;
const ph = (title, sub, acts = '') => `<div class="ph"><div><h1>${esc(title)}</h1><div class="sub">${sub}</div></div><div class="acts">${acts}</div></div>`;
const statCard = (icon, label, val, foot, spark) => `<div class="card stat">
  <div class="top">${ic(icon)}${esc(label)}</div><div class="val">${val}</div><div class="foot">${foot}</div>${spark || ''}</div>`;
const avatarFor = (name, cls = '') => `<div class="avatar ${cls}">${esc(initials(name))}</div>`;

/* ================================================================
   PAGE — DASHBOARD
   ================================================================ */
function pageDashboard() {
  const activeMembers = DB.members.filter(m => m.Status === 'Active');
  const inside = onFloor();
  const monthRev = revenueInMonth(today.getFullYear(), today.getMonth());
  const prevRev = revenueInMonth(today.getFullYear(), today.getMonth() - 1);
  const revDelta = prevRev ? Math.round((monthRev - prevRev) / prevRev * 100) : 0;
  const newThisMonth = DB.members.filter(m => m.Join_Date >= iso(monthStart())).length;
  const capacity = Math.round(inside.length / Math.max(activeMembers.length, 1) * 100);
  const week = weekAttendance();
  const soon = expiringSoon().sort((a, b) => a.End_Date.localeCompare(b.End_Date));
  const mom = memberOfMonth();
  const schedule = todaySchedule();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const clock = `${pad(new Date().getHours())}:${pad(new Date().getMinutes())}`;

  /* 14-day spark series for the KPI cards */
  const spark14 = [];
  for (let d = 13; d >= 0; d--) spark14.push(DB.attendance.filter(a => a.Entry_Date === iso(addDays(today, -d))).length);
  const joinSpark = [];
  for (let m = 5; m >= 0; m--) {
    const s0 = monthStart(m), e0 = new Date(s0.getFullYear(), s0.getMonth() + 1, 0);
    joinSpark.push(DB.members.filter(x => x.Join_Date >= iso(s0) && x.Join_Date <= iso(e0)).length);
  }

  /* revenue, last six months */
  const revLabels = [], revVals = [];
  for (let m = 5; m >= 0; m--) {
    const d = monthStart(m);
    revLabels.push(MON[d.getMonth()]);
    revVals.push(Math.round(revenueInMonth(d.getFullYear(), d.getMonth()) / 1000));
  }
  const methodMix = PAY_METHODS.map((m, i) => ({
    label: m, value: paidPayments().filter(p => p.Payment_Method === m).reduce((sum, p) => sum + p.Amount, 0),
    color: ['var(--lime)', 'var(--info)', 'var(--violet)', 'var(--ok)'][i]
  }));
  const methodTotal = methodMix.reduce((sum, m) => sum + m.value, 0) || 1;

  return `<div class="page">
    <div class="ph">
      <div>
        <h1>${greeting}, Girish</h1>
        <div class="sub">${DAYS[today.getDay()]}, ${fmtDate(iso(today))} — here's what's happening at MAX GTI today.</div>
      </div>
      <div class="acts">
        <span class="live-chip"><span class="pulse"></span> LIVE <b class="mono">${clock}</b></span>
        <button class="btn btn-primary" data-act="add" data-ent="member">${ic('plus')} Add member</button>
      </div>
    </div>

    <div class="grid g4">
      ${statCard('users', 'Total members', DB.members.length.toLocaleString('en-IN'),
        `<b>+${newThisMonth}</b> joined this month`, sparkline(joinSpark))}
      ${statCard('badge', 'Active members', activeMembers.length.toLocaleString('en-IN'),
        `${Math.round(activeMembers.length / Math.max(DB.members.length, 1) * 100)}% of the roll`, '')}
      ${statCard('rupee', 'Monthly revenue', inrK(monthRev),
        `<b class="${revDelta < 0 ? 'dn' : ''}">${revDelta >= 0 ? '+' : ''}${revDelta}%</b> vs ${MON[(today.getMonth() + 11) % 12]}`, '')}
      ${statCard('clock', 'Currently on floor', inside.length,
        `${todayAtt().length} checked in today`, sparkline(spark14))}
    </div>

    ${sec('01', 'This week on the floor', 'ATTENDANCE, Monday to Sunday')}
    <div class="grid g-21">
      <div class="card card-p">
        <div class="row-between" style="margin-bottom:6px">
          <div><b>Weekly attendance</b><div class="mini" style="margin-top:4px">Check-ins per day</div></div>
          ${week.delta === null ? '' : `<span class="badge ${week.delta < 0 ? 'b-bad' : 'b-ok'}">${week.delta >= 0 ? '+' : ''}${week.delta}% vs same days last week</span>`}
        </div>
        ${barChart(week.counts, week.labels, { h: 210 })}
        ${week.elapsed < 7 ? `<div class="mini" style="margin-top:-4px">${7 - week.elapsed} day${week.elapsed === 6 ? '' : 's'} still to come this week</div>` : ''}
        <div class="week-foot">
          <div><span class="mini">Visits, week to date</span><b class="mono">${week.total}</b></div>
          <div><span class="mini">Average per day</span><b class="mono">${week.avg}</b></div>
          <div><span class="mini">Busiest day</span><b class="mono">${week.busiest}</b></div>
        </div>
      </div>

      <div class="card card-p floor">
        <div class="row-between">
          <b>Live gym floor</b>
          <span class="live-chip sm"><span class="pulse"></span> LIVE</span>
        </div>
        <div class="floor-count"><b class="mono">${inside.length}</b><span class="mono">/ ${activeMembers.length}</span></div>
        <div class="mini" style="margin-bottom:12px">members inside right now</div>
        <div class="cap"><i style="width:${Math.min(capacity, 100)}%"></i></div>
        <div class="row-between" style="margin-top:8px">
          <span class="mini">Capacity</span><b class="mono" style="font-size:13px">${capacity}%</b>
        </div>
        <div class="floor-rows">
          <div><span class="dot-i lime"></span>Members training<b class="mono">${inside.length}</b></div>
          <div><span class="dot-i info"></span>Members with trainers<b class="mono">${membersWithTrainers()}</b></div>
          <div><span class="dot-i warn"></span>Memberships expiring soon<b class="mono">${soon.length}</b></div>
        </div>
        <button class="btn btn-sm btn-block" style="margin-top:16px" data-act="go" data-page="attendance">${ic('login')} Open attendance desk</button>
      </div>
    </div>

    ${sec('02', 'Revenue', 'Paid PAYMENT rows')}
    <div class="grid g-21">
      <div class="card card-p">
        <div class="row-between" style="align-items:flex-start">
          <div>
            <div class="mini">This month</div>
            <div class="big-num mono">${inrK(monthRev)}</div>
            <div class="mini" style="margin-top:2px"><b style="color:${revDelta < 0 ? 'var(--bad)' : 'var(--ok)'}">${revDelta >= 0 ? '+' : ''}${revDelta}%</b> vs last month</div>
          </div>
          <div class="mini" style="text-align:right">Lifetime collected<br><b class="mono" style="color:var(--chalk);font-size:15px">${inrK(paidPayments().reduce((s2, p) => s2 + p.Amount, 0))}</b></div>
        </div>
        ${barChart(revVals, revLabels, { h: 170 })}
        <div class="rev-table">
          <div class="rt-head"><span>Month</span><span>Revenue</span><span>Growth</span></div>
          ${revVals.map((v, i) => {
            const prev2 = i ? revVals[i - 1] : null;
            const g = prev2 ? Math.round((v - prev2) / prev2 * 100) : null;
            return `<div class="rt-row"><span>${revLabels[i]}${i === revVals.length - 1 ? ' <span class="mini">MTD</span>' : ''}</span><span class="mono">${inrK(v * 1000)}</span>
              <span class="mono" style="color:${g === null ? 'var(--mute-2)' : g < 0 ? 'var(--bad)' : 'var(--ok)'}">${g === null ? '—' : (g >= 0 ? '+' : '') + g + '%'}</span></div>`;
          }).join('')}
        </div>
      </div>
      <div class="card card-p">
        <b>Payment methods</b><div class="mini" style="margin:4px 0 10px">Share of collected value</div>
        ${donut(methodMix.map(m => ({ ...m, label: `${m.label} · ${inrK(m.value)} · ${Math.round(m.value / methodTotal * 100)}%` })),
          { center: inrK(methodTotal) + '|COLLECTED' })}
        <div class="legend" style="margin-top:16px">${methodMix.map(d => `<div class="lr">
          <span class="sw" style="background:${d.color}"></span>${d.label}
          <span class="n">${inrK(d.value)} · ${Math.round(d.value / methodTotal * 100)}%</span></div>`).join('')}</div>
      </div>
    </div>

    ${sec('03', 'Today', 'Members, renewals and the floor plan')}
    <div class="grid g3">
      ${mom ? `<div class="card mom">
        <div class="mom-top"><span class="badge b-lime">${ic('badge')} Member of the month</span></div>
        <div class="mom-body">
          ${avatarFor(memberName(mom.id), 'lg lime')}
          <h3>${esc(memberName(mom.id))}</h3>
          <div class="mini mono">${mom.id}</div>
          <div class="mom-stats">
            <div><b class="mono">${mom.visits}</b><span class="mini">visits this month</span></div>
            <div><b class="mono">${mom.best}</b><span class="mini">best streak (days)</span></div>
          </div>
          ${mom.delta === null ? '' : `<div class="mini" style="margin-top:10px">
            <b style="color:${mom.delta < 0 ? 'var(--warn)' : 'var(--ok)'}">${mom.delta >= 0 ? '+' : ''}${mom.delta}%</b> vs last month</div>`}
          <button class="btn btn-sm" style="margin-top:16px" data-act="member" data-id="${mom.id}">View profile →</button>
        </div>
      </div>` : ''}

      <div class="card">
        <div class="tbl-top"><b>${ic('bell')} Expiring soon</b><span class="grow"></span>
          <button class="btn btn-sm btn-ghost" data-act="go-expiring">View all →</button></div>
        ${soon.length ? soon.slice(0, 5).map(ms => {
          const left = daysBetween(iso(today), ms.End_Date);
          return `<div class="list-row" data-act="member" data-id="${ms.Member_ID}" style="cursor:pointer">
            ${avatarFor(memberName(ms.Member_ID))}
            <div style="min-width:0"><b>${esc(memberName(ms.Member_ID))}</b>
              <div class="mini" style="margin-top:2px">${esc(ms.Membership_Type)} · ends ${fmtDate(ms.End_Date)}</div></div>
            <span class="badge ${left <= 3 ? 'b-bad' : left <= 7 ? 'b-warn' : 'b-info'}" style="margin-left:auto">${left}d</span></div>`;
        }).join('') : `<div class="empty-state">${ic('check')}<b>Nothing expiring</b>No plan ends in the next 15 days.</div>`}
      </div>

      <div class="card card-p">
        <b>Today's slots</b>
        <div class="mini" style="margin:4px 0 16px">Bookings against capacity, and who has arrived</div>
        <div class="tl">${schedule.length ? schedule.map(s2 => `<div class="tl-row" data-act="go" data-page="slots">
          <span class="tl-time mono">${s2.slot.Start_Time}</span>
          <div class="tl-card">
            <div class="row-between"><b class="mono">${s2.slot.Start_Time}–${s2.slot.End_Time}</b>
              <span class="badge ${s2.left <= 0 ? 'b-bad' : s2.left <= 5 ? 'b-warn' : 'b-ok'}">${s2.left <= 0 ? 'Full' : s2.left + ' left'}</span></div>
            <div class="mini" style="margin-top:5px">${s2.booked} of ${s2.slot.Capacity} booked · ${s2.present} inside so far</div>
            <div class="bar" style="margin-top:8px;height:5px"><i style="width:${Math.min(Math.round(s2.booked / s2.slot.Capacity * 100), 100)}%"></i></div>
          </div></div>`).join('') : `<div class="empty-state">${ic('cal')}<b>No bookings today</b>Reserve a slot from the Slots page.</div>`}
        </div>
      </div>
    </div>

    ${sec('04', 'Quick actions', '')}
    <div class="qa">
      <button class="qa-btn" data-act="add" data-ent="member">${ic('users')}<span>Add member</span></button>
      <button class="qa-btn" data-act="add" data-ent="membership">${ic('card')}<span>New membership</span></button>
      <button class="qa-btn" data-act="add" data-ent="payment">${ic('rupee')}<span>Record payment</span></button>
      <button class="qa-btn" data-act="checkin">${ic('login')}<span>Mark attendance</span></button>
      <button class="qa-btn" data-act="add" data-ent="booking">${ic('cal')}<span>Book a slot</span></button>
      <button class="qa-btn" data-act="add" data-ent="trainer">${ic('dumbbell')}<span>Add trainer</span></button>
    </div>
  </div>`;
}

/* ================================================================
   PAGE — MEMBERS
   ================================================================ */
function pageMembers() {
  return `<div class="page">
    ${ph('Members', `${DB.members.length} rows in the MEMBER table`,
      `<button class="btn" data-act="export" data-ent="member">${ic('download')} Export</button>
       <button class="btn btn-primary" data-act="add" data-ent="member">${ic('plus')} Add member</button>`)}
    ${table('members', {
      rows: DB.members, per: 10, defaultSort: 'Join_Date', defaultDir: 'desc',
      placeholder: 'Search name, ID, phone, email…',
      search: r => `${r.Member_ID} ${r.Name} ${r.Phone} ${r.Email} ${r.Address}`,
      filters: ['Active', 'Inactive', 'Suspended'], filterFn: (r, f) => r.Status === f,
      rowAttrs: r => `data-act="member" data-id="${r.Member_ID}" style="cursor:pointer"`,
      cols: [
        { k: 'Member_ID', h: 'Member ID', render: r => `<span class="mono" style="color:var(--mute)">${r.Member_ID}</span>` },
        { k: 'Name', h: 'Name', render: r => `<div class="cell-main">${avatarFor(r.Name)}<div><b>${esc(r.Name)}</b>
            <span>${esc(r.Gender)} · ${new Date().getFullYear() - parse(r.Date_of_Birth).getFullYear()} yrs</span></div></div>` },
        { k: 'Phone', h: 'Phone', render: r => `<span class="mono">${esc(r.Phone)}</span>` },
        { k: 'Email', h: 'Email', render: r => `<span style="color:var(--mute)">${esc(r.Email)}</span>` },
        { k: 'Join_Date', h: 'Join date', render: r => `<span class="mono">${fmtDate(r.Join_Date)}</span>` },
        { k: 'plan', h: 'Plan', sort: false, render: r => { const ms = currentMembership(r.Member_ID); return ms ? esc(ms.Membership_Type) : '<span style="color:var(--mute-2)">—</span>'; } },
        { k: 'Status', h: 'Status', render: r => badge(r.Status) },
        { k: 'a', h: 'Actions', sort: false, tdStyle: 'text-align:right', render: r => rowActions('member', r.Member_ID, true) }
      ]
    })}
  </div>`;
}
const rowActions = (ent, id, withView) => `<div class="acts-cell">
  ${withView ? `<button class="ia" title="Open profile" data-act="${ent === 'member' ? 'member' : 'trainer'}" data-id="${id}">${ic('eye')}</button>` : ''}
  <button class="ia" title="Edit" data-act="edit" data-ent="${ent}" data-id="${id}">${ic('edit')}</button>
  <button class="ia del" title="Delete" data-act="del" data-ent="${ent}" data-id="${id}">${ic('trash')}</button></div>`;

/* ================================================================
   PAGE — MEMBER PROFILE
   ================================================================ */
function pageMemberProfile() {
  const m = member(state.memberId);
  if (!m) return `<div class="page">${ph('Member not found', 'That record no longer exists.')}</div>`;
  const ms = currentMembership(m.Member_ID);
  const pays = memberPayments(m.Member_ID);
  const att = memberAttendance(m.Member_ID);
  const asg = memberAssignments(m.Member_ID);
  const act = activeAssignment(m.Member_ID);
  const paid = pays.filter(p => p.Payment_Status === 'Paid').reduce((s, p) => s + p.Amount, 0);
  const st = streaks(m.Member_ID);
  const earned = ACHIEVEMENTS.filter(a => a.test(st)).length;
  const last30 = att.filter(a => daysBetween(a.Entry_Date, iso(today)) <= 30).length;
  const tabs = [['overview', 'Overview'], ['membership', `Membership · ${DB.memberships.filter(x => x.Member_ID === m.Member_ID).length}`],
    ['payments', `Payments · ${pays.length}`], ['attendance', `Attendance · ${att.length}`], ['trainer', `Trainer · ${asg.length}`]];

  let body = '';
  if (state.tab === 'overview') {
    body = `<div class="grid g2">
      <div class="card card-p"><b>Personal information</b>
        <dl class="kv" style="margin-top:16px">
          <dt>Member ID</dt><dd class="mono">${m.Member_ID}</dd>
          <dt>Date of birth</dt><dd>${fmtDate(m.Date_of_Birth)}</dd>
          <dt>Gender</dt><dd>${esc(m.Gender)}</dd>
          <dt>Phone</dt><dd class="mono">${esc(m.Phone)}</dd>
          <dt>Email</dt><dd>${esc(m.Email)}</dd>
          <dt>Address</dt><dd>${esc(m.Address)}</dd>
          <dt>Emergency</dt><dd class="mono">${esc(m.Emergency_Contact)}</dd>
          <dt>Join date</dt><dd>${fmtDate(m.Join_Date)}</dd>
          <dt>Status</dt><dd>${badge(m.Status)}</dd>
        </dl></div>
      <div style="display:grid;gap:14px;align-content:start">
        <div class="card card-p"><b>Current membership</b>
          ${ms ? `<div style="display:flex;align-items:baseline;gap:10px;margin:14px 0 10px">
              <span style="font-size:22px;font-weight:800">${esc(ms.Membership_Type)}</span>${badge(ms.Status)}</div>
            <div class="mini" style="margin-bottom:12px">${ms.Membership_ID} · ${fmtDate(ms.Start_Date)} → ${fmtDate(ms.End_Date)}</div>
            ${ms.Status === 'Active' ? (() => {
              const totalDays = daysBetween(ms.Start_Date, ms.End_Date) || 1;
              const used = Math.min(Math.max(daysBetween(ms.Start_Date, iso(today)), 0), totalDays);
              return `<div class="bar"><i style="width:${(used / totalDays * 100).toFixed(1)}%"></i></div>
                <div class="mini" style="margin-top:8px">${totalDays - used} of ${totalDays} days remaining</div>`;
            })() : ''}`
          : `<div class="empty-state" style="padding:24px 0">${ic('card')}<b>No membership on file</b>Sell this member a plan to start tracking payments.</div>`}
          <button class="btn btn-sm btn-primary" style="margin-top:14px" data-act="add" data-ent="membership" data-member="${m.Member_ID}">${ic('plus')} New membership</button>
        </div>
        <div class="grid g2">
          <div class="card stat"><div class="top">${ic('wallet')}Lifetime paid</div><div class="val" style="font-size:24px">${inrK(paid)}</div><div class="foot">${pays.length} payments</div></div>
          <div class="card stat"><div class="top">${ic('clock')}Visits · 30d</div><div class="val" style="font-size:24px">${last30}</div><div class="foot">${att.length} total visits</div></div>
        </div>
        <div class="card card-p"><b>Assigned trainer</b>
          ${act ? `<div style="display:flex;gap:12px;align-items:center;margin-top:14px">${avatarFor(trainerName(act.Trainer_ID), 'lime')}
              <div><b>${esc(trainerName(act.Trainer_ID))}</b><div class="mini" style="margin-top:3px">${esc((trainer(act.Trainer_ID) || {}).Specialization || '')} · till ${fmtDate(act.End_Date)}</div></div>
              <button class="btn btn-sm" style="margin-left:auto" data-act="trainer" data-id="${act.Trainer_ID}">Open</button></div>`
            : `<div class="mini" style="margin-top:12px">No active assignment.</div>
               <button class="btn btn-sm" style="margin-top:12px" data-act="add" data-ent="assignment" data-member="${m.Member_ID}">${ic('plus')} Assign a trainer</button>`}
        </div>
      </div></div>
      ${sec('01', 'Attendance stats', 'Derived from this member\'s ATTENDANCE rows')}
      <div class="grid g4">
        ${statCard('clock', 'Total visits', st.total, 'All time')}
        ${statCard('cal', 'This month', st.month, MON[today.getMonth()] + ' ' + today.getFullYear())}
        ${statCard('trend', 'Current streak', st.current + 'd', st.current ? 'Consecutive days' : 'Not training today')}
        ${statCard('badge', 'Longest streak', st.longest + 'd', 'Personal best')}
      </div>
      ${sec('02', 'Achievements', earned + ' of ' + ACHIEVEMENTS.length + ' unlocked')}
      <div class="ach-grid">${ACHIEVEMENTS.map(a => {
        const got = a.test(st);
        return `<div class="ach ${got ? 'on' : ''}">${ic(a.icon)}<div><b>${a.label}</b>
          <span class="mini">${got ? 'Unlocked' : 'Locked'}</span></div></div>`;
      }).join('')}</div>
      ${sec('03', 'Membership timeline', 'MEMBER → MEMBERSHIP')}
      <div class="card card-p"><div class="tl tl-flat">
        <div class="tl-row"><span class="tl-time mono">${fmtShort(m.Join_Date)}</span>
          <div class="tl-card"><b>Joined MAX GTI</b><div class="mini" style="margin-top:3px">MEMBER row created · ${fmtDate(m.Join_Date)}</div></div></div>
        ${DB.memberships.filter(x => x.Member_ID === m.Member_ID).sort((a, b) => a.Start_Date.localeCompare(b.Start_Date))
          .map((x, i) => `<div class="tl-row"><span class="tl-time mono">${fmtShort(x.Start_Date)}</span>
            <div class="tl-card"><b>${i === 0 ? 'First plan' : 'Renewal'} · ${esc(x.Membership_Type)}</b>
              <div class="mini" style="margin-top:3px">${x.Membership_ID} · ${fmtDate(x.Start_Date)} → ${fmtDate(x.End_Date)} · ${inr(x.Price)} ${badge(x.Status)}</div></div></div>`).join('')}
      </div></div></div>`;
  }
  if (state.tab === 'membership') {
    const rows = DB.memberships.filter(x => x.Member_ID === m.Member_ID).sort((a, b) => b.Start_Date.localeCompare(a.Start_Date));
    body = `<div class="card"><div class="table-wrap"><table>
      <thead><tr><th>Membership ID</th><th>Type</th><th>Start</th><th>End</th><th>Price</th><th>Status</th><th style="text-align:right">Actions</th></tr></thead>
      <tbody>${rows.length ? rows.map(r => `<tr>
        <td data-label="Membership ID" class="mono">${r.Membership_ID}</td>
        <td data-label="Type"><b>${esc(r.Membership_Type)}</b></td>
        <td data-label="Start" class="mono">${fmtDate(r.Start_Date)}</td>
        <td data-label="End" class="mono">${fmtDate(r.End_Date)}</td>
        <td data-label="Price" class="mono">${inr(r.Price)}</td>
        <td data-label="Status">${badge(r.Status)}</td>
        <td data-label="Actions" style="text-align:right">${rowActions('membership', r.Membership_ID)}</td></tr>`).join('')
        : `<tr><td colspan="7"><div class="empty-state">${ic('card')}<b>No memberships</b>Add one to start the payment chain.</div></td></tr>`}</tbody></table></div></div>`;
  }
  if (state.tab === 'payments') {
    body = `<div class="card"><div class="table-wrap"><table>
      <thead><tr><th>Payment ID</th><th>Membership</th><th>Amount</th><th>Date</th><th>Method</th><th>Transaction ID</th><th>Status</th></tr></thead>
      <tbody>${pays.length ? pays.map(p => `<tr>
        <td data-label="Payment ID" class="mono">${p.Payment_ID}</td>
        <td data-label="Membership" class="mono" style="color:var(--mute)">${p.Membership_ID}</td>
        <td data-label="Amount" class="mono">${inr(p.Amount)}</td>
        <td data-label="Date" class="mono">${fmtDate(p.Payment_Date)}</td>
        <td data-label="Method">${esc(p.Payment_Method)}</td>
        <td data-label="Transaction ID" class="mono" style="color:var(--mute)">${esc(p.Transaction_ID)}</td>
        <td data-label="Status">${badge(p.Payment_Status)}</td></tr>`).join('')
        : `<tr><td colspan="7"><div class="empty-state">${ic('rupee')}<b>No payments recorded</b>Record one from the Payments page.</div></td></tr>`}</tbody></table></div></div>`;
  }
  if (state.tab === 'attendance') {
    const labels = [], counts = [];
    for (let d = 29; d >= 0; d--) { const day = iso(addDays(today, -d)); labels.push(fmtShort(day)); counts.push(att.filter(a => a.Entry_Date === day).length); }
    const bk = memberBookings(m.Member_ID);
    const upcoming = bk.filter(b => b.Booking_Date >= iso(today) && b.Status === 'Booked');
    body = `<div class="card" style="margin-bottom:14px">
        <div class="tbl-top"><b>${ic('cal')} Slot bookings</b><span class="grow"></span>
          <span class="mini">${upcoming.length} upcoming · ${bk.filter(b => b.Status === 'Attended').length} attended</span>
          <button class="btn btn-sm btn-primary" data-act="add" data-ent="booking" data-member="${m.Member_ID}">${ic('plus')} Book a slot</button></div>
        ${bk.length ? bk.slice(0, 6).map(b => `<div class="list-row">
            <b class="mono slot-time" style="width:110px">${slotLabel(b.Slot_ID)}</b>
            <div style="min-width:0"><b>${fmtDate(b.Booking_Date)}</b>
              <div class="mini" style="margin-top:2px">${b.Booking_ID} · ${b.Slot_ID}</div></div>
            <span style="margin-left:auto;display:flex;gap:6px;align-items:center">${badge(b.Status)}
              ${rowActions('booking', b.Booking_ID)}</span></div>`).join('')
          : `<div class="empty-state">${ic('cal')}<b>No bookings yet</b>Reserve a slot to hold this member a seat.</div>`}
      </div>
      <div class="card card-p" style="margin-bottom:14px"><b>Last 30 days</b>
        <div class="mini" style="margin:4px 0 12px">${counts.reduce((a, b) => a + b, 0)} visits · avg ${(counts.reduce((a, b) => a + b, 0) / 30).toFixed(1)} per day</div>
        ${barChart(counts, labels.map((l, i) => i % 3 === 0 ? l : ''))}</div>
      <div class="card"><div class="table-wrap"><table>
        <thead><tr><th>Attendance ID</th><th>Entry date</th><th>Entry time</th><th>Exit time</th><th>Duration</th></tr></thead>
        <tbody>${att.slice(0, 20).map(a => `<tr>
          <td data-label="Attendance ID" class="mono">${a.Attendance_ID}</td>
          <td data-label="Entry date" class="mono">${fmtDate(a.Entry_Date)}</td>
          <td data-label="Entry time" class="mono">${a.Entry_Time}</td>
          <td data-label="Exit time" class="mono">${a.Exit_Time || '<span style="color:var(--lime)">on the floor</span>'}</td>
          <td data-label="Duration">${duration(a)}</td></tr>`).join('') ||
          `<tr><td colspan="5"><div class="empty-state">${ic('clock')}<b>No visits yet</b>Check this member in from the Attendance page.</div></td></tr>`}</tbody></table></div></div>`;
  }
  if (state.tab === 'trainer') {
    body = `<div class="card"><div class="tbl-top"><b>Training assignment history</b><span class="grow"></span>
        <button class="btn btn-sm btn-primary" data-act="add" data-ent="assignment" data-member="${m.Member_ID}">${ic('plus')} Assign a trainer</button></div>
      <div class="table-wrap"><table>
      <thead><tr><th>Assignment ID</th><th>Trainer</th><th>Specialization</th><th>Start</th><th>End</th><th>Status</th><th style="text-align:right">Actions</th></tr></thead>
      <tbody>${asg.length ? asg.map(a => { const t = trainer(a.Trainer_ID) || {}; return `<tr>
        <td data-label="Assignment ID" class="mono">${a.Assignment_ID}</td>
        <td data-label="Trainer"><div class="cell-main">${avatarFor(t.Name || '??')}<b>${esc(t.Name || '—')}</b></div></td>
        <td data-label="Specialization">${esc(t.Specialization || '—')}</td>
        <td data-label="Start" class="mono">${fmtDate(a.Start_Date)}</td>
        <td data-label="End" class="mono">${fmtDate(a.End_Date)}</td>
        <td data-label="Status">${badge(assignStatus(a))}</td>
        <td data-label="Actions" style="text-align:right">${rowActions('assignment', a.Assignment_ID)}</td></tr>`; }).join('')
        : `<tr><td colspan="7"><div class="empty-state">${ic('link')}<b>No trainer yet</b>Assign one to create a TRAINING_ASSIGNMENT row.</div></td></tr>`}</tbody></table></div></div>`;
  }

  return `<div class="page">
    <button class="btn btn-sm btn-ghost" style="margin-bottom:14px" data-act="go" data-page="members">‹ All members</button>
    <div class="card hero-profile" style="margin-bottom:20px">
      ${avatarFor(m.Name, 'lg lime')}
      <div style="min-width:0">
        <h1>${esc(m.Name)}</h1>
        <div class="meta-line"><span class="mono">${m.Member_ID}</span>${badge(m.Status)}
          <span>${ic('phone')}</span><span class="mono">${esc(m.Phone)}</span>
          <span>${ic('pin')}</span><span>${esc(m.Address.split(',').slice(-2).join(',').trim())}</span></div>
      </div>
      <div class="acts" style="margin-left:auto;display:flex;gap:9px;flex-wrap:wrap">
        <button class="btn" data-act="checkin-member" data-id="${m.Member_ID}">${ic('login')} Check in</button>
        <button class="btn" data-act="edit" data-ent="member" data-id="${m.Member_ID}">${ic('edit')} Edit</button>
        <button class="btn btn-primary" data-act="add" data-ent="payment" data-member="${m.Member_ID}">${ic('rupee')} Record payment</button>
      </div>
    </div>
    <div class="tabs">${tabs.map(t => `<button class="${state.tab === t[0] ? 'on' : ''}" data-act="tab" data-tab="${t[0]}">${t[1]}</button>`).join('')}</div>
    ${body}</div>`;
}
function duration(a) {
  if (!a.Exit_Time) return '<span class="badge b-lime">Inside</span>';
  const [h1, m1] = a.Entry_Time.split(':').map(Number), [h2, m2] = a.Exit_Time.split(':').map(Number);
  const mins = (h2 * 60 + m2) - (h1 * 60 + m1);
  return `<span class="mono">${Math.floor(mins / 60)}h ${pad(mins % 60)}m</span>`;
}
const assignStatus = a => a.Start_Date > iso(today) ? 'Upcoming' : (a.End_Date >= iso(today) ? 'Active' : 'Completed');

/* ================================================================
   PAGE — MEMBERSHIPS
   ================================================================ */
function pageMemberships() {
  const active = DB.memberships.filter(m => m.Status === 'Active');
  const expired = DB.memberships.filter(m => m.Status === 'Expired');
  const soon = expiringSoon();
  const value = active.reduce((s, m) => s + m.Price, 0);
  return `<div class="page">
    ${ph('Memberships', 'One MEMBER can hold many MEMBERSHIP rows — this is the full history, not just current plans.',
      `<button class="btn" data-act="export" data-ent="membership">${ic('download')} Export</button>
       <button class="btn btn-primary" data-act="add" data-ent="membership">${ic('plus')} New membership</button>`)}
    <div class="grid g4" style="margin-bottom:6px">
      ${statCard('check', 'Active', active.length, 'Currently valid plans')}
      ${statCard('bell', 'Expiring soon', soon.length, 'Ends within 15 days')}
      ${statCard('x', 'Expired', expired.length, 'Ready to win back')}
      ${statCard('wallet', 'Active plan value', inrK(value), 'Sum of Price on active rows')}
    </div>
    ${sec('01', 'All membership records', 'MEMBERSHIP')}
    ${table('memberships', {
      rows: DB.memberships, per: 10, defaultSort: 'Start_Date', defaultDir: 'desc',
      placeholder: 'Search membership ID, member, plan…',
      search: r => `${r.Membership_ID} ${r.Member_ID} ${memberName(r.Member_ID)} ${r.Membership_Type} ${r.Status}`,
      filters: ['Active', 'Expiring soon', 'Expired', 'Pending'],
      filterFn: (r, f) => f === 'Expiring soon'
        ? r.Status === 'Active' && daysBetween(iso(today), r.End_Date) <= 15
        : r.Status === f,
      cols: [
        { k: 'Membership_ID', h: 'Membership ID', render: r => `<span class="mono" style="color:var(--mute)">${r.Membership_ID}</span>` },
        { k: 'Member_ID', h: 'Member', val: r => memberName(r.Member_ID), render: r => `<div class="cell-main" data-act="member" data-id="${r.Member_ID}" style="cursor:pointer">
            ${avatarFor(memberName(r.Member_ID))}<div><b>${esc(memberName(r.Member_ID))}</b><span class="mono">${r.Member_ID}</span></div></div>` },
        { k: 'Membership_Type', h: 'Plan', render: r => `<b>${esc(r.Membership_Type)}</b>` },
        { k: 'Start_Date', h: 'Start', render: r => `<span class="mono">${fmtDate(r.Start_Date)}</span>` },
        { k: 'End_Date', h: 'End', render: r => `<span class="mono">${fmtDate(r.End_Date)}</span>${r.Status === 'Active' && daysBetween(iso(today), r.End_Date) <= 15
            ? `<div class="mini" style="color:var(--warn)">${daysBetween(iso(today), r.End_Date)}d left</div>` : ''}` },
        { k: 'Price', h: 'Price', val: r => r.Price, render: r => `<span class="mono">${inr(r.Price)}</span>` },
        { k: 'paid', h: 'Collected', sort: false, render: r => { const p = DB.payments.filter(x => x.Membership_ID === r.Membership_ID && x.Payment_Status === 'Paid').reduce((s, x) => s + x.Amount, 0);
            return `<span class="mono" style="color:${p >= r.Price ? 'var(--ok)' : 'var(--warn)'}">${inr(p)}</span>`; } },
        { k: 'Status', h: 'Status', render: r => badge(r.Status) },
        { k: 'a', h: 'Actions', sort: false, tdStyle: 'text-align:right', render: r => rowActions('membership', r.Membership_ID) }
      ]
    })}</div>`;
}

/* ================================================================
   PAGE — PAYMENTS
   ================================================================ */
function pagePayments() {
  const todayRev = revenueOn(iso(today));
  const monthRev = revenueInMonth(today.getFullYear(), today.getMonth());
  const pending = DB.payments.filter(p => p.Payment_Status === 'Pending');
  const ok = paidPayments().length;
  const labels = [], vals = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    labels.push(MON[d.getMonth()] + " '" + String(d.getFullYear()).slice(2));
    vals.push(Math.round(revenueInMonth(d.getFullYear(), d.getMonth()) / 1000));
  }
  const byMethod = PAY_METHODS.map((m, i) => ({ label: m, value: paidPayments().filter(p => p.Payment_Method === m).length,
    color: ['var(--lime)', 'var(--info)', 'var(--violet)', 'var(--ok)'][i] }));
  return `<div class="page">
    ${ph('Payments', 'Each PAYMENT points at both a MEMBER and the MEMBERSHIP it settles.',
      `<button class="btn" data-act="export" data-ent="payment">${ic('download')} Export</button>
       <button class="btn btn-primary" data-act="add" data-ent="payment">${ic('plus')} Record payment</button>`)}
    <div class="grid g4">
      ${statCard('rupee', "Today's revenue", inr(todayRev), `${paidPayments().filter(p => p.Payment_Date === iso(today)).length} settled today`)}
      ${statCard('trend', 'This month', inr(monthRev), `${MON[today.getMonth()]} ${today.getFullYear()}`)}
      ${statCard('bell', 'Pending', inr(pending.reduce((s, p) => s + p.Amount, 0)), `${pending.length} payments awaiting settlement`)}
      ${statCard('check', 'Successful', ok.toLocaleString('en-IN'), 'Paid transactions on record')}
    </div>
    ${sec('01', 'Revenue trend', 'Paid PAYMENT rows, in thousands (₹K)')}
    <div class="grid g-21">
      <div class="card card-p">${lineChart(vals, labels)}</div>
      <div class="card card-p"><b>Payment methods</b>
        <div style="margin:14px 0 18px">${donut(byMethod, { center: ok + '|PAID' })}</div>
        <div class="legend">${byMethod.map(d => `<div class="lr"><span class="sw" style="background:${d.color}"></span>${d.label}<span class="n">${d.value}</span></div>`).join('')}</div>
      </div>
    </div>
    ${sec('02', 'Transaction ledger', 'PAYMENT')}
    ${table('payments', {
      rows: DB.payments, per: 10, defaultSort: 'Payment_Date', defaultDir: 'desc',
      placeholder: 'Search transaction ID, member, amount…',
      search: r => `${r.Payment_ID} ${r.Transaction_ID} ${memberName(r.Member_ID)} ${r.Membership_ID} ${r.Amount} ${r.Payment_Method}`,
      filters: ['Paid', 'Pending', 'Failed', 'Refunded'], filterFn: (r, f) => r.Payment_Status === f,
      cols: [
        { k: 'Payment_ID', h: 'Payment ID', render: r => `<span class="mono" style="color:var(--mute)">${r.Payment_ID}</span>` },
        { k: 'Member_ID', h: 'Member', val: r => memberName(r.Member_ID), render: r => `<div class="cell-main" data-act="member" data-id="${r.Member_ID}" style="cursor:pointer">
            ${avatarFor(memberName(r.Member_ID))}<div><b>${esc(memberName(r.Member_ID))}</b><span class="mono">${r.Member_ID}</span></div></div>` },
        { k: 'Membership_ID', h: 'Membership', render: r => { const ms = membership(r.Membership_ID);
            return `<span class="mono" style="color:var(--mute)">${r.Membership_ID}</span><div class="mini">${ms ? esc(ms.Membership_Type) : 'deleted'}</div>`; } },
        { k: 'Amount', h: 'Amount', val: r => r.Amount, render: r => `<b class="mono">${inr(r.Amount)}</b>` },
        { k: 'Payment_Date', h: 'Date', render: r => `<span class="mono">${fmtDate(r.Payment_Date)}</span>` },
        { k: 'Payment_Method', h: 'Method' },
        { k: 'Transaction_ID', h: 'Transaction ID', render: r => `<span class="mono" style="color:var(--mute)">${esc(r.Transaction_ID)}</span>` },
        { k: 'Payment_Status', h: 'Status', render: r => badge(r.Payment_Status) },
        { k: 'a', h: 'Actions', sort: false, tdStyle: 'text-align:right', render: r => rowActions('payment', r.Payment_ID) }
      ]
    })}</div>`;
}

/* ================================================================
   PAGE — ATTENDANCE
   ================================================================ */
function pageAttendance() {
  const t = todayAtt(), inside = onFloor(), out = t.length - inside.length;
  const activeCount = DB.members.filter(m => m.Status === 'Active').length;
  const pct = Math.round(t.length / Math.max(activeCount, 1) * 100);
  const labels = [], counts = [];
  for (let d = 13; d >= 0; d--) { const day = iso(addDays(today, -d)); labels.push(fmtShort(day)); counts.push(DB.attendance.filter(a => a.Entry_Date === day).length); }
  const hours = Array.from({ length: 18 }, (_, i) => i + 5);
  const byHour = hours.map(h => t.filter(a => +a.Entry_Time.split(':')[0] === h).length);

  return `<div class="page">
    ${ph("Attendance", `Check-ins for ${fmtDate(iso(today))}`,
      `<button class="btn" data-act="export" data-ent="attendance">${ic('download')} Export</button>
       <button class="btn btn-primary" data-act="checkin">${ic('login')} Check in</button>`)}
    <div class="grid g4">
      ${statCard('login', 'Checked in today', t.length, `${pct}% of ${activeCount} active members`)}
      ${statCard('users', 'On the floor now', inside.length, 'Entry recorded, no exit yet')}
      ${statCard('out', 'Checked out', out, 'Completed sessions today')}
      ${statCard('trend', 'Attendance rate', pct + '%', `Rolling 14-day avg ${Math.round(counts.reduce((a, b) => a + b, 0) / 14 / Math.max(activeCount, 1) * 100)}%`)}
    </div>
    ${sec('01', 'Traffic', 'ATTENDANCE grouped by Entry_Date and Entry_Time')}
    <div class="grid g2">
      <div class="card card-p"><b>Last 14 days</b><div class="mini" style="margin:4px 0 12px">Daily check-in volume</div>${barChart(counts, labels)}</div>
      <div class="card card-p"><b>Today by hour</b><div class="mini" style="margin:4px 0 12px">When the floor gets busy</div>
        ${lineChart(byHour, hours.map(h => pad(h) + ':00'), { color: 'var(--info)' })}</div>
    </div>
    ${inside.length ? `${sec('02', 'On the floor right now', inside.length + ' members')}
      <div class="grid g3">${inside.slice(0, 9).map(a => `<div class="card card-p" style="display:flex;gap:12px;align-items:center">
        ${avatarFor(memberName(a.Member_ID), 'lime')}
        <div style="min-width:0"><b>${esc(memberName(a.Member_ID))}</b><div class="mini" style="margin-top:3px">In since ${a.Entry_Time}</div></div>
        <button class="btn btn-sm" style="margin-left:auto" data-act="checkout" data-id="${a.Attendance_ID}">Check out</button></div>`).join('')}</div>` : ''}
    ${sec('03', 'Attendance log', 'ATTENDANCE')}
    ${table('attendance', {
      rows: DB.attendance.slice().sort((a, b) => (b.Entry_Date + b.Entry_Time).localeCompare(a.Entry_Date + a.Entry_Time)),
      per: 10, defaultSort: 'Entry_Date', defaultDir: 'desc',
      placeholder: 'Search member or date (2026-08-20)…',
      search: r => `${r.Attendance_ID} ${r.Member_ID} ${memberName(r.Member_ID)} ${r.Entry_Date}`,
      filters: ['Today', 'Inside', 'This week'],
      filterFn: (r, f) => f === 'Today' ? r.Entry_Date === iso(today) : f === 'Inside' ? !r.Exit_Time : daysBetween(r.Entry_Date, iso(today)) <= 7,
      cols: [
        { k: 'Attendance_ID', h: 'Attendance ID', render: r => `<span class="mono" style="color:var(--mute)">${r.Attendance_ID}</span>` },
        { k: 'Member_ID', h: 'Member', val: r => memberName(r.Member_ID), render: r => `<div class="cell-main" data-act="member" data-id="${r.Member_ID}" style="cursor:pointer">
            ${avatarFor(memberName(r.Member_ID))}<div><b>${esc(memberName(r.Member_ID))}</b><span class="mono">${r.Member_ID}</span></div></div>` },
        { k: 'Entry_Date', h: 'Entry date', render: r => `<span class="mono">${fmtDate(r.Entry_Date)}</span>` },
        { k: 'Entry_Time', h: 'Entry time', render: r => `<span class="mono">${r.Entry_Time}</span>` },
        { k: 'Exit_Time', h: 'Exit time', render: r => r.Exit_Time ? `<span class="mono">${r.Exit_Time}</span>` : `<span class="mono" style="color:var(--lime)">—</span>` },
        { k: 'd', h: 'Duration', sort: false, render: r => duration(r) },
        { k: 'a', h: 'Actions', sort: false, tdStyle: 'text-align:right', render: r => `<div class="acts-cell">
            ${!r.Exit_Time ? `<button class="btn btn-sm" data-act="checkout" data-id="${r.Attendance_ID}">Check out</button>` : ''}
            <button class="ia del" title="Delete" data-act="del" data-ent="attendance" data-id="${r.Attendance_ID}">${ic('trash')}</button></div>` }
      ]
    })}</div>`;
}

/* ================================================================
   PAGE — TRAINERS
   ================================================================ */
function pageTrainers() {
  return `<div class="page">
    ${ph('Trainers', `${DB.trainers.length} rows in the TRAINER table · ${DB.assignments.filter(a => a.End_Date >= iso(today)).length} live assignments`,
      `<button class="btn" data-act="export" data-ent="trainer">${ic('download')} Export</button>
       <button class="btn btn-primary" data-act="add" data-ent="trainer">${ic('plus')} Add trainer</button>`)}
    <div class="grid g3">${DB.trainers.map(t => {
      const years = (daysBetween(t.Joining_Date, iso(today)) / 365);
      const load = trainerLoad(t.Trainer_ID);
      return `<div class="card tcard">
      <div class="tc-hero" data-act="trainer" data-id="${t.Trainer_ID}">
        <div class="tc-glow"></div>
        ${avatarFor(t.Name, 'lg lime')}
        <span class="badge b-lime tc-spec">${esc(t.Specialization)}</span>
      </div>
      <div class="th" style="margin-top:14px">
        <div style="min-width:0"><b style="font-size:15.5px">${esc(t.Name)}</b>
          <div class="mini mono" style="margin-top:3px">${t.Trainer_ID}</div></div>
        <span style="margin-left:auto">${badge(t.Status)}</span></div>
      <div class="tc-kpi">
        <div><b class="mono">${load}</b><span class="mini">members</span></div>
        <div><b class="mono">${years < 1 ? Math.round(years * 12) + 'mo' : years.toFixed(1) + 'y'}</b><span class="mini">experience</span></div>
        <div><b class="mono">${inrK(t.Salary)}</b><span class="mini">salary</span></div>
      </div>
      <div class="spec">
        <div>${ic('phone')}<span class="mono">${esc(t.Phone)}</span></div>
        <div>${ic('mail')}${esc(t.Email)}</div>
      </div>
      <div class="tc-acts">
        <button class="btn btn-sm" data-act="trainer" data-id="${t.Trainer_ID}">${ic('eye')} Profile</button>
        <button class="btn btn-sm" data-act="clients" data-id="${t.Trainer_ID}">${ic('users')} Clients</button>
        <span style="margin-left:auto">${rowActions('trainer', t.Trainer_ID)}</span>
      </div>
    </div>`; }).join('')}</div>
    ${sec('01', 'Trainer directory', 'TRAINER')}
    ${table('trainers', {
      rows: DB.trainers, per: 8, defaultSort: 'Name', defaultDir: 'asc',
      placeholder: 'Search name, specialization…',
      search: r => `${r.Trainer_ID} ${r.Name} ${r.Specialization} ${r.Email} ${r.Phone}`,
      filters: SPECIALIZATIONS, filterFn: (r, f) => r.Specialization === f,
      cols: [
        { k: 'Trainer_ID', h: 'Trainer ID', render: r => `<span class="mono" style="color:var(--mute)">${r.Trainer_ID}</span>` },
        { k: 'Name', h: 'Name', render: r => `<div class="cell-main" data-act="trainer" data-id="${r.Trainer_ID}" style="cursor:pointer">${avatarFor(r.Name)}<b>${esc(r.Name)}</b></div>` },
        { k: 'Specialization', h: 'Specialization' },
        { k: 'Phone', h: 'Phone', render: r => `<span class="mono">${esc(r.Phone)}</span>` },
        { k: 'Salary', h: 'Salary', val: r => r.Salary, render: r => `<span class="mono">${inr(r.Salary)}</span>` },
        { k: 'Joining_Date', h: 'Joined', render: r => `<span class="mono">${fmtDate(r.Joining_Date)}</span>` },
        { k: 'load', h: 'Members', sort: false, render: r => `<b class="mono">${trainerLoad(r.Trainer_ID)}</b>` },
        { k: 'Status', h: 'Status', render: r => badge(r.Status) },
        { k: 'a', h: 'Actions', sort: false, tdStyle: 'text-align:right', render: r => rowActions('trainer', r.Trainer_ID, true) }
      ]
    })}</div>`;
}

function pageTrainerProfile() {
  const t = trainer(state.trainerId);
  if (!t) return `<div class="page">${ph('Trainer not found', 'That record no longer exists.')}</div>`;
  const asg = DB.assignments.filter(a => a.Trainer_ID === t.Trainer_ID).sort((a, b) => b.Start_Date.localeCompare(a.Start_Date));
  const live = asg.filter(a => a.End_Date >= iso(today));
  return `<div class="page">
    <button class="btn btn-sm btn-ghost" style="margin-bottom:14px" data-act="go" data-page="trainers">‹ All trainers</button>
    <div class="card hero-profile" style="margin-bottom:20px">
      ${avatarFor(t.Name, 'lg lime')}
      <div><h1>${esc(t.Name)}</h1>
        <div class="meta-line"><span class="mono">${t.Trainer_ID}</span>${badge(t.Status)}
          <span style="color:var(--lime)">${esc(t.Specialization)}</span>
          <span>${ic('phone')}</span><span class="mono">${esc(t.Phone)}</span></div></div>
      <div style="margin-left:auto;display:flex;gap:9px;flex-wrap:wrap">
        <button class="btn" data-act="edit" data-ent="trainer" data-id="${t.Trainer_ID}">${ic('edit')} Edit</button>
        <button class="btn btn-primary" data-act="add" data-ent="assignment" data-trainer="${t.Trainer_ID}">${ic('plus')} Assign a member</button></div>
    </div>
    <div class="grid g4" style="margin-bottom:6px">
      ${statCard('users', 'Members now', live.length, 'Active or upcoming assignments')}
      ${statCard('badge', 'All-time', asg.length, 'Assignments handled')}
      ${statCard('wallet', 'Monthly salary', inr(t.Salary), 'From the TRAINER row')}
      ${statCard('cal', 'Tenure', (Math.floor(daysBetween(t.Joining_Date, iso(today)) / 30)) + ' mo', `Since ${fmtDate(t.Joining_Date)}`)}
    </div>
    ${sec('01', 'Assigned members', 'TRAINING_ASSIGNMENT → MEMBER')}
    <div class="card"><div class="table-wrap"><table>
      <thead><tr><th>Assignment ID</th><th>Member</th><th>Start</th><th>End</th><th>Status</th><th style="text-align:right">Actions</th></tr></thead>
      <tbody>${asg.length ? asg.map(a => `<tr>
        <td data-label="Assignment ID" class="mono">${a.Assignment_ID}</td>
        <td data-label="Member"><div class="cell-main" data-act="member" data-id="${a.Member_ID}" style="cursor:pointer">
          ${avatarFor(memberName(a.Member_ID))}<div><b>${esc(memberName(a.Member_ID))}</b><span class="mono">${a.Member_ID}</span></div></div></td>
        <td data-label="Start" class="mono">${fmtDate(a.Start_Date)}</td>
        <td data-label="End" class="mono">${fmtDate(a.End_Date)}</td>
        <td data-label="Status">${badge(assignStatus(a))}</td>
        <td data-label="Actions" style="text-align:right">${rowActions('assignment', a.Assignment_ID)}</td></tr>`).join('')
        : `<tr><td colspan="6"><div class="empty-state">${ic('link')}<b>No members assigned</b>Assign one to create a TRAINING_ASSIGNMENT row.</div></td></tr>`}</tbody></table></div></div>
  </div>`;
}

/* ================================================================
   PAGE — TRAINING ASSIGNMENTS
   ================================================================ */
function pageAssignments() {
  const live = DB.assignments.filter(a => a.End_Date >= iso(today));
  const maxLoad = Math.max(1, ...DB.trainers.map(t => trainerLoad(t.Trainer_ID)));
  const multi = DB.members.filter(m => DB.assignments.filter(a => a.Member_ID === m.Member_ID).length > 1).length;
  return `<div class="page">
    ${ph('Training assignments', 'The bridge table. MEMBER ↔ TRAINER is many-to-many, resolved here.',
      `<button class="btn" data-act="export" data-ent="assignment">${ic('download')} Export</button>
       <button class="btn btn-primary" data-act="add" data-ent="assignment">${ic('plus')} Assign trainer</button>`)}
    <div class="grid g4">
      ${statCard('link', 'Live assignments', live.length, 'End_Date on or after today')}
      ${statCard('users', 'Members training', new Set(live.map(a => a.Member_ID)).size, 'Distinct Member_ID values')}
      ${statCard('dumbbell', 'Trainers engaged', new Set(live.map(a => a.Trainer_ID)).size, `of ${DB.trainers.length} on staff`)}
      ${statCard('badge', 'Members with 2+', multi, 'Proof the relationship is M:N')}
    </div>
    ${sec('01', 'Trainer workload', 'Live assignments per trainer')}
    <div class="card card-p">
      ${DB.trainers.map(t => { const n = trainerLoad(t.Trainer_ID); return `<div style="display:flex;align-items:center;gap:14px;padding:11px 0;border-bottom:1px solid var(--line)">
        ${avatarFor(t.Name)}
        <div style="width:150px;min-width:0"><b>${esc(t.Name)}</b><div class="mini" style="margin-top:2px">${esc(t.Specialization)}</div></div>
        <div class="bar" style="flex:1"><i style="width:${(n / maxLoad * 100).toFixed(0)}%"></i></div>
        <b class="mono" style="width:34px;text-align:right">${n}</b>
        <button class="btn btn-sm btn-ghost" data-act="trainer" data-id="${t.Trainer_ID}">Open</button></div>`; }).join('')}
      <div class="mini" style="padding-top:12px">Bars are relative to the busiest trainer (${maxLoad} members).</div>
    </div>
    ${sec('02', 'All assignments', 'TRAINING_ASSIGNMENT')}
    ${table('assignments', {
      rows: DB.assignments, per: 10, defaultSort: 'Start_Date', defaultDir: 'desc',
      placeholder: 'Search member, trainer, assignment ID…',
      search: r => `${r.Assignment_ID} ${memberName(r.Member_ID)} ${trainerName(r.Trainer_ID)} ${r.Member_ID} ${r.Trainer_ID}`,
      filters: ['Active', 'Upcoming', 'Completed'], filterFn: (r, f) => assignStatus(r) === f,
      cols: [
        { k: 'Assignment_ID', h: 'Assignment ID', render: r => `<span class="mono" style="color:var(--mute)">${r.Assignment_ID}</span>` },
        { k: 'Member_ID', h: 'Member', val: r => memberName(r.Member_ID), render: r => `<div class="cell-main" data-act="member" data-id="${r.Member_ID}" style="cursor:pointer">
            ${avatarFor(memberName(r.Member_ID))}<div><b>${esc(memberName(r.Member_ID))}</b><span class="mono">${r.Member_ID}</span></div></div>` },
        { k: 'Trainer_ID', h: 'Trainer', val: r => trainerName(r.Trainer_ID), render: r => `<div class="cell-main" data-act="trainer" data-id="${r.Trainer_ID}" style="cursor:pointer">
            ${avatarFor(trainerName(r.Trainer_ID), 'lime')}<div><b>${esc(trainerName(r.Trainer_ID))}</b><span class="mono">${r.Trainer_ID}</span></div></div>` },
        { k: 'Start_Date', h: 'Start', render: r => `<span class="mono">${fmtDate(r.Start_Date)}</span>` },
        { k: 'End_Date', h: 'End', render: r => `<span class="mono">${fmtDate(r.End_Date)}</span>` },
        { k: 's', h: 'Status', sort: false, render: r => badge(assignStatus(r)) },
        { k: 'a', h: 'Actions', sort: false, tdStyle: 'text-align:right', render: r => rowActions('assignment', r.Assignment_ID) }
      ]
    })}</div>`;
}

/* ================================================================
   PAGE — SLOTS & BOOKINGS
   ================================================================ */
function pageSlots() {
  const date = state.slotDate || iso(today);
  const rows = DB.slots.slice().sort((a, b) => a.Start_Time.localeCompare(b.Start_Time));
  const booked = rows.map(s2 => bookingsFor(s2.Slot_ID, date).length);
  const present = rows.map(s2 => presentIn(s2.Slot_ID, date));
  const labels = rows.map(s2 => s2.Start_Time);
  const totalSeats = rows.reduce((sum, s2) => sum + s2.Capacity, 0);
  const totalBooked = booked.reduce((a, b) => a + b, 0);
  const totalPresent = present.reduce((a, b) => a + b, 0);
  const peak = rows[present.indexOf(Math.max(...present))];
  const isPast = date < iso(today);
  const dayBookings = DB.bookings.filter(b => b.Booking_Date === date);
  const showRate = dayBookings.filter(b => b.Status === 'Attended').length;

  return `<div class="page">
    ${ph('Slots & bookings', 'Members reserve an hour; the desk sees how full each one is and who actually turned up.',
      `<button class="btn" data-act="add" data-ent="slot">${ic('plus')} Add slot</button>
       <button class="btn btn-primary" data-act="add" data-ent="booking">${ic('cal')} Book a slot</button>`)}

    <div class="row-between" style="gap:12px;flex-wrap:wrap;margin-bottom:16px">
      <div class="chips">
        <button class="chip ${date === iso(addDays(today, -1)) ? 'on' : ''}" data-act="slotdate" data-v="${iso(addDays(today, -1))}">Yesterday</button>
        <button class="chip ${date === iso(today) ? 'on' : ''}" data-act="slotdate" data-v="${iso(today)}">Today</button>
        <button class="chip ${date === iso(addDays(today, 1)) ? 'on' : ''}" data-act="slotdate" data-v="${iso(addDays(today, 1))}">Tomorrow</button>
      </div>
      <div style="display:flex;align-items:center;gap:10px">
        <span class="mini">Showing</span>
        <input class="inp" type="date" style="width:auto" value="${date}" data-act="slotdate-input">
      </div>
    </div>

    <div class="grid g4">
      ${statCard('cal', 'Seats booked', totalBooked, `of ${totalSeats} across ${rows.length} slots`)}
      ${statCard('users', 'Actually present', totalPresent, isPast || date === iso(today) ? 'From ATTENDANCE entry times' : 'Not yet — future date')}
      ${statCard('trend', 'Utilisation', Math.round(totalBooked / Math.max(totalSeats, 1) * 100) + '%', 'Booked seats over capacity')}
      ${statCard('badge', 'Busiest hour', peak && Math.max(...present) ? peak.Start_Time : '—', peak && Math.max(...present) ? Math.max(...present) + ' members inside' : 'No entries recorded')}
    </div>

    ${sec('01', 'Presence by hour', 'ATTENDANCE entry times bucketed into each slot window')}
    <div class="grid g-21">
      <div class="card card-p">
        <div class="row-between" style="margin-bottom:8px">
          <div><b>Who was in the gym, hour by hour</b><div class="mini" style="margin-top:4px">${fmtDate(date)}</div></div>
          <span class="badge b-lime">${totalPresent} entries</span>
        </div>
        ${barChart(present, labels, { h: 210 })}
      </div>
      <div class="card card-p">
        <div><b>Booked vs turned up</b><div class="mini" style="margin-top:4px">Reservations against the same hours</div></div>
        ${barChart(booked, labels, { h: 210, color: 'var(--info)' })}
        <div class="week-foot">
          <div><span class="mini">Attended</span><b class="mono">${showRate}</b></div>
          <div><span class="mini">No-shows</span><b class="mono">${dayBookings.filter(b => b.Status === 'No-show').length}</b></div>
          <div><span class="mini">Cancelled</span><b class="mono">${dayBookings.filter(b => b.Status === 'Cancelled').length}</b></div>
        </div>
      </div>
    </div>

    ${sec('02', 'Slot board', 'SLOT · capacity maintained by the desk')}
    <div class="slot-grid">${rows.map(s2 => {
      const b = bookingsFor(s2.Slot_ID, date).length, left = s2.Capacity - b;
      const p = presentIn(s2.Slot_ID, date);
      const pct = Math.round(b / s2.Capacity * 100);
      const full = left <= 0 || s2.Status !== 'Open';
      return `<div class="slot-card ${full ? 'full' : ''}">
        <div class="row-between">
          <b class="mono slot-time">${s2.Start_Time}–${s2.End_Time}</b>
          ${s2.Status !== 'Open' ? badge(s2.Status) : full ? '<span class="badge b-bad">Full</span>'
            : `<span class="badge ${pct > 75 ? 'b-warn' : 'b-ok'}">${left} left</span>`}
        </div>
        <div class="slot-nums"><b class="mono">${b}</b><span class="mono">/ ${s2.Capacity} booked</span></div>
        <div class="bar"><i style="width:${Math.min(pct, 100)}%"></i></div>
        <div class="slot-foot">
          <span class="mini">${p} present</span>
          <span class="mini mono">${s2.Slot_ID}</span>
        </div>
        <div class="slot-acts">
          <button class="btn btn-sm ${full ? '' : 'btn-primary'}" ${full ? 'disabled style="opacity:.4;cursor:not-allowed"' : ''}
            data-act="book-slot" data-id="${s2.Slot_ID}">${full ? 'No seats' : 'Book'}</button>
          <button class="ia" title="Edit slot" data-act="edit" data-ent="slot" data-id="${s2.Slot_ID}">${ic('edit')}</button>
          <button class="ia del" title="Delete slot" data-act="del" data-ent="slot" data-id="${s2.Slot_ID}">${ic('trash')}</button>
        </div>
      </div>`;
    }).join('')}</div>

    ${sec('03', 'Bookings', 'BOOKING → MEMBER, SLOT')}
    ${table('bookings', {
      rows: DB.bookings, per: 10, defaultSort: 'Booking_Date', defaultDir: 'desc',
      placeholder: 'Search member, slot, booking ID…',
      search: r => `${r.Booking_ID} ${memberName(r.Member_ID)} ${r.Slot_ID} ${slotLabel(r.Slot_ID)} ${r.Booking_Date} ${r.Status}`,
      filters: ['Booked', 'Attended', 'No-show', 'Cancelled'], filterFn: (r, f) => r.Status === f,
      cols: [
        { k: 'Booking_ID', h: 'Booking ID', render: r => `<span class="mono" style="color:var(--mute)">${r.Booking_ID}</span>` },
        { k: 'Member_ID', h: 'Member', val: r => memberName(r.Member_ID), render: r => `<div class="cell-main" data-act="member" data-id="${r.Member_ID}" style="cursor:pointer">
            ${avatarFor(memberName(r.Member_ID))}<div><b>${esc(memberName(r.Member_ID))}</b><span class="mono">${r.Member_ID}</span></div></div>` },
        { k: 'Slot_ID', h: 'Slot', render: r => `<b class="mono">${slotLabel(r.Slot_ID)}</b><div class="mini mono">${r.Slot_ID}</div>` },
        { k: 'Booking_Date', h: 'Date', render: r => `<span class="mono">${fmtDate(r.Booking_Date)}</span>` },
        { k: 'Status', h: 'Status', render: r => badge(r.Status) },
        { k: 'a', h: 'Actions', sort: false, tdStyle: 'text-align:right', render: r => rowActions('booking', r.Booking_ID) }
      ]
    })}
  </div>`;
}

/* ================================================================
   PAGE — EQUIPMENT
   ================================================================ */
const EQUIP_CATS = ['Cardio', 'Strength', 'Free Weights', 'Functional', 'Recovery'];
function pageEquipment() {
  const units = DB.equipment.reduce((sum, e) => sum + e.Quantity, 0);
  const annual = maintenanceTotal();
  const due = serviceDue();
  const byCat = EQUIP_CATS.map((c, i) => ({
    label: c, value: DB.equipment.filter(e => e.Category === c).reduce((sum, e) => sum + e.Maintenance_Cost * e.Quantity, 0),
    color: ['var(--lime)', 'var(--info)', 'var(--violet)', 'var(--ok)', 'var(--warn)'][i]
  }));
  const catTotal = byCat.reduce((sum, c) => sum + c.value, 0) || 1;

  return `<div class="page">
    ${ph('Equipment', 'Asset log for the floor, with what each line costs to keep running.',
      `<button class="btn" data-act="export" data-ent="equipment">${ic('download')} Export</button>
       <button class="btn btn-primary" data-act="add" data-ent="equipment">${ic('plus')} Add equipment</button>`)}

    <div class="grid g4">
      ${statCard('dumbbell', 'Equipment lines', DB.equipment.length, `${units} units on the floor`)}
      ${statCard('rupee', 'Maintenance / year', inrK(annual), 'Cost × quantity, all lines')}
      ${statCard('cog', 'Needs attention', due.length, 'Overdue service or faulty')}
      ${statCard('wallet', 'Average per unit', inr(Math.round(annual / Math.max(units, 1))), 'Annual upkeep per unit')}
    </div>

    ${sec('01', 'Maintenance spend', 'Cost by category')}
    <div class="grid g-21">
      <div class="card card-p">
        <b>Annual maintenance by category</b><div class="mini" style="margin:4px 0 10px">Maintenance_Cost × Quantity</div>
        ${barChart(byCat.map(c => Math.round(c.value / 1000)), byCat.map(c => c.label), { h: 200 })}
        <div class="mini" style="margin-top:8px">Figures in ₹ thousands</div>
      </div>
      <div class="card card-p">
        <b>Share of upkeep</b><div class="mini" style="margin:4px 0 10px">Where the money goes</div>
        ${donut(byCat, { center: inrK(catTotal) + '|PER YEAR' })}
        <div class="legend" style="margin-top:16px">${byCat.map(c => `<div class="lr">
          <span class="sw" style="background:${c.color}"></span>${c.label}
          <span class="n">${inrK(c.value)} · ${Math.round(c.value / catTotal * 100)}%</span></div>`).join('')}</div>
      </div>
    </div>

    ${due.length ? `${sec('02', 'Service due', due.length + ' lines')}
      <div class="grid g3">${due.slice(0, 6).map(e => `<div class="card card-p srv">
        <div class="row-between"><b>${esc(e.Name)}</b>${badge(e.Status)}</div>
        <div class="mini" style="margin-top:8px">Last serviced ${fmtDate(e.Last_Service_Date)} ·
          ${daysBetween(e.Last_Service_Date, iso(today))} days ago</div>
        <div class="row-between" style="margin-top:12px">
          <span class="mini mono">${e.Equipment_ID} · ${e.Quantity} units</span>
          <button class="btn btn-sm" data-act="service" data-id="${e.Equipment_ID}">${ic('check')} Mark serviced</button>
        </div></div>`).join('')}</div>` : ''}

    ${sec(due.length ? '03' : '02', 'Equipment log', 'EQUIPMENT')}
    ${table('equipment', {
      rows: DB.equipment, per: 10, defaultSort: 'Name', defaultDir: 'asc',
      placeholder: 'Search equipment, category…',
      search: r => `${r.Equipment_ID} ${r.Name} ${r.Category} ${r.Status}`,
      filters: EQUIP_CATS, filterFn: (r, f) => r.Category === f,
      cols: [
        { k: 'Equipment_ID', h: 'ID', render: r => `<span class="mono" style="color:var(--mute)">${r.Equipment_ID}</span>` },
        { k: 'Name', h: 'Equipment', render: r => `<b>${esc(r.Name)}</b>` },
        { k: 'Category', h: 'Category', render: r => `<span class="badge b-mute">${esc(r.Category)}</span>` },
        { k: 'Quantity', h: 'Units', val: r => r.Quantity, render: r => `<span class="mono">${r.Quantity}</span>` },
        { k: 'Purchase_Date', h: 'Purchased', render: r => `<span class="mono">${fmtDate(r.Purchase_Date)}</span>` },
        { k: 'Last_Service_Date', h: 'Last service', render: r => `<span class="mono">${fmtDate(r.Last_Service_Date)}</span>
            <div class="mini">${daysBetween(r.Last_Service_Date, iso(today))}d ago</div>` },
        { k: 'Maintenance_Cost', h: 'Maintenance', val: r => r.Maintenance_Cost, render: r => `<b class="mono">${inr(r.Maintenance_Cost)}</b>
            <div class="mini">${inr(r.Maintenance_Cost * r.Quantity)} total / yr</div>` },
        { k: 'Status', h: 'Status', render: r => badge(r.Status) },
        { k: 'a', h: 'Actions', sort: false, tdStyle: 'text-align:right', render: r => rowActions('equipment', r.Equipment_ID) }
      ]
    })}
  </div>`;
}

/* ================================================================
   PAGE — REPORTS
   ================================================================ */
function pageReports() {
  const M = DB.members;
  const newThisMonth = M.filter(m => parse(m.Join_Date) >= new Date(today.getFullYear(), today.getMonth(), 1)).length;
  const growth = [], gl = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    gl.push(MON[d.getMonth()]);
    growth.push(M.filter(m => { const j = parse(m.Join_Date); return j.getFullYear() === d.getFullYear() && j.getMonth() === d.getMonth(); }).length);
  }
  const active = DB.memberships.filter(m => m.Status === 'Active');
  const typeMix = PLAN_NAMES.map((p, i) => ({ label: p, value: active.filter(m => m.Membership_Type === p).length, color: ['var(--lime)', 'var(--info)', 'var(--violet)', 'var(--ok)'][i] }));
  const methodMix = PAY_METHODS.map((m, i) => ({ label: m, value: paidPayments().filter(p => p.Payment_Method === m).reduce((s, p) => s + p.Amount, 0), color: ['var(--lime)', 'var(--info)', 'var(--violet)', 'var(--ok)'][i] }));
  const wl = [], wv = [];
  for (let w = 5; w >= 0; w--) {
    const end = addDays(today, -w * 7), start = addDays(end, -6);
    wl.push(fmtShort(iso(start)));
    wv.push(DB.attendance.filter(a => a.Entry_Date >= iso(start) && a.Entry_Date <= iso(end)).length);
  }
  const topMembers = Object.entries(DB.attendance.reduce((acc, a) => { acc[a.Member_ID] = (acc[a.Member_ID] || 0) + 1; return acc; }, {}))
    .sort((a, b) => b[1] - a[1]).slice(0, 6);
  const maxVisits = topMembers[0] ? topMembers[0][1] : 1;

  const kpi = (label, val, sub) => `<div style="padding:14px 0;border-bottom:1px solid var(--line);display:flex;align-items:center;gap:14px">
    <div style="flex:1"><b>${label}</b><div class="mini" style="margin-top:3px">${sub}</div></div>
    <b class="mono" style="font-size:19px">${val}</b></div>`;

  return `<div class="page">
    ${ph('Reports', 'Everything here is aggregated live from the six tables — no separate reporting table exists.',
      `<button class="btn btn-primary" data-act="export-report">${ic('file')} Export report</button>`)}
    ${sec('01', 'Members', 'MEMBER')}
    <div class="grid g-12">
      <div class="card card-p">
        ${kpi('Total members', M.length, 'All rows in MEMBER')}
        ${kpi('Active', M.filter(m => m.Status === 'Active').length, 'Status = Active')}
        ${kpi('Inactive', M.filter(m => m.Status === 'Inactive').length, 'Status = Inactive')}
        ${kpi('Suspended', M.filter(m => m.Status === 'Suspended').length, 'Status = Suspended')}
        ${kpi('New this month', newThisMonth, 'Join_Date in ' + MON[today.getMonth()])}
      </div>
      <div class="card card-p"><b>Joins per month</b><div class="mini" style="margin:4px 0 12px">Last 6 months by Join_Date</div>${barChart(growth, gl)}</div>
    </div>
    ${sec('02', 'Memberships', 'MEMBERSHIP')}
    <div class="grid g-21">
      <div class="card card-p"><b>Plan distribution</b><div class="mini" style="margin:4px 0 12px">Active memberships by type</div>
        ${barChart(typeMix.map(t => t.value), typeMix.map(t => t.label))}</div>
      <div class="card card-p">
        ${kpi('Active', active.length, 'Valid today')}
        ${kpi('Expired', DB.memberships.filter(m => m.Status === 'Expired').length, 'End_Date has passed')}
        ${kpi('Pending', DB.memberships.filter(m => m.Status === 'Pending').length, 'Starts in the future')}
        ${kpi('Expiring in 15d', expiringSoon().length, 'Renewal outreach list')}
      </div>
    </div>
    ${sec('03', 'Payments', 'PAYMENT')}
    <div class="grid g-21">
      <div class="card card-p">
        ${kpi("Today's revenue", inr(revenueOn(iso(today))), 'Paid rows dated today')}
        ${kpi('This month', inr(revenueInMonth(today.getFullYear(), today.getMonth())), MON[today.getMonth()] + ' ' + today.getFullYear())}
        ${kpi('Lifetime collected', inr(paidPayments().reduce((s, p) => s + p.Amount, 0)), 'All paid transactions')}
        ${kpi('Pending value', inr(DB.payments.filter(p => p.Payment_Status === 'Pending').reduce((s, p) => s + p.Amount, 0)), 'Awaiting settlement')}
        ${kpi('Failed / refunded', DB.payments.filter(p => ['Failed', 'Refunded'].includes(p.Payment_Status)).length, 'Needs a follow-up')}
      </div>
      <div class="card card-p"><b>Revenue by method</b><div class="mini" style="margin:4px 0 14px">Share of collected value</div>
        ${donut(methodMix, { center: inrK(methodMix.reduce((s, m) => s + m.value, 0)) + '|TOTAL' })}
        <div class="legend" style="margin-top:16px">${methodMix.map(d => `<div class="lr"><span class="sw" style="background:${d.color}"></span>${d.label}<span class="n">${inrK(d.value)}</span></div>`).join('')}</div></div>
    </div>
    ${sec('04', 'Attendance', 'ATTENDANCE')}
    <div class="grid g-21">
      <div class="card card-p"><b>Weekly footfall</b><div class="mini" style="margin:4px 0 12px">Check-ins per week, last 6 weeks</div>${lineChart(wv, wl)}</div>
      <div class="card card-p"><b>Most active members</b><div class="mini" style="margin:4px 0 14px">By total check-ins</div>
        ${topMembers.map(([id, n]) => `<div style="display:flex;align-items:center;gap:12px;padding:9px 0" data-act="member" data-id="${id}" role="button">
          ${avatarFor(memberName(id))}<div style="width:110px;min-width:0"><b style="font-size:13px">${esc(memberName(id))}</b></div>
          <div class="bar" style="flex:1"><i style="width:${(n / maxVisits * 100).toFixed(0)}%"></i></div>
          <b class="mono" style="width:28px;text-align:right">${n}</b></div>`).join('')}</div>
    </div>
    ${sec('05', 'Slots and equipment', 'SLOT + BOOKING + EQUIPMENT')}
    <div class="grid g2">
      <div class="card card-p">
        ${kpi('Slots configured', DB.slots.length, 'Booking windows on the board')}
        ${kpi('Bookings today', DB.bookings.filter(b => b.Booking_Date === iso(today) && b.Status !== 'Cancelled').length, 'Seats reserved for today')}
        ${kpi('Utilisation today', Math.round(DB.bookings.filter(b => b.Booking_Date === iso(today) && b.Status !== 'Cancelled').length
          / Math.max(DB.slots.reduce((sum, s2) => sum + s2.Capacity, 0), 1) * 100) + '%', 'Booked seats over capacity')}
        ${kpi('No-show rate', Math.round(DB.bookings.filter(b => b.Status === 'No-show').length
          / Math.max(DB.bookings.filter(b => ['Attended', 'No-show'].includes(b.Status)).length, 1) * 100) + '%', 'Across all past bookings')}
      </div>
      <div class="card card-p">
        ${kpi('Equipment lines', DB.equipment.length, DB.equipment.reduce((sum, e) => sum + e.Quantity, 0) + ' units on the floor')}
        ${kpi('Maintenance / year', inr(maintenanceTotal()), 'Cost × quantity, all lines')}
        ${kpi('Needs attention', serviceDue().length, 'Overdue service or faulty')}
        ${kpi('Out of order', DB.equipment.filter(e => e.Status === 'Out of order').length, 'Currently unusable')}
      </div>
    </div>
    ${sec('06', 'Trainers', 'TRAINER + TRAINING_ASSIGNMENT')}
    <div class="card card-p">
      <div class="grid g4" style="gap:0">
        ${[['Trainers on staff', DB.trainers.length], ['Active trainers', DB.trainers.filter(t => t.Status === 'Active').length],
           ['Live assignments', DB.assignments.filter(a => a.End_Date >= iso(today)).length],
           ['Avg members / trainer', (DB.assignments.filter(a => a.End_Date >= iso(today)).length / DB.trainers.length).toFixed(1)]]
          .map(([l, v]) => `<div style="padding:6px 14px 6px 0"><div class="mini">${l}</div><b class="mono" style="font-size:24px">${v}</b></div>`).join('')}
      </div>
    </div>
  </div>`;
}

/* ================================================================
   PAGE — DATABASE STRUCTURE
   ================================================================ */
const SCHEMA = {
  MEMBER: { rows: () => DB.members.length, attrs: [['PK', 'Member_ID', 'INT'], ['', 'Name', 'VARCHAR'], ['', 'Date_of_Birth', 'DATE'], ['', 'Gender', 'VARCHAR'],
    ['', 'Phone', 'VARCHAR'], ['', 'Email', 'VARCHAR'], ['', 'Address', 'VARCHAR'], ['', 'Emergency_Contact', 'VARCHAR'], ['', 'Join_Date', 'DATE'], ['', 'Status', 'VARCHAR']] },
  MEMBERSHIP: { rows: () => DB.memberships.length, attrs: [['PK', 'Membership_ID', 'INT'], ['FK', 'Member_ID', 'INT'], ['', 'Membership_Type', 'VARCHAR'],
    ['', 'Start_Date', 'DATE'], ['', 'End_Date', 'DATE'], ['', 'Price', 'DECIMAL'], ['', 'Status', 'VARCHAR']] },
  PAYMENT: { rows: () => DB.payments.length, attrs: [['PK', 'Payment_ID', 'INT'], ['FK', 'Member_ID', 'INT'], ['FK', 'Membership_ID', 'INT'], ['', 'Amount', 'DECIMAL'],
    ['', 'Payment_Date', 'DATE'], ['', 'Payment_Method', 'VARCHAR'], ['', 'Payment_Status', 'VARCHAR'], ['', 'Transaction_ID', 'VARCHAR']] },
  ATTENDANCE: { rows: () => DB.attendance.length, attrs: [['PK', 'Attendance_ID', 'INT'], ['FK', 'Member_ID', 'INT'], ['', 'Entry_Date', 'DATE'], ['', 'Entry_Time', 'TIME'], ['', 'Exit_Time', 'TIME']] },
  TRAINER: { rows: () => DB.trainers.length, attrs: [['PK', 'Trainer_ID', 'INT'], ['', 'Name', 'VARCHAR'], ['', 'Phone', 'VARCHAR'], ['', 'Email', 'VARCHAR'],
    ['', 'Specialization', 'VARCHAR'], ['', 'Salary', 'DECIMAL'], ['', 'Joining_Date', 'DATE'], ['', 'Status', 'VARCHAR']] },
  TRAINING_ASSIGNMENT: { rows: () => DB.assignments.length, attrs: [['PK', 'Assignment_ID', 'INT'], ['FK', 'Member_ID', 'INT'], ['FK', 'Trainer_ID', 'INT'], ['', 'Start_Date', 'DATE'], ['', 'End_Date', 'DATE']] },
  SLOT: { rows: () => DB.slots.length, attrs: [['PK', 'Slot_ID', 'INT'], ['', 'Start_Time', 'TIME'], ['', 'End_Time', 'TIME'], ['', 'Capacity', 'INT'], ['', 'Status', 'VARCHAR']] },
  BOOKING: { rows: () => DB.bookings.length, attrs: [['PK', 'Booking_ID', 'INT'], ['FK', 'Member_ID', 'INT'], ['FK', 'Slot_ID', 'INT'], ['', 'Booking_Date', 'DATE'], ['', 'Status', 'VARCHAR']] },
  EQUIPMENT: { rows: () => DB.equipment.length, attrs: [['PK', 'Equipment_ID', 'INT'], ['', 'Name', 'VARCHAR'], ['', 'Category', 'VARCHAR'], ['', 'Quantity', 'INT'], ['', 'Purchase_Date', 'DATE'], ['', 'Last_Service_Date', 'DATE'], ['', 'Maintenance_Cost', 'DECIMAL'], ['', 'Status', 'VARCHAR']] }
};
const RELATIONS = [
  ['MEMBER', 'MEMBERSHIP', '1 : N', 'MEMBERSHIP.Member_ID → MEMBER.Member_ID'],
  ['MEMBER', 'ATTENDANCE', '1 : N', 'ATTENDANCE.Member_ID → MEMBER.Member_ID'],
  ['MEMBER', 'PAYMENT', '1 : N', 'PAYMENT.Member_ID → MEMBER.Member_ID'],
  ['MEMBERSHIP', 'PAYMENT', '1 : N', 'PAYMENT.Membership_ID → MEMBERSHIP.Membership_ID'],
  ['MEMBER', 'TRAINING_ASSIGNMENT', '1 : N', 'TRAINING_ASSIGNMENT.Member_ID → MEMBER.Member_ID'],
  ['TRAINER', 'TRAINING_ASSIGNMENT', '1 : N', 'TRAINING_ASSIGNMENT.Trainer_ID → TRAINER.Trainer_ID'],
  ['MEMBER', 'TRAINER', 'M : N', 'resolved through TRAINING_ASSIGNMENT'],
  ['MEMBER', 'BOOKING', '1 : N', 'BOOKING.Member_ID → MEMBER.Member_ID'],
  ['SLOT', 'BOOKING', '1 : N', 'BOOKING.Slot_ID → SLOT.Slot_ID'],
  ['MEMBER', 'SLOT', 'M : N', 'resolved through BOOKING']
];
function entityCard(name) {
  const s = SCHEMA[name], hl = state.hlEntity === name;
  return `<div class="card ent ${hl ? 'hl' : ''}" data-act="hl" data-ent-name="${name}">
    <h3>${name}<span class="n">${s.rows()} rows</span></h3>
    <ul>${s.attrs.map(([k, a, t]) => `<li><b class="${k === 'PK' ? 'pk' : k === 'FK' ? 'fk' : 'at'}">${k || '·'}</b>${a}<span class="ty">${t}</span></li>`).join('')}</ul></div>`;
}
function pageSchema() {
  return `<div class="page">
    ${ph('Database structure', 'The application is a front end for exactly six tables. Hover a relationship to light up the tables it connects.')}
    ${sec('01', 'Entities', Object.keys(SCHEMA).length + ' tables · ' + Object.values(SCHEMA).reduce((s, e) => s + e.rows(), 0) + ' rows loaded')}
    <div class="grid g3">${['MEMBER', 'MEMBERSHIP', 'PAYMENT'].map(entityCard).join('')}</div>
    <div class="grid g3" style="margin-top:14px">${['ATTENDANCE', 'TRAINER', 'TRAINING_ASSIGNMENT'].map(entityCard).join('')}</div>
    <div class="grid g3" style="margin-top:14px">${['SLOT', 'BOOKING', 'EQUIPMENT'].map(entityCard).join('')}</div>
    <div class="mini" style="margin-top:12px">EQUIPMENT is a standalone asset log — it holds no foreign keys.</div>
    ${sec('02', 'Relationships and cardinality', '')}
    <div class="grid g2">${RELATIONS.map(([a, b, card, note]) => `<div class="rel-note" data-act="hl2" data-a="${a}" data-b="${b}">
      <span class="card-tag">${a}</span>———<span class="card-tag">${b}</span>
      <span class="n">${card}</span></div>`).join('')}</div>
    <div class="card card-p" style="margin-top:14px">
      <b>Foreign key map</b>
      <div style="margin-top:12px;display:grid;gap:8px">${RELATIONS.map(r => `<div class="mono" style="font-size:12px;color:var(--mute)">
        <span style="color:var(--lime)">${r[2]}</span> &nbsp; ${esc(r[3])}</div>`).join('')}</div>
    </div>
    ${sec('03', 'Reading the flow', '')}
    <div class="card card-p mono" style="font-size:12.5px;color:var(--mute);line-height:2;overflow-x:auto">
      MEMBER ──1:N──▶ MEMBERSHIP ──1:N──▶ PAYMENT<br>
      MEMBER ──1:N──▶ ATTENDANCE<br>
      MEMBER ──1:N──▶ PAYMENT<br>
      MEMBER ──1:N──▶ TRAINING_ASSIGNMENT ◀──1:N── TRAINER<br>
      MEMBER ──1:N──▶ BOOKING ◀──1:N── SLOT<br>
      EQUIPMENT &nbsp;(standalone asset log)<br>
      <span style="color:var(--lime)">MEMBER ◀──── M:N ────▶ TRAINER &nbsp;(via TRAINING_ASSIGNMENT)</span><br>
      <span style="color:var(--lime)">MEMBER ◀──── M:N ────▶ SLOT &nbsp;&nbsp;&nbsp;&nbsp;(via BOOKING)</span>
    </div>
  </div>`;
}

/* ================================================================
   PAGE — SETTINGS
   ================================================================ */
function pageSettings() {
  return `<div class="page">
    ${ph('Settings', 'Front desk preferences for this branch.')}
    <div class="grid g2">
      <div class="card card-p"><b>Branch</b>
        <dl class="kv" style="margin-top:16px">
          <dt>Gym</dt><dd>MAX GTI Fitness</dd><dt>Branch</dt><dd>Andheri West, Mumbai</dd>
          <dt>Desk hours</dt><dd>05:30 – 23:00, all days</dd><dt>Currency</dt><dd>Indian Rupee (₹)</dd>
          <dt>Signed in as</dt><dd>Girish Awade · Front desk manager</dd></dl></div>
      <div class="card card-p"><b>Plan pricing</b><div class="mini" style="margin:4px 0 14px">Defaults used when a new MEMBERSHIP row is created</div>
        ${PLAN_NAMES.map(p => `<div class="row-between" style="padding:9px 0;border-bottom:1px solid var(--line)">
          <span>${p}<span class="mini" style="margin-left:8px">${MEMBERSHIP_PLANS[p].months} month${MEMBERSHIP_PLANS[p].months > 1 ? 's' : ''}</span></span>
          <b class="mono">${inr(MEMBERSHIP_PLANS[p].price)}</b></div>`).join('')}</div>
      <div class="card card-p"><b>Data</b><div class="mini" style="margin:4px 0 14px">This demo keeps all six tables in memory. Reload to restore the sample data.</div>
        <div style="display:flex;gap:9px;flex-wrap:wrap">
          <button class="btn btn-sm" data-act="export" data-ent="member">${ic('download')} Members CSV</button>
          <button class="btn btn-sm" data-act="export" data-ent="payment">${ic('download')} Payments CSV</button>
          <button class="btn btn-sm" data-act="export" data-ent="attendance">${ic('download')} Attendance CSV</button>
          <button class="btn btn-sm" data-act="export" data-ent="booking">${ic('download')} Bookings CSV</button>
          <button class="btn btn-sm" data-act="export" data-ent="equipment">${ic('download')} Equipment CSV</button>
          <button class="btn btn-sm btn-danger" data-act="reset">Reload sample data</button></div></div>
      <div class="card card-p"><b>Notifications</b><div class="mini" style="margin:4px 0 14px">Desk alerts</div>
        ${[['Membership expiring in 7 days', true], ['Payment marked failed', true], ['Member checked in after 22:00', false], ['Trainer assignment ending', true]]
          .map(([l, on]) => `<label class="row-between" style="padding:10px 0;border-bottom:1px solid var(--line);cursor:pointer">
            <span>${l}</span><input type="checkbox" ${on ? 'checked' : ''} style="accent-color:var(--lime);width:16px;height:16px"></label>`).join('')}</div>
    </div></div>`;
}

/* ================================================================
   CRUD — field specs per entity
   ================================================================ */
const memberOpts = () => DB.members.map(m => [m.Member_ID, `${m.Name} (${m.Member_ID})`]);
const trainerOpts = () => DB.trainers.map(t => [t.Trainer_ID, `${t.Name} — ${t.Specialization}`]);
const membershipOptsFor = mid => DB.memberships.filter(m => !mid || m.Member_ID === mid)
  .map(m => [m.Membership_ID, `${m.Membership_ID} · ${m.Membership_Type} · ${fmtDate(m.End_Date)}`]);

const FIELDS = {
  member: () => [
    { k: 'Name', label: 'Full name', req: true, ph: 'Aarav Sharma' },
    { k: 'Date_of_Birth', label: 'Date of birth', type: 'date', req: true },
    { k: 'Gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'] },
    { k: 'Phone', label: 'Phone', req: true, ph: '+91 98765 43210' },
    { k: 'Email', label: 'Email', type: 'email', req: true, ph: 'name@gmail.com', err: 'Enter a valid email address.' },
    { k: 'Emergency_Contact', label: 'Emergency contact', ph: '+91 98765 43210' },
    { k: 'Address', label: 'Address', type: 'textarea', full: true, ph: 'Flat, building, area, Mumbai' },
    { k: 'Join_Date', label: 'Join date', type: 'date', req: true, def: iso(today) },
    { k: 'Status', label: 'Status', type: 'select', options: ['Active', 'Inactive', 'Suspended'] }
  ],
  membership: () => [
    { k: 'Member_ID', label: 'Member', type: 'select', options: memberOpts(), req: true, full: true },
    { k: 'Membership_Type', label: 'Plan', type: 'select', options: PLAN_NAMES },
    { k: 'Price', label: 'Price (₹)', type: 'number', req: true, def: MEMBERSHIP_PLANS['Monthly'].price },
    { k: 'Start_Date', label: 'Start date', type: 'date', req: true, def: iso(today) },
    { k: 'End_Date', label: 'End date', type: 'date', req: true, def: iso(addDays(today, 30)) },
    { k: 'Status', label: 'Status', type: 'select', options: ['Active', 'Pending', 'Expired'], full: true }
  ],
  payment: (v = {}) => [
    { k: 'Member_ID', label: 'Member', type: 'select', options: memberOpts(), req: true },
    { k: 'Membership_ID', label: 'Membership', type: 'select', options: membershipOptsFor(v.Member_ID), req: true },
    { k: 'Amount', label: 'Amount (₹)', type: 'number', req: true },
    { k: 'Payment_Date', label: 'Payment date', type: 'date', req: true, def: iso(today) },
    { k: 'Payment_Method', label: 'Method', type: 'select', options: PAY_METHODS },
    { k: 'Payment_Status', label: 'Status', type: 'select', options: ['Paid', 'Pending', 'Failed', 'Refunded'] },
    { k: 'Transaction_ID', label: 'Transaction ID', full: true, ph: 'UPI12345678 — leave blank to generate' }
  ],
  trainer: () => [
    { k: 'Name', label: 'Full name', req: true },
    { k: 'Specialization', label: 'Specialization', type: 'select', options: SPECIALIZATIONS },
    { k: 'Phone', label: 'Phone', req: true },
    { k: 'Email', label: 'Email', type: 'email', req: true, err: 'Enter a valid email address.' },
    { k: 'Salary', label: 'Monthly salary (₹)', type: 'number', req: true, def: 50000 },
    { k: 'Joining_Date', label: 'Joining date', type: 'date', req: true, def: iso(today) },
    { k: 'Status', label: 'Status', type: 'select', options: ['Active', 'On Leave', 'Inactive'], full: true }
  ],
  assignment: () => [
    { k: 'Member_ID', label: 'Member', type: 'select', options: memberOpts(), req: true },
    { k: 'Trainer_ID', label: 'Trainer', type: 'select', options: trainerOpts(), req: true },
    { k: 'Start_Date', label: 'Start date', type: 'date', req: true, def: iso(today) },
    { k: 'End_Date', label: 'End date', type: 'date', req: true, def: iso(addDays(today, 90)) }
  ],
  slot: () => [
    { k: 'Start_Time', label: 'Start time', type: 'time', req: true, def: '06:00' },
    { k: 'End_Time', label: 'End time', type: 'time', req: true, def: '07:00' },
    { k: 'Capacity', label: 'Capacity (members)', type: 'number', req: true, def: 25 },
    { k: 'Status', label: 'Status', type: 'select', options: ['Open', 'Closed'] }
  ],
  booking: (v = {}) => [
    { k: 'Member_ID', label: 'Member', type: 'select', options: memberOpts(), req: true },
    { k: 'Booking_Date', label: 'Date', type: 'date', req: true, def: v.Booking_Date || state.slotDate || iso(today) },
    { k: 'Slot_ID', label: 'Slot (seats left)', type: 'select', options: slotOptsFor(v.Booking_Date || state.slotDate || iso(today)), req: true, full: true },
    { k: 'Status', label: 'Status', type: 'select', options: ['Booked', 'Attended', 'No-show', 'Cancelled'], full: true }
  ],
  equipment: () => [
    { k: 'Name', label: 'Equipment name', req: true, full: true, ph: 'Treadmill (commercial)' },
    { k: 'Category', label: 'Category', type: 'select', options: EQUIP_CATS },
    { k: 'Quantity', label: 'Units', type: 'number', req: true, def: 1 },
    { k: 'Purchase_Date', label: 'Purchased on', type: 'date', req: true, def: iso(today) },
    { k: 'Last_Service_Date', label: 'Last serviced', type: 'date', req: true, def: iso(today) },
    { k: 'Maintenance_Cost', label: 'Maintenance cost per unit / year (₹)', type: 'number', req: true, def: 1500 },
    { k: 'Status', label: 'Status', type: 'select', options: ['Working', 'Needs service', 'Out of order'] }
  ]
};
/* a slot list for one date, showing what is still free — full slots are not offered */
function slotOptsFor(date) {
  const open = openSlots(date);
  return open.length
    ? open.map(s2 => [s2.Slot_ID, `${s2.Start_Time}–${s2.End_Time} · ${seatsLeft(s2.Slot_ID, date)} of ${s2.Capacity} free`])
    : [['', 'Every slot is full on this date']];
}
const ENT = {
  member: { table: 'members', key: 'Member_ID', prefix: 'MEM', label: 'member', name: r => r.Name },
  membership: { table: 'memberships', key: 'Membership_ID', prefix: 'MS', label: 'membership', name: r => `${r.Membership_ID} · ${memberName(r.Member_ID)}` },
  payment: { table: 'payments', key: 'Payment_ID', prefix: 'PAY', label: 'payment', name: r => `${r.Payment_ID} · ${inr(r.Amount)}` },
  attendance: { table: 'attendance', key: 'Attendance_ID', prefix: 'ATT', label: 'attendance record', name: r => `${r.Attendance_ID} · ${memberName(r.Member_ID)}` },
  trainer: { table: 'trainers', key: 'Trainer_ID', prefix: 'TRN', label: 'trainer', name: r => r.Name },
  assignment: { table: 'assignments', key: 'Assignment_ID', prefix: 'ASG', label: 'assignment', name: r => `${r.Assignment_ID} · ${memberName(r.Member_ID)} → ${trainerName(r.Trainer_ID)}` },
  slot: { table: 'slots', key: 'Slot_ID', prefix: 'SLT', label: 'slot', name: r => `${r.Start_Time}–${r.End_Time}` },
  booking: { table: 'bookings', key: 'Booking_ID', prefix: 'BKG', label: 'booking', name: r => `${memberName(r.Member_ID)} · ${slotLabel(r.Slot_ID)} · ${fmtDate(r.Booking_Date)}` },
  equipment: { table: 'equipment', key: 'Equipment_ID', prefix: 'EQP', label: 'equipment line', name: r => r.Name }
};
const findRow = (ent, id) => DB[ENT[ent].table].find(r => r[ENT[ent].key] === id);

function openForm(ent, id, preset = {}) {
  const meta = ENT[ent], existing = id ? findRow(ent, id) : null;
  const seed = existing || preset;
  const fields = FIELDS[ent](seed);
  openModal({
    title: (existing ? 'Edit ' : 'New ') + meta.label,
    sub: existing ? `${meta.key} ${id} · editing an existing row` : `A new row will be inserted into ${meta.table.toUpperCase()}`,
    body: formHTML(fields, seed), ok: existing ? 'Save changes' : 'Create record',
    onOk: () => {
      const data = readForm(fields);
      if (!data) { toast('Check the highlighted fields', 'Some required values are missing.', true); return false; }
      if (data.Start_Date && data.End_Date && data.End_Date < data.Start_Date) { toast('Dates are the wrong way round', 'End date must be after the start date.', true); return false; }
      if (ent === 'slot' && data.End_Time <= data.Start_Time) { toast('Check the times', 'A slot has to end after it starts.', true); return false; }
      if (ent === 'booking') {
        if (!data.Slot_ID) { toast('No seats free', 'Every slot is full on that date — pick another day.', true); return false; }
        const clash = DB.bookings.find(b => b.Member_ID === data.Member_ID && b.Booking_Date === data.Booking_Date
          && b.Status !== 'Cancelled' && (!existing || b.Booking_ID !== existing.Booking_ID));
        if (clash) { toast('Already booked', `${memberName(data.Member_ID)} has ${slotLabel(clash.Slot_ID)} on that date.`, true); return false; }
        const free = seatsLeft(data.Slot_ID, data.Booking_Date) - (existing && existing.Slot_ID === data.Slot_ID ? -1 : 0);
        if (free <= 0 && data.Status !== 'Cancelled') { toast('Slot is full', `${slotLabel(data.Slot_ID)} has no seats left on ${fmtDate(data.Booking_Date)}.`, true); return false; }
      }
      if (existing) {
        Object.assign(existing, data);
        if (ent === 'membership') existing.Status = existing.End_Date < iso(today) ? 'Expired' : (existing.Start_Date > iso(today) ? 'Pending' : existing.Status);
        toast(meta.label[0].toUpperCase() + meta.label.slice(1) + ' updated', meta.name(existing));
      } else {
        const arr = DB[meta.table];
        const row = Object.assign({ [meta.key]: uid(meta.prefix, arr, meta.key) }, data);
        if (ent === 'payment' && !row.Transaction_ID) row.Transaction_ID = (row.Payment_Method === 'Cash' ? 'CASH-' : 'TXN') + rint(100000, 99999999);
        arr.push(row);
        toast(meta.label[0].toUpperCase() + meta.label.slice(1) + ' created', meta.name(row));
      }
      closeModal(); render(); return true;
    }
  });
  /* plan → price + end date autofill; member → membership list */
  const typeSel = $('#modalRoot [data-k="Membership_Type"]');
  if (typeSel) typeSel.addEventListener('change', () => {
    const p = MEMBERSHIP_PLANS[typeSel.value];
    const startEl = $('#modalRoot [data-k="Start_Date"]'), priceEl = $('#modalRoot [data-k="Price"]'), endEl = $('#modalRoot [data-k="End_Date"]');
    if (priceEl) priceEl.value = p.price;
    if (endEl && startEl && startEl.value) endEl.value = iso(addDays(parse(startEl.value), p.months * 30));
  });
  const dateSel = $('#modalRoot [data-k="Booking_Date"]'), slotSel = $('#modalRoot [data-k="Slot_ID"]');
  if (dateSel && slotSel) dateSel.addEventListener('change', () => {
    const opts = slotOptsFor(dateSel.value);
    slotSel.innerHTML = opts.map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join('');
  });

  const memSel = $('#modalRoot [data-k="Member_ID"]'), msSel = $('#modalRoot [data-k="Membership_ID"]');
  if (memSel && msSel) {
    const sync = () => {
      const list = membershipOptsFor(memSel.value);
      msSel.innerHTML = list.length ? list.map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join('')
        : '<option value="">No membership on file — create one first</option>';
      const ms = membership(msSel.value);
      const amt = $('#modalRoot [data-k="Amount"]');
      if (ms && amt && !amt.value) amt.value = ms.Price;
    };
    memSel.addEventListener('change', sync);
    if (!msSel.value) sync();
  }
}

function deleteRow(ent, id) {
  const meta = ENT[ent], row = findRow(ent, id); if (!row) return;
  let deps = [];
  if (ent === 'member') deps = [[DB.memberships.filter(x => x.Member_ID === id).length, 'MEMBERSHIP'],
    [DB.payments.filter(x => x.Member_ID === id).length, 'PAYMENT'], [DB.attendance.filter(x => x.Member_ID === id).length, 'ATTENDANCE'],
    [DB.assignments.filter(x => x.Member_ID === id).length, 'TRAINING_ASSIGNMENT'],
    [DB.bookings.filter(x => x.Member_ID === id).length, 'BOOKING']];
  if (ent === 'membership') deps = [[DB.payments.filter(x => x.Membership_ID === id).length, 'PAYMENT']];
  if (ent === 'trainer') deps = [[DB.assignments.filter(x => x.Trainer_ID === id).length, 'TRAINING_ASSIGNMENT']];
  if (ent === 'slot') deps = [[DB.bookings.filter(x => x.Slot_ID === id).length, 'BOOKING']];
  deps = deps.filter(d => d[0]);
  openModal({
    title: 'Delete this ' + meta.label + '?', sub: `${meta.key} ${id}`, ok: 'Delete record', danger: true,
    body: `<p style="color:var(--mute)">Removing <b style="color:var(--chalk)">${esc(meta.name(row))}</b> from ${meta.table.toUpperCase()}.</p>
      ${deps.length ? `<div class="card card-p" style="margin-top:16px">
        <b style="color:var(--warn)">Foreign keys point at this row</b>
        <div style="margin-top:10px;display:grid;gap:7px">${deps.map(d => `<div class="mono" style="font-size:12.5px;color:var(--mute)">${d[0]} row${d[0] > 1 ? 's' : ''} in ${d[1]}</div>`).join('')}</div>
        <div class="mini" style="margin-top:12px">These will be deleted too, the way ON DELETE CASCADE would handle it.</div></div>` : ''}`,
    onOk: () => {
      if (ent === 'member') {
        DB.memberships = DB.memberships.filter(x => x.Member_ID !== id);
        DB.payments = DB.payments.filter(x => x.Member_ID !== id);
        DB.attendance = DB.attendance.filter(x => x.Member_ID !== id);
        DB.assignments = DB.assignments.filter(x => x.Member_ID !== id);
        DB.bookings = DB.bookings.filter(x => x.Member_ID !== id);
      }
      if (ent === 'slot') DB.bookings = DB.bookings.filter(x => x.Slot_ID !== id);
      if (ent === 'membership') DB.payments = DB.payments.filter(x => x.Membership_ID !== id);
      if (ent === 'trainer') DB.assignments = DB.assignments.filter(x => x.Trainer_ID !== id);
      DB[meta.table] = DB[meta.table].filter(r => r[meta.key] !== id);
      if (state.page === 'member' && ent === 'member') state.page = 'members';
      if (state.page === 'trainer' && ent === 'trainer') state.page = 'trainers';
      closeModal(); toast('Deleted', meta.name(row)); render(); return true;
    }
  });
}

/* check-in / check-out */
function checkIn(memberId) {
  const now = new Date();
  const time = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  if (!memberId) {
    const fields = [{ k: 'Member_ID', label: 'Member', type: 'select', options: memberOpts(), req: true, full: true }];
    return openModal({
      title: 'Check a member in', sub: `Entry_Date and Entry_Time are recorded automatically`,
      body: formHTML(fields) + `<div class="card card-p" style="margin-top:16px;display:flex;gap:14px;align-items:center">
        ${ic('clock')}<div><b class="mono">${fmtDate(iso(today))} · ${time}</b><div class="mini" style="margin-top:3px">Entry stamp for this check-in</div></div></div>`,
      ok: 'Check in',
      onOk: () => { const d = readForm(fields); if (!d) return false; closeModal(); checkIn(d.Member_ID); return true; }
    });
  }
  const open = DB.attendance.find(a => a.Member_ID === memberId && a.Entry_Date === iso(today) && !a.Exit_Time);
  if (open) return toast('Already on the floor', `${memberName(memberId)} checked in at ${open.Entry_Time}.`, true);
  DB.attendance.push({ Attendance_ID: uid('ATT', DB.attendance, 'Attendance_ID'), Member_ID: memberId, Entry_Date: iso(today), Entry_Time: time, Exit_Time: null });
  toast('Checked in', `${memberName(memberId)} at ${time}`);
  render();
}
function checkOut(attId) {
  const a = DB.attendance.find(x => x.Attendance_ID === attId); if (!a) return;
  const now = new Date();
  a.Exit_Time = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  toast('Checked out', `${memberName(a.Member_ID)} at ${a.Exit_Time}`);
  render();
}

/* ================================================================
   GLOBAL SEARCH
   ================================================================ */
function globalSearch(q) {
  const box = $('#searchResults');
  if (!q.trim()) return box.classList.add('hide');
  const t = q.toLowerCase(), out = [];
  DB.members.filter(m => (m.Name + m.Member_ID + m.Phone + m.Email).toLowerCase().includes(t)).slice(0, 4)
    .forEach(m => out.push({ label: m.Name, sub: m.Member_ID + ' · ' + m.Phone, tag: 'Member', act: `data-act="member" data-id="${m.Member_ID}"` }));
  DB.trainers.filter(x => (x.Name + x.Trainer_ID + x.Specialization).toLowerCase().includes(t)).slice(0, 3)
    .forEach(x => out.push({ label: x.Name, sub: x.Specialization, tag: 'Trainer', act: `data-act="trainer" data-id="${x.Trainer_ID}"` }));
  DB.memberships.filter(x => (x.Membership_ID + memberName(x.Member_ID) + x.Membership_Type).toLowerCase().includes(t)).slice(0, 3)
    .forEach(x => out.push({ label: `${x.Membership_ID} · ${x.Membership_Type}`, sub: memberName(x.Member_ID), av: memberName(x.Member_ID), tag: 'Membership', act: `data-act="member" data-id="${x.Member_ID}"` }));
  DB.payments.filter(x => (x.Payment_ID + x.Transaction_ID + memberName(x.Member_ID) + x.Amount).toLowerCase().includes(t)).slice(0, 3)
    .forEach(x => out.push({ label: `${inr(x.Amount)} · ${x.Transaction_ID}`, sub: memberName(x.Member_ID) + ' · ' + fmtDate(x.Payment_Date), av: memberName(x.Member_ID), tag: 'Payment', act: `data-act="member" data-id="${x.Member_ID}"` }));
  DB.equipment.filter(x => (x.Name + x.Category + x.Equipment_ID).toLowerCase().includes(t)).slice(0, 3)
    .forEach(x => out.push({ label: x.Name, sub: `${x.Category} · ${x.Quantity} units · ${inr(x.Maintenance_Cost)}/yr`, av: x.Name, tag: 'Equipment', act: `data-act="go" data-page="equipment"` }));
  DB.slots.filter(x => (x.Slot_ID + x.Start_Time + x.End_Time).toLowerCase().includes(t)).slice(0, 2)
    .forEach(x => out.push({ label: `${x.Start_Time}–${x.End_Time}`, sub: `${x.Capacity} seats · ${seatsLeft(x.Slot_ID, iso(today))} free today`, av: 'SL', tag: 'Slot', act: `data-act="go" data-page="slots"` }));
  DB.assignments.filter(x => (x.Assignment_ID + memberName(x.Member_ID) + trainerName(x.Trainer_ID)).toLowerCase().includes(t)).slice(0, 2)
    .forEach(x => out.push({ label: `${memberName(x.Member_ID)} → ${trainerName(x.Trainer_ID)}`, sub: x.Assignment_ID, av: memberName(x.Member_ID), tag: 'Assignment', act: `data-act="member" data-id="${x.Member_ID}"` }));
  box.classList.remove('hide');
  box.innerHTML = out.length ? out.map(r => `<div class="rr" ${r.act}>${avatarFor(r.av || r.label)}
      <div style="min-width:0"><b style="font-size:13px">${esc(r.label)}</b><div class="mini" style="margin-top:2px">${esc(r.sub)}</div></div>
      <span class="tag">${r.tag}</span></div>`).join('')
    : `<div class="empty">No records match “${esc(q)}”. Try a member name, ID or transaction reference.</div>`;
}

/* ================================================================
   ROUTER + EVENTS
   ================================================================ */
const PAGES = {
  dashboard: pageDashboard, members: pageMembers, member: pageMemberProfile, memberships: pageMemberships,
  payments: pagePayments, attendance: pageAttendance, trainers: pageTrainers, trainer: pageTrainerProfile,
  assignments: pageAssignments, slots: pageSlots, equipment: pageEquipment,
  reports: pageReports, schema: pageSchema, settings: pageSettings
};
function render() {
  const fn = PAGES[state.page] || pageDashboard;
  $('#view').innerHTML = fn();
  renderNav();
  const titles = { member: 'Member profile', trainer: 'Trainer profile', schema: 'Database structure',
    assignments: 'Training assignments', slots: 'Slots & bookings' };
  $('#crumb').textContent = titles[state.page] || (NAV.find(n => n[0] === state.page) || [, 'Dashboard'])[1];
  window.scrollTo({ top: 0, behavior: 'instant' in document.documentElement.style ? 'instant' : 'auto' });
  if (window.Effects) window.Effects.onRender();   // shuffle the title, re-arm the card effects
}
function go(page) {
  state.page = page; state.tab = 'overview'; closeMenu();
  /* sandboxed previews (srcdoc iframes) block history writes — never let that
     stop the page from rendering */
  try { history.replaceState(null, '', '#' + page); } catch (e) { /* no deep links here */ }
  render();
}
function openMember(id) { state.memberId = id; state.page = 'member'; state.tab = 'overview'; closeMenu(); render(); }
function openTrainer(id) { state.trainerId = id; state.page = 'trainer'; closeMenu(); render(); }
const closeMenu = () => { $('#sidebar').classList.remove('open'); $('#scrim').classList.remove('on'); $('#searchResults').classList.add('hide'); };

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el) { if (!e.target.closest('.search')) $('#searchResults').classList.add('hide'); return; }
  const a = el.dataset.act;
  const stop = () => { e.preventDefault(); e.stopPropagation(); };

  if (a === 'go') { stop(); go(el.dataset.page); }
  else if (a === 'member') { stop(); openMember(el.dataset.id); }
  else if (a === 'trainer') { stop(); openTrainer(el.dataset.id); }
  else if (a === 'tab') { stop(); state.tab = el.dataset.tab; render(); }
  else if (a === 'attrange') { stop(); state.attRange = +el.dataset.v; render(); }
  else if (a === 'add') { stop(); openForm(el.dataset.ent, null, { Member_ID: el.dataset.member, Trainer_ID: el.dataset.trainer }); }
  else if (a === 'edit') { stop(); openForm(el.dataset.ent, el.dataset.id); }
  else if (a === 'del') { stop(); deleteRow(el.dataset.ent, el.dataset.id); }
  else if (a === 'checkin') { stop(); checkIn(null); }
  else if (a === 'checkin-member') { stop(); checkIn(el.dataset.id); }
  else if (a === 'checkout') { stop(); checkOut(el.dataset.id); }
  else if (a === 'close-modal') { stop(); closeModal(); }
  /* backdrop click closes; clicks on the dialog itself fall through to the buttons */
  else if (a === 'overlay') { if (e.target === el) { stop(); closeModal(); } }
  else if (a === 'reset') { stop(); location.reload(); }
  else if (a === 'slotdate') { stop(); state.slotDate = el.dataset.v; render(); }
  else if (a === 'book-slot') { stop(); openForm('booking', null, { Slot_ID: el.dataset.id, Booking_Date: state.slotDate || iso(today) }); }
  else if (a === 'service') { stop(); const e2 = findRow('equipment', el.dataset.id);
    if (e2) { e2.Last_Service_Date = iso(today); e2.Status = 'Working'; toast('Marked serviced', `${e2.Name} · ${fmtDate(iso(today))}`); render(); } }
  else if (a === 'go-expiring') { stop();
    pendingTable = { id: 'memberships', patch: { filter: 'Expiring soon', q: '', page: 1, sort: 'End_Date', dir: 'asc' } };
    if (TBL.memberships) Object.assign(TBL.memberships, pendingTable.patch);
    go('memberships'); }
  else if (a === 'clients') { stop(); const t = trainer(el.dataset.id);
    const patch = { q: t ? t.Name : '', filter: 'Active', page: 1 };
    pendingTable = { id: 'assignments', patch };
    if (TBL.assignments) Object.assign(TBL.assignments, patch);
    go('assignments'); toast('Filtered by trainer', t ? t.Name + "'s active clients" : ''); }
  else if (a === 'export') {
    stop();
    const meta = ENT[el.dataset.ent];
    exportCSV(`maxgti-${meta.table}-${iso(today)}.csv`, DB[meta.table]);
  }
  else if (a === 'export-report') {
    stop();
    exportCSV(`maxgti-summary-${iso(today)}.csv`, [
      { Metric: 'Total members', Value: DB.members.length }, { Metric: 'Active members', Value: DB.members.filter(m => m.Status === 'Active').length },
      { Metric: 'Active memberships', Value: DB.memberships.filter(m => m.Status === 'Active').length },
      { Metric: 'Expired memberships', Value: DB.memberships.filter(m => m.Status === 'Expired').length },
      { Metric: 'Revenue this month', Value: revenueInMonth(today.getFullYear(), today.getMonth()) },
      { Metric: 'Lifetime collected', Value: paidPayments().reduce((s, p) => s + p.Amount, 0) },
      { Metric: 'Attendance today', Value: todayAtt().length }, { Metric: 'Live assignments', Value: DB.assignments.filter(x => x.End_Date >= iso(today)).length },
      { Metric: 'Trainers', Value: DB.trainers.length }
    ]);
  }
  else if (a === 'ts') { stop(); const s = TBL[el.dataset.tbl];
    if (s.sort === el.dataset.col) s.dir = s.dir === 'asc' ? 'desc' : 'asc'; else { s.sort = el.dataset.col; s.dir = 'asc'; }
    refreshTable(el.dataset.tbl); }
  else if (a === 'tf') { stop(); const s = TBL[el.dataset.tbl]; s.filter = s.filter === el.dataset.v ? 'All' : el.dataset.v; s.page = 1; refreshTable(el.dataset.tbl); }
  else if (a === 'tp') { stop(); const s = TBL[el.dataset.tbl]; s.page = +el.dataset.p; refreshTable(el.dataset.tbl); }
  else if (a === 'hl') { stop(); state.hlEntity = state.hlEntity === el.dataset.entName ? null : el.dataset.entName; render(); }
});
/* relationship hover lights up both entity cards */
document.addEventListener('mouseover', e => {
  const rel = e.target.closest('[data-act="hl2"]'); if (!rel) return;
  $$('.ent').forEach(c => c.classList.toggle('hl', [rel.dataset.a, rel.dataset.b].includes(c.dataset.entName)));
});
document.addEventListener('mouseout', e => {
  if (e.target.closest('[data-act="hl2"]')) $$('.ent').forEach(c => c.classList.toggle('hl', c.dataset.entName === state.hlEntity));
});
document.addEventListener('input', e => {
  const el = e.target;
  if (el.dataset.act === 'tq') { const s = TBL[el.dataset.tbl]; s.q = el.value; s.page = 1; refreshTable(el.dataset.tbl); }
  if (el.dataset.act === 'slotdate-input' && el.value) { state.slotDate = el.value; render(); }
  if (el.id === 'globalSearch') globalSearch(el.value);
});
document.addEventListener('click', e => { if (e.target.id === 'modalOk' && modalOk) modalOk(); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeModal(); closeMenu(); }
  if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA' && !$('#app').classList.contains('gone')) {
    e.preventDefault(); $('#globalSearch').focus();
  }
  if (e.key === 'Enter' && $('#modalOk')) { const t = e.target; if (t.tagName !== 'TEXTAREA') { e.preventDefault(); modalOk && modalOk(); } }
});
$('#burger').addEventListener('click', () => { $('#sidebar').classList.toggle('open'); $('#scrim').classList.toggle('on'); });
$('#scrim').addEventListener('click', closeMenu);
$('#bell').addEventListener('click', () => {
  const soon = expiringSoon().sort((a, b) => a.End_Date.localeCompare(b.End_Date)).slice(0, 3);
  const recentPay = paidPayments().filter(p => daysBetween(p.Payment_Date, iso(today)) <= 2)
    .sort((a, b) => b.Payment_Date.localeCompare(a.Payment_Date)).slice(0, 2);
  const failed = DB.payments.filter(p => p.Payment_Status === 'Failed').slice(0, 2);
  const joined = DB.members.filter(m => daysBetween(m.Join_Date, iso(today)) <= 7)
    .sort((a, b) => b.Join_Date.localeCompare(a.Join_Date)).slice(0, 2);
  const assigned = DB.assignments.filter(a => daysBetween(a.Start_Date, iso(today)) <= 7 && a.Start_Date <= iso(today)).slice(0, 2);
  const milestone = DB.members.map(m => ({ m, st: streaks(m.Member_ID) }))
    .filter(x => x.st.current >= 7).sort((a, b) => b.st.current - a.st.current).slice(0, 2);

  const row = (icon, cls, title, text, act) => `<div class="notif ${cls}" ${act || ''}>
    ${ic(icon)}<div><b>${title}</b><div class="mini" style="margin-top:3px">${text}</div></div></div>`;

  const items = [
    ...soon.map(ms => row('cal', 'warn', 'Membership expiring',
      `${esc(memberName(ms.Member_ID))}'s ${esc(ms.Membership_Type)} plan expires in ${daysBetween(iso(today), ms.End_Date)} days.`,
      `data-act="member" data-id="${ms.Member_ID}"`)),
    ...recentPay.map(p => row('rupee', 'ok', 'Payment received',
      `${inr(p.Amount)} recorded for ${esc(memberName(p.Member_ID))} via ${esc(p.Payment_Method)}.`,
      `data-act="member" data-id="${p.Member_ID}"`)),
    ...failed.map(p => row('x', 'bad', 'Payment failed',
      `${inr(p.Amount)} from ${esc(memberName(p.Member_ID))} failed on ${fmtDate(p.Payment_Date)}.`,
      `data-act="member" data-id="${p.Member_ID}"`)),
    ...joined.map(m => row('users', 'info', 'New member registered',
      `${esc(m.Name)} joined on ${fmtDate(m.Join_Date)}.`, `data-act="member" data-id="${m.Member_ID}"`)),
    ...assigned.map(a => row('link', 'info', 'Trainer assigned',
      `${esc(trainerName(a.Trainer_ID))} now trains ${esc(memberName(a.Member_ID))} until ${fmtDate(a.End_Date)}.`,
      `data-act="trainer" data-id="${a.Trainer_ID}"`)),
    ...milestone.map(x => row('badge', 'lime', 'Attendance milestone',
      `${esc(x.m.Name)} is on a ${x.st.current}-day streak.`, `data-act="member" data-id="${x.m.Member_ID}"`))
  ];

  openModal({
    title: 'Desk alerts', sub: `${items.length} events from live table data`, ok: null, onOk: null,
    body: items.length ? `<div class="notif-list">${items.join('')}</div>`
      : `<div class="empty-state">${ic('check')}<b>All clear</b>Nothing needs attention right now.</div>`
  });
});
$('#logout').innerHTML = ic('out');
$('#bell').insertAdjacentHTML('afterbegin', ic('bell'));
$('#burger').innerHTML = ic('menu');
$('#searchIcon').outerHTML = ic('search');
$('#logout').addEventListener('click', () => {
  $('#app').classList.add('gone'); $('#login').classList.remove('gone');
  toast('Signed out', 'The demo data stays loaded until you reload.');
});

/* ================================================================
   LOGIN + BOOT
   ================================================================ */
$('#lgS1').textContent = DB.members.length;
$('#lgS2').textContent = DB.memberships.filter(m => m.Status === 'Active').length;
$('#lgS3').textContent = DB.trainers.length;
function signIn() {
  const em = $('#lgEmail'), pw = $('#lgPass');
  let ok = true;
  [em, pw].forEach(i => { const f = i.closest('.field'); f.classList.toggle('bad', !i.value.trim()); if (!i.value.trim()) ok = false; });
  if (!ok) return;
  $('#login').classList.add('gone'); $('#app').classList.remove('gone');
  render();
  setTimeout(() => toast('Welcome back, Girish', `${onFloor().length} members are on the floor right now.`), 400);
}
$('#lgBtn').addEventListener('click', signIn);
$('#lgForgot').addEventListener('click', e => { e.preventDefault(); toast('Reset link sent', 'Check the desk inbox for instructions.'); });
['#lgEmail', '#lgPass'].forEach(s => $(s).addEventListener('keydown', e => { if (e.key === 'Enter') signIn(); }));
try {
  if (location.hash && PAGES[location.hash.slice(1)]) state.page = location.hash.slice(1);
  window.addEventListener('hashchange', () => {
    const p = location.hash.slice(1);
    if (PAGES[p] && p !== state.page) { state.page = p; render(); }
  });
} catch (e) { /* no location access in this context */ }
