
import React, { useState } from 'react';
import { User } from '../types';

interface UserMasterViewProps {
  users: User[];
  onAddUser: (u: User) => void;
  onEditUser: (u: User) => void;
  onDeleteUser: (id: string) => void;
}

const UserMasterView: React.FC<UserMasterViewProps> = ({ users, onAddUser, onEditUser, onDeleteUser }) => {
  const [viewMode, setViewMode] = useState<'LIST' | 'FORM'>('LIST');
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    const data: User = {
      id: editingUser?.id || `USR-${Date.now()}`,
      username: (formData.get('username') as string).toLowerCase(),
      password: (formData.get('password') as string),
      fullName: (formData.get('fullName') as string).toUpperCase(),
      role: (formData.get('role') as 'ADMIN' | 'KASIR'),
      position: (formData.get('position') as string).toUpperCase(),
    };

    if (editingUser) onEditUser(data); else onAddUser(data);
    backToList();
  };

  const backToList = () => {
    setViewMode('LIST');
    setEditingUser(null);
  };

  if (viewMode === 'FORM') {
    return (
      <div className="animate-fadeIn pb-20 max-w-2xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-4">
            <button onClick={backToList} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </button>
            <div>
              <h4 className="font-black uppercase tracking-widest text-[10px] text-teal-600 mb-0.5 italic">User Management</h4>
              <p className="text-xl font-black italic uppercase text-slate-800">
                {editingUser ? 'Update Akun User' : 'Registrasi User Baru'}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nama Lengkap</label>
              <input name="fullName" required placeholder="NAMA LENGKAP PENGGUNA..." defaultValue={editingUser?.fullName} className="w-full px-4 py-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-teal-500 outline-none font-black text-xs uppercase shadow-sm transition-all" />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest ml-1 italic">Jabatan / Posisi</label>
              <input name="position" required placeholder="CONTOH: KEPALA APOTEK, KASIR, APOTEKER..." defaultValue={editingUser?.position} className="w-full px-4 py-4 rounded-xl border border-indigo-100 bg-indigo-50/30 focus:bg-white focus:border-indigo-500 outline-none font-black text-xs uppercase shadow-sm transition-all" />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Username Login</label>
                  <input name="username" required placeholder="USERNAME..." defaultValue={editingUser?.username} className="w-full px-4 py-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-teal-500 outline-none font-black text-xs transition-all" />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tingkat Akses</label>
                  <select name="role" defaultValue={editingUser?.role || 'KASIR'} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 text-xs font-black outline-none focus:border-teal-500 shadow-sm appearance-none">
                     <option value="ADMIN">ADMINISTRATOR (FULL ACCESS)</option>
                     <option value="KASIR">KASIR / STAFF (LIMITED)</option>
                  </select>
               </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Kata Sandi (Password)</label>
              <input type="password" name="password" required placeholder="PASSWORD MIN 6 KARAKTER..." defaultValue={editingUser?.password} className="w-full px-4 py-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-teal-500 outline-none font-black text-xs transition-all" />
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button type="button" onClick={backToList} className="px-8 py-4 rounded-2xl font-black text-slate-400 hover:text-rose-500 transition-all uppercase text-[11px] tracking-widest">Batalkan</button>
            <button type="submit" className="bg-slate-900 text-white px-12 py-4 rounded-2xl font-black shadow-xl hover:bg-teal-600 transition-all active:scale-95 uppercase text-[11px] tracking-widest flex items-center space-x-3 border-b-4 border-slate-700 active:border-b-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
              <span>Simpan Pengguna</span>
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-12 max-w-5xl mx-auto px-4">
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-3 rounded-2xl border border-slate-200 shadow-sm gap-4">
        <h4 className="px-4 font-black text-slate-800 uppercase text-xs italic tracking-widest">Database Pengguna & Jabatan</h4>
        <button onClick={() => setViewMode('FORM')} className="w-full sm:w-auto bg-slate-900 text-white px-8 py-3 rounded-xl font-black flex items-center justify-center shadow-lg hover:bg-teal-600 transition-all text-[11px] uppercase tracking-widest border-b-4 border-slate-700 active:border-b-0">
          TAMBAH USER BARU
        </button>
      </div>

      <div className="bg-white rounded-[32px] shadow-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-900 text-white">
            <tr>
              <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest">Nama Lengkap</th>
              <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest">Jabatan</th>
              <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-center">Username</th>
              <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-center">Akses</th>
              <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-8 py-5">
                   <div className="font-black text-slate-800 text-xs uppercase">{u.fullName}</div>
                   <div className="text-[8px] text-slate-400 font-bold uppercase italic mt-0.5">ID: {u.id}</div>
                </td>
                <td className="px-8 py-5">
                   <div className="text-[10px] font-black text-indigo-600 uppercase tracking-tighter italic bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 w-fit">
                      {u.position || 'STAF'}
                   </div>
                </td>
                <td className="px-8 py-5 text-center font-bold text-slate-600 text-xs font-mono">{u.username}</td>
                <td className="px-8 py-5 text-center">
                   <span className={`text-[8px] font-black px-3 py-1 rounded-lg border uppercase tracking-widest ${u.role === 'ADMIN' ? 'bg-teal-50 text-teal-600 border-teal-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                      {u.role}
                   </span>
                </td>
                <td className="px-8 py-5">
                  <div className="flex justify-center space-x-2">
                    <button onClick={() => { setEditingUser(u); setViewMode('FORM'); }} className="p-2 text-slate-300 hover:text-teal-600 transition-colors bg-white border border-slate-100 rounded-lg shadow-sm hover:shadow-md"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                    <button onClick={() => { if(u.username === 'admin123') return alert('Admin utama tidak bisa dihapus demi keamanan sistem!'); if(window.confirm(`HAPUS PENGGUNA ${u.fullName}?`)) onDeleteUser(u.id); }} className="p-2 text-slate-300 hover:text-rose-600 transition-colors bg-white border border-slate-100 rounded-lg shadow-sm hover:shadow-md"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserMasterView;
