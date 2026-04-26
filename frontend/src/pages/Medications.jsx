import { useState, useMemo, useEffect } from 'react';

const STORAGE_KEY = "aarogya_medications";

function loadMeds() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveMeds(meds) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(meds));
}

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function toDateStr(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getTodayStr() {
  const d = new Date();
  return toDateStr(d.getFullYear(), d.getMonth(), d.getDate());
}

function formatDisplayDate(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

// Generates an array of date strings based on repeat settings
function generateDates(startDateStr, repeatMode, rawCount, repeatWeekDays) {
  const repeatCount = Math.max(1, parseInt(rawCount, 10) || 1);
  if (repeatMode === 'none') return [startDateStr];
  const [sy, sm, sd] = startDateStr.split('-').map(Number);
  const dates = new Set();
  if (repeatMode === 'daily') {
    for (let i = 0; i < repeatCount; i++) {
      const dt = new Date(sy, sm - 1, sd + i);
      dates.add(toDateStr(dt.getFullYear(), dt.getMonth(), dt.getDate()));
    }
  } else if (repeatMode === 'weekly') {
    const startDOW = new Date(sy, sm - 1, sd).getDay();
    for (let week = 0; week < repeatCount; week++) {
      for (const wd of repeatWeekDays) {
        const diff = (wd - startDOW) + week * 7;
        if (week === 0 && diff < 0) continue;
        const dt = new Date(sy, sm - 1, sd + diff);
        dates.add(toDateStr(dt.getFullYear(), dt.getMonth(), dt.getDate()));
      }
    }
  }
  return [...dates].sort();
}


export default function Medications() {
  const today = new Date();
  const [meds, setMeds] = useState(loadMeds);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(getTodayStr());
  const [showForm, setShowForm] = useState(false);
  const [editingMedId, setEditingMedId] = useState(null);
  const [newMed, setNewMed] = useState({
    name: '', dosage: '', time: '', date: getTodayStr(),
    repeatMode: 'none', repeatCount: 7, repeatWeekDays: [],
  });

  // ── Calendar helpers ────────────────────────────────────────────────────────
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun

  // Map dateStr → meds for quick lookups
  const medsByDate = useMemo(() => {
    const map = {};
    meds.forEach((m) => {
      const key = m.date || getTodayStr();
      if (!map[key]) map[key] = [];
      map[key].push(m);
    });
    return map;
  }, [meds]);

  const medsForSelected = (medsByDate[selectedDate] || []).sort((a, b) => {
    if (!a.time) return 1;
    if (!b.time) return -1;
    return a.time.localeCompare(b.time);
  });

  // ── Mutations ───────────────────────────────────────────────────────────────
  const handleAddMed = (e) => {
    e.preventDefault();
    if (!newMed.name.trim()) return;
    let updated;
    if (editingMedId) {
      updated = meds.map(m => m.id === editingMedId
        ? { ...m, name: newMed.name.trim(), dosage: newMed.dosage.trim(), time: newMed.time, date: newMed.date }
        : m);
    } else {
      const seriesId = Date.now().toString();
      const dates = generateDates(newMed.date || getTodayStr(), newMed.repeatMode, newMed.repeatCount, newMed.repeatWeekDays);
      const newEntries = dates.map((date, i) => ({
        id: `${seriesId}_${i}`, seriesId,
        name: newMed.name.trim(), dosage: newMed.dosage.trim(),
        time: newMed.time, date, taken: false,
      }));
      updated = [...meds, ...newEntries];
    }
    setMeds(updated);
    saveMeds(updated);
    setNewMed({ name: '', dosage: '', time: '', date: selectedDate, repeatMode: 'none', repeatCount: 7, repeatWeekDays: [] });
    setEditingMedId(null);
    setShowForm(false);
  };

  const handleToggleTaken = (id) => {
    const updated = meds.map((m) =>
      m.id === id ? { ...m, taken: !m.taken } : m,
    );
    setMeds(updated);
    saveMeds(updated);
  };

  const handleDelete = (id) => {
    const updated = meds.filter((m) => m.id !== id);
    setMeds(updated);
    saveMeds(updated);
  };

  const openAddForm = () => {
    setNewMed({ name: '', dosage: '', time: '', date: selectedDate, repeatMode: 'none', repeatCount: 7, repeatWeekDays: [] });
    setEditingMedId(null);
    setShowForm(true);
  };

  const openEditMed = (med) => {
    setNewMed({ name: med.name, dosage: med.dosage, time: med.time, date: med.date, repeatMode: 'none', repeatCount: 7, repeatWeekDays: [] });
    setEditingMedId(med.id);
    setShowForm(true);
  };

  // ── Notification scheduling ─────────────────────────────────────────────────
  useEffect(() => {
    if (!('Notification' in window)) { console.log('[Notif] Notification API not supported'); return; }
    const todayStr = getTodayStr();
    const pending = meds.filter(m => m.date === todayStr && m.time && !m.taken);
    console.log('[Notif] Pending meds today:', pending.length, pending.map(m=>m.name));
    if (pending.length === 0) return;

    const schedule = async () => {
      let permission = Notification.permission;
      console.log('[Notif] Permission before request:', permission);
      if (permission === 'default') permission = await Notification.requestPermission();
      console.log('[Notif] Permission after request:', permission);
      if (permission !== 'granted') return;

      const timeouts = [];
      const TWELVE_HOURS = 12 * 60 * 60 * 1000;

      pending.forEach(med => {
        const [h, min] = med.time.split(':').map(Number);
        const fireAt = new Date();
        fireAt.setHours(h, min, 0, 0);
        const delay = fireAt - Date.now();
        console.log(`[Notif] Med "${med.name}" scheduled at ${med.time}, delay=${Math.round(delay/1000)}s`);

        const notify = () => {
          console.log(`[Notif] Firing notification for "${med.name}"`);
          try {
            const latest = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            const current = latest.find(m => m.id === med.id);
            if (current && !current.taken) {
              new Notification('💊 Medication Reminder', {
                body: `⏰ Time to take ${med.name} — ${med.dosage}!`,
                icon: '/favicon.ico',
                tag: `med_${med.id}`,
                requireInteraction: true,
              });
            } else { console.log(`[Notif] Skipped "${med.name}" — already taken or deleted`); }
          } catch(err) { console.error('[Notif] Error:', err); }
        };

        if (delay <= 0 && delay >= -TWELVE_HOURS) {
          console.log(`[Notif] "${med.name}" missed — firing now`);
          notify();
        } else if (delay > 0) {
          timeouts.push(setTimeout(notify, delay));
        } else {
          console.log(`[Notif] "${med.name}" too old (${Math.round(-delay/60000)}m ago), skipping`);
        }
      });

      return () => timeouts.forEach(clearTimeout);
    };

    let cleanup;
    schedule().then(fn => { cleanup = fn; });
    return () => { if (typeof cleanup === 'function') cleanup(); };
  }, [meds]);

  // ── Month navigation ────────────────────────────────────────────────────────
  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  };

  // Build calendar grid cells (null = empty pad cell)
  const calendarCells = [];
  for (let i = 0; i < firstDayOfWeek; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);

  const todayStr = getTodayStr();

  return (
    <main className="flex flex-col gap-0 mt-4">
      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="mb-4">
        <h1 className="font-h1 text-h1 text-on-surface">Medications</h1>
        <p className="font-body-md text-sm text-on-surface-variant mt-1">
          Tap a day to view or add medications.
        </p>
      </div>

      {/* ── Calendar card ─────────────────────────────────────────────────── */}
      <section className="bg-surface-container-lowest rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.07)] border border-outline-variant/20 overflow-hidden mb-4">
        {/* Month navigation */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/20 bg-surface-container-low">
          <button
            onClick={prevMonth}
            aria-label="Previous month"
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors active:scale-90"
          >
            <span
              className="material-symbols-outlined text-[20px] text-on-surface-variant"
              aria-hidden="true"
            >
              chevron_left
            </span>
          </button>

          <div className="text-center">
            <p className="font-black text-[17px] text-on-surface tracking-tight">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </p>
          </div>

          <button
            onClick={nextMonth}
            aria-label="Next month"
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors active:scale-90"
          >
            <span
              className="material-symbols-outlined text-[20px] text-on-surface-variant"
              aria-hidden="true"
            >
              chevron_right
            </span>
          </button>
        </div>

        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 border-b border-outline-variant/10 bg-surface-container-low/50">
          {DAYS_OF_WEEK.map((d) => (
            <div
              key={d}
              className="text-center py-2 text-[11px] font-black text-on-surface-variant uppercase tracking-widest"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-px bg-outline-variant/10 p-1">
          {calendarCells.map((day, idx) => {
            if (!day)
              return <div key={`pad-${idx}`} className="aspect-square" />;

            const dateStr = toDateStr(viewYear, viewMonth, day);
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;
            const dayMeds = medsByDate[dateStr] || [];
            const hasMeds = dayMeds.length > 0;
            const allTaken = hasMeds && dayMeds.every((m) => m.taken);
            const someTaken =
              hasMeds && dayMeds.some((m) => m.taken) && !allTaken;

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(dateStr)}
                aria-label={`${day} ${MONTH_NAMES[viewMonth]} ${viewYear}${hasMeds ? `, ${dayMeds.length} medication${dayMeds.length > 1 ? "s" : ""}` : ""}`}
                aria-pressed={isSelected}
                className={`
                  flex flex-col items-center justify-start pt-1.5 pb-1 rounded-xl aspect-square transition-all active:scale-95
                  ${
                    isSelected
                      ? "bg-primary shadow-md"
                      : isToday
                        ? "bg-primary-fixed border-2 border-primary"
                        : "bg-surface-container-lowest hover:bg-surface-container"
                  }
                `}
              >
                <span
                  className={`text-[13px] font-black leading-none ${
                    isSelected
                      ? "text-on-primary"
                      : isToday
                        ? "text-primary"
                        : "text-on-surface"
                  }`}
                >
                  {day}
                </span>

                {/* Dot indicators */}
                {hasMeds && (
                  <div className="flex gap-0.5 mt-1.5 flex-wrap justify-center px-1">
                    {dayMeds.slice(0, 3).map((m, i) => (
                      <span
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full ${
                          m.taken
                            ? isSelected
                              ? "bg-green-300"
                              : "bg-green-500"
                            : isSelected
                              ? "bg-blue-200"
                              : "bg-primary-fixed-dim"
                        }`}
                      />
                    ))}
                    {dayMeds.length > 3 && (
                      <span
                        className={`text-[8px] font-black leading-none ${isSelected ? "text-on-primary/60" : "text-outline"}`}
                      >
                        +{dayMeds.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 px-4 py-2 border-t border-outline-variant/10 bg-surface-container-low/50">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary-fixed-dim" />
            <span className="text-[11px] text-on-surface-variant">Pending</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-[11px] text-on-surface-variant">Taken</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-primary-fixed border-2 border-primary" />
            <span className="text-[11px] text-on-surface-variant">Today</span>
          </div>
        </div>
      </section>

      {/* ── Day panel ─────────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-3">
        {/* Day header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black text-on-surface-variant uppercase tracking-widest mb-0.5">
              Selected Day
            </p>
            <h2 className="font-bold text-[16px] text-on-surface leading-tight">
              {formatDisplayDate(selectedDate)}
            </h2>
          </div>
          <button
            onClick={openAddForm}
            aria-label="Add medication for this day"
            className="flex items-center gap-1.5 bg-primary text-on-primary px-4 py-2.5 rounded-full font-bold text-[14px] shadow-md hover:bg-primary-container transition-colors active:scale-95 min-h-[44px]"
          >
            <span
              className="material-symbols-outlined text-[18px]"
              aria-hidden="true"
            >
              add
            </span>
            Add Med
          </button>
        </div>

        {/* Medication cards for selected day */}
        {medsForSelected.length === 0 ? (
          <div className="text-center py-10 bg-surface-container-low rounded-2xl border border-dashed border-outline-variant/40">
            <span
              className="material-symbols-outlined text-[40px] text-outline mb-2 block"
              aria-hidden="true"
            >
              medication
            </span>
            <p className="font-bold text-[14px] text-on-surface-variant">
              No medications for this day.
            </p>
            <p className="text-[13px] text-outline mt-1">
              Tap "Add Med" to schedule one.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 pb-4">
            {medsForSelected.map((med) => (
              <article
                key={med.id}
                className={`relative flex items-start gap-3 p-4 rounded-2xl border transition-all shadow-sm ${
                  med.taken
                    ? "bg-green-50 border-green-200"
                    : "bg-surface-container-lowest border-outline-variant/20 hover:shadow-md"
                }`}
              >
                {/* Colour strip */}
                <div
                  className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full ${med.taken ? "bg-green-500" : "bg-primary"}`}
                />

                {/* Icon */}
                <div
                  className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 ${
                    med.taken ? "bg-green-100" : "bg-primary-fixed"
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-[20px] ${med.taken ? "text-green-600" : "text-primary"}`}
                    style={{ fontVariationSettings: "'FILL' 1" }}
                    aria-hidden="true"
                  >
                    {med.taken ? "check_circle" : "medication"}
                  </span>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`font-black text-[16px] leading-tight ${med.taken ? "line-through text-on-surface-variant" : "text-on-surface"}`}
                  >
                    {med.name}
                  </p>
                  {med.dosage && (
                    <p className="text-[13px] text-on-surface-variant mt-0.5">
                      {med.dosage}
                    </p>
                  )}
                  {med.time && (
                    <div className="flex items-center gap-1 mt-1.5">
                      <span
                        className="material-symbols-outlined text-[14px] text-outline"
                        aria-hidden="true"
                      >
                        schedule
                      </span>
                      <span className="text-[13px] font-bold text-outline">
                        {formatTime(med.time)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-1 flex-shrink-0">
                  <button
                    onClick={() => openEditMed(med)}
                    aria-label="Edit medication"
                    className="w-9 h-9 flex items-center justify-center rounded-full text-outline hover:text-primary hover:bg-primary-fixed transition-all active:scale-90"
                  >
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">edit</span>
                  </button>
                  <button
                    onClick={() => handleToggleTaken(med.id)}
                    aria-label={med.taken ? 'Mark as not taken' : 'Mark as taken'}
                    className={`w-9 h-9 flex items-center justify-center rounded-full transition-all active:scale-90 ${
                      med.taken
                        ? 'bg-green-100 text-green-600 hover:bg-green-200'
                        : 'bg-primary-fixed text-primary hover:bg-primary hover:text-on-primary'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {med.taken ? 'undo' : 'check'}
                    </span>
                  </button>
                  <button
                    onClick={() => handleDelete(med.id)}
                    aria-label="Delete medication"
                    className="w-9 h-9 flex items-center justify-center rounded-full text-outline hover:text-error hover:bg-error-container transition-all active:scale-90"
                  >
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">delete</span>
                  </button>
                </div>
              </article>
            ))}

            {/* Progress summary */}
            {medsForSelected.length > 1 && (
              <div className="flex items-center gap-3 px-4 py-2.5 bg-surface-container rounded-xl">
                <div className="flex-1 bg-surface-container-high rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${(medsForSelected.filter((m) => m.taken).length / medsForSelected.length) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-[13px] font-black text-on-surface-variant whitespace-nowrap">
                  {medsForSelected.filter((m) => m.taken).length}/
                  {medsForSelected.length} taken
                </span>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── Add Med bottom sheet ───────────────────────────────────────────── */}
      {showForm && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 z-[200] backdrop-blur-sm"
            onClick={() => setShowForm(false)}
            aria-hidden="true"
          />

          {/* Sheet — flex column so buttons stay pinned at bottom */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Add Medication"
            className="fixed bottom-0 left-0 right-0 z-[300] bg-surface rounded-t-3xl shadow-[0_-8px_40px_rgba(0,0,0,0.18)] max-w-[600px] mx-auto animate-[slideUp_0.25s_ease-out] flex flex-col"
            style={{ maxHeight: '88vh' }}
          >
            {/* Drag handle + header — never scrolls away */}
            <div className="flex-shrink-0 px-5 pt-4">
              <div className="w-10 h-1 bg-outline-variant rounded-full mx-auto mb-4" />
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-black text-[20px] text-on-surface">{editingMedId ? 'Edit Medication' : 'Add Medication'}</h2>
                <button
                  onClick={() => setShowForm(false)}
                  aria-label="Close form"
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors"
                >
                  <span className="material-symbols-outlined text-[22px] text-on-surface-variant" aria-hidden="true">close</span>
                </button>
              </div>
            </div>

            {/* Scrollable form fields */}
            <form
              id="add-med-form"
              onSubmit={handleAddMed}
              className="flex-1 overflow-y-auto px-5 flex flex-col gap-4 pb-2"
            >
              {/* Name */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="med-name" className="text-[13px] font-black text-on-surface-variant uppercase tracking-wider">
                  Medicine Name <span className="text-error">*</span>
                </label>
                <input
                  id="med-name"
                  type="text"
                  required
                  placeholder="e.g. Aspirin"
                  className="w-full px-4 py-3 rounded-xl border-2 border-outline-variant focus:border-primary focus:outline-none text-[16px] text-on-surface bg-surface-container-lowest transition-colors"
                  value={newMed.name}
                  onChange={(e) => setNewMed({ ...newMed, name: e.target.value })}
                  autoFocus
                />
              </div>

              {/* Dosage */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="med-dosage" className="text-[13px] font-black text-on-surface-variant uppercase tracking-wider">
                  Dosage <span className="text-error">*</span>
                </label>
                <input
                  id="med-dosage"
                  type="text"
                  required
                  placeholder="e.g. 1 Tablet (81mg)"
                  className="w-full px-4 py-3 rounded-xl border-2 border-outline-variant focus:border-primary focus:outline-none text-[16px] text-on-surface bg-surface-container-lowest transition-colors"
                  value={newMed.dosage}
                  onChange={(e) => setNewMed({ ...newMed, dosage: e.target.value })}
                />
              </div>

              {/* Time + Date */}
              <div className="grid grid-cols-2 gap-3 pb-2">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="med-time" className="text-[13px] font-black text-on-surface-variant uppercase tracking-wider">
                    Time <span className="text-error">*</span>
                  </label>
                  <input
                    id="med-time"
                    type="time"
                    required
                    className="w-full px-4 py-3 rounded-xl border-2 border-outline-variant focus:border-primary focus:outline-none text-[16px] text-on-surface bg-surface-container-lowest transition-colors"
                    value={newMed.time}
                    onChange={(e) => setNewMed({ ...newMed, time: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="med-date" className="text-[13px] font-black text-on-surface-variant uppercase tracking-wider">
                    Date <span className="text-error">*</span>
                  </label>
                  <input
                    id="med-date"
                    type="date"
                  className="w-full px-4 py-3 rounded-xl border-2 border-outline-variant focus:border-primary focus:outline-none text-[16px] text-on-surface bg-surface-container-lowest transition-colors"
                  value={newMed.date}
                  onChange={(e) => setNewMed({ ...newMed, date: e.target.value })}
                />
              </div>
            </div>

            {/* ── Repeat section — hidden when editing ──────────────── */}
            {!editingMedId && (
              <div className="flex flex-col gap-3 pb-2">
                <label className="text-[13px] font-black text-on-surface-variant uppercase tracking-wider">Repeat</label>

                {/* Mode toggles */}
                <div className="flex gap-2">
                  {[['none','No Repeat','block'],['daily','Daily','today'],['weekly','Weekly','date_range']].map(([mode,label,icon])=>(
                    <button key={mode} type="button"
                      onClick={()=>setNewMed(m=>({...m,repeatMode:mode}))}
                      className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl border-2 text-[12px] font-black transition-all
                        ${newMed.repeatMode===mode?'border-primary bg-primary-fixed text-primary':'border-outline-variant text-on-surface-variant bg-surface hover:bg-surface-container'}`}>
                      <span className="material-symbols-outlined text-[18px]" style={{fontVariationSettings:"'FILL' 1"}}>{icon}</span>
                      {label}
                    </button>
                  ))}
                </div>

                {/* Daily options */}
                {newMed.repeatMode==='daily'&&(
                  <div className="flex items-center gap-3 bg-surface-container rounded-xl px-4 py-3">
                    <span className="material-symbols-outlined text-primary text-[20px]">repeat</span>
                    <span className="text-[14px] font-bold text-on-surface">Repeat every day for</span>
                    <input type="number" min="2" max="365"
                      className="w-16 px-2 py-1.5 text-center rounded-lg border-2 border-primary font-black text-[15px] text-primary focus:outline-none bg-surface"
                      value={newMed.repeatCount}
                      onChange={e=>setNewMed(m=>({...m,repeatCount:e.target.value}))}/>
                    <span className="text-[14px] font-bold text-on-surface">days</span>
                  </div>
                )}

                {/* Weekly options */}
                {newMed.repeatMode==='weekly'&&(
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between gap-1">
                      {['S','M','T','W','T','F','S'].map((d,i)=>{
                        const sel=newMed.repeatWeekDays.includes(i);
                        return (
                          <button key={i} type="button"
                            onClick={()=>setNewMed(m=>({...m,repeatWeekDays:sel?m.repeatWeekDays.filter(x=>x!==i):[...m.repeatWeekDays,i].sort()}))}
                            className={`flex-1 h-9 rounded-full text-[13px] font-black transition-all
                              ${sel?'bg-primary text-on-primary shadow-md':'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}>
                            {d}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-3 bg-surface-container rounded-xl px-4 py-3">
                      <span className="material-symbols-outlined text-primary text-[20px]">event_repeat</span>
                      <span className="text-[14px] font-bold text-on-surface">For</span>
                      <input type="number" min="1" max="52"
                        className="w-14 px-2 py-1.5 text-center rounded-lg border-2 border-primary font-black text-[15px] text-primary focus:outline-none bg-surface"
                        value={newMed.repeatCount}
                        onChange={e=>setNewMed(m=>({...m,repeatCount:e.target.value}))}/>
                      <span className="text-[14px] font-bold text-on-surface">weeks</span>
                    </div>
                  </div>
                )}

                {/* Preview badge */}
                {newMed.repeatMode!=='none'&&(
                  <p className="text-[12px] font-bold text-primary bg-primary-fixed px-3 py-2 rounded-xl">
                    📅 Will create {generateDates(newMed.date||getTodayStr(),newMed.repeatMode,newMed.repeatCount,newMed.repeatWeekDays).length} medication entries
                    {newMed.repeatMode==='weekly'&&newMed.repeatWeekDays.length===0?' — select at least one day':''}
                  </p>
                )}
              </div>
            )}
            </form>

            {/* Sticky action buttons — pinned at sheet bottom, always visible */}
            <div
              className="flex-shrink-0 flex gap-3 px-5 pt-3 pb-5 border-t border-outline-variant/20 bg-surface"
              style={{ paddingBottom: 'calc(20px + env(safe-area-inset-bottom))' }}
            >
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 py-4 rounded-2xl font-bold text-[16px] text-on-surface bg-surface-container hover:bg-surface-container-high transition-colors active:scale-[0.98]"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="add-med-form"
                className="flex-1 py-4 rounded-2xl font-bold text-[16px] text-on-primary bg-primary shadow-lg hover:bg-primary-container transition-colors active:scale-[0.98]"
              >
                {editingMedId ? 'Update Medicine' : 'Save Medicine'}
              </button>
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </main>
  );
}
