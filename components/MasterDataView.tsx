
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Medicine, Supplier } from '../types';

interface MasterDataViewProps {
  medicines: Medicine[];
  suppliers: Supplier[];
  onAddMedicine: (m: Medicine) => void;
  onBulkAddMedicines: (newMeds: Medicine[]) => void;
  onEditMedicine: (m: Medicine) => void;
  onDeleteMedicine: (id: string) => void;
  onAddSupplier: (s: Supplier) => void;
  onEditSupplier: (s: Supplier) => void;
  onDeleteSupplier: (id: string) => void;
  onResetDatabase: () => void;
  onDeduplicate: () => void;
}

const GOLONGAN_OPTIONS = [
  { label: 'Obat Bebas', code: 'OB' },
  { label: 'Obat Bebas Terbatas', code: 'OBT' },
  { label: 'Obat Keras (K)', code: 'OK' },
  { label: 'Psikotropika', code: 'PS' },
  { label: 'Narkotika', code: 'NK' },
  { label: 'Obat Program (TB/HIV)', code: 'PR' }
];

const BENTUK_OPTIONS = [
  { label: 'Tablet', code: 'tab' },
  { label: 'Kapsul', code: 'cap' },
  { label: 'Botol', code: 'btl' },
  { label: 'Tube', code: 'tub' },
  { label: 'Ampul', code: 'amp' },
  { label: 'Vial', code: 'vial' },
  { label: 'Syringe', code: 'syr' },
  { label: 'Sachet', code: 'sct' },
  { label: 'Suppositoria', code: 'supp' },
  { label: 'Patch', code: 'patch' },
  { label: 'Inhaler', code: 'inh' },
  { label: 'Respule', code: 'rsp' },
  { label: 'Minidose', code: 'md' },
  { label: 'Pcs', code: 'pcs' }
];

const KATEGORI_OPTIONS = [
  { label: 'Apotek', code: 'APT' },
  { label: 'Alat Kesehatan', code: 'ALK' }
];

