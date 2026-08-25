import React, { useState } from 'react';
import { Person, UserSession, GoogleDriveConfig } from '../types/family';
import { storageService } from '../services/storageService';
import { EditPersonModal } from './EditPersonModal';
import {
  Users,
  Search,
  Filter,
  ShieldCheck,
  Clock,
  MapPin,
  Calendar,
  Briefcase,
  GraduationCap,
  Heart,
  ChevronRight,
  Eye,
  TreeDeciduous,
  Edit3,
  Lock,
} from 'lucide-react';

interface WarisListViewProps {
  allPersons: Person[];
  currentPerson: Person | null;
  onOpenPersonDetail: (person: Person) => void;
  onSelectRelationshipPersons?: (personAId: string, personBId: string) => void;
  isAdmin?: boolean;
  userSession?: UserSession;
  onUpdatePersons?: (persons: Person[]) => void;
  driveConfig?: GoogleDriveConfig;
  onUpdateDriveConfig?: (config: GoogleDriveConfig) => void;
}

export const WarisListView: React.FC<WarisListViewProps> = ({
  allPersons,
  currentPerson,
  onOpenPersonDetail,
  onSelectRelationshipPersons,
  isAdmin = false,
  userSession = storageService.getUserSession(),
  onUpdatePersons,
  driveConfig,
  onUpdateDriveConfig,
}) => {
  const [activeGenTab, setActiveGenTab] = useState<number | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState<'ALL' | 'male' | 'female'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VERIFIED' | 'PENDING'>('ALL');
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);

  const filteredPersons = allPersons.filter((person) => {
    if (activeGenTab !== 'ALL' && person.generation !== activeGenTab) return false;
    if (genderFilter !== 'ALL' && person.gender !== genderFilter) return false;
    if (statusFilter === 'VERIFIED' && !person.isVerified) return false;
    if (statusFilter === 'PENDING' && person.isVerified) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = person.fullName.toLowerCase().includes(q);
      const matchNick = person.nickname?.toLowerCase().includes(q);
      const matchId = person.id.toLowerCase().includes(q);
      const matchCity = (person.address || person.city || '').toLowerCase().includes(q);
      const matchJob = person.occupation?.toLowerCase().includes(q);
      return Boolean(matchName || matchNick || matchId || matchCity || matchJob);
    }
    return true;
  });

  const getGenerationTitle = (gen: number) => {
    switch (gen) {
      case 1:
        return 'Generasi 1: Pengasas Asal (Mamat & Hafsah)';
      case 2:
        return 'Generasi 2: Anak-anak Kandung';
      case 3:
        return 'Generasi 3: Cucu-cucu';
      case 4:
        return 'Generasi 4: Cicit-cicit';
      case 5:
        return 'Generasi 5: Piut-piut';
      default:
        return `Generasi ${gen}`;
    }
  };

  const generations = [1, 2, 3, 4, 5];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-1">
              <Users className="w-4 h-4" />
              <span>Direktori Lengkap Keturunan</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Senarai Seluruh Waris & Salasilah
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-xl">
              Carian berpusat bagi semua {allPersons.length} ahli keluarga yang berdaftar mengikut generasi, status, dan pertalian.
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs bg-slate-800/80 p-3 rounded-2xl border border-slate-700">
            <div className="text-center px-2">
              <span className="block font-bold text-white text-base">{allPersons.length}</span>
              <span className="text-[10px] text-slate-400">Jumlah Waris</span>
            </div>
            <div className="h-6 w-px bg-slate-700" />
            <div className="text-center px-2">
              <span className="block font-bold text-emerald-400 text-base">
                {allPersons.filter((p) => p.isVerified).length}
              </span>
              <span className="text-[10px] text-slate-400">Disahkan</span>
            </div>
            <div className="h-6 w-px bg-slate-700" />
            <div className="text-center px-2">
              <span className="block font-bold text-blue-400 text-base">
                {allPersons.filter((p) => p.isDeceased).length}
              </span>
              <span className="text-[10px] text-slate-400">Almarhum</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 space-y-4 shadow-lg">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <input
              id="waris-search-input"
              type="text"
              placeholder="Cari nama, id, pekerjaan, alamat..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-emerald-500"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              id="waris-gender-filter"
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value as any)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-hidden focus:border-emerald-500"
            >
              <option value="ALL">Semua Jantina</option>
              <option value="male">Lelaki Sahaja</option>
              <option value="female">Perempuan Sahaja</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              id="waris-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-hidden focus:border-emerald-500"
            >
              <option value="ALL">Semua Status</option>
              <option value="VERIFIED">Disahkan Sahaja</option>
              <option value="PENDING">Menunggu Pengesahan</option>
            </select>
          </div>
        </div>

        {/* Generation Tabs */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none text-xs">
          <button
            onClick={() => setActiveGenTab('ALL')}
            className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeGenTab === 'ALL'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Semua Generasi ({allPersons.length})
          </button>
          {generations.map((gen) => {
            const count = allPersons.filter((p) => p.generation === gen).length;
            return (
              <button
                key={gen}
                onClick={() => setActiveGenTab(gen)}
                className={`px-4 py-2 rounded-xl font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  activeGenTab === gen
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Gen {gen} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Waris Cards Grid */}
      {filteredPersons.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400 space-y-3">
          <TreeDeciduous className="w-12 h-12 text-slate-600 mx-auto" />
          <p className="font-semibold text-white">Tiada waris ditemui.</p>
          <p className="text-xs">Sila cuba kata kunci carian lain atau setkan semula penapis.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPersons.map((person) => {
            const isMe = currentPerson?.id === person.id;
            const bapa = allPersons.find((p) => p.id === person.fatherId);
            const ibu = allPersons.find((p) => p.id === person.motherId);
            const spouses = (person.spouseIds || [])
              .map((id) => allPersons.find((p) => p.id === id))
              .filter(Boolean) as Person[];
            const children = (person.childrenIds || [])
              .map((id) => allPersons.find((p) => p.id === id))
              .filter(Boolean) as Person[];

            const editPerm = storageService.canEditPerson(person, currentPerson, Boolean(isAdmin));

            return (
              <div
                key={person.id}
                id={`waris-card-${person.id}`}
                onClick={() => onOpenPersonDetail(person)}
                className={`rounded-2xl p-5 border transition-all cursor-pointer shadow-md relative group flex flex-col justify-between ${
                  isMe
                    ? 'bg-emerald-950/80 border-emerald-500 ring-1 ring-emerald-500'
                    : 'bg-slate-900/90 border-slate-800 hover:border-emerald-600/70 hover:bg-slate-850'
                }`}
              >
                <div>
                  {/* Top Bar / Badges */}
                  <div className="flex items-center justify-between text-xs mb-3">
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-bold text-[10px] border border-slate-700">
                      Gen {person.generation}
                    </span>

                    <div className="flex items-center space-x-1.5">
                      {isMe && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-bold text-[10px]">
                          PROFIL SAYA
                        </span>
                      )}
                      {person.isVerified ? (
                        <span className="flex items-center space-x-1 text-[10px] text-emerald-400 font-medium px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-800/60">
                          <ShieldCheck className="w-3 h-3" />
                          <span>Disahkan</span>
                        </span>
                      ) : (
                        <span className="flex items-center space-x-1 text-[10px] text-amber-400 font-medium px-2 py-0.5 rounded-md bg-amber-950/80 border border-amber-800/60">
                          <Clock className="w-3 h-3" />
                          <span>Menunggu</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Identity Avatar & Name */}
                  <div className="flex items-start space-x-3.5 mb-3">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-base shadow-inner shrink-0 ${
                        person.gender === 'male'
                          ? 'bg-blue-900 text-blue-200 border border-blue-700/60'
                          : 'bg-rose-900 text-rose-200 border border-rose-700/60'
                      }`}
                    >
                      {person.fullName.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-sm sm:text-base text-white group-hover:text-emerald-300 transition-colors leading-tight">
                        {person.fullName}
                      </h3>
                      {person.nickname && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          "{person.nickname}"
                        </p>
                      )}
                      <p className="text-[11px] text-emerald-400/90 font-mono mt-1">
                        ID: {person.id}
                      </p>
                    </div>
                  </div>

                  {/* Parents & Spouses Details */}
                  <div className="space-y-1 text-xs text-slate-300 py-2 border-t border-slate-800">
                    {(bapa || ibu) && (
                      <div className="flex items-center text-[11px] text-slate-400 truncate">
                        <span className="w-16 shrink-0 text-slate-500">Ibu Bapa:</span>
                        <span className="text-slate-300 truncate">
                          {[bapa?.nickname || bapa?.fullName, ibu?.nickname || ibu?.fullName].filter(Boolean).join(' & ')}
                        </span>
                      </div>
                    )}
                    {spouses.length > 0 && (
                      <div className="flex items-center text-[11px] text-slate-400 truncate">
                        <span className="w-16 shrink-0 text-slate-500">Pasangan:</span>
                        <span className="text-purple-300 truncate">
                          {spouses.map((s) => s.nickname || s.fullName).join(', ')}
                        </span>
                      </div>
                    )}
                    {children.length > 0 && (
                      <div className="flex items-center text-[11px] text-slate-400 truncate">
                        <span className="w-16 shrink-0 text-slate-500">Anak ({children.length}):</span>
                        <span className="text-slate-300 truncate">
                          {children.map((c) => c.nickname || c.fullName).slice(0, 3).join(', ')}
                          {children.length > 3 ? ` +${children.length - 3} lagi` : ''}
                        </span>
                      </div>
                    )}
                    {person.occupation && (
                      <div className="flex items-center text-[11px] text-slate-400 truncate">
                        <span className="w-16 shrink-0 text-slate-500">Kerjaya:</span>
                        <span className="text-slate-300 truncate">{person.occupation}</span>
                      </div>
                    )}
                    {(person.address || person.city) && (
                      <div className="flex items-center text-[11px] text-slate-400 truncate">
                        <span className="w-16 shrink-0 text-slate-500">Alamat:</span>
                        <span className="text-slate-300 truncate">{person.address || person.city}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Action: Edit Button on Every Profile + View Details */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    id={`waris-card-edit-btn-${person.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingPerson(person);
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition-all shadow-sm cursor-pointer ${
                      editPerm.canEdit
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                    }`}
                    title={editPerm.canEdit ? `Edit Profil (${editPerm.relationLabel})` : 'Akses Edit Terhad (Admin / Keluarga Terdekat)'}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                    {!editPerm.canEdit && <Lock className="w-3 h-3 text-amber-400 ml-0.5" />}
                  </button>

                  <div className="flex items-center space-x-1 text-emerald-400 font-medium group-hover:underline">
                    <Eye className="w-3.5 h-3.5" />
                    <span>Lihat Profil</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Person Modal */}
      {editingPerson && (
        <EditPersonModal
          person={editingPerson}
          isOpen={Boolean(editingPerson)}
          onClose={() => setEditingPerson(null)}
          allPersons={allPersons}
          currentPerson={currentPerson}
          isAdmin={Boolean(isAdmin)}
          userSession={userSession}
          onUpdatePersons={(updated) => {
            if (onUpdatePersons) {
              onUpdatePersons(updated);
            }
          }}
          onSavedPerson={(updated) => {
            setEditingPerson(null);
          }}
          driveConfig={driveConfig}
          onUpdateDriveConfig={onUpdateDriveConfig}
        />
      )}
    </div>
  );
};
