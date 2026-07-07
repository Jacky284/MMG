import React, { useState, useEffect, useMemo } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, 
  BarChart, Bar, XAxis, CartesianGrid, LineChart, Line 
} from 'recharts';
import { 
  Home, FileText, PlusCircle, BarChart2, 
  Wallet, Bell, Download, Upload, User, Plus,
  ChevronLeft, ChevronRight
} from 'lucide-react';

// --- KONFIGURASI PALET WARNA ---
const PALETTE = ['#18A999', '#92817A', '#3F2A2B']; 

const EXPENSE_COLORS = {
  'Primer': '#18A999',   
  'Sekunder': '#92817A', 
  'Tersier': '#3F2A2B',  
};

const INCOME_CATEGORIES = ['Gaji', 'Freelance', 'Giving/Pemberian'];
const EXPENSE_CATEGORIES = Object.keys(EXPENSE_COLORS);

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [transactions, setTransactions] = useState([]);
  const [wallets, setWallets] = useState(['Cash', 'Dana', 'Qris']);
  
  useEffect(() => {
    const savedTxs = localStorage.getItem('mmg_transactions');
    const savedWallets = localStorage.getItem('mmg_wallets');
    if (savedTxs) setTransactions(JSON.parse(savedTxs));
    if (savedWallets) setWallets(JSON.parse(savedWallets));
  }, []);

  useEffect(() => {
    localStorage.setItem('mmg_transactions', JSON.stringify(transactions));
    localStorage.setItem('mmg_wallets', JSON.stringify(wallets));
  }, [transactions, wallets]);

  // --- KOMPONEN BANTUAN: UI LIST TRANSAKSI ---
  // Dibuat satu komponen agar format di Home dan Details 100% sama
  const TransactionItem = ({ t }) => {
    const isIncome = t.type === 'income';
    const txColor = isIncome ? '#10b981' : (EXPENSE_COLORS[t.category] || '#3F2A2B');
    const txSign = isIncome ? '+' : '-';
    
    // Format Timestamp: 07 Jul 2026, 11:02
    const dateStr = new Date(t.date).toLocaleString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).replace(/\./g, ':'); 

    return (
      <div className="flex justify-between items-center bg-[#ecf4eb]/40 p-4 rounded-2xl border border-[#ecf4eb]/60">
        <div className="flex items-center gap-4">
          <div className="bg-white p-2.5 rounded-xl text-[#2d4a3e] shadow-sm">
            {isIncome ? <Download size={20}/> : <Upload size={20}/>}
          </div>
          <div>
            <p className="font-bold text-gray-800 text-sm">{t.category}</p>
            <p className="text-[11px] text-gray-500">{dateStr}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-bold text-sm" style={{ color: txColor }}>
            {txSign} Rp {t.amount.toLocaleString('id-ID')}
          </p>
          <p className="text-[11px] text-gray-500 font-medium truncate max-w-[120px]">
            {t.description}
          </p>
        </div>
      </div>
    );
  };

  // 1. PAGE HOME
  const HomeView = () => {
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
    const balance = totalIncome - totalExpense;

    const walletBalances = wallets.map(wallet => {
      const wIncome = transactions.filter(t => t.type === 'income' && t.wallet === wallet).reduce((acc, curr) => acc + curr.amount, 0);
      const wExpense = transactions.filter(t => t.type === 'expense' && t.wallet === wallet).reduce((acc, curr) => acc + curr.amount, 0);
      return { name: wallet, balance: wIncome - wExpense };
    });

    const recentTxs = [...transactions].sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

    return (
      <div className="p-5 pb-28 space-y-6">
        <div className="flex justify-between items-center pt-2">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-[#ecf4eb] flex items-center justify-center text-[#2d4a3e] font-bold shadow-sm">
              <User size={24} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Welcome 👋</p>
              <p className="text-lg font-bold text-gray-800 leading-tight">Zaki</p>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-600">
            <Bell size={20} />
          </div>
        </div>

        <div className="bg-[#2d4a3e] rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 h-full flex flex-col justify-center gap-4 pr-3 opacity-20">
             <span className="origin-center rotate-90 text-[10px] font-bold tracking-widest">INCOME</span>
             <span className="origin-center rotate-90 text-[10px] font-bold tracking-widest">EXPENSE</span>
          </div>
          <p className="text-gray-300 text-sm mb-1 font-medium">Total Balance</p>
          <h2 className="text-[34px] font-bold mb-4">Rp {balance.toLocaleString('id-ID')}</h2>
          
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            {walletBalances.map((wb, idx) => (
               <div key={wb.name} className="bg-white/10 p-3 rounded-2xl min-w-[110px] border-l-4 shadow-sm backdrop-blur-sm" style={{borderColor: PALETTE[idx % 3]}}>
                  <p className="text-[10px] text-gray-300 uppercase tracking-wider">{wb.name}</p>
                  <p className="font-semibold text-sm">Rp {wb.balance.toLocaleString('id-ID')}</p>
               </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-gray-800">Quick Action</h3>
            <span className="text-xs text-gray-400">All Actions</span>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setActiveTab('add')} className="flex-1 bg-[#ecf4eb] rounded-2xl p-3 flex items-center justify-between text-[#2d4a3e]">
              <div className="flex items-center gap-2 font-semibold text-sm"><Download size={18} /> Pemasukan</div>
              <PlusCircle size={18} />
            </button>
            <button onClick={() => setActiveTab('add')} className="flex-1 bg-[#ecf4eb] rounded-2xl p-3 flex items-center justify-between text-[#2d4a3e]">
              <div className="flex items-center gap-2 font-semibold text-sm"><Upload size={18} /> Pengeluaran</div>
              <PlusCircle size={18} />
            </button>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-gray-800">Recent Activity</h3>
            <span onClick={() => setActiveTab('details')} className="text-xs text-gray-400 cursor-pointer">See All</span>
          </div>
          <div className="space-y-3">
            {recentTxs.length > 0 ? recentTxs.map(t => <TransactionItem key={t.id} t={t} />) : <p className="text-center text-gray-400 text-sm py-5">Belum ada transaksi</p>}
          </div>
        </div>
      </div>
    );
  };

  // 2. PAGE DETAILS (DENGAN FILTER PANAH & GRAFIK 3 GARIS)
  const DetailsView = () => {
    const [txType, setTxType] = useState('expense'); 
    const [period, setPeriod] = useState('month'); // week, month, year
    const [offset, setOffset] = useState(0);

    // Hitung range tanggal berdasarkan filter
    const getRange = () => {
      const now = new Date();
      if (period === 'month') {
        const start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
        const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0);
        return { start, end, label: start.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) };
      } else if (period === 'year') {
        const start = new Date(now.getFullYear() + offset, 0, 1);
        const end = new Date(now.getFullYear() + offset, 11, 31);
        return { start, end, label: `Tahun ${start.getFullYear()}` };
      } else {
        const start = new Date(now);
        start.setDate(now.getDate() - now.getDay() + 1 + (offset * 7)); 
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        return { start, end, label: `${start.toLocaleDateString('id-ID', {day:'numeric', month:'short'})} - ${end.toLocaleDateString('id-ID', {day:'numeric', month:'short', year:'numeric'})}` };
      }
    };

    const { start, end, label } = getRange();

    // Data Grafik & List Transaksi
    const chartData = [];
    const filteredTxs = transactions.filter(t => {
      const txDate = new Date(t.date);
      return t.type === txType && txDate >= start && txDate <= new Date(end.setHours(23, 59, 59));
    }).sort((a,b) => new Date(b.date) - new Date(a.date));

    // Looping data harian/bulanan untuk grafik
    let stepDate = new Date(start);
    while (stepDate <= end) {
      const dateLabel = stepDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      const dayTxs = transactions.filter(t => t.type === txType && new Date(t.date).toDateString() === stepDate.toDateString());
      
      if (txType === 'income') {
        chartData.push({ date: dateLabel, total: dayTxs.reduce((s, t) => s + t.amount, 0) });
      } else {
        chartData.push({ 
          date: dateLabel, 
          Primer: dayTxs.filter(t=>t.category==='Primer').reduce((s,t)=>s+t.amount,0),
          Sekunder: dayTxs.filter(t=>t.category==='Sekunder').reduce((s,t)=>s+t.amount,0),
          Tersier: dayTxs.filter(t=>t.category==='Tersier').reduce((s,t)=>s+t.amount,0),
        });
      }
      stepDate.setDate(stepDate.getDate() + (period === 'year' ? 30 : 1)); // Lompati bulanan jika filter 'year'
    }

    return (
      <div className="p-5 pb-28 space-y-6">
        <h2 className="text-xl font-bold text-gray-800 pt-2 text-center">Detail Transaksi</h2>
        
        <div className="flex bg-[#ecf4eb] p-1 rounded-xl">
          <button onClick={() => setTxType('income')} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${txType === 'income' ? 'bg-[#2d4a3e] text-white shadow' : 'text-[#2d4a3e]'}`}>Pemasukan</button>
          <button onClick={() => setTxType('expense')} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${txType === 'expense' ? 'bg-[#2d4a3e] text-white shadow' : 'text-[#2d4a3e]'}`}>Pengeluaran</button>
        </div>

        {/* Filter Panah */}
        <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 space-y-3">
          <select value={period} onChange={(e) => {setPeriod(e.target.value); setOffset(0);}} className="w-full bg-[#ecf4eb] border-none rounded-xl p-3 font-semibold text-[#2d4a3e] focus:outline-none">
            <option value="week">Per Minggu</option>
            <option value="month">Per Bulan</option>
            <option value="year">Per Tahun</option>
          </select>
          
          <div className="flex items-center justify-between px-2">
            <button onClick={() => setOffset(o => o - 1)} className="p-2 text-[#2d4a3e] hover:bg-[#ecf4eb] rounded-lg transition"><ChevronLeft size={20}/></button>
            <span className="font-bold text-gray-700 text-sm">{label}</span>
            <button onClick={() => setOffset(o => o + 1)} className="p-2 text-[#2d4a3e] hover:bg-[#ecf4eb] rounded-lg transition"><ChevronRight size={20}/></button>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
          <h3 className="font-bold text-gray-800 mb-4">Grafik Tren (Rp)</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="date" tick={{fontSize: 10}} tickLine={false} axisLine={false} minTickGap={20} />
                <Tooltip formatter={(value) => `Rp ${value.toLocaleString('id-ID')}`} />
                {txType === 'income' ? (
                   <Line type="monotone" dataKey="total" stroke="#10b981" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                ) : (
                   <>
                     <Line type="monotone" dataKey="Primer" stroke="#18A999" strokeWidth={3} dot={false} activeDot={{ r: 5 }} />
                     <Line type="monotone" dataKey="Sekunder" stroke="#92817A" strokeWidth={3} dot={false} activeDot={{ r: 5 }} />
                     <Line type="monotone" dataKey="Tersier" stroke="#3F2A2B" strokeWidth={3} dot={false} activeDot={{ r: 5 }} />
                   </>
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 min-h-[300px]">
          <h3 className="font-bold text-gray-800 mb-4">Daftar Transaksi</h3>
          <div className="space-y-3">
            {filteredTxs.length > 0 ? filteredTxs.map(t => <TransactionItem key={t.id} t={t} />) : <p className="text-center text-gray-400 text-sm py-10">Belum ada data di periode ini</p>}
          </div>
        </div>
      </div>
    );
  };

  // 3. PAGE ADD TRANSACTION
  const AddView = () => {
    const [type, setType] = useState('expense');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [desc, setDesc] = useState('');
    const [wallet, setWallet] = useState(wallets[0]);
    const [newWallet, setNewWallet] = useState('');
    const [isAddingWallet, setIsAddingWallet] = useState(false);

    const handleSave = () => {
      if (!amount || !category) return alert('Jumlah dan Kategori wajib diisi!');
      
      let finalWallet = wallet;
      if (isAddingWallet && newWallet) {
        finalWallet = newWallet;
        setWallets([...wallets, newWallet]);
      }

      const newTx = {
        id: Date.now().toString(), type, amount: parseInt(amount), category, description: desc || '-', wallet: finalWallet, date: new Date().toISOString()
      };
      setTransactions([newTx, ...transactions]);
      alert('Data berhasil disimpan!');
      setAmount(''); setDesc(''); setNewWallet(''); setIsAddingWallet(false); setActiveTab('home');
    };

    return (
      <div className="p-5 pb-28 space-y-6">
        <h2 className="text-xl font-bold text-gray-800 pt-2 text-center">Tambahkan Data</h2>
        
        <div className="flex bg-[#ecf4eb] p-1 rounded-xl">
          <button onClick={() => {setType('income'); setCategory('')}} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${type === 'income' ? 'bg-[#2d4a3e] text-white shadow' : 'text-[#2d4a3e]'}`}>Uang Masuk</button>
          <button onClick={() => {setType('expense'); setCategory('')}} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${type === 'expense' ? 'bg-[#2d4a3e] text-white shadow' : 'text-[#2d4a3e]'}`}>Uang Keluar</button>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-5">
          <div>
            <label className="text-sm font-medium text-gray-600 mb-2 block">Jumlah Nominal</label>
            <div className="relative">
              <span className="absolute left-4 top-4 text-gray-500 font-bold">Rp</span>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-[#ecf4eb]/50 border-none rounded-xl py-4 pl-12 pr-4 font-bold text-xl focus:outline-none focus:ring-2 focus:ring-[#18A999]" placeholder="0" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 mb-2 block">Kategori</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-[#ecf4eb]/50 border-none rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-[#18A999]">
              <option value="" disabled>Pilih Kategori...</option>
              {type === 'income' ? INCOME_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>) : EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 mb-2 block">Dompet</label>
            {!isAddingWallet ? (
              <div className="flex gap-2">
                <select value={wallet} onChange={(e) => setWallet(e.target.value)} className="flex-1 bg-[#ecf4eb]/50 border-none rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-[#18A999]">
                  {wallets.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
                <button onClick={() => setIsAddingWallet(true)} className="bg-[#ecf4eb] text-[#2d4a3e] px-4 rounded-xl flex items-center justify-center">
                  <Plus size={20} />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input type="text" value={newWallet} onChange={(e) => setNewWallet(e.target.value)} placeholder="Cth: Debit BCA" className="flex-1 bg-[#ecf4eb]/50 border-none rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-[#18A999]" />
                <button onClick={() => setIsAddingWallet(false)} className="bg-red-100 text-red-600 px-4 rounded-xl text-sm font-bold">Batal</button>
              </div>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 mb-2 block">Keterangan</label>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Tulis rincian..." className="w-full bg-[#ecf4eb]/50 border-none rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-[#18A999] resize-none h-24"></textarea>
          </div>
          <button onClick={handleSave} className="w-full bg-[#2d4a3e] text-white font-bold py-4 rounded-xl shadow-lg hover:bg-[#1f332a] transition">
            Save Transaction
          </button>
        </div>
      </div>
    );
  };

  // 4. PAGE STATS
  const ActivitiesView = () => {
    const [timeFilter, setTimeFilter] = useState('monthly');
    const filteredTxs = useMemo(() => {
      const now = new Date();
      return transactions.filter(t => {
        const txDate = new Date(t.date);
        if (timeFilter === 'daily') return txDate.toDateString() === now.toDateString();
        if (timeFilter === 'monthly') { const past30 = new Date(); past30.setDate(now.getDate() - 30); return txDate >= past30; }
        return true;
      });
    }, [transactions, timeFilter]);

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
      <div className="p-5 pb-28 space-y-6">
        <h2 className="text-xl font-bold text-gray-800 pt-2 text-center">Activity Overview</h2>
        
        <select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)} className="w-full bg-[#ecf4eb] border-none rounded-xl p-4 font-semibold text-[#2d4a3e] focus:outline-none">
          <option value="daily">Hari Ini</option>
          <option value="monthly">Bulan Ini (30 Hari)</option>
          <option value="all">Semua Waktu</option>
        </select>

        <div className="flex gap-4">
           <div className="flex-1 bg-white rounded-3xl p-5 border border-slate-100 shadow-sm text-center">
             <div className="bg-emerald-100/50 w-12 h-12 rounded-full mx-auto flex items-center justify-center text-emerald-500 mb-2"><Download size={20}/></div>
             <span className="text-xs font-medium text-gray-500 block mb-1">Masuk</span>
             <p className="font-bold text-gray-800">Rp {statIncome.toLocaleString('id-ID')}</p>
           </div>
           <div className="flex-1 bg-white rounded-3xl p-5 border border-slate-100 shadow-sm text-center">
             <div className="bg-rose-100/50 w-12 h-12 rounded-full mx-auto flex items-center justify-center text-rose-500 mb-2"><Upload size={20}/></div>
             <span className="text-xs font-medium text-gray-500 block mb-1">Keluar</span>
             <p className="font-bold text-gray-800">Rp {statExpense.toLocaleString('id-ID')}</p>
           </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <h3 className="font-bold text-gray-800 mb-6 text-center">Distribusi Pengeluaran</h3>
          {pieData.length > 0 ? (
             <div className="h-52">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                   {pieData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={EXPENSE_COLORS[entry.name]} />
                   ))}
                 </Pie>
                 <Tooltip formatter={(value) => `Rp ${value.toLocaleString('id-ID')}`} />
                 <Legend />
               </PieChart>
             </ResponsiveContainer>
           </div>
          ) : <p className="text-center text-sm text-gray-400">Tidak ada pengeluaran</p>}
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <h3 className="font-bold text-gray-800 mb-4 text-center">Laporan Mutasi Bulanan</h3>
          <div className="space-y-3">
            {mutationData.length > 0 ? mutationData.map(m => (
              <div key={m.month} className="p-4 rounded-2xl border border-gray-100 flex justify-between items-center bg-[#ecf4eb]/20">
                <p className="font-bold text-[#2d4a3e] text-sm">{m.month}</p>
                <div className="text-right">
                  <p className="text-xs font-bold text-[#10b981] mb-0.5">+{m.income.toLocaleString('id-ID')}</p>
                  <p className="text-xs font-bold text-rose-500">-{m.expense.toLocaleString('id-ID')}</p>
                </div>
              </div>
            )) : <p className="text-center text-sm text-gray-400">Belum ada mutasi</p>}
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
        </div>
        <div className="absolute bottom-0 w-full bg-[#2d4a3e] px-6 py-5 rounded-t-[30px] flex justify-between items-end z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
          <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'home' ? 'text-white' : 'text-emerald-100/50'}`}>
            <Home size={22} strokeWidth={activeTab === 'home' ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Home</span>
          </button>
          <button onClick={() => setActiveTab('details')} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'details' ? 'text-white' : 'text-emerald-100/50'}`}>
            <FileText size={22} strokeWidth={activeTab === 'details' ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Details</span>
          </button>
          <button onClick={() => setActiveTab('add')} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'add' ? 'text-white' : 'text-emerald-100/50'}`}>
            <PlusCircle size={22} strokeWidth={activeTab === 'add' ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Add Tx</span>
          </button>
          <button onClick={() => setActiveTab('activities')} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'activities' ? 'text-white' : 'text-emerald-100/50'}`}>
            <BarChart2 size={22} strokeWidth={activeTab === 'activities' ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Stats</span>
          </button>
          <button className="flex flex-col items-center gap-1.5 text-emerald-100/30 cursor-not-allowed">
            <User size={22} strokeWidth={2} />
            <span className="text-[10px] font-medium">Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
}


