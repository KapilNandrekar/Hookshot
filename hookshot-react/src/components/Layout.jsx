import { useEffect, useState } from 'react';
import { PanelLeft, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useThemeMode } from '../context/ThemeContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import LineSidebar from './LineSidebar';
import LightRays from './LightRays';
import ShapeGrid from './ShapeGrid';

const NAV = [
  { to: '/dashboard', label: 'Overview' },
  { to: '/endpoints', label: 'Endpoints' },
  { to: '/events', label: 'Events' },
  { to: '/system', label: 'System Health' },
];
const NAV_LABELS = NAV.map((item) => item.label);

const SIDEBAR_KEY = 'hookshot-sidebar';

function getInitialOpen() {
  try {
    const stored = localStorage.getItem(SIDEBAR_KEY);
    if (stored) return stored === 'open';
  } catch {
    /* ignore */
  }
  return window.innerWidth >= 768; // closed by default on small screens
}

function initialsFromEmail(email) {
  if (!email) return '?';
  const name = email.split('@')[0];
  return name.slice(0, 2).toUpperCase();
}

export default function Layout() {
  const { email, logout } = useAuth();
  const { theme, toggleTheme } = useThemeMode();
  const [open, setOpen] = useState(getInitialOpen);
  const navigate = useNavigate();
const { pathname } = useLocation();
const activeIndex = Math.max(0, NAV.findIndex((n) => pathname.startsWith(n.to)));

  // Remember the sidebar state
  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_KEY, open ? 'open' : 'closed');
    } catch {
      /* ignore */
    }
  }, [open]);

  // Ctrl+B / Cmd+B shortcut
  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
  // Re-measure the background grid after the sidebar finishes sliding
useEffect(() => {
  const id = setTimeout(() => window.dispatchEvent(new Event('resize')), 250);
  return () => clearTimeout(id);
}, [open]);

  return (
    <div className="flex min-h-screen">
      <aside
        className={`sticky top-0 h-screen shrink-0 overflow-hidden bg-card/40 transition-[width] duration-200 ease-in-out ${
          open ? 'w-72 border-r' : 'w-0'
        }`}
        aria-hidden={!open}
        inert={open ? undefined : ''}
      ><div className="pointer-events-none absolute left-0 top-0 h-full w-72 dark:brightness-[2.2] dark:contrast-150">
  <LightRays
  raysOrigin="top-center"
  raysColor="#9CC2FF"
  raysSpeed={1}
  lightSpread={0.6}
  rayLength={2.6}
  fadeDistance={1}
  saturation={1.6}
  followMouse
  mouseInfluence={0.05}
  noiseAmount={0}
  distortion={0}
  lightMode={theme === 'light'}
/>
  </div>
        {/* Fixed-width inner box so content doesn't squish while sliding */}
        <div className="relative z-10 flex h-full w-72 flex-col p-4">
          <div className="flex items-center justify-between pb-5">
            <div className="font-semibold text-base px-2">🪝 Hookshot</div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen(false)}
              aria-label="Close sidebar"
              title="Close sidebar (Ctrl+B)"
              className="text-muted-foreground"
            >
              <PanelLeft className="size-4" />
            </Button>
          </div>

       <div className="flex-1 overflow-y-auto">
  <LineSidebar
    key={activeIndex}
    items={NAV_LABELS}
    defaultActive={activeIndex}
    onItemClick={(index) => navigate(NAV[index].to)}
    accentColor="var(--primary)"
    textColor="var(--muted-foreground)"
    markerColor="var(--ink-faint)"
    markerLength={36}
    maxShift={14}
    fontSize={0.95}
    itemGap={14}
    proximityRadius={80}
  />
</div>

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="justify-start gap-2 mb-2 text-muted-foreground"
          >
            {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 p-2 rounded-md hover:bg-muted text-left w-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs font-medium">
                    {initialsFromEmail(email)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground font-mono truncate flex-1">
                  {email}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-mono text-xs font-normal text-muted-foreground truncate">
                {email}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
      {/* Animated grid background (all pages) */}
<div
  aria-hidden="true"
  className={`pointer-events-none fixed inset-y-0 right-0 z-0 transition-[left] duration-200 ease-in-out ${
    open ? 'left-72' : 'left-0'
  }`}
>
  <ShapeGrid
    direction="diagonal"
    speed={0.4}
    squareSize={44}
    shape="square"
    hoverTrailAmount={6}
    borderColor={theme === 'dark' ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.08)'}
    hoverFillColor={theme === 'dark' ? 'rgba(143, 184, 255, 0.22)' : 'rgba(59, 110, 230, 0.16)'}
  />
</div>

      <main className="relative z-10 min-w-0 flex-1 p-6 sm:p-10 max-w-5xl">
        {/* Fixed-height row so the page doesn't jump when the button appears */}
        <div className="h-9 mb-4 -ml-2">
          {!open && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen(true)}
              aria-label="Open sidebar"
              title="Open sidebar (Ctrl+B)"
              className="text-muted-foreground"
            >
              <PanelLeft className="size-4" />
            </Button>
          )}
        </div>
        <Outlet />
      </main>
    </div>
  );
}