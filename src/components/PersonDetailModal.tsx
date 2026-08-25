import React, { useState, useMemo } from 'react';
import { Person, UserSession, GoogleDriveConfig } from '../types/family';
import { storageService } from '../services/storageService';
import { findRelationship } from '../utils/relationshipEngine';
import { analyzeMahram } from '../utils/mahramEngine';
import { EditPersonModal } from './EditPersonModal';
import {
  X,
  User,
  Heart,
  Baby,
  Users,
  ShieldCheck,
  ShieldAlert,
  Clock,
  MapPin,
  Calendar,
  Briefcase,
  GraduationCap,
  Phone,
  Mail,
  FileText,
  Search,
  TreeDeciduous,
  Printer,
  Sparkles,
  Trash2,
  Edit3,
  Lock,
  GitFork,
} from 'lucide-react';

interface PersonDetailModalProps {
  person: Person | null;
  onClose: () => void;
  allPersons: Person[];
  currentPerson: Person | null;
  onSelectPerson: (person: Person) => void;
  onNavigateToTab: (tab: string, extra?: any) => void;
  isAdmin?: boolean;
  onDeletePerson?: (person: Person) => void;
  onUpdatePersons?: (persons: Person[]) => void;
  userSession?: UserSession;
  driveConfig?: GoogleDriveConfig;
  onUpdateDriveConfig?: (config: GoogleDriveConfig) => void;
}

