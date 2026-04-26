import { useState } from 'react';

const STORAGE_KEY = 'aarogya_meals';

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Pre-Workout', 'Post-Workout'];

const MEAL_TYPE_ICONS = {
  Breakfast: 'wb_sunny',
  Lunch: 'sunny',
  Dinner: 'nights_stay',
  Snack: 'coffee',
  'Pre-Workout': 'fitness_center',
  'Post-Workout': 'sports_gymnastics',
};

const MEAL_TYPE_COLORS = {
  Breakfast:      { bg: 'bg-primary-fixed',   text: 'text-on-primary-fixed' },
  Lunch:          { bg: 'bg-tertiary-fixed',   text: 'text-on-tertiary-fixed' },
  Dinner:         { bg: 'bg-inverse-surface',  text: 'text-inverse-on-surface' },
  Snack:          { bg: 'bg-secondary-fixed',  text: 'text-on-secondary-fixed' },
  'Pre-Workout':  { bg: 'bg-primary-container',text: 'text-on-primary-container' },
  'Post-Workout': { bg: 'bg-secondary-container', text: 'text-on-secondary-container' },
};

const getTodayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

const EMPTY_FORM = {
  mealName: '',
  mealType: 'Breakfast',
  date: getTodayStr(),
  weight: '',
  calories: '',
  protein: '',
  carbs: '',
  fats: '',
  // micronutrients
  fiber: '',
  sugar: '',
  sodium: '',
  vitaminC: '',
  calcium: '',
  iron: '',
};

function loadMeals() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}

function saveMeals(meals) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(meals));
}

