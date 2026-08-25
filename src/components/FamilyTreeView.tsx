import React, { useState, useRef, useMemo } from 'react';
import { Person, UserSession, GoogleDriveConfig } from '../types/family';
import { storageService } from '../services/storageService';
import { EditPersonModal } from './EditPersonModal';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  User,
  Heart,
  ShieldCheck,
  Clock,
  Sparkles,
  Maximize2,
  TreeDeciduous,
  Info,
  Edit3,
  Lock,
} from 'lucide-react';

interface FamilyTreeViewProps {
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

export const FamilyTreeView: React.FC<FamilyTreeViewProps> = ({
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
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedGenFilter, setSelectedGenFilter] = useState<number | 'ALL'>('ALL');
  const [selectedGenderFilter, setSelectedGenderFilter] = useState<'ALL' | 'male' | 'female'>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'ALL' | 'VERIFIED' | 'PENDING'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  const [focusedPersonId, setFocusedPersonId] = useState<string | null>(null);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Toggle Collapse
  const toggleCollapse = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Expand all / Collapse all
  const expandAll = () => setCollapsedNodes(new Set());
  const collapseAll = () => {
    const allParentIds = allPersons.filter((p) => p.childrenIds && p.childrenIds.length > 0).map((p) => p.id);
    setCollapsedNodes(new Set(allParentIds));
  };

  // Build tree from root ancestors (Mamat & Hafsah)
  const rootMamat = allPersons.find((p) => p.id === 'WMH-000001') || allPersons[0];
  const personMap = useMemo(() => new Map(allPersons.map((p) => [p.id, p])), [allPersons]);

  // Filter Check
  const matchesFilter = (person: Person) => {
    if (selectedGenFilter !== 'ALL' && person.generation !== selectedGenFilter) return false;
    if (selectedGenderFilter !== 'ALL' && person.gender !== selectedGenderFilter) return false;
    if (selectedStatusFilter === 'VERIFIED' && !person.isVerified) return false;
    if (selectedStatusFilter === 'PENDING' && person.isVerified) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = person.fullName.toLowerCase().includes(q);
      const matchNick = person.nickname?.toLowerCase().includes(q);
      const matchId = person.id.toLowerCase().includes(q);
      return Boolean(matchName || matchNick || matchId);
    }
    return true;
  };

