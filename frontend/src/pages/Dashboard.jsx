import { useNavigate } from 'react-router-dom';

function getProfileName() {
  try {
    const p = JSON.parse(localStorage.getItem('aarogya_profile') || '{}');
    return p.name || 'Smit';
  } catch {
    return 'Smit';
  }
}

export default function Dashboard() {
  const navigate = useNavigate();
  const patientName = getProfileName();

  return (
    <>
      <section className="mb-stack-lg flex items-center justify-between mt-4">
        <div>
          <p className="font-body-md text-body-md text-on-surface-variant mb-unit">Welcome back,</p>
          <h1 className="font-h1 text-h1 text-on-surface">Hello, {patientName}</h1>
        </div>
        <div className="w-16 h-16 rounded-full bg-primary-fixed flex items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.05)] border-2 border-surface-container-lowest">
          <span className="material-symbols-outlined text-[32px] text-on-primary-fixed" style={{ fontVariationSettings: "'FILL' 1" }}>face</span>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-margin-mobile md:gap-gutter w-full pb-10">
        <button onClick={() => navigate('/medications')} className="group bg-surface-container-lowest rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.10)] p-4 flex flex-col items-center justify-center text-center aspect-[4/3] transition-all duration-200 active:scale-95 border border-transparent hover:border-primary-fixed-dim">
          <div className="w-14 h-14 rounded-full bg-primary-fixed flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
            <span className="material-symbols-outlined text-[32px] text-on-primary-fixed" style={{ fontVariationSettings: "'FILL' 1" }}>medication</span>
          </div>
          <span className="font-bold text-[16px] text-on-surface">Medications</span>
        </button>

        <button onClick={() => navigate('/meals')} className="group bg-surface-container-lowest rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.10)] p-4 flex flex-col items-center justify-center text-center aspect-[4/3] transition-all duration-200 active:scale-95 border border-transparent hover:border-secondary-fixed-dim">
          <div className="w-14 h-14 rounded-full bg-secondary-fixed flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
            <span className="material-symbols-outlined text-[32px] text-on-secondary-fixed" style={{ fontVariationSettings: "'FILL' 1" }}>restaurant</span>
          </div>
          <span className="font-bold text-[16px] text-on-surface">Meal Log</span>
        </button>

        <button onClick={() => navigate('/chat')} className="group bg-surface-container-lowest rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.10)] p-4 flex flex-col items-center justify-center text-center aspect-[4/3] transition-all duration-200 active:scale-95 border border-transparent hover:border-primary-fixed-dim">
          <div className="w-14 h-14 rounded-full bg-primary-fixed flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
            <span className="material-symbols-outlined text-[32px] text-on-primary-fixed" style={{ fontVariationSettings: "'FILL' 1" }}>chat</span>
          </div>
          <span className="font-bold text-[16px] text-on-surface">Support</span>
        </button>

        <a href="tel:108" className="group bg-error rounded-2xl shadow-[0_8px_30px_rgba(186,26,26,0.25)] hover:shadow-[0_12px_40px_rgba(186,26,26,0.35)] p-4 flex flex-col items-center justify-center text-center aspect-[4/3] transition-all duration-200 active:scale-95 relative overflow-hidden border-4 border-error hover:border-error-container">
          <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
          <span className="material-symbols-outlined text-[48px] text-on-error mb-2 animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>emergency</span>
          <span className="font-bold text-[14px] leading-tight text-on-error uppercase tracking-widest mt-1">Emergency<br/>SOS</span>
        </a>
      </div>
    </>
  );
}