export const PersonDetailModal: React.FC<PersonDetailModalProps> = ({
  person: initialPerson,
  onClose,
  allPersons,
  currentPerson,
  onSelectPerson,
  onNavigateToTab,
  isAdmin = false,
  onDeletePerson,
  onUpdatePersons,
  userSession = storageService.getUserSession(),
  driveConfig,
  onUpdateDriveConfig,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditingPerson, setIsEditingPerson] = useState(false);

  // Keep fresh person data if updated
  const person = (initialPerson ? allPersons.find((p) => p.id === initialPerson.id) : null) || initialPerson;

  if (!person) return null;

  const father = allPersons.find((p) => p.id === person.fatherId);
  const mother = allPersons.find((p) => p.id === person.motherId);
  const spouses = (person.spouseIds || [])
    .map((id) => allPersons.find((p) => p.id === id))
    .filter(Boolean) as Person[];
  const children = (person.childrenIds || [])
    .map((id) => allPersons.find((p) => p.id === id))
    .filter(Boolean) as Person[];
  const siblings = allPersons.filter(
    (p) =>
      p.id !== person.id &&
      ((person.fatherId && p.fatherId === person.fatherId) ||
        (person.motherId && p.motherId === person.motherId))
  );

  const isRoot = person.id === 'WMH-000001' || person.id === 'WMH-000002';
  const editPerm = storageService.canEditPerson(person, currentPerson, isAdmin);

  // Compute relationship with current user if active and not same person
  const currentPersonRelationship = useMemo(() => {
    if (!currentPerson || currentPerson.id === person.id) return null;
    const rel = findRelationship(currentPerson.id, person.id, allPersons);
    const mahram = analyzeMahram(currentPerson, person, allPersons);
    return { rel, mahram };
  }, [currentPerson, person, allPersons]);

  const handleConfirmDelete = () => {
    if (onDeletePerson) {
      onDeletePerson(person);
    }
    setShowDeleteConfirm(false);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-4 backdrop-blur-xs animate-fade-in overflow-y-auto">
        <div className="bg-slate-900 border border-slate-700 text-slate-100 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-start justify-between pb-4 border-b border-slate-800 gap-3">
            <div className="flex items-center space-x-4">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl shadow-inner ${
                  person.gender === 'male' ? 'bg-blue-900 text-blue-200' : 'bg-rose-900 text-rose-200'
                }`}
              >
                {person.fullName.charAt(0)}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-lg text-white">{person.fullName}</span>
                  {person.nickname && (
                    <span className="text-xs text-slate-400">"{person.nickname}"</span>
                  )}
                </div>
                <div className="flex items-center space-x-2 text-xs text-slate-400 mt-0.5">
                  <span className="font-mono text-emerald-400 font-bold">{person.id}</span>
                  <span>•</span>
                  <span>Generasi ke-{person.generation}</span>
                  <span>•</span>
                  <span className="text-slate-300 font-medium">{person.gender === 'male' ? 'Lelaki' : 'Perempuan'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* EDIT BUTTON IN HEADER */}
              <button
                id={`modal-header-edit-btn-${person.id}`}
                type="button"
                onClick={() => setIsEditingPerson(true)}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition-all shadow-md cursor-pointer ${
                  editPerm.canEdit
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white ring-1 ring-emerald-400'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                }`}
                title={editPerm.canEdit ? `Edit Profil (${editPerm.relationLabel})` : 'Akses Edit Terhad (Hanya Admin / Keluarga Terdekat)'}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Profil</span>
                {!editPerm.canEdit && <Lock className="w-3 h-3 text-amber-400 ml-0.5" />}
              </button>

              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Badges & Edit Permission Status */}
          <div className="flex flex-wrap gap-2 text-xs">
            {editPerm.canEdit ? (
              <span className="flex items-center space-x-1 px-3 py-1 rounded-full bg-emerald-950 border border-emerald-500/50 text-emerald-300 font-semibold">
                <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Akses Edit: {editPerm.relationLabel}</span>
              </span>
            ) : (
              <span className="flex items-center space-x-1 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-400">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Akses Edit: Terhad kepada Keluarga Terdekat (Pasangan / Anak)</span>
              </span>
            )}

            {person.isVerified ? (
              <span className="flex items-center space-x-1 px-3 py-1 rounded-full bg-emerald-950/90 border border-emerald-700/60 text-emerald-300 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Status: Rekod Disahkan</span>
              </span>
            ) : (
              <span className="flex items-center space-x-1 px-3 py-1 rounded-full bg-amber-950/90 border border-amber-700/60 text-amber-300 font-semibold">
                <Clock className="w-3.5 h-3.5" />
                <span>Status: Menunggu Pengesahan</span>
              </span>
            )}

            {person.birthOrder && (
              <span className="px-3 py-1 rounded-full bg-blue-950 border border-blue-700/60 text-blue-300 font-semibold">
                Anak Ke-{person.birthOrder} {person.birthOrder === 1 ? '(Sulung)' : ''}
              </span>
            )}

            {person.isDeceased ? (
              <span className="px-3 py-1 rounded-full bg-rose-950 border border-rose-800 text-rose-300">
                Almarhum / Almarhumah {person.deathDate ? `(Tarikh Meninggal: ${person.deathDate})` : person.deathYear ? `(† ${person.deathYear})` : ''}
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                Tarikh Lahir: {person.birthDate || person.birthYear || 'T/D'}
              </span>
            )}
          </div>

          {/* Quick Relationship With Logged-in / Active Person */}
          {currentPersonRelationship?.rel && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <GitFork className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">
                    Pertalian dengan anda ({currentPerson?.fullName}):
                  </span>
                  <span className="font-bold text-white text-sm">
                    {currentPersonRelationship.rel.relationshipName}
                  </span>
                  {currentPersonRelationship.rel.traditionalHonorific && (
                    <span className="text-amber-300 ml-1.5 font-semibold text-xs">
                      • Panggilan: {currentPersonRelationship.rel.traditionalHonorific}
                    </span>
                  )}
                </div>
              </div>

              {currentPersonRelationship.mahram && (
                <span
                  className={`self-start sm:self-auto px-2.5 py-1 rounded-lg text-[11px] font-bold border shrink-0 ${
                    currentPersonRelationship.mahram.isMahram
                      ? 'bg-emerald-900/80 text-emerald-300 border-emerald-600'
                      : 'bg-rose-900/80 text-rose-300 border-rose-600'
                  }`}
                >
                  {currentPersonRelationship.mahram.isMahram ? '🛡️ Mahram' : '⚠️ Ajnabi'}
                </span>
              )}
            </div>
          )}

          {/* Action Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs font-semibold">
            <button
              id={`modal-action-edit-btn-${person.id}`}
              onClick={() => setIsEditingPerson(true)}
              className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer shadow-md"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Profil</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onNavigateToTab('search', { personBId: person.id });
              }}
              className="p-2.5 rounded-xl bg-emerald-900/60 hover:bg-emerald-800 border border-emerald-700/60 text-emerald-200 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Apa Hubungan?</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onNavigateToTab('print');
              }}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Profil</span>
            </button>
          </div>

          {/* Lineage & Kinship Links */}
          <div className="space-y-3 bg-slate-800/40 p-4 rounded-2xl border border-slate-800 text-xs">
            <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
              Pertalian Keturunan Langsung:
            </h4>

            {/* Parents */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-slate-400 w-24 shrink-0 font-medium">Ibu Bapa:</span>
              <div className="flex flex-wrap gap-1.5">
                {father ? (
                  <button
                    onClick={() => onSelectPerson(father)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-300 font-semibold cursor-pointer"
                  >
                    Bapa: {father.fullName}
                  </button>
                ) : (
                  <span className="text-slate-500 italic">Bapa tidak direkodkan</span>
                )}
                {mother ? (
                  <button
                    onClick={() => onSelectPerson(mother)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-300 font-semibold cursor-pointer"
                  >
                    Ibu: {mother.fullName}
                  </button>
                ) : (
                  <span className="text-slate-500 italic">Ibu tidak direkodkan</span>
                )}
              </div>
            </div>

            {/* Spouses */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-slate-400 w-24 shrink-0 font-medium">Pasangan:</span>
              <div className="flex flex-wrap gap-1.5">
                {spouses.length > 0 ? (
                  spouses.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => onSelectPerson(s)}
                      className="px-2.5 py-1 rounded-lg bg-purple-950 border border-purple-800 text-purple-300 font-semibold flex items-center space-x-1 cursor-pointer"
                    >
                      <Heart className="w-3 h-3 fill-rose-400 text-rose-400" />
                      <span>{s.fullName}</span>
                    </button>
                  ))
                ) : (
                  <span className="text-slate-500 italic">Belum direkodkan pasangan</span>
                )}
              </div>
            </div>

            {/* Children */}
            <div className="flex flex-col sm:flex-row sm:items-start gap-2">
              <span className="text-slate-400 w-24 shrink-0 font-medium pt-1">
                Anak-anak ({children.length}):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {children.length > 0 ? (
                  children.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => onSelectPerson(c)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center space-x-1 cursor-pointer"
                    >
                      <Baby className="w-3 h-3 text-emerald-400" />
                      <span>
                        {c.birthOrder ? `${c.birthOrder}. ` : ''}{c.fullName}
                      </span>
                    </button>
                  ))
                ) : (
                  <span className="text-slate-500 italic">Tiada rekod anak</span>
                )}
              </div>
            </div>

            {/* Siblings */}
            {siblings.length > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                <span className="text-slate-400 w-24 shrink-0 font-medium pt-1">
                  Adik Beradik:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {siblings.map((sib) => (
                    <button
                      key={sib.id}
                      onClick={() => onSelectPerson(sib)}
                      className="px-2.5 py-0.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[11px] cursor-pointer"
                    >
                      {sib.nickname || sib.fullName}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Contact & Biodata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {person.occupation && (
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center space-x-2">
                <Briefcase className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block">Pekerjaan / Bidang</span>
                  <span className="font-semibold text-white">{person.occupation}</span>
                </div>
              </div>
            )}

            {person.phone && (!person.isPhonePrivate || isAdmin || currentPerson?.id === person.id) && (
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center space-x-2">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block">No. Telefon</span>
                  <a href={`tel:${person.phone}`} className="font-semibold text-emerald-300 hover:underline">
                    {person.phone}
                  </a>
                </div>
              </div>
            )}

            {(person.address || person.city) && (
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center space-x-2 sm:col-span-2">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block">Alamat Terkini</span>
                  <span className="font-semibold text-white">{person.address || person.city}</span>
                </div>
              </div>
            )}
          </div>

          {person.bio && (
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700 text-xs text-slate-300 leading-relaxed">
              <span className="font-bold text-white block mb-1 text-[11px]">Catatan Biografi:</span>
              {person.bio}
            </div>
          )}

          {/* Admin Danger Zone Actions in Modal */}
          {isAdmin && !isRoot && (
            <div className="p-3.5 rounded-2xl bg-rose-950/30 border border-rose-900/60 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2 text-rose-300">
                <ShieldCheck className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Tindakan Pentadbir (Admin):</span>
              </div>
              <button
                type="button"
                id={`modal-delete-person-${person.id}`}
                onClick={() => setShowDeleteConfirm(true)}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Padam Rekod Waris Ini</span>
              </button>
            </div>
          )}

          {/* Delete Confirmation Popup inside Modal */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
              <div className="bg-slate-900 border border-rose-600 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-fade-in text-slate-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-base">Padam Rekod Waris?</h4>
                    <p className="text-xs text-rose-300">Tindakan ini tidak boleh diundur.</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-800 border border-slate-700 text-xs space-y-1">
                  <p><b>Nama:</b> {person.fullName}</p>
                  <p><b>ID:</b> {person.id} • <b>Generasi:</b> {person.generation}</p>
                  <p className="text-slate-400 pt-1 text-[11px]">
                    Hubungan anak ({children.length}) dan pasangan ({spouses.length}) akan dinyahpaut secara selamat.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
                  >
                    [ Batal ]
                  </button>
                  <button
                    type="button"
                    id="confirm-modal-delete-btn"
                    onClick={handleConfirmDelete}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold cursor-pointer flex items-center space-x-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>[ Sahkan Padam ]</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="pt-2 flex items-center justify-between border-t border-slate-800">
            <button
              onClick={() => setIsEditingPerson(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-1.5 cursor-pointer shadow-md"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Profil Waris</span>
            </button>

            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>

      {/* Edit Person Modal */}
      {isEditingPerson && (
        <EditPersonModal
          person={person}
          isOpen={isEditingPerson}
          onClose={() => setIsEditingPerson(false)}
          allPersons={allPersons}
          currentPerson={currentPerson}
          isAdmin={isAdmin}
          userSession={userSession}
          onUpdatePersons={(updated) => {
            if (onUpdatePersons) {
              onUpdatePersons(updated);
            }
          }}
          onSavedPerson={(up) => {
            if (onSelectPerson) {
              onSelectPerson(up);
            }
          }}
          driveConfig={driveConfig}
          onUpdateDriveConfig={onUpdateDriveConfig}
        />
      )}
    </>
  );
};
