import { useCallback, useEffect, useState } from 'react';

// Clean URLs (e.g. /shop/men, /admin/orders) through the History API: refresh keeps you where you are,
// the browser Back button returns to the previous page, and links can be shared. The server sends
// index.html for any path that is not a real file (see public/.htaccess and Vite's dev fallback).
// Old hash links (/#/shop/men) from before the switch are converted on load.

export type PolicyKey = 'about' | 'authenticity' | 'shipping' | 'returns';
const POLICIES: PolicyKey[] = ['about', 'authenticity', 'shipping', 'returns'];

export type Route =
  | { name: 'home' }
  | { name: 'shop'; gender?: string; family?: string }
  | { name: 'product'; id: string }
  | { name: 'checkout' }
  | { name: 'track'; orderId?: string }
  | { name: 'page'; page: PolicyKey }
  | { name: 'admin'; tab: string };

export type ScrollIntent = 'top' | 'catalog' | 'none';

export function parseRoute(pathname: string): Route {
  const parts = pathname.split('/').filter(Boolean).map(decodeURIComponent);
  switch (parts[0]) {
    case undefined:
      return { name: 'home' };
    case 'shop':
      if (parts[1] === 'men' || parts[1] === 'women') return { name: 'shop', gender: parts[1] === 'men' ? 'Men' : 'Women' };
      if (parts[1] === 'family' && parts[2]) return { name: 'shop', family: parts[2] };
      return { name: 'shop' };
    case 'product':
      return parts[1] ? { name: 'product', id: parts[1] } : { name: 'home' };
    case 'checkout':
      return { name: 'checkout' };
    case 'track':
      return { name: 'track', orderId: parts[1] };
    // Staff area: /admin shows the sign-in form until signed in, then the dashboard
    case 'admin':
    case 'staff-login':
      return { name: 'admin', tab: parts[0] === 'admin' && parts[1] ? parts[1] : 'dashboard' };
    default:
      return POLICIES.includes(parts[0] as PolicyKey) ? { name: 'page', page: parts[0] as PolicyKey } : { name: 'home' };
  }
}

interface HistoryState {
  dk: true;
  depth: number; // how many in-app pages sit behind this one
}

const currentDepth = () => (window.history.state as HistoryState | null)?.depth ?? 0;

// Turn a pre-switch hash URL (/#/shop/men) into its clean path (/shop/men)
function upgradeHashUrl(): void {
  const { hash } = window.location;
  if (hash.startsWith('#/')) window.history.replaceState(window.history.state, '', hash.slice(1));
}

export function useRouter() {
  const [route, setRoute] = useState<Route>(() => {
    upgradeHashUrl();
    return parseRoute(window.location.pathname);
  });
  // Bumped on every navigation (including Back/Forward) so views can re-apply route-driven state
  const [navKey, setNavKey] = useState(0);
  const [scroll, setScroll] = useState<{ intent: ScrollIntent; key: number }>({ intent: 'none', key: 0 });

  useEffect(() => {
    if (!(window.history.state as HistoryState | null)?.dk) {
      window.history.replaceState({ dk: true, depth: 0 } satisfies HistoryState, '');
    }
    // Back/Forward: the browser restores the previous scroll position itself
    const onPop = () => {
      upgradeHashUrl();
      setRoute(parseRoute(window.location.pathname));
      setNavKey((k) => k + 1);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = useCallback((path: string, opts: { replace?: boolean; scroll?: ScrollIntent } = {}) => {
    const url = path.startsWith('/') ? path : `/${path}`;
    const state: HistoryState = { dk: true, depth: opts.replace ? currentDepth() : currentDepth() + 1 };
    if (opts.replace) window.history.replaceState(state, '', url);
    else window.history.pushState(state, '', url);
    setRoute(parseRoute(url));
    setNavKey((k) => k + 1);
    setScroll((s) => ({ intent: opts.scroll ?? 'top', key: s.key + 1 }));
  }, []);

  // Close an overlay or leave a page: step back when we came from inside the app, otherwise
  // (opened from a shared link or after refresh) go to the fallback without leaving the site
  const back = useCallback(
    (fallback = '/') => {
      if (currentDepth() > 0) window.history.back();
      else navigate(fallback, { replace: true, scroll: 'none' });
    },
    [navigate]
  );

  return { route, navigate, back, navKey, scroll };
}
