import React, { useState, useMemo } from 'react';
import { Person, RelationshipResult } from '../types/family';
import { findRelationship } from '../utils/relationshipEngine';
import { analyzeMahram } from '../utils/mahramEngine';
import {
  Search,
  Users,
  GitFork,
  ArrowRight,
  ArrowDown,
  ArrowUp,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  User,
  HeartHandshake,
  CheckCircle2,
  TreeDeciduous,
  Info,
  ArrowLeftRight,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

interface SearchAndRelationshipViewProps {
  allPersons: Person[];
  currentPerson: Person | null;
  onOpenPersonDetail: (person: Person) => void;
  initialPersonAId?: string;
  initialPersonBId?: string;
}

export const SearchAndRelationshipView: React.FC<SearchAndRelationshipViewProps> = ({
  allPersons,
  currentPerson,
  onOpenPersonDetail,
  initialPersonAId,
  initialPersonBId,
}) => {
  const [personAId, setPersonAId] = useState<string>(initialPersonAId || currentPerson?.id || 'WMH-000015');
  const [personBId, setPersonBId] = useState<string>(initialPersonBId || 'WMH-000001'); // Default Tok Ayah Mamat
  const [searchAQuery, setSearchAQuery] = useState('');
  const [searchBQuery, setSearchBQuery] = useState('');
  const [isChoosingA, setIsChoosingA] = useState(false);
  const [isChoosingB, setIsChoosingB] = useState(false);

  const personA = allPersons.find((p) => p.id === personAId) || allPersons[0];
  const personB = allPersons.find((p) => p.id === personBId) || allPersons[1];

  // Swap Persons A and B
  const handleSwapPersons = () => {
    const temp = personAId;
    setPersonAId(personBId);
    setPersonBId(temp);
  };

  // Calculate Relationship
  const relationshipResult: RelationshipResult | null = useMemo(() => {
    if (!personA || !personB) return null;
    return findRelationship(personA.id, personB.id, allPersons);
  }, [personA, personB, allPersons]);

  // Mahram Analysis
  const mahramAnalysis = useMemo(() => {
    if (!personA || !personB) return null;
    return analyzeMahram(personA, personB, allPersons);
  }, [personA, personB, allPersons]);

  const filteredA = allPersons.filter(
    (p) =>
      p.fullName.toLowerCase().includes(searchAQuery.toLowerCase()) ||
      (p.nickname && p.nickname.toLowerCase().includes(searchAQuery.toLowerCase())) ||
      p.id.toLowerCase().includes(searchAQuery.toLowerCase())
  );

  const filteredB = allPersons.filter(
    (p) =>
      p.fullName.toLowerCase().includes(searchBQuery.toLowerCase()) ||
      (p.nickname && p.nickname.toLowerCase().includes(searchBQuery.toLowerCase())) ||
      p.id.toLowerCase().includes(searchBQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header & Calculator Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-md text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <GitFork className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Kalkulator Hubungan: "Apa Hubungan Kita?"</h2>
              <p className="text-xs text-slate-400">
                Ketahui pertalian tepat anak, cucu, cicit, piut, piut-piut, bapa/ibu saudara, sepupu, dan status mahram.
              </p>
            </div>
          </div>

          <button
            onClick={handleSwapPersons}
            className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1.5 transition-colors cursor-pointer"
            title="Tukar Posisi Individu A ⇄ Individu B"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Tukar Kedudukan (A ⇄ B)</span>
          </button>
        </div>

        {/* 2 Selectors Container */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {/* Individu A Box */}
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3 relative">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>INDIVIDU A (Contoh: Diri Saya)</span>
              </span>
              <button
                id="btn-change-person-a"
                onClick={() => setIsChoosingA(!isChoosingA)}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 cursor-pointer"
              >
                {isChoosingA ? 'Tutup Pilihan' : 'Tukar Individu'}
              </button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-700">
              <div className="flex items-center space-x-3 min-w-0">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                    personA?.gender === 'male' ? 'bg-blue-900 text-blue-200' : 'bg-rose-900 text-rose-200'
                  }`}
                >
                  {personA?.fullName.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-sm text-white truncate">{personA?.fullName}</h4>
                  <p className="text-xs text-slate-400">
                    Gen {personA?.generation} • {personA?.id} {personA?.nickname ? `(${personA.nickname})` : ''}
                  </p>
                </div>
              </div>

              {personA && (
                <button
                  onClick={() => onOpenPersonDetail(personA)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs shrink-0"
                  title="Lihat Profil Lengkap"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Dropdown Selector A */}
            {isChoosingA && (
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-700 space-y-2 mt-2 max-h-60 flex flex-col animate-fade-in z-20">
                <input
                  type="text"
                  placeholder="Cari nama individu A..."
                  value={searchAQuery}
                  onChange={(e) => setSearchAQuery(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-emerald-500"
                  autoFocus
                />
                <div className="overflow-y-auto space-y-1 pr-1 flex-1">
                  {filteredA.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setPersonAId(p.id);
                        setIsChoosingA(false);
                      }}
                      className="w-full text-left p-2 rounded-lg text-xs hover:bg-slate-800 text-slate-200 flex items-center justify-between cursor-pointer"
                    >
                      <span className="truncate">{p.fullName} {p.nickname ? `(${p.nickname})` : ''}</span>
                      <span className="text-[10px] text-slate-500 font-mono">Gen {p.generation}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Individu B Box */}
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3 relative">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                <span>INDIVIDU B (Waris Yang Dibandingkan)</span>
              </span>
              <button
                id="btn-change-person-b"
                onClick={() => setIsChoosingB(!isChoosingB)}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 cursor-pointer"
              >
                {isChoosingB ? 'Tutup Pilihan' : 'Tukar Individu'}
              </button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-700">
              <div className="flex items-center space-x-3 min-w-0">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                    personB?.gender === 'male' ? 'bg-blue-900 text-blue-200' : 'bg-rose-900 text-rose-200'
                  }`}
                >
                  {personB?.fullName.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-sm text-white truncate">{personB?.fullName}</h4>
                  <p className="text-xs text-slate-400">
                    Gen {personB?.generation} • {personB?.id} {personB?.nickname ? `(${personB.nickname})` : ''}
                  </p>
                </div>
              </div>

              {personB && (
                <button
                  onClick={() => onOpenPersonDetail(personB)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs shrink-0"
                  title="Lihat Profil Lengkap"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Dropdown Selector B */}
            {isChoosingB && (
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-700 space-y-2 mt-2 max-h-60 flex flex-col animate-fade-in z-20">
                <input
                  type="text"
                  placeholder="Cari nama individu B..."
                  value={searchBQuery}
                  onChange={(e) => setSearchBQuery(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-emerald-500"
                  autoFocus
                />
                <div className="overflow-y-auto space-y-1 pr-1 flex-1">
                  {filteredB.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setPersonBId(p.id);
                        setIsChoosingB(false);
                      }}
                      className="w-full text-left p-2 rounded-lg text-xs hover:bg-slate-800 text-slate-200 flex items-center justify-between cursor-pointer"
                    >
                      <span className="truncate">{p.fullName} {p.nickname ? `(${p.nickname})` : ''}</span>
                      <span className="text-[10px] text-slate-500 font-mono">Gen {p.generation}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Result Display Box */}
      {relationshipResult && (
        <div className="bg-linear-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 text-white">
          {/* Main Relationship Headline */}
          <div className="text-center space-y-3 pb-6 border-b border-slate-800">
            <span className="text-xs font-bold tracking-wider px-3.5 py-1 rounded-full bg-emerald-950/90 border border-emerald-500/60 text-emerald-300">
              HASIL ANALISIS SALASILAH WARIS
            </span>

            <h3 className="text-xl sm:text-2xl font-bold text-white pt-1">
              "{relationshipResult.explanation}"
            </h3>

            {/* Badges Overview */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <span className="px-3.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200">
                Nama Pertalian: <b className="text-emerald-400">{relationshipResult.relationshipName}</b>
              </span>

              {relationshipResult.traditionalHonorific && (
                <span className="px-3.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200">
                  Panggilan Tradisi: <b className="text-amber-300">{relationshipResult.traditionalHonorific}</b>
                </span>
              )}

              {relationshipResult.kinshipSide && (
                <span className="px-3.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200">
                  Jurang / Cabang: <b className="text-cyan-300">{relationshipResult.kinshipSide}</b>
                </span>
              )}

              <span className="px-3.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200">
                Beza Generasi: <b className="text-amber-400">{Math.abs(relationshipResult.generationalDifference)} tingkat</b>
              </span>

              {mahramAnalysis && (
                <span
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border flex items-center space-x-1.5 ${
                    mahramAnalysis.isMahram
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                      : 'bg-rose-950 text-rose-300 border-rose-700'
                  }`}
                >
                  {mahramAnalysis.isMahram ? (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>STATUS: MAHRAM</span>
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                      <span>STATUS: AJNABI (BUKAN MAHRAM)</span>
                    </>
                  )}
                </span>
              )}
            </div>
          </div>

          {/* Graph Path Visualizer (Laluan Graf Salasilah) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
                <TreeDeciduous className="w-4 h-4 text-emerald-400" />
                <span>Laluan Graf Susur Galur Pertalian:</span>
              </h4>
              <span className="text-[11px] text-slate-400 font-mono">
                {relationshipResult.directPath.length} Titik Sambungan
              </span>
            </div>

            {/* Stepper Graph Visualizer */}
            <div className="p-5 rounded-2xl bg-slate-950/90 border border-slate-800">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 flex-wrap">
                {relationshipResult.directPath.map((step, idx) => {
                  const isFirst = idx === 0;
                  const isLast = idx === relationshipResult.directPath.length - 1;
                  return (
                    <React.Fragment key={idx}>
                      <div
                        className={`px-4 py-2.5 rounded-xl border text-xs font-semibold text-center shadow-md transition-all ${
                          isFirst
                            ? 'bg-emerald-900/80 border-emerald-500 text-emerald-200 ring-1 ring-emerald-400'
                            : isLast
                            ? 'bg-blue-900/80 border-blue-500 text-blue-200 ring-1 ring-blue-400'
                            : 'bg-slate-800 border-slate-700 text-slate-300'
                        }`}
                      >
                        <span className="block text-[10px] text-slate-400 font-mono mb-0.5">
                          {isFirst ? 'Mula (Individu A)' : isLast ? 'Sasaran (Individu B)' : `Langkah ${idx}`}
                        </span>
                        <span className="font-bold">{step}</span>
                      </div>

                      {!isLast && (
                        <div className="flex items-center text-emerald-400">
                          <ArrowRight className="hidden sm:block w-4 h-4" />
                          <ArrowDown className="sm:hidden w-4 h-4" />
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Mahram Quick Info Callout */}
          {mahramAnalysis && (
            <div
              className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-start justify-between gap-4 ${
                mahramAnalysis.isMahram
                  ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-100'
                  : 'bg-rose-950/40 border-rose-800/60 text-rose-100'
              }`}
            >
              <div className="space-y-2 w-full">
                <div className="flex items-center space-x-2">
                  {mahramAnalysis.isMahram ? (
                    <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                  ) : (
                    <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
                  )}
                  <span className="font-bold text-sm sm:text-base">
                    {mahramAnalysis.title}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {mahramAnalysis.syarakNotes}
                </p>
                <div className="pt-2 text-xs grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-slate-200">
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block mb-0.5 font-bold uppercase">Batas Aurat:</span>
                    <span>{mahramAnalysis.hukumAurat}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block mb-0.5 font-bold uppercase">Hukum Bersalaman:</span>
                    <span>{mahramAnalysis.hukumBersalaman}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block mb-0.5 font-bold uppercase">Hukum Perkahwinan:</span>
                    <span>{mahramAnalysis.hukumNikah}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