const MasterDataView: React.FC<MasterDataViewProps> = ({ 
  medicines, 
  suppliers, 
  onAddMedicine,
  onBulkAddMedicines,
  onEditMedicine, 
  onDeleteMedicine,
  onAddSupplier,
  onEditSupplier,
  onDeleteSupplier,
}) => {
  const [activeTab, setActiveTab] = useState<'MEDICINE' | 'SUPPLIER'>('MEDICINE');
  const [viewMode, setViewMode] = useState<'LIST' | 'FORM' | 'BULK'>('LIST');
  const [editingMed, setEditingMed] = useState<Medicine | null>(null);
  const [editingSup, setEditingSup] = useState<Supplier | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Form State for Medicine
  const [formCostPrice, setFormCostPrice] = useState<number>(0);
  const [formDiscount, setFormDiscount] = useState<number>(0);
  const [formMargin, setFormMargin] = useState<number>(25);
  const [formPrice, setFormPrice] = useState<number>(0);
  const [convMed, setConvMed] = useState<number>(1);
  const [convSmall, setConvSmall] = useState<number>(1);
  const [selectedKat, setSelectedKat] = useState('APT');
  const [selectedGol, setSelectedGol] = useState('OB');
  const [selectedBtk, setSelectedBtk] = useState('tab');
  const [generatedId, setGeneratedId] = useState('');

  const nettoBeliPerPcs = useMemo(() => {
    const totalPcs = convMed * convSmall;
    const nettoBesar = formCostPrice * (1 - (formDiscount / 100));
    return totalPcs > 0 ? nettoBesar / totalPcs : 0;
  }, [formCostPrice, formDiscount, convMed, convSmall]);

  useEffect(() => {
    const calculatedPrice = nettoBeliPerPcs + (nettoBeliPerPcs * (formMargin / 100));
    setFormPrice(Math.round(calculatedPrice));
  }, [nettoBeliPerPcs, formMargin]);

  useEffect(() => {
    if (editingMed) {
      setGeneratedId(editingMed.id);
      setFormCostPrice(editingMed.costPrice);
      setFormDiscount(editingMed.pbfDiscountPercent || 0);
      setFormMargin(editingMed.marginPercent || 0);
      setConvMed(editingMed.convMedium);
      setConvSmall(editingMed.convSmall);
      setSelectedKat(editingMed.category);
      setSelectedGol(editingMed.golongan);
      setSelectedBtk(editingMed.bentuk);
    } else {
      const prefix = `${selectedKat}-${selectedGol}-${selectedBtk.toUpperCase()}`;
      const count = medicines.filter(m => m.id.startsWith(prefix)).length;
      const sequence = (count + 1).toString().padStart(4, '0');
      setGeneratedId(`${prefix}-${sequence}`);
    }
  }, [selectedKat, selectedGol, selectedBtk, editingMed, medicines]);

  const handleMedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const stockVal = parseInt(formData.get('stock') as string) || 0;
    const edVal = formData.get('expiredDate') as string;

    const data: Medicine = {
      id: generatedId,
      name: (formData.get('name') as string).toUpperCase(),
      brand: (formData.get('brand') as string).toUpperCase(),
      category: selectedKat,
      golongan: selectedGol,
      bentuk: selectedBtk,
      unitLarge: (formData.get('unitLarge') as string).toUpperCase(),
      unitMedium: (formData.get('unitMedium') as string).toUpperCase(),
      unitSmall: (formData.get('unitSmall') as string).toLowerCase(),
      convMedium: convMed,
      convSmall: convSmall,
      stock: stockVal,
      costPrice: formCostPrice,
      pbfDiscountPercent: formDiscount,
      marginPercent: formMargin,
      price: formPrice,
      expiredDate: edVal,
      pbfName: (formData.get('pbfName') as string).toUpperCase(),
      batches: editingMed ? 
        (editingMed.stock === stockVal && editingMed.expiredDate === edVal ? editingMed.batches : [{ batchNumber: 'MANUAL', expiredDate: edVal, stock: stockVal }]) : 
        (stockVal > 0 ? [{ batchNumber: 'INIT', expiredDate: edVal, stock: stockVal }] : [])
    };
    
    if (editingMed) onEditMedicine(data); else onAddMedicine(data);
    backToList();
  };

  const handleSupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data: Supplier = {
      id: editingSup?.id || `PBF-${Date.now()}`,
      name: (formData.get('name') as string).toUpperCase(),
      address: (formData.get('address') as string).toUpperCase(),
      phone: formData.get('phone') as string,
      pic: (formData.get('pic') as string).toUpperCase(),
      bankName: (formData.get('bankName') as string).toUpperCase(),
      accountNumber: formData.get('accountNumber') as string,
    };
    if (editingSup) onEditSupplier(data); else onAddSupplier(data);
    backToList();
  };

  const backToList = () => {
    setViewMode('LIST');
    setEditingMed(null);
    setEditingSup(null);
  };

  const downloadCSVTemplate = () => {
    const headers = "KODE_BARANG,NAMA_OBAT,MERK,GOLONGAN,PBF,DISC_PBF,HNA_BRUTO,SATUAN_BESAR,ISI_STRIP_PER_BOX,SATUAN_SEDANG,ISI_TAB_PER_STRIP,SATUAN_KECIL,MARGIN_PERSEN,STOK_AWAL,ED_YYYY_MM_DD\n";
    const example = ",PARACETAMOL 500MG,GENERIC,OB,PBF APOLLO,0,50000,BOX,10,STRIP,10,TAB,25,100,2026-12-31";
    const blob = new Blob([headers + example], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_master_obat_senyum_sehat.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      const newMeds: Medicine[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cols = line.split(',');

        const csv_id = cols[0]?.trim();
        const name = cols[1]?.trim()?.toUpperCase();
        const brand = cols[2]?.trim()?.toUpperCase();
        const golongan = cols[3]?.trim()?.toUpperCase() || 'OB';
        const pbf = cols[4]?.trim()?.toUpperCase();
        const disc = parseFloat(cols[5]) || 0;
        const hna = parseFloat(cols[6]) || 0;
        const uLarge = cols[7]?.trim()?.toUpperCase() || 'BOX';
        const cMed = parseInt(cols[8]) || 1;
        const uMed = cols[9]?.trim()?.toUpperCase() || 'STRIP';
        const cSmall = parseInt(cols[10]) || 1;
        const uSmall = cols[11]?.trim()?.toLowerCase() || 'tab';
        const margin = parseFloat(cols[12]) || 25;
        const stock = parseInt(cols[13]) || 0;
        const ed = cols[14]?.trim() || '';

        if (!name) continue;

        let finalId = csv_id;
        if (!finalId) {
          const prefix = `APT-${golongan}-BULK`;
          const count = medicines.length + newMeds.length + i;
          finalId = `${prefix}-${count.toString().padStart(4, '0')}`;
        }

        const totalPcs = cMed * cSmall;
        const nettoBesar = hna * (1 - (disc / 100));
        const nettoKecil = totalPcs > 0 ? nettoBesar / totalPcs : 0;
        const calculatedPrice = Math.round(nettoKecil + (nettoKecil * (margin / 100)));

        newMeds.push({
          id: finalId,
          name,
          brand,
          category: 'APT',
          golongan,
          bentuk: 'tab',
          unitLarge: uLarge,
          unitMedium: uMed,
          unitSmall: uSmall,
          convMedium: cMed,
          convSmall: cSmall,
          stock,
          costPrice: hna,
          pbfDiscountPercent: disc,
          marginPercent: margin,
          price: calculatedPrice,
          expiredDate: ed,
          pbfName: pbf,
          batches: stock > 0 ? [{ batchNumber: 'IMPORT', expiredDate: ed, stock }] : []
        });
      }

      onBulkAddMedicines(newMeds);
      setIsImporting(false);
      alert(`Berhasil mengimpor ${newMeds.length} data obat!`);
      backToList();
    };
    reader.readAsText(file);
  };

  if (viewMode === 'BULK') {
    return (
      <div className="animate-fadeIn pb-20 max-w-2xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-4">
            <button onClick={backToList} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </button>
            <div>
              <h4 className="font-black uppercase tracking-widest text-[10px] text-teal-600 mb-0.5 italic">Bulk Management</h4>
              <p className="text-xl font-black italic uppercase text-slate-800">Import Database Obat</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-10 rounded-[48px] border border-slate-200 shadow-xl space-y-8 text-center">
           <div className="w-20 h-20 bg-teal-50 text-teal-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
             <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0l-4-4m4 4V4" /></svg>
           </div>
           
           <div className="space-y-4">
              <h3 className="text-lg font-black uppercase italic text-slate-800">Langkah-langkah Import</h3>
              <div className="text-xs font-bold text-slate-500 space-y-2 uppercase tracking-wide text-left max-w-xs mx-auto">
                 <p>1. Unduh template CSV resmi kami di bawah ini.</p>
                 <p>2. Isi data obat Anda (gunakan Excel/Google Sheets).</p>
                 <p>3. Simpan sebagai .CSV (Comma Separated Values).</p>
                 <p>4. Unggah file tersebut kembali ke sistem ini.</p>
              </div>
           </div>

           <div className="grid grid-cols-1 gap-4 pt-6">
              <button onClick={downloadCSVTemplate} className="w-full bg-slate-100 text-slate-700 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest border-2 border-slate-200 hover:bg-white transition-all flex items-center justify-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                <span>UNDUH TEMPLATE CSV</span>
              </button>
              
              <div className="relative">
                 <input 
                   type="file" 
                   accept=".csv" 
                   ref={fileInputRef} 
                   onChange={handleFileUpload} 
                   className="hidden" 
                 />
                 <button 
                   onClick={() => fileInputRef.current?.click()} 
                   disabled={isImporting}
                   className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-teal-600 transition-all border-b-8 border-slate-700 active:border-b-0 flex items-center justify-center space-x-3 disabled:opacity-50"
                 >
                   {isImporting ? (
                     <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                   ) : (
                     <>
                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                       <span>UPLOAD FILE CSV SEKARANG</span>
                     </>
                   )}
                 </button>
              </div>
           </div>
        </div>
      </div>
    );
  }

  if (viewMode === 'FORM') {
    return (
      <div className="animate-fadeIn pb-20 max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-4">
            <button onClick={backToList} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </button>
            <div>
              <h4 className="font-black uppercase tracking-widest text-[10px] text-teal-600 mb-0.5 italic">Apotek Senyum Sehat</h4>
              <p className="text-xl font-black italic uppercase text-slate-800">
                {activeTab === 'MEDICINE' 
                  ? (editingMed ? 'Edit Informasi Obat' : 'Tambah Obat Baru') 
                  : (editingSup ? 'Update Data PBF' : 'Tambah PBF Baru')}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={activeTab === 'MEDICINE' ? handleMedSubmit : handleSupSubmit} className="space-y-8">
          {activeTab === 'MEDICINE' ? (
            <div className="space-y-8">
              <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                   <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">1. Identitas Produk</h5>
                   <span className="text-[10px] font-black text-teal-600 bg-teal-50 px-3 py-1 rounded-lg border border-teal-100 font-mono">KODE SKU: {generatedId}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nama Obat</label>
                    <input name="name" required placeholder="NAMA LENGKAP..." defaultValue={editingMed?.name} className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-teal-500 outline-none font-black text-xs uppercase" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Merk / Brand</label>
                    <input name="brand" required placeholder="BRAND..." defaultValue={editingMed?.brand} className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-teal-500 outline-none font-black text-xs uppercase" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Kategori</label>
                    <select value={selectedKat} onChange={(e) => setSelectedKat(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-xs font-black outline-none focus:border-teal-500">
                      {KATEGORI_OPTIONS.map(o => <option key={o.code} value={o.code}>{o.label}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Golongan</label>
                    <select value={selectedGol} onChange={(e) => setSelectedGol(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-xs font-black outline-none focus:border-teal-500">
                      {GOLONGAN_OPTIONS.map(o => <option key={o.code} value={o.code}>{o.label}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Sediaan</label>
                    <select value={selectedBtk} onChange={(e) => setSelectedBtk(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-xs font-black outline-none focus:border-teal-500">
                      {BENTUK_OPTIONS.map(o => <option key={o.code} value={o.code}>{o.code} - {o.label}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-6">
                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic border-b border-slate-100 pb-4">2. Konversi & Stok</h5>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 items-end">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase italic">Sat. Besar</label>
                    <input name="unitLarge" required defaultValue={editingMed?.unitLarge || 'BOX'} className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 text-xs font-black text-center uppercase" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-teal-600 uppercase italic text-center block">Isi</label>
                    <input type="number" required value={convMed} onChange={(e) => setConvMed(parseInt(e.target.value) || 1)} className="w-full px-4 py-3 rounded-xl border border-teal-100 bg-teal-50/50 text-xs font-black text-teal-600 text-center outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase italic">Sat. Sedang</label>
                    <input name="unitMedium" required defaultValue={editingMed?.unitMedium || 'STRIP'} className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 text-xs font-black text-center uppercase" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-teal-600 uppercase italic text-center block">Isi</label>
                    <input type="number" required value={convSmall} onChange={(e) => setConvSmall(parseInt(e.target.value) || 1)} className="w-full px-4 py-3 rounded-xl border border-teal-100 bg-teal-50/50 text-xs font-black text-teal-600 text-center outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase italic">Sat. Kecil</label>
                    <input name="unitSmall" required defaultValue={editingMed?.unitSmall || 'tab'} className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 text-xs font-black text-center uppercase" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest ml-1 italic">Stok Awal (Pcs/Tab)</label>
                    <input name="stock" type="number" required defaultValue={editingMed?.stock || 0} className="w-full px-4 py-3.5 rounded-xl border border-indigo-100 bg-indigo-50/30 font-black text-xs text-indigo-700 outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-rose-500 uppercase tracking-widest ml-1 italic">Kedaluwarsa (ED)</label>
                    <input name="expiredDate" type="date" required defaultValue={editingMed?.expiredDate} className="w-full px-4 py-3.5 rounded-xl border border-rose-100 bg-rose-50/30 font-black text-xs text-rose-600 outline-none" />
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 p-8 rounded-[32px] shadow-xl space-y-6">
                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                  <h5 className="text-[10px] font-black text-teal-400 uppercase tracking-widest italic">3. Finansial & Margin</h5>
                  <div className="text-[9px] font-black text-slate-400 uppercase">HPP Netto /Pcs: Rp {Math.round(nettoBeliPerPcs).toLocaleString()}</div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase italic">HNA Bruto (BOX)</label>
                    <input type="number" value={formCostPrice || ''} onChange={(e) => setFormCostPrice(parseFloat(e.target.value) || 0)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white font-black text-xs outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-amber-400 uppercase italic">Disc PBF (%)</label>
                    <input type="number" value={formDiscount || ''} onChange={(e) => setFormDiscount(parseFloat(e.target.value) || 0)} className="w-full bg-amber-400/10 border border-amber-400/30 rounded-xl px-4 py-3.5 text-amber-400 font-black text-xs outline-none text-center" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-teal-400 uppercase italic">Margin (%)</label>
                    <input type="number" value={formMargin || ''} onChange={(e) => setFormMargin(parseFloat(e.target.value) || 0)} className="w-full bg-teal-400/10 border border-teal-400/30 rounded-xl px-4 py-3.5 text-teal-400 font-black text-xs outline-none text-center" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-white uppercase italic underline decoration-teal-500 decoration-2 underline-offset-4">Harga Jual /Pcs</label>
                    <div className="w-full bg-white rounded-xl px-4 py-3 text-slate-900 font-black text-xl flex items-center justify-center italic h-[46px]">Rp {formPrice.toLocaleString()}</div>
                  </div>
                </div>
                <div className="pt-4 space-y-2">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 italic">Nama PBF Supplier</label>
                   <input name="pbfName" defaultValue={editingMed?.pbfName} placeholder="CONTOH: PBF APOLLO" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-black text-white uppercase outline-none" />
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Informasi PBF Supplier</h5>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-1">Nama Resmi Perusahaan PBF</label>
                  <input name="name" required placeholder="PT. ..." defaultValue={editingSup?.name} className="w-full px-4 py-4 rounded-xl border border-slate-200 bg-slate-50 font-black text-xs text-slate-800 focus:bg-white focus:border-teal-500 outline-none uppercase shadow-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-1">Nama PIC / Sales</label>
                  <input name="pic" required placeholder="NAMA PIC..." defaultValue={editingSup?.pic} className="w-full px-4 py-4 rounded-xl border border-slate-200 bg-slate-50 font-black text-xs text-slate-800 focus:bg-white focus:border-teal-500 outline-none uppercase shadow-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-1">Kontak Telp/WA</label>
                  <input name="phone" required placeholder="08..." defaultValue={editingSup?.phone} className="w-full px-4 py-4 rounded-xl border border-slate-200 bg-slate-50 font-black text-xs text-slate-800 focus:bg-white focus:border-teal-500 outline-none shadow-sm" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-1">Alamat Kantor</label>
                <textarea name="address" required placeholder="ALAMAT LENGKAP PBF..." defaultValue={editingSup?.address} rows={3} className="w-full px-4 py-4 rounded-xl border border-slate-200 bg-slate-50 font-bold text-xs text-slate-800 focus:bg-white focus:border-teal-500 outline-none uppercase shadow-sm"></textarea>
              </div>

              <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100 space-y-6">
                <h6 className="text-[9px] font-black text-indigo-500 uppercase tracking-widest italic flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                  Informasi Rekening Pembayaran (Inkaso)
                </h6>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Nama Bank</label>
                    <input name="bankName" placeholder="CONTOH: BCA / MANDIRI / BRI" defaultValue={editingSup?.bankName} className="w-full px-4 py-4 rounded-xl border border-indigo-200 bg-white font-black text-xs text-indigo-900 focus:border-indigo-500 outline-none uppercase shadow-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Nomor Rekening</label>
                    <input name="accountNumber" placeholder="KETIK NOMOR REKENING..." defaultValue={editingSup?.accountNumber} className="w-full px-4 py-4 rounded-xl border border-indigo-200 bg-white font-black text-xs text-indigo-900 focus:border-indigo-500 outline-none shadow-sm" />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-4 pt-6">
            <button type="button" onClick={backToList} className="px-8 py-4 rounded-2xl font-black text-slate-400 hover:text-rose-500 transition-all uppercase text-[11px] tracking-widest">Batalkan</button>
            <button type="submit" className="bg-slate-900 text-white px-12 py-4 rounded-2xl font-black shadow-xl hover:bg-teal-600 transition-all uppercase text-[11px] tracking-widest flex items-center space-x-3 border-b-4 border-slate-700 active:border-b-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
              <span>Simpan Data</span>
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-12 max-w-[1600px] mx-auto px-4">
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-3 rounded-2xl border border-slate-200 shadow-sm gap-4">
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button onClick={() => setActiveTab('MEDICINE')} className={`px-6 py-2.5 rounded-lg text-[10px] font-black transition-all uppercase tracking-widest ${activeTab === 'MEDICINE' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Data Master Obat</button>
          <button onClick={() => setActiveTab('SUPPLIER')} className={`px-6 py-2.5 rounded-lg text-[10px] font-black transition-all uppercase tracking-widest ${activeTab === 'SUPPLIER' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Database PBF</button>
        </div>
        <div className="flex flex-wrap gap-2">
          {activeTab === 'MEDICINE' && (
            <button 
              onClick={() => setViewMode('BULK')} 
              className="bg-indigo-600 text-white px-8 py-3.5 rounded-xl font-black flex items-center justify-center hover:bg-indigo-700 transition-all text-[11px] uppercase tracking-widest border-b-4 border-indigo-800 active:border-b-0"
              title="Upload file CSV untuk input massal"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
              UPLOAD DATABASE (CSV)
            </button>
          )}
          <button onClick={() => setViewMode('FORM')} className="bg-slate-900 text-white px-10 py-3.5 rounded-xl font-black flex items-center justify-center shadow-lg hover:bg-teal-600 transition-all text-[11px] uppercase tracking-[0.2em] border-b-4 border-slate-700 active:border-b-0">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
            TAMBAH DATA
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[32px] shadow-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left min-w-[1400px]">
            <thead className="bg-slate-900 text-white">
              {activeTab === 'MEDICINE' ? (
                <tr>
                  <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest">Kode</th>
                  <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest">Nama Obat</th>
                  <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-center">Gol</th>
                  <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-center">Merk</th>
                  <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-center">PBF</th>
                  <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-center text-amber-400">Disc</th>
                  <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-right">HNA Bruto</th>
                  <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-center">Sat.K</th>
                  <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-center text-teal-400">Mg%</th>
                  <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-right">Harga Jual</th>
                  <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-right text-emerald-400">Laba (Rp)</th>
                  <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-center">Aksi</th>
                </tr>
              ) : (
                <tr>
                  <th className="px-10 py-5 text-[9px] font-black uppercase tracking-widest">Detail PBF Supplier</th>
                  <th className="px-10 py-5 text-[9px] font-black uppercase tracking-widest">Informasi Bank & Rekening</th>
                  <th className="px-10 py-5 text-[9px] font-black uppercase tracking-widest">PIC / Kontak Sales</th>
                  <th className="px-10 py-5 text-[9px] font-black uppercase tracking-widest text-center">Aksi</th>
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeTab === 'MEDICINE' ? (
                medicines.map(m => (
                  <tr key={m.id} className="hover:bg-slate-50 transition-colors text-[10px]">
                    <td className="px-6 py-4 font-mono font-black text-teal-600">{m.id}</td>
                    <td className="px-6 py-4 font-black text-slate-800 uppercase truncate max-w-[180px]">{m.name}</td>
                    <td className="px-6 py-4 text-center"><span className="bg-slate-100 px-2 py-0.5 rounded font-black">{m.golongan}</span></td>
                    <td className="px-6 py-4 text-center font-bold text-slate-400 italic uppercase">{m.brand || '-'}</td>
                    <td className="px-6 py-4 text-center font-bold text-slate-600 uppercase truncate max-w-[120px]">{m.pbfName || '-'}</td>
                    <td className="px-6 py-4 text-center font-black text-amber-600">{m.pbfDiscountPercent}%</td>
                    <td className="px-6 py-4 text-right font-bold text-slate-800">Rp {m.costPrice.toLocaleString()}</td>
                    <td className="px-6 py-4 text-center font-black text-indigo-500 uppercase">{m.unitSmall}</td>
                    <td className="px-6 py-4 text-center font-black text-teal-600">{m.marginPercent}%</td>
                    <td className="px-6 py-4 text-right font-black text-slate-900">Rp {m.price.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right font-black text-emerald-600 italic">Rp {Math.round(m.price - (m.costPrice * (1 - m.pbfDiscountPercent/100) / (m.convMedium * m.convSmall))).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center space-x-1">
                        <button onClick={() => { setEditingMed(m); setViewMode('FORM'); }} className="p-1.5 text-slate-300 hover:text-teal-600 transition-colors bg-white border border-slate-100 rounded-lg"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                        <button onClick={() => { if(window.confirm(`HAPUS ${m.name}?`)) onDeleteMedicine(m.id); }} className="p-1.5 text-slate-300 hover:text-rose-600 transition-colors bg-white border border-slate-100 rounded-lg"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                suppliers.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-10 py-5">
                       <div className="font-black text-slate-800 text-xs uppercase">{s.name}</div>
                       <div className="text-[9px] text-slate-400 font-bold uppercase truncate max-w-xs">{s.address}</div>
                    </td>
                    <td className="px-10 py-5">
                       {s.bankName ? (
                         <div className="bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-xl inline-block">
                            <div className="text-[10px] font-black text-indigo-600 uppercase italic leading-none mb-1">{s.bankName}</div>
                            <div className="text-xs font-black text-slate-900 font-mono tracking-widest">{s.accountNumber}</div>
                         </div>
                       ) : (
                         <span className="text-[10px] text-slate-300 font-black uppercase italic tracking-widest">REKENING BELUM DIINPUT</span>
                       )}
                    </td>
                    <td className="px-10 py-5">
                       <div className="text-[10px] font-black text-slate-800 uppercase leading-none mb-1">{s.pic}</div>
                       <div className="text-[11px] font-black text-teal-600 italic tracking-tighter">{s.phone}</div>
                    </td>
                    <td className="px-10 py-5 text-center">
                      <div className="flex justify-center space-x-2">
                        <button onClick={() => { setEditingSup(s); setViewMode('FORM'); }} className="p-2 text-slate-300 hover:text-teal-600 transition-colors bg-white border border-slate-100 rounded-lg"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                        <button onClick={() => { if(window.confirm(`HAPUS PBF ${s.name}?`)) onDeleteSupplier(s.id); }} className="p-2 text-slate-300 hover:text-rose-600 transition-colors bg-white border border-slate-100 rounded-lg"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MasterDataView;
