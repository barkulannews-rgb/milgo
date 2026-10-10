import React, { useState } from 'react';
import { ArrowLeft, Eye, EyeOff, Sun, Moon } from 'lucide-react';
import { Language, StaffUser, StoreSettings } from '../../types';
import { storeRepo } from '../../lib/storage';
import { getTranslation } from '../../lib/translations';
import { Logo } from '../brand/Logo';

interface AdminLoginProps {
  settings: StoreSettings;
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  theme: 'night' | 'light';
  onToggleTheme: () => void;
  onLoginSuccess: (user: StaffUser) => void;
  onBackToStore: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({
  settings,
  lang,
  onLanguageChange,
  theme,
  onToggleTheme,
  onLoginSuccess,
  onBackToStore,
}) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDirectory, setShowDirectory] = useState(false);

  const staffMembers = storeRepo.getStaff();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    const result = await storeRepo.login(identifier, password);
    setIsLoading(false);
    if (result.success && result.staff) onLoginSuccess(result.staff);
    else setError(result.error || getTranslation(lang, 'invalidCredentials'));
  };

  const fillCredentials = (email: string, pass: string) => {
    setIdentifier(email);
    setPassword(pass);
    setError(null);
  };

  const inputClass =
    'w-full bg-transparent border-b border-line-strong focus:border-fg text-sm text-fg px-0 py-2.5 outline-none transition-colors placeholder-fg-4';

  return (
    <div className="min-h-screen bg-canvas text-fg flex flex-col">
      <header className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
        <button
          onClick={onBackToStore}
          className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-fg-3 hover:text-fg transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
          <span>{getTranslation(lang, 'returnToStore')}</span>
        </button>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onLanguageChange(lang === 'so' ? 'en' : 'so')}
            className="px-2 py-1 text-xs tracking-[0.14em] text-fg-2 hover:text-fg transition-colors cursor-pointer"
            aria-label="Language"
          >
            {lang === 'so' ? 'EN' : 'SO'}
          </button>
          <button
            onClick={onToggleTheme}
            className="p-2 text-fg-2 hover:text-fg transition-colors cursor-pointer"
            aria-label={theme === 'night' ? 'Light mode' : 'Dark mode'}
          >
            {theme === 'night' ? <Sun className="w-4 h-4" strokeWidth={1.5} /> : <Moon className="w-4 h-4" strokeWidth={1.5} />}
          </button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 pb-16">
        <div className="w-full max-w-sm">
          <div className="text-center mb-10">
            <h1 className="flex justify-center">
              <Logo name={settings.storeName} size="lg" />
            </h1>
            <p className="text-sm text-fg-3 mt-2">{getTranslation(lang, 'staffLoginSub')}</p>
          </div>

          {error && <p className="mb-6 text-sm text-red-600 text-center animate-fadeIn">{error}</p>}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-[11px] uppercase tracking-[0.14em] text-fg-3 mb-1">{getTranslation(lang, 'emailOrUsername')}</label>
              <input
                type="text"
                required
                autoComplete="username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="owner@dkperfume.com"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-[0.14em] text-fg-3 mb-1">{getTranslation(lang, 'password')}</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputClass} pr-8`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-fg-3 hover:text-fg transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" strokeWidth={1.5} /> : <Eye className="w-4 h-4" strokeWidth={1.5} />}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-fg-3">
              <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="accent-gold" />
              <span>{getTranslation(lang, 'rememberMe')}</span>
            </label>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-inverse hover:bg-inverse-hover text-on-inverse text-xs uppercase tracking-[0.16em] transition-colors cursor-pointer disabled:opacity-50"
            >
              {isLoading ? getTranslation(lang, 'signingIn') : getTranslation(lang, 'signInBtn')}
            </button>
          </form>

          {!storeRepo.isServerMode() && (
          <div className="mt-10 text-center">
            <button
              type="button"
              onClick={() => setShowDirectory(!showDirectory)}
              className="text-xs text-fg-3 hover:text-fg underline underline-offset-4 transition-colors cursor-pointer"
            >
              {getTranslation(lang, 'authorizedStaffList')}
            </button>

            {showDirectory && (
              <div className="mt-4 border-t border-line divide-y divide-line text-left text-xs animate-fadeIn">
                {staffMembers.map((s) => {
                  const pass = s.password || (s.role === 'owner' ? 'admin' : s.role);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => fillCredentials(s.email, pass)}
                      className="w-full py-2.5 flex items-center justify-between hover:text-fg text-fg-2 cursor-pointer transition-colors"
                    >
                      <span className="truncate">{s.name}</span>
                      <span className="text-fg-3 capitalize ml-3 shrink-0">{s.role}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          )}
        </div>
      </main>
    </div>
  );
};
