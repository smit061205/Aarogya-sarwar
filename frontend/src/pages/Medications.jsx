import { useState, useEffect } from 'react';

const STORAGE_KEY = 'aarogya_medications';

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

const getTodayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

export default function Medications() {
  const [meds, setMeds] = useState(loadMeds);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMed, setNewMed] = useState({ name: '', dosage: '', time: '', date: getTodayStr() });

  const handleAddMed = (e) => {
    e.preventDefault();
    if (!newMed.name.trim()) return;
    const med = {
      id: Date.now().toString(),
      name: newMed.name.trim(),
      dosage: newMed.dosage.trim(),
      time: newMed.time,
      time: newMed.time,
      date: newMed.date || getTodayStr(),
      taken: false,
    };
    const updated = [...meds, med];
    setMeds(updated);
    saveMeds(updated);
    setNewMed({ name: '', dosage: '', time: '', date: getTodayStr() });
    setShowAddForm(false);
  };

  const handleToggleTaken = (id) => {
    const updated = meds.map((m) =>
      m.id === id ? { ...m, taken: !m.taken } : m
    );
    setMeds(updated);
    saveMeds(updated);
  };

  const handleDelete = (id) => {
    const updated = meds.filter((m) => m.id !== id);
    setMeds(updated);
    saveMeds(updated);
  };

  return (
    <main className="flex flex-col gap-stack-md mt-4">
      <div className="mb-unit">
        <h1 className="font-h1 text-h1 text-on-surface">Today's Schedule</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant mt-1">
          Please take your medications as prescribed.
        </p>
      </div>

      {meds.length === 0 && !showAddForm && (
        <div className="text-center text-on-surface-variant py-8 bg-surface-container-low rounded-2xl border border-outline-variant/20">
          <span className="material-symbols-outlined text-[48px] text-outline mb-2 block">medication</span>
          <p className="font-body-md text-body-md">No medications added yet.</p>
        </div>
      )}

      {meds.map((med) => (
        <article
          key={med.id}
          className="bg-surface-container-lowest rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-outline-variant/20 p-stack-md flex flex-col gap-stack-sm hover:shadow-[0_8px_30px_rgba(0,0,0,0.10)] transition-shadow"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-unit">
              <span
                className="material-symbols-outlined text-primary text-2xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                schedule
              </span>
              <span className="font-label-bold text-label-bold text-primary">{med.date ? `${med.date} ` : ''}{med.time || 'No time set'}</span>
            </div>
            <button
              onClick={() => handleDelete(med.id)}
              className="text-outline hover:text-error transition-colors p-1 rounded-full hover:bg-error-container"
              aria-label="Delete medication"
            >
              <span className="material-symbols-outlined text-[20px]">delete</span>
            </button>
          </div>

          <div className="flex justify-between items-start">
            <div>
              <h2 className="font-h1 text-h1 text-on-surface">{med.name}</h2>
              {med.dosage && (
                <p className="font-body-lg text-body-lg text-on-surface-variant mt-1">{med.dosage}</p>
              )}
            </div>
            {med.taken && (
              <div className="bg-secondary-fixed text-on-secondary-fixed px-3 py-1 rounded-full font-label-bold text-sm">
                ✓ Taken
              </div>
            )}
          </div>

          <button
            onClick={() => handleToggleTaken(med.id)}
            className={`w-full min-h-[56px] mt-4 font-button text-button rounded-lg flex justify-center items-center gap-2 transition-colors shadow-sm active:scale-[0.98] ${
              med.taken
                ? 'bg-surface-container-highest text-on-surface-variant hover:bg-surface-dim'
                : 'bg-primary text-on-primary hover:bg-on-primary-fixed-variant'
            }`}
          >
            <span className="material-symbols-outlined text-[24px]">
              {med.taken ? 'undo' : 'check_circle'}
            </span>
            {med.taken ? 'Mark as Not Taken' : 'Mark as Taken'}
          </button>
        </article>
      ))}

      {showAddForm ? (
        <form
          onSubmit={handleAddMed}
          className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/30 flex flex-col gap-4 mb-4"
        >
          <h2 className="font-h2 text-h2 text-on-surface border-b border-outline-variant pb-2">
            New Medication
          </h2>

          <div className="flex flex-col gap-1">
            <label className="font-label-bold text-sm text-on-surface-variant">Medicine Name *</label>
            <input
              type="text"
              placeholder="e.g. Aspirin"
              required
              className="p-3 rounded-lg border-2 border-outline-variant focus:border-primary focus:outline-none shadow-sm transition-colors"
              value={newMed.name}
              onChange={(e) => setNewMed({ ...newMed, name: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-label-bold text-sm text-on-surface-variant">Dosage</label>
            <input
              type="text"
              placeholder="e.g. 1 Tablet (81mg)"
              className="p-3 rounded-lg border-2 border-outline-variant focus:border-primary focus:outline-none shadow-sm transition-colors"
              value={newMed.dosage}
              onChange={(e) => setNewMed({ ...newMed, dosage: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="font-label-bold text-sm text-on-surface-variant">Time</label>
              <input
                type="time"
                className="p-3 rounded-lg border-2 border-outline-variant focus:border-primary focus:outline-none shadow-sm transition-colors"
                value={newMed.time}
                onChange={(e) => setNewMed({ ...newMed, time: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-label-bold text-sm text-on-surface-variant">Date</label>
              <input
                type="date"
                required
                className="p-3 rounded-lg border-2 border-outline-variant focus:border-primary focus:outline-none shadow-sm transition-colors"
                value={newMed.date}
                onChange={(e) => setNewMed({ ...newMed, date: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="flex-1 bg-surface-container p-3 rounded-lg font-button text-on-surface hover:bg-surface-dim transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-primary text-on-primary rounded-lg font-button p-3 shadow hover:bg-on-primary-fixed-variant transition-colors"
            >
              Save
            </button>
          </div>
        </form>
      ) : (
        <div className="mt-2 pb-10">
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full min-h-[64px] bg-surface-container border-2 border-dashed border-outline font-button text-button text-on-surface-variant rounded-xl flex justify-center items-center gap-3 hover:bg-surface-container-high transition-colors active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-3xl">add</span>
            Add Medicine
          </button>
        </div>
      )}
    </main>
  );
}
