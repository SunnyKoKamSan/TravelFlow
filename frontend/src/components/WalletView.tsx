import { useState } from 'react';

interface Props {
  expenses: any[];
  balances: Record<string, number>;
  settings: any;
  realTimeRate: number;
  handleDeleteExpense: (id: number) => void;
  addExpense?: (expense: { title: string; amount: number; payer: string }) => void;
}

export default function WalletView({ expenses, balances, settings, realTimeRate, handleDeleteExpense, addExpense }: Props) {
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const totalExpense = expenses.reduce((s, i) => s + i.amount, 0);

  const handleAddExpense = () => {
    if (!newTitle.trim() || !newAmount || Number(newAmount) <= 0) return;
    if (addExpense) {
      addExpense({
        title: newTitle.trim(),
        amount: Number(newAmount),
        payer: settings.travelers?.[0] || 'Me'
      });
      setNewTitle('');
      setNewAmount('');
    }
  };

  return (
    <div className="pt-6 space-y-8 pb-40">
      <div className="glass-dark rounded-[40px] p-8 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-orange-400 to-yellow-500 rounded-full blur-[80px] opacity-20 group-hover:opacity-30 transition-opacity duration-700"></div>
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-2">
            <div className="text-stone-400 text-xs font-bold uppercase tracking-[0.2em]">Total Spent</div>
            <div className="bg-white/10 px-3 py-1 rounded-xl text-[10px] font-bold backdrop-blur-md border border-white/10">
              {settings.currencyCode}
            </div>
          </div>
          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-3xl font-light font-num text-stone-300">{settings.currencySymbol}</span>
            <span className="text-6xl font-bold tracking-tight text-white font-num">{totalExpense.toLocaleString()}</span>
          </div>
          <div className="text-stone-400 text-sm mb-10 flex items-center gap-2 font-medium">
            <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]"></div>
            ≈ HKD <span className="font-num">${Math.round(totalExpense * realTimeRate).toLocaleString()}</span>
            <span className="opacity-40 text-xs font-mono">({realTimeRate.toFixed(3)})</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(balances).map(([name, balance]) => (
              <div key={name} className="bg-white/5 p-5 rounded-3xl border border-white/5 backdrop-blur-sm">
                <div className="text-[10px] text-stone-400 uppercase tracking-wider mb-2 font-bold">
                  {name} {balance >= 0 ? 'Gets' : 'Pays'}
                </div>
                <div className={`text-xl font-bold font-num ${balance >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {settings.currencySymbol}{Math.abs(balance).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div>
        <h3 className="font-bold text-stone-800 text-lg mb-5 ml-2 flex items-center gap-2">
          <span className="w-2 h-6 bg-stone-800 rounded-full"></span>Recent
        </h3>
        <div className="space-y-4">
          {expenses.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-stone-300/30 rounded-[32px] bg-white/20">
              <p className="text-stone-500 font-bold">No expenses yet</p>
            </div>
          ) : (
            expenses.map((expense) => (
              <div key={expense.id} className="glass-card p-5 rounded-3xl flex justify-between items-center">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-[20px] bg-white/60 border border-white flex items-center justify-center text-stone-400 shadow-sm">
                    <i className="ph ph-receipt text-2xl"></i>
                  </div>
                  <div>
                    <div className="font-bold text-stone-800 text-lg leading-tight mb-1">{expense.title}</div>
                    <div className="text-xs font-bold text-stone-500 flex items-center gap-1 bg-white/50 px-2 py-0.5 rounded-lg w-max">
                      <i className="ph ph-user"></i>{expense.payer}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold font-num text-stone-800 text-xl">
                    {settings.currencySymbol}{expense.amount.toLocaleString()}
                  </div>
                  <div className="text-[10px] font-bold font-num text-stone-400 mt-1 bg-stone-100/80 px-2 py-1 rounded-lg inline-block">
                    ≈ ${Math.round(expense.amount * realTimeRate).toLocaleString()}
                  </div>
                  <button
                    onClick={() => handleDeleteExpense(expense.id)}
                    className="block ml-auto mt-2 text-xs font-bold text-rose-300 hover:text-rose-500 transition-colors uppercase tracking-wider"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
          
          {/* Inline Add Expense Row */}
          {addExpense && (
            <div className="glass-card p-4 rounded-3xl mt-4">
              <div className="flex items-center gap-3">
                <div className="flex-1 flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-sm">{settings.currencySymbol}</span>
                    <input
                      type="number"
                      value={newAmount}
                      onChange={(e) => setNewAmount(e.target.value)}
                      placeholder="0"
                      className="w-full bg-white/60 border border-white/60 rounded-xl py-3 pl-8 pr-3 text-stone-800 font-bold font-num placeholder:text-stone-400 outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all text-right"
                    />
                  </div>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="What did you spend on?"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddExpense()}
                    className="flex-[2] bg-white/60 border border-white/60 rounded-xl py-3 px-4 text-stone-800 font-medium placeholder:text-stone-400 outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all"
                  />
                </div>
                <button
                  onClick={handleAddExpense}
                  disabled={!newTitle.trim() || !newAmount || Number(newAmount) <= 0}
                  className="w-12 h-12 rounded-xl bg-stone-800 text-amber-50 flex items-center justify-center hover:bg-stone-700 disabled:bg-stone-300 disabled:cursor-not-allowed transition-all shadow-lg"
                >
                  <i className="ph ph-plus text-xl"></i>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
