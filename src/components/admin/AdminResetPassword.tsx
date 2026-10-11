import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Language, StoreSettings } from '../../types';
import { api } from '../../lib/api';
import { Logo } from '../brand/Logo';

interface AdminResetPasswordProps {
  settings: StoreSettings;
  lang: Language;
  onDone: () => void; // go to the sign-in page
}

// Opened from the emailed link (/reset-password?token=...): choose a new staff password
export const AdminResetPassword: React.FC<AdminResetPasswordProps> = ({ settings, lang, onDone }) => {
  const so = lang === 'so';
  const [token] = useState(() => new URLSearchParams(window.location.search).get('token') ?? '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const inputClass =
    'w-full bg-transparent border-b border-line-strong focus:border-fg text-sm text-fg px-0 py-2.5 outline-none transition-colors placeholder-fg-4';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return setError(so ? 'Password-ku ha ahaado ugu yaraan 8 xaraf.' : 'Use at least 8 characters.');
    if (password !== confirm) return setError(so ? 'Labada password isma laha.' : 'The two passwords do not match.');
    setBusy(true);
    try {
      await api.passwordReset(token, password);
      setDone(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-fg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="flex justify-center">
            <Logo name={settings.storeName} size="lg" />
          </h1>
          <p className="text-sm text-fg-3 mt-2">{so ? 'Samee password cusub' : 'Choose a new password'}</p>
        </div>

        {done ? (
          <div className="text-center space-y-6">
            <p className="text-sm text-fg-2">{so ? 'Password-ka waa la beddelay. Hadda ku gal kan cusub.' : 'Your password has been changed. Sign in with the new one.'}</p>
            <button onClick={onDone} className="w-full py-3.5 bg-inverse hover:bg-inverse-hover text-on-inverse text-xs uppercase tracking-[0.16em] cursor-pointer">
              {so ? 'Gal' : 'Sign in'}
            </button>
          </div>
        ) : !token ? (
          <div className="text-center space-y-6">
            <p className="text-sm text-fg-2">{so ? 'Linkigan ma shaqeynayo. Codso mid cusub.' : 'This link is not valid. Ask for a new one.'}</p>
            <button onClick={onDone} className="text-xs text-fg-3 hover:text-fg underline underline-offset-4 cursor-pointer">
              {so ? 'Bogga login-ka' : 'Go to sign in'}
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-6">
            {error && <p className="text-sm text-red-600 text-center">{error}</p>}
            <div>
              <label className="block text-[11px] uppercase tracking-[0.14em] text-fg-3 mb-1">{so ? 'Password cusub' : 'New password'}</label>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputClass} pr-8`}
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-fg-3 hover:text-fg cursor-pointer"
                  aria-label={show ? 'Hide password' : 'Show password'}
                >
                  {show ? <EyeOff className="w-4 h-4" strokeWidth={1.5} /> : <Eye className="w-4 h-4" strokeWidth={1.5} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-[0.14em] text-fg-3 mb-1">{so ? 'Ku celi password-ka' : 'Repeat password'}</label>
              <input
                type={show ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={inputClass}
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="w-full py-3.5 bg-inverse hover:bg-inverse-hover text-on-inverse text-xs uppercase tracking-[0.16em] cursor-pointer disabled:opacity-50"
            >
              {busy ? '…' : so ? 'Kaydi password-ka' : 'Save password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
