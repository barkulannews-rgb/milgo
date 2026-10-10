import React, { useState } from 'react';
import { UserPlus, KeyRound, Trash2, X, Eye, EyeOff } from 'lucide-react';
import { StaffUser, StaffRole, Language } from '../../types';
import { storeRepo } from '../../lib/storage';
import { getTranslation } from '../../lib/translations';
import { DEFAULT_ROLE_PERMISSIONS, DelegatedRole, GRANTABLE, Permission, ROLES, roleLabel } from '../../lib/permissions';

interface AdminUsersProps {
  lang: Language;
}

const DELEGATED = ROLES.filter((r) => r.id !== 'owner') as { id: DelegatedRole; en: string; so: string }[];
const inputClass = 'w-full bg-surface-2 border border-line-strong text-sm text-fg p-2.5 outline-none focus:border-fg';
const label = 'block text-[11px] uppercase tracking-[0.14em] text-fg-3 mb-1';

export const AdminUsers: React.FC<AdminUsersProps> = ({ lang }) => {
  const so = lang === 'so';
  const L = so ? 'so' : 'en';
  const me = storeRepo.getCurrentStaff();
  const [staffList, setStaffList] = useState<StaffUser[]>(storeRepo.getStaff());
  const [auditLogs, setAuditLogs] = useState(storeRepo.getAuditLogs());
  const [matrix, setMatrix] = useState<Record<DelegatedRole, Permission[]>>(() => storeRepo.getRolePermissions());
  const [matrixDirty, setMatrixDirty] = useState(false);
  const [notice, setNotice] = useState('');

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [passwordFor, setPasswordFor] = useState<StaffUser | null>(null);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState<StaffRole>('sales');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [updatedPassword, setUpdatedPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const refresh = () => {
    setStaffList(storeRepo.getStaff());
    setAuditLogs(storeRepo.getAuditLogs());
  };

  const flash = (text: string) => {
    setNotice(text);
    setTimeout(() => setNotice(''), 2500);
  };

  const activeOwners = staffList.filter((s) => s.role === 'owner' && s.active).length;
  const isLastOwner = (s: StaffUser) => s.role === 'owner' && s.active && activeOwners <= 1;

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!newName.trim() || !newEmail.trim() || !newPassword.trim()) {
      setFormError(so ? 'Buuxi magaca, email-ka iyo furaha.' : 'Fill in name, email and password.');
      return;
    }
    if (staffList.some((s) => s.email.toLowerCase() === newEmail.trim().toLowerCase())) {
      setFormError(so ? 'Email-kan horay ayuu u jiray.' : 'This email is already used.');
      return;
    }
    const err = await storeRepo.saveStaffUser({
      id: `usr-${Date.now()}`,
      name: newName.trim(),
      email: newEmail.trim().toLowerCase(),
      phone: newPhone.trim(),
      role: newRole,
      password: newPassword.trim(),
      active: true,
    });
    if (err) {
      setFormError(err);
      return;
    }
    refresh();
    setIsAddOpen(false);
    setNewName('');
    setNewEmail('');
    setNewPhone('');
    setNewPassword('');
  };

  const handleRoleChange = async (s: StaffUser, role: StaffRole) => {
    if (isLastOwner(s) && role !== 'owner') {
      flash(so ? 'Ugu yaraan hal milkiile waa inuu jiraa.' : 'The store needs at least one owner.');
      return;
    }
    const err = await storeRepo.saveStaffUser({ ...s, role });
    refresh();
    if (err) return flash(err);
    flash(so ? `${s.name}: ${roleLabel(role, 'so')}` : `${s.name} is now ${roleLabel(role, 'en')}`);
  };

  const handleToggleActive = async (s: StaffUser) => {
    if (isLastOwner(s) || s.id === me.id) return;
    const err = await storeRepo.saveStaffUser({ ...s, active: !s.active });
    refresh();
    if (err) flash(err);
  };

  const handleDelete = async (s: StaffUser) => {
    if (s.role === 'owner' || s.id === me.id) return;
    if (window.confirm(so ? `Ma tirtiraysaa ${s.name}?` : `Remove ${s.name}?`)) {
      await storeRepo.deleteStaffUser(s.id);
      refresh();
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordFor || !updatedPassword.trim()) return;
    const err = await storeRepo.saveStaffUser({ ...passwordFor, password: updatedPassword.trim() });
    if (err) return flash(err);
    refresh();
    setPasswordFor(null);
    setUpdatedPassword('');
    flash(so ? 'Furaha waa la beddelay.' : 'Password updated.');
  };

  const togglePermission = (role: DelegatedRole, perm: Permission) => {
    setMatrix((m) => ({
      ...m,
      [role]: m[role].includes(perm) ? m[role].filter((p) => p !== perm) : [...m[role], perm],
    }));
    setMatrixDirty(true);
  };

  const saveMatrix = () => {
    storeRepo.saveRolePermissions(matrix);
    setMatrixDirty(false);
    refresh();
    flash(so ? 'Ogolaanshaha waa la kaydiyay.' : 'Access saved.');
  };

  const resetMatrix = () => {
    setMatrix(structuredClone(DEFAULT_ROLE_PERMISSIONS));
    setMatrixDirty(true);
  };

  const accessSummary = (role: StaffRole) => {
    if (role === 'owner') return so ? 'Dhammaan' : 'Everything';
    const list = GRANTABLE.filter((g) => matrix[role as DelegatedRole].includes(g.id)).map((g) => g[L]);
    return list.length ? list.join(', ') : so ? 'Waxba' : 'No access';
  };

  return (
    <div className="space-y-10 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-line">
        <h1 className="font-serif text-3xl text-fg">{getTranslation(lang, 'adminUsers')}</h1>
        <button
          onClick={() => {
            setFormError(null);
            setIsAddOpen(true);
          }}
          className="px-4 py-2 bg-inverse hover:bg-inverse-hover text-on-inverse text-xs flex items-center gap-2 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" strokeWidth={1.5} />
          <span>{so ? 'Ku dar shaqaale' : 'Add Staff'}</span>
        </button>
      </div>

      {notice && <p className="text-sm text-emerald-700">{notice}</p>}

      {/* Team */}
      <section>
        <h2 className="font-serif text-2xl text-fg mb-4">{so ? 'Shaqaalaha' : 'Team'}</h2>
        <div className="bg-surface border border-line overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-line text-fg-3 uppercase tracking-[0.12em]">
              <tr>
                <th className="py-3 px-4 font-normal">{so ? 'Magaca' : 'Name'}</th>
                <th className="py-3 px-4 font-normal">{so ? 'Doorka' : 'Role'}</th>
                <th className="py-3 px-4 font-normal">{so ? 'Wuxuu arki karaa' : 'Can access'}</th>
                <th className="py-3 px-4 font-normal">{so ? 'Xaalad' : 'Status'}</th>
                <th className="py-3 px-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {staffList.map((s) => (
                <tr key={s.id} className={s.active ? '' : 'opacity-50'}>
                  <td className="py-3 px-4">
                    <div className="text-fg">
                      {s.name} {s.id === me.id && <span className="text-fg-3">({so ? 'adiga' : 'you'})</span>}
                    </div>
                    <div className="text-fg-3">{s.email}</div>
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={s.role}
                      onChange={(e) => handleRoleChange(s, e.target.value as StaffRole)}
                      disabled={isLastOwner(s)}
                      aria-label={`Role for ${s.name}`}
                      className="bg-surface-2 border border-line-strong text-fg p-1.5 outline-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {ROLES.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r[L]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3 px-4 text-fg-3 max-w-[320px]">
                    <span className="line-clamp-2">{accessSummary(s.role)}</span>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleToggleActive(s)}
                      disabled={isLastOwner(s) || s.id === me.id}
                      className={`underline underline-offset-4 cursor-pointer disabled:no-underline disabled:cursor-default ${s.active ? 'text-emerald-700' : 'text-fg-3'}`}
                    >
                      {s.active ? (so ? 'Shaqaynaya' : 'Active') : so ? 'La joojiyay' : 'Disabled'}
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => {
                          setPasswordFor(s);
                          setUpdatedPassword('');
                        }}
                        className="p-1.5 text-fg-3 hover:text-fg cursor-pointer"
                        aria-label="Reset password"
                      >
                        <KeyRound className="w-3.5 h-3.5" strokeWidth={1.5} />
                      </button>
                      {s.role !== 'owner' && s.id !== me.id && (
                        <button onClick={() => handleDelete(s)} className="p-1.5 text-fg-3 hover:text-red-600 cursor-pointer" aria-label="Remove">
                          <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Access per role */}
      <section>
        <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
          <div>
            <h2 className="font-serif text-2xl text-fg">{so ? 'Ogolaanshaha doorarka' : 'Role Access'}</h2>
            <p className="text-xs text-fg-3 mt-1">
              {so ? 'Milkiiluhu wax walba wuu arkaa. Shaqaalaha, Lacag-bixinta iyo Habaynta waa milkiilaha oo keliya.' : 'Owners see everything. Staff, Payments and Settings are owner-only.'}
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <button onClick={resetMatrix} className="text-fg-3 hover:text-fg underline underline-offset-4 cursor-pointer">
              {so ? 'Kii asalka ahaa' : 'Defaults'}
            </button>
            <button
              onClick={saveMatrix}
              disabled={!matrixDirty}
              className="px-4 py-2 bg-inverse hover:bg-inverse-hover text-on-inverse transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-default"
            >
              {getTranslation(lang, 'saveChanges')}
            </button>
          </div>
        </div>
        <div className="bg-surface border border-line overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="border-b border-line text-fg-3 uppercase tracking-[0.12em]">
              <tr>
                <th className="py-3 px-4 text-left font-normal">{so ? 'Bogga' : 'Access'}</th>
                <th className="py-3 px-3 text-center font-normal">{roleLabel('owner', L)}</th>
                {DELEGATED.map((r) => (
                  <th key={r.id} className="py-3 px-3 text-center font-normal">
                    {r[L]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {GRANTABLE.map((g) => (
                <tr key={g.id} className="hover:bg-surface-2">
                  <td className="py-2.5 px-4 text-fg">{g[L]}</td>
                  <td className="py-2.5 px-3 text-center">
                    <input type="checkbox" checked disabled className="accent-gold opacity-60" aria-label={`Owner: ${g.en}`} />
                  </td>
                  {DELEGATED.map((r) => (
                    <td key={r.id} className="py-2.5 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={matrix[r.id].includes(g.id)}
                        onChange={() => togglePermission(r.id, g.id)}
                        className="accent-gold cursor-pointer"
                        aria-label={`${r.en}: ${g.en}`}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-fg-3 mt-2">
          {so ? 'Gaarsiiyuhu wuxuu arkaa dalabyada loo xilsaaray oo keliya.' : 'Delivery staff only see orders assigned to them.'}
        </p>
      </section>

      {/* Activity log */}
      <section>
        <h2 className="font-serif text-2xl text-fg mb-4">{so ? 'Diiwaanka Falalka' : 'Activity Log'}</h2>
        <div className="bg-surface border border-line overflow-x-auto max-h-96">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface border-b border-line text-fg-3 uppercase tracking-[0.12em] sticky top-0">
              <tr>
                <th className="py-3 px-4 font-normal">{so ? 'Waqtiga' : 'Time'}</th>
                <th className="py-3 px-4 font-normal">{so ? 'Qofka' : 'Who'}</th>
                <th className="py-3 px-4 font-normal">{so ? 'Falka' : 'Action'}</th>
                <th className="py-3 px-4 font-normal">{so ? 'Faahfaahin' : 'Details'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {auditLogs.map((log) => (
                <tr key={log.id}>
                  <td className="py-2.5 px-4 font-mono text-fg-3 whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="py-2.5 px-4 text-fg">{log.userName}</td>
                  <td className="py-2.5 px-4 text-fg-2">{log.action}</td>
                  <td className="py-2.5 px-4 text-fg-3 max-w-sm truncate">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Add staff */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-surface max-w-md w-full p-7 animate-fadeIn shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-serif text-2xl text-fg">{so ? 'Shaqaale cusub' : 'New Staff Member'}</h3>
              <button onClick={() => setIsAddOpen(false)} className="text-fg-3 hover:text-fg cursor-pointer" aria-label="Close">
                <X className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </div>
            {formError && <p className="mb-4 text-xs text-red-600">{formError}</p>}
            <form onSubmit={handleAddStaff} className="space-y-4">
              <div>
                <span className={label}>{so ? 'Magaca' : 'Full name'}</span>
                <input value={newName} onChange={(e) => setNewName(e.target.value)} className={inputClass} />
              </div>
              <div>
                <span className={label}>Email</span>
                <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className={inputClass} />
              </div>
              <div>
                <span className={label}>{so ? 'Taleefan' : 'Phone'}</span>
                <input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="+44 / +252" className={inputClass} />
              </div>
              <div>
                <span className={label}>{so ? 'Doorka' : 'Role'}</span>
                <select value={newRole} onChange={(e) => setNewRole(e.target.value as StaffRole)} className={inputClass}>
                  {ROLES.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r[L]}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-fg-3 mt-1">{accessSummary(newRole)}</p>
              </div>
              <div>
                <span className={label}>{so ? 'Furaha sirta' : 'Password'}</span>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={`${inputClass} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-3 hover:text-fg"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" strokeWidth={1.5} /> : <Eye className="w-4 h-4" strokeWidth={1.5} />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-2 text-xs">
                <button type="button" onClick={() => setIsAddOpen(false)} className="px-4 py-2 text-fg-3 hover:text-fg cursor-pointer">
                  {getTranslation(lang, 'cancel')}
                </button>
                <button type="submit" className="px-5 py-2 bg-inverse hover:bg-inverse-hover text-on-inverse cursor-pointer">
                  {getTranslation(lang, 'saveChanges')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset password */}
      {passwordFor && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-surface max-w-sm w-full p-7 animate-fadeIn shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-2xl text-fg">{so ? 'Furaha cusub' : 'New Password'}</h3>
              <button onClick={() => setPasswordFor(null)} className="text-fg-3 hover:text-fg cursor-pointer" aria-label="Close">
                <X className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </div>
            <p className="text-xs text-fg-3 mb-4">{passwordFor.name}</p>
            <form onSubmit={handleSavePassword} className="space-y-4">
              <input type="password" value={updatedPassword} onChange={(e) => setUpdatedPassword(e.target.value)} className={inputClass} autoFocus />
              <div className="flex items-center justify-end gap-3 text-xs">
                <button type="button" onClick={() => setPasswordFor(null)} className="px-3 py-1.5 text-fg-3 hover:text-fg cursor-pointer">
                  {getTranslation(lang, 'cancel')}
                </button>
                <button type="submit" className="px-4 py-1.5 bg-inverse hover:bg-inverse-hover text-on-inverse cursor-pointer">
                  {getTranslation(lang, 'saveChanges')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
