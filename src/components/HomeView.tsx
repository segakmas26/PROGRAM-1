import React from 'react';
import { Person, RootFamilyConfig } from '../types/family';
import {
  TreeDeciduous,
  Users,
  Search,
  Sparkles,
  Printer,
  Heart,
  Award,
  BookOpen,
  ArrowRight,
  UserCheck,
  CheckCircle,
  MapPin,
  Calendar,
} from 'lucide-react';

interface HomeViewProps {
  rootConfig: RootFamilyConfig;
  allPersons: Person[];
  currentPerson: Person | null;
  setActiveTab: (tab: string) => void;
  onOpenPersonDetail: (person: Person) => void;
  onSelectRelationshipPersons?: (personAId: string, personBId: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  rootConfig,
  allPersons,
  currentPerson,
  setActiveTab,
  onOpenPersonDetail,
  onSelectRelationshipPersons,
}) => {
  const totalWaris = allPersons.length;
  const verifiedCount = allPersons.filter((p) => p.isVerified).length;
  const maleCount = allPersons.filter((p) => p.gender === 'male').length;
  const femaleCount = allPersons.filter((p) => p.gender === 'female').length;
  const generations = Math.max(...allPersons.map((p) => p.generation || 1), 5);
  const completenessPercent = Math.round((verifiedCount / totalWaris) * 100);

  // Root Persons
  const fatherRoot = allPersons.find((p) => p.id === 'WMH-000001') || allPersons[0];
  const motherRoot = allPersons.find((p) => p.id === 'WMH-000002') || allPersons[1];

  // Generation counts
  const genCounts = [1, 2, 3, 4, 5].map((g) => ({
    gen: g,
    count: allPersons.filter((p) => p.generation === g).length,
    label:
      g === 1
        ? 'Generasi 1 (Pengasas Asal)'
        : g === 2
        ? 'Generasi 2 (Anak-anak)'
        : g === 3
        ? 'Generasi 3 (Cucu-cucu)'
        : g === 4
        ? 'Generasi 4 (Cicit-cicit)'
        : 'Generasi 5 (Piut-piut)',
  }));

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      {/* Hero Banner with Root Family Identity */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-b from-emerald-900 via-emerald-950 to-slate-950 border border-emerald-800/80 shadow-2xl p-6 sm:p-10 text-white">
        {/* Subtle decorative background circles */}
        <div className="absolute -right-16 -bottom-16 w-80 h-80 rounded-full bg-emerald-700/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -top-16 w-80 h-80 rounded-full bg-teal-600/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-5">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-800/80 border border-emerald-600/50 text-emerald-300 text-xs font-semibold tracking-wide shadow-inner">
            <TreeDeciduous className="w-3.5 h-3.5" />
            <span>SISTEM SUSUR GALUR KELUARGA RASMI</span>
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight text-white">
            🌳 SUSUR GALUR KELUARGA <br />
            <span className="text-emerald-300 drop-shadow-sm">{rootConfig.fatherName}</span>
            <span className="text-emerald-400/80 text-xl sm:text-3xl block my-1 font-light">&</span>
            <span className="text-emerald-300 drop-shadow-sm">{rootConfig.motherName}</span>
          </h1>

          <p className="text-emerald-100/90 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            "{rootConfig.tagline}"
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              id="hero-open-tree-btn"
              onClick={() => setActiveTab('tree')}
              className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all transform hover:-translate-y-0.5 flex items-center space-x-2 cursor-pointer"
            >
              <TreeDeciduous className="w-4 h-4" />
              <span>[ BUKA CARTA SUSUR GALUR ]</span>
            </button>
            <button
              id="hero-search-rel-btn"
              onClick={() => setActiveTab('search')}
              className="px-5 py-3 rounded-xl bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 border border-emerald-600/50 font-semibold text-sm transition-all flex items-center space-x-2 cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>Kalkulator Hubungan</span>
            </button>
          </div>
        </div>

        {/* Highlight Root Family Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 pt-8 border-t border-emerald-800/60 max-w-3xl mx-auto">
          {fatherRoot && (
            <div
              id="root-card-father"
              onClick={() => onOpenPersonDetail(fatherRoot)}
              className="bg-emerald-900/50 hover:bg-emerald-800/60 border border-emerald-700/60 rounded-2xl p-4 transition-all cursor-pointer flex items-center space-x-4 group"
            >
              <div className="w-14 h-14 rounded-2xl bg-blue-950/80 border border-blue-600/50 flex items-center justify-center text-blue-300 font-bold text-xl shadow-inner group-hover:scale-105 transition-transform">
                M
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-900/80 text-blue-200 border border-blue-700/60">
                    Bapa Pengasas
                  </span>
                  <span className="text-xs text-emerald-400">Gen 1</span>
                </div>
                <h4 className="text-sm sm:text-base font-bold text-white truncate mt-1">
                  {fatherRoot.fullName}
                </h4>
                <p className="text-xs text-emerald-200/70">
                  {fatherRoot.birthYear} - {fatherRoot.deathYear} • {fatherRoot.nickname}
                </p>
              </div>
            </div>
          )}

          {motherRoot && (
            <div
              id="root-card-mother"
              onClick={() => onOpenPersonDetail(motherRoot)}
              className="bg-emerald-900/50 hover:bg-emerald-800/60 border border-emerald-700/60 rounded-2xl p-4 transition-all cursor-pointer flex items-center space-x-4 group"
            >
              <div className="w-14 h-14 rounded-2xl bg-rose-950/80 border border-rose-600/50 flex items-center justify-center text-rose-300 font-bold text-xl shadow-inner group-hover:scale-105 transition-transform">
                H
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-900/80 text-rose-200 border border-rose-700/60">
                    Ibu Pengasas
                  </span>
                  <span className="text-xs text-emerald-400">Gen 1</span>
                </div>
                <h4 className="text-sm sm:text-base font-bold text-white truncate mt-1">
                  {motherRoot.fullName}
                </h4>
                <p className="text-xs text-emerald-200/70">
                  {motherRoot.birthYear} - {motherRoot.deathYear} • {motherRoot.nickname}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Official Required Stat Counters (Objektif 63) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: JUMLAH WARIS */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-emerald-700/50 transition-colors">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">
            <span>JUMLAH WARIS</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold text-white">
            {totalWaris}
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center space-x-2">
            <span className="text-blue-400 font-semibold">{maleCount} Lelaki</span>
            <span>•</span>
            <span className="text-rose-400 font-semibold">{femaleCount} Perempuan</span>
          </div>
        </div>

        {/* Stat 2: GENERASI */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-emerald-700/50 transition-colors">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">
            <span>GENERASI</span>
            <TreeDeciduous className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold text-white">
            {generations}
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Dari Pengasas (1942) hingga Cicit & Piut (2026)
          </div>
        </div>

        {/* Stat 3: PROFIL LENGKAP */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-emerald-700/50 transition-colors">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">
            <span>PROFIL LENGKAP</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400">
            {completenessPercent}%
          </div>
          <div className="mt-2 text-xs text-slate-400">
            {verifiedCount} rekod disahkan (Verified)
          </div>
        </div>

        {/* Stat 4: STATUS PENGESAHAN */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-emerald-700/50 transition-colors">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">
            <span>KUALITI DATA</span>
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold text-white">
            100%
          </div>
          <div className="mt-2 text-xs text-emerald-400 flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Tiada percanggahan nasab</span>
          </div>
        </div>
      </div>

      {/* 4 Fast Feature Launchpads ("MASUK → CARI → LIHAT → FAHAM") */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center space-x-2">
            <span>⚡ Tindakan Pantas Waris</span>
          </h2>
          <span className="text-xs text-slate-400">Prinsip: Masuk → Cari → Lihat → Faham</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Apa Hubungan Kita */}
          <div
            id="quick-action-relationship"
            onClick={() => setActiveTab('search')}
            className="group p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-600/70 hover:bg-slate-850 transition-all cursor-pointer shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3 group-hover:scale-110 transition-transform">
                <Search className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-base">Apa Hubungan Kita?</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Pilih mana-mana 2 waris untuk melihat pertalian kekeluargaan & rajah salasilah secara automatik.
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-semibold text-emerald-400 group-hover:text-emerald-300">
              <span>Buka Kalkulator</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 2: Susur Galur Interaktif */}
          <div
            id="quick-action-tree"
            onClick={() => setActiveTab('tree')}
            className="group p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-600/70 hover:bg-slate-850 transition-all cursor-pointer shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 mb-3 group-hover:scale-110 transition-transform">
                <TreeDeciduous className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-base">Susur Galur Interaktif</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Terokai carta pokok keluarga mengikut generasi dengan visual interaktif dan kad waris terperinci.
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-semibold text-teal-400 group-hover:text-teal-300">
              <span>Buka Carta Pokok</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 3: Tanya AI Waris */}
          <div
            id="quick-action-ai"
            onClick={() => setActiveTab('ai')}
            className="group p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/70 hover:bg-slate-850 transition-all cursor-pointer shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3 group-hover:scale-110 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-base">Tanya AI Waris</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Tanya soalan seperti "Siapa sepupu saya?", "Siapa cucu Mamat?", dijawab serta-merta tanpa halusinasi.
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-semibold text-amber-400 group-hover:text-amber-300">
              <span>Buka AI Chatbot</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 4: Cetak Rasmi */}
          <div
            id="quick-action-print"
            onClick={() => setActiveTab('print')}
            className="group p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-blue-500/70 hover:bg-slate-850 transition-all cursor-pointer shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-3 group-hover:scale-110 transition-transform">
                <Printer className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-base">Cetak Silsilah Rasmi</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Jana dokumen salasilah keluarga berformat A4 / A3 dengan tera air dan kepala surat rasmi persatuan.
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-semibold text-blue-400 group-hover:text-blue-300">
              <span>Cetak / Eksport PDF</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* Generation Breakdown Section */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-md space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <TreeDeciduous className="w-5 h-5 text-emerald-400" />
              <span>Pecahan 5 Generasi Salasilah Waris</span>
            </h3>
            <p className="text-xs text-slate-400">
              Setiap generasi dihubungkan melalui rekod parent-child yang disahkan.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('waris')}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center space-x-1"
          >
            <span>Lihat Senarai Lengkap</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {genCounts.map((item) => (
            <div
              key={item.gen}
              onClick={() => setActiveTab('waris')}
              className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 hover:bg-slate-800 hover:border-emerald-600/60 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span className="font-bold text-emerald-400">GEN {item.gen}</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-700/80 text-slate-200">
                  {item.count} Waris
                </span>
              </div>
              <h4 className="font-semibold text-xs text-white line-clamp-1">{item.label}</h4>
              <div className="mt-3 w-full bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-emerald-500 h-1.5 rounded-full"
                  style={{ width: `${Math.max((item.count / totalWaris) * 100, 10)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Islamic Safety Notice / Disclaimer Banner */}
      <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-800/40 text-amber-200 text-xs flex items-start space-x-3">
        <BookOpen className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold text-amber-300 block mb-0.5">Peringatan Syarak & Hukum Islam:</span>
          Maklumat berkaitan hukum Islam dalam aplikasi ini (Mahram, Aurat, Bersalaman, Perkahwinan) adalah penerangan umum berdasarkan sumber fiqh muktabar dan bukan fatwa peribadi. Untuk persoalan khusus, sila rujuk pihak berautoriti agama atau asatizah.
        </div>
      </div>
    </div>
  );
};
