
import React, { useState, useMemo } from 'react';
import { Medicine, MedicineBatch } from '../types';

interface StockViewProps {
  medicines: Medicine[];
}

type StockFilterType = 'ALL' | 'LOW_STOCK' | 'NEAR_ED' | 'EXPIRED';

const StockView: React.FC<StockViewProps> = ({ medicines }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<StockFilterType>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const today = new Date();
  const sixMonthsFromNow = new Date();
  sixMonthsFromNow.setMonth(today.getMonth() + 6);

  const filteredMedicines = useMemo(() => {
    return medicines.filter(m => {
      const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           m.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;

      const isLowStock = m.stock < 20;
      const hasExpiredBatch = m.batches.some(b => new Date(b.expiredDate) < today);
      const hasNearEDBatch = m.batches.some(b => {
        const d = new Date(b.expiredDate);
        return d >= today && d <= sixMonthsFromNow;
      });

      switch (activeFilter) {
        case 'LOW_STOCK': return isLowStock;
        case 'NEAR_ED': return hasNearEDBatch;
        case 'EXPIRED': return hasExpiredBatch;
        default: return true;
      }
    });
  }, [medicines, searchTerm, activeFilter]);

  const stats = useMemo(() => {
    const low = medicines.filter(m => m.stock < 20).length;
    const near = medicines.filter(m => m.batches.some(b => {
      const d = new Date(b.expiredDate);
      return d >= today && d <= sixMonthsFromNow;
    })).length;
    const expired = medicines.filter(m => m.batches.some(b => new Date(b.expiredDate) < today)).length;
    return { low, near, expired };
  }, [medicines]);

  return (
    <div className="space-y-6 animate-fadeIn pb-20">
      <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-200">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="relative w-full lg:w-96">
            <input type="text" placeholder="Cari obat..." className="w-full px-6 py-4 pl-14 rounded-2xl border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-teal-500 outline-none transition-all font-bold text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <svg className="w-6 h-6 absolute left-5 top-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>

          <div className="flex bg-slate-100 p-1.5 rounded-[24px] border border-slate-200 overflow-x-auto no-scrollbar w-full lg:w-auto">
            <button onClick={() => setActiveFilter('ALL')} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeFilter === 'ALL' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500'}`}>Semua ({medicines.length})</button>
            <button onClick={() => setActiveFilter('LOW_STOCK')} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeFilter === 'LOW_STOCK' ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-500'}`}>Stok Tipis ({stats.low})</button>
            <button onClick={() => setActiveFilter('NEAR_ED')} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeFilter === 'NEAR_ED' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}>Dekat ED ({stats.near})</button>
            <button onClick={() => setActiveFilter('EXPIRED')} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeFilter === 'EXPIRED' ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-500'}`}>Sudah ED ({stats.expired})</button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[40px] shadow-xl border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-900 text-white">
            <tr>
              <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest">Detail Obat</th>
              <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-center">Batch Aktif</th>
              <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-center">Stok Total</th>
              <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest">ED Terdekat</th>
              <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-right">Harga Jual</th>
              <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredMedicines.map(m => {
              const isExpanded = expandedId === m.id;
              const hasExpired = m.batches.some(b => new Date(b.expiredDate) < today);
              const hasNearED = m.batches.some(b => {
                const d = new Date(b.expiredDate);
                return d >= today && d <= sixMonthsFromNow;
              });

              return (
                <React.Fragment key={m.id}>
                  <tr className={`hover:bg-slate-50/80 transition-all ${hasExpired ? 'bg-rose-50/30' : hasNearED ? 'bg-amber-50/20' : ''}`}>
                    <td className="px-8 py-5">
                      <div className="font-black text-slate-800 text-sm uppercase leading-tight">{m.name}</div>
                      <div className="text-[8px] font-black text-slate-400 mt-1 uppercase tracking-widest">{m.category} | #{m.id}</div>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span className="bg-indigo-50 text-indigo-600 text-[10px] font-black px-3 py-1 rounded-full border border-indigo-100 uppercase tracking-widest">{m.batches.length} Batch</span>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <div className={`text-lg font-black tracking-tighter ${m.stock < 20 ? 'text-rose-500' : 'text-slate-800'}`}>{m.stock}</div>
                      <div className="text-[8px] font-black text-slate-400 uppercase leading-none italic">{m.unitSmall}</div>
                    </td>
                    <td className="px-8 py-5">
                      <div className={`text-xs font-black ${hasExpired ? 'text-rose-600' : hasNearED ? 'text-amber-600' : 'text-slate-700'}`}>{m.expiredDate}</div>
                      <div className="text-[8px] font-bold text-slate-400 uppercase italic leading-none mt-1">{hasExpired ? 'Expired' : hasNearED ? 'Warning' : 'Aman'}</div>
                    </td>
                    <td className="px-8 py-5 text-right font-black text-slate-900 text-sm italic">Rp {m.price.toLocaleString()}</td>
                    <td className="px-8 py-5 text-center">
                      <button onClick={() => setExpandedId(isExpanded ? null : m.id)} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isExpanded ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400 hover:text-teal-600'}`}>
                        <svg className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
                      </button>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td colSpan={6} className="bg-slate-50 p-6 animate-fadeIn">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {m.batches.map(batch => {
                            const bED = new Date(batch.expiredDate);
                            const bIsExpired = bED < today;
                            const bIsNear = bED >= today && bED <= sixMonthsFromNow;
                            return (
                              <div key={batch.batchNumber} className={`bg-white p-5 rounded-3xl border-2 flex flex-col shadow-sm ${bIsExpired ? 'border-rose-200' : bIsNear ? 'border-amber-200' : 'border-slate-100'}`}>
                                <div className="flex justify-between items-start mb-3">
                                  <span className="text-[10px] font-black text-indigo-600 font-mono tracking-widest uppercase">BATCH: {batch.batchNumber}</span>
                                  {bIsExpired && <span className="bg-rose-600 text-white text-[7px] font-black px-2 py-0.5 rounded uppercase">EXPIRED</span>}
                                  {bIsNear && <span className="bg-amber-500 text-white text-[7px] font-black px-2 py-0.5 rounded uppercase">FEFO</span>}
                                </div>
                                <div className="flex justify-between items-end">
                                  <div>
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Stok Batch:</p>
                                    <p className="text-xl font-black text-slate-800 tracking-tighter">{batch.stock} <span className="text-[10px] font-bold text-slate-400 uppercase">{m.unitSmall}</span></p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Expired Date:</p>
                                    <p className={`text-xs font-black ${bIsExpired ? 'text-rose-600' : bIsNear ? 'text-amber-600' : 'text-slate-700'}`}>{batch.expiredDate}</p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StockView;
