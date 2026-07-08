import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, 
  XAxis, CartesianGrid, LineChart, Line, BarChart, Bar 
} from 'recharts';
import { 
  Home, FileText, PlusCircle, BarChart2, 
  Settings, Download, Upload, User, Plus, ChevronLeft, ChevronRight, 
  Briefcase, Lock, Unlock, ChevronDown, ChevronUp, Search, Trash2, X, Users, CheckCircle
} from 'lucide-react';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

// --- KONFIGURASI PALET WARNA ---
const EXPENSE_COLORS = {
  'Primer': '#D97757',   
  'Sekunder': '#E9C46A', 
  'Tersier': '#457B9D',  
};
const PALETTE = Object.values(EXPENSE_COLORS);

const INCOME_CATEGORIES = ['Gaji', 'Freelance', 'Giving/Pemberian', 'Lainnya'];
const EXPENSE_CATEGORIES = Object.keys(EXPENSE_COLORS);

// --- KOMPONEN BARU: SPLASH SCREEN ---
const SplashScreen = ({ onComplete, userName }) => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 300); 
    const t2 = setTimeout(() => setStep(2), 2500); 
    const t3 = setTimeout(() => onComplete(), 3000); 
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  return (
    <div className={`fixed inset-0 bg-[#f8faf8] z-[9999] flex flex-col items-center justify-center transition-opacity duration-500 ease-in-out ${step === 2 ? 'opacity-0' : 'opacity-100'}`}>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-100/50 rounded-full blur-3xl opacity-60"></div>
      <div className="relative flex flex-col items-center justify-center z-10">
        <img 
          src="/favicon.svg" 
          alt="App Logo" 
          className={`w-24 h-24 mb-6 transition-all duration-1000 ease-out transform ${step >= 1 ? 'scale-100 opacity-100 translate-y-0' : 'scale-50 opacity-0 translate-y-10'}`} 
        />
        <h1 className={`text-2xl font-bold text-[#2d4a3e] tracking-wide transition-all duration-1000 delay-300 ease-out transform ${step >= 1 ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          Welcome, {userName.split(' ')[0]}!
        </h1>
        <div className={`flex items-center gap-2 mt-3 transition-all duration-1000 delay-500 ease-out transform ${step >= 1 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <div className="w-4 h-4 border-2 border-[#2d4a3e] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 text-sm font-medium tracking-wide">Menyiapkan ruang kerja...</p>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [showSplash, setShowSplash] = useState(true); 
  const [activeTab, setActiveTab] = useState('home');
  
  // STATE DATA UTAMA
  const [userName, setUserName] = useState('Muhammad Zaki');
  const [transactions, setTransactions] = useState([]);
  const [wallets, setWallets] = useState(['Cash', 'Dana', 'Debit (BCA)']);
  const [deposits, setDeposits] = useState([]); 
  const [receivables, setReceivables] = useState([]); 
  
  // STATE FITUR EDIT & SETTINGS
  const [editTx, setEditTx] = useState(null); 
  const [showSettings, setShowSettings] = useState(false); 
  const fileInputRef = useRef(null);

  useEffect(() => {
    const savedName = localStorage.getItem('mmg_username');
    const savedTxs = localStorage.getItem('mmg_transactions');
    const savedWallets = localStorage.getItem('mmg_wallets');
    const savedDeposits = localStorage.getItem('mmg_deposits');
    const savedReceivables = localStorage.getItem('mmg_receivables');
    
    if (savedName) setUserName(savedName);
    if (savedTxs) setTransactions(JSON.parse(savedTxs));
    if (savedWallets) setWallets(JSON.parse(savedWallets));
    if (savedDeposits) setDeposits(JSON.parse(savedDeposits));
    if (savedReceivables) setReceivables(JSON.parse(savedReceivables));
  }, []);

  useEffect(() => {
    localStorage.setItem('mmg_username', userName);
    localStorage.setItem('mmg_transactions', JSON.stringify(transactions));
    localStorage.setItem('mmg_wallets', JSON.stringify(wallets));
    localStorage.setItem('mmg_deposits', JSON.stringify(deposits));
    localStorage.setItem('mmg_receivables', JSON.stringify(receivables));
  }, [userName, transactions, wallets, deposits, receivables]);

  useEffect(() => {
    if (activeTab !== 'add') setEditTx(null);
  }, [activeTab]);

  // --- FUNGSI BACKUP & EXPORT ---
  const handleExportJSON = async () => {
    const data = { userName, transactions, wallets, deposits, receivables };
    const jsonString = JSON.stringify(data);
    const fileName = "mmg_backup.json";

    try {
      const result = await Filesystem.writeFile({ path: fileName, data: jsonString, directory: Directory.Cache, encoding: Encoding.UTF8 });
      await Share.share({ title: 'Backup Data MMG', text: 'Ini file backup aplikasi MMG kamu.', url: result.uri });
    } catch (error) {
      console.log("Beralih ke mode browser...");
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = fileName; a.click();
    }
  };

  const handleImportJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.transactions) setTransactions(data.transactions);
        if (data.wallets) setWallets(data.wallets);
        if (data.deposits) setDeposits(data.deposits);
        if (data.receivables) setReceivables(data.receivables);
        if (data.userName) setUserName(data.userName);
        alert("Data berhasil di-restore!");
        setShowSettings(false);
      } catch (err) {
        alert("File backup tidak valid!");
      }
    };
    reader.readAsText(file);
  };

  const handleExportCSV = async () => {
    let csv = "ID,Tipe,Nominal,Kategori,Dompet,Deskripsi,Tanggal\n";
    transactions.forEach(t => {
      csv += `${t.id},${t.type},${t.amount},${t.category},${t.wallet},"${t.description}",${t.date}\n`;
    });
    const fileName = "mmg_laporan_transaksi.csv";

    try {
      const result = await Filesystem.writeFile({ path: fileName, data: csv, directory: Directory.Cache, encoding: Encoding.UTF8 });
      await Share.share({ title: 'Laporan Excel MMG', text: 'File rekap transaksi MMG (buka pakai Excel/WPS).', url: result.uri });
    } catch (error) {
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = fileName; a.click();
    }
  };

  // --- KOMPONEN BANTUAN ---
  const PageHeader = ({ title, subtitle, icon: Icon }) => (
    <div className="flex justify-between items-center pt-1 mb-6 md:mt-4">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-[#ecf4eb] flex items-center justify-center text-[#2d4a3e] font-bold shadow-sm">
          <Icon size={24} className="md:w-7 md:h-7" />
        </div>
        <div>
          <p className="text-[11px] md:text-sm text-gray-500 font-medium">{subtitle}</p>
          <p className="text-lg md:text-2xl font-bold text-gray-800 leading-tight">{title}</p>
        </div>
      </div>
      <button onClick={() => setShowSettings(true)} className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition shadow-sm">
        <Settings size={20} className="md:w-6 md:h-6" />
      </button>
    </div>
  );

  const TransactionItem = ({ t, isDeposit = false, onClick }) => {
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
      <div onClick={onClick} className={`flex justify-between items-center bg-[#ecf4eb]/40 p-3.5 md:p-4 rounded-2xl border border-[#ecf4eb]/60 ${onClick ? 'cursor-pointer hover:bg-[#ecf4eb]/80 active:scale-[0.98] transition-all' : ''}`}>
        <div className="flex items-center gap-4">
          <div className="bg-white p-2.5 md:p-3 rounded-xl text-[#2d4a3e] shadow-sm">
            <IconComp size={20} className="md:w-6 md:h-6"/>
          </div>
          <div>
            <p className="font-bold text-gray-800 text-sm md:text-base leading-tight mb-0.5">{title}</p>
            <p className="text-[10px] md:text-xs text-gray-500">{dateStr}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-bold text-sm md:text-base leading-tight mb-0.5" style={{ color: txColor }}>
            {txSign} Rp {t.amount.toLocaleString('id-ID')}
          </p>
          <p className="text-[10px] md:text-xs text-gray-500 font-medium">
            {descText}
          </p>
        </div>
      </div>
    );
  };

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
        end.setDate(start.getDate() + 6); end.setHours(23, 59, 59);
        return { start, end, label: `${start.toLocaleDateString('id-ID', {day:'numeric', month:'short'})} - ${end.toLocaleDateString('id-ID', {day:'numeric', month:'short'})}` };
      }
    };
    return { period, setPeriod, offset, setOffset, ...getRange() };
  };

  // --- 1. PAGE HOME ---
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
      <div className="p-4 md:px-8 pb-32 space-y-6">
        <PageHeader title={userName} subtitle="Welcome 👋" icon={User} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* KOLOM KIRI (Saldo & Tombol Utama) */}
          <div className="space-y-4">
            <div className="bg-[#2d4a3e] rounded-[24px] p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
              <div className="flex justify-between items-end mb-2">
                 <p className="text-emerald-100/80 text-xs md:text-sm font-medium">Saldo Aktif (Bisa Dipakai)</p>
                 <p className="text-[10px] md:text-xs text-emerald-100/60 font-semibold flex items-center gap-1.5 bg-black/20 px-2 py-1 rounded-full">
                   <Lock size={12}/> Tabungan: Rp {netDeposit.toLocaleString('id-ID')}
                 </p>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">Rp {activeBalance.toLocaleString('id-ID')}</h2>
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                {walletBalances.map((wb, idx) => (
                   <div key={wb.name} className="bg-white/10 p-3 md:p-4 rounded-2xl min-w-[110px] md:min-w-[140px] border-l-4 shadow-sm backdrop-blur-md" style={{borderColor: PALETTE[idx % 3]}}>
                      <p className="text-[9px] md:text-[11px] text-gray-300 uppercase tracking-wider mb-1 font-semibold">{wb.name}</p>
                      <p className="font-bold text-sm md:text-base">Rp {wb.balance.toLocaleString('id-ID')}</p>
                   </div>
                ))}
              </div>
            </div>

            <button onClick={() => { setEditTx(null); setActiveTab('add'); }} className="w-full bg-[#ecf4eb] hover:bg-[#d5ecd2] transition-colors rounded-2xl p-4 md:p-5 flex items-center justify-between text-[#2d4a3e] shadow-sm border border-emerald-100/50">
              <div className="flex items-center gap-2 font-bold text-sm md:text-base"><Download size={20} /> Catat Transaksi Baru</div>
              <PlusCircle size={20} />
            </button>
          </div>

          {/* KOLOM KANAN (Recent Activity) */}
          <div className="bg-white p-5 md:p-6 rounded-[24px] shadow-sm border border-slate-100 flex flex-col h-full">
            <div className="flex justify-between items-center mb-4 md:mb-6">
              <h3 className="font-bold text-sm md:text-base text-gray-800">Aktivitas Terakhir</h3>
              <span onClick={() => setActiveTab('details')} className="text-xs font-semibold text-emerald-600 cursor-pointer bg-emerald-50 px-3 py-1.5 rounded-full hover:bg-emerald-100 transition">Lihat Semua</span>
            </div>
            <div className="space-y-3 flex-1">
              {recentTxs.length > 0 ? recentTxs.map(t => <TransactionItem key={t.id} t={t} onClick={() => { setEditTx(t); setActiveTab('add'); }} />) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2 py-10">
                  <FileText size={40} className="opacity-20"/>
                  <p className="text-xs md:text-sm font-medium">Belum ada transaksi</p>
                </div>
              )}
            </div>
          </div>
          
        </div>
      </div>
    );
  };

  // --- 2. PAGE DETAILS ---
  const DetailsView = () => {
    const [txType, setTxType] = useState('expense'); 
    const [searchTerm, setSearchTerm] = useState('');
    const { period, setPeriod, offset, setOffset, start, end, label } = useTimeFilter();

    const [showAddPiutang, setShowAddPiutang] = useState(false);
    const [pName, setPName] = useState('');
    const [pAmount, setPAmount] = useState('');
    const [pDesc, setPDesc] = useState('');
    const [pWallet, setPWallet] = useState(wallets[0]);

    const handleSavePiutang = () => {
      const amt = parseInt(pAmount.replace(/\D/g, ''), 10);
      if (!pName || !amt) return alert('Nama dan nominal wajib diisi!');
      const newP = { id: Date.now().toString(), name: pName, amount: amt, description: pDesc, wallet: pWallet, date: new Date().toISOString(), status: 'unpaid' };
      const newExpenseTx = { id: `tx_${newP.id}`, type: 'expense', amount: amt, category: 'Tersier', description: `Kasbon: ${pName} - ${pDesc}`, wallet: pWallet, date: new Date().toISOString() };
      setReceivables([newP, ...receivables]); setTransactions([newExpenseTx, ...transactions]);
      setShowAddPiutang(false); setPName(''); setPAmount(''); setPDesc(''); alert(`Piutang dicatat & saldo dompet dipotong!`);
    };

    const handleLunasPiutang = (piutang) => {
      if(!window.confirm(`Lunasin utang Rp ${piutang.amount.toLocaleString('id-ID')} dari ${piutang.name}? Uang akan masuk ke dompet ${piutang.wallet}.`)) return;
      const updatedRecs = receivables.map(r => r.id === piutang.id ? { ...r, status: 'paid' } : r);
      setReceivables(updatedRecs);
      const newIncomeTx = { id: `lunas_${Date.now()}`, type: 'income', amount: piutang.amount, category: 'Lainnya', description: `Lunas: ${piutang.name}`, wallet: piutang.wallet, date: new Date().toISOString() };
      setTransactions([newIncomeTx, ...transactions]);
    };

    const chartData = [];
    const txsInPeriod = transactions.filter(t => {
      const txDate = new Date(t.date);
      const matchSearch = (t.description || '').toLowerCase().includes(searchTerm.toLowerCase()) || t.category.toLowerCase().includes(searchTerm.toLowerCase());
      return txDate >= start && txDate <= end && matchSearch;
    });

    const filteredTxs = txsInPeriod.filter(t => t.type === txType).sort((a,b) => new Date(b.date) - new Date(a.date));
    const searchPiutang = receivables.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()) || (r.description || '').toLowerCase().includes(searchTerm.toLowerCase()));

    // Chart Logic remains the same...
    if (period === 'year') {
      for (let m = 0; m < 12; m++) {
        const mStart = new Date(start.getFullYear(), m, 1);
        const mEnd = new Date(start.getFullYear(), m + 1, 0, 23, 59, 59);
        const monthLabel = mStart.toLocaleDateString('id-ID', { month: 'short' });
        const monthTxs = txsInPeriod.filter(t => t.type === txType && new Date(t.date) >= mStart && new Date(t.date) <= mEnd);
        if (txType === 'income') chartData.push({ date: monthLabel, total: monthTxs.reduce((s,t) => s+t.amount, 0) });
        else if (txType === 'expense') {
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
        if (txType === 'income') chartData.push({ date: dateLabel, total: dayTxs.reduce((s,t) => s+t.amount, 0) });
        else if (txType === 'expense') {
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
    const incomeByWallet = wallets.map(w => ({ name: w, total: periodIncome.filter(t=>t.wallet===w).reduce((s,t)=>s+t.amount,0) })).filter(w => w.total > 0);
    const expenseByCat = EXPENSE_CATEGORIES.map(c => ({ name: c, total: periodExpense.filter(t=>t.category===c).reduce((s,t)=>s+t.amount,0) })).filter(c => c.total > 0);

    return (
      <div className="p-4 md:px-8 pb-32 space-y-6">
        <PageHeader title="Catatan Mutasi" subtitle="Laporan & Filter Data" icon={FileText} />
        
        {/* GRID LAYOUT: KIRI (Filter/Grafik) | KANAN (List Transaksi) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* KOLOM KIRI (Menu Navigasi, Filter, Grafik) */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-4">
            
            <div className="flex bg-[#ecf4eb] p-1.5 rounded-xl shadow-inner">
              <button onClick={() => setTxType('income')} className={`flex-1 py-2.5 rounded-lg text-xs md:text-sm font-bold transition-all ${txType === 'income' ? 'bg-[#2d4a3e] text-white shadow-md' : 'text-[#2d4a3e] hover:bg-[#d5ecd2]'}`}>Masuk</button>
              <button onClick={() => setTxType('expense')} className={`flex-1 py-2.5 rounded-lg text-xs md:text-sm font-bold transition-all ${txType === 'expense' ? 'bg-[#2d4a3e] text-white shadow-md' : 'text-[#2d4a3e] hover:bg-[#d5ecd2]'}`}>Keluar</button>
              <button onClick={() => setTxType('piutang')} className={`flex-1 py-2.5 rounded-lg text-xs md:text-sm font-bold transition-all ${txType === 'piutang' ? 'bg-[#2d4a3e] text-white shadow-md' : 'text-[#2d4a3e] hover:bg-[#d5ecd2]'}`}>Piutang</button>
            </div>

            <div className="relative shadow-sm">
               <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
               <input 
                 type="text" placeholder={`Cari ${txType === 'piutang' ? 'nama peminjam...' : 'catatan transaksi...'}`} 
                 value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                 className="w-full bg-white border border-gray-200 rounded-2xl py-3.5 pl-11 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#2d4a3e] transition"
               />
            </div>

            {txType !== 'piutang' && (
              <>
                <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 space-y-3">
                  <select value={period} onChange={(e) => {setPeriod(e.target.value); setOffset(0);}} className="w-full bg-[#ecf4eb]/50 border border-gray-100 rounded-xl p-3 text-sm font-bold text-[#2d4a3e] focus:outline-none cursor-pointer hover:bg-[#ecf4eb] transition">
                    <option value="week">Per Minggu</option>
                    <option value="month">Per Bulan</option>
                    <option value="year">Per Tahun</option>
                  </select>
                  <div className="flex items-center justify-between px-2">
                    <button onClick={() => setOffset(o => o - 1)} className="p-2 text-[#2d4a3e] bg-gray-50 hover:bg-[#ecf4eb] rounded-lg transition"><ChevronLeft size={18}/></button>
                    <span className="font-bold text-gray-800 text-sm">{label}</span>
                    <button onClick={() => setOffset(o => o + 1)} className="p-2 text-[#2d4a3e] bg-gray-50 hover:bg-[#ecf4eb] rounded-lg transition"><ChevronRight size={18}/></button>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                  <h3 className="font-bold text-gray-800 mb-4 text-sm">Grafik Tren (Rp)</h3>
                  <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                        <XAxis dataKey="date" tick={{fontSize: 10}} tickLine={false} axisLine={false} minTickGap={15} />
                        <Tooltip formatter={(value) => `Rp ${value.toLocaleString('id-ID')}`} />
                        {txType === 'income' ? (
                          <Line type="monotone" dataKey="total" stroke="#10b981" strokeWidth={3} dot={false} activeDot={{ r: 5 }} />
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

                <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100">
                  <h3 className="font-bold text-[#2d4a3e] mb-3 text-sm">Rincian Total {txType === 'income' ? 'Pemasukan' : 'Pengeluaran'}</h3>
                  <div className="space-y-2">
                    {txType === 'income' ? (
                      incomeByWallet.length > 0 ? incomeByWallet.map(w => (
                        <div key={w.name} className="flex justify-between items-center text-sm border-b border-emerald-200/50 pb-1.5">
                          <span className="text-gray-600 font-medium">{w.name}</span>
                          <span className="font-bold text-[#10b981]">+ Rp {w.total.toLocaleString('id-ID')}</span>
                        </div>
                      )) : <p className="text-xs text-gray-500 italic">Tidak ada pemasukan</p>
                    ) : (
                      expenseByCat.length > 0 ? expenseByCat.map(c => (
                        <div key={c.name} className="flex justify-between items-center text-sm border-b border-emerald-200/50 pb-1.5">
                          <span className="text-gray-600 font-medium">{c.name}</span>
                          <span className="font-bold" style={{color: EXPENSE_COLORS[c.name]}}>- Rp {c.total.toLocaleString('id-ID')}</span>
                        </div>
                      )) : <p className="text-xs text-gray-500 italic">Tidak ada pengeluaran</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* KOLOM KANAN (List Transaksi / Piutang) */}
          <div className="lg:col-span-7 xl:col-span-8">
            {txType !== 'piutang' ? (
              <div className="bg-white rounded-[24px] p-5 md:p-6 shadow-sm border border-slate-100 min-h-[500px]">
                <h3 className="font-bold text-gray-800 mb-4 text-sm md:text-base border-b border-gray-100 pb-3">
                  {searchTerm ? `Hasil pencarian: "${searchTerm}"` : 'Daftar Transaksi (Klik untuk Edit)'}
                </h3>
                <div className="space-y-3">
                  {filteredTxs.length > 0 ? filteredTxs.map(t => <TransactionItem key={t.id} t={t} onClick={() => { setEditTx(t); setActiveTab('add'); }} />) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2 py-20">
                      <FileText size={48} className="opacity-20"/>
                      <p className="text-sm font-medium">Data tidak ditemukan</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-[24px] p-5 md:p-6 shadow-sm border border-slate-100 min-h-[500px]">
                 <div className="flex justify-between items-center mb-5 border-b border-gray-100 pb-3">
                    <h3 className="font-bold text-gray-800 text-sm md:text-base">Buku Catatan Utang Teman</h3>
                    <button onClick={() => setShowAddPiutang(true)} className="text-sm font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition px-3 py-1.5 rounded-lg flex items-center gap-1.5"><Plus size={16}/> Tambah</button>
                 </div>
                 
                 {showAddPiutang && (
                   <div className="bg-[#ecf4eb]/50 p-4 rounded-xl mb-6 border border-[#ecf4eb] space-y-3 shadow-inner">
                     <p className="font-bold text-xs text-gray-500 uppercase tracking-wide">Form Kasbon Baru</p>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                       <input type="text" placeholder="Nama Peminjam (Cth: Budi)" value={pName} onChange={(e) => setPName(e.target.value)} className="w-full p-2.5 text-sm font-medium rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500"/>
                       <input type="text" inputMode="numeric" placeholder="Nominal (Rp)" value={pAmount} onChange={(e) => { const val = e.target.value.replace(/\D/g, ''); setPAmount(val ? parseInt(val).toLocaleString('id-ID') : '');}} className="w-full p-2.5 text-sm font-medium rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500"/>
                     </div>
                     <input type="text" placeholder="Catatan (Cth: Uang Nasgor)" value={pDesc} onChange={(e) => setPDesc(e.target.value)} className="w-full p-2.5 text-sm font-medium rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500"/>
                     <div className="flex gap-3 items-center bg-white p-2 rounded-lg border border-gray-100">
                        <span className="text-xs text-gray-600 font-bold ml-1">Tarik Saldo Dari:</span>
                        <select value={pWallet} onChange={(e) => setPWallet(e.target.value)} className="p-2 text-sm font-bold text-[#2d4a3e] rounded border-none bg-gray-50 outline-none flex-1 cursor-pointer">
                          {wallets.map(w => <option key={w} value={w}>{w}</option>)}
                        </select>
                     </div>
                     <div className="flex gap-3 pt-2">
                        <button onClick={handleSavePiutang} className="flex-1 bg-[#2d4a3e] hover:bg-[#1f332a] text-white text-sm py-3 rounded-lg font-bold shadow-md transition">Simpan Kasbon</button>
                        <button onClick={() => setShowAddPiutang(false)} className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 text-sm py-3 rounded-lg font-bold transition">Batal</button>
                     </div>
                   </div>
                 )}

                 <div className="space-y-3">
                   {searchPiutang.length > 0 ? searchPiutang.map(r => (
                     <div key={r.id} className={`p-4 rounded-xl border flex justify-between items-center transition ${r.status === 'paid' ? 'bg-gray-50/80 border-gray-100 opacity-60' : 'bg-white border-[#ecf4eb] shadow-sm hover:shadow-md'}`}>
                       <div className="flex items-center gap-4">
                         <div className={`p-2.5 md:p-3 rounded-xl shadow-sm ${r.status === 'paid' ? 'bg-gray-200 text-gray-500' : 'bg-orange-100 text-orange-600'}`}>
                           {r.status === 'paid' ? <CheckCircle size={20}/> : <Users size={20}/>}
                         </div>
                         <div>
                           <p className={`font-bold text-sm md:text-base mb-0.5 ${r.status === 'paid' ? 'text-gray-500 line-through' : 'text-gray-800'}`}>{r.name}</p>
                           <p className="text-xs text-gray-500 font-medium">{r.description} • Dipotong dari {r.wallet}</p>
                         </div>
                       </div>
                       <div className="text-right flex flex-col items-end">
                         <p className={`font-bold text-base md:text-lg mb-1 ${r.status === 'paid' ? 'text-gray-400' : 'text-orange-600'}`}>Rp {r.amount.toLocaleString('id-ID')}</p>
                         {r.status === 'unpaid' && (
                           <button onClick={() => handleLunasPiutang(r)} className="text-[10px] md:text-xs font-bold bg-emerald-50 text-emerald-600 px-3 py-1 rounded-md border border-emerald-200 hover:bg-emerald-100 transition shadow-sm">
                             Tandai Lunas
                           </button>
                         )}
                       </div>
                     </div>
                   )) : <p className="text-center text-gray-400 text-sm py-10 font-medium">Belum ada catatan utang</p>}
                 </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // --- 3. PAGE ADD / EDIT TRANSACTION ---
  const AddView = () => {
    const isEditing = !!editTx;
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

    useEffect(() => {
      if (editTx) {
        setType(editTx.type); setRawAmount(editTx.amount); setDisplayAmount(editTx.amount.toLocaleString('id-ID'));
        setCategory(editTx.category); setDesc(editTx.description); setWallet(editTx.wallet);
      }
    }, [editTx]);

    const handleAmountChange = (e, setRaw, setDisplay) => {
      const val = e.target.value.replace(/\D/g, ''); 
      if (!val) { setRaw(''); setDisplay(''); } 
      else { setRaw(parseInt(val, 10)); setDisplay(parseInt(val, 10).toLocaleString('id-ID')); }
    };

    const handleSave = () => {
      let finalAmount = rawAmount;
      if (type === 'expense' && rawChange > 0 && !isEditing) finalAmount = rawAmount - rawChange;
      if (!finalAmount || finalAmount <= 0 || !category) return alert('Jumlah Nominal dan Kategori wajib diisi dengan benar!');
      
      let finalWallet = wallet;
      if (isAddingWallet && newWallet) { finalWallet = newWallet; setWallets([...wallets, newWallet]); }

      const txData = { id: isEditing ? editTx.id : Date.now().toString(), type, amount: finalAmount, category, description: desc || '-', wallet: finalWallet, date: isEditing ? editTx.date : new Date().toISOString() };
      if (isEditing) { setTransactions(transactions.map(t => t.id === txData.id ? txData : t)); alert('Data diperbarui!'); } 
      else { setTransactions([txData, ...transactions]); alert(`Tersimpan! Rp ${finalAmount.toLocaleString('id-ID')}`); }
      
      setRawAmount(''); setDisplayAmount(''); setRawChange(''); setDisplayChange(''); setDesc(''); setNewWallet(''); setIsAddingWallet(false); setEditTx(null); setActiveTab('home');
    };

    const handleDelete = () => {
      if(window.confirm('Yakin ingin menghapus transaksi ini?')) { setTransactions(transactions.filter(t => t.id !== editTx.id)); setEditTx(null); setActiveTab('home'); }
    };

    const focusColor = type === 'income' ? 'focus:ring-[#10b981]' : 'focus:ring-[#D97757]';

    return (
      <div className="p-4 md:px-8 pb-32 space-y-6">
        <PageHeader title={isEditing ? "Edit Data" : "Tambahkan Data"} subtitle={isEditing ? "Perbaiki kesalahan pencatatan" : "Catat arus uang terbaru"} icon={isEditing ? FileText : PlusCircle} />
        
        {/* CARD CONTAINER (Dibatasi max-w-2xl supaya di layar lebar nggak memanjang aneh) */}
        <div className="max-w-2xl mx-auto w-full">
          <div className="flex bg-[#ecf4eb] p-1.5 rounded-xl mb-6 shadow-inner">
            <button onClick={() => {if(!isEditing) {setType('income'); setCategory(''); setRawChange(''); setDisplayChange('');}}} className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${type === 'income' ? 'bg-[#2d4a3e] text-white shadow-md' : 'text-[#2d4a3e] opacity-60 hover:bg-[#d5ecd2]'}`} disabled={isEditing}>Uang Masuk</button>
            <button onClick={() => {if(!isEditing) {setType('expense'); setCategory('');}}} className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${type === 'expense' ? 'bg-[#2d4a3e] text-white shadow-md' : 'text-[#2d4a3e] opacity-60 hover:bg-[#d5ecd2]'}`} disabled={isEditing}>Uang Keluar</button>
          </div>

          <div className="bg-white rounded-[24px] p-6 md:p-8 shadow-sm border border-slate-100 space-y-5">
            <div>
              <label className="text-xs md:text-sm font-bold text-gray-500 mb-2 block tracking-wide uppercase">
                {type === 'expense' ? 'Uang Dibayarkan' : 'Jumlah Nominal'}
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg md:text-xl">Rp</span>
                <input 
                  type="text" inputMode="numeric" value={displayAmount} onChange={(e) => handleAmountChange(e, setRawAmount, setDisplayAmount)} 
                  className={`w-full bg-gray-50 border border-gray-200 rounded-xl py-4 md:py-5 pl-12 pr-4 font-bold text-xl md:text-2xl focus:bg-white focus:outline-none focus:ring-4 ${focusColor} transition-all`} 
                  placeholder="0" 
                />
              </div>
            </div>

            {type === 'expense' && !isEditing && (
              <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100/50">
                <label className="text-xs font-bold text-gray-500 mb-2 block tracking-wide uppercase">Kembalian (Opsional, isi jika ada)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-base md:text-lg">Rp</span>
                  <input 
                    type="text" inputMode="numeric" value={displayChange} onChange={(e) => handleAmountChange(e, setRawChange, setDisplayChange)} 
                    className={`w-full bg-white border border-gray-200 rounded-lg py-3 pl-12 pr-4 font-bold text-lg md:text-xl focus:outline-none focus:ring-4 ${focusColor} transition-all`} 
                    placeholder="0" 
                  />
                </div>
                {rawChange > 0 && rawAmount > 0 && (
                  <p className="text-xs md:text-sm text-[#D97757] font-bold mt-2 text-right">
                    Otomatis Tercatat: Rp {(rawAmount - rawChange).toLocaleString('id-ID')}
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-xs font-bold text-gray-500 mb-2 block tracking-wide uppercase">Kategori</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className={`w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm md:text-base font-bold text-gray-700 focus:bg-white focus:outline-none focus:ring-4 ${focusColor} cursor-pointer transition-all`}>
                  <option value="" disabled>Pilih Kategori...</option>
                  {type === 'income' ? INCOME_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>) : EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 mb-2 block tracking-wide uppercase">Dompet Sumber/Tujuan</label>
                {!isAddingWallet ? (
                  <div className="flex gap-2">
                    <select value={wallet} onChange={(e) => setWallet(e.target.value)} className={`flex-1 bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm md:text-base font-bold text-gray-700 focus:bg-white focus:outline-none focus:ring-4 ${focusColor} cursor-pointer transition-all`}>
                      {wallets.map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                    <button onClick={() => setIsAddingWallet(true)} className="bg-[#ecf4eb] text-[#2d4a3e] px-4 rounded-xl flex items-center justify-center transition hover:bg-[#d4e6d3] shadow-sm">
                      <Plus size={24} />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2 h-full">
                    <input type="text" value={newWallet} onChange={(e) => setNewWallet(e.target.value)} placeholder="Cth: Jenius" className={`flex-1 bg-white border border-gray-300 rounded-xl px-4 text-sm font-bold focus:outline-none focus:ring-4 ${focusColor}`} />
                    <button onClick={() => setIsAddingWallet(false)} className="bg-red-50 text-red-600 px-4 rounded-xl text-sm font-bold border border-red-200 hover:bg-red-100 transition">Batal</button>
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-end mb-2">
                <label className="text-xs font-bold text-gray-500 tracking-wide uppercase">Keterangan (Maks 20 Huruf)</label>
                <span className="text-[10px] md:text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{desc.length}/20</span>
              </div>
              <textarea 
                value={desc} maxLength={20} onChange={(e) => setDesc(e.target.value)} placeholder="Tulis rincian ringkas..." 
                className={`w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm md:text-base font-bold text-gray-700 focus:bg-white focus:outline-none focus:ring-4 ${focusColor} resize-none h-24 transition-all`}
              ></textarea>
            </div>
            
            <div className="pt-2">
               <button onClick={handleSave} className="w-full bg-[#2d4a3e] text-white font-bold py-4 md:py-5 rounded-2xl shadow-lg hover:bg-[#1f332a] hover:shadow-xl hover:-translate-y-0.5 transition-all tracking-wider text-sm md:text-base">
                 {isEditing ? "SIMPAN PERUBAHAN" : "SIMPAN TRANSAKSI SEKARANG"}
               </button>

               {isEditing && (
                 <button onClick={handleDelete} className="w-full bg-white text-red-500 border-2 border-red-100 font-bold py-3.5 md:py-4 rounded-2xl hover:bg-red-50 transition-colors tracking-wide text-sm md:text-base mt-3 flex items-center justify-center gap-2">
                   <Trash2 size={18}/> Hapus Transaksi Ini
                 </button>
               )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --- 4. PAGE STATS ---
  const ActivitiesView = () => {
    const { period, setPeriod, offset, setOffset, start, end, label } = useTimeFilter();
    const [expandedMonths, setExpandedMonths] = useState({});
    const toggleMonth = (monthStr) => { setExpandedMonths(prev => ({ ...prev, [monthStr]: !prev[monthStr] })); };

    const filteredTxs = transactions.filter(t => { const txDate = new Date(t.date); return txDate >= start && txDate <= end; }).sort((a,b) => new Date(b.date) - new Date(a.date)); 
    const statIncome = filteredTxs.filter(t => t.type === 'income').reduce((a, b) => a + b.amount, 0);
    const statExpense = filteredTxs.filter(t => t.type === 'expense').reduce((a, b) => a + b.amount, 0);
    const pieData = EXPENSE_CATEGORIES.map(cat => ({ name: cat, value: filteredTxs.filter(t => t.type === 'expense' && t.category === cat).reduce((acc, curr) => acc + curr.amount, 0) })).filter(d => d.value > 0);

    const mutationData = useMemo(() => {
      const grouped = {};
      transactions.forEach(t => {
        const d = new Date(t.date); const monthYear = d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
        if (!grouped[monthYear]) grouped[monthYear] = { income: 0, expense: 0, timestamp: d.getTime() };
        if (t.type === 'income') grouped[monthYear].income += t.amount; else grouped[monthYear].expense += t.amount;
      });
      return Object.entries(grouped).sort((a, b) => b[1].timestamp - a[1].timestamp).map(([month, data]) => ({ month, ...data }));
    }, [transactions]);

    const txsGroupedByMonth = useMemo(() => {
      if (period !== 'year') return {};
      const groups = {};
      filteredTxs.forEach(t => { const txDate = new Date(t.date); const monthStr = txDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }); if (!groups[monthStr]) groups[monthStr] = []; groups[monthStr].push(t); });
      return groups;
    }, [filteredTxs, period]);

    const getWeeklyStackedData = () => {
      const days = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
      const weekData = days.map(day => ({ name: day, Primer: 0, Sekunder: 0, Tersier: 0 }));
      let chartStart = new Date(start);
      if (period !== 'week') { const now = new Date(); const dayOfWeek = now.getDay() || 7; chartStart = new Date(now); chartStart.setDate(now.getDate() - dayOfWeek + 1); chartStart.setHours(0,0,0,0); }
      const chartEnd = new Date(chartStart); chartEnd.setDate(chartStart.getDate() + 6); chartEnd.setHours(23,59,59,999);

      transactions.forEach(t => {
        if (t.type === 'expense') {
          const d = new Date(t.date);
          if (d >= chartStart && d <= chartEnd) {
            const dayIdx = (d.getDay() || 7) - 1; 
            if (weekData[dayIdx][t.category] !== undefined) weekData[dayIdx][t.category] += t.amount;
          }
        }
      });
      return weekData;
    };
    const barChartData = getWeeklyStackedData();

    return (
      <div className="p-4 md:px-8 pb-32 space-y-6">
        <PageHeader title="Activity Overview" subtitle="Pantau kesehatan finansial" icon={BarChart2} />
        
        <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 md:w-1/2 lg:w-1/3 mx-auto">
          <select value={period} onChange={(e) => {setPeriod(e.target.value); setOffset(0);}} className="w-full bg-[#ecf4eb]/50 border-none rounded-xl p-3 text-sm font-bold text-[#2d4a3e] focus:outline-none cursor-pointer hover:bg-[#ecf4eb] transition">
            <option value="week">Per Minggu</option><option value="month">Per Bulan</option><option value="year">Per Tahun</option>
          </select>
          <div className="flex items-center justify-between px-2 mt-2">
            <button onClick={() => setOffset(o => o - 1)} className="p-2 text-[#2d4a3e] bg-gray-50 hover:bg-[#ecf4eb] rounded-lg transition"><ChevronLeft size={18}/></button>
            <span className="font-bold text-gray-800 text-sm">{label}</span>
            <button onClick={() => setOffset(o => o + 1)} className="p-2 text-[#2d4a3e] bg-gray-50 hover:bg-[#ecf4eb] rounded-lg transition"><ChevronRight size={18}/></button>
          </div>
        </div>

        {/* GRID LAYOUT STATS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* KOLOM KIRI (Rekap & Grafik) */}
          <div className="space-y-6">
            <div className="flex gap-4">
               <div className="flex-1 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm text-center transition hover:shadow-md">
                 <div className="bg-emerald-100/50 w-12 h-12 rounded-full mx-auto flex items-center justify-center text-emerald-500 mb-2.5"><Download size={22}/></div>
                 <span className="text-xs font-bold text-gray-500 block mb-1 uppercase tracking-wider">Total Masuk</span>
                 <p className="font-bold text-gray-800 text-lg md:text-xl">Rp {statIncome.toLocaleString('id-ID')}</p>
               </div>
               <div className="flex-1 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm text-center transition hover:shadow-md">
                 <div className="bg-rose-100/50 w-12 h-12 rounded-full mx-auto flex items-center justify-center text-rose-500 mb-2.5"><Upload size={22}/></div>
                 <span className="text-xs font-bold text-gray-500 block mb-1 uppercase tracking-wider">Total Keluar</span>
                 <p className="font-bold text-gray-800 text-lg md:text-xl">Rp {statExpense.toLocaleString('id-ID')}</p>
               </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h3 className="font-bold text-gray-800 mb-5 text-sm md:text-base border-b border-gray-100 pb-3">Pengeluaran Harian (Senin - Minggu)</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData} margin={{top:5, right:10, left:-5, bottom:0}}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis dataKey="name" tick={{fontSize: 11, fontWeight: 500}} tickLine={false} axisLine={false} padding={{ left: 15, right: 15 }} />
                    <Tooltip formatter={(value) => `Rp ${value.toLocaleString('id-ID')}`} cursor={{fill: '#f8faf8'}} />
                    <Legend wrapperStyle={{fontSize: '11px', fontWeight: 600, paddingTop: '10px'}} />
                    <Bar dataKey="Primer" stackId="a" fill={EXPENSE_COLORS['Primer']} barSize={32} />
                    <Bar dataKey="Sekunder" stackId="a" fill={EXPENSE_COLORS['Sekunder']} />
                    <Bar dataKey="Tersier" stackId="a" fill={EXPENSE_COLORS['Tersier']} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h3 className="font-bold text-gray-800 mb-5 text-sm md:text-base border-b border-gray-100 pb-3">Porsi Pengeluaran</h3>
              {pieData.length > 0 ? (
                 <div className="h-48">
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                       {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={EXPENSE_COLORS[entry.name]} />)}
                     </Pie>
                     <Tooltip formatter={(value) => `Rp ${value.toLocaleString('id-ID')}`} />
                     <Legend wrapperStyle={{fontSize: '11px', fontWeight: 600}}/>
                   </PieChart>
                 </ResponsiveContainer>
               </div>
              ) : <p className="text-center text-sm text-gray-400 font-medium py-10">Data tidak tersedia</p>}
            </div>
          </div>

          {/* KOLOM KANAN (Mutasi Total & Daftar Detail) */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h3 className="font-bold text-gray-800 mb-4 text-sm md:text-base border-b border-gray-100 pb-3">Ringkasan Mutasi Bulanan</h3>
              <div className="space-y-3">
                {mutationData.length > 0 ? mutationData.map(m => (
                  <div key={m.month} className="p-4 rounded-xl border border-gray-100 flex justify-between items-center bg-gray-50 hover:bg-emerald-50/50 transition">
                    <p className="font-bold text-[#2d4a3e] text-sm">{m.month}</p>
                    <div className="text-right">
                      <p className="text-xs font-bold text-[#10b981] mb-1">+{m.income.toLocaleString('id-ID')}</p>
                      <p className="text-xs font-bold text-rose-500">-{m.expense.toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                )) : <p className="text-center text-sm text-gray-400 py-6 font-medium">Belum ada rekap mutasi</p>}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 min-h-[300px]">
              <h3 className="font-bold text-gray-800 mb-4 text-sm md:text-base border-b border-gray-100 pb-3">Rincian Transaksi Periodik</h3>
              <div className="space-y-3">
                {period === 'year' ? (
                  Object.keys(txsGroupedByMonth).length > 0 ? (
                    Object.entries(txsGroupedByMonth).map(([monthStr, txs]) => (
                      <div key={monthStr} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        <button onClick={() => toggleMonth(monthStr)} className="w-full bg-[#ecf4eb]/60 p-4 flex justify-between items-center transition hover:bg-[#d5ecd2]">
                          <span className="font-bold text-sm text-[#2d4a3e]">{monthStr}</span>
                          <span className="text-[#2d4a3e]">{expandedMonths[monthStr] ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}</span>
                        </button>
                        {expandedMonths[monthStr] && (
                          <div className="p-3 space-y-2 bg-white">
                            {txs.map(t => <TransactionItem key={t.id} t={t} onClick={() => { setEditTx(t); setActiveTab('add'); }} />)}
                          </div>
                        )}
                      </div>
                    ))
                  ) : <p className="text-center text-gray-400 text-sm py-10 font-medium">Tidak ada data di tahun ini</p>
                ) : (
                  filteredTxs.length > 0 ? (
                    filteredTxs.map(t => <TransactionItem key={t.id} t={t} onClick={() => { setEditTx(t); setActiveTab('add'); }} />)
                  ) : <p className="text-center text-gray-400 text-sm py-10 font-medium">Tidak ada data di periode ini</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 5. PAGE DEPOSITO
  const DepositoView = () => {
    const [depType, setDepType] = useState('in'); 
    const [rawAmount, setRawAmount] = useState('');
    const [displayAmount, setDisplayAmount] = useState('');
    const [wallet, setWallet] = useState(wallets[0]);

    const totalDepositIn = deposits.filter(d => d.type !== 'out').reduce((a, b) => a + b.amount, 0);
    const totalDepositOut = deposits.filter(d => d.type === 'out').reduce((a, b) => a + b.amount, 0);
    const netDeposit = totalDepositIn - totalDepositOut;
    const now = new Date();
    const thisMonthDeposits = deposits.filter(d => { const dDate = new Date(d.date); return dDate.getMonth() === now.getMonth() && dDate.getFullYear() === now.getFullYear(); });
    const thisMonthDeposit = thisMonthDeposits.filter(d => d.type !== 'out').reduce((a,b)=>a+b.amount,0) - thisMonthDeposits.filter(d => d.type === 'out').reduce((a,b)=>a+b.amount,0);

    const handleAmountChange = (e) => {
      const val = e.target.value.replace(/\D/g, ''); 
      if (!val) { setRawAmount(''); setDisplayAmount(''); } 
      else { setRawAmount(parseInt(val, 10)); setDisplayAmount(parseInt(val, 10).toLocaleString('id-ID')); }
    };

    const handleSaveDeposit = () => {
      if (!rawAmount || rawAmount <= 0) return alert('Masukkan nominal dengan benar euy!');
      if (depType === 'in') {
        const wBalance = transactions.filter(t => t.type === 'income' && t.wallet === wallet).reduce((a,b)=>a+b.amount,0) - transactions.filter(t => t.type === 'expense' && t.wallet === wallet).reduce((a,b)=>a+b.amount,0) - deposits.filter(d => d.wallet === wallet && d.type !== 'out').reduce((a,b)=>a+b.amount,0) + deposits.filter(d => d.wallet === wallet && d.type === 'out').reduce((a,b)=>a+b.amount,0);
        if (rawAmount > wBalance) return alert(`Gagal! Saldo di dompet ${wallet} kamu (Rp ${wBalance.toLocaleString('id-ID')}) tidak cukup untuk tabungan sebesar ini.`);
      } else {
        if (rawAmount > netDeposit) return alert(`Tabunganmu cuma ada Rp ${netDeposit.toLocaleString('id-ID')}, nggak cukup buat dicairin segitu!`);
      }
      
      setDeposits([{ id: Date.now().toString(), type: depType, amount: rawAmount, wallet: wallet, date: new Date().toISOString() }, ...deposits]);
      alert(depType === 'in' ? `Berhasil menabung Rp ${rawAmount.toLocaleString('id-ID')} dari ${wallet}!` : `Berhasil mencairkan tabungan Rp ${rawAmount.toLocaleString('id-ID')} ke ${wallet}!`);
      setRawAmount(''); setDisplayAmount('');
    };

    const focusColor = depType === 'in' ? 'focus:ring-[#2d4a3e]' : 'focus:ring-[#D97757]';

    return (
      <div className="p-4 md:px-8 pb-32 space-y-6 font-sans">
        <PageHeader title="Brankas Deposito" subtitle="Simpanan darurat masa depan" icon={Briefcase} />

        {/* BUNGKUSAN CARD TERPUSAT */}
        <div className="max-w-2xl mx-auto w-full space-y-6">
          <div className="bg-[#2d4a3e] rounded-[24px] p-8 md:p-10 text-white shadow-xl relative overflow-hidden text-center">
            <Briefcase className="absolute -right-10 -bottom-10 text-emerald-100/10 w-48 h-48" />
            <p className="text-emerald-100/80 text-sm font-bold mb-2 uppercase tracking-widest">Total Tabungan</p>
            <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">Rp {netDeposit.toLocaleString('id-ID')}</h2>
            <div className="bg-black/20 rounded-xl p-3 inline-block backdrop-blur-md border border-white/10">
               <p className="text-xs md:text-sm text-emerald-100/90 font-medium">
                 Aktivitas Bulan Ini: <span className="font-bold text-white ml-1 bg-white/20 px-2 py-1 rounded-md">{thisMonthDeposit >= 0 ? '+' : '-'} Rp {Math.abs(thisMonthDeposit).toLocaleString('id-ID')}</span>
               </p>
            </div>
          </div>

          <div className="bg-white rounded-[24px] p-6 md:p-8 shadow-sm border border-slate-100 space-y-5">
            <div className="flex bg-[#ecf4eb] p-1.5 rounded-xl mb-4 shadow-inner">
              <button onClick={() => setDepType('in')} className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${depType === 'in' ? 'bg-[#2d4a3e] text-white shadow-md' : 'text-[#2d4a3e] opacity-70 hover:bg-[#d5ecd2]'}`}>Nabung Dana</button>
              <button onClick={() => setDepType('out')} className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${depType === 'out' ? 'bg-[#D97757] text-white shadow-md' : 'text-[#2d4a3e] opacity-70 hover:bg-[#d5ecd2]'}`}>Cairkan Dana</button>
            </div>
            
            <div>
              <label className="text-xs font-bold text-gray-500 mb-2 block tracking-wide uppercase">
                 {depType === 'in' ? 'Nominal Ditabung' : 'Nominal Dicairkan'}
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">Rp</span>
                <input 
                  type="text" inputMode="numeric" value={displayAmount} onChange={handleAmountChange} 
                  className={`w-full bg-gray-50 border border-gray-200 rounded-xl py-4 md:py-5 pl-12 pr-4 font-bold text-xl md:text-2xl focus:bg-white focus:outline-none focus:ring-4 ${focusColor} transition-all`} 
                  placeholder="0" 
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 mb-2 block tracking-wide uppercase">
                 {depType === 'in' ? 'Ambil Dari Dompet' : 'Cairkan Ke Dompet'}
              </label>
              <select value={wallet} onChange={(e) => setWallet(e.target.value)} className={`w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm md:text-base font-bold text-gray-700 focus:bg-white focus:outline-none focus:ring-4 ${focusColor} cursor-pointer transition-all`}>
                {wallets.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>

            <button onClick={handleSaveDeposit} className={`w-full text-white font-bold py-4 md:py-5 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all tracking-wider text-sm md:text-base mt-4 ${depType === 'in' ? 'bg-[#2d4a3e] hover:bg-[#1f332a]' : 'bg-[#D97757] hover:bg-[#c36345]'}`}>
              {depType === 'in' ? 'KUNCI KE DALAM BRANKAS' : 'CAIRKAN SEKARANG JUGA'}
            </button>
          </div>

          <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 min-h-[250px]">
            <h3 className="font-bold text-gray-800 mb-4 text-sm md:text-base border-b border-gray-100 pb-3">Riwayat Transaksi Tabungan</h3>
            <div className="space-y-3">
              {deposits.length > 0 ? deposits.map(d => <TransactionItem key={d.id} t={d} isDeposit={true} />) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2 py-10">
                  <Briefcase size={40} className="opacity-20"/>
                  <p className="text-sm font-medium">Belum ada riwayat</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --- RENDERING UTAMA ---
  return (
    <>
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} userName={userName} />}
      
      {/* MODAL SETTINGS */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/60 z-[999] flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md relative shadow-2xl animate-in fade-in zoom-in duration-200">
             <button onClick={() => setShowSettings(false)} className="absolute top-5 right-5 text-gray-400 hover:text-gray-800 transition bg-gray-100 rounded-full p-1.5"><X size={20}/></button>
             <h2 className="font-bold text-xl md:text-2xl text-gray-800 mb-6 flex items-center gap-2"><Settings size={24}/> Pengaturan</h2>
             
             <div className="space-y-5">
               <div>
                 <label className="text-xs font-bold text-gray-500 mb-2 block uppercase tracking-wide">Nama Profil Utama</label>
                 <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3.5 text-sm md:text-base font-bold text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition" />
               </div>
               <div className="border-t border-gray-100 pt-5 space-y-3">
                 <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Pusat Data & Laporan</p>
                 <button onClick={handleExportJSON} className="w-full bg-blue-50 text-blue-700 font-bold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-blue-100 transition shadow-sm"><Download size={18}/> Download Backup Data (.json)</button>
                 
                 <div className="relative">
                   <input type="file" accept=".json" onChange={handleImportJSON} ref={fileInputRef} className="hidden" />
                   <button onClick={() => fileInputRef.current.click()} className="w-full bg-orange-50 text-orange-700 font-bold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-orange-100 transition shadow-sm"><Upload size={18}/> Restore Data (.json)</button>
                 </div>
                 
                 <button onClick={handleExportCSV} className="w-full bg-emerald-50 text-emerald-700 font-bold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-emerald-100 transition mt-4 border border-emerald-100 shadow-sm"><FileText size={18}/> Cetak Laporan ke Excel (.csv)</button>
               </div>
             </div>
           </div>
        </div>
      )}

      {/* CONTAINER UTAMA - FULLY RESPONSIVE */}
      <div className="min-h-screen bg-[#f8faf8] font-sans pb-24 md:pb-32">
        <div className="w-full max-w-7xl mx-auto relative min-h-screen">
          
          <div className="overflow-y-auto no-scrollbar">
            {activeTab === 'home' && <HomeView />}
            {activeTab === 'details' && <DetailsView />}
            {activeTab === 'add' && <AddView />}
            {activeTab === 'activities' && <ActivitiesView />}
            {activeTab === 'deposito' && <DepositoView />}
          </div>

          {/* --- BOTTOM NAV (FLOATING DOCK DI LAYAR BESAR) --- */}
          <div className="fixed bottom-0 w-full left-0 z-50 flex justify-center pointer-events-none pb-0 md:pb-6">
            
            {/* Nav Container */}
            <div className="bg-[#2d4a3e] w-full md:w-auto md:min-w-[550px] px-8 py-3 rounded-t-[30px] md:rounded-[30px] flex justify-between items-center shadow-[0_-10px_40px_rgba(0,0,0,0.15)] md:shadow-2xl h-[70px] md:h-[75px] pointer-events-auto relative border border-[#1f332a]">
              
              {/* Tombol Floating Add Tx */}
              <div className="absolute -top-6 md:-top-7 left-1/2 -translate-x-1/2">
                <button onClick={() => { setEditTx(null); setActiveTab('add'); }} className={`w-14 h-14 md:w-16 md:h-16 bg-[#ecf4eb] rounded-2xl md:rounded-[1.25rem] flex items-center justify-center shadow-xl border-[5px] border-[#f8faf8] hover:scale-105 transition-transform active:scale-95 ${activeTab === 'add' ? 'text-emerald-600 shadow-emerald-200/50' : 'text-[#2d4a3e]'}`}>
                  <Plus size={32} strokeWidth={3} className="md:w-8 md:h-8" />
                </button>
              </div>

              {/* Kiri */}
              <div className="flex gap-7 md:gap-10">
                <button onClick={() => setActiveTab('home')} className="flex flex-col items-center gap-1.5 w-12 transition-all group">
                  <div className={`transition-all duration-300 ${activeTab === 'home' ? 'bg-emerald-500/30 px-3 py-1.5 rounded-full' : 'px-3 py-1.5'}`}>
                    <Home size={22} strokeWidth={activeTab === 'home' ? 2.5 : 2} className={activeTab === 'home' ? 'text-white' : 'text-emerald-100/50 group-hover:text-emerald-100'} />
                  </div>
                  <span className={`text-[10px] md:text-xs font-bold ${activeTab === 'home' ? 'text-white' : 'text-emerald-100/50 group-hover:text-emerald-100/80'}`}>Home</span>
                </button>
                <button onClick={() => setActiveTab('details')} className="flex flex-col items-center gap-1.5 w-12 transition-all group">
                  <div className={`transition-all duration-300 ${activeTab === 'details' ? 'bg-emerald-500/30 px-3 py-1.5 rounded-full' : 'px-3 py-1.5'}`}>
                    <FileText size={22} strokeWidth={activeTab === 'details' ? 2.5 : 2} className={activeTab === 'details' ? 'text-white' : 'text-emerald-100/50 group-hover:text-emerald-100'} />
                  </div>
                  <span className={`text-[10px] md:text-xs font-bold ${activeTab === 'details' ? 'text-white' : 'text-emerald-100/50 group-hover:text-emerald-100/80'}`}>Details</span>
                </button>
              </div>

              {/* Ruang kosong tengah */}
              <div className="w-12 md:w-16"></div>

              {/* Kanan */}
              <div className="flex gap-7 md:gap-10">
                <button onClick={() => setActiveTab('activities')} className="flex flex-col items-center gap-1.5 w-12 transition-all group">
                  <div className={`transition-all duration-300 ${activeTab === 'activities' ? 'bg-emerald-500/30 px-3 py-1.5 rounded-full' : 'px-3 py-1.5'}`}>
                    <BarChart2 size={22} strokeWidth={activeTab === 'activities' ? 2.5 : 2} className={activeTab === 'activities' ? 'text-white' : 'text-emerald-100/50 group-hover:text-emerald-100'} />
                  </div>
                  <span className={`text-[10px] md:text-xs font-bold ${activeTab === 'activities' ? 'text-white' : 'text-emerald-100/50 group-hover:text-emerald-100/80'}`}>Stats</span>
                </button>
                <button onClick={() => setActiveTab('deposito')} className="flex flex-col items-center gap-1.5 w-12 transition-all group">
                  <div className={`transition-all duration-300 ${activeTab === 'deposito' ? 'bg-emerald-500/30 px-3 py-1.5 rounded-full' : 'px-3 py-1.5'}`}>
                    <Briefcase size={22} strokeWidth={activeTab === 'deposito' ? 2.5 : 2} className={activeTab === 'deposito' ? 'text-white' : 'text-emerald-100/50 group-hover:text-emerald-100'} />
                  </div>
                  <span className={`text-[10px] md:text-xs font-bold ${activeTab === 'deposito' ? 'text-white' : 'text-emerald-100/50 group-hover:text-emerald-100/80'}`}>Deposito</span>
                </button>
              </div>

            </div>
          </div>
          
        </div>
      </div>
    </>
  );
}