
import React, { useState, useRef, useEffect } from 'react';
import { Medicine, PurchaseOrder, Supplier } from '../types';

interface OrdersViewProps {
  medicines: Medicine[];
  suppliers: Supplier[];
  orders: PurchaseOrder[];
  onOrderCreate: (order: PurchaseOrder) => void;
  onOrderUpdate: (order: PurchaseOrder) => void;
  onOrderDelete: (id: string) => void;
}

const RECOMMENDED_UNITS = [
  'BOX', 'DUS', 'KOTAK', 'PACK', 'PAK', 'FLACON', 'VIAL', 'AMPUL', 'BOTOL', 'TUBE', 'GALON',
  'STRIP', 'BLISTER', 'TABLET', 'KAPSUL', 'KAPLET', 'SACHET', 'PCS'
];

const OrdersView: React.FC<OrdersViewProps> = ({ medicines, suppliers, orders, onOrderCreate, onOrderUpdate, onOrderDelete }) => {
  const [activeTab, setActiveTab] = useState<'PENDING' | 'RECEIVED' | 'ARCHIVED'>('PENDING');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  
  // States for Cancel Modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Form States
  const [selectedPbf, setSelectedPbf] = useState('');
  const [validDays, setValidDays] = useState(7);
  const [selectedItems, setSelectedItems] = useState<{ medicineId: string; name: string; quantity: number; unitUsed: string }[]>([]);
  
  // Search States
  const [medSearch, setMedSearch] = useState('');
  const [selectedMed, setSelectedMed] = useState<Medicine | null>(null);
  const [showMedSuggestions, setShowMedSuggestions] = useState(false);
  const [unitSearch, setUnitSearch] = useState('');
  const [showUnitSuggestions, setShowUnitSuggestions] = useState(false);
  const [quantity, setQuantity] = useState<number>(0);

  const medRef = useRef<HTMLDivElement>(null);
  const unitRef = useRef<HTMLDivElement>(null);

  const medSuggestions = medSearch.length > 0 
    ? medicines.filter(m => m.name.toLowerCase().includes(medSearch.toLowerCase())).slice(0, 5)
    : [];

  const unitSuggestions = unitSearch.length > 0
    ? RECOMMENDED_UNITS.filter(u => u.toLowerCase().includes(unitSearch.toLowerCase())).slice(0, 5)
    : RECOMMENDED_UNITS.slice(0, 8);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (medRef.current && !medRef.current.contains(event.target as Node)) setShowMedSuggestions(false);
      if (unitRef.current && !unitRef.current.contains(event.target as Node)) setShowUnitSuggestions(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpenCreate = () => {
    setEditingOrderId(null);
    setSelectedPbf('');
    setSelectedItems([]);
    setValidDays(7);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (order: PurchaseOrder) => {
    setEditingOrderId(order.id);
    setSelectedPbf(order.pbfName);
    setSelectedItems(order.items);
    // Calculate back valid days roughly
    const d1 = new Date(order.date);
    const d2 = new Date(order.expiryDate);
    const diff = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 3600 * 24));
    setValidDays(diff);
    setIsModalOpen(true);
  };

  const handleSelectMed = (med: Medicine) => {
    setSelectedMed(med);
    setMedSearch(med.name);
    setUnitSearch(med.unitLarge.toUpperCase());
    setShowMedSuggestions(false);
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMed || quantity <= 0 || !unitSearch) return;
    const unitUsed = unitSearch.toUpperCase();
    const existing = selectedItems.find(i => i.medicineId === selectedMed.id && i.unitUsed === unitUsed);
    if (existing) {
      setSelectedItems(selectedItems.map(i => (i.medicineId === selectedMed.id && i.unitUsed === unitUsed) ? { ...i, quantity: i.quantity + quantity } : i));
    } else {
      setSelectedItems([...selectedItems, { medicineId: selectedMed.id, name: selectedMed.name, quantity, unitUsed }]);
    }
    setMedSearch(''); setUnitSearch(''); setSelectedMed(null); setQuantity(0);
  };

  const handleSaveSP = () => {
    if (!selectedPbf || selectedItems.length === 0) return;
    
    const date = new Date();
    const expiry = new Date();
    expiry.setDate(date.getDate() + validDays);

    const spData: PurchaseOrder = {
      id: editingOrderId || `SP-${Date.now()}`,
      date: editingOrderId ? orders.find(o => o.id === editingOrderId)!.date : date.toISOString().split('T')[0],
      expiryDate: expiry.toISOString().split('T')[0],
      pbfName: selectedPbf,
      items: selectedItems,
      status: 'PENDING'
    };

    if (editingOrderId) onOrderUpdate(spData);
    else onOrderCreate(spData);

    setIsModalOpen(false);
    alert('Surat Pesanan Berhasil Disimpan.');
  };

  const handleConfirmCancel = () => {
    if (!cancellingOrderId || !cancelReason) return;
    const order = orders.find(o => o.id === cancellingOrderId);
    if (order) {
      onOrderUpdate({ ...order, status: 'CANCELLED', cancelReason });
    }
    setShowCancelModal(false);
    setCancellingOrderId(null);
    setCancelReason('');
  };

  const filteredOrders = orders.filter(o => {
    if (activeTab === 'PENDING') return o.status === 'PENDING';
    if (activeTab === 'RECEIVED') return o.status === 'RECEIVED';
    if (activeTab === 'ARCHIVED') return o.status === 'CANCELLED' || o.status === 'EXPIRED';
    return false;
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-2xl font-black text-slate-800 tracking-tight italic">Manajemen Surat Pesanan</h3>
          <p className="text-sm text-slate-400 font-medium">Katalog pengadaan barang dan siklus hidup SP</p>
        </div>
        <button onClick={handleOpenCreate} className="bg-teal-600 text-white px-8 py-4 rounded-3xl font-black flex items-center shadow-xl hover:bg-teal-700 transition-all text-xs uppercase tracking-widest border-b-8 border-teal-800 active:border-b-0">
          BUAT SP BARU
        </button>
      </div>

      {/* TABS */}
      <div className="flex bg-white p-1.5 rounded-[24px] border border-slate-200 shadow-sm w-fit">
        <button onClick={() => setActiveTab('PENDING')} className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'PENDING' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>Aktif (Pending)</button>
        <button onClick={() => setActiveTab('RECEIVED')} className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'RECEIVED' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400'}`}>Selesai</button>
        <button onClick={() => setActiveTab('ARCHIVED')} className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'ARCHIVED' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-400'}`}>Batal / Hangus</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOrders.map(order => (
          <div key={order.id} className="bg-white p-8 rounded-[40px] border-2 border-slate-100 shadow-sm hover:shadow-2xl transition-all group overflow-hidden relative">
            <div className={`absolute top-0 right-0 w-24 h-24 -mr-12 -mt-12 rounded-full opacity-10 ${order.status === 'PENDING' ? 'bg-amber-500' : order.status === 'RECEIVED' ? 'bg-emerald-500' : 'bg-slate-500'}`}></div>
            
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <span className="text-[9px] font-black text-slate-400 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100 uppercase italic">ID: {order.id.split('-')[1]?.substring(0, 6)}</span>
                <div className={`text-[9px] font-black px-3 py-1 rounded-lg uppercase tracking-widest border ${
                  order.status === 'PENDING' ? 'bg-amber-50 text-amber-500 border-amber-100' :
                  order.status === 'RECEIVED' ? 'bg-emerald-50 text-emerald-500 border-emerald-100' :
                  order.status === 'CANCELLED' ? 'bg-rose-50 text-rose-500 border-rose-100' : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}>
                  {order.status}
                </div>
              </div>

              <h4 className="font-black text-slate-800 text-lg mb-1 uppercase tracking-tight">{order.pbfName}</h4>
              <div className="flex justify-between items-center mb-6">
                 <p className="text-[10px] text-slate-400 font-bold uppercase">{order.date}</p>
                 <p className={`text-[10px] font-black uppercase italic ${order.status === 'PENDING' ? 'text-rose-400 animate-pulse' : 'text-slate-300'}`}>Exp: {order.expiryDate}</p>
              </div>
              
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-2 mb-8">
                {order.items.slice(0, 2).map((item, idx) => (
                  <div key={idx} className="flex justify-between text-[11px] font-bold text-slate-600">
                    <span className="truncate pr-4 uppercase">{item.name}</span>
                    <span className="font-black text-slate-900 whitespace-nowrap">{item.quantity} {item.unitUsed}</span>
                  </div>
                ))}
                {order.items.length > 2 && <p className="text-[9px] text-slate-400 italic text-center">+{order.items.length - 2} item lainnya</p>}
                {order.cancelReason && <p className="text-[9px] text-rose-500 font-black uppercase italic border-t border-rose-100 pt-2 mt-2">Ket: {order.cancelReason}</p>}
              </div>

              <div className="grid grid-cols-2 gap-2">
                {order.status === 'PENDING' ? (
                  <>
                    <button onClick={() => handleOpenEdit(order)} className="bg-indigo-50 text-indigo-600 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all">EDIT</button>
                    <button onClick={() => { setCancellingOrderId(order.id); setShowCancelModal(true); }} className="bg-rose-50 text-rose-500 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all">BATALKAN</button>
                  </>
                ) : (
                  <button onClick={() => { if(confirm('Hapus arsip ini?')) onOrderDelete(order.id) }} className="col-span-2 bg-slate-100 text-slate-400 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all">HAPUS ARSIP</button>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredOrders.length === 0 && (
          <div className="col-span-full py-40 text-center flex flex-col items-center justify-center opacity-30 grayscale">
            <svg className="w-16 h-16 mb-4 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4a2 2 0 012-2m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
            <p className="text-xs font-black uppercase tracking-widest">Tidak ada surat pesanan di tab ini</p>
          </div>
        )}
      </div>

      {/* MODAL CANCEL */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center z-[100] p-6 animate-fadeIn">
          <div className="bg-white rounded-[40px] w-full max-w-md p-10 space-y-8 border-4 border-slate-900 shadow-2xl">
            <div className="text-center">
               <h4 className="text-xl font-black italic tracking-tight uppercase">Batalkan Pesanan?</h4>
               <p className="text-xs text-slate-400 font-bold mt-2 uppercase">Cantumkan alasan untuk riwayat pembukuan</p>
            </div>
            <textarea 
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl p-6 font-black text-slate-700 outline-none focus:border-rose-500 text-sm uppercase"
              placeholder="CONTOH: BARANG KOSONG / GANTI PBF..."
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
            <div className="flex gap-4">
              <button onClick={() => setShowCancelModal(false)} className="flex-1 py-4 font-black text-slate-400 uppercase text-[10px] tracking-widest">TIDAK</button>
              <button onClick={handleConfirmCancel} disabled={!cancelReason} className="flex-2 bg-rose-600 text-white px-10 py-4 rounded-[24px] font-black uppercase text-[10px] tracking-widest shadow-xl disabled:bg-slate-200 border-b-8 border-rose-800 active:border-b-0 active:scale-95 transition-all">YA, BATALKAN SP</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CREATE/EDIT */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl flex items-center justify-center z-[80] p-4 animate-fadeIn">
          <div className="bg-white rounded-[48px] w-full max-w-2xl flex flex-col h-[90vh] overflow-hidden border-4 border-slate-800 shadow-2xl">
            <div className="bg-slate-900 p-8 flex justify-between items-center text-white flex-shrink-0">
               <div>
                  <h4 className="font-black uppercase tracking-widest text-[10px] text-teal-400 mb-1 italic">{editingOrderId ? 'Pembaruan Dokumen' : 'Logistik Pengadaan'}</h4>
                  <p className="text-2xl font-black italic tracking-tight uppercase">{editingOrderId ? 'Edit Surat Pesanan' : 'Buat Surat Pesanan'}</p>
               </div>
               <button onClick={() => setIsModalOpen(false)} className="w-12 h-12 bg-white/10 hover:bg-rose-500 hover:text-white rounded-full flex items-center justify-center transition-all"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Pilih Supplier PBF</label>
                    <select className="w-full bg-slate-50 border-4 border-slate-100 rounded-2xl p-4 font-black text-slate-700 outline-none focus:border-indigo-500 appearance-none" value={selectedPbf} onChange={(e) => setSelectedPbf(e.target.value)}>
                      <option value="">-- PILIH PBF --</option>
                      {suppliers.map(s => <option key={s.id} value={s.name}>{s.name.toUpperCase()}</option>)}
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest italic">Masa Berlaku (Hari)</label>
                    <input type="number" className="w-full bg-rose-50/20 border-4 border-rose-100 rounded-2xl p-4 font-black text-rose-600 outline-none" value={validDays} onChange={(e) => setValidDays(parseInt(e.target.value) || 0)} />
                 </div>
               </div>

               <div className="bg-slate-50 p-8 rounded-[40px] border-2 border-slate-200 space-y-4">
                  <h5 className="text-[10px] font-black text-teal-600 uppercase tracking-widest flex items-center italic"><span className="w-8 h-1 bg-teal-500 mr-2 rounded-full"></span>Item Pesanan</h5>
                  <div className="relative" ref={medRef}>
                     <input type="text" placeholder="Cari Nama Obat..." className="w-full px-6 py-4 rounded-2xl border-2 border-slate-200 bg-white font-black text-slate-800 focus:border-teal-500 outline-none shadow-sm" value={medSearch} onChange={(e) => { setMedSearch(e.target.value); setShowMedSuggestions(true); }} onFocus={() => setShowMedSuggestions(true)} />
                     {showMedSuggestions && medSuggestions.length > 0 && (
                        <div className="absolute z-[90] w-full mt-2 bg-white rounded-3xl shadow-2xl border-2 border-slate-100 overflow-hidden">
                           {medSuggestions.map(m => (
                              <button key={m.id} type="button" onClick={() => handleSelectMed(m)} className="w-full text-left px-6 py-4 hover:bg-teal-50 flex items-center justify-between border-b border-slate-50 transition-colors">
                                 <span className="font-black text-slate-800 text-sm uppercase">{m.name}</span>
                                 <span className="text-[10px] font-black text-teal-600">Stok: {m.stock}</span>
                              </button>
                           ))}
                        </div>
                     )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <input type="number" placeholder="Qty" className="w-full px-6 py-4 rounded-2xl border-2 border-slate-200 bg-white font-black outline-none" value={quantity || ''} onChange={(e) => setQuantity(parseInt(e.target.value) || 0)} />
                     <div className="relative" ref={unitRef}>
                        <input type="text" placeholder="SATUAN" className="w-full px-6 py-4 rounded-2xl border-2 border-slate-200 bg-white font-black uppercase outline-none" value={unitSearch} onChange={(e) => { setUnitSearch(e.target.value); setShowUnitSuggestions(true); }} onFocus={() => setShowUnitSuggestions(true)} />
                        {showUnitSuggestions && unitSuggestions.length > 0 && (
                           <div className="absolute z-[90] w-full mt-2 bg-white rounded-3xl shadow-2xl border-2 border-slate-100 overflow-hidden max-h-40 overflow-y-auto">
                              {unitSuggestions.map((u, i) => <button key={i} type="button" onClick={() => { setUnitSearch(u); setShowUnitSuggestions(false); }} className="w-full text-left px-6 py-3 hover:bg-indigo-50 font-black text-[10px] uppercase border-b border-slate-50 transition-colors">{u}</button>)}
                           </div>
                        )}
                     </div>
                  </div>
                  <button type="button" onClick={handleAddItem} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest">TAMBAHKAN KE LIST</button>
               </div>

               <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Daftar Item SP</label>
                  <div className="bg-slate-50/50 p-4 rounded-[32px] border-2 border-dashed border-slate-200 min-h-[150px] space-y-2">
                     {selectedItems.map((item, i) => (
                        <div key={i} className="flex justify-between items-center bg-white p-5 rounded-3xl border border-slate-100 animate-fadeIn">
                           <span className="font-black text-slate-800 text-sm uppercase">{item.name}</span>
                           <div className="flex items-center gap-4">
                              <span className="font-black text-teal-600 text-xs px-3 py-1 bg-teal-50 rounded-lg">{item.quantity} {item.unitUsed}</span>
                              <button onClick={() => setSelectedItems(selectedItems.filter((_, idx) => idx !== i))} className="text-rose-400 hover:text-rose-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg></button>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            </div>

            <div className="p-8 bg-white border-t border-slate-100 flex gap-4 flex-shrink-0">
               <button onClick={() => setIsModalOpen(false)} className="flex-1 font-black text-slate-400 uppercase text-[10px] tracking-widest">BATALKAN</button>
               <button onClick={handleSaveSP} disabled={!selectedPbf || selectedItems.length === 0} className="flex-2 bg-emerald-500 text-white py-5 rounded-[28px] font-black uppercase text-xs tracking-[0.2em] shadow-2xl disabled:bg-slate-200 border-b-8 border-emerald-700 active:border-b-0 active:scale-95 transition-all">SIMPAN SURAT PESANAN</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersView;
