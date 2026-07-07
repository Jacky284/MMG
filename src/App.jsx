import React, { useState, useEffect, useMemo } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, 
  XAxis, CartesianGrid, LineChart, Line 
} from 'recharts';
import { 
  Home, FileText, PlusCircle, BarChart2, 
  Bell, Download, Upload, User, Plus, ChevronLeft, ChevronRight, Briefcase, Lock, Unlock
} from 'lucide-react';

// --- KONFIGURASI PALET WARNA ---
const EXPENSE_COLORS = {
  'Primer': '#D97757',   
  'Sekunder': '#E9C46A', 
  'Tersier': '#457B9D',  
};
const PALETTE = Object.values(EXPENSE_COLORS);

const INCOME_CATEGORIES = ['Gaji', 'Freelance', 'Giving/Pemberian'];
const EXPENSE_CATEGORIES = Object.keys(EXPENSE_COLORS);

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [transactions, setTransactions] = useState([]);
  const [wallets, setWallets] = useState(['Cash', 'Dana', 'Qris']);
  const [deposits, setDeposits] = useState([]); 
  
  useEffect(() => {
    const savedTxs = localStorage.getItem('mmg_transactions');
    const savedWallets = localStorage.getItem('mmg_wallets');
    const savedDeposits = localStorage.getItem('mmg_deposits');
    
    if (savedTxs) setTransactions(JSON.parse(savedTxs));
    if (savedWallets) setWallets(JSON.parse(savedWallets));
    if (savedDeposits) setDeposits(JSON.parse(savedDeposits));
  }, []);

  useEffect(() => {
    localStorage.setItem('mmg_transactions', JSON.stringify(transactions));
    localStorage.setItem('mmg_wallets', JSON.stringify(wallets));
    localStorage.setItem('mmg_deposits', JSON.stringify(deposits));
  }, [transactions, wallets, deposits]);

  // --- KOMPONEN BANTUAN: UI HEADER (DISEIMBANGKAN DENGAN HOME) ---
  const PageHeader = ({ title, subtitle, icon: Icon }) => (
    <div className="flex justify-between items-center pt-1 mb-2">
      <div className="flex items-center gap-3">
        {/* Background icon dan ukuran disamakan dengan profile icon di Home */}
        <div className="w-10 h-10 rounded-full bg-[#ecf4eb] flex items-center justify-center text-[#2d4a3e] font-bold shadow-sm">
          <Icon size={20} />
        </div>
        <div>
          {/* Ukuran font dan spasi disamakan persis */}
          <p className="text-[11px] text-gray-500 font-medium">{subtitle}</p>
          <p className="text-base font-bold text-gray-800 leading-tight">{title}</p>
        </div>
      </div>
      {/* Icon Notifikasi ditambahkan ke semua page biar layout seimbang */}
      <div className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-600">
        <Bell size={18} />
      </div>
    </div>
  );

  // --- KOMPONEN BANTUAN: UI LIST TRANSAKSI ---
  const TransactionItem = ({ t, isDeposit = false }) => {
    let txColor, txSign, title, descText, IconComp;

    if (isDeposit) {
      const isWithdraw = t.type === 'out';
      txColor = isWithdraw ? '#D97757' : '#2d4a3e'; 
      txSign = isWithdraw ? '-' : '+';
      title = isWithdraw ? 'Cairkan Deposito' : 'Tabungan Masuk';
      descText = isWithdraw ? `Masuk ke: ${t.wallet}` : `Sumber: ${t.wallet}`;
      IconComp = isWithdraw ? Unlock : Lock;
    } else {
      const isIncome = t.type === 'income';
      txColor = isIncome ? '#10b981' : (EXPENSE_COLORS[t.category] || '#3F2A2B');
      txSign = isIncome ? '+' : '-';
      title = t.category;
      descText = `${t.description} • ${t.wallet}`;
      IconComp = isIncome ? Download : Upload;
    }
    
    const dateStr = new Date(t.date).toLocaleString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).replace(/\./g, ':'); 

    return (
      <div className="flex justify-between items-center bg-[#ecf4eb]/40 p-3 rounded-xl border border-[#ecf4eb]/60">
        <div className="flex items-center gap-3">
          <div className="bg-white p-2 rounded-lg text-[#2d4a3e] shadow-sm">
            <IconComp size={18}/>
          </div>
          <div>
            <p className="font-bold text-gray-800 text-sm leading-tight">{title}</p>
            <p className="text-[10px] text-gray-500">{dateStr}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-bold text-sm leading-tight" style={{ color: txColor }}>
            {txSign} Rp {t.amount.toLocaleString('id-ID')}
          </p>
          <p className="text-[10px] text-gray-500 font-medium">
            {descText}
          </p>
        </div>
      </div>
    );
  };

  // --- KOMPONEN BANTUAN: LOGIKA FILTER WAKTU ---
  const useTimeFilter = () => {
    const [period, setPeriod] = useState('month'); 
    const [offset, setOffset] = useState(0);

    const getRange = () => {
      const now = new Date();
      if (period === 'month') {
        const start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
        const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0, 23, 59, 59);
        return { start, end, label: start.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) };
      } else if (period === 'year') {
        const start = new Date(now.getFullYear() + offset, 0, 1);
        const end = new Date(now.getFullYear() + offset, 11, 31, 23, 59, 59);
        return { start, end, label: `Tahun ${start.getFullYear()}` };
      } else {
        const start = new Date(now);
        start.setDate(now.getDate() - now.getDay() + 1 + (offset * 7)); 
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59);
        return { start, end, label: `${start.toLocaleDateString('id-ID', {day:'numeric', month:'short'})} - ${end.toLocaleDateString('id-ID', {day:'numeric', month:'short'})}` };
      }
    };
    return { period, setPeriod, offset, setOffset, ...getRange() };
  };

  // 1. PAGE HOME
  const HomeView = () => {
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
    
    const totalDepositIn = deposits.filter(d => d.type !== 'out').reduce((acc, curr) => acc + curr.amount, 0);
    const totalDepositOut = deposits.filter(d => d.type === 'out').reduce((acc, curr) => acc + curr.amount, 0);
    const netDeposit = totalDepositIn - totalDepositOut;
    
    const activeBalance = totalIncome - totalExpense - netDeposit;

    const walletBalances = wallets.map(wallet => {
      const wIncome = transactions.filter(t => t.type === 'income' && t.wallet === wallet).reduce((a, b) => a + b.amount, 0);
      const wExpense = transactions.filter(t => t.type === 'expense' && t.wallet === wallet).reduce((a, b) => a + b.amount, 0);
      const wDepIn = deposits.filter(d => d.wallet === wallet && d.type !== 'out').reduce((a, b) => a + b.amount, 0);
      const wDepOut = deposits.filter(d => d.wallet === wallet && d.type === 'out').reduce((a, b) => a + b.amount, 0);
      return { name: wallet, balance: wIncome - wExpense - wDepIn + wDepOut };
    });

    const recentTxs = [...transactions].sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

    return (
      <div className="p-4 pb-24 space-y-4">
        {/* Header Home dipindahkan ke komponen terpisah biar bisa dipanggil ulang tanpa ribet */}
        <PageHeader title="Muhammad Zaki" subtitle="Welcome 👋" icon={User} />

        <div className="bg-[#2d4a3e] rounded-[20px] p-5 text-white shadow-lg relative overflow-hidden">
          <div className="flex justify-between items-end mb-1">
             <p className="text-emerald-100/80 text-xs font-medium">Saldo Aktif (Bisa Dipakai)</p>
             <p className="text-[10px] text-emerald-100/60 font-semibold flex items-center gap-1">
               <Lock size={10}/> Tabungan: Rp {netDeposit.toLocaleString('id-ID')}
             </p>
          </div>
          <h2 className="text-3xl font-bold mb-3">Rp {activeBalance.toLocaleString('id-ID')}</h2>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {walletBalances.map((wb, idx) => (
               <div key={wb.name} className="bg-white/10 p-2.5 rounded-xl min-w-[100px] border-l-4 shadow-sm backdrop-blur-sm" style={{borderColor: PALETTE[idx % 3]}}>
                  <p className="text-[9px] text-gray-300 uppercase tracking-wider mb-0.5">{wb.name}</p>
                  <p className="font-semibold text-xs">Rp {wb.balance.toLocaleString('id-ID')}</p>
               </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={() => setActiveTab('add')} className="flex-1 bg-[#ecf4eb] rounded-xl p-2.5 flex items-center justify-between text-[#2d4a3e]">
            <div className="flex items-center gap-1.5 font-semibold text-xs"><Download size={16} /> Pemasukan</div>
            <PlusCircle size={16} />
          </button>
          <button onClick={() => setActiveTab('add')} className="flex-1 bg-[#ecf4eb] rounded-xl p-2.5 flex items-center justify-between text-[#2d4a3e]">
            <div className="flex items-center gap-1.5 font-semibold text-xs"><Upload size={16} /> Pengeluaran</div>
            <PlusCircle size={16} />
          </button>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-sm text-gray-800">Recent Activity</h3>
            <span onClick={() => setActiveTab('details')} className="text-[11px] text-gray-400 cursor-pointer">See All</span>
          </div>
          <div className="space-y-2">
            {recentTxs.length > 0 ? recentTxs.map(t => <TransactionItem key={t.id} t={t} />) : <p className="text-center text-gray-400 text-xs py-4">Belum ada transaksi</p>}
          </div>
        </div>
      </div>
    );
  };

  // 2. PAGE DETAILS
  const DetailsView = () => {
    const [txType, setTxType] = useState('expense'); 
    const { period, setPeriod, offset, setOffset, start, end, label } = useTimeFilter();

    const chartData = [];
    const txsInPeriod = transactions.filter(t => {
      const txDate = new Date(t.date);
      return txDate >= start && txDate <= end;
    });
    const filteredTxs = txsInPeriod.filter(t => t.type === txType).sort((a,b) => new Date(b.date) - new Date(a.date));

    if (period === 'year') {
      for (let m = 0; m < 12; m++) {
        const mStart = new Date(start.getFullYear(), m, 1);
        const mEnd = new Date(start.getFullYear(), m + 1, 0, 23, 59, 59);
        const monthLabel = mStart.toLocaleDateString('id-ID', { month: 'short' });
        const monthTxs = txsInPeriod.filter(t => t.type === txType && new Date(t.date) >= mStart && new Date(t.date) <= mEnd);
        
        if (txType === 'income') {
          chartData.push({ date: monthLabel, total: monthTxs.reduce((s,t) => s+t.amount, 0) });
        } else {
          chartData.push({
            date: monthLabel,
            Primer: monthTxs.filter(t=>t.category==='Primer').reduce((s,t)=>s+t.amount,0),
            Sekunder: monthTxs.filter(t=>t.category==='Sekunder').reduce((s,t)=>s+t.amount,0),
            Tersier: monthTxs.filter(t=>t.category==='Tersier').reduce((s,t)=>s+t.amount,0),
          });
        }
      }
    } else {
      let stepDate = new Date(start);
      while (stepDate <= end) {
        const dateLabel = stepDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        const dayTxs = txsInPeriod.filter(t => t.type === txType && new Date(t.date).toDateString() === stepDate.toDateString());
        if (txType === 'income') {
          chartData.push({ date: dateLabel, total: dayTxs.reduce((s,t) => s+t.amount, 0) });
        } else {
          chartData.push({ 
            date: dateLabel, 
            Primer: dayTxs.filter(t=>t.category==='Primer').reduce((s,t)=>s+t.amount,0),
            Sekunder: dayTxs.filter(t=>t.category==='Sekunder').reduce((s,t)=>s+t.amount,0),
            Tersier: dayTxs.filter(t=>t.category==='Tersier').reduce((s,t)=>s+t.amount,0),
          });
        }
        stepDate.setDate(stepDate.getDate() + 1);
      }
    }

    const periodIncome = txsInPeriod.filter(t => t.type === 'income');
    const periodExpense = txsInPeriod.filter(t => t.type === 'expense');

    const incomeByWallet = wallets.map(w => ({
      name: w, total: periodIncome.filter(t=>t.wallet===w).reduce((s,t)=>s+t.amount,0)
    })).filter(w => w.total > 0);

    const expenseByCat = EXPENSE_CATEGORIES.map(c => ({
      name: c, total: periodExpense.filter(t=>t.category===c).reduce((s,t)=>s+t.amount,0)
    })).filter(c => c.total > 0);

    return (
      <div className="p-4 pb-24 space-y-4">
        <PageHeader title="Detail Transaksi" subtitle="Laporan keluar masuk uang" icon={FileText} />
        
        <div className="flex bg-[#ecf4eb] p-1 rounded-lg">
          <button onClick={() => setTxType('income')} className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition ${txType === 'income' ? 'bg-[#2d4a3e] text-white shadow' : 'text-[#2d4a3e]'}`}>Pemasukan</button>
          <button onClick={() => setTxType('expense')} className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition ${txType === 'expense' ? 'bg-[#2d4a3e] text-white shadow' : 'text-[#2d4a3e]'}`}>Pengeluaran</button>
        </div>

        <div className="bg-white p-2.5 rounded-xl shadow-sm border border-slate-100 space-y-2">
          <select value={period} onChange={(e) => {setPeriod(e.target.value); setOffset(0);}} className="w-full bg-[#ecf4eb] border-none rounded-lg p-2.5 text-xs font-semibold text-[#2d4a3e] focus:outline-none">
            <option value="week">Per Minggu</option>
            <option value="month">Per Bulan</option>
            <option value="year">Per Tahun</option>
          </select>
          <div className="flex items-center justify-between px-1">
            <button onClick={() => setOffset(o => o - 1)} className="p-1.5 text-[#2d4a3e] hover:bg-[#ecf4eb] rounded-md transition"><ChevronLeft size={16}/></button>
            <span className="font-bold text-gray-700 text-xs">{label}</span>
            <button onClick={() => setOffset(o => o + 1)} className="p-1.5 text-[#2d4a3e] hover:bg-[#ecf4eb] rounded-md transition"><ChevronRight size={16}/></button>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <h3 className="font-bold text-gray-800 mb-3 text-xs">Grafik Tren (Rp)</h3>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="date" tick={{fontSize: 9}} tickLine={false} axisLine={false} minTickGap={15} />
                <Tooltip formatter={(value) => `Rp ${value.toLocaleString('id-ID')}`} />
                {txType === 'income' ? (
                   <Line type="monotone" dataKey="total" stroke="#10b981" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
                ) : (
                   <>
                     <Line type="monotone" dataKey="Primer" stroke={EXPENSE_COLORS['Primer']} strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
                     <Line type="monotone" dataKey="Sekunder" stroke={EXPENSE_COLORS['Sekunder']} strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
                     <Line type="monotone" dataKey="Tersier" stroke={EXPENSE_COLORS['Tersier']} strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
                   </>
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#ecf4eb]/60 rounded-xl p-4 border border-[#ecf4eb]">
          <h3 className="font-bold text-[#2d4a3e] mb-2 text-xs">
            Total {txType === 'income' ? 'Pemasukan' : 'Pengeluaran'}
          </h3>
          <div className="space-y-1.5">
            {txType === 'income' ? (
              incomeByWallet.length > 0 ? incomeByWallet.map(w => (
                <div key={w.name} className="flex justify-between items-center text-xs border-b border-[#2d4a3e]/10 pb-1">
                  <span className="text-gray-600 font-medium">{w.name}</span>
                  <span className="font-bold text-[#10b981]">+ Rp {w.total.toLocaleString('id-ID')}</span>
                </div>
              )) : <p className="text-[10px] text-gray-500">Tidak ada pemasukan</p>
            ) : (
              expenseByCat.length > 0 ? expenseByCat.map(c => (
                <div key={c.name} className="flex justify-between items-center text-xs border-b border-[#2d4a3e]/10 pb-1">
                  <span className="text-gray-600 font-medium">{c.name}</span>
                  <span className="font-bold" style={{color: EXPENSE_COLORS[c.name]}}>- Rp {c.total.toLocaleString('id-ID')}</span>
                </div>
              )) : <p className="text-[10px] text-gray-500">Tidak ada pengeluaran</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 min-h-[250px]">
          <h3 className="font-bold text-gray-800 mb-3 text-xs">Daftar Transaksi</h3>
          <div className="space-y-2">
            {filteredTxs.length > 0 ? filteredTxs.map(t => <TransactionItem key={t.id} t={t} />) : <p className="text-center text-gray-400 text-xs py-8">Belum ada data</p>}
          </div>
        </div>
      </div>
    );
  };

  // 3. PAGE ADD TRANSACTION 
  const AddView = () => {
    const [type, setType] = useState('expense');
    const [rawAmount, setRawAmount] = useState('');
    const [displayAmount, setDisplayAmount] = useState('');
    const [rawChange, setRawChange] = useState('');
    const [displayChange, setDisplayChange] = useState('');
    const [category, setCategory] = useState('');
    const [desc, setDesc] = useState('');
    const [wallet, setWallet] = useState(wallets[0]);
    const [newWallet, setNewWallet] = useState('');
    const [isAddingWallet, setIsAddingWallet] = useState(false);

    const handleAmountChange = (e, setRaw, setDisplay) => {
      const val = e.target.value.replace(/\D/g, ''); 
      if (!val) {
        setRaw(''); setDisplay('');
      } else {
        setRaw(parseInt(val, 10));
        setDisplay(parseInt(val, 10).toLocaleString('id-ID'));
      }
    };

    const handleSave = () => {
      let finalAmount = rawAmount;
      if (type === 'expense' && rawChange > 0) {
        finalAmount = rawAmount - rawChange;
      }
      if (!finalAmount || finalAmount <= 0 || !category) {
        return alert('Jumlah Nominal dan Kategori wajib diisi dengan benar!');
      }
      
      let finalWallet = wallet;
      if (isAddingWallet && newWallet) {
        finalWallet = newWallet;
        setWallets([...wallets, newWallet]);
      }

      const newTx = {
        id: Date.now().toString(), type, amount: finalAmount, category, description: desc || '-', wallet: finalWallet, date: new Date().toISOString()
      };
      setTransactions([newTx, ...transactions]);
      alert(`Berhasil disimpan! Total tercatat: Rp ${finalAmount.toLocaleString('id-ID')}`);
      
      setRawAmount(''); setDisplayAmount(''); setRawChange(''); setDisplayChange('');
      setDesc(''); setNewWallet(''); setIsAddingWallet(false); setActiveTab('home');
    };

    const focusColor = type === 'income' ? 'focus:ring-[#10b981]' : 'focus:ring-[#D97757]';

    return (
      <div className="p-4 pb-24 space-y-4 font-sans">
        <PageHeader title="Tambahkan Data" subtitle="Catat arus uang" icon={PlusCircle} />
        
        <div className="flex bg-[#ecf4eb] p-1 rounded-lg">
          <button onClick={() => {setType('income'); setCategory(''); setRawChange(''); setDisplayChange('');}} className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition ${type === 'income' ? 'bg-[#2d4a3e] text-white shadow' : 'text-[#2d4a3e]'}`}>Uang Masuk</button>
          <button onClick={() => {setType('expense'); setCategory('');}} className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition ${type === 'expense' ? 'bg-[#2d4a3e] text-white shadow' : 'text-[#2d4a3e]'}`}>Uang Keluar</button>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 space-y-4">
          <div>
            <label className="text-[11px] font-semibold text-gray-500 mb-1.5 block tracking-wide uppercase">
              {type === 'expense' ? 'Uang Dibayarkan' : 'Jumlah Nominal'}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-500 font-bold text-sm">Rp</span>
              <input 
                type="text" inputMode="numeric"
                value={displayAmount} 
                onChange={(e) => handleAmountChange(e, setRawAmount, setDisplayAmount)} 
                className={`w-full bg-[#ecf4eb]/40 border border-gray-100 rounded-lg py-3 pl-9 pr-3 font-bold text-lg focus:outline-none focus:ring-2 ${focusColor}`} 
                placeholder="0" 
              />
            </div>
          </div>

          {type === 'expense' && (
            <div>
              <label className="text-[11px] font-semibold text-gray-500 mb-1.5 block tracking-wide uppercase">Kembalian (Opsional)</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500 font-bold text-sm">Rp</span>
                <input 
                  type="text" inputMode="numeric"
                  value={displayChange} 
                  onChange={(e) => handleAmountChange(e, setRawChange, setDisplayChange)} 
                  className={`w-full bg-[#ecf4eb]/40 border border-gray-100 rounded-lg py-2.5 pl-9 pr-3 font-bold text-base focus:outline-none focus:ring-2 ${focusColor}`} 
                  placeholder="0" 
                />
              </div>
              {rawChange > 0 && rawAmount > 0 && (
                <p className="text-[10px] text-[#D97757] font-semibold mt-1 text-right">
                  Total Keluar: Rp {(rawAmount - rawChange).toLocaleString('id-ID')}
                </p>
              )}
            </div>
          )}

          <div>
            <label className="text-[11px] font-semibold text-gray-500 mb-1.5 block tracking-wide uppercase">Kategori</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={`w-full bg-[#ecf4eb]/40 border border-gray-100 rounded-lg p-3 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 ${focusColor}`}>
              <option value="" disabled>Pilih Kategori...</option>
              {type === 'income' ? INCOME_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>) : EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-gray-500 mb-1.5 block tracking-wide uppercase">Dompet</label>
            {!isAddingWallet ? (
              <div className="flex gap-2">
                <select value={wallet} onChange={(e) => setWallet(e.target.value)} className={`flex-1 bg-[#ecf4eb]/40 border border-gray-100 rounded-lg p-3 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 ${focusColor}`}>
                  {wallets.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
                <button onClick={() => setIsAddingWallet(true)} className="bg-[#ecf4eb] text-[#2d4a3e] px-3 rounded-lg flex items-center justify-center transition hover:bg-[#d4e6d3]">
                  <Plus size={18} />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input type="text" value={newWallet} onChange={(e) => setNewWallet(e.target.value)} placeholder="Cth: Debit BCA" className={`flex-1 bg-[#ecf4eb]/40 border border-gray-100 rounded-lg p-3 text-sm font-medium focus:outline-none focus:ring-2 ${focusColor}`} />
                <button onClick={() => setIsAddingWallet(false)} className="bg-red-50 text-red-500 px-3 rounded-lg text-xs font-bold border border-red-100">Batal</button>
              </div>
            )}
          </div>

          <div>
            <div className="flex justify-between items-end mb-1.5">
              <label className="text-[11px] font-semibold text-gray-500 tracking-wide uppercase">Keterangan</label>
              <span className="text-[9px] text-gray-400">{desc.length}/20</span>
            </div>
            <textarea 
              value={desc} maxLength={20}
              onChange={(e) => setDesc(e.target.value)} 
              placeholder="Tulis rincian..." 
              className={`w-full bg-[#ecf4eb]/40 border border-gray-100 rounded-lg p-3 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 ${focusColor} resize-none h-20`}
            ></textarea>
          </div>
          
          <button onClick={handleSave} className="w-full bg-[#2d4a3e] text-white font-bold py-3.5 rounded-xl shadow-md hover:bg-[#1f332a] transition tracking-wide text-sm mt-2">
            Simpan Transaksi
          </button>
        </div>
      </div>
    );
  };

  // 4. PAGE STATS 
  const ActivitiesView = () => {
    const { period, setPeriod, offset, setOffset, start, end, label } = useTimeFilter();

    const filteredTxs = transactions.filter(t => {
      const txDate = new Date(t.date);
      return txDate >= start && txDate <= end;
    }).sort((a,b) => new Date(b.date) - new Date(a.date)); 

    const statIncome = filteredTxs.filter(t => t.type === 'income').reduce((a, b) => a + b.amount, 0);
    const statExpense = filteredTxs.filter(t => t.type === 'expense').reduce((a, b) => a + b.amount, 0);

    const pieData = EXPENSE_CATEGORIES.map(cat => ({
      name: cat, value: filteredTxs.filter(t => t.type === 'expense' && t.category === cat).reduce((acc, curr) => acc + curr.amount, 0)
    })).filter(d => d.value > 0);

    const mutationData = useMemo(() => {
      const grouped = {};
      transactions.forEach(t => {
        const d = new Date(t.date);
        const monthYear = d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
        if (!grouped[monthYear]) grouped[monthYear] = { income: 0, expense: 0, timestamp: d.getTime() };
        if (t.type === 'income') grouped[monthYear].income += t.amount;
        else grouped[monthYear].expense += t.amount;
      });
      return Object.entries(grouped)
        .sort((a, b) => b[1].timestamp - a[1].timestamp)
        .map(([month, data]) => ({ month, ...data }));
    }, [transactions]);

    return (
      <div className="p-4 pb-24 space-y-4">
        <PageHeader title="Activity Overview" subtitle="Pantau kesehatan finansial" icon={BarChart2} />
        
        <div className="bg-white p-2.5 rounded-xl shadow-sm border border-slate-100 space-y-2">
          <select value={period} onChange={(e) => {setPeriod(e.target.value); setOffset(0);}} className="w-full bg-[#ecf4eb] border-none rounded-lg p-2.5 text-xs font-semibold text-[#2d4a3e] focus:outline-none">
            <option value="week">Per Minggu</option>
            <option value="month">Per Bulan</option>
            <option value="year">Per Tahun</option>
          </select>
          <div className="flex items-center justify-between px-1">
            <button onClick={() => setOffset(o => o - 1)} className="p-1.5 text-[#2d4a3e] hover:bg-[#ecf4eb] rounded-md transition"><ChevronLeft size={16}/></button>
            <span className="font-bold text-gray-700 text-xs">{label}</span>
            <button onClick={() => setOffset(o => o + 1)} className="p-1.5 text-[#2d4a3e] hover:bg-[#ecf4eb] rounded-md transition"><ChevronRight size={16}/></button>
          </div>
        </div>

        <div className="flex gap-3">
           <div className="flex-1 bg-white rounded-xl p-4 border border-slate-100 shadow-sm text-center">
             <div className="bg-emerald-100/50 w-10 h-10 rounded-full mx-auto flex items-center justify-center text-emerald-500 mb-1.5"><Download size={18}/></div>
             <span className="text-[10px] font-medium text-gray-500 block mb-0.5">Masuk</span>
             <p className="font-bold text-gray-800 text-sm">Rp {statIncome.toLocaleString('id-ID')}</p>
           </div>
           <div className="flex-1 bg-white rounded-xl p-4 border border-slate-100 shadow-sm text-center">
             <div className="bg-rose-100/50 w-10 h-10 rounded-full mx-auto flex items-center justify-center text-rose-500 mb-1.5"><Upload size={18}/></div>
             <span className="text-[10px] font-medium text-gray-500 block mb-0.5">Keluar</span>
             <p className="font-bold text-gray-800 text-sm">Rp {statExpense.toLocaleString('id-ID')}</p>
           </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <h3 className="font-bold text-gray-800 mb-4 text-xs text-center">Distribusi Pengeluaran</h3>
          {pieData.length > 0 ? (
             <div className="h-40">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                   {pieData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={EXPENSE_COLORS[entry.name]} />
                   ))}
                 </Pie>
                 <Tooltip formatter={(value) => `Rp ${value.toLocaleString('id-ID')}`} />
                 <Legend wrapperStyle={{fontSize: '10px'}}/>
               </PieChart>
             </ResponsiveContainer>
           </div>
          ) : <p className="text-center text-xs text-gray-400">Tidak ada pengeluaran</p>}
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <h3 className="font-bold text-gray-800 mb-3 text-xs text-center">Laporan Mutasi Total</h3>
          <div className="space-y-2">
            {mutationData.length > 0 ? mutationData.map(m => (
              <div key={m.month} className="p-3 rounded-xl border border-gray-100 flex justify-between items-center bg-[#ecf4eb]/20">
                <p className="font-bold text-[#2d4a3e] text-xs">{m.month}</p>
                <div className="text-right">
                  <p className="text-[11px] font-bold text-[#10b981] mb-0.5">+{m.income.toLocaleString('id-ID')}</p>
                  <p className="text-[11px] font-bold text-rose-500">-{m.expense.toLocaleString('id-ID')}</p>
                </div>
              </div>
            )) : <p className="text-center text-xs text-gray-400 py-2">Belum ada mutasi</p>}
          </div>
        </div>
      </div>
    );
  };

  // 5. PAGE DEPOSITO (TABUNGAN & PENCAIRAN)
  const DepositoView = () => {
    const [depType, setDepType] = useState('in'); 
    const [rawAmount, setRawAmount] = useState('');
    const [displayAmount, setDisplayAmount] = useState('');
    const [wallet, setWallet] = useState(wallets[0]);

    const totalDepositIn = deposits.filter(d => d.type !== 'out').reduce((a, b) => a + b.amount, 0);
    const totalDepositOut = deposits.filter(d => d.type === 'out').reduce((a, b) => a + b.amount, 0);
    const netDeposit = totalDepositIn - totalDepositOut;
    
    const now = new Date();
    const thisMonthDeposits = deposits.filter(d => {
      const dDate = new Date(d.date);
      return dDate.getMonth() === now.getMonth() && dDate.getFullYear() === now.getFullYear();
    });
    const mIn = thisMonthDeposits.filter(d => d.type !== 'out').reduce((a,b)=>a+b.amount,0);
    const mOut = thisMonthDeposits.filter(d => d.type === 'out').reduce((a,b)=>a+b.amount,0);
    const thisMonthDeposit = mIn - mOut;

    const handleAmountChange = (e) => {
      const val = e.target.value.replace(/\D/g, ''); 
      if (!val) {
        setRawAmount(''); setDisplayAmount('');
      } else {
        setRawAmount(parseInt(val, 10));
        setDisplayAmount(parseInt(val, 10).toLocaleString('id-ID'));
      }
    };

    const handleSaveDeposit = () => {
      if (!rawAmount || rawAmount <= 0) return alert('Masukkan nominal dengan benar euy!');

      if (depType === 'in') {
        const wIncome = transactions.filter(t => t.type === 'income' && t.wallet === wallet).reduce((a,b)=>a+b.amount,0);
        const wExpense = transactions.filter(t => t.type === 'expense' && t.wallet === wallet).reduce((a,b)=>a+b.amount,0);
        const wDepIn = deposits.filter(d => d.wallet === wallet && d.type !== 'out').reduce((a,b)=>a+b.amount,0);
        const wDepOut = deposits.filter(d => d.wallet === wallet && d.type === 'out').reduce((a,b)=>a+b.amount,0);
        const wBalance = wIncome - wExpense - wDepIn + wDepOut;

        if (rawAmount > wBalance) {
          return alert(`Gagal! Saldo di dompet ${wallet} kamu (Rp ${wBalance.toLocaleString('id-ID')}) tidak cukup untuk deposito sebesar ini.`);
        }
      } else {
        if (rawAmount > netDeposit) {
          return alert(`Tabunganmu cuma ada Rp ${netDeposit.toLocaleString('id-ID')}, nggak cukup buat dicairin segitu!`);
        }
      }

      const newDeposit = {
        id: Date.now().toString(), type: depType, amount: rawAmount, wallet: wallet, date: new Date().toISOString()
      };
      
      setDeposits([newDeposit, ...deposits]);
      
      if (depType === 'in') {
         alert(`Berhasil menabung Rp ${rawAmount.toLocaleString('id-ID')} dari ${wallet}!`);
      } else {
         alert(`Berhasil mencairkan tabungan Rp ${rawAmount.toLocaleString('id-ID')} ke ${wallet}!`);
      }
      
      setRawAmount(''); setDisplayAmount('');
    };

    const focusColor = depType === 'in' ? 'focus:ring-[#2d4a3e]' : 'focus:ring-[#D97757]';

    return (
      <div className="p-4 pb-24 space-y-4 font-sans">
        <PageHeader title="Brankas Deposito" subtitle="Simpanan darurat masa depan" icon={Briefcase} />

        <div className="bg-[#2d4a3e] rounded-[20px] p-5 text-white shadow-lg relative overflow-hidden text-center">
          <Briefcase className="absolute -right-4 -bottom-4 text-emerald-100/10 w-32 h-32" />
          <p className="text-emerald-100/80 text-xs font-medium mb-1">Total Tabungan</p>
          <h2 className="text-3xl font-bold mb-3">Rp {netDeposit.toLocaleString('id-ID')}</h2>
          <div className="bg-white/10 rounded-lg p-2 inline-block backdrop-blur-sm border border-white/5">
             <p className="text-[10px] text-emerald-100/90 font-medium">
               Aktivitas Bulan Ini: <span className="font-bold text-white">{thisMonthDeposit >= 0 ? '+' : '-'} Rp {Math.abs(thisMonthDeposit).toLocaleString('id-ID')}</span>
             </p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 space-y-4">
          <div className="flex bg-[#ecf4eb] p-1 rounded-lg mb-2">
            <button onClick={() => setDepType('in')} className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition ${depType === 'in' ? 'bg-[#2d4a3e] text-white shadow' : 'text-[#2d4a3e]'}`}>Nabung</button>
            <button onClick={() => setDepType('out')} className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition ${depType === 'out' ? 'bg-[#D97757] text-white shadow' : 'text-[#2d4a3e]'}`}>Cairkan</button>
          </div>
          
          <div>
            <label className="text-[10px] font-semibold text-gray-500 mb-1.5 block tracking-wide uppercase">
               {depType === 'in' ? 'Nominal Ditabung' : 'Nominal Dicairkan'}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-500 font-bold text-sm">Rp</span>
              <input 
                type="text" inputMode="numeric" value={displayAmount} onChange={handleAmountChange} 
                className={`w-full bg-[#ecf4eb]/40 border border-gray-100 rounded-lg py-3 pl-9 pr-3 font-bold text-lg focus:outline-none focus:ring-2 ${focusColor}`} 
                placeholder="0" 
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-gray-500 mb-1.5 block tracking-wide uppercase">
               {depType === 'in' ? 'Sumber Dana' : 'Tujuan Pencairan (Dompet)'}
            </label>
            <select value={wallet} onChange={(e) => setWallet(e.target.value)} className={`w-full bg-[#ecf4eb]/40 border border-gray-100 rounded-lg p-3 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 ${focusColor}`}>
              {wallets.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>

          <button onClick={handleSaveDeposit} className={`w-full text-white font-bold py-3 rounded-xl shadow-md transition tracking-wide text-sm mt-2 ${depType === 'in' ? 'bg-[#2d4a3e] hover:bg-[#1f332a]' : 'bg-[#D97757] hover:bg-[#c36345]'}`}>
            {depType === 'in' ? 'Simpan ke Brankas' : 'Cairkan Sekarang'}
          </button>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 min-h-[200px]">
          <h3 className="font-bold text-gray-800 mb-3 text-xs">Riwayat Tabungan</h3>
          <div className="space-y-2">
            {deposits.length > 0 ? deposits.map(d => <TransactionItem key={d.id} t={d} isDeposit={true} />) : <p className="text-center text-gray-400 text-xs py-8">Belum ada riwayat tabungan</p>}
          </div>
        </div>
      </div>
    );
  };

  // --- BOTTOM NAV ---
  return (
    <div className="min-h-screen bg-[#f8faf8] font-sans flex justify-center">
      <div className="w-full max-w-md relative min-h-screen shadow-2xl overflow-hidden bg-white/50">
        <div className="overflow-y-auto h-screen no-scrollbar">
          {activeTab === 'home' && <HomeView />}
          {activeTab === 'details' && <DetailsView />}
          {activeTab === 'add' && <AddView />}
          {activeTab === 'activities' && <ActivitiesView />}
          {activeTab === 'deposito' && <DepositoView />}
        </div>
        <div className="absolute bottom-0 w-full bg-[#2d4a3e] px-5 py-4 rounded-t-[25px] flex justify-between items-end z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
          <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'home' ? 'text-white' : 'text-emerald-100/50'}`}>
            <Home size={20} strokeWidth={activeTab === 'home' ? 2.5 : 2} />
            <span className="text-[9px] font-medium">Home</span>
          </button>
          <button onClick={() => setActiveTab('details')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'details' ? 'text-white' : 'text-emerald-100/50'}`}>
            <FileText size={20} strokeWidth={activeTab === 'details' ? 2.5 : 2} />
            <span className="text-[9px] font-medium">Details</span>
          </button>
          <button onClick={() => setActiveTab('add')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'add' ? 'text-white' : 'text-emerald-100/50'}`}>
            <PlusCircle size={20} strokeWidth={activeTab === 'add' ? 2.5 : 2} />
            <span className="text-[9px] font-medium">Add Tx</span>
          </button>
          <button onClick={() => setActiveTab('activities')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'activities' ? 'text-white' : 'text-emerald-100/50'}`}>
            <BarChart2 size={20} strokeWidth={activeTab === 'activities' ? 2.5 : 2} />
            <span className="text-[9px] font-medium">Stats</span>
          </button>
          <button onClick={() => setActiveTab('deposito')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'deposito' ? 'text-white' : 'text-emerald-100/50'}`}>
            <Briefcase size={20} strokeWidth={activeTab === 'deposito' ? 2.5 : 2} />
            <span className="text-[9px] font-medium">Deposito</span>
          </button>
        </div>
      </div>
    </div>
  );
}
