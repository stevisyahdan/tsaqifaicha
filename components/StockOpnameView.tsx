
import React, { useState } from 'react';
import { Medicine, StockOpname, OpnameEntry, MedicineBatch } from '../types';

interface StockOpnameViewProps {
  medicines: Medicine[];
  opnames: StockOpname[];
  isOpnameMode: boolean;
  onStartOpname: () => void;
  onCancelOpname: () => void;
  onOpnameSubmit: (opname: StockOpname) => void;
}

const StockOpnameView: React.FC<StockOpnameViewProps> = ({ medicines, opnames, isOpnameMode, onStartOpname, onCancelOpname, onOpnameSubmit }) => {
  const [activeTab, setActiveTab] = useState<'NEW' | 'HISTORY'>('NEW');
  const [search, setSearch] = useState('');
  // State: Record<medId, Record<batchNumber, {physical, note}>>
  const [entries, setEntries] = useState<Record<string, Record<string, { physical: number | string; note: string }>>>({});

  const filteredMedicines = medicines.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase()) || m.id.toLowerCase().includes(search.toLowerCase())
  );

  const handlePhysicalChange = (medId: string, batchNum: string, value: string) => {
    const val = value === '' ? '' : parseInt(value);
    setEntries(prev => ({
      ...prev,
      [medId]: {
        ...(prev[medId] || {}),
        [batchNum]: {
          ...(prev[medId]?.[batchNum] || { note: '' }),
          physical: val
        }
      }
    }));
  };

  const handleNoteChange = (medId: string, batchNum: string, note: string) => {
    setEntries(prev => ({
      ...prev,
      [medId]: {
        ...(prev[medId] || {}),
        [batchNum]: {
          ...(prev[medId]?.[batchNum] || { physical: '' }),
          note
        }
      }
    }));
  };

  const handleSubmit = () => {
    const affectedEntries: OpnameEntry[] = [];
    
    Object.entries(entries).forEach(([medId, batchMap]) => {
      const med = medicines.find(m => m.id === medId);
      if (!med) return;

      Object.entries(batchMap).forEach(([batchNum, data]) => {
        if (data.physical === '') return;
        const systemBatch = med.batches.find(b => b.batchNumber === batchNum);
        const sysStock = systemBatch ? systemBatch.stock : 0;
        const physicalVal = typeof data.physical === 'number' ? data.physical : 0;

        if (physicalVal !== sysStock) {
          affectedEntries.push({
            medicineId: medId,
            name: med.name,
            batchNumber: batchNum,
            systemStock: sysStock,
            physicalStock: physicalVal,
            difference: physicalVal - sysStock,
            note: data.note || '-'
          });
        }
      });
    });

    if (affectedEntries.length === 0) {
      if(confirm('Tidak ada perbedaan stok yang dicatat. Tutup sesi?')) onCancelOpname();
      return;
    }

    if (!confirm(`Simpan penyesuaian untuk ${affectedEntries.length} batch?`)) return;

    // Hitung kerugian berdasarkan HPP
    const totalLoss = affectedEntries.filter(e => e.difference < 0).reduce((acc, curr) => {
      const med = medicines.find(m => m.id === curr.medicineId)!;
      return acc + (Math.abs(curr.difference) * med.costPrice);
    }, 0);

    const newOpname: StockOpname = {
      id: `SO-${Date.now()}`,
      date: new Date().toISOString(),
      entries: affectedEntries,
      totalLossValue: totalLoss
    };

    onOpnameSubmit(newOpname);
    setEntries({});
    setActiveTab('HISTORY');
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-[40px] border border-slate-200 shadow-sm gap-4 no-print">
        <div className="flex bg-slate-100 p-1.5 rounded-[24px] border border-slate-200">
          <button onClick={() => setActiveTab('NEW')} className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'NEW' ? 'bg-white text-teal-600 shadow-lg' : 'text-slate-500'}`}>Audit Batch Aktif</button>
          <button onClick={() => setActiveTab('HISTORY')} className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'HISTORY' ? 'bg-white text-teal-600 shadow-lg' : 'text-slate-500'}`}>Arsip Audit</button>
        </div>

        <div className="flex items-center space-x-3">
           {activeTab === 'NEW' && !isOpnameMode && (
             <button onClick={onStartOpname} className="bg-indigo-600 text-white px-10 py-4 rounded-3xl font-black text-[10px] uppercase tracking-widest border-b-8 border-indigo-800 active:border-b-0">
                BUKA SESI OPNAME BATCH
             </button>
           )}
           {activeTab === 'NEW' && isOpnameMode && (
             <>
               <button onClick={handleSubmit} className="bg-emerald-500 text-white px-10 py-4 rounded-3xl font-black text-[10px] uppercase tracking-widest shadow-xl border-b-8 border-emerald-700 active:border-b-0">
                  FINALISASI AUDIT BATCH
               </button>
               <button onClick={onCancelOpname} className="p-4 text-rose-500 hover:bg-rose-50 rounded-full transition-all">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
             </>
           )}
        </div>
      </div>

      <div className="no-print">
        {activeTab === 'NEW' ? (
          <div className={`space-y-4 ${!isOpnameMode ? 'grayscale pointer-events-none opacity-50' : ''}`}>
             <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
                <input type="text" placeholder="Cari obat untuk audit batch..." className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-6 text-sm font-black text-slate-800 outline-none focus:bg-white focus:border-teal-500 transition-all" value={search} onChange={(e) => setSearch(e.target.value)} />
             </div>

             {filteredMedicines.map(m => (
               <div key={m.id} className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-8 py-5 bg-slate-900 text-white flex justify-between items-center">
                    <div>
                      <h4 className="font-black italic uppercase tracking-tight">{m.name}</h4>
                      <p className="text-[9px] text-teal-400 font-bold uppercase tracking-widest italic">{m.category} | Total Sistem: {m.stock} {m.unitSmall}</p>
                    </div>
                  </div>
                  <div className="p-0">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                          <th className="px-8 py-3 text-[9px] font-black uppercase text-slate-400">Nomor Batch</th>
                          <th className="px-8 py-3 text-[9px] font-black uppercase text-slate-400 text-center">ED</th>
                          <th className="px-8 py-3 text-[9px] font-black uppercase text-slate-400 text-center">Stok Sistem</th>
                          <th className="px-8 py-3 text-[9px] font-black uppercase text-slate-400 text-center">Stok Fisik</th>
                          <th className="px-8 py-3 text-[9px] font-black uppercase text-slate-400">Catatan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {m.batches.map(batch => (
                          <tr key={batch.batchNumber}>
                            <td className="px-8 py-4">
                              <span className="font-black text-xs text-indigo-600 font-mono tracking-widest">{batch.batchNumber}</span>
                            </td>
                            <td className="px-8 py-4 text-center">
                               <span className="text-[10px] font-black text-rose-500 uppercase">{batch.expiredDate}</span>
                            </td>
                            <td className="px-8 py-4 text-center font-bold text-slate-400 text-xs">{batch.stock}</td>
                            <td className="px-8 py-4 text-center">
                              <input 
                                type="number" 
                                placeholder="..." 
                                className="w-24 bg-white border-2 border-slate-200 rounded-xl py-2 px-3 text-center font-black text-slate-900 focus:border-teal-500 outline-none"
                                value={entries[m.id]?.[batch.batchNumber]?.physical ?? ''}
                                onChange={(e) => handlePhysicalChange(m.id, batch.batchNumber, e.target.value)}
                              />
                            </td>
                            <td className="px-8 py-4">
                               <input 
                                type="text" 
                                placeholder="Alasan selisih..." 
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 px-4 text-[10px] font-bold outline-none focus:bg-white focus:border-indigo-300"
                                value={entries[m.id]?.[batch.batchNumber]?.note || ''}
                                onChange={(e) => handleNoteChange(m.id, batch.batchNumber, e.target.value)}
                               />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
               </div>
             ))}
          </div>
        ) : (
          <div className="space-y-6">
            {opnames.map(op => (
              <div key={op.id} className="bg-white rounded-[40px] shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                   <div>
                     <h4 className="font-black italic uppercase tracking-tighter">Audit Batch: {op.id}</h4>
                     <p className="text-[9px] text-teal-400 font-bold uppercase tracking-widest">{new Date(op.date).toLocaleString('id-ID')}</p>
                   </div>
                   <div className="text-right">
                     <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-1">Total Loss (HPP)</p>
                     <p className="text-lg font-black text-white italic">Rp {op.totalLossValue.toLocaleString()}</p>
                   </div>
                </div>
                <table className="w-full text-left">
                   <thead className="bg-slate-50">
                      <tr>
                        <th className="px-8 py-3 text-[9px] font-black uppercase text-slate-400">Obat</th>
                        <th className="px-8 py-3 text-[9px] font-black uppercase text-slate-400">Batch</th>
                        <th className="px-8 py-3 text-[9px] font-black uppercase text-slate-400 text-center">Sistem</th>
                        <th className="px-8 py-3 text-[9px] font-black uppercase text-slate-400 text-center">Fisik</th>
                        <th className="px-8 py-3 text-[9px] font-black uppercase text-slate-400">Ket</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                      {op.entries.map((e, idx) => (
                        <tr key={idx}>
                          <td className="px-8 py-4 font-black text-slate-800 text-xs uppercase">{e.name}</td>
                          <td className="px-8 py-4 font-black text-indigo-500 font-mono text-xs">{e.batchNumber}</td>
                          <td className="px-8 py-4 text-center font-bold text-slate-400 text-xs">{e.systemStock}</td>
                          <td className="px-8 py-4 text-center font-black text-slate-900 text-xs">{e.physicalStock}</td>
                          <td className="px-8 py-4 text-[10px] font-bold text-rose-500 italic uppercase">{e.note}</td>
                        </tr>
                      ))}
                   </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="print-only">
        <div className="text-center border-b-4 border-black pb-4 mb-6">
          <h1 className="text-2xl font-bold uppercase tracking-tighter">APOTEK SENYUM SEHAT</h1>
          <p className="text-xs uppercase font-bold">FORMULIR AUDIT BATCH OBAT (STOCK OPNAME)</p>
        </div>
        <table className="w-full border-collapse border-2 border-black">
          <thead className="bg-slate-100">
            <tr>
              <th className="border border-black p-2 text-[10px] text-left uppercase">Nama Barang</th>
              <th className="border border-black p-2 text-[10px] text-center">Nomor Batch</th>
              <th className="border border-black p-2 text-[10px] text-center">ED</th>
              <th className="border border-black p-2 text-[10px] text-center w-24">Sistem</th>
              <th className="border border-black p-2 text-[10px] text-center w-32">Fisik</th>
            </tr>
          </thead>
          <tbody>
            {medicines.map((m) => m.batches.map((b, bIdx) => (
              <tr key={`${m.id}-${b.batchNumber}`}>
                {bIdx === 0 && <td rowSpan={m.batches.length} className="border border-black p-2 text-[10px] font-bold uppercase">{m.name}</td>}
                <td className="border border-black p-2 text-[10px] text-center font-mono">{b.batchNumber}</td>
                <td className="border border-black p-2 text-[10px] text-center">{b.expiredDate}</td>
                <td className="border border-black p-2 text-[10px] text-center bg-slate-50 font-bold">{b.stock}</td>
                <td className="border border-black p-2 text-center text-[10px]"> [ ________ ] </td>
              </tr>
            )))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StockOpnameView;
