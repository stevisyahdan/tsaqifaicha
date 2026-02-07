
import React, { useState, useRef } from 'react';
import { Invoice, Supplier } from '../types';

interface DebtsViewProps {
  invoices: Invoice[];
  suppliers: Supplier[];
  onPayInvoice: (id: string, method: 'Tunai' | 'Transfer', ref: string) => void;
}

const DebtsView: React.FC<DebtsViewProps> = ({ invoices, suppliers, onPayInvoice }) => {
  const [filter, setFilter] = useState<'ALL' | 'UNPAID' | 'PAID'>('UNPAID');
  
  // State Modal Pembayaran
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedInv, setSelectedInv] = useState<Invoice | null>(null);
  const [payMethod, setPayMethod] = useState<'Tunai' | 'Transfer'>('Tunai');
  const [refNumber, setRefNumber] = useState('');

  // State untuk Cetak Individual
  const [printInvoiceData, setPrintInvoiceData] = useState<Invoice | null>(null);

  // Ref untuk area print
  const printRef = useRef<HTMLDivElement>(null);
  const singlePrintRef = useRef<HTMLDivElement>(null);

  const filtered = invoices.filter(i => {
    if (filter === 'ALL') return true;
    return i.status === filter;
  });

  const totalUnpaid = invoices
    .filter(i => i.status === 'UNPAID')
    .reduce((acc, curr) => acc + curr.totalAmount, 0);

  // Grouping hutang berdasarkan PBF untuk cetak instruksi transfer kolektif
  const unpaidByPbf = invoices
    .filter(i => i.status === 'UNPAID')
    .reduce((acc: any, curr) => {
      if (!acc[curr.pbfName]) {
        const supplier = suppliers.find(s => s.name === curr.pbfName);
        acc[curr.pbfName] = {
          pbfName: curr.pbfName,
          bankName: supplier?.bankName || 'BANK TIDAK TERDAFTAR',
          accountNumber: supplier?.accountNumber || 'REKENING TIDAK ADA',
          total: 0,
          invoices: []
        };
      }
      acc[curr.pbfName].total += curr.totalAmount;
      acc[curr.pbfName].invoices.push(curr);
      return acc;
    }, {});

  const groupedDebts = Object.values(unpaidByPbf);

  const handleOpenPayModal = (inv: Invoice) => {
    setSelectedInv(inv);
    setPayMethod('Tunai');
    setRefNumber('');
    setShowPayModal(true);
  };

  const handleConfirmPay = () => {
    if (!selectedInv) return;
    if (payMethod === 'Transfer' && !refNumber.trim()) {
      alert('Nomor Referensi Transfer wajib diisi!');
      return;
    }
    
    onPayInvoice(selectedInv.id, payMethod, refNumber);
    setShowPayModal(false);
    setSelectedInv(null);
  };

  const handlePrintTransferSheet = () => {
    const printContent = printRef.current;
    if (!printContent) return;
    
    const originalContents = document.body.innerHTML;
    document.body.innerHTML = printContent.innerHTML;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload(); 
  };

  const handlePrintSingleInvoice = (inv: Invoice) => {
    setPrintInvoiceData(inv);
    setTimeout(() => {
      const printContent = singlePrintRef.current;
      if (!printContent) return;
      const originalContents = document.body.innerHTML;
      document.body.innerHTML = printContent.innerHTML;
      window.print();
      document.body.innerHTML = originalContents;
      window.location.reload();
    }, 100);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header Summary */}
      <div className="bg-white p-8 rounded-[40px] shadow-2xl shadow-slate-200/40 border border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2 italic">Monitoring Hutang Dagang (Inkaso)</h3>
          <p className="text-5xl font-black text-slate-900 leading-tight tracking-tighter italic">Rp {totalUnpaid.toLocaleString()}</p>
          <div className="mt-4 flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.5)]"></span>
            <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest italic">Total Belum Terbayar</span>
          </div>
        </div>
        <div className="flex flex-col space-y-4 w-full md:w-auto">
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-rose-50 p-6 rounded-3xl border-2 border-rose-100 min-w-[150px] shadow-sm">
               <p className="text-[10px] text-rose-400 font-black uppercase mb-1 tracking-widest italic">Unpaid</p>
               <p className="text-2xl font-black text-rose-600 italic leading-none">{invoices.filter(i => i.status === 'UNPAID').length}</p>
             </div>
             <div className="bg-teal-50 p-6 rounded-3xl border-2 border-teal-100 min-w-[150px] shadow-sm">
               <p className="text-[10px] text-teal-400 font-black uppercase mb-1 tracking-widest italic">Settled</p>
               <p className="text-2xl font-black text-teal-600 italic leading-none">{invoices.filter(i => i.status === 'PAID').length}</p>
             </div>
          </div>
          
          <button 
            onClick={handlePrintTransferSheet}
            disabled={groupedDebts.length === 0}
            className="bg-indigo-600 text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center hover:bg-indigo-700 transition-all shadow-xl disabled:bg-slate-200 border-b-4 border-indigo-900 active:border-b-0 active:scale-95"
          >
            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            CETAK DAFTAR TRANSFER KOLEKTIF
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[40px] shadow-xl border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex flex-col sm:flex-row justify-between items-center gap-6 bg-slate-50/20">
          <h4 className="font-black text-slate-800 uppercase text-xs italic tracking-widest">
            {filter === 'PAID' ? 'Riwayat Pelunasan Faktur' : 'Daftar Tagihan PBF & Jatuh Tempo'}
          </h4>
          <div className="flex bg-slate-100 rounded-2xl border-2 border-slate-200 p-1.5 shadow-inner">
            <button onClick={() => setFilter('UNPAID')} className={`px-8 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${filter === 'UNPAID' ? 'bg-rose-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Tagihan</button>
            <button onClick={() => setFilter('PAID')} className={`px-8 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${filter === 'PAID' ? 'bg-teal-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Riwayat</button>
            <button onClick={() => setFilter('ALL')} className={`px-8 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${filter === 'ALL' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Semua</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-900 text-white">
              <tr>
                <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest">Faktur & Supplier</th>
                <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest">Info Rekening PBF</th>
                <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-right">Nominal Tagihan</th>
                <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(inv => {
                const supplier = suppliers.find(s => s.name === inv.pbfName);
                return (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-all group">
                    <td className="px-10 py-6">
                      <div className="font-black text-indigo-600 text-sm italic">{inv.number}</div>
                      <div className="text-sm font-black text-slate-800 mt-1 uppercase tracking-tight">{inv.pbfName}</div>
                      <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1 italic">Jatuh Tempo: {inv.dueDate}</div>
                    </td>
                    <td className="px-10 py-6">
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 inline-block">
                        <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">{supplier?.bankName || 'BANK -'}</p>
                        <p className="text-xs font-black text-slate-800 font-mono tracking-widest">{supplier?.accountNumber || 'REKENING TIDAK ADA'}</p>
                      </div>
                    </td>
                    <td className="px-10 py-6 text-right">
                       <p className="font-black text-slate-900 text-base tracking-tighter italic">Rp {inv.totalAmount.toLocaleString()}</p>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex items-center justify-center space-x-2">
                        {inv.status === 'UNPAID' && (
                          <button 
                            onClick={() => handlePrintSingleInvoice(inv)}
                            className="bg-white border-2 border-slate-200 text-slate-400 p-2.5 rounded-xl hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm active:scale-95"
                            title="Cetak Slip Tagihan untuk Lapor Grup"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                          </button>
                        )}
                        
                        {inv.status === 'UNPAID' ? (
                          <button onClick={() => handleOpenPayModal(inv)} className="bg-teal-500 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase hover:bg-teal-600 transition-all shadow-xl active:scale-95 border-b-4 border-teal-700 active:border-b-0">BAYAR</button>
                        ) : (
                          <div className="flex flex-col items-center justify-center">
                            <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-inner border border-emerald-200 mb-1">
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>
                            </div>
                            <div className="text-[8px] font-black text-emerald-500 uppercase tracking-widest text-center">LUNAS - {inv.paymentMethod}</div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* TEMPLATE KOLEKTIF - HIDDEN */}
      <div className="hidden">
        <div ref={printRef} className="p-10 text-slate-900 font-sans">
          <div className="text-center border-b-4 border-slate-900 pb-6 mb-8">
            <h2 className="text-2xl font-black uppercase italic">Apotek Senyum Sehat</h2>
            <p className="text-xs font-bold uppercase tracking-widest">Lembar Instruksi Transfer Kolektif Supplier (PBF)</p>
            <p className="text-[10px] mt-2 italic">Dicetak pada: {new Date().toLocaleString('id-ID')}</p>
          </div>

          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 border-2 border-slate-900">
                <th className="p-4 text-[10px] font-black uppercase">PBF Supplier</th>
                <th className="p-4 text-[10px] font-black uppercase text-center">Nama Bank</th>
                <th className="p-4 text-[10px] font-black uppercase text-center">No. Rekening</th>
                <th className="p-4 text-[10px] font-black uppercase text-right">Nominal Transfer</th>
              </tr>
            </thead>
            <tbody>
              {groupedDebts.map((debt: any, idx: number) => (
                <tr key={idx} className="border-b-2 border-slate-200">
                  <td className="p-4">
                    <p className="font-black text-sm uppercase">{debt.pbfName}</p>
                    <p className="text-[9px] text-slate-500 font-bold italic">Total {debt.invoices.length} Faktur</p>
                  </td>
                  <td className="p-4 text-center">
                    <p className="font-black text-sm">{debt.bankName}</p>
                  </td>
                  <td className="p-4 text-center">
                    <p className="font-black text-base tracking-[0.1em] font-mono italic">{debt.accountNumber}</p>
                  </td>
                  <td className="p-4 text-right">
                    <p className="font-black text-base italic">Rp {debt.total.toLocaleString()}</p>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-900 text-white">
                <td colSpan={3} className="p-4 text-right font-black uppercase text-xs">Grand Total Terhutang</td>
                <td className="p-4 text-right font-black text-lg italic">Rp {totalUnpaid.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>

          <div className="mt-20 grid grid-cols-3 gap-10 text-center">
            <div className="space-y-20">
              <p className="text-[10px] font-black uppercase tracking-widest underline italic">Dibuat Oleh (Admin)</p>
              <p className="font-bold text-xs">( ............................ )</p>
            </div>
            <div className="space-y-20">
              <p className="text-[10px] font-black uppercase tracking-widest underline italic">Diverifikasi (Apoteker)</p>
              <p className="font-bold text-xs">( ............................ )</p>
            </div>
            <div className="space-y-20">
              <p className="text-[10px] font-black uppercase tracking-widest underline italic">Disetujui (Owner)</p>
              <p className="font-bold text-xs">( ............................ )</p>
            </div>
          </div>
        </div>
      </div>

      {/* TEMPLATE INDIVIDUAL (LAPOR GRUP) - HIDDEN */}
      <div className="hidden">
        <div ref={singlePrintRef} className="p-16 text-slate-900 font-sans max-w-[800px] mx-auto bg-white border-8 border-slate-900">
           <div className="text-center border-b-4 border-slate-900 pb-10 mb-10">
              <h1 className="text-3xl font-black uppercase italic tracking-tighter mb-2">APOTEK SENYUM SEHAT</h1>
              <p className="text-sm font-black uppercase tracking-[0.4em] text-indigo-600">Laporan Tagihan Masuk - Segera Dibayar</p>
           </div>

           <div className="space-y-12">
              <div className="grid grid-cols-2 gap-10">
                 <div>
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Diterima Dari PBF:</p>
                    <p className="text-xl font-black text-slate-900 uppercase leading-none">{printInvoiceData?.pbfName}</p>
                 </div>
                 <div className="text-right">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Nomor Faktur:</p>
                    <p className="text-xl font-black text-indigo-600 font-mono">{printInvoiceData?.number}</p>
                 </div>
              </div>

              <div className="bg-slate-50 p-10 rounded-[40px] border-4 border-slate-200 shadow-inner text-center">
                 <p className="text-[12px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4 italic">Total Nominal Yang Harus Ditransfer:</p>
                 <p className="text-6xl font-black text-slate-900 tracking-tighter italic">Rp {printInvoiceData?.totalAmount.toLocaleString()}</p>
                 <div className="h-2 w-32 bg-indigo-500 mx-auto mt-6 rounded-full"></div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                 <div className="bg-indigo-900 p-8 rounded-[40px] text-white shadow-2xl">
                    <div className="flex justify-between items-center mb-6">
                       <p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-300">Instruksi Rekening PBF:</p>
                       <div className="bg-white/20 px-4 py-1 rounded-full text-[10px] font-black uppercase italic">Urgent Payment</div>
                    </div>
                    <p className="text-2xl font-black mb-2 uppercase italic">{suppliers.find(s => s.name === printInvoiceData?.pbfName)?.bankName || 'BANK SUPPLIER'}</p>
                    <p className="text-4xl font-black font-mono tracking-[0.2em]">{suppliers.find(s => s.name === printInvoiceData?.pbfName)?.accountNumber || 'REKENING TIDAK DITEMUKAN'}</p>
                    <p className="text-[11px] font-bold mt-6 text-indigo-200 uppercase tracking-widest italic text-center border-t border-indigo-700 pt-6">A.N: {printInvoiceData?.pbfName} (Perusahaan Terdaftar)</p>
                 </div>
              </div>

              <div className="flex justify-between items-center text-[11px] font-black text-slate-400 uppercase tracking-widest border-t border-slate-100 pt-8 italic">
                 <span>Tanggal Input: {new Date().toLocaleDateString('id-ID')}</span>
                 <span className="text-rose-500">Jatuh Tempo: {printInvoiceData?.dueDate}</span>
              </div>
           </div>

           <div className="mt-16 text-center italic text-slate-300 font-black uppercase text-[9px] tracking-[0.4em]">
              Laporan Internal Apotek Senyum Sehat - Farmasi System v1.0
           </div>
        </div>
      </div>

      {/* MODAL PEMBAYARAN */}
      {showPayModal && selectedInv && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-50 p-6 animate-fadeIn">
          <div className="bg-white rounded-[48px] w-full max-w-lg overflow-hidden shadow-2xl animate-scaleIn border-4 border-slate-800">
            <div className="bg-slate-900 p-8 text-white relative">
               <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-teal-400 mb-2 italic">Konfirmasi Pelunasan</h4>
               <p className="text-2xl font-black italic">Faktur: {selectedInv.number}</p>
               <div className="mt-4 p-4 bg-white/10 rounded-2xl border border-white/20">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Nominal</p>
                  <p className="text-3xl font-black text-white tracking-tighter italic leading-none">Rp {selectedInv.totalAmount.toLocaleString()}</p>
               </div>
            </div>
            
            <div className="p-10 space-y-8">
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest italic text-center">Pilih Metode Transaksi</label>
                <div className="grid grid-cols-2 gap-4">
                   <button onClick={() => setPayMethod('Tunai')} className={`flex items-center justify-center py-5 rounded-3xl border-4 transition-all font-black text-sm ${payMethod === 'Tunai' ? 'bg-indigo-600 border-indigo-900 text-white shadow-xl scale-105' : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100'}`}>TUNAI</button>
                   <button onClick={() => setPayMethod('Transfer')} className={`flex items-center justify-center py-5 rounded-3xl border-4 transition-all font-black text-sm ${payMethod === 'Transfer' ? 'bg-indigo-600 border-indigo-900 text-white shadow-xl scale-105' : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100'}`}>TRANSFER</button>
                </div>
              </div>

              {payMethod === 'Transfer' && (
                <div className="space-y-3 animate-slideDown">
                  <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-widest italic">Nomor Referensi Transfer / Bukti</label>
                  <input type="text" placeholder="CONTOH: REF12345ABC..." className="w-full bg-indigo-50 border-4 border-indigo-100 rounded-2xl p-5 font-black text-indigo-900 outline-none focus:border-indigo-600 transition-all uppercase placeholder:text-indigo-200" value={refNumber} onChange={(e) => setRefNumber(e.target.value)} />
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button onClick={() => setShowPayModal(false)} className="flex-1 py-5 font-black text-slate-400 uppercase text-xs tracking-[0.2em] hover:text-rose-500 transition-colors">BATALKAN</button>
                <button onClick={handleConfirmPay} className="flex-[2] bg-[#2ECC71] text-white px-10 py-5 rounded-[28px] font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-emerald-500/20 hover:bg-[#27AE60] active:scale-95 border-b-8 border-[#27AE60] active:border-b-0 transition-all">KONFIRMASI LUNAS</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebtsView;
