
import React, { useState, useEffect, useRef } from 'react';
import { ViewType, Medicine, Sale, Invoice, PurchaseOrder, Supplier, StockOpname, User } from './types';
import { INITIAL_MEDICINES, INITIAL_INVOICES, NAV_ITEMS, INITIAL_SUPPLIERS, INITIAL_SALES } from './constants';
import { createClient } from '@supabase/supabase-js';

import Dashboard from './components/Dashboard';
import SalesView from './components/SalesView';
import StockView from './components/StockView';
import OrdersView from './components/OrdersView';
import InvoicesView from './components/InvoicesView';
import DebtsView from './components/DebtsView';
import MasterDataView from './components/MasterDataView';
import ReportsView from './components/ReportsView';
import StockOpnameView from './components/StockOpnameView';
import UserMasterView from './components/UserMasterView';
import LoginPage from './components/LoginPage';

// Perbaikan: Gunakan import.meta.env untuk Vite di lingkungan localhost
const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';
const supabase = (SUPABASE_URL && SUPABASE_KEY) ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewType>('DASHBOARD');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'IDLE' | 'SYNCING' | 'SUCCESS' | 'ERROR'>('IDLE');

  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('senyumSehat_loggedUser');
    return saved ? JSON.parse(saved) : null;
  });

  // Master Users State
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('senyumSehat_users');
    const defaultUser: User = { 
      id: 'USR-001', 
      username: 'admin123', 
      password: 'admin123', 
      fullName: 'SUPER ADMIN', 
      role: 'ADMIN',
      position: 'SYSTEM OWNER'
    };
    return saved ? JSON.parse(saved) : [defaultUser];
  });

  // State Utama
  const [medicines, setMedicines] = useState<Medicine[]>(() => {
    const saved = localStorage.getItem('senyumSehat_medicines');
    return saved ? JSON.parse(saved) : INITIAL_MEDICINES;
  });
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem('senyumSehat_suppliers');
    return saved ? JSON.parse(saved) : INITIAL_SUPPLIERS;
  });
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem('senyumSehat_invoices');
    return saved ? JSON.parse(saved) : INITIAL_INVOICES;
  });
  const [sales, setSales] = useState<Sale[]>(() => {
    const saved = localStorage.getItem('senyumSehat_sales');
    return saved ? JSON.parse(saved) : INITIAL_SALES;
  });
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => {
    const saved = localStorage.getItem('senyumSehat_orders');
    return saved ? JSON.parse(saved) : [];
  });
  const [stockOpnames, setStockOpnames] = useState<StockOpname[]>(() => {
    const saved = localStorage.getItem('senyumSehat_opnames');
    return saved ? JSON.parse(saved) : [];
  });
  const [isOpnameMode, setIsOpnameMode] = useState<boolean>(() => {
    return localStorage.getItem('senyumSehat_isOpnameMode') === 'true';
  });

  // --- LOGIKA CLOUD SYNC ---
  const isInitialMount = useRef(true);
  const syncTimer = useRef<any>(null);

  useEffect(() => {
    const fetchCloudData = async () => {
      if (!supabase) {
        console.warn("Supabase client not initialized. Check your environment variable configurations.");
        return;
      }
      try {
        setSyncStatus('SYNCING');
        const { data, error } = await supabase
          .from('app_data')
          .select('content')
          .eq('id', 'main_store')
          .single();

        if (error) {
           if (error.code === 'PGRST116') {
             // Row not found, this is okay for first run
             setSyncStatus('IDLE');
             return;
           }
           throw error;
        }
        
        if (data && data.content) {
          const c = data.content;
          if (c.medicines) setMedicines(c.medicines);
          if (c.suppliers) setSuppliers(c.suppliers);
          if (c.invoices) setInvoices(c.invoices);
          if (c.sales) setSales(c.sales);
          if (c.orders) setPurchaseOrders(c.orders);
          if (c.opnames) setStockOpnames(c.opnames);
          if (c.users) setUsers(c.users);
          setSyncStatus('SUCCESS');
          setTimeout(() => setSyncStatus('IDLE'), 3000);
        }
      } catch (err) {
        console.error("Cloud Fetch Error:", err);
        setSyncStatus('ERROR');
      }
    };
    fetchCloudData();
  }, []);

  useEffect(() => {
    localStorage.setItem('senyumSehat_medicines', JSON.stringify(medicines));
    localStorage.setItem('senyumSehat_suppliers', JSON.stringify(suppliers));
    localStorage.setItem('senyumSehat_invoices', JSON.stringify(invoices));
    localStorage.setItem('senyumSehat_sales', JSON.stringify(sales));
    localStorage.setItem('senyumSehat_orders', JSON.stringify(purchaseOrders));
    localStorage.setItem('senyumSehat_opnames', JSON.stringify(stockOpnames));
    localStorage.setItem('senyumSehat_users', JSON.stringify(users));
    localStorage.setItem('senyumSehat_isOpnameMode', isOpnameMode.toString());
    if (currentUser) localStorage.setItem('senyumSehat_loggedUser', JSON.stringify(currentUser));
    else localStorage.removeItem('senyumSehat_loggedUser');

    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(async () => {
      if (!supabase) return;
      setSyncStatus('SYNCING');
      try {
        await supabase
          .from('app_data')
          .upsert({
            id: 'main_store',
            content: {
              medicines, suppliers, invoices, sales, 
              orders: purchaseOrders, opnames: stockOpnames, users
            },
            updated_at: new Date().toISOString()
          });
        setSyncStatus('SUCCESS');
        setTimeout(() => setSyncStatus('IDLE'), 3000);
      } catch (err) {
        console.error("Sync Error:", err);
        setSyncStatus('ERROR');
      }
    }, 2000);

    return () => { if (syncTimer.current) clearTimeout(syncTimer.current); };
  }, [medicines, suppliers, invoices, sales, purchaseOrders, stockOpnames, users, isOpnameMode, currentUser]);

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveView('DASHBOARD');
  };

  const renderView = () => {
    switch (activeView) {
      case 'DASHBOARD': return <Dashboard medicines={medicines} sales={sales} invoices={invoices} />;
      case 'SALES': return <SalesView isLocked={isOpnameMode} medicines={medicines} onSaleComplete={(sale) => {
          setSales(prev => [sale, ...prev]);
          setMedicines(prev => prev.map(m => {
            const saleItem = sale.items.find(si => si.medicineId === m.id);
            if (!saleItem) return m;
            let qtyToSubtract = saleItem.unitUsed === m.unitLarge ? saleItem.quantity * m.convMedium * m.convSmall : saleItem.unitUsed === m.unitMedium ? saleItem.quantity * m.convSmall : saleItem.quantity;
            const sortedBatches = [...m.batches].sort((a, b) => new Date(a.expiredDate).getTime() - new Date(b.expiredDate).getTime());
            let remaining = qtyToSubtract;
            const updatedBatches = sortedBatches.map(b => {
              if (remaining <= 0) return b;
              const sub = Math.min(b.stock, remaining);
              remaining -= sub;
              return { ...b, stock: b.stock - sub };
            });
            const totalStock = updatedBatches.reduce((acc, b) => acc + b.stock, 0);
            const earliestED = updatedBatches.filter(b => b.stock > 0).length > 0 ? updatedBatches.filter(b => b.stock > 0).sort((a, b) => new Date(a.expiredDate).getTime() - new Date(b.expiredDate).getTime())[0].expiredDate : m.expiredDate;
            return { ...m, batches: updatedBatches, stock: totalStock, expiredDate: earliestED };
          }));
        }} />;
      case 'STOCK': return <StockView medicines={medicines} />;
      case 'OPNAME': return <StockOpnameView medicines={medicines} opnames={stockOpnames} isOpnameMode={isOpnameMode} onStartOpname={() => setIsOpnameMode(true)} onCancelOpname={() => setIsOpnameMode(false)} onOpnameSubmit={(op) => {
          setStockOpnames(prev => [op, ...prev]);
          setMedicines(prev => prev.map(m => {
            const opEntries = op.entries.filter(e => e.medicineId === m.id);
            if (opEntries.length === 0) return m;
            const newB = [...m.batches];
            opEntries.forEach(entry => {
              const bIdx = newB.findIndex(b => b.batchNumber === entry.batchNumber);
              if (bIdx > -1) newB[bIdx] = { ...newB[bIdx], stock: entry.physicalStock };
            });
            const total = newB.reduce((acc, b) => acc + b.stock, 0);
            return { ...m, batches: newB, stock: total };
          }));
          setIsOpnameMode(false);
          setActiveView('DASHBOARD');
      }} />;
      case 'ORDERS': return <OrdersView medicines={medicines} suppliers={suppliers} orders={purchaseOrders} onOrderCreate={(o) => setPurchaseOrders(prev => [o, ...prev])} onOrderUpdate={(o) => setPurchaseOrders(prev => prev.map(old => old.id === o.id ? o : old))} onOrderDelete={(id) => setPurchaseOrders(prev => prev.filter(o => o.id !== id))} />;
      case 'INVOICES': return <InvoicesView isLocked={isOpnameMode} medicines={medicines} suppliers={suppliers} orders={purchaseOrders.filter(o => o.status === 'PENDING')} onInvoiceAdd={(inv) => {
          setInvoices(prev => [inv, ...prev]);
          setMedicines(prev => prev.map(m => {
             const invItems = inv.items.filter(ii => ii.medicineId === m.id);
             if (invItems.length === 0) return m;
             const newB = [...m.batches];
             invItems.forEach(item => {
                const multiplier = item.unitType === 'large' ? item.convMediumUsed * item.convSmallUsed : item.unitType === 'medium' ? item.convSmallUsed : 1;
                const qty = item.quantity * multiplier;
                const bIdx = newB.findIndex(b => b.batchNumber === item.batchNumber);
                if (bIdx > -1) newB[bIdx].stock += qty;
                else newB.push({ batchNumber: item.batchNumber, expiredDate: item.expiredDate, stock: qty });
             });
             const total = newB.reduce((acc, b) => acc + b.stock, 0);
             return { ...m, batches: newB, stock: total };
          }));
      }} />;
      case 'DEBTS': return <DebtsView invoices={invoices} suppliers={suppliers} onPayInvoice={(id, m, r) => setInvoices(prev => prev.map(i => i.id === id ? { ...i, status: 'PAID', paymentMethod: m, paymentRef: r } : i))} />;
      case 'REPORTS': return <ReportsView sales={sales} stockOpnames={stockOpnames} purchaseOrders={purchaseOrders} invoices={invoices} medicines={medicines} />;
      case 'MASTER': return <MasterDataView medicines={medicines} suppliers={suppliers} onAddMedicine={(m) => setMedicines(prev => [...prev, m])} onBulkAddMedicines={(newMeds) => setMedicines(prev => [...prev, ...newMeds])} onEditMedicine={(u) => setMedicines(prev => prev.map(m => m.id === u.id ? u : m))} onDeleteMedicine={(id) => setMedicines(prev => prev.filter(m => m.id !== id))} onAddSupplier={(s) => setSuppliers(prev => [...prev, s])} onEditSupplier={(u) => setSuppliers(prev => prev.map(s => s.id === u.id ? u : s))} onDeleteSupplier={(id) => setSuppliers(prev => prev.filter(s => s.id !== id))} onResetDatabase={() => { if (confirm('RESET DATABASE?')) { localStorage.clear(); window.location.reload(); } }} onDeduplicate={() => alert('Deduplicate done')} />;
      case 'USER_MASTER': return <UserMasterView users={users} onAddUser={(u) => setUsers(prev => [...prev, u])} onEditUser={(u) => setUsers(prev => prev.map(old => old.id === u.id ? u : old))} onDeleteUser={(id) => setUsers(prev => prev.filter(u => u.id !== id))} />;
      default: return <Dashboard medicines={medicines} sales={sales} invoices={invoices} />;
    }
  };

  if (!currentUser) {
    return <LoginPage users={users} onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 overflow-hidden">
      <aside className={`bg-white border-r border-slate-200 transition-all duration-300 ease-in-out flex flex-col z-30 shadow-sm ${isSidebarOpen ? 'w-72' : 'w-20'}`}>
        <div className="h-20 flex items-center px-6 border-b border-slate-100 flex-shrink-0">
          <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-teal-600/20">S</div>
          {isSidebarOpen && <span className="ml-3 font-extrabold text-slate-800 tracking-tight text-lg italic">SenyumSehat</span>}
        </div>
        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1.5 custom-scrollbar">
          {NAV_ITEMS.map((item) => (
            <button key={item.id} onClick={() => setActiveView(item.id as ViewType)} disabled={isOpnameMode && (item.id === 'SALES' || item.id === 'INVOICES')} className={`w-full flex items-center px-4 py-3.5 rounded-2xl transition-all duration-200 group relative ${activeView === item.id ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/30' : 'text-slate-500 hover:bg-slate-100'}`}>
              <div className={`${activeView === item.id ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`}>{item.icon}</div>
              {isSidebarOpen && <span className="ml-4 font-semibold text-sm">{item.label}</span>}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-100 space-y-2">
          <button onClick={handleLogout} className="w-full flex items-center px-4 py-3 rounded-xl text-rose-500 hover:bg-rose-50 transition-colors group">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            {isSidebarOpen && <span className="ml-4 font-bold text-sm">Logout</span>}
          </button>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="w-full flex items-center justify-center p-3 rounded-xl bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors">
            <svg className={`w-5 h-5 transition-transform duration-500 ${!isSidebarOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
          </button>
        </div>
      </aside>
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex flex-col">
            <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">{NAV_ITEMS.find(n => n.id === activeView)?.label}</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Management System v1.0</p>
          </div>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100">
               <div className={`w-2 h-2 rounded-full ${syncStatus === 'SYNCING' ? 'bg-amber-400 animate-pulse' : syncStatus === 'SUCCESS' ? 'bg-emerald-500' : syncStatus === 'ERROR' ? 'bg-rose-500' : 'bg-slate-300'}`}></div>
               <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                 {syncStatus === 'SYNCING' ? 'Syncing...' : syncStatus === 'SUCCESS' ? 'Cloud Saved' : syncStatus === 'ERROR' ? 'Offline' : 'Database'}
               </span>
            </div>
            <div className="h-10 w-[1px] bg-slate-200 hidden sm:block"></div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-xs font-bold text-slate-700 leading-none">{currentUser.fullName}</p>
                <p className="text-[10px] text-teal-500 font-black uppercase mt-1 italic">{currentUser.role}</p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shadow-sm">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.username}`} alt="User" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </header>
        <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-[1600px] mx-auto animate-fadeIn">{renderView()}</div>
        </div>
      </main>
    </div>
  );
};

export default App;
