import React, { useState, useMemo } from 'react';
import { Person, MahramAnalysis } from '../types/family';
import { analyzeMahram, ISLAMIC_DISCLAIMER } from '../utils/mahramEngine';
import { findRelationship } from '../utils/relationshipEngine';
import {
  ShieldCheck,
  ShieldAlert,
  BookOpen,
  User,
  Search,
  CheckCircle2,
  AlertTriangle,
  HeartHandshake,
  HelpCircle,
  Eye,
  Info,
} from 'lucide-react';

interface MahramGuideViewProps {
  allPersons: Person[];
  currentPerson: Person | null;
  onOpenPersonDetail: (person: Person) => void;
  onSelectPersonIdentity: (person: Person) => void;
}

export const MahramGuideView: React.FC<MahramGuideViewProps> = ({
  allPersons,
  currentPerson,
  onOpenPersonDetail,
  onSelectPersonIdentity,
}) => {
  const [selectedPersonId, setSelectedPersonId] = useState<string>(
    currentPerson?.id || 'WMH-000015' // Ahmad bin Abdullah
  );
  const [filterType, setFilterType] = useState<'ALL' | 'MAHRAM' | 'AJNABI' | 'IPAR'>('ALL');
  const [searchRelative, setSearchRelative] = useState('');

  const focusPerson = allPersons.find((p) => p.id === selectedPersonId) || allPersons[0];

  // Perform full analysis across all other relatives in family tree
  const analyzedList = useMemo(() => {
    if (!focusPerson) return [];
    return allPersons
      .filter((p) => p.id !== focusPerson.id)
      .map((target) => {
        const analysis = analyzeMahram(focusPerson, target, allPersons);
        const rel = findRelationship(focusPerson.id, target.id, allPersons);
        return {
          target,
          analysis,
          relationshipName: rel?.relationshipName || 'Waris',
        };
      });
  }, [focusPerson, allPersons]);

  const mahramCount = analyzedList.filter((item) => item.analysis.isMahram).length;
  const ajnabiCount = analyzedList.filter(
    (item) => !item.analysis.isMahram && item.analysis.mahramType !== 'MAHRAM_SEMENTARA'
  ).length;
  const iparCount = analyzedList.filter((item) => item.analysis.mahramType === 'MAHRAM_SEMENTARA').length;

  const filteredItems = analyzedList.filter((item) => {
    if (filterType === 'MAHRAM' && !item.analysis.isMahram) return false;
    if (filterType === 'AJNABI' && (item.analysis.isMahram || item.analysis.mahramType === 'MAHRAM_SEMENTARA')) return false;
    if (filterType === 'IPAR' && item.analysis.mahramType !== 'MAHRAM_SEMENTARA') return false;

    if (searchRelative.trim()) {
      const q = searchRelative.toLowerCase();
      const matchName = item.target.fullName.toLowerCase().includes(q);
      const matchNick = item.target.nickname?.toLowerCase().includes(q);
      const matchRel = item.relationshipName.toLowerCase().includes(q);
      return Boolean(matchName || matchNick || matchRel);
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header & Identity Picker */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-md text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Panduan Mahram & Ajnabi Islam: "Siapa Mahram Saya?"</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Klasifikasi hukum syarak berasaskan nasab, perkahwinan (musaharah), dan susuan (rada'ah).
              </p>
            </div>
          </div>

          {/* Quick Identity Selector */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400 shrink-0">Analisis Untuk:</span>
            <select
              id="mahram-identity-select"
              value={selectedPersonId}
              onChange={(e) => setSelectedPersonId(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold text-white focus:outline-hidden focus:border-teal-500"
            >
              {allPersons.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fullName} ({p.gender === 'male' ? 'L' : 'P'}, Gen {p.generation})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected Person Summary Card */}
        <div className="mt-5 p-4 rounded-2xl bg-slate-800/70 border border-slate-700/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                focusPerson.gender === 'male' ? 'bg-blue-900 text-blue-200' : 'bg-rose-900 text-rose-200'
              }`}
            >
              {focusPerson.fullName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="font-bold text-sm text-white">{focusPerson.fullName}</h4>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                  {focusPerson.gender === 'male' ? 'Lelaki' : 'Perempuan'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {focusPerson.id} • Generasi ke-{focusPerson.generation} • {focusPerson.city || 'Malaysia'}
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center space-x-2 text-xs">
            <span className="px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 font-bold">
              🛡️ {mahramCount} Mahram
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-rose-950/80 border border-rose-800/60 text-rose-300 font-bold">
              ⚠️ {ajnabiCount} Ajnabi
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-amber-950/80 border border-amber-800/60 text-amber-300 font-bold">
              ⚡ {iparCount} Ipar
            </span>
          </div>
        </div>
      </div>

      {/* Syarak Official Disclaimer Box (Objektif 66) */}
      <div className="p-5 rounded-3xl bg-amber-950/30 border border-amber-800/50 text-amber-200 text-xs leading-relaxed space-y-2">
        <div className="flex items-center space-x-2 text-amber-300 font-bold text-sm">
          <BookOpen className="w-4 h-4" />
          <span>Peringatan Rasmi Hukum Syarak (Islamic Disclaimer)</span>
        </div>
        <p>
          "{ISLAMIC_DISCLAIMER}"
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 text-[11px] text-amber-100/80">
          <div className="p-2 rounded-lg bg-amber-900/20 border border-amber-800/40">
            <b>1. Mahram Nasab:</b> Ibu/bapa, anak, cucu, adik-beradik, pakcik/makcik kandung, anak saudara. (Haram selamanya).
          </div>
          <div className="p-2 rounded-lg bg-amber-900/20 border border-amber-800/40">
            <b>2. Sepupu = Ajnabi:</b> Sepupu BUKAN mahram. Wajib tutup aurat & haram bersalaman tanpa lapik. Boleh bernikah.
          </div>
          <div className="p-2 rounded-lg bg-amber-900/20 border border-amber-800/40">
            <b>3. Ipar = Ajnabi Aurat:</b> Ipar hanya haram dihimpunkan serentak. Batas aurat & bersalaman KEKAL AJNABI!
          </div>
        </div>
      </div>

      {/* Category Tabs & Search */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-md space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex space-x-1.5 overflow-x-auto text-xs font-semibold">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3.5 py-2 rounded-xl transition-all ${
                filterType === 'ALL'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Semua Waris ({analyzedList.length})
            </button>
            <button
              onClick={() => setFilterType('MAHRAM')}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1 ${
                filterType === 'MAHRAM'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span>🛡️ Mahram Sahaja</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-900/60">
                {mahramCount}
              </span>
            </button>
            <button
              onClick={() => setFilterType('AJNABI')}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1 ${
                filterType === 'AJNABI'
                  ? 'bg-rose-700 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span>⚠️ Ajnabi (Bukan Mahram)</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-900/60">
                {ajnabiCount}
              </span>
            </button>
            <button
              onClick={() => setFilterType('IPAR')}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1 ${
                filterType === 'IPAR'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span>⚡ Ipar (Muaqqat)</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-900/60">
                {iparCount}
              </span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Tapis nama waris..."
              value={searchRelative}
              onChange={(e) => setSearchRelative(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-400"
            />
          </div>
        </div>
      </div>

      {/* Relatives List with Comprehensive Mahram Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredItems.map(({ target, analysis, relationshipName }) => {
          const isMahram = analysis.isMahram;
          const isIpar = analysis.mahramType === 'MAHRAM_SEMENTARA';

          return (
            <div
              key={target.id}
              onClick={() => onOpenPersonDetail(target)}
              className={`rounded-2xl p-5 border transition-all cursor-pointer shadow-md flex flex-col justify-between ${
                isMahram
                  ? 'bg-emerald-950/40 border-emerald-800/60 hover:border-emerald-500'
                  : isIpar
                  ? 'bg-amber-950/40 border-amber-800/60 hover:border-amber-500'
                  : 'bg-slate-900/90 border-slate-800 hover:border-rose-700/60'
              }`}
            >
              <div>
                {/* Top status */}
                <div className="flex items-center justify-between text-xs mb-3">
                  <span
                    className={`font-bold px-2.5 py-0.5 rounded-full text-[10px] border ${
                      isMahram
                        ? 'bg-emerald-900/80 text-emerald-200 border-emerald-600'
                        : isIpar
                        ? 'bg-amber-900/80 text-amber-200 border-amber-600'
                        : 'bg-rose-950 text-rose-300 border-rose-800'
                    }`}
                  >
                    {isMahram ? '🛡️ MAHRAM' : isIpar ? '⚡ MAHRAM MUAQQAT (IPAR)' : '⚠️ AJNABI (BUKAN MAHRAM)'}
                  </span>

                  <span className="text-[11px] text-slate-400 font-mono">
                    Gen {target.generation} • {target.id}
                  </span>
                </div>

                {/* Name & Relation */}
                <div className="flex items-start space-x-3 mb-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                      target.gender === 'male' ? 'bg-blue-900 text-blue-200' : 'bg-rose-900 text-rose-200'
                    }`}
                  >
                    {target.fullName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">{target.fullName}</h3>
                    <p className="text-xs text-emerald-400 font-medium">
                      Hubungan: {relationshipName}
                    </p>
                  </div>
                </div>

                {/* Syarak Specific Rulings */}
                <div className="space-y-1.5 text-xs text-slate-300 py-2.5 border-t border-slate-800/80">
                  <p className="text-slate-400 leading-relaxed text-[11px]">
                    {analysis.description}
                  </p>
                  <div className="grid grid-cols-1 gap-1 pt-1 text-[11px]">
                    <div className="flex items-start space-x-1.5">
                      <span className="text-slate-400 shrink-0">• Aurat:</span>
                      <span className="text-slate-200">{analysis.hukumAurat}</span>
                    </div>
                    <div className="flex items-start space-x-1.5">
                      <span className="text-slate-400 shrink-0">• Salam:</span>
                      <span className="text-slate-200">{analysis.hukumBersalaman}</span>
                    </div>
                    <div className="flex items-start space-x-1.5">
                      <span className="text-slate-400 shrink-0">• Nikah:</span>
                      <span className="text-slate-200">{analysis.hukumNikah}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* View Profile prompt */}
              <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Laluan: {analysis.relationshipPath.join(' ➔ ')}</span>
                <span className="text-teal-400 font-semibold hover:underline">Profil</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
