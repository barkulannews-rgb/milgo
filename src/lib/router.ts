import { useCallback, useEffect, useState } from 'react';

// Hash routes (e.g. "#/shop/men") so every page has its own address: refresh keeps you where you are,
// the browser Back button returns to the previous page, and links can be shared. Hash URLs need no
// server rewrite rules, so they work on any static host.

export type PolicyKey = 'about' | 'authenticity' | 'shipping' | 'returns';
const POLICIES: PolicyKey[] = ['about', 'authenticity', 'shipping', 'returns'];

export type Route =
  | { name: 'home' }
  | { name: 'shop'; gender?: string; family?: string }
  | { name: 'product'; id: string }
  | { name: 'checkout' }
  | { name: 'track'; orderId?: string }
  | { name: 'page'; page: PolicyKey }
  | { name: 'login'; next?: string }
  | { name: 'admin'; tab: string };

export type ScrollIntent = 'top' | 'catalog' | 'none';

export function parseRoute(hash: string): Route {
  const [path, query = ''] = hash.replace(/^#/, '').split('?');
  const parts = path.split('/').filter(Boolean).map(decodeURIComponent);
  const params = new URLSearchParams(query);
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
    case 'staff-login':
      return { name: 'login', next: params.get('next') ?? undefined };
    case 'admin':
      return { name: 'admin', tab: parts[1] ?? 'dashboard' };
    default:
      return POLICIES.includes(parts[0] as PolicyKey) ? { name: 'page', page: parts[0] as PolicyKey } : { name: 'home' };
  }
}

interface HistoryState {
  milgo: true;
  depth: number; // how many in-app pages sit behind this one
}

const currentDepth = () => (window.history.state as HistoryState | null)?.depth ?? 0;

export function useRouter() {
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.hash));
  // Bumped on every navigation (including Back/Forward) so views can re-apply route-driven state
  const [navKey, setNavKey] = useState(0);
  const [scroll, setScroll] = useState<{ intent: ScrollIntent; key: number }>({ intent: 'none', key: 0 });

  useEffect(() => {
    if (!(window.history.state as HistoryState | null)?.milgo) {
      window.history.replaceState({ milgo: true, depth: 0 } satisfies HistoryState, '');
    }
    // Back/Forward and hand-edited URLs: the browser restores the previous scroll position itself
    const onPop = () => {
      setRoute(parseRoute(window.location.hash));
      setNavKey((k) => k + 1);
    };
    window.addEventListener('popstate', onPop);
    window.addEventListener('hashchange', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
      window.removeEventListener('hashchange', onPop);
    };
  }, []);

  const navigate = useCallback((path: string, opts: { replace?: boolean; scroll?: ScrollIntent } = {}) => {
    const url = `#${path.startsWith('/') ? path : `/${path}`}`;
    const state: HistoryState = { milgo: true, depth: opts.replace ? currentDepth() : currentDepth() + 1 };
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
