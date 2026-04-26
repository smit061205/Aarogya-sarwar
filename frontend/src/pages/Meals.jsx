import { useState, useMemo, useEffect } from 'react';

const STORAGE_KEY = 'aarogya_meals';
const MEAL_TYPES = ['Breakfast','Lunch','Dinner','Snack','Pre-Workout','Post-Workout'];
const MEAL_ICONS = { Breakfast:'wb_sunny', Lunch:'sunny', Dinner:'nights_stay', Snack:'coffee', 'Pre-Workout':'fitness_center', 'Post-Workout':'sports_gymnastics' };
const MEAL_COLORS = {
  Breakfast:     { bg:'bg-amber-100',   text:'text-amber-700',   dot:'bg-amber-500' },
  Lunch:         { bg:'bg-green-100',   text:'text-green-700',   dot:'bg-green-500' },
  Dinner:        { bg:'bg-indigo-100',  text:'text-indigo-700',  dot:'bg-indigo-500' },
  Snack:         { bg:'bg-pink-100',    text:'text-pink-700',    dot:'bg-pink-500' },
  'Pre-Workout': { bg:'bg-orange-100',  text:'text-orange-700',  dot:'bg-orange-500' },
  'Post-Workout':{ bg:'bg-teal-100',    text:'text-teal-700',    dot:'bg-teal-500' },
};
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const toDateStr = (y,m,d) => `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
const getTodayStr = () => { const d=new Date(); return toDateStr(d.getFullYear(),d.getMonth(),d.getDate()); };

const EMPTY_FORM = { mealName:'', mealType:'Breakfast', date:getTodayStr(), time:'', weight:'', calories:'', protein:'', carbs:'', fats:'', repeatMode:'none', repeatCount:7, repeatWeekDays:[] };

function load() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY))||[]; } catch { return []; } }
function save(d) { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); }

function formatTime(ts) { return ts ? new Date(ts).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}) : ''; }
function formatDisplay(dateStr) {
  if (!dateStr) return '';
  const [y,m,d] = dateStr.split('-').map(Number);
  return new Date(y,m-1,d).toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
}

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

export default function Meals() {
  const today = new Date();
  const [meals, setMeals] = useState(load);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(getTodayStr());
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [expandedId, setExpandedId] = useState(null);

  const daysInMonth = new Date(viewYear, viewMonth+1, 0).getDate();
  const firstDOW = new Date(viewYear, viewMonth, 1).getDay();

  const mealsByDate = useMemo(() => {
    const map = {};
    meals.forEach(m => { const k = m.date||getTodayStr(); if (!map[k]) map[k]=[]; map[k].push(m); });
    return map;
  }, [meals]);

  const mealsForDay = (mealsByDate[selectedDate]||[]).slice().sort((a,b)=>
    (a.timestamp||'').localeCompare(b.timestamp||'')
  );

  // ── Notification scheduling ─────────────────────────────────────
  useEffect(() => {
    if (!('Notification' in window)) { console.log('[Notif-Meals] API not supported'); return; }
    const todayStr = getTodayStr();
    const pending = meals.filter(m => m.date === todayStr && m.time);
    console.log('[Notif-Meals] Pending today:', pending.length, pending.map(m=>`${m.mealType}@${m.time}`));
    if (pending.length === 0) return;

    const schedule = async () => {
      let permission = Notification.permission;
      console.log('[Notif-Meals] Permission before:', permission);
      if (permission === 'default') permission = await Notification.requestPermission();
      console.log('[Notif-Meals] Permission after:', permission);
      if (permission !== 'granted') return;

      const timeouts = [];
      const TWELVE_HOURS = 12 * 60 * 60 * 1000;

      pending.forEach(meal => {
        const [h, min] = meal.time.split(':').map(Number);
        const fireAt = new Date();
        fireAt.setHours(h, min, 0, 0);
        const delay = fireAt - Date.now();
        console.log(`[Notif-Meals] "${meal.mealType}" at ${meal.time}, delay=${Math.round(delay/1000)}s`);

        const notify = () => {
          console.log(`[Notif-Meals] Firing for "${meal.mealType}"`);
          try {
            const latest = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            if (latest.find(m => m.id === meal.id)) {
              new Notification('🍽️ Meal Reminder', {
                body: `⏰ Time for your ${meal.mealType}: "${meal.mealName}"!`,
                icon: '/favicon.ico',
                tag: `meal_${meal.id}`,
                requireInteraction: true,
              });
            } else { console.log(`[Notif-Meals] "${meal.mealType}" already removed, skipping`); }
          } catch(err) { console.error('[Notif-Meals] Error:', err); }
        };

        if (delay <= 0 && delay >= -TWELVE_HOURS) {
          console.log(`[Notif-Meals] "${meal.mealType}" missed — firing now`);
          notify();
        } else if (delay > 0) {
          timeouts.push(setTimeout(notify, delay));
        } else {
          console.log(`[Notif-Meals] "${meal.mealType}" too old (${Math.round(-delay/60000)}m), skipping`);
        }
      });

      return () => timeouts.forEach(clearTimeout);
    };

    let cleanup;
    schedule().then(fn => { cleanup = fn; });
    return () => { if (typeof cleanup === 'function') cleanup(); };
  }, [meals]);

  const prevMonth = () => { if(viewMonth===0){setViewMonth(11);setViewYear(y=>y-1);}else setViewMonth(m=>m-1); };
  const nextMonth = () => { if(viewMonth===11){setViewMonth(0);setViewYear(y=>y+1);}else setViewMonth(m=>m+1); };

  const openAdd = () => { setForm({...EMPTY_FORM, date:selectedDate, repeatMode:'none', repeatCount:7, repeatWeekDays:[]}); setEditingId(null); setShowForm(true); };
  const openEdit = (meal) => {
    const {id,timestamp,...fields}=meal;
    setForm({...EMPTY_FORM,...fields});
    setEditingId(id);
    setShowForm(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.mealName.trim()) return;
    let updated;
    if (editingId) {
      updated = meals.map(m => m.id===editingId ? {...m,...form,mealName:form.mealName.trim()} : m);
    } else {
      const seriesId = Date.now().toString();
      const dates = generateDates(form.date||getTodayStr(), form.repeatMode, form.repeatCount, form.repeatWeekDays);
      const newEntries = dates.map((date, i) => ({
        ...form, id:`${seriesId}_${i}`, seriesId,
        mealName: form.mealName.trim(), date,
        timestamp: new Date().toISOString(),
      }));
      updated = [...meals, ...newEntries];
    }
    setMeals(updated); save(updated);
    setShowForm(false); setEditingId(null);
  };

  const handleDelete = (id) => {
    const updated = meals.filter(m=>m.id!==id);
    setMeals(updated); save(updated);
    if(expandedId===id) setExpandedId(null);
  };

  const todayStr = getTodayStr();
  const cells = [...Array(firstDOW).fill(null), ...Array.from({length:daysInMonth},(_,i)=>i+1)];

  const totalCals = mealsForDay.reduce((s,m)=>s+(Number(m.calories)||0),0);

  return (
    <main className="flex flex-col gap-0 mt-4">
      <div className="mb-4">
        <h1 className="font-h1 text-h1 text-on-surface">Daily Meals</h1>
        <p className="text-sm text-on-surface-variant mt-1">Tap a day to view or log meals.</p>
      </div>

      {/* Calendar */}
      <section className="bg-surface-container-lowest rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.07)] border border-outline-variant/20 overflow-hidden mb-4">
        {/* Month nav */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/20 bg-surface-container-low">
          <button onClick={prevMonth} aria-label="Previous month" className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors active:scale-90">
            <span className="material-symbols-outlined text-[20px] text-on-surface-variant">chevron_left</span>
          </button>
          <p className="font-black text-[17px] text-on-surface">{MONTHS[viewMonth]} {viewYear}</p>
          <button onClick={nextMonth} aria-label="Next month" className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors active:scale-90">
            <span className="material-symbols-outlined text-[20px] text-on-surface-variant">chevron_right</span>
          </button>
        </div>

        {/* DOW headers */}
        <div className="grid grid-cols-7 border-b border-outline-variant/10 bg-surface-container-low/50">
          {DAYS.map(d=><div key={d} className="text-center py-2 text-[11px] font-black text-on-surface-variant uppercase tracking-widest">{d}</div>)}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7 gap-px bg-outline-variant/10 p-1">
          {cells.map((day,idx) => {
            if (!day) return <div key={`p${idx}`} className="aspect-square"/>;
            const ds = toDateStr(viewYear,viewMonth,day);
            const isToday = ds===todayStr;
            const isSel = ds===selectedDate;
            const dayMeals = mealsByDate[ds]||[];
            return (
              <button key={ds} onClick={()=>setSelectedDate(ds)}
                aria-label={`${day} ${MONTHS[viewMonth]}`} aria-pressed={isSel}
                className={`flex flex-col items-center justify-start pt-1.5 pb-1 rounded-xl aspect-square transition-all active:scale-95
                  ${isSel?'bg-primary shadow-md':isToday?'bg-primary-fixed border-2 border-primary':'bg-surface-container-lowest hover:bg-surface-container'}`}>
                <span className={`text-[13px] font-black leading-none ${isSel?'text-on-primary':isToday?'text-primary':'text-on-surface'}`}>{day}</span>
                {dayMeals.length>0&&(
                  <div className="flex gap-0.5 mt-1.5 flex-wrap justify-center px-0.5">
                    {dayMeals.slice(0,3).map((m,i)=>{
                      const c = MEAL_COLORS[m.mealType]||MEAL_COLORS.Snack;
                      return <span key={i} className={`w-1.5 h-1.5 rounded-full ${isSel?'bg-white/70':c.dot}`}/>;
                    })}
                    {dayMeals.length>3&&<span className={`text-[8px] font-black ${isSel?'text-on-primary/60':'text-outline'}`}>+{dayMeals.length-3}</span>}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-4 px-4 py-2 border-t border-outline-variant/10 bg-surface-container-low/50">
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500"/><span className="text-[11px] text-on-surface-variant">Meals logged</span></div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-primary-fixed border-2 border-primary"/><span className="text-[11px] text-on-surface-variant">Today</span></div>
        </div>
      </section>

      {/* Day panel */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black text-on-surface-variant uppercase tracking-widest mb-0.5">Selected Day</p>
            <h2 className="font-bold text-[16px] text-on-surface leading-tight">{formatDisplay(selectedDate)}</h2>
            {totalCals>0&&<p className="text-[13px] font-black text-primary mt-1">🔥 {totalCals} kcal total</p>}
          </div>
          <button
            onClick={openAdd}
            aria-label="Add meal for this day"
            className="flex items-center gap-1.5 bg-primary text-on-primary px-4 py-2.5 rounded-full font-bold text-[14px] shadow-md hover:bg-primary-container transition-colors active:scale-95 min-h-[44px]"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">add</span>
            Add Meal
          </button>
        </div>

        {mealsForDay.length===0 ? (
          <div className="text-center py-10 bg-surface-container-low rounded-2xl border border-dashed border-outline-variant/40">
            <span className="material-symbols-outlined text-[40px] text-outline mb-2 block">restaurant</span>
            <p className="font-bold text-[14px] text-on-surface-variant">No meals logged for this day.</p>
            <p className="text-[13px] text-outline mt-1">Tap "Add Meal" to schedule one.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 pb-4">
            {mealsForDay.map(meal=>{
              const c = MEAL_COLORS[meal.mealType]||MEAL_COLORS.Snack;
              const icon = MEAL_ICONS[meal.mealType]||'restaurant';
              const isExp = expandedId===meal.id;
              return (
                <article key={meal.id} className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3 p-4 cursor-pointer" onClick={()=>setExpandedId(isExp?null:meal.id)}>
                    <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${c.bg}`}>
                      <span className={`material-symbols-outlined text-[20px] ${c.text}`} style={{fontVariationSettings:"'FILL' 1"}} aria-hidden="true">{icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-black text-[16px] text-on-surface truncate">{meal.mealName}</p>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.bg} ${c.text}`}>{meal.mealType}</span>
                      </div>
                      <div className="flex gap-3 mt-0.5 flex-wrap">
                        {meal.calories&&<span className="text-xs font-bold text-amber-700">🔥 {meal.calories} kcal</span>}
                        {meal.weight&&<span className="text-xs text-on-surface-variant">⚖️ {meal.weight}g</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={e=>{e.stopPropagation();openEdit(meal);}} aria-label="Edit meal" className="w-9 h-9 flex items-center justify-center rounded-full text-outline hover:text-primary hover:bg-primary-fixed transition-all">
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button onClick={e=>{e.stopPropagation();handleDelete(meal.id);}} aria-label="Delete meal" className="w-9 h-9 flex items-center justify-center rounded-full text-outline hover:text-error hover:bg-error-container transition-all">
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                      <span className="material-symbols-outlined text-outline text-[20px] transition-transform duration-200" style={{transform:isExp?'rotate(180deg)':'rotate(0deg)'}}>expand_more</span>
                    </div>
                  </div>
                  {isExp&&(meal.protein||meal.carbs||meal.fats)&&(
                    <div className="px-4 pb-4 border-t border-outline-variant/10 pt-3">
                      <div className="grid grid-cols-3 gap-2">
                        {meal.protein&&<div className="bg-blue-50 rounded-xl px-3 py-2 text-center"><p className="font-black text-[15px] text-blue-700">{meal.protein}<span className="text-xs font-normal">g</span></p><p className="text-xs font-bold text-blue-600 opacity-80">Protein</p></div>}
                        {meal.carbs&&<div className="bg-amber-50 rounded-xl px-3 py-2 text-center"><p className="font-black text-[15px] text-amber-700">{meal.carbs}<span className="text-xs font-normal">g</span></p><p className="text-xs font-bold text-amber-600 opacity-80">Carbs</p></div>}
                        {meal.fats&&<div className="bg-rose-50 rounded-xl px-3 py-2 text-center"><p className="font-black text-[15px] text-rose-700">{meal.fats}<span className="text-xs font-normal">g</span></p><p className="text-xs font-bold text-rose-600 opacity-80">Fats</p></div>}
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>



      {/* Bottom sheet */}
      {showForm&&(
        <>
          <div className="fixed inset-0 bg-black/40 z-[200] backdrop-blur-sm" onClick={()=>setShowForm(false)} aria-hidden="true"/>
          <div role="dialog" aria-modal="true" aria-label={editingId?'Edit Meal':'Add Meal'}
            className="fixed bottom-0 left-0 right-0 z-[300] bg-surface rounded-t-3xl shadow-[0_-8px_40px_rgba(0,0,0,0.18)] max-w-[600px] mx-auto animate-[slideUp_0.25s_ease-out] flex flex-col"
            style={{maxHeight:'92vh'}}>

            {/* Header */}
            <div className="flex-shrink-0 px-5 pt-4">
              <div className="w-10 h-1 bg-outline-variant rounded-full mx-auto mb-4"/>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-black text-[20px] text-on-surface">{editingId?'Edit Meal':'Add Meal'}</h2>
                <button onClick={()=>setShowForm(false)} aria-label="Close form" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors">
                  <span className="material-symbols-outlined text-[22px] text-on-surface-variant">close</span>
                </button>
              </div>
            </div>

            {/* Scrollable fields */}
            <form id="meal-form" onSubmit={handleSave} className="flex-1 overflow-y-auto px-5 flex flex-col gap-4 pb-2">
              {/* Meal type picker */}
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-black text-on-surface-variant uppercase tracking-wider">Meal Type</label>
                <div className="flex flex-wrap gap-2">
                  {MEAL_TYPES.map(t=>{
                    const c=MEAL_COLORS[t]; const sel=form.mealType===t;
                    return (
                      <button key={t} type="button" onClick={()=>setForm(f=>({...f,mealType:t}))}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-bold border-2 transition-all
                          ${sel?`${c.bg} ${c.text} border-transparent shadow`:'border-outline-variant text-on-surface-variant bg-surface hover:bg-surface-container'}`}>
                        <span className="material-symbols-outlined text-[14px]" style={{fontVariationSettings:"'FILL' 1"}}>{MEAL_ICONS[t]}</span>
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Name */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="meal-name" className="text-[13px] font-black text-on-surface-variant uppercase tracking-wider">Meal Name <span className="text-error">*</span></label>
                <input id="meal-name" type="text" required placeholder="e.g. Oatmeal with banana"
                  className="w-full px-4 py-3 rounded-xl border-2 border-outline-variant focus:border-primary focus:outline-none text-[16px] bg-surface-container-lowest transition-colors"
                  value={form.mealName} onChange={e=>setForm(f=>({...f,mealName:e.target.value}))} autoFocus/>
              </div>

              {/* Date + Time */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="meal-date" className="text-[13px] font-black text-on-surface-variant uppercase tracking-wider">Date <span className="text-error">*</span></label>
                  <input id="meal-date" type="date" required
                    className="w-full px-4 py-3 rounded-xl border-2 border-outline-variant focus:border-primary focus:outline-none text-[16px] bg-surface-container-lowest transition-colors"
                    value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="meal-time" className="text-[13px] font-black text-on-surface-variant uppercase tracking-wider">
                    Remind at <span className="text-[11px] font-normal text-outline">(optional)</span>
                  </label>
                  <input id="meal-time" type="time"
                    className="w-full px-4 py-3 rounded-xl border-2 border-outline-variant focus:border-primary focus:outline-none text-[16px] bg-surface-container-lowest transition-colors"
                    value={form.time} onChange={e=>setForm(f=>({...f,time:e.target.value}))}/>
                </div>
              </div>

              {/* Weight + Calories */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="meal-weight" className="text-[13px] font-black text-on-surface-variant uppercase tracking-wider">Weight (g) <span className="text-error">*</span></label>
                  <input id="meal-weight" type="number" min="0" placeholder="e.g. 250" required
                    className="w-full px-4 py-3 rounded-xl border-2 border-outline-variant focus:border-primary focus:outline-none text-[16px] bg-surface-container-lowest transition-colors"
                    value={form.weight} onChange={e=>setForm(f=>({...f,weight:e.target.value}))}/>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="meal-cal" className="text-[13px] font-black text-on-surface-variant uppercase tracking-wider">Calories <span className="text-error">*</span></label>
                  <input id="meal-cal" type="number" min="0" placeholder="e.g. 350" required
                    className="w-full px-4 py-3 rounded-xl border-2 border-outline-variant focus:border-primary focus:outline-none text-[16px] bg-surface-container-lowest transition-colors"
                    value={form.calories} onChange={e=>setForm(f=>({...f,calories:e.target.value}))}/>
                </div>
              </div>

              {/* Macros */}
              <div className="flex flex-col gap-2 pb-2">
                <label className="text-[13px] font-black text-on-surface-variant uppercase tracking-wider">Macros</label>
                <div className="grid grid-cols-3 gap-2">
                  {[['protein','Protein (g)','text-blue-700'],['carbs','Carbs (g)','text-amber-700'],['fats','Fats (g)','text-rose-700']].map(([field,lbl,cls])=>(
                    <div key={field} className="flex flex-col gap-1">
                      <label htmlFor={`meal-${field}`} className={`text-xs font-black ${cls}`}>{lbl} <span className="text-error">*</span></label>
                      <input id={`meal-${field}`} type="number" min="0" placeholder="0" required
                        className="w-full px-3 py-2.5 rounded-xl border-2 border-outline-variant focus:border-primary focus:outline-none text-[15px] bg-surface-container-lowest transition-colors"
                        value={form[field]} onChange={e=>setForm(f=>({...f,[field]:e.target.value}))}/>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Repeat section ─────────────────────────────────────── */}
              {!editingId && (
                <div className="flex flex-col gap-3 pb-2">
                  <label className="text-[13px] font-black text-on-surface-variant uppercase tracking-wider">Repeat</label>
                  <div className="flex gap-2">
                    {[['none','No Repeat','block'],['daily','Daily','today'],['weekly','Weekly','date_range']].map(([mode,label,icon])=>(
                      <button key={mode} type="button"
                        onClick={()=>setForm(f=>({...f,repeatMode:mode}))}
                        className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl border-2 text-[12px] font-black transition-all
                          ${form.repeatMode===mode?'border-primary bg-primary-fixed text-primary':'border-outline-variant text-on-surface-variant bg-surface hover:bg-surface-container'}`}>
                        <span className="material-symbols-outlined text-[18px]" style={{fontVariationSettings:"'FILL' 1"}}>{icon}</span>
                        {label}
                      </button>
                    ))}
                  </div>

                  {form.repeatMode==='daily'&&(
                    <div className="flex items-center gap-3 bg-surface-container rounded-xl px-4 py-3">
                      <span className="material-symbols-outlined text-primary text-[20px]">repeat</span>
                      <span className="text-[14px] font-bold text-on-surface">Repeat every day for</span>
                      <input type="number" min="2" max="365"
                        className="w-16 px-2 py-1.5 text-center rounded-lg border-2 border-primary font-black text-[15px] text-primary focus:outline-none bg-surface"
                        value={form.repeatCount}
                        onChange={e=>setForm(f=>({...f,repeatCount:e.target.value}))}/>
                      <span className="text-[14px] font-bold text-on-surface">days</span>
                    </div>
                  )}

                  {form.repeatMode==='weekly'&&(
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between gap-1">
                        {['S','M','T','W','T','F','S'].map((d,i)=>{
                          const sel=form.repeatWeekDays.includes(i);
                          return (
                            <button key={i} type="button"
                              onClick={()=>setForm(f=>({...f,repeatWeekDays:sel?f.repeatWeekDays.filter(x=>x!==i):[...f.repeatWeekDays,i].sort()}))}
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
                          value={form.repeatCount}
                          onChange={e=>setForm(f=>({...f,repeatCount:e.target.value}))}/>
                        <span className="text-[14px] font-bold text-on-surface">weeks</span>
                      </div>
                    </div>
                  )}

                  {form.repeatMode!=='none'&&(
                    <p className="text-[12px] font-bold text-primary bg-primary-fixed px-3 py-2 rounded-xl">
                      📅 Will create {generateDates(form.date||getTodayStr(),form.repeatMode,form.repeatCount,form.repeatWeekDays).length} meal entries
                      {form.repeatMode==='weekly'&&form.repeatWeekDays.length===0?' — select at least one day':''}
                    </p>
                  )}
                </div>
              )}
            </form>

            {/* Sticky actions */}
            <div className="flex-shrink-0 flex gap-3 px-5 pt-3 pb-5 border-t border-outline-variant/20 bg-surface"
              style={{paddingBottom:'calc(20px + env(safe-area-inset-bottom))'}}>
              <button type="button" onClick={()=>setShowForm(false)}
                className="flex-1 py-4 rounded-2xl font-bold text-[16px] text-on-surface bg-surface-container hover:bg-surface-container-high transition-colors active:scale-[0.98]">
                Cancel
              </button>
              <button type="submit" form="meal-form"
                className="flex-1 py-4 rounded-2xl font-bold text-[16px] text-on-primary bg-primary shadow-lg hover:bg-primary-container transition-colors active:scale-[0.98]">
                {editingId?'Update Meal':'Save Meal'}
              </button>
            </div>
          </div>
        </>
      )}

      <style>{`@keyframes slideUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
    </main>
  );
}
