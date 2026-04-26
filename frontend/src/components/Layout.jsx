import { useEffect } from 'react';
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

  // Request notification permission once
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);
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
        className="bg-white dark:bg-slate-900 border-b-2 border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.05)] flex justify-between items-center h-[72px] w-full px-4 md:px-8 fixed top-0 z-50 transition-all"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        {/* Left: Mobile back button or Desktop Logo */}
        <div className="flex-1 flex justify-start items-center">

          <div
            className="hidden md:block text-[22px] font-black text-blue-800 cursor-pointer select-none tracking-tight"
            onClick={() => navigate('/')}
            aria-label="HealthAssist Home"
          >
            HealthAssist
          </div>
        </div>

        {/* Center: Mobile Logo or Desktop Nav */}
        <div className="flex justify-center items-center flex-shrink-0">
          <div
            className="md:hidden text-xl font-black text-blue-800 cursor-pointer select-none"
            onClick={() => navigate('/')}
            aria-label="HealthAssist Home"
          >
            HealthAssist
          </div>
          
          <nav className="hidden md:flex items-center gap-1 bg-slate-50/80 px-2 py-1.5 rounded-2xl border border-slate-100/50 backdrop-blur-sm">
            <DesktopTabItem icon="home"       label="Home"  active={isActive('/')}            onClick={() => navigate('/')} />
            <DesktopTabItem icon="medication" label="Meds"  active={isActive('/medications')} onClick={() => navigate('/medications')} />
            <DesktopTabItem icon="restaurant" label="Meals" active={isActive('/meals')}       onClick={() => navigate('/meals')} />
            <DesktopTabItem icon="chat"       label="Chat"  active={isActive('/chat')}        onClick={() => navigate('/chat')} />
            <div className="w-px h-6 bg-slate-200 mx-1"></div>
            <a
              href="tel:108"
              aria-label="Emergency Call 108"
              className="flex items-center gap-1.5 text-error hover:bg-error-container/30 px-4 py-2 rounded-xl transition-all font-['Public_Sans'] font-bold text-[14px]"
            >
              <span className="material-symbols-outlined text-[20px]" style={{fontVariationSettings:"'FILL' 1"}}>emergency</span>
              SOS
            </a>
          </nav>
        </div>

        {/* Right: Profile avatar button */}
        <div className="flex-1 flex justify-end items-center">
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
        </div>
      </header>

      {/* Page content */}
      <div 
        className="flex-1 w-full max-w-container-max mx-auto flex flex-col items-center px-margin-mobile md:px-margin-desktop pb-[calc(120px+env(safe-area-inset-bottom))] md:pb-[calc(32px+env(safe-area-inset-bottom))]"
        style={{
          paddingTop: 'calc(88px + env(safe-area-inset-top))',
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

function DesktopTabItem({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      aria-label={label}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl cursor-pointer transition-all font-['Public_Sans'] text-[14px] font-bold ${
        active
          ? 'bg-white text-blue-700 shadow-sm border border-slate-200/60'
          : 'text-slate-500 hover:bg-slate-100/50 hover:text-slate-800 border border-transparent'
      }`}
    >
      <span
        className="material-symbols-outlined text-[20px]"
        aria-hidden="true"
        style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
      >
        {icon}
      </span>
      <span>{label}</span>
    </button>
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

