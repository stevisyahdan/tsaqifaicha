# Apotek Senyum Sehat - Management System

Sistem manajemen apotek modern yang dirancang untuk efisiensi operasional, akurasi stok (FEFO/FIFO), dan transparansi keuangan. Aplikasi ini mendukung sinkronisasi cloud melalui Supabase dan fitur input data massal.

## ✨ Fitur Utama
- **Dashboard Analytics**: Visualisasi komposisi inventori, stok kritis, dan ringkasan omzet harian.
- **Kasir (Point of Sale)**: Transaksi cepat dengan dukungan multi-satuan (Box, Strip, Tablet/Pcs) dan cetak struk otomatis.
- **Bulk Import Database**: Input ratusan data obat sekaligus hanya dengan mengunggah file CSV.
- **Manajemen Inventori (Batch System)**: Pelacakan stok per nomor batch dan tanggal kedaluwarsa.
- **Logistik & Pengadaan**: Alur Surat Pesanan (SP) yang terintegrasi dengan input Faktur Pembelian.
- **Hutang PBF (Inkaso)**: Monitoring jatuh tempo faktur dan cetak instruksi transfer bank kolektif.
- **Stock Opname**: Audit stok fisik per batch dengan penguncian sistem otomatis saat proses berlangsung.

## 🚀 Cara Instalasi

1. **Clone Repositori**
   ```bash
   git clone https://github.com/username/apotek-senyum-sehat.git
   cd apotek-senyum-sehat
   ```

2. **Install Dependensi**
   ```bash
   npm install
   ```

3. **Konfigurasi Environment** (Opsional untuk Sync Cloud)
   Buat file `.env` dan tambahkan:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Jalankan Aplikasi**
   ```bash
   npm run dev
   ```

## 📂 Format CSV untuk Import Obat
Untuk melakukan bulk import, gunakan kolom berikut dalam file CSV Anda:
`KODE_BARANG, NAMA_OBAT, MERK, GOLONGAN, PBF, DISC_PBF, HNA_BRUTO, SATUAN_BESAR, ISI_STRIP_PER_BOX, SATUAN_SEDANG, ISI_TAB_PER_STRIP, SATUAN_KECIL, MARGIN_PERSEN, STOK_AWAL, ED_YYYY_MM_DD`

---
*Dikembangkan dengan ❤️ untuk kemajuan Apotek Senyum Sehat.*
