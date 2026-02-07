
import React, { useState, useMemo, useEffect } from 'react';
import { Medicine, Invoice, Supplier, PurchaseOrder, InvoiceItem } from '../types';

interface InvoicesViewProps {
  medicines: Medicine[];
  suppliers: Supplier[];
  orders: PurchaseOrder[];
  onInvoiceAdd: (invoice: Invoice) => void;
  isLocked?: boolean;
}

const UNIT_OPTIONS = ['BOX', 'PACK', 'FLACON', 'AMPUL', 'TUBE', 'GALON', 'BOTOL', 'STRIP', 'BLISTER', 'TABLET', 'KAPSUL', 'KAPLET', 'SACHET', 'SUPPOS', 'PCS', 'MINIDOSE', 'ROLL', 'SET', 'PASANG', 'LEMBAR'];

const InvoicesView: React.FC<InvoicesViewProps> = ({ medicines, suppliers, orders, onInvoiceAdd, isLocked = false }) => {
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [isPpnActive, setIsPpnActive] = useState(true);
  const [invData, setInvData] = useState({ number: '', date: new Date().toISOString().split('T')[0], dueDate: '' });
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [tier1, setTier1] = useState<{qty: string, unit: string}>({ qty: '', unit: '' });
  const [tier2, setTier2] = useState<{qty: string, unit: string}>({ qty: '1', unit: '' });
  const [tier3, setTier3] = useState<{qty: string, unit: string}>({ qty: '1', unit: '' });
  const [currentMedId, setCurrentMedId] = useState('');
  const [batchInput, setBatchInput] = useState('');
  const [edInput, setEdInput] = useState('');
  const [priceInput, setPriceInput] = useState<number | string>('');
  const [discInput, setDiscInput] = useState<number | string>('');

  const selectedOrder = useMemo(() => orders.find(o => o.id === selectedOrderId), [selectedOrderId, orders]);
  const currentMed = useMemo(() => medicines.find(m => m.id === currentMedId), [currentMedId, medicines]);

  useEffect(() => {
    if (currentMed) {
      setTier1({ qty: '', unit: currentMed.unitLarge });
      setTier2({ qty: currentMed.convMedium.toString(), unit: currentMed.unitMedium });
      setTier3({ qty: currentMed.convSmall.toString(), unit: currentMed.unitSmall });
      setEdInput(currentMed.expiredDate || '');
    } else {
      setTier1({ qty: '', unit: '' }); setTier2({ qty: '1', unit: '' }); setTier3({ qty: '1', unit: '' }); setEdInput('');
    }
    setBatchInput('');
  }, [currentMed]);

  const totalIncomingSmall = useMemo(() => {
    const q1 = parseFloat(tier1.qty) || 0;
    const q2 = parseFloat(tier2.qty) || 1;
    const q3 = parseFloat(tier3.qty) || 1;
    return q1 * q2 * q3;
  }, [tier1.qty, tier2.qty, tier3.qty]);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMedId || isLocked) return;
    if (!tier1.qty || parseFloat(tier1.qty) <= 0) { alert("Jumlah Tier 1 wajib diisi!"); return; }
    if (!batchInput) { alert("Batch wajib diisi!"); return; }
    if (!edInput) { alert("ED wajib diisi!"); return; }
    if (!priceInput || parseFloat(priceInput.toString()) <= 0) { alert("Harga Bruto wajib diisi!"); return; }
    const costPrice = parseFloat(priceInput.toString());
    const discount = parseFloat(discInput.toString()) || 0;
    const ppn = isPpnActive ? 11 : 0;
    const baseTotal = parseFloat(tier1.qty) * costPrice;
    const discounted = baseTotal * (1 - (discount / 100));
    const taxed = discounted * (1 + (ppn / 100));
    const newItem: InvoiceItem = {
      medicineId: currentMedId, quantity: parseFloat(tier1.qty), unitType: 'large', costPrice, discountPercent: discount, ppnPercent: ppn, subtotal: Math.round(taxed), batchNumber: batchInput.toUpperCase(), expiredDate: edInput, convMediumUsed: parseFloat(tier2.qty) || 1, convSmallUsed: parseFloat(tier3.qty) || 1
    };
    setItems(prev => [...prev, newItem]);
    setCurrentMedId(''); setTier1({ qty: '', unit: '' }); setBatchInput(''); setEdInput(''); setPriceInput(''); setDiscInput('');
  };

  const totals = useMemo(() => {
    const subtotal = items.reduce((acc, curr) => { const base = curr.quantity * curr.costPrice; return acc + (base * (1 - (curr.discountPercent / 100))); }, 0);
    const tax = items.reduce((acc, curr) => { const base = curr.quantity * curr.costPrice; const discounted = base * (1 - (curr.discountPercent / 100)); return acc + (discounted * (curr.ppnPercent / 100)); }, 0);
    return { subtotal, tax, grand: subtotal + tax };
  }, [items]);

  const handleSubmit = () => {
    if (!invData.number || items.length === 0 || isLocked) { alert('Lengkapi data faktur dan minimal satu item!'); return; }
    const newInvoice: Invoice = { id: `INV-${Date.now()}`, orderId: selectedOrderId, number: invData.number, date: invData.date, pbfName: selectedOrder?.pbfName || '', items: items, totalAmount: Math.round(totals.grand), dueDate: invData.dueDate, status: 'UNPAID' };
    onInvoiceAdd(newInvoice);
    setSelectedOrderId(''); setInvData({ number: '', date: new Date().toISOString().split('T')[0], dueDate: '' }); setItems([]); alert('Faktur berhasil disimpan.');
  };

  return (
    <div className="max-w-[1550px] mx-auto space-y-4 pb-20 animate-fadeIn relative">
      {isLocked && (
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md z-[60] flex items-center justify-center p-6 rounded-[50px]">
           <div className="bg-white p-12 rounded-[50px] shadow-2xl border-4 border-slate-900 text-center max-w-lg animate-fadeIn scale-110">
              <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-8 animate-bounce">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v2h8z" /></svg>
              </div>
              <h4 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900">Sistem Dikunci</h4>
              <p className="text-sm text-slate-400 font-black mt-4 uppercase leading-relaxed tracking-widest italic border-t border-slate-100 pt-6">Sedang Berlangsung Stock Opname.<br/>Input barang masuk ditutup sementara.</p>
           </div>
        </div>
      )}

      {/* SELEKTOR SP */}
      <div className={`bg-white px-6 py-4 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between gap-4 ${isLocked ? 'opacity-30' : ''}`}>
         <div className="flex items-center space-x-3"><div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></div><span className="text-xs font-black text-slate-800 uppercase tracking-tight italic">Link Surat Pesanan (SP):</span></div>
         <select disabled={isLocked} className="flex-1 max-w-sm px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 font-black text-xs text-slate-700 outline-none focus:border-indigo-500 shadow-inner" value={selectedOrderId} onChange={(e) => { setSelectedOrderId(e.target.value); setItems([]); }}><option value="">-- PILIH SURAT PESANAN --</option>{orders.map(o => <option key={o.id} value={o.id}>{o.id} | {o.pbfName.toUpperCase()}</option>)}</select>
      </div>
      <div className={`bg-white rounded-[40px] shadow-2xl border border-slate-200 overflow-hidden transition-all duration-500 ${(!selectedOrderId || isLocked) ? 'opacity-30 grayscale pointer-events-none' : ''}`}>
        <div className="p-8 border-b border-slate-100 bg-slate-50/20">
          <div className="flex justify-between items-start mb-8"><div><h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Input Faktur Pembelian</h2><p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] italic">Apotek Senyum Sehat - Entry System</p></div><div className="text-right"><p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1 italic">Supplier PBF</p><h3 className="font-black text-indigo-600 text-base uppercase">{selectedOrder?.pbfName || '-'}</h3></div></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase italic">No. Faktur</label><input placeholder="Ketik No. Faktur..." className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-black text-xs text-slate-800 outline-none focus:border-indigo-500 shadow-sm" value={invData.number} onChange={(e) => setInvData({...invData, number: e.target.value})} /></div>
            <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase italic">Tgl Faktur</label><input type="date" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-black text-xs text-slate-800 outline-none focus:border-indigo-500 shadow-sm" value={invData.date} onChange={(e) => setInvData({...invData, date: e.target.value})} /></div>
            <div className="space-y-1"><label className="text-[9px] font-black text-rose-400 uppercase italic">Jatuh Tempo</label><input type="date" className="w-full bg-rose-50/30 border border-rose-100 rounded-xl px-4 py-3 font-black text-xs text-rose-600 outline-none focus:border-rose-300 shadow-sm" value={invData.dueDate} onChange={(e) => setInvData({...invData, dueDate: e.target.value})} /></div>
            <div className="space-y-1"><label className="text-[9px] font-black text-indigo-400 uppercase italic text-right block tracking-widest">Pajak (PPN)</label><button onClick={() => setIsPpnActive(!isPpnActive)} className={`w-full flex items-center justify-between px-6 py-3 rounded-xl border-2 transition-all font-black text-[10px] uppercase ${isPpnActive ? 'bg-indigo-600 border-indigo-900 text-white shadow-lg' : 'bg-slate-50 border-slate-200 text-slate-400'}`}><span>{isPpnActive ? 'PPN 11%' : 'Tanpa PPN'}</span><div className={`w-4 h-4 rounded-full border-2 transition-all ${isPpnActive ? 'bg-white border-white' : 'bg-slate-200'}`}></div></button></div>
          </div>
        </div>
        <div className="px-8 py-8 bg-slate-900 space-y-6"><form onSubmit={handleAddItem} className="space-y-6"><div className="grid grid-cols-12 gap-3 items-end"><div className="col-span-12 lg:col-span-3"><label className="block text-[8px] font-black text-slate-500 uppercase mb-1 tracking-widest italic">Pilih Item Obat</label><select required className="w-full bg-slate-800 border-none rounded-xl px-4 py-3 text-xs font-black text-white outline-none focus:ring-2 focus:ring-teal-500" value={currentMedId} onChange={(e) => setCurrentMedId(e.target.value)}><option value="">-- PILIH OBAT --</option>{selectedOrder?.items.map(i => <option key={i.medicineId} value={i.medicineId}>{i.name.toUpperCase()}</option>)}</select></div><div className="col-span-4 lg:col-span-3 bg-slate-800/40 p-2 rounded-xl border border-slate-700/50 flex flex-col gap-1"><label className="text-[7px] font-black text-teal-400 uppercase tracking-widest text-center">Tier 1 (Utama)</label><div className="flex gap-1"><input type="number" placeholder="Qty" className="w-1/2 bg-slate-800 border-none rounded-lg p-2 text-xs font-black text-white text-center outline-none" value={tier1.qty} onChange={(e) => setTier1({...tier1, qty: e.target.value})} /><input list="unit-list" placeholder="Satuan" className="w-1/2 bg-slate-800 border-none rounded-lg p-2 text-[10px] font-black text-teal-400 text-center uppercase outline-none" value={tier1.unit} onChange={(e) => setTier1({...tier1, unit: e.target.value})} /></div></div><div className="col-span-4 lg:col-span-3 bg-slate-800/40 p-2 rounded-xl border border-slate-700/50 flex flex-col gap-1"><label className="text-[7px] font-black text-amber-400 uppercase tracking-widest text-center italic">Tier 2 (Isi Per T1)</label><div className="flex gap-1"><input type="number" placeholder="Isi" className="w-1/2 bg-slate-800 border-none rounded-lg p-2 text-xs font-black text-white text-center outline-none" value={tier2.qty} onChange={(e) => setTier2({...tier2, qty: e.target.value})} /><input list="unit-list" placeholder="Satuan" className="w-1/2 bg-slate-800 border-none rounded-lg p-2 text-[10px] font-black text-amber-400 text-center uppercase outline-none" value={tier2.unit} onChange={(e) => setTier2({...tier2, unit: e.target.value})} /></div></div><div className="col-span-4 lg:col-span-3 bg-slate-800/40 p-2 rounded-xl border border-slate-700/50 flex flex-col gap-1"><label className="text-[7px] font-black text-emerald-400 uppercase tracking-widest text-center italic">Tier 3 (Isi Per T2)</label><div className="flex gap-1"><input type="number" placeholder="Isi" className="w-1/2 bg-slate-800 border-none rounded-lg p-2 text-xs font-black text-white text-center outline-none" value={tier3.qty} onChange={(e) => setTier3({...tier3, qty: e.target.value})} /><input list="unit-list" placeholder="Satuan" className="w-1/2 bg-slate-800 border-none rounded-lg p-2 text-[10px] font-black text-emerald-400 text-center uppercase outline-none" value={tier3.unit} onChange={(e) => setTier3({...tier3, unit: e.target.value})} /></div></div></div><div className="grid grid-cols-12 gap-3 items-end"><div className="col-span-4 lg:col-span-1"><label className="block text-[8px] font-black text-teal-400 uppercase mb-1 tracking-widest text-center italic">Batch</label><input type="text" placeholder="B..." className="w-full bg-slate-800 border-none rounded-xl px-2 py-3 text-xs font-black text-teal-400 uppercase outline-none text-center" value={batchInput} onChange={(e) => setBatchInput(e.target.value)} /></div><div className="col-span-4 lg:col-span-1"><label className="block text-[8px] font-black text-rose-400 uppercase mb-1 tracking-widest text-center italic">ED</label><input type="text" placeholder="MM/YY" className="w-full bg-slate-800 border-none rounded-xl px-1 py-3 text-xs font-black text-rose-400 outline-none text-center" value={edInput} onChange={(e) => setEdInput(e.target.value)} /></div><div className="col-span-12 lg:col-span-6"><label className="block text-[8px] font-black text-slate-500 uppercase mb-1 tracking-widest text-right italic px-4">Harga Bruto (Subtotal Baris per Tier 1)</label><div className="relative"><span className="absolute left-4 top-3 text-[10px] font-black text-slate-500">Rp</span><input type="number" placeholder="0" className="w-full bg-slate-800 border-none rounded-xl pl-10 pr-4 py-3 text-sm font-black text-white outline-none text-right" value={priceInput} onChange={(e) => setPriceInput(e.target.value)} /></div></div><div className="col-span-6 lg:col-span-2"><label className="block text-[8px] font-black text-amber-500 uppercase mb-1 tracking-widest text-center">Diskon PBF (%)</label><input type="number" placeholder="0" className="w-full bg-amber-900/20 border-none rounded-xl px-4 py-3 text-sm font-black text-amber-400 outline-none text-center" value={discInput} onChange={(e) => setDiscInput(e.target.value)} /></div><div className="col-span-6 lg:col-span-2"><button type="submit" className="w-full bg-teal-500 hover:bg-teal-400 text-white h-[44px] rounded-xl transition-all flex items-center justify-center shadow-lg active:scale-95 border-b-4 border-teal-700 active:border-b-0"><svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M12 4v16m8-8H4" /></svg><span className="text-[10px] font-black uppercase tracking-widest">Tambah</span></button></div></div>{totalIncomingSmall > 0 && (<div className="flex items-center space-x-3 text-[9px] font-black uppercase tracking-[0.2em] animate-fadeIn"><span className="text-slate-500">Kalkulasi Masuk Stok:</span><span className="text-teal-400">{tier1.qty} {tier1.unit}</span><span className="text-slate-700">x</span><span className="text-amber-400">{tier2.qty} {tier2.unit}</span><span className="text-slate-700">x</span><span className="text-emerald-400">{tier3.qty} {tier3.unit}</span><span className="text-slate-700">=</span><span className="bg-slate-800 px-3 py-1 rounded-lg text-white border border-slate-700">{totalIncomingSmall.toLocaleString()} UNIT KECIL</span></div>)}<datalist id="unit-list">{UNIT_OPTIONS.map(u => <option key={u} value={u} />)}</datalist></form></div>
        <div className="px-8 py-4 min-h-[400px]"><table className="w-full text-left"><thead><tr className="border-b border-slate-100"><th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Detail Item & Konversi</th><th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Batch / ED</th><th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Qty Total (Kecil)</th><th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Subtotal Akhir</th><th className="py-4 w-10"></th></tr></thead><tbody className="divide-y divide-slate-50">{items.length > 0 ? items.map((item, i) => { const med = medicines.find(m => m.id === item.medicineId); const totalPcs = item.quantity * item.convMediumUsed * item.convSmallUsed; return (<tr key={i} className="hover:bg-slate-50/50 transition-colors group animate-fadeIn"><td className="py-5"><p className="font-black text-slate-800 text-sm uppercase tracking-tight">{med?.name}</p><p className="text-[9px] font-bold text-slate-400 uppercase italic mt-1">{item.quantity} Unit x {item.convMediumUsed} x {item.convSmallUsed} | @ Bruto Rp {item.costPrice.toLocaleString()} (Disc {item.discountPercent}%)</p></td><td className="py-5 text-center"><div className="inline-block px-4 py-1.5 bg-slate-100 rounded-xl border border-slate-200"><p className="text-[10px] font-black text-teal-600 uppercase leading-none">{item.batchNumber}</p><p className="text-[9px] font-bold text-rose-400 mt-1 uppercase tracking-tighter">{item.expiredDate}</p></div></td><td className="py-5 text-center"><span className="text-xs font-black text-slate-700 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">{totalPcs.toLocaleString()} {med?.unitSmall || 'UNIT'}</span></td><td className="py-5 text-right font-black text-slate-900 text-base italic">Rp {item.subtotal.toLocaleString()}</td><td className="py-5 text-right"><button onClick={() => setItems(items.filter((_, idx) => idx !== i))} className="text-slate-300 hover:text-rose-500 transition-colors p-2 hover:bg-rose-50 rounded-full"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button></td></tr>)}) : (<tr><td colSpan={5} className="py-40 text-center"><div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200 shadow-inner"><svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg></div><p className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-300">Daftar item faktur kosong</p></td></tr>)}</tbody></table></div>
        <div className="bg-slate-50 p-10 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-10"><div className="w-full md:w-80"><button onClick={handleSubmit} disabled={items.length === 0 || !invData.number || isLocked} className="w-full bg-slate-900 text-white py-6 rounded-[32px] font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-teal-600 disabled:bg-slate-200 transition-all border-b-8 border-slate-700 active:border-b-0 active:scale-95 flex items-center justify-center space-x-3"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg><span>SIMPAN FAKTUR FINAL</span></button></div><div className="w-full md:w-[450px] bg-white p-10 rounded-[40px] border border-slate-200 shadow-2xl space-y-5"><div className="flex justify-between items-center text-[12px] font-black text-slate-400 uppercase tracking-widest"><span>Subtotal Netto:</span><span className="text-slate-800">Rp {Math.round(totals.subtotal).toLocaleString()}</span></div><div className="flex justify-between items-center text-[12px] font-black text-indigo-400 uppercase tracking-widest border-b border-dashed border-slate-100 pb-5"><span>PPN {isPpnActive ? '11%' : '0%'}:</span><span>Rp {Math.round(totals.tax).toLocaleString()}</span></div><div className="flex justify-between items-end"><div><span className="text-[10px] font-black text-slate-400 uppercase italic block mb-1">Grand Total Tagihan Faktur:</span><span className="text-4xl font-black text-slate-900 tracking-tighter italic leading-none">Rp {Math.round(totals.grand).toLocaleString()}</span></div><div className="text-[11px] bg-teal-50 text-teal-600 px-4 py-2 rounded-xl font-black italic border border-teal-100 uppercase tracking-widest">Verified</div></div></div></div>
      </div>
    </div>
  );
};

export default InvoicesView;