// ─── Totals across all meals ────────────────────────────────────────────────
function calcTotals(meals) {
  return meals.reduce(
    (acc, m) => ({
      calories: acc.calories + (Number(m.calories) || 0),
      protein:  acc.protein  + (Number(m.protein)  || 0),
      carbs:    acc.carbs    + (Number(m.carbs)     || 0),
      fats:     acc.fats     + (Number(m.fats)      || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );
}

export default function Meals() {
  const [meals, setMeals]           = useState(loadMeals);
  const [showForm, setShowForm]      = useState(false);
  const [form, setForm]              = useState(EMPTY_FORM);
  const [showMicro, setShowMicro]    = useState(false);
  const [expandedId, setExpandedId]  = useState(null);
  const [editingId, setEditingId]    = useState(null); // null = add mode, string = edit mode

  const totals = calcTotals(meals);

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setShowMicro(false);
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (meal) => {
    // Strip id/timestamp — keep all editable fields
    const { id, timestamp, ...fields } = meal;
    setForm({ ...EMPTY_FORM, ...fields });
    setShowMicro(!!(meal.fiber || meal.sugar || meal.sodium || meal.vitaminC || meal.calcium || meal.iron));
    setEditingId(id);
    setExpandedId(null);
    setShowForm(true);
    // Scroll form into view smoothly
    setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 50);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.mealName.trim()) return;

    if (editingId) {
      // ── Update existing meal ──
      const updated = meals.map((m) =>
        m.id === editingId
          ? { ...m, ...form, mealName: form.mealName.trim() }
          : m
      );
      setMeals(updated);
      saveMeals(updated);
    } else {
      // ── Add new meal ──
      const meal = {
        ...form,
        id: Date.now().toString(),
        mealName: form.mealName.trim(),
        date: form.date || getTodayStr(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      const updated = [...meals, meal];
      setMeals(updated);
      saveMeals(updated);
    }
    resetForm();
  };

  const handleDelete = (id) => {
    const updated = meals.filter((m) => m.id !== id);
    setMeals(updated);
    saveMeals(updated);
    if (expandedId === id) setExpandedId(null);
    if (editingId === id) resetForm();
  };

  return (
    <main className="flex flex-col gap-stack-md mt-4">

      {/* Page title */}
      <div className="mb-unit">
        <h1 className="font-h1 text-h1 text-on-surface">Daily Meals</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant mt-1">
          Track your nutrition throughout the day.
        </p>
      </div>

      {/* Daily Macro Summary */}
      {meals.length > 0 && (
        <section className="bg-surface-container-lowest rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-4 border border-outline-variant/20">
          <p className="font-label-bold text-sm text-on-surface-variant uppercase tracking-widest mb-3">Today's Totals</p>
          <div className="grid grid-cols-4 gap-2 text-center">
            <MacroBadge label="Calories" value={totals.calories} unit="kcal" color="text-tertiary" />
            <MacroBadge label="Protein"  value={totals.protein}  unit="g"    color="text-primary" />
            <MacroBadge label="Carbs"    value={totals.carbs}    unit="g"    color="text-secondary" />
            <MacroBadge label="Fats"     value={totals.fats}     unit="g"    color="text-on-surface-variant" />
          </div>
        </section>
      )}

      {/* Empty state */}
      {meals.length === 0 && !showForm && (
        <div className="text-center text-on-surface-variant py-10 bg-surface-container-low rounded-2xl border border-outline-variant/20">
          <span className="material-symbols-outlined text-[48px] text-outline mb-2 block">restaurant</span>
          <p className="font-body-md">No meals logged yet. Add your first meal below.</p>
        </div>
      )}

      {/* Meal cards */}
      {meals.map((meal) => {
        const colors = MEAL_TYPE_COLORS[meal.mealType] || MEAL_TYPE_COLORS['Snack'];
        const icon   = MEAL_TYPE_ICONS[meal.mealType]  || 'restaurant';
        const isExpanded = expandedId === meal.id;
        const hasMicro = meal.fiber || meal.sugar || meal.sodium || meal.vitaminC || meal.calcium || meal.iron;

        return (
          <article
            key={meal.id}
            className="bg-surface-container-lowest rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-outline-variant/20 overflow-hidden hover:shadow-[0_8px_30px_rgba(0,0,0,0.10)] transition-shadow"
          >
            {/* Card Header */}
            <div
              className="flex items-center gap-3 p-stack-md cursor-pointer"
              onClick={() => setExpandedId(isExpanded ? null : meal.id)}
            >
              <div className={`w-11 h-11 rounded-full ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                <span className={`material-symbols-outlined text-[22px] ${colors.text}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                  {icon}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-h2 text-[20px] text-on-surface truncate">{meal.mealName}</h2>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                    {meal.mealType}
                  </span>
                </div>
                <div className="flex gap-3 mt-0.5 flex-wrap">
                  {(meal.date || meal.timestamp) && <span className="text-xs text-outline">🕒 {meal.date ? `${meal.date} ` : ''}{meal.timestamp}</span>}
                  {meal.weight    && <span className="text-xs text-on-surface-variant">⚖️ {meal.weight}g</span>}
                  {meal.calories  && <span className="text-xs text-tertiary font-bold">🔥 {meal.calories} kcal</span>}
                </div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); handleEdit(meal); }}
                  className="text-outline hover:text-primary transition-colors p-1.5 rounded-full hover:bg-primary-fixed min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label="Edit meal"
                >
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(meal.id); }}
                  className="text-outline hover:text-error transition-colors p-1.5 rounded-full hover:bg-error-container min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label="Delete meal"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
                <span className="material-symbols-outlined text-outline text-[20px] transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  expand_more
                </span>
              </div>
            </div>

            {/* Expanded detail */}
            {isExpanded && (
              <div className="px-stack-md pb-stack-md border-t border-outline-variant/20 pt-3 flex flex-col gap-3">
                {/* Macros row */}
                {(meal.protein || meal.carbs || meal.fats) && (
                  <div className="grid grid-cols-3 gap-2">
                    {meal.protein && <MacroDetail label="Protein" value={meal.protein} unit="g" color="bg-primary-fixed text-on-primary-fixed" />}
                    {meal.carbs   && <MacroDetail label="Carbs"   value={meal.carbs}   unit="g" color="bg-tertiary-fixed text-on-tertiary-fixed" />}
                    {meal.fats    && <MacroDetail label="Fats"    value={meal.fats}    unit="g" color="bg-secondary-fixed text-on-secondary-fixed" />}
                  </div>
                )}

                {/* Micronutrients */}
                {hasMicro && (
                  <div className="bg-surface-container-low rounded-xl p-3">
                    <p className="font-label-bold text-xs text-on-surface-variant uppercase tracking-wider mb-2">Micronutrients</p>
                    <div className="grid grid-cols-3 gap-2">
                      {meal.fiber    && <MicroRow label="Fiber"     value={`${meal.fiber}g`} />}
                      {meal.sugar    && <MicroRow label="Sugar"     value={`${meal.sugar}g`} />}
                      {meal.sodium   && <MicroRow label="Sodium"    value={`${meal.sodium}mg`} />}
                      {meal.vitaminC && <MicroRow label="Vitamin C" value={`${meal.vitaminC}mg`} />}
                      {meal.calcium  && <MicroRow label="Calcium"   value={`${meal.calcium}mg`} />}
                      {meal.iron     && <MicroRow label="Iron"      value={`${meal.iron}mg`} />}
                    </div>
                  </div>
                )}
              </div>
            )}
          </article>
        );
      })}

      {/* ── Add Meal Form ── */}
      {showForm ? (
        <form
          onSubmit={handleSave}
          className="bg-surface-container-low rounded-2xl border border-outline-variant/30 p-5 flex flex-col gap-4 mb-4"
        >
          <div className="flex items-center justify-between border-b border-outline-variant pb-3">
            <h2 className="font-h2 text-h2 text-on-surface">
              {editingId ? '✏️ Edit Meal' : 'Log a Meal'}
            </h2>
            {editingId && (
              <span className="text-xs bg-primary-fixed text-on-primary-fixed px-2 py-1 rounded-full font-bold">
                Editing
              </span>
            )}
          </div>

          {/* Meal type selector */}
          <div className="flex flex-col gap-1">
            <label className="font-label-bold text-sm text-on-surface-variant">Meal Type</label>
            <div className="flex flex-wrap gap-2">
              {MEAL_TYPES.map((type) => {
                const c = MEAL_TYPE_COLORS[type];
                const selected = form.mealType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => set('mealType', type)}
                    className={`px-3 py-1.5 rounded-full text-sm font-bold transition-all border-2 ${
                      selected
                        ? `${c.bg} ${c.text} border-transparent shadow`
                        : 'border-outline-variant text-on-surface-variant bg-surface hover:bg-surface-container'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px] mr-1 align-middle" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {MEAL_TYPE_ICONS[type]}
                    </span>
                    {type}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Meal name & date */}
          <div className="grid grid-cols-[2fr_1fr] gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="meal-name" className="font-label-bold text-sm text-on-surface-variant">Meal Name <span className="text-error">*</span></label>
              <input
                id="meal-name" type="text" required placeholder="e.g. Oatmeal with banana"
                className="input-field"
                value={form.mealName} onChange={(e) => set('mealName', e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="meal-date" className="font-label-bold text-sm text-on-surface-variant">Date <span className="text-error">*</span></label>
              <input
                id="meal-date" type="date" required
                className="input-field"
                value={form.date} onChange={(e) => set('date', e.target.value)}
              />
            </div>
          </div>

          {/* Weight + Calories row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="font-label-bold text-sm text-on-surface-variant">Weight (g)</label>
              <input
                type="number" placeholder="e.g. 250" min="0"
                className="input-field"
                value={form.weight} onChange={(e) => set('weight', e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-label-bold text-sm text-on-surface-variant">Calories (kcal)</label>
              <input
                type="number" placeholder="e.g. 350" min="0"
                className="input-field"
                value={form.calories} onChange={(e) => set('calories', e.target.value)}
              />
            </div>
          </div>

          {/* Macros row */}
          <div>
            <p className="font-label-bold text-sm text-on-surface-variant mb-2">Macronutrients</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-primary font-bold">Protein (g)</label>
                <input
                  type="number" placeholder="e.g. 20" min="0"
                  className="input-field"
                  value={form.protein} onChange={(e) => set('protein', e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-tertiary font-bold">Carbs (g)</label>
                <input
                  type="number" placeholder="e.g. 45" min="0"
                  className="input-field"
                  value={form.carbs} onChange={(e) => set('carbs', e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-on-surface-variant font-bold">Fats (g)</label>
                <input
                  type="number" placeholder="e.g. 8" min="0"
                  className="input-field"
                  value={form.fats} onChange={(e) => set('fats', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Micronutrients toggle */}
          <button
            type="button"
            onClick={() => setShowMicro((v) => !v)}
            className="flex items-center gap-2 text-sm font-bold text-on-surface-variant hover:text-primary transition-colors self-start"
          >
            <span className="material-symbols-outlined text-[18px]">
              {showMicro ? 'expand_less' : 'expand_more'}
            </span>
            {showMicro ? 'Hide' : 'Add'} Micronutrients (optional)
          </button>

          {showMicro && (
            <div className="bg-surface-container rounded-xl p-4 flex flex-col gap-3">
              <p className="font-label-bold text-xs text-on-surface-variant uppercase tracking-wider">Micronutrients</p>
              <div className="grid grid-cols-2 gap-3">
                <MicroInput label="Fiber (g)"     placeholder="e.g. 5"   value={form.fiber}    onChange={(e) => set('fiber', e.target.value)} />
                <MicroInput label="Sugar (g)"     placeholder="e.g. 10"  value={form.sugar}    onChange={(e) => set('sugar', e.target.value)} />
                <MicroInput label="Sodium (mg)"   placeholder="e.g. 300" value={form.sodium}   onChange={(e) => set('sodium', e.target.value)} />
                <MicroInput label="Vitamin C (mg)"placeholder="e.g. 30"  value={form.vitaminC} onChange={(e) => set('vitaminC', e.target.value)} />
                <MicroInput label="Calcium (mg)"  placeholder="e.g. 100" value={form.calcium}  onChange={(e) => set('calcium', e.target.value)} />
                <MicroInput label="Iron (mg)"     placeholder="e.g. 2"   value={form.iron}     onChange={(e) => set('iron', e.target.value)} />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={resetForm}
              className="flex-1 bg-surface-container p-3 rounded-lg font-button text-on-surface hover:bg-surface-dim transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-primary text-on-primary rounded-lg font-button p-3 shadow hover:bg-on-primary-fixed-variant transition-colors"
            >
              {editingId ? 'Update Meal' : 'Save Meal'}
            </button>
          </div>
        </form>
      ) : (
        <div className="mt-2 pb-10">
          <button
            onClick={() => setShowForm(true)}
            className="w-full min-h-[64px] bg-surface-container border-2 border-dashed border-outline font-button text-button text-on-surface-variant rounded-xl flex justify-center items-center gap-3 hover:bg-surface-container-high transition-colors active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-3xl">add</span>
            Log Meal
          </button>
        </div>
      )}
    </main>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MacroBadge({ label, value, unit, color }) {
  if (!value) return (
    <div className="flex flex-col">
      <span className={`font-h2 text-[18px] ${color}`}>—</span>
      <span className="text-xs text-on-surface-variant">{label}</span>
    </div>
  );
  return (
    <div className="flex flex-col">
      <span className={`font-black text-[18px] ${color}`}>{value}<span className="text-xs font-normal ml-0.5">{unit}</span></span>
      <span className="text-xs text-on-surface-variant">{label}</span>
    </div>
  );
}

function MacroDetail({ label, value, unit, color }) {
  return (
    <div className={`${color} rounded-lg px-3 py-2 text-center`}>
      <p className="font-black text-[16px]">{value}<span className="text-xs font-normal ml-0.5">{unit}</span></p>
      <p className="text-xs font-bold opacity-80">{label}</p>
    </div>
  );
}

function MicroRow({ label, value }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-on-surface-variant">{label}</span>
      <span className="font-bold text-[14px] text-on-surface">{value}</span>
    </div>
  );
}

function MicroInput({ label, placeholder, value, onChange }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={`micro-${label}`} className="text-xs font-bold text-on-surface-variant">{label}</label>
      <input
        id={`micro-${label}`} type="number" placeholder={placeholder} min="0"
        className="input-field text-[14px] py-2"
        value={value} onChange={onChange}
      />
    </div>
  );
}
