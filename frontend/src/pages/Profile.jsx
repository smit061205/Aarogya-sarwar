import { useState } from 'react';

const PROFILE_KEY = 'aarogya_profile';

const DEFAULT_PROFILE = {
  name: 'Jenish',
  age: '',
  bloodType: '',
  phone: '',
  emergencyContact: '',
  emergencyPhone: '',
  doctorName: '',
  allergies: '',
  conditions: '',
};

function loadProfile() {
  try {
    return { ...DEFAULT_PROFILE, ...JSON.parse(localStorage.getItem(PROFILE_KEY)) };
  } catch {
    return DEFAULT_PROFILE;
  }
}

function saveProfile(profile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

// Pull live stats from localStorage
function getStats() {
  try {
    const meds = JSON.parse(localStorage.getItem('aarogya_medications') || '[]');
    const meals = JSON.parse(localStorage.getItem('aarogya_meals') || '[]');
    const takenMeds = meds.filter((m) => m.taken).length;
    const totalCal = meals.reduce((s, m) => s + (Number(m.calories) || 0), 0);
    return {
      totalMeds: meds.length,
      takenMeds,
      totalMeals: meals.length,
      totalCal,
    };
  } catch {
    return { totalMeds: 0, takenMeds: 0, totalMeals: 0, totalCal: 0 };
  }
}

const BLOOD_TYPES = ['', 'A+', 'A−', 'B+', 'B−', 'AB+', 'AB−', 'O+', 'O−'];

export default function Profile() {
  const [profile, setProfile] = useState(loadProfile);
  const [saved, setSaved] = useState(false);
  const [editing, setEditing] = useState(false);

  const stats = getStats();

  const handleChange = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    saveProfile(profile);
    setSaved(true);
    setEditing(false);
    setTimeout(() => setSaved(false), 3000);
  };

  const initials = profile.name
    ? profile.name.trim().split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : 'P';

  return (
    <main className="flex flex-col gap-stack-md mt-4 pb-16">

      {/* Avatar + Name Hero */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-6 flex flex-col items-center text-center gap-3">
        <div className="w-24 h-24 rounded-full bg-primary-container flex items-center justify-center shadow-md">
          <span className="text-[36px] font-black text-on-primary select-none">{initials}</span>
        </div>
        <div>
          <h1 className="font-h1 text-h1 text-on-surface">{profile.name || 'Your Name'}</h1>
          {profile.conditions && (
            <p className="font-body-md text-sm text-on-surface-variant mt-1">{profile.conditions}</p>
          )}
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-2 bg-primary text-on-primary px-5 py-2.5 rounded-full font-button text-sm shadow hover:bg-on-primary-fixed-variant transition-colors active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">edit</span>
            Edit Profile
          </button>
        )}
      </div>

      {/* Today's Health Summary Stats */}
      <section>
        <h2 className="font-h2 text-h2 text-on-surface mb-3">Today's Summary</h2>
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon="medication"
            iconBg="bg-primary-fixed"
            iconColor="text-on-primary-fixed"
            label="Medications"
            value={`${stats.takenMeds} / ${stats.totalMeds}`}
            sub="taken today"
          />
          <StatCard
            icon="restaurant"
            iconBg="bg-secondary-fixed"
            iconColor="text-on-secondary-fixed"
            label="Meals"
            value={stats.totalMeals.toString()}
            sub="logged today"
          />
          <StatCard
            icon="local_fire_department"
            iconBg="bg-tertiary-fixed"
            iconColor="text-on-tertiary-fixed"
            label="Calories"
            value={stats.totalCal > 0 ? `${stats.totalCal}` : '—'}
            sub="kcal today"
          />
          <StatCard
            icon="favorite"
            iconBg="bg-error-container"
            iconColor="text-on-error-container"
            label="Status"
            value={stats.takenMeds === stats.totalMeds && stats.totalMeds > 0 ? '✓ Good' : 'Check'}
            sub="health status"
          />
        </div>
      </section>

      {/* Profile Fields */}
      {editing ? (
        <section className="bg-surface-container-lowest rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-5 flex flex-col gap-4">
          <h2 className="font-h2 text-h2 text-on-surface border-b border-outline-variant pb-3">
            Edit Profile
          </h2>

          <Field label="Full Name" required>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g. Jenish Patel"
              className="input-field"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Age">
              <input
                type="number"
                value={profile.age}
                onChange={(e) => handleChange('age', e.target.value)}
                placeholder="e.g. 68"
                min="0"
                max="120"
                className="input-field"
              />
            </Field>
            <Field label="Blood Type">
              <select
                value={profile.bloodType}
                onChange={(e) => handleChange('bloodType', e.target.value)}
                className="input-field"
              >
                {BLOOD_TYPES.map((bt) => (
                  <option key={bt} value={bt}>{bt || 'Select…'}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Your Phone Number">
            <input
              type="tel"
              value={profile.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="e.g. +91 98765 43210"
              className="input-field"
            />
          </Field>

          <Field label="Emergency Contact Name">
            <input
              type="text"
              value={profile.emergencyContact}
              onChange={(e) => handleChange('emergencyContact', e.target.value)}
              placeholder="Family member or caregiver"
              className="input-field"
            />
          </Field>

          <Field label="Emergency Contact Phone">
            <input
              type="tel"
              value={profile.emergencyPhone}
              onChange={(e) => handleChange('emergencyPhone', e.target.value)}
              placeholder="e.g. +91 98765 12345"
              className="input-field"
            />
          </Field>

          <Field label="Doctor's Name">
            <input
              type="text"
              value={profile.doctorName}
              onChange={(e) => handleChange('doctorName', e.target.value)}
              placeholder="e.g. Dr. Ramesh Shah"
              className="input-field"
            />
          </Field>

          <Field label="Known Allergies">
            <input
              type="text"
              value={profile.allergies}
              onChange={(e) => handleChange('allergies', e.target.value)}
              placeholder="e.g. Penicillin, Dust"
              className="input-field"
            />
          </Field>

          <Field label="Medical Conditions">
            <input
              type="text"
              value={profile.conditions}
              onChange={(e) => handleChange('conditions', e.target.value)}
              placeholder="e.g. Hypertension, Type 2 Diabetes"
              className="input-field"
            />
          </Field>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => { setEditing(false); setProfile(loadProfile()); }}
              className="flex-1 bg-surface-container p-3 rounded-lg font-button text-on-surface hover:bg-surface-dim transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 bg-primary text-on-primary rounded-lg font-button p-3 shadow hover:bg-on-primary-fixed-variant transition-colors"
            >
              Save Profile
            </button>
          </div>
        </section>
      ) : (
        <section className="bg-surface-container-lowest rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-5 flex flex-col gap-3">
          <h2 className="font-h2 text-h2 text-on-surface border-b border-outline-variant pb-3">
            Personal Details
          </h2>
          <InfoRow icon="person" label="Name" value={profile.name} />
          <InfoRow icon="cake" label="Age" value={profile.age ? `${profile.age} years` : null} />
          <InfoRow icon="water_drop" label="Blood Type" value={profile.bloodType} />
          <InfoRow icon="call" label="Phone" value={profile.phone} />
          <InfoRow icon="emergency_home" label="Emergency Contact" value={profile.emergencyContact} />
          <InfoRow icon="call" label="Emergency Phone" value={profile.emergencyPhone} />
          <InfoRow icon="stethoscope" label="Doctor" value={profile.doctorName} />
          <InfoRow icon="warning" label="Allergies" value={profile.allergies} />
          <InfoRow icon="monitor_heart" label="Conditions" value={profile.conditions} />
        </section>
      )}

      {/* Save confirmation toast */}
      {saved && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 bg-secondary text-on-secondary px-6 py-3 rounded-full shadow-lg font-button text-sm flex items-center gap-2 z-50 animate-bounce">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          Profile saved!
        </div>
      )}
    </main>
  );
}

function StatCard({ icon, iconBg, iconColor, label, value, sub }) {
  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-4 flex flex-col gap-2">
      <div className={`w-10 h-10 rounded-full ${iconBg} flex items-center justify-center`}>
        <span className={`material-symbols-outlined text-[20px] ${iconColor}`} style={{ fontVariationSettings: "'FILL' 1" }}>
          {icon}
        </span>
      </div>
      <div>
        <p className="font-label-bold text-label-bold text-on-surface">{value}</p>
        <p className="text-xs text-on-surface-variant">{sub}</p>
      </div>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="font-label-bold text-sm text-on-surface-variant">
        {label}{required && <span className="text-error ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-1.5 border-b border-outline-variant/20 last:border-0">
      <span className="material-symbols-outlined text-primary text-[20px] mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>
        {icon}
      </span>
      <div className="flex-1">
        <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wide">{label}</p>
        <p className="font-body-md text-[16px] text-on-surface mt-0.5">{value}</p>
      </div>
    </div>
  );
}
