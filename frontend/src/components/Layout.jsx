import { Outlet, useNavigate, useLocation } from 'react-router-dom';

function getProfileName() {
  try {
    const p = JSON.parse(localStorage.getItem('aarogya_profile') || '{}');
    return p.name || 'Smit';
  } catch {
    return 'Smit';
  }
}

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const profileName = getProfileName();
  const initials = profileName
    .trim()
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      {/* Top header */}
      <header 
        className="bg-white dark:bg-slate-900 border-b-2 border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.05)] flex justify-between items-center h-[72px] w-full px-6 fixed top-0 z-50 transition-all"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <button
          onClick={() => navigate(-1)}
          aria-label="Navigate Back"
          className="text-slate-500 hover:bg-slate-50 active:scale-95 transition-transform duration-200 p-2 rounded-full flex items-center justify-center min-w-[44px] min-h-[44px]"
        >
          <span className="material-symbols-outlined text-[28px]" aria-hidden="true">arrow_back</span>
        </button>

        <div
          className="text-xl font-black text-blue-800 cursor-pointer select-none"
          onClick={() => navigate('/')}
          aria-label="HealthAssist Home"
        >
          HealthAssist
        </div>

        {/* Profile avatar button */}
        <button
          onClick={() => navigate('/profile')}
          aria-label={`View Profile for ${profileName}`}
          className={`w-11 h-11 rounded-full flex items-center justify-center font-black text-sm transition-all active:scale-95 shadow-sm min-w-[44px] min-h-[44px] ${
            isActive('/profile')
              ? 'bg-primary text-on-primary'
              : 'bg-primary-fixed text-on-primary-fixed hover:bg-primary-fixed-dim'
          }`}
        >
          {initials}
        </button>
      </header>

      {/* Page content */}
      <div 
        className="flex-1 w-full max-w-container-max mx-auto flex flex-col items-center px-margin-mobile md:px-margin-desktop"
        style={{
          paddingTop: 'calc(88px + env(safe-area-inset-top))',
          paddingBottom: 'calc(120px + env(safe-area-inset-bottom))'
        }}
      >
        <div className="w-full max-w-[800px] h-full flex flex-col">
          <Outlet />
        </div>
      </div>

      {/* Bottom nav */}
      <nav 
        className="bg-white dark:bg-slate-900 fixed bottom-0 left-0 w-full z-50 border-t-2 border-slate-100 rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.05)] flex justify-around items-center md:hidden"
        style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom))', minHeight: 'calc(96px + env(safe-area-inset-bottom))' }}
      >
        <TabItem icon="home"       label="Home"  active={isActive('/')}            onClick={() => navigate('/')} />
        <TabItem icon="medication" label="Meds"  active={isActive('/medications')} onClick={() => navigate('/medications')} />
        <TabItem icon="restaurant" label="Meals" active={isActive('/meals')}       onClick={() => navigate('/meals')} />
        <TabItem icon="chat"       label="Chat"  active={isActive('/chat')}        onClick={() => navigate('/chat')} />

        {/* SOS — never navigates, always calls */}
        <a
          href="tel:108"
          aria-label="Emergency Call 108"
          className="flex flex-col items-center justify-center text-error min-h-[64px] min-w-[72px] rounded-2xl hover:bg-error-container/30 transition-all font-['Public_Sans'] text-[13px] font-bold"
        >
          <span className="material-symbols-outlined text-[28px] mb-1 animate-pulse" aria-hidden="true">emergency</span>
          SOS
        </a>
      </nav>
    </>
  );
}

function TabItem({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      aria-label={label}
      className={`flex flex-col items-center justify-center min-h-[64px] min-w-[72px] rounded-2xl cursor-pointer transition-all font-['Public_Sans'] text-[13px] font-bold ${
        active
          ? 'bg-blue-50 text-blue-700'
          : 'text-slate-500 hover:bg-slate-50'
      }`}
    >
      <span
        className="material-symbols-outlined text-[28px] mb-1"
        aria-hidden="true"
        style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
      >
        {icon}
      </span>
      <span>{label}</span>
    </button>
  );
}
