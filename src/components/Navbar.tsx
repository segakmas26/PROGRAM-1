import React, { useState } from 'react';
import { Person, UserSession, RootFamilyConfig } from '../types/family';
import {
  TreeDeciduous,
  Shield,
  User,
  Search,
  Bot,
  Printer,
  Users,
  Lock,
  Unlock,
  KeyRound,
  HeartHandshake,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userSession: UserSession;
  setUserSession: (session: UserSession) => void;
  rootConfig: RootFamilyConfig;
  allPersons: Person[];
  currentPerson: Person | null;
  onOpenPersonDetail: (person: Person) => void;
  pendingCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  userSession,
  setUserSession,
  rootConfig,
  allPersons,
  currentPerson,
  onOpenPersonDetail,
  pendingCount,
}) => {
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [adminError, setAdminError] = useState('');
  const [showIdentityModal, setShowIdentityModal] = useState(false);
  const [searchIdentity, setSearchIdentity] = useState('');

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPin === '1234' || adminPin === 'admin') {
      const updated: UserSession = {
        ...userSession,
        role: 'ADMIN',
        isAdminUnlocked: true,
      };
      setUserSession(updated);
      setShowAdminModal(false);
      setAdminPin('');
      setAdminError('');
    } else {
      setAdminError('PIN Admin tidak tepat. (Petunjuk demo: 1234)');
    }
  };

  const handleAdminLogout = () => {
    const updated: UserSession = {
      ...userSession,
      role: 'FAMILY_MEMBER',
      isAdminUnlocked: false,
    };
    setUserSession(updated);
    if (activeTab === 'admin') {
      setActiveTab('home');
    }
  };

  const handleSelectIdentity = (person: Person) => {
    const updated: UserSession = {
      ...userSession,
      currentPersonId: person.id,
      userName: person.fullName,
    };
    setUserSession(updated);
    setShowIdentityModal(false);
  };

  const filteredPersons = allPersons.filter(
    (p) =>
      p.fullName.toLowerCase().includes(searchIdentity.toLowerCase()) ||
      (p.nickname && p.nickname.toLowerCase().includes(searchIdentity.toLowerCase())) ||
      p.id.toLowerCase().includes(searchIdentity.toLowerCase())
  );

  return (
    <header className="bg-emerald-900 text-white shadow-md sticky top-0 z-40 border-b border-emerald-800">
      {/* Top Banner / Identity Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Family Title */}
          <div
            id="brand-logo-btn"
            onClick={() => setActiveTab('home')}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-700/80 border border-emerald-500/50 flex items-center justify-center text-emerald-200 shadow-inner group-hover:scale-105 transition-transform">
              <TreeDeciduous className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-base sm:text-lg tracking-tight text-white">
                  WARIS MAMAT & HAFSAH
                </span>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-800 text-emerald-300 border border-emerald-700">
                  5 Generasi
                </span>
              </div>
              <p className="text-[11px] text-emerald-200/80 hidden sm:block truncate max-w-md">
                {rootConfig.tagline}
              </p>
            </div>
          </div>

          {/* User Quick Identity Pill & Admin Button */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Identity Switcher */}
            <button
              id="switch-identity-btn"
              onClick={() => setShowIdentityModal(true)}
              className="flex items-center space-x-2 px-2.5 py-1.5 rounded-lg bg-emerald-800/80 hover:bg-emerald-700 border border-emerald-600/60 text-xs text-emerald-100 transition-colors shadow-sm"
              title="Tukar Identiti Saya"
            >
              <div className="w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center text-[10px] font-bold text-white">
                {currentPerson ? currentPerson.fullName.charAt(0) : 'U'}
              </div>
              <div className="text-left hidden sm:block">
                <span className="text-[10px] text-emerald-300 block leading-tight">Saya:</span>
                <span className="font-medium truncate max-w-[120px] block leading-tight">
                  {currentPerson ? currentPerson.nickname || currentPerson.fullName.split(' ')[0] : 'Pilih Profil'}
                </span>
              </div>
              <span className="sm:hidden font-medium text-[11px]">
                {currentPerson ? currentPerson.nickname || currentPerson.fullName.split(' ')[0] : 'Profil'}
              </span>
            </button>

            {/* Admin Unlock / Status */}
            {userSession.isAdminUnlocked ? (
              <div className="flex items-center space-x-1">
                <button
                  id="nav-admin-panel-btn"
                  onClick={() => setActiveTab('admin')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'admin'
                      ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Admin</span>
                  {pendingCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] flex items-center justify-center ml-1">
                      {pendingCount}
                    </span>
                  )}
                </button>
                <button
                  id="admin-logout-btn"
                  onClick={handleAdminLogout}
                  className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800"
                  title="Kunci Akses Admin"
                >
                  <Unlock className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                id="open-admin-login-btn"
                onClick={() => setShowAdminModal(true)}
                className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-950 border border-emerald-700/60 text-xs text-emerald-300 transition-colors"
                title="Log Masuk Admin (PIN: 1234)"
              >
                <Lock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Admin</span>
              </button>
            )}
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        <nav className="hidden md:flex space-x-1 py-1 border-t border-emerald-850 overflow-x-auto text-xs font-medium">
          <button
            id="tab-home-btn"
            onClick={() => setActiveTab('home')}
            className={`px-3 py-2 rounded-md transition-colors flex items-center space-x-1.5 ${
              activeTab === 'home'
                ? 'bg-emerald-800 text-white font-semibold shadow-inner'
                : 'text-emerald-200 hover:bg-emerald-800/50 hover:text-white'
            }`}
          >
            <span>🏠 Utama</span>
          </button>
          <button
            id="tab-tree-btn"
            onClick={() => setActiveTab('tree')}
            className={`px-3 py-2 rounded-md transition-colors flex items-center space-x-1.5 ${
              activeTab === 'tree'
                ? 'bg-emerald-800 text-white font-semibold shadow-inner'
                : 'text-emerald-200 hover:bg-emerald-800/50 hover:text-white'
            }`}
          >
            <span>🌳 Susur Galur</span>
          </button>
          <button
            id="tab-waris-btn"
            onClick={() => setActiveTab('waris')}
            className={`px-3 py-2 rounded-md transition-colors flex items-center space-x-1.5 ${
              activeTab === 'waris'
                ? 'bg-emerald-800 text-white font-semibold shadow-inner'
                : 'text-emerald-200 hover:bg-emerald-800/50 hover:text-white'
            }`}
          >
            <span>👨‍👩‍👧 Waris ({allPersons.length})</span>
          </button>
          <button
            id="tab-search-btn"
            onClick={() => setActiveTab('search')}
            className={`px-3 py-2 rounded-md transition-colors flex items-center space-x-1.5 ${
              activeTab === 'search'
                ? 'bg-emerald-800 text-white font-semibold shadow-inner'
                : 'text-emerald-200 hover:bg-emerald-800/50 hover:text-white'
            }`}
          >
            <span>🔍 Hubungan & Cari</span>
          </button>
          <button
            id="tab-ai-btn"
            onClick={() => setActiveTab('ai')}
            className={`px-3 py-2 rounded-md transition-colors flex items-center space-x-1.5 ${
              activeTab === 'ai'
                ? 'bg-emerald-800 text-white font-semibold shadow-inner'
                : 'text-emerald-200 hover:bg-emerald-800/50 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300 inline" />
            <span>AI Waris</span>
          </button>
          <button
            id="tab-print-btn"
            onClick={() => setActiveTab('print')}
            className={`px-3 py-2 rounded-md transition-colors flex items-center space-x-1.5 ${
              activeTab === 'print'
                ? 'bg-emerald-800 text-white font-semibold shadow-inner'
                : 'text-emerald-200 hover:bg-emerald-800/50 hover:text-white'
            }`}
          >
            <span>🖨️ Cetak / PDF</span>
          </button>
          <button
            id="tab-profile-btn"
            onClick={() => setActiveTab('profile')}
            className={`px-3 py-2 rounded-md transition-colors flex items-center space-x-1.5 ${
              activeTab === 'profile'
                ? 'bg-emerald-800 text-white font-semibold shadow-inner'
                : 'text-emerald-200 hover:bg-emerald-800/50 hover:text-white'
            }`}
          >
            <span>👤 Profil & Tambah</span>
          </button>
        </nav>
      </div>

      {/* Admin Login Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 text-slate-100 rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-fade-in">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Log Masuk Pentadbir</h3>
                <p className="text-xs text-slate-400">Akses kawalan penuh & tetapan sistem</p>
              </div>
            </div>

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Masukkan PIN / Kata Laluan Admin:
                </label>
                <input
                  id="admin-pin-input"
                  type="password"
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                  placeholder="Contoh: 1234"
                  autoFocus
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-600 text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm"
                />
                {adminError && <p className="text-xs text-rose-400 mt-1.5">{adminError}</p>}
                <p className="text-[11px] text-slate-400 mt-1">
                  🔑 <em>Petunjuk demo untuk penilaian: Masukkan PIN <b>1234</b></em>
                </p>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAdminModal(false);
                    setAdminError('');
                  }}
                  className="px-3.5 py-2 text-xs text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  id="admin-submit-btn"
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow-sm transition-colors"
                >
                  Buka Kunci Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Identity Selector Modal ("Masuk → Cari → Lihat → Faham") */}
      {showIdentityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 text-slate-100 rounded-2xl max-w-md w-full p-5 shadow-2xl max-h-[85vh] flex flex-col animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <User className="w-5 h-5 text-emerald-400" />
                  <span>Pilih Diri Anda (Identiti Saya)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Prinsip: "MASUK → CARI → LIHAT → FAHAM". Pilih nama anda untuk analisis hubungan & mahram serta-merta.
                </p>
              </div>
              <button
                onClick={() => setShowIdentityModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold px-2"
              >
                ✕
              </button>
            </div>

            <div className="mt-3 mb-2">
              <input
                id="search-identity-input"
                type="text"
                placeholder="Cari nama anda (cth: Ahmad, Siti, Luqman)..."
                value={searchIdentity}
                onChange={(e) => setSearchIdentity(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div className="overflow-y-auto space-y-1.5 flex-1 pr-1 py-1">
              {filteredPersons.map((person) => {
                const isSelected = currentPerson?.id === person.id;
                return (
                  <button
                    key={person.id}
                    id={`select-identity-${person.id}`}
                    onClick={() => handleSelectIdentity(person)}
                    className={`w-full text-left p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200 ring-1 ring-emerald-500'
                        : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                          person.gender === 'male' ? 'bg-blue-900 text-blue-200' : 'bg-rose-900 text-rose-200'
                        }`}
                      >
                        {person.fullName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-xs text-white flex items-center space-x-1.5">
                          <span>{person.fullName}</span>
                          {person.nickname && (
                            <span className="text-[11px] text-slate-400">({person.nickname})</span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center space-x-2">
                          <span>Gen {person.generation}</span>
                          <span>•</span>
                          <span>{person.id}</span>
                          {person.city && <span>• {person.city}</span>}
                        </div>
                      </div>
                    </div>
                    {isSelected ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <span className="text-[10px] text-emerald-400 font-medium px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/60">
                        Pilih
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
              <span>{allPersons.length} profil waris tersedia</span>
              <button
                onClick={() => setShowIdentityModal(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