  // Recursive Tree Node Renderer for clean hierarchical layout
  const renderPersonNode = (person: Person, depth = 0) => {
    const isCollapsed = collapsedNodes.has(person.id);
    const rawChildren = (person.childrenIds || [])
      .map((cid) => personMap.get(cid))
      .filter(Boolean) as Person[];
    const children = [...rawChildren].sort((a, b) => {
      const orderA = a.birthOrder ?? 999;
      const orderB = b.birthOrder ?? 999;
      if (orderA !== orderB) return orderA - orderB;
      return (a.birthYear ?? 9999) - (b.birthYear ?? 9999);
    });
    const spouses = (person.spouseIds || [])
      .map((sid) => personMap.get(sid))
      .filter(Boolean) as Person[];

    const isMatch = matchesFilter(person);
    const isFocused = focusedPersonId === person.id;
    const isCurrentUser = currentPerson?.id === person.id;
    const editPerm = storageService.canEditPerson(person, currentPerson, Boolean(isAdmin));

    return (
      <div key={person.id} className="flex flex-col items-center my-2 transition-all">
        {/* Person Node & Spouses Container */}
        <div className="flex items-center space-x-2 relative group">
          {/* Main Person Box */}
          <div
            id={`tree-node-${person.id}`}
            onClick={() => {
              setFocusedPersonId(person.id);
              onOpenPersonDetail(person);
            }}
            className={`cursor-pointer rounded-2xl p-3 border transition-all shadow-md relative min-w-[210px] max-w-[250px] ${
              isCurrentUser
                ? 'bg-emerald-950 border-emerald-400 ring-2 ring-emerald-400/80 shadow-emerald-900/50'
                : isFocused
                ? 'bg-amber-950 border-amber-400 ring-2 ring-amber-400/80'
                : !isMatch && searchQuery.trim()
                ? 'opacity-40 bg-slate-900/60 border-slate-800'
                : person.gender === 'male'
                ? 'bg-slate-900 border-blue-600/40 hover:border-blue-500 hover:bg-slate-850'
                : 'bg-slate-900 border-rose-600/40 hover:border-rose-500 hover:bg-slate-850'
            }`}
          >
            {/* Header info / Gen / Badge / Quick Edit */}
            <div className="flex items-center justify-between text-[10px] mb-1">
              <span className="font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                Gen {person.generation}
              </span>
              <div className="flex items-center space-x-1">
                {isCurrentUser && (
                  <span className="px-1.5 py-0.5 rounded bg-emerald-700 text-white font-bold text-[9px]">
                    SAYA
                  </span>
                )}
                {person.isVerified ? (
                  <span title="Disahkan (Verified)">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  </span>
                ) : (
                  <span title="Menunggu Pengesahan">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                  </span>
                )}

                {/* Quick Edit Button on Node */}
                <button
                  type="button"
                  id={`tree-quick-edit-${person.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingPerson(person);
                  }}
                  className={`p-1 rounded-md text-[10px] font-bold flex items-center justify-center transition-all cursor-pointer ${
                    editPerm.canEdit
                      ? 'bg-emerald-600/80 hover:bg-emerald-500 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                  }`}
                  title={editPerm.canEdit ? `Edit Profil (${editPerm.relationLabel})` : 'Akses Edit Terhad (Admin / Pasangan / Anak)'}
                >
                  <Edit3 className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Name & Details */}
            <div className="flex items-start space-x-2.5">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-inner ${
                  person.gender === 'male'
                    ? 'bg-blue-900 text-blue-200 border border-blue-700/60'
                    : 'bg-rose-900 text-rose-200 border border-rose-700/60'
                }`}
              >
                {person.fullName.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-xs text-white truncate leading-tight">
                  {person.fullName}
                </h4>
                {person.nickname && (
                  <p className="text-[11px] text-slate-400 truncate">
                    ({person.nickname})
                  </p>
                )}
                <p className="text-[10px] text-emerald-400/90 font-mono mt-0.5">
                  {person.id} • {person.birthYear || 'T/D'}{person.isDeceased ? ' †' : ''}
                </p>
              </div>
            </div>

            {/* Collapse toggle badge if has children */}
            {children.length > 0 && (
              <button
                onClick={(e) => toggleCollapse(person.id, e)}
                className="mt-2 w-full py-0.5 px-2 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[10px] text-slate-300 font-medium flex items-center justify-center space-x-1 transition-colors cursor-pointer"
              >
                {isCollapsed ? (
                  <>
                    <ChevronRight className="w-3 h-3 text-emerald-400" />
                    <span>Buka {children.length} Keturunan</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                    <span>Tutup Cabang ({children.length})</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Spouse Node(s) - Connected with Wedding Ring / Heart Badge */}
          {spouses.map((spouse) => {
            const spouseEditPerm = storageService.canEditPerson(spouse, currentPerson, Boolean(isAdmin));
            return (
              <div key={spouse.id} className="flex items-center space-x-1.5">
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-rose-400 font-bold px-1 py-0.5 rounded-full bg-rose-950/80 border border-rose-800 flex items-center space-x-1">
                    <Heart className="w-2.5 h-2.5 fill-rose-500 text-rose-500" />
                    <span className="text-[9px]">Pasangan</span>
                  </span>
                  <div className="w-4 h-[1.5px] bg-rose-500/50 my-0.5" />
                </div>

                <div
                  id={`tree-spouse-${spouse.id}`}
                  onClick={() => {
                    setFocusedPersonId(spouse.id);
                    onOpenPersonDetail(spouse);
                  }}
                  className="cursor-pointer rounded-2xl p-2.5 border border-purple-500/40 bg-slate-900/90 hover:bg-slate-850 transition-all shadow-md min-w-[160px] max-w-[190px]"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] text-purple-300 font-bold">Pasangan</span>
                    <button
                      type="button"
                      id={`tree-quick-edit-spouse-${spouse.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingPerson(spouse);
                      }}
                      className={`p-1 rounded-md text-[9px] font-bold flex items-center justify-center transition-all cursor-pointer ${
                        spouseEditPerm.canEdit
                          ? 'bg-purple-700/80 hover:bg-purple-600 text-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                      }`}
                      title={spouseEditPerm.canEdit ? `Edit Profil (${spouseEditPerm.relationLabel})` : 'Akses Edit Terhad'}
                    >
                      <Edit3 className="w-2.5 h-2.5" />
                    </button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[10px] shrink-0 ${
                        spouse.gender === 'female' ? 'bg-rose-900 text-rose-200' : 'bg-blue-900 text-blue-200'
                      }`}
                    >
                      {spouse.fullName.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h5 className="font-bold text-[11px] text-white truncate leading-tight">
                        {spouse.fullName}
                      </h5>
                      <p className="text-[9px] text-purple-300 font-mono">
                        {spouse.id}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Children Sub-tree (Biological Descendants) */}
        {!isCollapsed && children.length > 0 && (
          <div className="relative pt-6 flex flex-col items-center">
            {/* Top Connector Vertical Line */}
            <div className="absolute top-0 w-0.5 h-6 bg-emerald-600/60" />

            {/* Horizontal Branch Bar */}
            {children.length > 1 && (
              <div className="w-full h-0.5 bg-emerald-600/60 mb-2" />
            )}

            {/* Children grid */}
            <div className="flex flex-wrap items-start justify-center gap-4 sm:gap-6">
              {children.map((child) => renderPersonNode(child, depth + 1))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Controls Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            id="tree-search-input"
            type="text"
            placeholder="Cari waris dalam pokok salasilah..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-emerald-500"
          />
        </div>

        {/* View Tools / Zoom / Expand */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center bg-slate-800 rounded-xl p-1 border border-slate-700">
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.4, z - 0.1))}
              className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Zoom Keluar"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-2 text-[11px] font-mono font-bold text-slate-300">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(1.8, z + 0.1))}
              className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Zoom Masuk"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer ml-1"
              title="Set Semula Zoom"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={expandAll}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold cursor-pointer"
          >
            Buka Semua
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold cursor-pointer"
          >
            Tutup Semua
          </button>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-slate-400 flex items-center space-x-1 text-[11px]">
          <Filter className="w-3 h-3" />
          <span>Tapis Generasi:</span>
        </span>
        <button
          onClick={() => setSelectedGenFilter('ALL')}
          className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
            selectedGenFilter === 'ALL'
              ? 'bg-emerald-500 text-slate-950 font-bold'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          Semua
        </button>
        {[1, 2, 3, 4, 5].map((g) => (
          <button
            key={g}
            onClick={() => setSelectedGenFilter(g)}
            className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
              selectedGenFilter === g
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Gen {g}
          </button>
        ))}
      </div>

      {/* Interactive Family Tree Canvas */}
      <div
        ref={containerRef}
        className="bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-10 min-h-[600px] overflow-auto shadow-2xl relative select-none"
      >
        <div
          className="transition-transform origin-top flex flex-col items-center justify-start min-w-[900px]"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          {rootMamat && renderPersonNode(rootMamat, 0)}
        </div>
      </div>

      {/* Legend / Info Helper */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2 text-slate-300 font-semibold">
          <Info className="w-4 h-4 text-emerald-400" />
          <span>Panduan Petunjuk:</span>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[11px]">
          <span className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded bg-blue-900 border border-blue-500 inline-block" />
            <span>Lelaki</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded bg-rose-900 border border-rose-500 inline-block" />
            <span>Perempuan</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded bg-purple-900 border border-purple-500 inline-block" />
            <span>Pasangan / Menantu</span>
          </span>
          <span className="flex items-center space-x-1.5 text-emerald-400">
            <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Ikon Edit (Admin: Semua, Pengguna: Diri/Pasangan/Anak)</span>
          </span>
        </div>
      </div>

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
