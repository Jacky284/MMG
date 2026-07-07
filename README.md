# 💸 MMG (My Money Gue) - Personal Finance Tracker

Aplikasi pencatat keuangan pribadi super ringan dan responsif, dirancang khusus untuk pengalaman *mobile* (Mobile-First Design). Aplikasi ini membantu melacak arus kas (Pemasukan & Pengeluaran), memantau saldo di berbagai dompet, serta mengelola tabungan darurat melalui fitur Brankas Deposito.

## ✨ Fitur Utama

- 📥 **Catat Pemasukan & Pengeluaran:** Pencatatan super cepat dengan dukungan multi-kategori.
- 🧮 **Kalkulator Kembalian Otomatis:** Input uang bayar dan kembalian, sistem akan otomatis menghitung total pengeluaran bersih.
- 💼 **Manajemen Multi-Dompet:** Lacak saldo secara terpisah (Cash, DANA, QRIS, dll).
- 🔒 **Brankas Deposito:** Amankan uang tabunganmu agar tidak tercampur dengan "Saldo Aktif" yang siap dijajankan. Fitur ini dilengkapi opsi Nabung dan Cairkan.
- 📊 **Analisis Grafik Interaktif:** Pantau pergerakan uangmu melalui grafik garis (*line chart*) dan diagram lingkaran (*pie chart*) dengan filter waktu: Mingguan, Bulanan, hingga Tahunan.
- 💾 **100% Offline & Private:** Tidak ada server pihak ketiga. Semua riwayat keuanganmu disimpan dengan aman di dalam memori perangkatmu sendiri (`localStorage`).

## 🛠️ Teknologi yang Digunakan

- **Framework:** React.js + Vite
- **Styling:** Tailwind CSS (Utility-first framework)
- **Charts/Graphs:** Recharts
- **Icons:** Lucide React
- **Mobile Wrapper:** Capacitor JS (Untuk konversi menjadi Android `.apk`)

## 🚀 Cara Menjalankan di Komputer Lokal

Pastikan kamu sudah menginstal **Node.js** di komputermu.

1. *Clone repository* ini:
   ```bash
   git clone [https://github.com/Jacky284/MMG.git](https://github.com/Jacky284/MMG.git)
