import React, { useState } from 'react';
import { Person, RootFamilyConfig, PrintSettings } from '../types/family';
import {
  Printer,
  FileText,
  Download,
  Layout,
  TreeDeciduous,
  Shield,
  CheckCircle2,
  Lock,
  Sparkles,
} from 'lucide-react';

interface PrintViewProps {
  allPersons: Person[];
  rootConfig: RootFamilyConfig;
  printSettings: PrintSettings;
  currentPerson: Person | null;
  isAdmin: boolean;
}

export const PrintView: React.FC<PrintViewProps> = ({
  allPersons,
  rootConfig,
  printSettings,
  currentPerson,
  isAdmin,
}) => {
  const [printMode, setPrintMode] = useState<'TREE_SUMMARY' | 'WARIS_TABLE' | 'GENERATION_BREAKDOWN' | 'SINGLE_PROFILE'>('TREE_SUMMARY');
  const [selectedPaperSize, setSelectedPaperSize] = useState<'A4' | 'A3'>(printSettings.paperSize || 'A4');
  const [selectedOrientation, setSelectedOrientation] = useState<'portrait' | 'landscape'>(printSettings.orientation || 'landscape');
  const [selectedPersonId, setSelectedPersonId] = useState<string>(currentPerson?.id || 'WMH-000015');

  const selectedPerson = allPersons.find((p) => p.id === selectedPersonId) || allPersons[0];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Top Configuration & Actions (Hidden during print) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-md print:hidden space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <Printer className="w-6 h-6 text-emerald-400" />
              <span>Pusat Cetakan Rasmi Salasilah & Eksport Dokumen</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Jana dokumen PDF / cetakan berformat A4 & A3 dengan kepala surat rasmi dan tera air pengesahan.
            </p>
          </div>

          <button
            id="btn-execute-print"
            onClick={handlePrint}
            className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all flex items-center space-x-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>[ CETAK SEKARANG / SIMPAN PDF ]</span>
          </button>
        </div>

        {/* Options Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4 border-t border-slate-800">
          {/* Print Mode */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Kandungan Dokumen:
            </label>
            <select
              id="print-mode-select"
              value={printMode}
              onChange={(e) => setPrintMode(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-hidden focus:border-emerald-500"
            >
              <option value="TREE_SUMMARY">🌳 Susur Galur Ringkas (Tree Summary)</option>
              <option value="WARIS_TABLE">📋 Jadual Lengkap Waris ({allPersons.length} Orang)</option>
              <option value="GENERATION_BREAKDOWN">🏛️ Salasilah Mengikut 5 Generasi</option>
              <option value="SINGLE_PROFILE">📜 Sijil Profil Lengkap Individu</option>
            </select>
          </div>

          {/* Paper Size */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Saiz Kertas:
            </label>
            <select
              id="print-papersize-select"
              value={selectedPaperSize}
              onChange={(e) => setSelectedPaperSize(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-hidden focus:border-emerald-500"
            >
              <option value="A4">A4 (Standard 210 x 297 mm)</option>
              <option value="A3">A3 (Besar Salasilah 297 x 420 mm)</option>
            </select>
          </div>

          {/* Orientation */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Orientasi:
            </label>
            <select
              id="print-orientation-select"
              value={selectedOrientation}
              onChange={(e) => setSelectedOrientation(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-hidden focus:border-emerald-500"
            >
              <option value="landscape">Melintang (Landscape) - Disyorkan</option>
              <option value="portrait">Menegak (Portrait)</option>
            </select>
          </div>

          {/* Person Selector if Single Profile */}
          {printMode === 'SINGLE_PROFILE' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Pilih Waris:
              </label>
              <select
                id="print-person-select"
                value={selectedPersonId}
                onChange={(e) => setSelectedPersonId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-hidden focus:border-emerald-500"
              >
                {allPersons.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName} (Gen {p.generation})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Protection Note for Standard Members */}
        <div className="flex items-center space-x-2 text-xs text-slate-400 pt-1">
          <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>
            <em>Format rasmi, kepala surat, tera air, dan footer dikunci demi memelihara ketulenan dokumen rasmi keluarga. (Pengubahsuaian format hanya melalui Admin Panel).</em>
          </span>
        </div>
      </div>

      {/* Printable Sheet Canvas */}
      <div className="bg-slate-950 p-2 sm:p-6 rounded-3xl border border-slate-800 overflow-x-auto">
        <div
          id="official-print-document"
          className={`bg-white text-slate-900 mx-auto p-8 sm:p-12 shadow-2xl rounded-xl relative ${
            selectedOrientation === 'landscape' ? 'max-w-5xl' : 'max-w-3xl'
          }`}
          style={{ minHeight: '800px' }}
        >
          {/* Watermark Overlay */}
          {printSettings.showWatermark && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04] select-none">
              <span className="text-4xl sm:text-6xl font-black transform -rotate-45 tracking-widest text-slate-950 uppercase text-center">
                {printSettings.watermarkText}
              </span>
            </div>
          )}

          {/* Official Letterhead Header */}
          <div className="border-b-2 border-emerald-900 pb-5 mb-6 text-center space-y-1 relative">
            <div className="flex items-center justify-center space-x-2 mb-1">
              <TreeDeciduous className="w-6 h-6 text-emerald-800" />
              <span className="text-xs font-black tracking-widest uppercase text-emerald-800">
                PERSATUAN WARIS MAMAT & HAFSAH
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 uppercase">
              {printSettings.officialTitle}
            </h1>
            <p className="text-xs font-serif italic text-slate-600">
              {printSettings.officialSubtitle}
            </p>
            <div className="text-[10px] text-slate-500 pt-1">
              Tarikh Cetakan: {new Date().toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' })} • Status: DOKUMEN DISAHKAN RASMI
            </div>
          </div>

          {/* CONTENT SECTION 1: TREE SUMMARY */}
          {printMode === 'TREE_SUMMARY' && (
            <div className="space-y-6">
              {/* Root Couple Box */}
              <div className="border-2 border-emerald-800 bg-emerald-50 rounded-xl p-4 text-center">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900 block">
                  PASANGAN ASAL & PENGASAS KETURUNAN (GENERASI 1)
                </span>
                <h3 className="text-lg font-black text-emerald-950 mt-1">
                  MAMAT BIN ISMAIL & HAFSAH BINTI ISMAIL
                </h3>
                <p className="text-xs text-emerald-800 font-serif italic mt-0.5">
                  Kampung Teluk Menara, Terengganu • Bertarikh Sejak 1942
                </p>
              </div>

              {/* Gen 2 Branches */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 border-b pb-1">
                  CABANG UTAMA ANAK-ANAK KANDUNG (GENERASI 2):
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {allPersons
                    .filter((p) => p.generation === 2 && (p.fatherId === 'WMH-000001' || p.motherId === 'WMH-000002'))
                    .map((child, idx) => {
                      const cucu = allPersons.filter((c) => c.fatherId === child.id || c.motherId === child.id);
                      const spouseNames = (child.spouseIds || [])
                        .map((sid) => allPersons.find((p) => p.id === sid)?.fullName)
                        .filter(Boolean);

                      return (
                        <div key={child.id} className="border border-slate-300 rounded-lg p-3 bg-slate-50 text-xs">
                          <div className="font-bold text-slate-900 flex items-center justify-between">
                            <span>{idx + 1}. {child.fullName}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{child.id}</span>
                          </div>
                          {spouseNames.length > 0 && (
                            <div className="text-[11px] text-purple-900 mt-0.5">
                              Pasangan: <b>{spouseNames.join(', ')}</b>
                            </div>
                          )}
                          <div className="text-[11px] text-emerald-800 font-semibold mt-1">
                            {cucu.length} orang anak (Cucu Mamat & Hafsah)
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Family Statistics Snapshot */}
              <div className="grid grid-cols-3 gap-2 border border-slate-300 rounded-lg p-3 text-center text-xs bg-slate-50">
                <div>
                  <span className="text-slate-500 block text-[10px]">JUMLAH WARIS</span>
                  <b className="text-base text-slate-900">{allPersons.length} Orang</b>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">BILANGAN GENERASI</span>
                  <b className="text-base text-slate-900">5 Generasi</b>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">STATUS REKOD</span>
                  <b className="text-base text-emerald-800">100% Sah</b>
                </div>
              </div>
            </div>
          )}

          {/* CONTENT SECTION 2: COMPLETE DIRECTORY TABLE */}
          {printMode === 'WARIS_TABLE' && (
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                SENARAI LENGKAP WARIS KELUARGA ({allPersons.length} REKOD):
              </h4>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse border border-slate-300">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800">
                      <th className="border border-slate-300 p-2 font-bold">No</th>
                      <th className="border border-slate-300 p-2 font-bold">Person ID</th>
                      <th className="border border-slate-300 p-2 font-bold">Nama Penuh</th>
                      <th className="border border-slate-300 p-2 font-bold">Gen</th>
                      <th className="border border-slate-300 p-2 font-bold">Jantina</th>
                      <th className="border border-slate-300 p-2 font-bold">Tahun</th>
                      <th className="border border-slate-300 p-2 font-bold">Ibu Bapa</th>
                      <th className="border border-slate-300 p-2 font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allPersons.map((p, idx) => {
                      const bapa = allPersons.find((x) => x.id === p.fatherId);
                      const ibu = allPersons.find((x) => x.id === p.motherId);
                      return (
                        <tr key={p.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                          <td className="border border-slate-300 p-1.5 text-center">{idx + 1}</td>
                          <td className="border border-slate-300 p-1.5 font-mono text-[10px]">{p.id}</td>
                          <td className="border border-slate-300 p-1.5 font-bold text-slate-900">{p.fullName}</td>
                          <td className="border border-slate-300 p-1.5 text-center">{p.generation}</td>
                          <td className="border border-slate-300 p-1.5">{p.gender === 'male' ? 'L' : 'P'}</td>
                          <td className="border border-slate-300 p-1.5">{p.birthYear || '-'}</td>
                          <td className="border border-slate-300 p-1.5 text-[10px] truncate max-w-[140px]">
                            {[bapa?.nickname || bapa?.fullName, ibu?.nickname || ibu?.fullName].filter(Boolean).join(' / ') || '-'}
                          </td>
                          <td className="border border-slate-300 p-1.5 text-[10px] text-emerald-800 font-semibold">
                            {p.isVerified ? 'Disahkan' : 'Menunggu'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* CONTENT SECTION 3: GENERATION BREAKDOWN */}
          {printMode === 'GENERATION_BREAKDOWN' && (
            <div className="space-y-6">
              {[1, 2, 3, 4, 5].map((gen) => {
                const members = allPersons.filter((p) => p.generation === gen);
                return (
                  <div key={gen} className="space-y-2 border-b border-slate-200 pb-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase text-emerald-900">
                        GENERASI {gen} ({members.length} Orang Waris)
                      </h4>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                      {members.map((m) => (
                        <div key={m.id} className="p-2 border border-slate-200 rounded bg-slate-50">
                          <div className="font-bold text-slate-900 truncate">{m.fullName}</div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {m.id} • {m.gender === 'male' ? 'Lelaki' : 'Perempuan'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* CONTENT SECTION 4: SINGLE PROFILE CERTIFICATE */}
          {printMode === 'SINGLE_PROFILE' && selectedPerson && (
            <div className="space-y-6 border-2 border-emerald-900 p-6 rounded-2xl bg-emerald-50/20">
              <div className="text-center space-y-1">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest">
                  REKOD SILSILAH INDIVIDU
                </span>
                <h2 className="text-2xl font-black text-slate-950 uppercase">
                  {selectedPerson.fullName}
                </h2>
                <p className="text-xs font-mono text-slate-600">
                  Person ID: {selectedPerson.id} • Keturunan Generasi ke-{selectedPerson.generation}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs border-y border-emerald-200 py-4">
                <div>
                  <span className="text-slate-500 block text-[10px]">NAMA PANGGILAN</span>
                  <b className="text-slate-900">{selectedPerson.nickname || '-'}</b>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">JANTINA</span>
                  <b className="text-slate-900">{selectedPerson.gender === 'male' ? 'Lelaki' : 'Perempuan'}</b>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">TAHUN LAHIR</span>
                  <b className="text-slate-900">{selectedPerson.birthYear || 'Tidak dinyatakan'}</b>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">STATUS HAYAT</span>
                  <b className="text-slate-900">{selectedPerson.isDeceased ? 'Telah Kembali Ke Rahmatullah' : 'Masih Hidup'}</b>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">BAPA KANDUNG</span>
                  <b className="text-slate-900">{allPersons.find((p) => p.id === selectedPerson.fatherId)?.fullName || '-'}</b>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">IBU KANDUNG</span>
                  <b className="text-slate-900">{allPersons.find((p) => p.id === selectedPerson.motherId)?.fullName || '-'}</b>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">PASANGAN</span>
                  <b className="text-slate-900">
                    {(selectedPerson.spouseIds || [])
                      .map((id) => allPersons.find((p) => p.id === id)?.fullName)
                      .filter(Boolean)
                      .join(', ') || 'Tiada direkodkan'}
                  </b>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">BILANGAN ANAK</span>
                  <b className="text-slate-900">{selectedPerson.childrenIds?.length || 0} Orang</b>
                </div>
              </div>

              {selectedPerson.bio && (
                <div className="text-xs text-slate-700 leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
                  <span className="font-bold block text-[11px] text-emerald-900 mb-1">Catatan Biografi:</span>
                  {selectedPerson.bio}
                </div>
              )}
            </div>
          )}

          {/* Official Footer Note */}
          <div className="mt-12 pt-4 border-t border-slate-300 text-[10px] text-slate-500 text-center space-y-1">
            <p className="font-semibold text-slate-700">{printSettings.footerText}</p>
            <p>
              Salasilah Keturunan: Tok Ayah Mamat bin Ismail & Tok Mak Hafsah binti Ismail. Pangkalan Data Waris Digital.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
