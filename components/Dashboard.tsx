
import React from 'react';
import { Medicine, Sale, Invoice } from '../types';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  medicines: Medicine[];
  sales: Sale[];
  invoices: Invoice[];
}

const Dashboard: React.FC<DashboardProps> = ({ medicines, sales, invoices }) => {
  const lowStock = medicines.filter(m => m.stock < 20);
  const totalDebt = invoices.filter(i => i.status === 'UNPAID').reduce((acc, curr) => acc + curr.totalAmount, 0);
  const totalSalesToday = sales.reduce((acc, curr) => acc + curr.totalAmount, 0);
  
  const stockByCategory = medicines.reduce((acc: any[], curr) => {
    const existing = acc.find(a => a.name === curr.category);
    if (existing) existing.value += 1;
    else acc.push({ name: curr.category, value: 1 });
    return acc;
  }, []);

  const COLORS = ['#0d9488', '#4f46e5', '#f59e0b', '#db2777', '#7c3aed'];

  return (
    <div className="space-y-8 pb-12">
      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Omzet Penjualan" value={`Rp ${totalSalesToday.toLocaleString()}`} color="teal" sub="Hari ini" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3 1.343 3 3-1.343 3-3 3m0-12V4m0 12v4m-4-10a4 4 0 118 0a4 4 0 01-8 0z" /></svg>} />
        <StatCard title="Stok Kritis" value={lowStock.length.toString()} color="amber" sub="Item Perlu Order" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>} />
        <StatCard title="Total Hutang" value={`Rp ${totalDebt.toLocaleString()}`} color="rose" sub="Belum Terbayar" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01m-.01 4h.01" /></svg>} />
        <StatCard title="Total Katalog" value={medicines.length.toString()} color="indigo" sub="Jenis Obat Aktif" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Card */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-lg font-extrabold text-slate-800 tracking-tight italic">Komposisi Inventori</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Berdasarkan Kategori Obat</p>
            </div>
            <div className="bg-teal-50 text-teal-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase border border-teal-100">Live Reports</div>
          </div>
          
          <div className="flex-1 min-h-[350px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stockByCategory} innerRadius={100} outerRadius={135} paddingAngle={8} dataKey="value" cornerRadius={10} stroke="none">
                  {stockByCategory.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.05)', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-4xl font-black text-slate-800 tracking-tighter">{medicines.length}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SKU Produk</span>
            </div>
          </div>
          
          <div className="mt-8 flex flex-wrap gap-x-8 gap-y-4 justify-center">
            {stockByCategory.map((entry, index) => (
              <div key={entry.name} className="flex items-center space-x-2.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                <span className="text-[11px] text-slate-500 font-bold uppercase">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts Card */}
        <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-lg font-extrabold text-slate-800 tracking-tight italic mb-8">Peringatan Stok</h3>
          <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
            {lowStock.length > 0 ? lowStock.map(m => (
              <div key={m.id} className="p-5 bg-slate-50 rounded-2xl border border-transparent hover:border-rose-100 transition-all flex items-center justify-between group">
                <div className="min-w-0">
                  <p className="font-bold text-slate-800 text-sm truncate uppercase group-hover:text-rose-600 transition-colors">{m.name}</p>
                  <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">ID: {m.id}</p>
                </div>
                <div className="text-right ml-4">
                  <p className="text-sm font-black text-rose-500">{m.stock}</p>
                  <p className="text-[9px] font-bold text-slate-300 uppercase italic leading-none">{m.unitSmall}</p>
                </div>
              </div>
            )) : (
              <div className="h-full flex flex-col items-center justify-center opacity-30 italic py-20">
                <svg className="w-16 h-16 mb-4 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Semua stok aman</p>
              </div>
            )}
          </div>
          {lowStock.length > 0 && (
            <button className="w-full mt-6 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-600 transition-all shadow-xl shadow-slate-900/10">Buat Surat Pesanan</button>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title: string; value: string; color: string; sub: string; icon: React.ReactNode }> = ({ title, value, color, sub, icon }) => {
  const styles: Record<string, string> = {
    teal: 'text-teal-600 bg-teal-50 border-teal-100',
    amber: 'text-amber-600 bg-amber-50 border-amber-100',
    rose: 'text-rose-600 bg-rose-50 border-rose-100',
    indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100',
  };

  return (
    <div className="bg-white p-7 rounded-[32px] border border-slate-200 shadow-sm group hover:border-teal-500 hover:shadow-xl transition-all duration-300">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-sm border ${styles[color]}`}>
        {icon}
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{title}</p>
      <p className={`text-2xl font-extrabold tracking-tight ${styles[color].split(' ')[0]}`}>{value}</p>
      <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter opacity-70 italic">{sub}</p>
    </div>
  );
};

export default Dashboard;
