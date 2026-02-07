
import React, { useState, useRef } from 'react';
import { Medicine, Sale, SaleItem } from '../types';

interface CartItem {
  medicineId: string;
  quantity: number | string; 
  unitType: 'large' | 'medium' | 'small';
}

interface SalesViewProps {
  medicines: Medicine[];
  onSaleComplete: (sale: Sale) => void;
  isLocked?: boolean;
}

const SalesView: React.FC<SalesViewProps> = ({ medicines, onSaleComplete, isLocked = false }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Semua');

  const [customerName, setCustomerName] = useState('');
  const [customerAge, setCustomerAge] = useState('');
  const [customerGender, setCustomerGender] = useState<'Pria' | 'Wanita'>('Pria');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [useTax, setUseTax] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<'Tunai' | 'Transfer' | 'QRIS' | 'EDC'>('Tunai');

  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const categories = ['Semua', ...new Set(medicines.map(m => m.category))];

  const filteredMedicines = medicines.filter(m => 
    (activeCategory === 'Semua' || m.category === activeCategory) &&
    m.name.toLowerCase().includes(search.toLowerCase()) && 
    m.stock > 0
  );

  const handleManualQuantity = (id: string, value: string, unitType: 'large' | 'medium' | 'small') => {
    const med = medicines.find(m => m.id === id);
    if (!med) return;
    if (value === '') {
      setCart(prev => prev.map(item => item.medicineId === id ? { ...item, quantity: '', unitType } : item));
      return;
    }
    let newQty = parseInt(value);
    if (isNaN(newQty)) return;
    let multiplier = 1;
    if (unitType === 'large') multiplier = med.convMedium * med.convSmall;
    else if (unitType === 'medium') multiplier = med.convSmall;
    if (newQty * multiplier > med.stock) {
      newQty = Math.floor(med.stock / multiplier);
    }
    setCart(prev => {
      const existingIdx = prev.findIndex(item => item.medicineId === id);
      if (existingIdx > -1) {
        const newCart = [...prev];
        newCart[existingIdx] = { ...newCart[existingIdx], quantity: newQty, unitType };
        return newCart;
      } else {
        return [...prev, { medicineId: id, quantity: newQty, unitType }];
      }
    });
  };

  const addToCart = (medicine: Medicine) => {
    if (isLocked) return;
    const existing = cart.find(c => c.medicineId === medicine.id);
    if (existing) {
      const currentQty = typeof existing.quantity === 'number' ? existing.quantity : 0;
      handleManualQuantity(medicine.id, (currentQty + 1).toString(), existing.unitType);
    } else {
      setCart([...cart, { medicineId: medicine.id, quantity: 1, unitType: 'small' }]);
    }
  };

  const removeItem = (id: string) => {
    setCart(prev => prev.filter(item => item.medicineId !== id));
  };

  const cartDetails = cart.map(item => {
    const med = medicines.find(m => m.id === item.medicineId)!;
    const qtyVal = typeof item.quantity === 'number' ? item.quantity : 0;
    let unitLabel = med.unitSmall;
    let multiplier = 1;
    if (item.unitType === 'large') { unitLabel = med.unitLarge; multiplier = med.convMedium * med.convSmall; }
    else if (item.unitType === 'medium') { unitLabel = med.unitMedium; multiplier = med.convSmall; }
    const pricePerUnit = med.price * multiplier;
    return { 
      ...item, displayQty: item.quantity, name: med.name, price: pricePerUnit, unit: unitLabel, 
      total: pricePerUnit * qtyVal, costPrice: med.costPrice * multiplier
    };
  });

  const subtotal = cartDetails.reduce((acc, curr) => acc + curr.total, 0);
  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const pajak = useTax ? Math.round(afterDiscount * 0.11) : 0;
  const grandTotal = afterDiscount + pajak;

  const handlePay = () => {
    if (cart.length === 0 || isLocked) return;
    const validItems = cartDetails.filter(i => typeof i.quantity === 'number' && i.quantity > 0);
    if (validItems.length === 0) { alert("Masukkan jumlah barang yang valid!"); return; }
    const newSale: Sale = {
      id: `S-${Date.now()}`,
      date: new Date().toISOString(),
      items: validItems.map(i => ({ medicineId: i.medicineId, name: i.name, quantity: i.quantity as number, unitUsed: i.unit, price: i.price, costPrice: i.costPrice, total: i.total })),
      subtotal, discount: discountAmount, totalAmount: grandTotal, customerName: customerName || 'Umum', customerAge: parseInt(customerAge) || undefined, customerGender: customerGender, paymentMethod: paymentMethod
    };
    onSaleComplete(newSale);
    setLastSale(newSale);
    setShowReceipt(true);
    setCart([]); setCustomerName(''); setCustomerAge(''); setCustomerGender('Pria'); setDiscountAmount(0); setUseTax(false); setPaymentMethod('Tunai');
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;
    const originalContents = document.body.innerHTML;
    document.body.innerHTML = printContent.innerHTML;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  };

  return (
    <div className="flex h-[calc(100vh-100px)] -m-6 overflow-hidden bg-slate-50 relative">
      {isLocked && (
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md z-[60] flex items-center justify-center p-6">
           <div className="bg-white p-12 rounded-[50px] shadow-2xl border-4 border-slate-900 text-center max-w-lg animate-fadeIn scale-110">
              <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-8 animate-bounce">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v2h8z" /></svg>
              </div>
              <h4 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900">Sistem Dikunci</h4>
              <p className="text-sm text-slate-400 font-black mt-4 uppercase leading-relaxed tracking-widest italic border-t border-slate-100 pt-6">Sedang Berlangsung Stock Opname.<br/>Penjualan ditutup sementara.</p>
           </div>
        </div>
      )}

      {/* SISI KIRI: PANEL KASIR */}
      <div className="w-[380px] bg-white border-r border-slate-200 flex flex-col shadow-xl z-10">
        <div className="p-4 bg-slate-900 flex justify-between items-center text-white">
          <h2 className="font-black tracking-widest text-[10px] uppercase italic text-teal-400">Kasir Utama</h2>
          <button disabled={isLocked} onClick={() => { if(confirm('Reset Keranjang?')) setCart([]) }} className="text-rose-400 hover:text-rose-200 disabled:opacity-30">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>
        {/* DATA PASIEN */}
        <div className="p-4 bg-teal-600 space-y-2">
          <input disabled={isLocked} type="text" placeholder="NAMA PASIEN..." className="w-full bg-white/20 border border-white/30 rounded-lg p-2 font-black text-white placeholder:text-white/40 outline-none uppercase text-[10px] disabled:opacity-50" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
          <div className="grid grid-cols-2 gap-2">
             <input disabled={isLocked} type="number" placeholder="USIA" className="bg-white/20 border border-white/30 rounded-lg p-2 font-black text-white placeholder:text-white/40 outline-none text-[10px] disabled:opacity-50" value={customerAge} onChange={(e) => setCustomerAge(e.target.value)} />
             <div className={`flex bg-white/10 rounded-lg border border-white/30 overflow-hidden p-0.5 ${isLocked ? 'opacity-50' : ''}`}>
                <button disabled={isLocked} onClick={() => setCustomerGender('Pria')} className={`flex-1 text-[8px] font-black py-1 rounded transition-all ${customerGender === 'Pria' ? 'bg-white text-teal-600' : 'text-white/60'}`}>PRIA</button>
                <button disabled={isLocked} onClick={() => setCustomerGender('Wanita')} className={`flex-1 text-[8px] font-black py-1 rounded transition-all ${customerGender === 'Wanita' ? 'bg-pink-500 text-white' : 'text-white/60'}`}>WANITA</button>
             </div>
          </div>
        </div>
        {/* ITEM KERANJANG */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/30">
          {cartDetails.length > 0 ? cartDetails.map((item) => (
            <div key={item.medicineId} className="px-4 py-2 border-b border-slate-100 hover:bg-white transition-colors group animate-fadeIn">
              <div className="flex justify-between items-start">
                <div className="min-w-0 pr-2">
                  <p className="font-bold text-slate-800 text-[10px] truncate uppercase leading-tight">{item.name}</p>
                  <p className="text-[8px] text-slate-400 font-bold italic">Rp {item.price.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-slate-900 text-[10px] whitespace-nowrap">Rp {item.total.toLocaleString()}</p>
                  <button disabled={isLocked} onClick={() => removeItem(item.medicineId)} className="text-rose-400 hover:text-rose-600 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>
              <div className="flex items-center mt-1 space-x-2">
                <div className="flex items-center bg-white border border-slate-200 rounded px-1 shadow-sm">
                   <button disabled={isLocked} onClick={() => { const val = typeof item.quantity === 'number' ? item.quantity : 0; handleManualQuantity(item.medicineId, (val - 1).toString(), item.unitType) }} className="text-slate-400 hover:text-rose-500 p-0.5"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M20 12H4" /></svg></button>
                   <input disabled={isLocked} type="number" className="w-10 text-[10px] font-black text-slate-700 text-center outline-none bg-transparent" value={item.displayQty} onChange={(e) => handleManualQuantity(item.medicineId, e.target.value, item.unitType)} />
                   <button disabled={isLocked} onClick={() => { const val = typeof item.quantity === 'number' ? item.quantity : 0; handleManualQuantity(item.medicineId, (val + 1).toString(), item.unitType) }} className="text-slate-400 hover:text-teal-500 p-0.5"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg></button>
                </div>
                <select disabled={isLocked} className="bg-slate-100 text-[8px] font-black text-slate-500 rounded p-1 outline-none border-none shadow-sm" value={item.unitType} onChange={(e) => handleManualQuantity(item.medicineId, item.displayQty.toString(), e.target.value as any)}>
                  <option value="small">Btr</option><option value="medium">Str</option><option value="large">Box</option>
                </select>
              </div>
            </div>
          )) : (
            <div className="h-full flex flex-col items-center justify-center opacity-20 py-20">
               <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
               <p className="text-[8px] font-black uppercase tracking-widest">Keranjang Kosong</p>
            </div>
          )}
        </div>
        {/* PEMBAYARAN */}
        <div className="bg-white border-t border-slate-200 p-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
             <div className="flex justify-between items-center bg-slate-50 px-2 py-1.5 rounded border border-slate-100">
               <span className="text-[8px] font-bold text-slate-400 uppercase">Pot:</span>
               <input disabled={isLocked} type="number" className="w-16 bg-transparent text-right font-black text-[10px] outline-none" placeholder="0" value={discountAmount || ''} onChange={(e) => setDiscountAmount(parseInt(e.target.value) || 0)} />
             </div>
             <button disabled={isLocked} onClick={() => setUseTax(!useTax)} className={`text-[8px] font-black py-1.5 rounded border transition-all ${useTax ? 'bg-indigo-600 border-indigo-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
               PPN 11%: {useTax ? 'ON' : 'OFF'}
             </button>
          </div>
          <div className="space-y-1">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">Metode Pembayaran:</p>
            <div className="grid grid-cols-4 gap-1">
              {['Tunai', 'Transfer', 'EDC', 'QRIS'].map((method) => (
                <button key={method} disabled={isLocked} onClick={() => setPaymentMethod(method as any)} className={`py-1.5 rounded-lg text-[8px] font-black uppercase border transition-all ${paymentMethod === method ? 'bg-slate-900 border-slate-900 text-white shadow-md' : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100'}`}>
                  {method}
                </button>
              ))}
            </div>
          </div>
          <button disabled={cart.length === 0 || isLocked} onClick={handlePay} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-xl flex justify-between items-center px-6 transition-all shadow-lg active:scale-95 disabled:bg-slate-200 border-b-4 border-emerald-700 active:border-b-0">
            <div className="text-left">
              <p className="text-[8px] font-black uppercase opacity-60 leading-none">Bayar Sekarang</p>
              <p className="font-black text-xl tracking-tighter">Rp {grandTotal.toLocaleString()}</p>
            </div>
            <div className="text-right"><p className="text-[8px] font-black uppercase opacity-60 leading-none">{paymentMethod}</p><svg className="w-5 h-5 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg></div>
          </button>
        </div>
      </div>
      {/* SISI KANAN: KATALOG OBAT */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="bg-white p-4 flex items-center justify-between border-b border-slate-200 z-0">
          <div className="relative flex-1 max-w-lg">
            <input disabled={isLocked} type="text" placeholder="Cari obat cepat..." className="w-full bg-slate-100 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-teal-500 transition-all shadow-inner" value={search} onChange={(e) => setSearch(e.target.value)} />
            <svg className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <div className="ml-4 flex items-center space-x-2 text-right"><div className="hidden sm:block"><p className="text-[8px] font-black text-slate-400 uppercase leading-none italic">Database</p><p className="text-xs font-black text-teal-600 leading-tight">{filteredMedicines.length} Item</p></div></div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 bg-slate-50/50 custom-scrollbar">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-9 gap-2">
            {filteredMedicines.map(m => (
              <button disabled={isLocked} key={m.id} onClick={() => addToCart(m)} className="bg-white rounded-lg border border-slate-200 p-2 hover:border-teal-500 hover:shadow-md transition-all text-left flex flex-col group active:scale-95 relative overflow-hidden disabled:opacity-50">
                <div className="absolute top-0 right-0 p-1"><div className={`w-1.5 h-1.5 rounded-full ${m.stock < 10 ? 'bg-rose-500' : 'bg-teal-500'}`}></div></div>
                <p className="text-[6px] font-black text-slate-300 uppercase truncate mb-0.5 leading-none">{m.category}</p>
                <h4 className="font-bold text-slate-800 text-[9px] uppercase line-clamp-2 h-6 leading-tight mb-1.5 group-hover:text-teal-600">{m.name}</h4>
                <div className="mt-auto pt-1.5 border-t border-slate-50"><p className="text-[9px] font-black text-slate-900 tracking-tighter">Rp {m.price.toLocaleString()}</p><p className={`text-[7px] font-black mt-0.5 ${m.stock < 10 ? 'text-rose-500' : 'text-slate-400'}`}>Stok: {m.stock}</p></div>
              </button>
            ))}
          </div>
        </div>
        <div className="bg-white border-t border-slate-200 p-2 flex overflow-x-auto gap-1.5 no-scrollbar z-10">
          {categories.map(cat => (
            <button key={cat} disabled={isLocked} onClick={() => setActiveCategory(cat)} className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all border ${activeCategory === cat ? 'bg-slate-900 border-slate-900 text-white shadow-md' : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'} disabled:opacity-50`}>
              {cat}
            </button>
          ))}
        </div>
      </div>
      {/* MODAL STRUK */}
      {showReceipt && lastSale && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl flex items-center justify-center z-[100] p-6 animate-fadeIn">
          <div className="bg-white rounded-[40px] w-full max-w-md overflow-hidden shadow-2xl animate-scaleIn border border-white/20 flex flex-col h-[90vh]">
            <div className="bg-emerald-600 p-6 flex justify-between items-center text-white">
              <div className="flex items-center space-x-3"><div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg></div><h4 className="font-black uppercase tracking-widest text-sm italic">Berhasil Dibayar</h4></div>
              <button onClick={() => setShowReceipt(false)} className="text-white/60 hover:text-white transition-colors"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50" ref={printRef}>
              <div className="bg-white p-8 shadow-sm border border-slate-100 mx-auto max-w-sm font-mono text-slate-800 text-[11px] print:p-2 print:shadow-none print:border-none">
                 <div className="text-center mb-6 space-y-1"><h2 className="font-black text-base uppercase tracking-widest leading-none">APOTEK SENYUM SEHAT</h2><p className="text-[8px] uppercase font-bold">JL. RM Said no 87, Punggawan Banjarsari, Surakarta</p><div className="border-b-2 border-dashed border-slate-200 my-4"></div></div>
                 <div className="flex justify-between mb-1"><span>No. Nota:</span><span className="font-bold">{lastSale.id}</span></div>
                 <div className="flex justify-between mb-1"><span>Tanggal:</span><span>{new Date(lastSale.date).toLocaleString('id-ID')}</span></div>
                 <div className="flex justify-between mb-1"><span>Pasien:</span><span className="font-bold uppercase">{lastSale.customerName}</span></div>
                 <div className="border-b-2 border-dashed border-slate-200 my-4"></div>
                 <div className="space-y-3 mb-6">{lastSale.items.map((item, i) => (<div key={i}><div className="flex justify-between font-bold mb-0.5"><span className="uppercase">{item.name}</span></div><div className="flex justify-between text-slate-500"><span>{item.quantity} {item.unitUsed} x {item.price.toLocaleString()}</span><span>{item.total.toLocaleString()}</span></div></div>))}</div>
                 <div className="border-b-2 border-dashed border-slate-200 my-4"></div>
                 <div className="space-y-1 text-right">
                    <div className="flex justify-between"><span>Subtotal:</span><span>Rp {lastSale.subtotal.toLocaleString()}</span></div>
                    {lastSale.discount > 0 && (<div className="flex justify-between text-amber-600 font-bold"><span>Diskon:</span><span>-Rp {lastSale.discount.toLocaleString()}</span></div>)}
                    {lastSale.totalAmount - lastSale.subtotal + lastSale.discount > 0 && (<div className="flex justify-between"><span>PPN 11%:</span><span>Rp {(lastSale.totalAmount - (lastSale.subtotal - lastSale.discount)).toLocaleString()}</span></div>)}
                    <div className="flex justify-between text-base font-black border-t-2 border-dashed border-slate-200 pt-2 mt-2"><span>TOTAL:</span><span>Rp {lastSale.totalAmount.toLocaleString()}</span></div>
                    <div className="flex justify-between font-bold mt-1 italic text-slate-500"><span>Metode:</span><span className="uppercase">{lastSale.paymentMethod}</span></div>
                 </div>
                 <div className="text-center mt-10 space-y-1"><p className="font-black italic">Terima kasih atas kunjungannya</p><p className="font-black italic">Senyum Sehat - Semoga Lekas Sembuh</p></div>
              </div>
            </div>
            <div className="p-6 bg-white border-t border-slate-100 grid grid-cols-2 gap-4"><button onClick={() => setShowReceipt(false)} className="py-4 rounded-2xl font-black text-slate-400 hover:bg-slate-50 uppercase text-xs tracking-widest transition-all">TUTUP</button><button onClick={handlePrint} className="bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-teal-600 transition-all flex items-center justify-center space-x-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg><span>CETAK NOTA</span></button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesView;
