(() => {
  "use strict";

  const TODAY = 46;
  const CYCLE_DAYS = 84;
  const BASE_DATE = new Date(2026, 7, 17);
  const STORAGE_KEY = "pocket-training-v1";
  const TYPES = ["Fingers", "Board", "Bouldering", "Sport", "Trad", "Strength", "Cardio", "Mobility"];
  const TYPE_COLORS = {
    Fingers: "#bd8a32", Board: "#ad4d2d", Bouldering: "#8e3b2a", Sport: "#547188",
    Trad: "#6d8790", Strength: "#73814b", Cardio: "#3f6b4f", Mobility: "#897a6b"
  };
  const PHASES = {
    Base: "Aerobic capacity, finger volume and movement mileage. Keep intensity moderate.",
    Strength: "Max finger strength and heavy pulling. Low volume, full rest between efforts.",
    Power: "Recruitment and speed: board limit problems, campus ladders, short max hangs.",
    "Power Endurance": "Sustained hard efforts: linked boulders, route intervals and 4×4s.",
    Perform: "Cut gym volume and spend the energy on outdoor redpoint burns."
  };
  const INITIAL_PHASES = ["Base", "Base", "Base", "Strength", "Strength", "Strength", "Power", "Power", "Power", "Power Endurance", "Perform", "Perform"];
  const YDS = ["5.10a", "5.10b", "5.10c", "5.10d", "5.11a", "5.11b", "5.11c", "5.11d", "5.12a", "5.12b", "5.12c", "5.12d", "5.13a", "5.13b", "5.13c"];
  const V_GRADES = Array.from({ length: 13 }, (_, i) => `V${i}`);

  const workoutSeeds = [
    { id: "w1", name: "Max Hangs", type: "Fingers", dur: 50, rpe: 8, desc: "Half-crimp on a 20 mm edge. Load so the final hang is hard but clean.", blocks: [
      { name: "Warm-up ramp", sets: "4", reps: "1", work: "10 s", rest: "60 s", load: "BW → +10 kg" },
      { name: "Max hangs, 20 mm", sets: "6", reps: "1", work: "7 s", rest: "3 min", load: "+18 kg" },
      { name: "Open-hand drag", sets: "3", reps: "1", work: "7 s", rest: "3 min", load: "+10 kg" }
    ] },
    { id: "w2", name: "Board — 40° Power", type: "Board", dur: 60, rpe: 8, desc: "Short, powerful problems on the 40° board. Rest fully between attempts.", blocks: [
      { name: "Warm-up circuit", sets: "1", reps: "6 problems", work: "—", rest: "1 min", load: "V2–V4" },
      { name: "Limit problems", sets: "5", reps: "3 attempts", work: "—", rest: "3 min", load: "V6–V7" },
      { name: "Campus ladders", sets: "4", reps: "1", work: "1-4-7", rest: "3 min", load: "BW" }
    ] },
    { id: "w3", name: "Limit Bouldering", type: "Bouldering", dur: 90, rpe: 9, desc: "Two to three problems at your limit. Stop when movement quality drops.", blocks: [
      { name: "Warm-up pyramid", sets: "1", reps: "8 problems", work: "—", rest: "1 min", load: "V0–V5" },
      { name: "Limit projects", sets: "6", reps: "4 attempts", work: "—", rest: "4 min", load: "V7–V8" }
    ] },
    { id: "w4", name: "Pull & Antagonist", type: "Strength", dur: 55, rpe: 7, desc: "Heavy pulling paired with pressing and wrist work for shoulder and elbow health.", blocks: [
      { name: "Weighted pull-ups", sets: "5", reps: "3", work: "—", rest: "3 min", load: "+34 kg" },
      { name: "Ring dips", sets: "3", reps: "8", work: "—", rest: "2 min", load: "BW" },
      { name: "Wrist extensors", sets: "3", reps: "15", work: "—", rest: "1 min", load: "4 kg" }
    ] },
    { id: "w5", name: "Easy Run", type: "Cardio", dur: 40, rpe: 4, desc: "Conversational pace for aerobic capacity and approach fitness.", blocks: [
      { name: "Zone 2 run", sets: "1", reps: "1", work: "40 min", rest: "—", load: "HR < 145" }
    ] },
    { id: "w6", name: "Mobility Flow", type: "Mobility", dur: 30, rpe: 3, desc: "Hips for high steps and drop knees, shoulders for overhangs.", blocks: [
      { name: "Hip openers", sets: "2", reps: "5 / side", work: "45 s", rest: "—", load: "—" },
      { name: "Shoulder CARs", sets: "2", reps: "5", work: "—", rest: "—", load: "—" }
    ] },
    { id: "w7", name: "Gorge Day — Project", type: "Sport", dur: 240, rpe: 7, desc: "Outdoor redpoint day. Warm up, then three quality burns on the project.", blocks: [
      { name: "Warm-up routes", sets: "2", reps: "1", work: "—", rest: "15 min", load: "5.10–5.11" },
      { name: "Project burns", sets: "3", reps: "1", work: "—", rest: "30 min", load: "5.12d–5.13a" }
    ] },
    { id: "w8", name: "Trad Mileage", type: "Trad", dur: 240, rpe: 6, desc: "Moderate cracks and multi-pitch for gear placement practice and volume.", blocks: [
      { name: "Pitches", sets: "5", reps: "1", work: "—", rest: "—", load: "5.9–5.10" }
    ] },
    { id: "w9", name: "4×4 Circuits", type: "Bouldering", dur: 60, rpe: 9, desc: "Four problems back to back, four times. Choose submaximal problems.", blocks: [
      { name: "Warm-up", sets: "1", reps: "6 problems", work: "—", rest: "—", load: "V2–V4" },
      { name: "4×4 sets", sets: "4", reps: "4 problems", work: "—", rest: "4 min", load: "V4–V5" }
    ] }
  ];

  function dayDate(day) {
    const date = new Date(BASE_DATE);
    date.setDate(date.getDate() + Number(day));
    return date;
  }
  function analysisSummary(days) {
    const xKey = state.analysisX || "Motivation", yKey = state.analysisY || "Finger feel";
    const loadAt = (day, previous) => state.sessions.filter(x => x.day === day - (previous ? 1 : 0) && x.status === "done").reduce((sum, x) => sum + x.duration * x.rpe, 0);
    const read = (day, key) => {
      if (key === "Load · same day") return loadAt(day, false);
      if (key === "Load · previous day") return loadAt(day, true);
      const keyName = key === "Finger feel" ? "fingers" : key.toLowerCase();
      return state.checkins[day]?.[keyName] ?? 0;
    };
    const xs = days.map(day => read(day, xKey)), ys = days.map(day => read(day, yKey));
    const mx = xs.reduce((sum, x) => sum + x, 0) / Math.max(1, xs.length);
    const my = ys.reduce((sum, x) => sum + x, 0) / Math.max(1, ys.length);
    const numerator = xs.reduce((sum, x, i) => sum + (x - mx) * (ys[i] - my), 0);
    const xVar = xs.reduce((sum, x) => sum + (x - mx) ** 2, 0);
    const yVar = ys.reduce((sum, y) => sum + (y - my) ** 2, 0);
    const r = xs.length < 3 || !xVar || !yVar ? 0 : numerator / Math.sqrt(xVar * yVar);
    const magnitude = Math.abs(r);
    const strength = magnitude < .2 ? "No clear relationship" : `${magnitude < .4 ? "Weak" : magnitude < .6 ? "Moderate" : "Strong"} ${r > 0 ? "positive" : "negative"} relationship`;
    return `<div class="hint-card" style="margin-top:13px"><strong>r = ${r.toFixed(2)}</strong> · ${xKey === yKey ? "Choose two different signals to compare." : `${strength} across ${days.length} days.`}</div>`;
  }
  function dayISO(day) {
    const date = dayDate(day);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }
  function dayOffset(iso) {
    if (!iso) return TODAY;
    const [year, month, date] = iso.split("-").map(Number);
    return Math.round((new Date(year, month - 1, date) - BASE_DATE) / 86400000);
  }
  function shortDate(day) { return dayDate(day).toLocaleDateString("en-US", { month: "short", day: "numeric" }); }
  function longDate(day) { return dayDate(day).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }); }
  function weekday(day) { return dayDate(day).toLocaleDateString("en-US", { weekday: "short" }); }
  function cloneData(value) { return JSON.parse(JSON.stringify(value)); }
  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function uid(prefix) { return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`; }
  function seedState() {
    const sessions = [];
    const checks = {};
    const plan = [
      [0, "w3"], [1, "w1"], [2, "w4"], [3, "w5"], [4, "w6"], [5, "w7"], [6, "w8"],
      [7, "w3"], [8, "w1"], [10, "w4"], [11, "w5"], [12, "w2"], [13, "w6"],
      [14, "w3"], [15, "w1"], [17, "w4"], [18, "w5"], [19, "w7"], [20, "w8"],
      [21, "w3"], [22, "w1"], [24, "w4"], [25, "w5"], [26, "w2"], [27, "w6"],
      [28, "w1"], [29, "w3"], [31, "w4"], [32, "w5"], [33, "w2"], [34, "w6"],
      [35, "w1"], [36, "w3"], [38, "w4"], [39, "w5"], [40, "w2"], [41, "w6"],
      [42, "w1"], [43, "w3"], [45, "w4"], [46, "w1"], [47, "w1"], [48, "w2"], [50, "w7"], [52, "w6"],
      [54, "w3"], [56, "w1"], [58, "w7"], [61, "w2"], [63, "w3"], [66, "w7"], [68, "w1"]
    ];
    plan.forEach(([day, workoutId], i) => {
      const workout = workoutSeeds.find(x => x.id === workoutId);
      const status = day < TODAY ? (i % 9 === 2 ? "skipped" : "done") : "planned";
      sessions.push({
        id: `s${i + 1}`, day, workoutId, name: workout.name, type: workout.type,
        plannedDuration: workout.dur, plannedRpe: workout.rpe,
        duration: status === "done" ? workout.dur + (i % 3 ? 5 : -5) : workout.dur,
        rpe: status === "done" ? Math.min(10, Math.max(1, workout.rpe + (i % 3 - 1))) : workout.rpe,
        status, location: workout.type === "Sport" && day % 3 === 2 ? "Motherlode" : "", notes: ""
      });
    });
    for (let d = 0; d <= TODAY; d++) {
      const sleep = [7, 8, 7.5, 6.5, 8.5, 7, 7.5][d % 7];
      const loadYesterday = sessions.some(x => x.day === d - 1 && x.status === "done");
      // A calm, mostly green-light check-in history for the reference cycle.
      checks[d] = d === TODAY ? { motivation: 8, sleep: 7.5, fingers: 7 } :
        { motivation: loadYesterday ? 7 : 8, sleep, fingers: loadYesterday ? 7 : 8 };
    }
    return {
      page: "dashboard", sessions, workouts: cloneData(workoutSeeds), phases: INITIAL_PHASES.slice(), week: 6,
      selectedWorkout: "w1", selectedGoal: "g1", selectedTest: "t1", workoutFilter: "All", workoutQuery: "",
      range: 28, checkins: checks, measurements: [
        { day: 0, weight: 72.4, bodyFat: 13.8 }, { day: 14, weight: 71.8, bodyFat: 13.3 },
        { day: 28, weight: 71.2, bodyFat: 12.6 }, { day: 42, weight: 70.6, bodyFat: 12 },
        { day: TODAY, weight: 70.1, bodyFat: 11.6 }
      ],
      tests: [
        { id: "t1", name: "Max hang · 20 mm", category: "Finger strength", unit: "kg", direction: "Higher", frequency: 4,
          equipment: "20 mm edge, harness and plates", steps: ["Warm up for 15 minutes, including ramp-up hangs.", "Half-crimp a 7-second hang on the 20 mm edge.", "Add load each attempt; rest 3 minutes between.", "Record the heaviest clean hang (max 5 attempts)."],
          results: [{ day: 7, value: 15, note: "Smooth, no shoulder shift" }, { day: 28, value: 17, note: "Good recruitment" }, { day: 42, value: 18, note: "Felt strong, slept 8 h" }] },
        { id: "t2", name: "Weighted pull-up · 1RM", category: "Pulling", unit: "kg", direction: "Higher", frequency: 6,
          equipment: "Pull-up bar and dip belt", steps: ["Warm up with bodyweight and three ramp sets.", "Start from a dead hang; chin clears the bar.", "Add 2–5 kg per attempt with 3–4 minutes rest.", "Record the heaviest clean single."],
          results: [{ day: 13, value: 34, note: "" }, { day: 31, value: 36, note: "" }, { day: 45, value: 38, note: "Strong single" }] },
        { id: "t3", name: "Repeaters 7:3 to failure", category: "Endurance", unit: "reps", direction: "Higher", frequency: 6,
          equipment: "20 mm edge", steps: ["Bodyweight half-crimp on a 20 mm edge.", "Hang 7 seconds, rest 3 seconds, repeat.", "Count completed hangs until failure."],
          results: [{ day: 10, value: 28, note: "" }, { day: 32, value: 31, note: "" }, { day: 45, value: 33, note: "" }] },
        { id: "t4", name: "Pancake reach", category: "Mobility", unit: "cm", direction: "Higher", frequency: 8,
          equipment: "Floor and tape measure", steps: ["Sit in a wide straddle, knees locked.", "Fold forward and reach as far as possible.", "Measure from hip line to fingertips."],
          results: [{ day: 10, value: 21, note: "" }, { day: 31, value: 23, note: "" }, { day: 43, value: 25, note: "" }] }
      ],
      goals: [
        { id: "g1", title: "Redpoint 5.13a", category: "Grade", scale: "YDS", start: 9, target: 12, current: 11, unit: "", startDay: 0, deadline: 59, note: "Fall project at the Motherlode. The Perform block lines up with late-October temps.", milestones: [{ text: "Send a 5.12c at the Gorge", done: true }, { text: "Send a 5.12d", done: true }, { text: "Link the project in two overlaps", done: false }, { text: "One-hang the project", done: false }] },
        { id: "g2", title: "Max hang +22 kg", category: "Strength", scale: "", start: 10, target: 22, current: 18, unit: "kg", startDay: 24, deadline: 83, note: "20 mm half-crimp, 7 seconds. Keep the final rep clean.", testId: "t1", milestones: [{ text: "+15 kg", done: true }, { text: "+18 kg", done: true }, { text: "+20 kg", done: false }] },
        { id: "g3", title: "60 outdoor days", category: "Volume", scale: "", start: 0, target: 60, current: 44, unit: "days", startDay: 0, deadline: 83, note: "Any day with at least three routes or two hours of outside climbing.", milestones: [{ text: "Spring season: 20 days", done: true }, { text: "Fall season: 25 days", done: false }] },
        { id: "g4", title: "Flash V6", category: "Grade", scale: "V", start: 4, target: 6, current: 6, unit: "", startDay: 0, deadline: 48, note: "Outdoor flash, any area.", milestones: [{ text: "Flash V5", done: true }, { text: "Flash V6", done: true }] }
      ]
    };
  }

  let state;
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    state = saved && saved.version === 1 && saved.data ? saved.data : seedState();
  } catch {
    state = seedState();
  }
  function persist() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, data: state })); }
    catch { toast("Could not save changes in this browser."); }
  }
  function toast(message) {
    const node = document.getElementById("toast");
    node.textContent = message;
    node.classList.add("show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => node.classList.remove("show"), 2300);
  }
  function getWorkout(id) { return state.workouts.find(x => x.id === id); }
  function sessionsInWeek(week) { return state.sessions.filter(x => Math.floor(x.day / 7) === week); }
  function loadStats(week) {
    const sessions = sessionsInWeek(week);
    return {
      planned: sessions.reduce((sum, x) => sum + (x.plannedDuration || x.duration) * (x.plannedRpe || x.rpe), 0),
      done: sessions.filter(x => x.status === "done").reduce((sum, x) => sum + x.duration * x.rpe, 0),
      count: sessions.length, completed: sessions.filter(x => x.status === "done").length
    };
  }
  function fmt(value) { return Math.round(value).toLocaleString("en-US"); }
  function goalProgress(goal) { return Math.max(0, Math.min(1, (goal.current - goal.start) / Math.max(1, goal.target - goal.start))); }
  function goalValue(goal, value) {
    if (goal.category === "Grade") return (goal.scale === "V" ? V_GRADES : YDS)[Math.round(value)] || "—";
    return `${goal.unit === "kg" ? "+" : ""}${value}${goal.unit ? ` ${esc(goal.unit)}` : ""}`;
  }
  function phaseFor(week) { return state.phases[week] || "Power"; }
  function navButton(page, icon, label) {
    return `<button class="nav-item ${state.page === page ? "active" : ""}" data-page="${page}"><span class="nav-icon">${icon}</span>${label}</button>`;
  }
  function pageHeader(kicker, title, subtitle, actions = "") {
    return `<div class="topline"><div><div class="overline">${kicker}</div><h1>${title}</h1>${subtitle ? `<p class="subtitle">${subtitle}</p>` : ""}</div><div class="actions">${actions}</div></div>`;
  }
  function button(label, action, style = "", extra = "") {
    return `<button type="button" class="button ${style}" data-action="${action}" ${extra}>${label}</button>`;
  }
  function cardHead(kicker, title, trailing = "") {
    return `<div class="card-head"><div>${kicker ? `<p class="card-kicker">${kicker}</p>` : ""}<h2 class="card-title">${title}</h2></div>${trailing}</div>`;
  }
  function metricStat(label, value, sub, page) {
    return `<div class="stat" data-page="${page}"><div class="stat-label">${label}</div><div class="stat-value">${value}</div><div class="stat-sub">${sub}</div></div>`;
  }
  function sessionMeta(session) {
    return `${session.duration} min · RPE ${session.rpe}${session.location ? ` · ${esc(session.location)}` : ""}`;
  }
  function sessionRows(sessions, compact = false) {
    return sessions.map(session => `<div class="session-row" data-action="edit-session" data-id="${session.id}">
      <div class="session-day">${weekday(session.day)} ${dayDate(session.day).getDate()}</div>
      <div class="session-mark" style="background:${TYPE_COLORS[session.type] || "#897a6b"}"></div>
      <div><p class="session-name">${esc(session.name)}</p><p class="session-meta">${sessionMeta(session)}</p></div>
      ${compact ? "" : `<div class="session-status">${session.status === "done" ? "Done" : session.status === "skipped" ? "Skipped" : "Planned"}</div>`}
    </div>`).join("");
  }
  function loadBars() {
    const stats = Array.from({ length: 12 }, (_, i) => loadStats(i));
    const max = Math.max(1, ...stats.map(x => Math.max(x.planned, x.done)));
    return `<div class="load-chart">${stats.map((item, i) => `<div class="load-column ${i === 6 ? "current" : ""}" data-page="planner" data-week="${i}" title="Week ${i + 1}: ${fmt(item.done)} / ${fmt(item.planned)} AU">
      <div class="load-bars"><i class="load-bar done" style="height:${Math.max(2, item.done / max * 100)}%"></i><i class="load-bar" style="height:${Math.max(2, item.planned / max * 100)}%"></i></div><span>W${i + 1}</span></div>`).join("")}</div>`;
  }
  function miniGoal(goal) {
    const progress = goalProgress(goal);
    return `<div class="goal-mini" data-page="goals" data-id="${goal.id}"><div class="goal-mini-top"><strong>${esc(goal.title)}</strong><small>${Math.round(progress * 100)}%</small></div><div class="progress"><span style="width:${progress * 100}%"></span></div><small>${goalValue(goal, goal.current)} now · due ${shortDate(goal.deadline)}</small></div>`;
  }
  function latestResults() {
    return state.tests.flatMap(test => test.results.map((result, index) => ({ test, result, previous: test.results[index - 1] })))
      .sort((a, b) => b.result.day - a.result.day).slice(0, 3);
  }
  function dashboard() {
    const current = state.sessions.filter(x => x.day === TODAY && x.status === "planned");
    const todays = current[0];
    const past = state.sessions.filter(x => x.day < TODAY || (x.day === TODAY && x.status !== "planned"));
    const complete = past.filter(x => x.status === "done").length;
    const week = loadStats(6);
    const readiness = state.checkins[TODAY] || { motivation: 8, sleep: 7.5, fingers: 7 };
    const readyGood = readiness.fingers >= 7 && readiness.sleep >= 7 && readiness.motivation >= 6;
    const readyBad = readiness.fingers <= 5 || readiness.sleep < 6;
    const readyNote = readyGood ? "Fresh fingers, good sleep. Green light for max hangs." :
      readyBad ? "Fingers or sleep are down. Keep today easy and trim the load." : "Moderate readiness. Keep intensity and trim a set if needed.";
    const nextSessions = state.sessions.filter(x => x.day > TODAY && x.status === "planned").sort((a, b) => a.day - b.day).slice(0, 4);
    const activeGoals = state.goals.filter(g => goalProgress(g) < 1).slice(0, 3);
    const pyramid = [
      ["5.12d", 1], ["5.12c", 2], ["5.12b", 4], ["5.12a", 7], ["5.11d", 11], ["V7", 1], ["V6", 3]
    ];
    const peak = 11;
    return `${pageHeader("Friday, October 2 · Fall send cycle", "Good morning, Avery", "Week 7 of 12 · Red River Gorge · Power phase",
      `${button("↗ Log a test", "new-result", "")}${button('<span class="plus">+</span> Log session', "new-session", "primary")}`)}
      <div class="grid dashboard-grid">
        <section>
          <div class="card hero-card"><div class="hero-inner"><div>
            <p class="card-kicker">The fall send cycle, week seven</p><h2 class="card-title">A little more power.<br>Then let it go outside.</h2>
            <p class="card-copy">Avery Lane · Self-coached · Red River Gorge</p>
          </div><div class="hero-session"><p class="card-kicker">Today's session · Power phase</p>
            <p class="hero-session-name">${todays ? esc(todays.name) : "A recovery day"}</p>
            <p class="hero-session-meta">${todays ? sessionMeta(todays) : "Nothing on the calendar today."}</p>
            ${todays ? button("Mark done", `complete-session`, "small", `data-id="${todays.id}"`) : button("Plan a session", "new-session", "small")}
          </div></div></div>
          <div class="card card-pad">
            <div class="card-head"><div><p class="card-kicker">Cycle progress</p><h2 class="card-title">Training, with a little intention.</h2></div><span class="status-badge">Wk 7 / 12</span></div>
            <div class="stat-row">
              ${metricStat("This week", `${fmt(week.done)}`, `of ${fmt(week.planned)} AU planned`, "metrics")}
              ${metricStat("Adherence", `${Math.round(complete / Math.max(1, past.length) * 100)}%`, `${complete} of ${past.length} sessions`, "planner")}
              ${metricStat("Max hang · 20 mm", "+18 kg", "129% bodyweight", "tests")}
              ${metricStat("Outdoor days", "44", "of 60 for 2026", "goals")}
            </div>
          </div>
          <div class="section-heading"><div><h2>Up next</h2><p>A few good days on the calendar</p></div><button class="text-link" data-page="planner">Open planner →</button></div>
          <div class="card card-pad"><div class="upcoming-list">${nextSessions.length ? sessionRows(nextSessions) : `<div class="empty-state">No upcoming sessions. Build your week in Planner.</div>`}</div></div>
        </section>
        <section class="grid" style="align-content:start">
          <div class="card readiness card-pad">
            ${cardHead("Readiness · checked in 7:12 am", "Today's green light", button("Edit", "checkin", "quiet small"))}
            <div class="readiness-top"><div class="readiness-score"><strong>${readiness.motivation}</strong><span>/ 10 motivation</span></div><span class="status-badge ${readyBad ? "rust" : readyGood ? "" : "gold"}">${readyBad ? "Take it easy" : readyGood ? "Ready to train" : "Build into it"}</span></div>
            <p class="readiness-note">${readyNote}</p>
            <div class="readiness-tiles"><div><span>Sleep</span><strong>${readiness.sleep} h</strong></div><div><span>Finger feel</span><strong>${readiness.fingers}/10</strong></div><div><span>Cycle week</span><strong>07 / 12</strong></div></div>
          </div>
          <div class="card card-pad">
            ${cardHead("Training load", "Completed vs. planned", `<div class="legend"><span><i></i>Done</span><span><i class="planned"></i>Plan</span></div>`)}
            ${loadBars()}<div class="footer-note">LOAD IN AU · MINUTES × SESSION RPE</div>
          </div>
          <div class="card card-pad">${cardHead("Goals", "What we're working toward", `<button class="text-link" data-page="goals">All goals →</button>`)}
            ${activeGoals.length ? activeGoals.map(miniGoal).join("") : `<div class="empty-state">All goals complete — set a new one.</div>`}
          </div>
          <div class="card card-pad">${cardHead("Recent tests", "Small signs of progress", `<button class="text-link" data-page="tests">All tests →</button>`)}
            ${latestResults().map(({ test, result, previous }) => `<div class="recent-test" data-page="tests" data-id="${test.id}"><strong>${esc(test.name)}</strong><small>${shortDate(result.day)} · ${previous ? (result.value >= previous.value ? "▲ " : "▼ ") + Math.abs(result.value - previous.value) + " " + test.unit : "First result"}</small><b>${result.value} ${test.unit}</b></div>`).join("")}
          </div>
          <div class="card card-pad">${cardHead("Send pyramid · 2026", "A season in the making", `<span class="eyebrow">YDS + V</span>`)}
            <div class="pyramid">${pyramid.map(([grade, count]) => `<div class="pyramid-item"><div class="pyramid-bar" style="height:${Math.max(7, count / peak * 60)}px"></div><strong>${grade}</strong><small>${count}×</small></div>`).join("")}</div>
          </div>
        </section>
      </div>`;
  }
  function planner() {
    const week = state.week;
    const stats = loadStats(week);
    const weekSessions = sessionsInWeek(week).sort((a, b) => a.day - b.day);
    const minutes = {};
    weekSessions.filter(x => x.status !== "skipped").forEach(x => minutes[x.type] = (minutes[x.type] || 0) + x.duration);
    const maxMinutes = Math.max(1, ...Object.values(minutes));
    const days = Array.from({ length: 7 }, (_, index) => week * 7 + index);
    return `${pageHeader("Fall send cycle · Aug 17 – Nov 8 · 12 weeks", "Planner", "A plan is a hypothesis. Adjust it to the climber in front of you.",
      `      ${button("This week", "this-week", "")}${button('<span class="plus">+</span> Add session', "new-session", "primary", `data-day="${Math.max(TODAY, state.week * 7)}"`)}`)}
      <div class="planner-week-strip">${Array.from({ length: 12 }, (_, index) => {
        const item = loadStats(index);
        return `<button class="week-chip ${week === index ? "active" : ""}" data-week="${index}"><strong>W${String(index + 1).padStart(2, "0")}</strong><small>${phaseFor(index)}</small><i><span style="width:${item.planned ? Math.min(100, item.done / item.planned * 100) : 0}%"></span></i></button>`;
      }).join("")}</div>
      <div class="split-grid"><section>
        <div class="section-heading" style="margin-top:0"><div><h2>Week ${week + 1} <span style="color:var(--muted);font-size:15px">${shortDate(week * 7)} – ${shortDate(week * 7 + 6)}</span></h2><p>${phaseFor(week)} phase · ${stats.completed}/${stats.count} sessions complete</p></div><div class="actions">${button("‹", "prev-week", "small")}${button("›", "next-week", "small")}</div></div>
        <div class="days-grid">${days.map(day => {
          const inDay = state.sessions.filter(x => x.day === day).sort((a, b) => a.status === "planned" ? 1 : -1);
          return `<div class="day-column ${day === TODAY ? "today" : ""}"><p class="day-label">${weekday(day)}${day === TODAY ? " · today" : ""}</p><p class="day-date">${dayDate(day).getDate()}</p>
            ${inDay.map(session => `<div class="day-session" data-action="edit-session" data-id="${session.id}" style="border-left-color:${TYPE_COLORS[session.type] || "#897a6b"}"><strong>${esc(session.name)}</strong><small>${session.status === "done" ? "Done" : session.status === "skipped" ? "Skipped" : "Planned"} · ${session.duration}m · RPE ${session.rpe}</small></div>`).join("")}
            <button class="day-add" data-action="new-session" data-day="${day}">+ Add</button>
          </div>`;
        }).join("")}</div>
        <div class="card card-pad phase-box"><div class="card-head"><div><p class="card-kicker">Week phase</p><h2 class="card-title">Choose the focus</h2></div><select class="select" data-change="phase" aria-label="Training phase">${Object.keys(PHASES).map(p => `<option ${p === phaseFor(week) ? "selected" : ""}>${p}</option>`).join("")}</select></div>
          <p class="phase-copy">${PHASES[phaseFor(week)]}</p>
          ${button("Fill remaining days from phase template", "apply-template", "small")}
        </div>
      </section><aside class="grid" style="align-content:start">
        <div class="card card-pad">${cardHead("Week at a glance", "Load & rhythm")}
          <div class="summary-stack"><div class="summary-item"><span>Planned load</span><strong>${fmt(stats.planned)} AU</strong></div><div class="summary-item"><span>Completed</span><strong>${fmt(stats.done)} AU</strong></div><div class="summary-item"><span>Sessions done</span><strong>${stats.completed} / ${stats.count}</strong></div><div class="summary-item"><span>Phase</span><strong>${phaseFor(week)}</strong></div></div>
        </div>
        <div class="card card-pad">${cardHead("Minutes by type", "Training mix")}
          ${Object.keys(minutes).length ? Object.entries(minutes).sort((a, b) => b[1] - a[1]).map(([type, duration]) => `<div class="mix-row"><span>${type}</span><div class="mix-track"><span style="width:${duration / maxMinutes * 100}%;background:${TYPE_COLORS[type]}"></span></div><strong>${duration}m</strong></div>`).join("") : `<div class="empty-state">No sessions planned yet.</div>`}
        </div>
      </aside></div>`;
  }
  function workoutCard(workout) {
    return `<button class="list-card ${state.selectedWorkout === workout.id ? "selected" : ""}" data-workout="${workout.id}">
      <strong>${esc(workout.name)}</strong><small>${workout.type} · ${workout.dur} min · RPE ${workout.rpe} · ${workout.blocks.length} blocks</small>
      <div class="list-card-foot"><span>${state.sessions.filter(x => x.workoutId === workout.id).length} planned</span><span>Open →</span></div>
    </button>`;
  }
  function workouts() {
    const matching = state.workouts.filter(workout =>
      (state.workoutFilter === "All" || workout.type === state.workoutFilter) &&
      workout.name.toLowerCase().includes(state.workoutQuery.toLowerCase())
    );
    const selected = getWorkout(state.selectedWorkout);
    return `${pageHeader("Build your session library", "Workouts", "Protocols built for this cycle, ready to adjust or put on the calendar.",
      button('<span class="plus">+</span> New workout', "new-workout", "primary"))}
      <div class="collection-layout"><section class="card card-pad">
        <div class="search-wrap"><input class="field" data-input="workout-search" value="${esc(state.workoutQuery)}" placeholder="Search workouts…" aria-label="Search workouts"></div>
        <div class="filter-pills">${["All", ...TYPES].map(type => `<button class="pill ${state.workoutFilter === type ? "active" : ""}" data-filter="${type}">${type}</button>`).join("")}</div>
        <p class="card-kicker">${matching.length} PROTOCOL${matching.length === 1 ? "" : "S"}</p>
        <div class="collection-list">${matching.map(workoutCard).join("") || `<div class="empty-state">No workouts match this filter.</div>`}</div>
      </section>
      <section>${selected ? workoutEditor(selected) : `<div class="card empty-state">Create a workout to get started.</div>`}</section></div>`;
  }
  function workoutEditor(workout) {
    return `<form class="card editor-card" data-form="workout-editor" data-id="${workout.id}">
      <div class="editor-head"><div><p class="card-kicker">Workout protocol</p><h2 class="card-title">${esc(workout.name)}</h2><p class="subtitle">Estimated load · ${fmt(workout.dur * workout.rpe)} AU</p></div>
        <div class="editor-actions">${button("Duplicate", "duplicate-workout", "small")}${button("Delete", "delete-workout", "quiet small danger")}</div></div>
      <div class="editor-body"><div class="form-grid">
        <label class="field-label">Workout name<input class="field" name="name" required value="${esc(workout.name)}"></label>
        <label class="field-label">Type<select class="select" name="type">${TYPES.map(x => `<option ${x === workout.type ? "selected" : ""}>${x}</option>`).join("")}</select></label>
        <label class="field-label">Duration (min)<input class="field" type="number" min="1" name="duration" value="${workout.dur}" required></label>
        <label class="field-label">Target RPE · ${workout.rpe}<input class="field" type="range" name="rpe" min="1" max="10" value="${workout.rpe}"></label>
        <label class="field-label full">Notes & intent<textarea class="textarea" name="description">${esc(workout.desc || "")}</textarea></label>
      </div>
      <div class="block-head"><span>#</span><span>Block</span><span>Sets</span><span>Reps</span><span>Work</span><span>Rest</span><span>Load / grade</span><span></span></div>
      <div class="blocks-editor">${workout.blocks.map((block, index) => `<div class="block-row" data-block-row="${index}">
        <span class="block-number">${String(index + 1).padStart(2, "0")}</span><input class="field" data-block="name" value="${esc(block.name)}" aria-label="Block name">
        <input class="field" data-block="sets" value="${esc(block.sets)}" aria-label="Sets"><input class="field" data-block="reps" value="${esc(block.reps)}" aria-label="Reps">
        <input class="field" data-block="work" value="${esc(block.work)}" aria-label="Work"><input class="field" data-block="rest" value="${esc(block.rest)}" aria-label="Rest">
        <input class="field" data-block="load" value="${esc(block.load)}" aria-label="Load or grade"><button type="button" class="icon-button" data-action="remove-block" data-index="${index}" aria-label="Remove block">×</button>
      </div>`).join("")}</div>
      <button type="button" class="button small" style="margin-top:11px" data-action="add-block"><span class="plus">+</span> Add block</button>
      </div><div class="editor-footer"><button type="button" class="button small" data-action="schedule-workout">Add to plan</button><button class="button primary small" type="submit">Save workout</button></div>
    </form>`;
  }
  function syncWorkoutEditor(form) {
    const workout = getWorkout(form?.dataset.id);
    if (!workout) return null;
    const data = new FormData(form);
    workout.name = String(data.get("name")).trim();
    workout.type = data.get("type");
    workout.dur = Math.max(1, Number(data.get("duration")) || 1);
    workout.rpe = Math.min(10, Math.max(1, Number(data.get("rpe")) || 1));
    workout.desc = String(data.get("description") || "");
    workout.blocks = [...form.querySelectorAll("[data-block-row]")].map(row =>
      Object.fromEntries([...row.querySelectorAll("[data-block]")].map(input => [input.dataset.block, input.value]))
    );
    return workout;
  }
  function metricKpi(label, value, sub, color = "var(--ink)") {
    return `<div class="metric-kpi"><small>${label}</small><strong style="color:${color}">${value}</strong><span>${sub}</span></div>`;
  }
  function lineChart(values, color = "var(--rust)") {
    if (!values.length) return `<div class="empty-state">No data to chart yet.</div>`;
    const min = Math.min(...values), max = Math.max(...values), spread = max - min || 1;
    const points = values.map((value, i) => `${12 + (values.length === 1 ? 50 : i / (values.length - 1) * 276)},${125 - (value - min) / spread * 94}`).join(" ");
    return `<svg class="chart" viewBox="0 0 300 145" role="img" aria-label="Trend chart">
      <line class="chart-grid" x1="8" y1="30" x2="292" y2="30"/><line class="chart-grid" x1="8" y1="76" x2="292" y2="76"/><line class="chart-grid" x1="8" y1="122" x2="292" y2="122"/>
      <polyline points="${points}" fill="none" stroke="${color}" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round"/>
      ${values.map((value, i) => { const [x, y] = points.split(" ")[i].split(","); return `<circle cx="${x}" cy="${y}" r="3" fill="#fbf8f3" stroke="${color}" stroke-width="2"><title>${value}</title></circle>`; }).join("")}
    </svg>`;
  }
  function metrics() {
    const from = Math.max(0, TODAY - state.range + 1);
    const checkDays = Object.keys(state.checkins).map(Number).filter(d => d >= from && d <= TODAY).sort((a, b) => a - b);
    const completed = state.sessions.filter(x => x.day >= from && x.day <= TODAY && x.status === "done");
    const weeklyLoad = Array.from({ length: 12 }, (_, week) => loadStats(week));
    const acute = state.sessions.filter(x => x.day >= TODAY - 6 && x.day <= TODAY && x.status === "done").reduce((sum, x) => sum + x.duration * x.rpe, 0);
    const chronic = state.sessions.filter(x => x.day >= TODAY - 27 && x.day <= TODAY && x.status === "done").reduce((sum, x) => sum + x.duration * x.rpe, 0) / 4;
    const ratio = chronic ? acute / chronic : 0;
    const avg = key => checkDays.length ? (checkDays.reduce((sum, day) => sum + state.checkins[day][key], 0) / checkDays.length).toFixed(1) : "—";
    const recentWeeks = weeklyLoad.slice(0, 9);
    const body = state.measurements.slice().sort((a, b) => a.day - b.day);
    const latestBody = body[body.length - 1] || { weight: 70.1, bodyFat: 11.6 };
    const latestHang = state.tests.find(x => x.id === "t1")?.results.at(-1);
    return `${pageHeader("Load · strength · body · wellness", "Metrics", "The patterns behind the projects — training, recovery, and the human bits.",
      `<div class="segmented">${[[14, "14 days"], [28, "28 days"], [47, "Cycle"]].map(([n, label]) => `<button class="segment ${state.range === n ? "active" : ""}" data-range="${n}">${label}</button>`).join("")}</div>`)}
      <div class="metric-kpis">${metricKpi("Acute load · 7d", fmt(acute), "AU · minutes × session RPE")}${metricKpi("Acute : chronic", ratio.toFixed(2), ratio > 1.3 ? "Above 1.3 · load spike" : ratio < .8 ? "Below 0.8 · light load" : "Inside the 0.8–1.3 range", ratio > 1.3 ? "var(--rust)" : "var(--green)")}${metricKpi("Sessions completed", completed.length, `last ${checkDays.length} days`)}${metricKpi("Average session RPE", completed.length ? (completed.reduce((s, x) => s + x.rpe, 0) / completed.length).toFixed(1) : "—", "in selected range")}</div>
      <div class="split-grid"><section class="grid" style="align-content:start">
        <div class="card card-pad">${cardHead("Build · recovery · perform", "Weekly training load", `<div class="segmented"><button class="segment active" disabled>Total</button></div>`)}
          ${loadBars()}<div class="legend"><span><i></i>Completed</span><span><i class="planned"></i>Planned</span></div>
          <p class="footer-note">A training-load estimate: session minutes × session RPE. Not a prescription.</p>
        </div>
        <div class="card card-pad">${cardHead("Consistency", "A good month is built quietly")}
          <div class="heatmap">${Array.from({ length: 84 }, (_, d) => {
            const session = state.sessions.find(x => x.day === d && x.status === "done");
            return `<i class="heat-cell ${session ? (session.duration * session.rpe > 400 ? "active" : "medium") : ""}" title="${longDate(d)}${session ? ` · ${session.duration * session.rpe} AU` : ""}"></i>`;
          }).join("")}</div><div class="chart-labels" style="margin-top:7px"><span>Aug 17</span><span>Less</span><span>More</span><span>Nov 8</span></div>
          <div class="stat-row" style="margin-top:10px"><div class="stat"><div class="stat-label">Current streak</div><div class="stat-value">3 wk</div><div class="stat-sub">≥ 80% adherence</div></div><div class="stat"><div class="stat-label">Best streak</div><div class="stat-value">5 wk</div><div class="stat-sub">this cycle</div></div></div>
        </div>
        <div class="card card-pad">${cardHead("Finger strength", "Max hang · 20 mm", `<button class="text-link" data-page="tests">Open test →</button>`)}
          ${lineChart(state.tests.find(x => x.id === "t1")?.results.map(x => x.value) || [])}<div class="chart-labels"><span>Aug</span><span>Sep</span><span>Oct</span></div>
          <div class="goal-stat-grid"><div class="mini-stat"><small>Max hang</small><strong>+${latestHang?.value ?? "—"} kg</strong></div><div class="mini-stat"><small>Bodyweight</small><strong>129%</strong></div><div class="mini-stat"><small>Repeaters</small><strong>${state.tests.find(x => x.id === "t3")?.results.at(-1)?.value ?? "—"} reps</strong></div></div>
        </div>
      </section><section class="grid" style="align-content:start">
        <div class="card card-pad">${cardHead("Body composition", "Measure what matters")}
          ${lineChart(body.map(x => x.weight))}
          <div class="goal-stat-grid"><div class="mini-stat"><small>Weight</small><strong>${latestBody.weight} kg</strong></div><div class="mini-stat"><small>Body fat</small><strong>${latestBody.bodyFat}%</strong></div><div class="mini-stat"><small>Lean mass</small><strong>${(latestBody.weight * (1 - latestBody.bodyFat / 100)).toFixed(1)} kg</strong></div></div>
          <form class="body-log" data-form="measurement"><label class="field-label">Weight<input name="weight" class="field" type="number" min="30" max="250" step=".1" placeholder="kg" required></label><label class="field-label">Body fat<input name="bodyFat" class="field" type="number" min="1" max="60" step=".1" placeholder="%" required></label><button class="button small" type="submit">+ Add</button></form>
        </div>
        <div class="card card-pad">${cardHead("Wellness", "Daily check-ins", button("Check in", "checkin", "small"))}
          <div class="wellness-list">${[["Motivation", "motivation", "#ad4d2d"], ["Sleep", "sleep", "#547188"], ["Finger feel", "fingers", "#3f6b4f"]].map(([label, key, color]) => `<div class="wellness-row"><span>${label}</span><div class="mix-track"><span style="width:${Number(avg(key)) * 10}%;background:${color}"></span></div><strong>${avg(key)}${key === "sleep" ? "h" : ""}</strong></div>`).join("")}</div>
          <p class="footer-note">${checkDays.length} check-ins · selected range</p>
        </div>
        <div class="card card-pad">${cardHead("Analysis", "Two signals, one question")}
          <p class="subtitle" style="margin:0 0 15px">Wellness scores and training load, side by side for a conversation — not a diagnosis.</p>
          <div class="form-grid"><label class="field-label">X axis<select class="select" data-change="analysis-x">${["Motivation", "Sleep", "Finger feel", "Load · same day"].map(x => `<option ${x === (state.analysisX || "Motivation") ? "selected" : ""}>${x}</option>`).join("")}</select></label><label class="field-label">Y axis<select class="select" data-change="analysis-y">${["Finger feel", "Motivation", "Sleep", "Load · previous day"].map(x => `<option ${x === (state.analysisY || "Finger feel") ? "selected" : ""}>${x}</option>`).join("")}</select></label></div>
          ${analysisSummary(checkDays)}
          <div class="hint-card" style="margin-top:13px">Check-in trends are for reflection, not medical advice. Sleep and finger feel can be useful prompts for modifying a session.</div>
        </div>
      </section></div>`;
  }
  function goalStatus(goal) {
    const progress = goalProgress(goal);
    if (progress >= 1) return ["Complete", "status-badge"];
    const elapsed = Math.max(.01, Math.min(1, (TODAY - goal.startDay) / Math.max(1, goal.deadline - goal.startDay)));
    const pace = progress / elapsed;
    return pace >= .95 ? ["On track", "status-badge"] : pace >= .8 ? ["Slightly behind", "status-badge gold"] : ["Behind", "status-badge rust"];
  }
  function goals() {
    const active = state.goals.filter(g => goalProgress(g) < 1).length;
    const selected = state.goals.find(x => x.id === state.selectedGoal) || state.goals[0];
    const status = selected ? goalStatus(selected) : ["", ""];
    const done = selected?.milestones.filter(x => x.done).length || 0;
    return `${pageHeader("2026 season · intention in motion", "Goals", "Keep the big dream visible. Make the next step small enough to do.",
      button('<span class="plus">+</span> New goal', "new-goal", "primary"))}
      <div class="metric-kpis">${metricKpi("Active", active, "on the board")}${metricKpi("On track", state.goals.filter(g => goalStatus(g)[0] === "On track").length, "moving at expected pace", "var(--green)")}${metricKpi("Needs a look", state.goals.filter(g => goalStatus(g)[0] === "Behind").length, "consider adjusting the plan", "var(--gold)")}${metricKpi("Completed", state.goals.length - active, "worth celebrating", "var(--blue)")}</div>
      ${state.goals.length ? `<div class="collection-layout"><section class="collection-list">${state.goals.map(g => {
        const [label, klass] = goalStatus(g), progress = goalProgress(g);
        return `<div class="card goal-card ${selected?.id === g.id ? "selected" : ""}" data-goal="${g.id}"><div class="card-pad"><div class="goal-top"><span class="tag">${g.category}</span><span class="${klass}">${label}</span></div><h3>${esc(g.title)}</h3><div class="goal-values"><span>${goalValue(g, g.current)}</span><span>Target ${goalValue(g, g.target)}</span></div><div class="progress"><span style="width:${progress * 100}%"></span></div><div class="goal-values"><span>${Math.round(progress * 100)}% complete</span><span>${shortDate(g.deadline)}</span></div></div></div>`;
      }).join("")}</section>${selected ? goalDetail(selected, status, done) : ""}</div>` : `<div class="card empty-state">No goals yet. Give this training cycle a direction.</div>`}`;
  }
  function goalDetail(goal, status, done) {
    return `<section class="card card-pad"><div class="card-head"><div><p class="card-kicker">${goal.category} · ${status[0]}</p><h2 class="goal-detail-title">${esc(goal.title)}</h2></div>${button("Edit", "edit-goal", "small")}</div>
      <p class="subtitle">${esc(goal.note || "A goal without a note is still a good place to begin.")}</p>
      <div class="goal-stat-grid"><div class="mini-stat"><small>Start</small><strong>${goalValue(goal, goal.start)}</strong></div><div class="mini-stat"><small>Now</small><strong>${goalValue(goal, goal.current)}</strong></div><div class="mini-stat"><small>Deadline</small><strong>${shortDate(goal.deadline)}</strong></div></div>
      ${lineChart([goal.start, goal.current, goal.target])}<div class="chart-labels"><span>Start · ${shortDate(goal.startDay)}</span><span>Target · ${shortDate(goal.deadline)}</span></div>
      ${goal.testId ? `<p class="footer-note">Progress is linked to ${esc(state.tests.find(x => x.id === goal.testId)?.name || "a test protocol")}.</p>` : ""}
      <form class="inline-form" data-form="goal-progress" data-id="${goal.id}">${goal.category === "Grade" ? `<select class="select" name="progress">${(goal.scale === "V" ? V_GRADES : YDS).map((grade, i) => `<option value="${esc(grade)}" ${i === goal.current ? "selected" : ""}>${grade}</option>`).join("")}</select>` : `<input class="field" type="number" step="any" name="progress" placeholder="Update current progress" value="${goal.current}" required>`}<button class="button small primary" type="submit">Update</button></form>
      <div class="section-heading" style="margin:22px 0 7px"><div><h2 style="font-size:18px">Milestones</h2><p>${done} of ${goal.milestones.length} complete</p></div></div>
      ${goal.milestones.map((m, index) => `<label class="milestone ${m.done ? "done" : ""}"><input type="checkbox" data-milestone="${index}" ${m.done ? "checked" : ""}><span>${esc(m.text)}</span></label>`).join("") || `<p class="field-help">Add a small stepping stone for this goal.</p>`}
      <form class="inline-form" data-form="milestone" data-id="${goal.id}"><input class="field" name="milestone" placeholder="Add a milestone…" required><button class="button small" type="submit">Add</button></form>
      <div class="editor-footer" style="padding-inline:0;margin-top:12px"><span></span>${button("Delete goal", "delete-goal", "quiet small danger")}</div>
    </section>`;
  }
  function testNextDue(test) {
    const latest = test.results.at(-1);
    return latest ? latest.day + test.frequency * 7 : TODAY;
  }
  function tests() {
    const selected = state.tests.find(x => x.id === state.selectedTest) || state.tests[0];
    const overdue = state.tests.filter(test => testNextDue(test) < TODAY).length;
    return `${pageHeader(`${state.tests.length} protocols · ${overdue ? `${overdue} overdue` : "all current"}`, "Tests", "Repeatable benchmarks, useful protocols, and the small wins between sends.",
      button('<span class="plus">+</span> New protocol', "new-test", "primary"))}
      ${state.tests.length ? `<div class="collection-layout"><section class="collection-list">${state.tests.map(test => {
        const latest = test.results.at(-1), first = test.results[0];
        const due = testNextDue(test) - TODAY;
        const dueLabel = due < 0 ? `Overdue by ${-due} d` : due === 0 ? "Due today" : `Next test in ${due} d`;
        return `<button class="list-card ${selected?.id === test.id ? "selected" : ""}" data-test="${test.id}"><strong>${esc(test.name)}</strong><small>${esc(test.category)} · ${latest ? `${latest.value} ${esc(test.unit)}` : "No results"}${latest && first && latest !== first ? ` · +${(latest.value - first.value).toFixed(1)} since start` : ""}</small><div class="list-card-foot"><span>${test.frequency} week retest</span><span>${dueLabel}</span></div></button>`;
      }).join("")}</section>${selected ? testDetail(selected) : ""}</div>` : `<div class="card empty-state">No test protocols yet. Create a repeatable benchmark.</div>`}`;
  }
  function testDetail(test) {
    const latest = test.results.at(-1);
    const best = test.results.length ? (test.direction === "Lower" ? Math.min(...test.results.map(x => x.value)) : Math.max(...test.results.map(x => x.value))) : null;
    const due = testNextDue(test);
    return `<section class="card card-pad"><div class="card-head"><div><p class="card-kicker">${esc(test.category)} · every ${test.frequency} weeks</p><h2 class="card-title">${esc(test.name)}</h2></div><div class="editor-actions">${button("Edit protocol", "edit-test", "small")}${button("Log result", "new-result", "primary small")}</div></div>
      <div class="test-stat-grid"><div class="mini-stat"><small>Latest</small><strong>${latest ? `${latest.value} ${esc(test.unit)}` : "—"}</strong></div><div class="mini-stat"><small>Best</small><strong>${best === null ? "—" : `${best} ${esc(test.unit)}`}</strong></div><div class="mini-stat"><small>Next due</small><strong>${due < TODAY ? "Overdue" : shortDate(due)}</strong></div></div>
      ${lineChart(test.results.map(x => x.value))}
      <p class="card-kicker" style="margin-top:11px">Equipment · ${esc(test.equipment || "None specified")}</p>
      <ol class="protocol-steps">${test.steps.map(step => `<li>${esc(step)}</li>`).join("") || "<li>Add protocol steps when you edit this test.</li>"}</ol>
      <div class="section-heading" style="margin:18px 0 4px"><div><h2 style="font-size:18px">Results</h2></div></div>
      ${test.results.slice().reverse().map(result => `<div class="test-log-row"><strong>${result.value} ${esc(test.unit)}</strong><small>${longDate(result.day)}${result.note ? ` · ${esc(result.note)}` : ""}</small><span>${result.day === TODAY ? "TODAY" : ""}</span></div>`).join("") || `<div class="empty-state">Your first test result will appear here.</div>`}
      <div class="editor-footer" style="padding-inline:0;margin-top:10px"><button class="button small" data-action="schedule-test">Schedule next test</button>${button("Delete protocol", "delete-test", "quiet small danger")}</div>
    </section>`;
  }
  function render() {
    const root = document.getElementById("app");
    root.innerHTML = ({ dashboard, planner, workouts, metrics, goals, tests }[state.page] || dashboard)();
    document.querySelectorAll(".nav-item").forEach(node => node.classList.toggle("active", node.dataset.page === state.page));
    document.querySelectorAll(".mobile-nav [data-page]").forEach(node => node.classList.toggle("active", node.dataset.page === state.page));
  }
  function setPage(page) {
    state.page = page;
    persist();
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openModal(title, body, submitLabel = "Save", options = {}) {
    const root = document.getElementById("modal-root");
    root.innerHTML = `<div class="modal-backdrop" data-action="backdrop"><section class="modal ${options.wide ? "wide" : ""}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <div class="modal-head"><div><p class="card-kicker">${options.kicker || "Pocket Training"}</p><h2>${title}</h2></div><button class="icon-button" data-action="close-modal" aria-label="Close">×</button></div>
      <form data-form="${options.form || ""}"><div class="modal-body">${body}</div><div class="modal-foot">${options.deleteAction ? button("Delete", options.deleteAction, "quiet small danger") : `<span></span>`}<div class="modal-foot-right"><button type="button" class="button small" data-action="close-modal">Cancel</button><button type="submit" class="button primary small">${submitLabel}</button></div></div></form>
    </section></div>`;
    const first = root.querySelector("input,select,textarea");
    if (first) first.focus();
  }
  function closeModal() { document.getElementById("modal-root").innerHTML = ""; }
  function field(label, name, value = "", type = "text", attrs = "") {
    return `<label class="field-label">${label}<input class="field" name="${name}" type="${type}" value="${esc(value)}" ${attrs}></label>`;
  }
  function sessionModal(session = null, day = TODAY) {
    const edit = !!session;
    const selectedWorkout = edit ? session.workoutId : state.workouts[0]?.id || "";
    const workout = getWorkout(selectedWorkout);
    const initialDay = edit ? session.day : day;
    const content = `<div class="form-grid">
      <label class="field-label full">Workout<select class="select" name="workoutId"><option value="">Custom session / test</option>${state.workouts.map(w => `<option value="${w.id}" ${w.id === selectedWorkout ? "selected" : ""}>${esc(w.name)} · ${w.type}</option>`).join("")}</select></label>
      ${field("Date", "date", dayISO(initialDay), "date", "required")}
      ${field("Duration (min)", "duration", session?.duration ?? workout?.dur ?? 60, "number", "min='1' max='720' required")}
      <label class="field-label">Session RPE · <span data-rpe-value>${session?.rpe ?? workout?.rpe ?? 6}</span><input class="field" name="rpe" type="range" min="1" max="10" value="${session?.rpe ?? workout?.rpe ?? 6}"></label>
      <label class="field-label">Status<select class="select" name="status"><option value="planned" ${!session || session.status === "planned" ? "selected" : ""}>Planned</option><option value="done" ${session?.status === "done" ? "selected" : ""}>Done</option><option value="skipped" ${session?.status === "skipped" ? "selected" : ""}>Skipped</option></select></label>
      ${field("Location", "location", session?.location || "", "text", "placeholder='e.g. Motherlode'")}
      <label class="field-label full">Notes<textarea class="textarea" name="notes" placeholder="Intent, conditions, or how it felt…">${esc(session?.notes || "")}</textarea></label>
      <div class="hint-card full">Estimated load: <strong data-est-load>${(Number(session?.duration ?? workout?.dur ?? 60) * Number(session?.rpe ?? workout?.rpe ?? 6)).toLocaleString()} AU</strong> · duration × session RPE.</div>
    </div>`;
    openModal(edit ? "Edit session" : "Plan a session", content, edit ? "Save changes" : "Add to calendar", {
      form: "session", deleteAction: edit ? "delete-session" : null, kicker: "Planner · session"
    });
    document.querySelector('[data-form="session"]').dataset.sessionId = session?.id || "";
  }
  function checkinModal() {
    const values = state.checkins[TODAY] || { motivation: 8, sleep: 7.5, fingers: 7 };
    const content = `<div class="field-row">
      ${field("Motivation · 1–10", "motivation", values.motivation, "number", "min='1' max='10' step='1' required")}
      ${field("Sleep · hours", "sleep", values.sleep, "number", "min='0' max='16' step='.5' required")}
      ${field("Finger feel · 1–10", "fingers", values.fingers, "number", "min='1' max='10' step='1' required")}
      <p class="field-help">A quick check-in gives context to your training log. It isn't a readiness prescription.</p>
    </div>`;
    openModal("Morning check-in", content, "Save check-in", { form: "checkin", kicker: "Friday, October 2" });
  }
  function workoutModal(workout = null) {
    const data = workout || { name: "", type: "Strength", duration: 45, rpe: 6, desc: "" };
    const content = `<div class="form-grid">
      <label class="field-label full">Workout name<input class="field" name="name" required value="${esc(data.name)}" placeholder="e.g. Repeaters 7:3"></label>
      <label class="field-label">Type<select class="select" name="type">${TYPES.map(type => `<option ${type === data.type ? "selected" : ""}>${type}</option>`).join("")}</select></label>
      ${field("Duration (min)", "duration", data.duration ?? data.dur, "number", "min='1' max='720' required")}
      ${field("Target RPE · 1–10", "rpe", data.rpe, "number", "min='1' max='10' required")}
      <label class="field-label full">Notes & intent<textarea class="textarea" name="description">${esc(data.description ?? data.desc ?? "")}</textarea></label>
      <label class="field-label full">Protocol blocks <span class="field-hint">One block per line: block name | sets | reps | work | rest | load / grade</span>
        <textarea class="textarea" name="blocks" placeholder="Warm-up ramp | 4 | 1 | 10 s | 60 s | BW">${esc((data.blocks || []).map(b => [b.name, b.sets, b.reps, b.work, b.rest, b.load].join(" | ")).join("\n"))}</textarea>
      </label>
    </div>`;
    openModal(workout ? "Edit workout" : "New workout", content, "Save workout", {
      form: "workout-modal", kicker: "Workout protocol", deleteAction: workout ? "delete-workout-modal" : null
    });
    if (workout) document.querySelector('[data-form="workout-modal"]').dataset.workoutId = workout.id;
  }
  function goalModal(goal = null) {
    const editing = !!goal?.id;
    const data = goal || { title: "", category: "Strength", scale: "YDS", start: 0, target: 10, current: 0, unit: "kg", deadline: TODAY + 90, note: "", testId: "" };
    const isGrade = data.category === "Grade";
    const grades = data.scale === "V" ? V_GRADES : YDS;
    const content = `<div class="form-grid">
      <label class="field-label full">Goal<input class="field" name="title" value="${esc(data.title)}" required placeholder="e.g. Redpoint 5.13a"></label>
      <label class="field-label">Category<select class="select" name="category">${["Grade", "Strength", "Volume", "Habit"].map(x => `<option ${x === data.category ? "selected" : ""}>${x}</option>`).join("")}</select></label>
      ${isGrade ? `<label class="field-label">Scale<select class="select" name="scale">${["YDS", "V"].map(x => `<option ${x === data.scale ? "selected" : ""}>${x}</option>`).join("")}</select></label>` : field("Unit", "unit", data.unit || "", "text", "placeholder='kg, days, reps'")}
      ${field("Starting point", "start", isGrade ? grades[data.start] : data.start, isGrade ? "text" : "number", isGrade ? "list='grade-options' required" : "step='any' required")}
      ${field("Target", "target", isGrade ? grades[data.target] : data.target, isGrade ? "text" : "number", isGrade ? "list='grade-options' required" : "step='any' required")}
      ${isGrade ? `<datalist id="grade-options">${grades.map(g => `<option value="${g}"></option>`).join("")}</datalist>` : ""}
      ${field("Deadline", "deadline", dayISO(data.deadline), "date", "required")}
      <label class="field-label">Track from a test<select class="select" name="testId"><option value="">Update manually</option>${state.tests.map(t => `<option value="${t.id}" ${t.id === data.testId ? "selected" : ""}>${esc(t.name)}</option>`).join("")}</select></label>
      <label class="field-label full">Why it matters<textarea class="textarea" name="note">${esc(data.note)}</textarea></label>
      <input type="hidden" name="editingId" value="${goal?.id || ""}">
      <input type="hidden" name="originalCategory" value="${esc(data.category)}">
    </div>`;
    openModal(editing ? "Edit goal" : "New goal", content, "Save goal", { form: "goal", kicker: "2026 season" });
  }
  function parseBlocks(text) {
    return text.split("\n").map(line => line.trim()).filter(Boolean).map(line => {
      const [name = "Block", sets = "3", reps = "5", work = "—", rest = "2 min", load = "—"] = line.split("|").map(x => x.trim());
      return { name, sets, reps, work, rest, load };
    });
  }
  function testModal(test = null) {
    const data = test || { name: "", category: "Finger strength", unit: "kg", direction: "Higher", frequency: 4, equipment: "", steps: [] };
    const content = `<div class="form-grid">
      <label class="field-label full">Protocol name<input class="field" name="name" value="${esc(data.name)}" required placeholder="e.g. Max hang · 20 mm"></label>
      <label class="field-label">Category<select class="select" name="category">${["Finger strength", "Pulling", "Core", "Endurance", "Power", "Mobility", "Body comp"].map(x => `<option ${x === data.category ? "selected" : ""}>${x}</option>`).join("")}</select></label>
      ${field("Unit", "unit", data.unit, "text", "required")}
      <label class="field-label">Better when<select class="select" name="direction"><option ${data.direction !== "Lower" ? "selected" : ""}>Higher</option><option ${data.direction === "Lower" ? "selected" : ""}>Lower</option></select></label>
      ${field("Retest every (weeks)", "frequency", data.frequency, "number", "min='1' max='52' required")}
      <label class="field-label full">Equipment<input class="field" name="equipment" value="${esc(data.equipment)}" placeholder="20 mm edge, harness and plates"></label>
      <label class="field-label full">Protocol steps <span class="field-hint">One step per line</span><textarea class="textarea" name="steps">${esc((data.steps || []).join("\n"))}</textarea></label>
    </div>`;
    openModal(test ? "Edit protocol" : "New test protocol", content, "Save protocol", {
      form: "test", kicker: "Repeatable benchmark", deleteAction: test ? "delete-test-modal" : null
    });
    if (test) document.querySelector('[data-form="test"]').dataset.testId = test.id;
  }
  function resultModal(test = state.tests.find(x => x.id === state.selectedTest)) {
    if (!test) { toast("Create a test protocol first."); return; }
    const content = `<div class="form-grid">
      <label class="field-label full">Protocol<select class="select" name="testId">${state.tests.map(x => `<option value="${x.id}" ${x.id === test.id ? "selected" : ""}>${esc(x.name)} · ${esc(x.unit)}</option>`).join("")}</select></label>
      ${field("Result · " + esc(test.unit), "value", "", "number", "step='any' required")}
      ${field("Date", "date", dayISO(TODAY), "date", "required")}
      <label class="field-label full">Notes<textarea class="textarea" name="note" placeholder="How did it feel? Conditions?"></textarea></label>
    </div>`;
    openModal("Log a test result", content, "Log result", { form: "result", kicker: "Tests · result" });
  }

  document.addEventListener("click", event => {
    const pageNode = event.target.closest("[data-page]");
    if (pageNode) {
      event.preventDefault();
      if (pageNode.dataset.week !== undefined) state.week = Number(pageNode.dataset.week);
      if (pageNode.dataset.id && pageNode.dataset.page === "goals") state.selectedGoal = pageNode.dataset.id;
      if (pageNode.dataset.id && pageNode.dataset.page === "tests") state.selectedTest = pageNode.dataset.id;
      setPage(pageNode.dataset.page);
      return;
    }
    const weekNode = event.target.closest("[data-week]");
    if (weekNode) {
      state.week = Number(weekNode.dataset.week);
      persist(); render(); return;
    }
    const workoutNode = event.target.closest("[data-workout]");
    if (workoutNode) {
      state.selectedWorkout = workoutNode.dataset.workout;
      persist(); render(); return;
    }
    const goalNode = event.target.closest("[data-goal]");
    if (goalNode) {
      state.selectedGoal = goalNode.dataset.goal;
      persist(); render(); return;
    }
    const testNode = event.target.closest("[data-test]");
    if (testNode) {
      state.selectedTest = testNode.dataset.test;
      persist(); render(); return;
    }
    const rangeNode = event.target.closest("[data-range]");
    if (rangeNode) {
      state.range = Number(rangeNode.dataset.range);
      persist(); render(); return;
    }
    const filterNode = event.target.closest("[data-filter]");
    if (filterNode) {
      state.workoutFilter = filterNode.dataset.filter;
      render(); return;
    }
    const milestone = event.target.closest("[data-milestone]");
    if (milestone) {
      const goal = state.goals.find(x => x.id === state.selectedGoal);
      if (goal) goal.milestones[Number(milestone.dataset.milestone)].done = milestone.checked;
      persist(); render(); return;
    }
    const actionNode = event.target.closest("[data-action]");
    if (!actionNode) return;
    const action = actionNode.dataset.action;
    if (action === "close-modal" || (action === "backdrop" && event.target === actionNode)) closeModal();
    else if (action === "new-session") sessionModal(null, Number(actionNode.dataset.day ?? TODAY));
    else if (action === "edit-session") sessionModal(state.sessions.find(x => x.id === actionNode.dataset.id));
    else if (action === "delete-session") {
      const form = actionNode.closest("[data-form='session']");
      state.sessions = state.sessions.filter(x => x.id !== form?.dataset.sessionId);
      persist(); closeModal(); render(); toast("Session removed from your plan.");
    }
    else if (action === "complete-session") {
      const session = state.sessions.find(x => x.id === actionNode.dataset.id);
      if (session) session.status = "done";
      persist(); render(); toast("Session logged. Nice work.");
    }
    else if (action === "checkin") checkinModal();
    else if (action === "new-workout") workoutModal();
    else if (action === "add-block") {
      const form = document.querySelector('[data-form="workout-editor"]');
      const workout = syncWorkoutEditor(form);
      if (workout) workout.blocks.push({ name: "New block", sets: "3", reps: "5", work: "—", rest: "2 min", load: "—" });
      render();
    }
    else if (action === "remove-block") {
      const form = document.querySelector('[data-form="workout-editor"]');
      const workout = syncWorkoutEditor(form);
      if (workout) workout.blocks.splice(Number(actionNode.dataset.index), 1);
      render();
    }
    else if (action === "duplicate-workout") {
      const workout = cloneData(getWorkout(actionNode.closest("[data-form='workout-editor']").dataset.id));
      if (workout) {
        workout.id = uid("w"); workout.name += " (copy)";
        state.workouts.unshift(workout); state.selectedWorkout = workout.id;
        persist(); render(); toast("Workout duplicated.");
      }
    }
    else if (action === "delete-workout" || action === "delete-workout-modal") {
      const form = actionNode.closest("[data-form]") || document.querySelector('[data-form="workout-modal"]');
      const id = form?.dataset.id || form?.dataset.workoutId || state.selectedWorkout;
      state.workouts = state.workouts.filter(x => x.id !== id);
      state.sessions.forEach(x => { if (x.workoutId === id) x.workoutId = ""; });
      state.selectedWorkout = state.workouts[0]?.id || null;
      persist(); closeModal(); render(); toast("Workout removed.");
    }
    else if (action === "schedule-workout") {
      const workout = getWorkout(state.selectedWorkout);
      if (workout) {
        const day = Math.min(CYCLE_DAYS - 1, Math.max(TODAY, state.week * 7));
        state.sessions.push({ id: uid("s"), day, workoutId: workout.id, name: workout.name, type: workout.type, plannedDuration: workout.dur, plannedRpe: workout.rpe, duration: workout.dur, rpe: workout.rpe, status: "planned", location: "", notes: "" });
        persist(); setPage("planner"); toast("Workout added to your plan.");
      }
    }
    else if (action === "new-goal") goalModal();
    else if (action === "edit-goal") goalModal(state.goals.find(x => x.id === state.selectedGoal));
    else if (action === "delete-goal") {
      state.goals = state.goals.filter(x => x.id !== state.selectedGoal);
      state.selectedGoal = state.goals[0]?.id || null; persist(); render(); toast("Goal deleted.");
    }
    else if (action === "new-test") testModal();
    else if (action === "edit-test") testModal(state.tests.find(x => x.id === state.selectedTest));
    else if (action === "delete-test" || action === "delete-test-modal") {
      const form = actionNode.closest("[data-form='test']");
      const id = form?.dataset.testId || state.selectedTest;
      state.tests = state.tests.filter(x => x.id !== id);
      state.goals.forEach(goal => { if (goal.testId === id) delete goal.testId; });
      state.selectedTest = state.tests[0]?.id || null; persist(); closeModal(); render(); toast("Test protocol deleted.");
    }
    else if (action === "new-result") resultModal();
    else if (action === "schedule-test") {
      const test = state.tests.find(x => x.id === state.selectedTest);
      if (test) {
        const day = Math.min(CYCLE_DAYS - 1, Math.max(TODAY + 1, testNextDue(test)));
        state.sessions.push({ id: uid("s"), day, workoutId: "", name: `Test: ${test.name}`, type: "Fingers", plannedDuration: 30, plannedRpe: 8, duration: 30, rpe: 8, status: "planned", location: "", notes: "" });
        persist(); setPage("planner"); toast(`Test scheduled for ${longDate(day)}.`);
      }
    }
    else if (action === "prev-week" || action === "next-week") {
      state.week = Math.max(0, Math.min(11, state.week + (action === "prev-week" ? -1 : 1)));
      persist(); render();
    }
    else if (action === "this-week") { state.week = Math.floor(TODAY / 7); persist(); render(); }
    else if (action === "apply-template") { applyTemplate(); }
    else if (action === "profile") toast("Avery Lane · Self-coached climber · 70.1 kg");
  });

  function applyTemplate() {
    const week = state.week, phase = phaseFor(week);
    const workoutIds = phase === "Base" ? ["w3", "w1", "w4", "w5", "w6", "w7"] :
      phase === "Strength" ? ["w3", "w1", "w4", "w2", "w5", "w6"] :
      phase === "Power" ? ["w3", "w1", "w2", "w4", "w7", "w6"] :
      phase === "Power Endurance" ? ["w9", "w4", "w2", "w7", "w6"] : ["w9", "w6", "w7"];
    state.sessions = state.sessions.filter(x => !(Math.floor(x.day / 7) === week && x.status === "planned" && x.day >= TODAY));
    workoutIds.forEach((id, index) => {
      const workout = getWorkout(id);
      const day = week * 7 + Math.floor(index * 6 / Math.max(1, workoutIds.length - 1));
      if (workout && day >= TODAY && day < CYCLE_DAYS) state.sessions.push({
        id: uid("s"), day, workoutId: workout.id, name: workout.name, type: workout.type,
        plannedDuration: workout.dur, plannedRpe: workout.rpe, duration: workout.dur, rpe: workout.rpe,
        status: "planned", location: "", notes: ""
      });
    });
    persist(); render(); toast(`${phase} week template applied.`);
  }

  document.addEventListener("change", event => {
    const target = event.target;
    if (target.matches("[data-change='phase']")) {
      state.phases[state.week] = target.value;
      persist(); render();
    } else if (target.matches("[data-change='analysis-x']")) {
      state.analysisX = target.value; persist(); render();
    } else if (target.matches("[data-change='analysis-y']")) {
      state.analysisY = target.value; persist(); render();
    } else if (target.name === "workoutId" && target.closest('[data-form="session"]')) {
      const workout = getWorkout(target.value);
      if (workout) {
        target.form.elements.duration.value = workout.dur;
        target.form.elements.rpe.value = workout.rpe;
        target.form.querySelector("[data-rpe-value]").textContent = workout.rpe;
        target.form.querySelector("[data-est-load]").textContent = `${fmt(workout.dur * workout.rpe)} AU`;
      }
    } else if ((target.name === "category" || target.name === "scale") && target.closest('[data-form="goal"]')) {
      const form = target.form;
      const old = Object.fromEntries(new FormData(form));
      const category = target.name === "category" ? target.value : old.category;
      const oldScale = old.scale || "YDS";
      const scale = target.name === "scale" ? target.value : oldScale;
      const wasGrade = old.originalCategory === "Grade";
      const isGrade = category === "Grade";
      const gradeIndex = wasGrade ? (oldScale === "V" ? V_GRADES : YDS).indexOf(old.start) : -1;
      const nextGoal = {
        id: old.editingId || undefined, title: old.title, category, scale: scale || "YDS",
        start: isGrade ? (wasGrade ? Math.max(0, Math.min((scale === "V" ? V_GRADES : YDS).length - 1, gradeIndex)) : (scale === "V" ? 4 : 9)) : (wasGrade ? 0 : old.start),
        target: isGrade ? (wasGrade ? Math.max(0, Math.min((scale === "V" ? V_GRADES : YDS).length - 1, gradeIndex + 1)) : (scale === "V" ? 6 : 12)) : (wasGrade ? 10 : old.target),
        current: 0, unit: isGrade ? "" : (wasGrade ? "kg" : old.unit),
        deadline: dayOffset(old.deadline), note: old.note, testId: old.testId
      };
      goalModal(nextGoal);
    } else if (target.matches("[data-input='workout-search']")) {
      state.workoutQuery = target.value; render();
      const search = document.querySelector("[data-input='workout-search']");
      search?.focus(); search?.setSelectionRange(search.value.length, search.value.length);
    }
  });
  document.addEventListener("input", event => {
    const target = event.target;
    if (target.matches("[data-input='workout-search']")) {
      state.workoutQuery = target.value;
      const list = document.querySelector(".collection-list");
      if (state.page === "workouts" && list) {
        const matching = state.workouts.filter(w => (state.workoutFilter === "All" || w.type === state.workoutFilter) && w.name.toLowerCase().includes(state.workoutQuery.toLowerCase()));
        list.innerHTML = matching.map(workoutCard).join("") || `<div class="empty-state">No workouts match this filter.</div>`;
      }
    }
    if (target.name === "rpe" && target.closest('[data-form="session"]')) {
      const form = target.form;
      const duration = Number(form.elements.duration.value) || 0;
      form.querySelector("[data-rpe-value]").textContent = target.value;
      form.querySelector("[data-est-load]").textContent = `${fmt(duration * Number(target.value))} AU`;
    }
  });

  document.addEventListener("submit", event => {
    const form = event.target.closest("form[data-form]");
    if (!form) return;
    event.preventDefault();
    const data = new FormData(form);
    const type = form.dataset.form;
    if (type === "workout-editor") {
      const workout = syncWorkoutEditor(form);
      if (!workout) return;
      state.sessions.filter(x => x.workoutId === workout.id).forEach(x => { x.name = workout.name; x.type = workout.type; });
      persist(); render(); toast("Workout saved.");
    } else if (type === "session") {
      const dateOffset = dayOffset(data.get("date"));
      if (dateOffset < 0 || dateOffset >= CYCLE_DAYS) { toast("Choose a date inside the 12-week cycle."); return; }
      const workout = getWorkout(data.get("workoutId"));
      const session = state.sessions.find(x => x.id === form.dataset.sessionId);
      const next = {
        id: session?.id || uid("s"), day: dateOffset, workoutId: data.get("workoutId") || "",
        name: workout?.name || session?.name || "Custom session", type: workout?.type || session?.type || "Sport",
        plannedDuration: Number(data.get("duration")), plannedRpe: Number(data.get("rpe")),
        duration: Number(data.get("duration")), rpe: Number(data.get("rpe")), status: data.get("status"),
        location: String(data.get("location") || "").trim(), notes: String(data.get("notes") || "").trim()
      };
      if (session) Object.assign(session, next); else state.sessions.push(next);
      persist(); closeModal(); render(); toast(session ? "Session updated." : "Session added to your plan.");
    } else if (type === "checkin") {
      state.checkins[TODAY] = { motivation: Number(data.get("motivation")), sleep: Number(data.get("sleep")), fingers: Number(data.get("fingers")) };
      persist(); closeModal(); render(); toast("Check-in saved.");
    } else if (type === "workout-modal") {
      const workout = {
        id: form.dataset.workoutId || uid("w"), name: String(data.get("name")).trim(), type: data.get("type"),
        dur: Number(data.get("duration")), rpe: Number(data.get("rpe")), desc: String(data.get("description") || ""),
        blocks: parseBlocks(String(data.get("blocks") || ""))
      };
      const old = getWorkout(workout.id);
      if (old) Object.assign(old, workout); else state.workouts.unshift(workout);
      state.selectedWorkout = workout.id;
      persist(); closeModal(); setPage("workouts"); toast("Workout saved.");
    } else if (type === "measurement") {
      const weight = Number(data.get("weight")), bodyFat = Number(data.get("bodyFat"));
      if (weight <= 0 || bodyFat <= 0 || bodyFat >= 60) { toast("Enter valid weight and body-fat measurements."); return; }
      state.measurements = state.measurements.filter(x => x.day !== TODAY);
      state.measurements.push({ day: TODAY, weight, bodyFat });
      persist(); render(); toast("Measurement added.");
    } else if (type === "goal-progress") {
      const goal = state.goals.find(x => x.id === form.dataset.id);
      const value = Number(data.get("progress"));
      if (!goal || !Number.isFinite(value)) return;
      goal.current = goal.category === "Grade" ? (goal.scale === "V" ? V_GRADES : YDS).indexOf(String(data.get("progress"))) : value;
      if (goal.category === "Grade" && goal.current < 0) { toast("Choose a grade on the selected scale."); return; }
      persist(); render(); toast("Goal progress updated.");
    } else if (type === "milestone") {
      const goal = state.goals.find(x => x.id === form.dataset.id);
      const text = String(data.get("milestone")).trim();
      if (goal && text) goal.milestones.push({ text, done: false });
      persist(); render();
    } else if (type === "goal") {
      const title = String(data.get("title")).trim();
      const category = data.get("category"), scale = data.get("scale") || "YDS";
      const parseGoalValue = raw => category === "Grade" ? (scale === "V" ? V_GRADES : YDS).indexOf(String(raw)) : Number(raw);
      const start = parseGoalValue(data.get("start")), target = parseGoalValue(data.get("target"));
      if (!title || !Number.isFinite(start) || !Number.isFinite(target) || target === start) { toast("Add a title and a distinct, valid target."); return; }
      const editing = state.goals.find(x => x.id === data.get("editingId"));
      const goal = {
        id: editing?.id || uid("g"), title, category, scale: category === "Grade" ? scale : "",
        start, target, current: editing?.current ?? start, unit: category === "Grade" ? "" : String(data.get("unit") || ""),
        startDay: editing?.startDay ?? TODAY, deadline: dayOffset(data.get("deadline")), note: String(data.get("note") || ""),
        testId: category === "Grade" ? "" : String(data.get("testId") || ""), milestones: editing?.milestones || []
      };
      if (editing) Object.assign(editing, goal); else state.goals.unshift(goal);
      state.selectedGoal = goal.id;
      persist(); closeModal(); render(); toast("Goal saved.");
    } else if (type === "test") {
      const test = {
        id: form.dataset.testId || uid("t"), name: String(data.get("name")).trim(), category: data.get("category"),
        unit: String(data.get("unit")).trim(), direction: data.get("direction"), frequency: Number(data.get("frequency")),
        equipment: String(data.get("equipment") || "").trim(),
        steps: String(data.get("steps") || "").split("\n").map(x => x.trim()).filter(Boolean)
      };
      const existing = state.tests.find(x => x.id === test.id);
      if (existing) Object.assign(existing, test); else { test.results = []; state.tests.unshift(test); }
      state.selectedTest = test.id;
      persist(); closeModal(); render(); toast("Test protocol saved.");
    } else if (type === "result") {
      const test = state.tests.find(x => x.id === data.get("testId"));
      const value = Number(data.get("value")), day = dayOffset(data.get("date"));
      if (!test || !Number.isFinite(value) || day < 0 || day >= CYCLE_DAYS) { toast("Enter a valid result date and value inside the cycle."); return; }
      test.results.push({ day, value, note: String(data.get("note") || "").trim() });
      test.results.sort((a, b) => a.day - b.day);
      state.selectedTest = test.id;
      persist(); closeModal(); render(); toast("Test result logged.");
    }
  });

  document.addEventListener("click", event => {
    if (event.target.matches(".modal-backdrop") && event.target.dataset.action === "backdrop") closeModal();
  });

  render();
})();
