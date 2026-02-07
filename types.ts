
export interface MedicineBatch {
  batchNumber: string;
  expiredDate: string;
  stock: number; // stok dalam unit terkecil untuk batch ini
}

export interface Medicine {
  id: string;
  name: string;
  brand: string;    // Merk Obat
  category: string; // Mewakili 'Kategori' (e.g., APT, ALK)
  golongan: string; // Mewakili 'Golongan' (e.g., OB, OBT, OK)
  bentuk: string;   // Mewakili 'Bentuk' (e.g., tab, cap, btl)
  unitLarge: string;
  unitMedium: string;
  unitSmall: string;
  convMedium: number;
  convSmall: number;
  
  stock: number;          // Total stok (sum of all batches)
  costPrice: number;      // HNA / HPP Bruto
  pbfDiscountPercent: number; 
  marginPercent: number;      
  price: number;          // Harga Jual
  expiredDate: string;    // ED terdekat dari semua batch
  pbfName?: string;
  batches: MedicineBatch[]; // Daftar batch aktif
}

export interface Supplier {
  id: string;
  name: string;
  address: string;
  phone: string;
  pic: string;
  bankName?: string;
  accountNumber?: string;
}

export interface User {
  id: string;
  username: string;
  password?: string;
  fullName: string;
  role: 'ADMIN' | 'KASIR';
  position?: string; // Jabatan manual
}

export interface SaleItem {
  medicineId: string;
  name: string;
  quantity: number;
  unitUsed: string;
  costPrice: number;
  price: number;
  total: number;
}

export interface Sale {
  id: string;
  date: string;
  items: SaleItem[];
  totalAmount: number; 
  subtotal: number;    
  discount: number;    
  customerName: string;
  customerAge?: number;
  customerGender?: 'Pria' | 'Wanita';
  paymentMethod: 'Tunai' | 'Transfer' | 'EDC' | 'QRIS';
}

export interface PurchaseOrder {
  id: string;
  date: string;
  expiryDate: string;
  pbfName: string;
  items: { medicineId: string; name: string; quantity: number; unitUsed: string }[];
  status: 'PENDING' | 'RECEIVED' | 'CANCELLED' | 'EXPIRED';
  cancelReason?: string;
}

export interface InvoiceItem {
  medicineId: string;
  quantity: number;
  unitType: 'large' | 'medium' | 'small';
  costPrice: number; 
  discountPercent: number;
  ppnPercent: number;
  subtotal: number;
  batchNumber: string;
  expiredDate: string;
  convMediumUsed: number;
  convSmallUsed: number;
}

export interface Invoice {
  id: string;
  orderId: string; 
  number: string;
  date: string;
  pbfName: string;
  items: InvoiceItem[];
  totalAmount: number;
  dueDate: string;
  status: 'UNPAID' | 'PAID';
  paymentMethod?: 'Tunai' | 'Transfer';
  paymentRef?: string;
  paymentDate?: string;
}

export interface OpnameEntry {
  medicineId: string;
  name: string;
  batchNumber: string; // Opname sekarang per batch
  systemStock: number;
  physicalStock: number;
  difference: number;
  note: string;
}

export interface StockOpname {
  id: string;
  date: string;
  entries: OpnameEntry[];
  totalLossValue: number;
}

export type ViewType = 'DASHBOARD' | 'SALES' | 'STOCK' | 'ORDERS' | 'INVOICES' | 'DEBTS' | 'MASTER' | 'REPORTS' | 'OPNAME' | 'USER_MASTER';
