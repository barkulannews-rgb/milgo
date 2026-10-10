import React, { useState } from 'react';
import {
  DollarSign,
  Plus,
  Trash2,
  Calendar,
  Tag,
  CheckCircle2,
  XCircle,
  X,
} from 'lucide-react';
import { OperatingExpense, Language } from '../../types';
import { storeRepo } from '../../lib/storage';
import { getTranslation } from '../../lib/translations';

import { formatMoney } from '../../lib/money';
interface AdminExpensesProps {
  lang: Language;
}

export const AdminExpenses: React.FC<AdminExpensesProps> = ({ lang }) => {
  const [expenses, setExpenses] = useState<OperatingExpense[]>(storeRepo.getExpenses());
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Expense form
  const [category, setCategory] = useState<OperatingExpense['category']>('Rent');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(100);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [recipient, setRecipient] = useState('');
  const [isPaid, setIsPaid] = useState(true);

  const refreshExpenses = () => {
    setExpenses(storeRepo.getExpenses());
  };

  const totalPaid = expenses.filter((e) => e.isPaid).reduce((sum, e) => sum + e.amount, 0);
  const totalUnpaid = expenses.filter((e) => !e.isPaid).reduce((sum, e) => sum + e.amount, 0);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    const newExp: OperatingExpense = {
      id: `exp-${Date.now()}`,
      reference: `EXP-${new Date().getFullYear()}-${Math.floor(Math.random() * 900 + 100)}`,
      category,
      description: description.trim(),
      amount,
      date,
      paymentMethod,
      isPaid,
      recipient: recipient.trim() || undefined,
      createdBy: storeRepo.getCurrentStaff().name,
    };

    storeRepo.saveExpense(newExp);
    setIsModalOpen(false);
    setDescription('');
    refreshExpenses();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this operating expense record?')) {
      storeRepo.deleteExpense(id);
      refreshExpenses();
    }
  };

  const handleTogglePaid = (exp: OperatingExpense) => {
    storeRepo.saveExpense({ ...exp, isPaid: !exp.isPaid });
    refreshExpenses();
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-line">
        <div>
          <h1 className="font-serif text-3xl text-fg">
            {getTranslation(lang, 'adminExpenses')}
          </h1>
          
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-inverse hover:bg-inverse-hover text-on-inverse text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-gold" />
          <span>{getTranslation(lang, 'newExpense')}</span>
        </button>
      </div>

      {/* Expense KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-surface border border-line">
          <span className="text-xs uppercase tracking-wider text-fg-3 font-semibold block mb-1">
            Total Operating Overhead
          </span>
          <div className="font-mono text-2xl font-bold text-rose-600 tabular-nums">
            {formatMoney((totalPaid + totalUnpaid))}
          </div>
        </div>

        <div className="p-5 bg-surface border border-line">
          <span className="text-xs uppercase tracking-wider text-fg-3 font-semibold block mb-1">
            Paid Expenses
          </span>
          <div className="font-mono text-2xl font-bold text-emerald-700 tabular-nums">
            {formatMoney(totalPaid)}
          </div>
        </div>

        <div className="p-5 bg-surface border border-line">
          <span className="text-xs uppercase tracking-wider text-fg-3 font-semibold block mb-1">
            Unpaid Liabilities
          </span>
          <div className="font-mono text-2xl font-bold text-amber-600 tabular-nums">
            {formatMoney(totalUnpaid)}
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-surface border border-line overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-2 border-b border-line text-fg-2 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Recipient</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-fg-2">
              {expenses.map((e) => (
                <tr key={e.id} className="hover:bg-surface-2 transition-colors">
                  <td className="py-3 px-4 font-mono font-medium text-gold">{e.reference}</td>
                  <td className="py-3 px-4 font-mono text-fg-3">{e.date}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 bg-surface-3 border border-line text-[11px] text-fg-2 font-medium">
                      {e.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-fg max-w-xs">{e.description}</td>
                  <td className="py-3 px-4 text-fg-3">{e.recipient || 'N/A'}</td>
                  <td className="py-3 px-4 font-mono font-bold tabular-nums text-sm text-rose-600">
                    {formatMoney(e.amount)}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleTogglePaid(e)}
                      className={`px-2 py-0.5 text-[10px] font-semibold cursor-pointer ${
                        e.isPaid ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {e.isPaid ? 'Paid' : 'Unpaid (Due)'}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleDelete(e.id)}
                      className="p-1.5 text-fg-4 hover:text-rose-600 hover:bg-surface-3 cursor-pointer transition-colors"
                      title="Delete expense"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal to Record Expense */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="relative w-full max-w-md bg-surface border border-line rounded-2xl p-6 shadow-2xl text-fg">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-line">
              <h3 className="font-serif text-xl font-medium">Record Operating Expense</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-fg-3 hover:text-fg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block text-fg-2 mb-1 font-medium">Expense Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full bg-surface-2 border border-line-strong focus:border-gold p-2.5 text-fg outline-none"
                >
                  <option value="Rent">Rent (Showroom / Warehouse)</option>
                  <option value="Salaries">Staff Salaries & Payroll</option>
                  <option value="Packaging">Luxury Packaging & Atomizers</option>
                  <option value="Marketing & Ads">Marketing, Creator Reviews & Ads</option>
                  <option value="Transportation">Courier Fuel & Transport</option>
                  <option value="Utilities">Electricity & High-speed Internet</option>
                  <option value="Equipment">Store Equipment & Shelving</option>
                  <option value="Other">Other Operating Cost</option>
                </select>
              </div>

              <div>
                <label className="block text-fg-2 mb-1 font-medium">Description *</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Monthly showroom rent payment"
                  className="w-full bg-surface-2 border border-line-strong focus:border-gold p-2.5 text-fg outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-fg-2 mb-1 font-medium">Amount (£) *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    required
                    value={amount}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-surface-2 border border-line-strong focus:border-gold p-2.5 text-fg font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block text-fg-2 mb-1 font-medium">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-surface-2 border border-line-strong focus:border-gold p-2.5 text-fg font-mono outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-fg-2 mb-1 font-medium">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-surface-2 border border-line-strong focus:border-gold p-2.5 text-fg outline-none"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="EVC Plus">EVC Plus</option>
                    <option value="Zaad">Zaad</option>
                    <option value="Cash on Delivery">Cash / Petty Cash</option>
                  </select>
                </div>

                <div>
                  <label className="block text-fg-2 mb-1 font-medium">Recipient / Vendor</label>
                  <input
                    type="text"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="e.g. Landlord / Staff"
                    className="w-full bg-surface-2 border border-line-strong focus:border-gold p-2.5 text-fg outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isPaid"
                  checked={isPaid}
                  onChange={(e) => setIsPaid(e.target.checked)}
                  className="accent-gold"
                />
                <label htmlFor="isPaid" className="text-fg-2 cursor-pointer">
                  Payment already disbursed (Mark as Paid)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-surface-3 hover:bg-line text-fg-2 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-inverse hover:bg-inverse-hover text-on-inverse font-semibold cursor-pointer transition-colors"
                >
                  Record Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
