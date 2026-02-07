
import React, { useState, useMemo } from 'react';
import { Sale, StockOpname, PurchaseOrder, Invoice, Medicine } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface ReportsViewProps {
  sales: Sale[];
  stockOpnames: StockOpname[];
  purchaseOrders: PurchaseOrder[];
  invoices: Invoice[];
  medicines: Medicine[]; // Required medicines prop
}

type ReportTab = 'FINANCE' | 'INVENTORY' | 'PURCHASE' | 'INVOICE' | 'MUTATION';

const ReportsView: React.FC<ReportsViewProps> = ({ 
  sales = [], 
  stockOpnames = [], 
  purchaseOrders = [], 
  invoices = [],
  medicines = [] 
}) => {
  const [activeTab, setActiveTab] = useState<ReportTab>('FINANCE');
  const [selectedMedId, setSelectedMedId] = useState<string>('');
  const [searchMed, setSearchMed] = useState('');

  const calculateFinanceMetrics = () => {
    let revenue = 0;
    let costOfGoodsSold = 0;
    sales.forEach(sale => {
      revenue += sale.totalAmount;
      sale.items.forEach(item => {
        costOfGoodsSold += (item.costPrice || 0) * (item.quantity || 0);
      });
    });
    const totalLoss = stockOpnames.reduce((acc, curr) => acc + (curr.totalLossValue || 0), 0);
    const profit = revenue - costOfGoodsSold - totalLoss;
    return { revenue, costOfGoodsSold, totalLoss, profit };
  };

  const { revenue, costOfGoodsSold, totalLoss, profit } = calculateFinanceMetrics();

  // Mutation Logic
  const mutations = useMemo(() => {
    if (!selectedMedId) return [];
    
    const list: any[] = [];
    
    // 1. From Sales (Out)
    sales.forEach(sale => {
      const item = sale.items.find(si => si.medicineId === selectedMedId);
      if (item) {
        list.push({
          date: sale.date,
          type: 'PENJUALAN',
          ref: sale.id,
          batch: '-',
          in: 0,
          out: item.quantity,
          unit: item.unitUsed
        });
      }
    });

    // 2. From Invoices (In)
    invoices.forEach(inv => {
      const invItems = (inv.items || []).filter(ii => ii.medicineId === selectedMedId);
      invItems.forEach(item => {
        list.push({
          date: inv.date,
          type: 'PEMBELIAN',
          ref: inv.number,
          batch: item.batchNumber,
          in: item.quantity,
          out: 0,
          unit: 'Besar'
        });
      });
    });

    // 3. From Stock Opnames (Adjustment)
    stockOpnames.forEach(op => {
      const entries = (op.entries || []).filter(e => e.medicineId === selectedMedId);
      entries.forEach(entry => {
        list.push({
          date: op.date,
          type: 'OPNAME',
          ref: op.id,
          batch: entry.batchNumber,
          in: entry.difference > 0 ? entry.difference : 0,
          out: entry.difference < 0 ? Math.abs(entry.difference) : 0,
          unit: 'Kecil'
        });
      });
    });

    // Sort by date descending
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedMedId, sales, invoices, stockOpnames]);

  const medicineAnalysis = useMemo(() => {
    const analysis = sales.reduce((acc: any, sale) => {
      sale.items.forEach(item => {
        if (!acc[item.medicineId]) {
          acc[item.medicineId] = { 
            id: item.medicineId,
            name: item.name, 
            totalQuantity: 0, 
            totalRevenue: 0, 
            totalProfit: 0 
          };
        }
        const itemProfit = ((item.price || 0) - (item.costPrice || 0)) * (item.quantity || 0);
        acc[item.medicineId].totalQuantity += (item.quantity || 0);
        acc[item.medicineId].totalRevenue += (item.total || 0);
        acc[item.medicineId].totalProfit += itemProfit;
      });
      return acc;
    }, {});
    return Object.values(analysis).sort((a: any, b: any) => b.totalQuantity - a.totalQuantity);
  }, [sales]);

  const chartData = useMemo(() => {
    return sales.slice(0, 15).reverse().map(sale => {
      const saleCost = sale.items.reduce((acc, item) => acc + ((item.costPrice || 0) * (item.quantity || 0)), 0);
      return {
        name: sale.id.substring(sale.id.length - 4),
        revenue: sale.totalAmount,
        profit: sale.totalAmount - saleCost,
      };
    });
  }, [sales]);

  const handlePrint = () => window.print();

  const getReportTitle = () => {
    switch(activeTab) {
      case 'FINANCE': return 'LAPORAN LABA RUGI OPERASIONAL';
      case 'PURCHASE': return 'LAPORAN REKAPITULASI SURAT PESANAN (SP)';
      case 'INVOICE': return 'LAPORAN REKAPITULASI FAKTUR PEMBELIAN';
      case 'INVENTORY': return 'LAPORAN ANALISIS PROFITABILITAS BARANG';
      case 'MUTATION': return 'KARTU STOK & RIWAYAT MUTASI OBAT';
      default: return 'LAPORAN APOTEK';
    }
  };

  const filteredMeds = (medicines || []).filter(m => 
    m.name.toLowerCase().includes(searchMed.toLowerCase())
  ).slice(0, 5);

  const selectedMedicine = medicines.find(m => m.id === selectedMedId);

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* HEADER ACTIONS */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 no-print">
        <div className="flex bg-white p-1.5 rounded-[24px] border border-slate-200 shadow-sm w-full xl:w-fit overflow-x-auto no-scrollbar">
          <button onClick={() => setActiveTab('FINANCE')} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'FINANCE' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Laba Rugi</button>
          <button onClick={() => setActiveTab('PURCHASE')} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'PURCHASE' ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Rekap SP</button>
          <button onClick={() => setActiveTab('INVOICE')} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'INVOICE' ? 'bg-rose-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Rekap Faktur</button>
          <button onClick={() => setActiveTab('INVENTORY')} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'INVENTORY' ? 'bg-teal-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Analisis Barang</button>
          <button onClick={() => setActiveTab('MUTATION')} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'MUTATION' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Riwayat Mutasi</button>
        </div>
        
        <div className="flex space-x-3 w-full xl:w-auto">
          <button onClick={handlePrint} className="flex-1 xl:flex-none bg-slate-900 text-white px-8 py-4 rounded-3xl font-black flex items-center justify-center shadow-xl hover:bg-indigo-600 transition-all text-xs uppercase tracking-widest border-b-8 border-slate-700 active:border-b-0">
            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            CETAK LAPORAN
          </button>
        </div>
      </div>

      <div className="space-y-8 no-print">
        {activeTab === 'MUTATION' && (
          <div className="space-y-6 animate-fadeIn">
            {/* SEARCH MEDICINE BOX */}
            <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-4">
               <div className="flex items-center space-x-3 mb-2">
                  <div className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center font-black">?</div>
                  <h4 className="text-xs font-black text-slate-800 uppercase italic tracking-widest">Pilih Obat Untuk Melihat Riwayat Mutasi</h4>
               </div>
               <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Ketik Nama Obat..." 
                    className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-indigo-500 outline-none font-bold text-sm"
                    value={searchMed}
                    onChange={(e) => setSearchMed(e.target.value)}
                  />
                  {searchMed && filteredMeds.length > 0 && !selectedMedId && (
                    <div className="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
                      {filteredMeds.map(m => (
                        <button 
                          key={m.id} 
                          onClick={() => { setSelectedMedId(m.id); setSearchMed(m.name); }}
                          className="w-full text-left px-6 py-4 hover:bg-slate-50 flex justify-between items-center transition-colors border-b border-slate-50 last:border-0"
                        >
                          <span className="font-black text-xs uppercase text-slate-800">{m.name}</span>
                          <span className="text-[9px] font-black text-slate-400 bg-slate-100 px-2 py-1 rounded">ID: {m.id}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {selectedMedId && (
                    <button 
                      onClick={() => { setSelectedMedId(''); setSearchMed(''); }}
                      className="absolute right-4 top-4 text-rose-500 font-black text-[10px] uppercase hover:underline"
                    >
                      Reset Filter
                    </button>
                  )}
               </div>
            </div>

            {selectedMedId ? (
              <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                   <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black italic">M</div>
                      <div>
                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-tighter italic">{searchMed}</h4>
                        <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Kartu Stok Digital Apotek</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-[9px] font-black text-slate-400 uppercase italic">Stok Saat Ini</p>
                      <p className="text-xl font-black text-slate-900">{selectedMedicine?.stock || 0} {selectedMedicine?.unitSmall || ''}</p>
                   </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-4 text-[9px] font-black uppercase text-slate-400">Tanggal</th>
                        <th className="px-6 py-4 text-[9px] font-black uppercase text-slate-400">Transaksi</th>
                        <th className="px-6 py-4 text-[9px] font-black uppercase text-slate-400">Ref / Batch</th>
                        <th className="px-6 py-4 text-[9px] font-black uppercase text-slate-400 text-center text-emerald-600">Masuk (+)</th>
                        <th className="px-6 py-4 text-[9px] font-black uppercase text-slate-400 text-center text-rose-500">Keluar (-)</th>
                        <th className="px-6 py-4 text-[9px] font-black uppercase text-slate-400">Satuan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {mutations.length > 0 ? mutations.map((m, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 text-xs font-bold text-slate-500">{new Date(m.date).toLocaleDateString('id-ID')}</td>
                          <td className="px-6 py-4">
                             <span className={`text-[8px] font-black px-2 py-1 rounded-lg uppercase ${
                               m.type === 'PENJUALAN' ? 'bg-rose-50 text-rose-600' : 
                               m.type === 'PEMBELIAN' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                             }`}>{m.type}</span>
                          </td>
                          <td className="px-6 py-4">
                             <div className="font-black text-[10px] text-slate-800 uppercase truncate max-w-[120px]">{m.ref}</div>
                             <div className="text-[8px] font-mono text-slate-400 font-black">B: {m.batch}</div>
                          </td>
                          <td className="px-6 py-4 text-center font-black text-emerald-600 text-sm">
                             {m.in > 0 ? `+${m.in}` : '-'}
                          </td>
                          <td className="px-6 py-4 text-center font-black text-rose-500 text-sm">
                             {m.out > 0 ? `-${m.out}` : '-'}
                          </td>
                          <td className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase italic">{m.unit}</td>
                        </tr>
                      )) : (
                        <tr><td colSpan={6} className="py-20 text-center text-[10px] font-black text-slate-300 uppercase italic tracking-widest">Tidak ada riwayat mutasi tercatat</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="py-32 text-center opacity-30 grayscale">
                 <svg className="w-20 h-20 mx-auto mb-4 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                 <p className="text-xs font-black uppercase tracking-widest">Silakan cari dan pilih obat di atas</p>
              </div>
            )}
          </div>
        )}

        {/* FINANCE TAB CONTENT */}
        {activeTab === 'FINANCE' && (
          <div className="space-y-8">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 group hover:border-indigo-500 transition-all">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Omzet</p>
                <p className="text-2xl font-black text-indigo-600">Rp {revenue.toLocaleString()}</p>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 group hover:border-slate-400 transition-all">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">HPP Terjual</p>
                <p className="text-2xl font-black text-slate-500">Rp {costOfGoodsSold.toLocaleString()}</p>
              </div>
              <div className="bg-rose-50 p-6 rounded-3xl shadow-sm border border-rose-100 group hover:border-rose-400 transition-all">
                 <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">Kerugian Opname</p>
                 <p className="text-2xl font-black text-rose-600">Rp {totalLoss.toLocaleString()}</p>
              </div>
              <div className="bg-emerald-50 p-6 rounded-3xl shadow-sm border border-emerald-100 group hover:border-emerald-400 transition-all">
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Laba Bersih</p>
                <p className="text-2xl font-black text-emerald-600">Rp {profit.toLocaleString()}</p>
              </div>
            </div>
            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 h-96">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 italic">Visualisasi Performa Transaksi (15 Terakhir)</h4>
              <ResponsiveContainer width="100%" height="85%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis hide />
                  <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Legend verticalAlign="top" align="right" />
                  <Bar dataKey="revenue" name="Omzet" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={24} />
                  <Bar dataKey="profit" name="Laba" fill="#10b981" radius={[6, 6, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        
        {activeTab === 'PURCHASE' && (
           <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden animate-fadeIn">
            <div className="p-6 border-b border-slate-50 bg-slate-50/50">
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Rekapitulasi Surat Pesanan (SP)</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-[9px] font-black uppercase text-slate-400">ID SP</th>
                    <th className="px-6 py-4 text-[9px] font-black uppercase text-slate-400">Supplier PBF</th>
                    <th className="px-6 py-4 text-[9px] font-black uppercase text-slate-400 text-center">Tanggal</th>
                    <th className="px-6 py-4 text-[9px] font-black uppercase text-slate-400 text-center">Masa Berlaku</th>
                    <th className="px-6 py-4 text-[9px] font-black uppercase text-slate-400 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {purchaseOrders.length > 0 ? purchaseOrders.map(po => (
                    <tr key={po.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-black text-indigo-600 text-xs">#{po.id.split('-')[1]?.substring(0,6) || po.id}</td>
                      <td className="px-6 py-4 font-black text-slate-800 text-xs uppercase">{po.pbfName}</td>
                      <td className="px-6 py-4 text-center font-bold text-slate-500 text-xs">{po.date}</td>
                      <td className="px-6 py-4 text-center font-bold text-rose-400 text-xs">{po.expiryDate}</td>
                      <td className="px-6 py-4 text-center">
                         <span className={`text-[8px] font-black px-3 py-1 rounded-lg uppercase ${
                           po.status === 'RECEIVED' ? 'bg-emerald-50 text-emerald-600' : 
                           po.status === 'PENDING' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'
                         }`}>{po.status}</span>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={5} className="py-20 text-center text-[10px] font-black text-slate-300 uppercase italic tracking-widest">Belum ada data Surat Pesanan</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'INVOICE' && (
           <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden animate-fadeIn">
            <div className="p-6 border-b border-slate-50 bg-slate-50/50">
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Rekapitulasi Faktur Pembelian</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-[9px] font-black uppercase text-slate-400">No. Faktur</th>
                    <th className="px-6 py-4 text-[9px] font-black uppercase text-slate-400">PBF / Supplier</th>
                    <th className="px-6 py-4 text-[9px] font-black uppercase text-slate-400 text-right">Nilai Tagihan</th>
                    <th className="px-6 py-4 text-[9px] font-black uppercase text-slate-400 text-center">Jatuh Tempo</th>
                    <th className="px-6 py-4 text-[9px] font-black uppercase text-slate-400 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.length > 0 ? invoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-black text-indigo-600 text-xs">{inv.number}</td>
                      <td className="px-6 py-4 font-black text-slate-800 text-xs uppercase">{inv.pbfName}</td>
                      <td className="px-6 py-4 text-right font-black text-slate-900 text-xs">Rp {inv.totalAmount.toLocaleString()}</td>
                      <td className="px-6 py-4 text-center font-bold text-rose-500 text-xs">{inv.dueDate}</td>
                      <td className="px-6 py-4 text-center">
                         <span className={`text-[8px] font-black px-2 py-1 rounded-lg uppercase ${inv.status === 'PAID' ? 'bg-teal-50 text-teal-600' : 'bg-rose-50 text-rose-500'}`}>{inv.status}</span>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={5} className="py-20 text-center text-[10px] font-black text-slate-300 uppercase italic tracking-widest">Belum ada data Faktur Pembelian</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'INVENTORY' && (
           <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden animate-fadeIn">
            <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Analisis Profitabilitas Per Barang (Berdasarkan Penjualan)</h4>
               <span className="text-[8px] font-black text-teal-600 bg-teal-50 px-3 py-1 rounded-lg">Diurutkan berdasarkan Terlaris</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-[9px] font-black uppercase text-slate-400">Nama Produk</th>
                    <th className="px-6 py-4 text-[9px] font-black uppercase text-slate-400 text-center">Qty Terjual</th>
                    <th className="px-6 py-4 text-[9px] font-black uppercase text-slate-400 text-right">Total Omzet</th>
                    <th className="px-6 py-4 text-[9px] font-black uppercase text-slate-400 text-right text-emerald-600">Total Laba</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {medicineAnalysis.length > 0 ? medicineAnalysis.map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-black text-slate-800 text-xs uppercase">{item.name}</div>
                        <div className="text-[8px] text-slate-400 font-bold">ID: {item.id}</div>
                      </td>
                      <td className="px-6 py-4 text-center font-black text-slate-900 text-xs">{item.totalQuantity.toLocaleString()} Unit</td>
                      <td className="px-6 py-4 text-right font-black text-slate-600 text-xs">Rp {item.totalRevenue.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right font-black text-emerald-600 text-xs italic">Rp {item.totalProfit.toLocaleString()}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={4} className="py-20 text-center text-[10px] font-black text-slate-300 uppercase italic tracking-widest">Belum ada data penjualan tercatat</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* PRINT-ONLY CONTENT */}
      <div className="print-only">
        <div className="text-center border-b-4 border-slate-900 pb-6 mb-8 flex flex-col items-center">
          <div className="flex items-center space-x-4 mb-2">
             <div className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-2xl">S</div>
             <h1 className="text-3xl font-black uppercase italic tracking-tighter">APOTEK SENYUM SEHAT</h1>
          </div>
          <p className="text-xs font-bold uppercase tracking-widest">Jl. RM Said no 87, Punggawan Banjarsari, Surakarta</p>
          <p className="text-[10px] mt-1 italic">Izin Apotek: 445/001/SIA/I/2024 | Telp: (0271) XXX-XXX</p>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-xl font-black underline uppercase">{getReportTitle()}</h2>
          {activeTab === 'MUTATION' && <p className="font-black uppercase text-sm mt-2">{searchMed}</p>}
          <p className="text-[10px] font-bold mt-1 uppercase">Periode: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>

        {/* PRINT TABLE */}
        <table className="w-full text-left border-collapse border border-slate-900">
          <thead className="bg-slate-100 border-b-2 border-slate-900">
            {activeTab === 'MUTATION' ? (
              <tr>
                <th className="border border-slate-300 p-2 text-[9px] font-bold uppercase">Tanggal</th>
                <th className="border border-slate-300 p-2 text-[9px] font-bold uppercase">Tipe</th>
                <th className="border border-slate-300 p-2 text-[9px] font-bold uppercase">Ref / Batch</th>
                <th className="border border-slate-300 p-2 text-[9px] font-bold uppercase text-center">Masuk</th>
                <th className="border border-slate-300 p-2 text-[9px] font-bold uppercase text-center">Keluar</th>
              </tr>
            ) : activeTab === 'FINANCE' ? (
              <tr>
                <th className="border border-slate-300 p-2 text-[9px] font-bold uppercase">Nota ID</th>
                <th className="border border-slate-300 p-2 text-[9px] font-bold uppercase">Customer</th>
                <th className="border border-slate-300 p-2 text-[9px] font-bold uppercase text-right">Total</th>
              </tr>
            ) : activeTab === 'INVOICE' ? (
              <tr>
                <th className="border border-slate-300 p-2 text-[9px] font-bold uppercase">No. Faktur</th>
                <th className="border border-slate-300 p-2 text-[9px] font-bold uppercase">Supplier PBF</th>
                <th className="border border-slate-300 p-2 text-[9px] font-bold uppercase text-right">Tagihan</th>
              </tr>
            ) : activeTab === 'PURCHASE' ? (
              <tr>
                <th className="border border-slate-300 p-2 text-[9px] font-bold uppercase">ID SP</th>
                <th className="border border-slate-300 p-2 text-[9px] font-bold uppercase">Supplier PBF</th>
                <th className="border border-slate-300 p-2 text-[9px] font-bold uppercase text-center">Tanggal</th>
              </tr>
            ) : (
              <tr>
                <th className="border border-slate-300 p-2 text-[9px] font-bold uppercase">Nama Barang</th>
                <th className="border border-slate-300 p-2 text-[9px] font-bold uppercase text-center">Terjual</th>
                <th className="border border-slate-300 p-2 text-[9px] font-bold uppercase text-right">Laba</th>
              </tr>
            )}
          </thead>
          <tbody>
            {activeTab === 'MUTATION' ? mutations.map((m, idx) => (
              <tr key={idx}>
                <td className="border border-slate-300 p-2 text-[10px]">{new Date(m.date).toLocaleDateString('id-ID')}</td>
                <td className="border border-slate-300 p-2 text-[10px] uppercase font-bold">{m.type}</td>
                <td className="border border-slate-300 p-2 text-[10px] uppercase">{m.ref} <br/><span className="text-[8px]">B: {m.batch}</span></td>
                <td className="border border-slate-300 p-2 text-[10px] text-center">{m.in > 0 ? m.in : '-'}</td>
                <td className="border border-slate-300 p-2 text-[10px] text-center">{m.out > 0 ? m.out : '-'}</td>
              </tr>
            )) : activeTab === 'FINANCE' ? sales.map(s => (
              <tr key={s.id}>
                <td className="border border-slate-300 p-2 text-[10px]">{s.id}</td>
                <td className="border border-slate-300 p-2 text-[10px] uppercase">{s.customerName}</td>
                <td className="border border-slate-300 p-2 text-[10px] text-right">Rp {s.totalAmount.toLocaleString()}</td>
              </tr>
            )) : activeTab === 'INVOICE' ? invoices.map(inv => (
              <tr key={inv.id}>
                <td className="border border-slate-300 p-2 text-[10px] font-bold">{inv.number}</td>
                <td className="border border-slate-300 p-2 text-[10px] uppercase">{inv.pbfName}</td>
                <td className="border border-slate-300 p-2 text-[10px] text-right font-bold">Rp {inv.totalAmount.toLocaleString()}</td>
              </tr>
            )) : activeTab === 'PURCHASE' ? purchaseOrders.map(po => (
              <tr key={po.id}>
                <td className="border border-slate-300 p-2 text-[10px] font-bold">#{po.id.split('-')[1]?.substring(0,6)}</td>
                <td className="border border-slate-300 p-2 text-[10px] uppercase">{po.pbfName}</td>
                <td className="border border-slate-300 p-2 text-[10px] text-center">{po.date}</td>
              </tr>
            )) : medicineAnalysis.map((item: any) => (
              <tr key={item.id}>
                <td className="border border-slate-300 p-2 text-[10px] uppercase">{item.name}</td>
                <td className="border border-slate-300 p-2 text-[10px] text-center">{item.totalQuantity}</td>
                <td className="border border-slate-300 p-2 text-[10px] text-right font-bold">Rp {item.totalProfit.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* TANDA TANGAN */}
        <div className="grid grid-cols-2 gap-20 text-center mt-20">
           <div className="space-y-16">
              <p className="text-[10px] font-bold uppercase italic">Apoteker Penanggung Jawab</p>
              <p className="font-bold text-xs underline">( ........................................ )</p>
           </div>
           <div className="space-y-16">
              <p className="text-[10px] font-bold uppercase italic">Pemilik Sarana Apotek</p>
              <p className="font-bold text-xs underline">( ........................................ )</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsView;
