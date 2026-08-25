import React, { useState, useEffect } from 'react';
import { Person, UserSession, GoogleDriveConfig } from '../types/family';
import { storageService } from '../services/storageService';
import {
  X,
  Edit3,
  Save,
  ShieldCheck,
  ShieldAlert,
  User,
  Users,
  GitBranch,
  Calendar,
  MapPin,
  Briefcase,
  Phone,
  Lock,
  Cloud,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  XCircle,
  FolderCheck,
  Clock,
  Heart,
} from 'lucide-react';

interface EditPersonModalProps {
  person: Person | null;
  isOpen: boolean;
  onClose: () => void;
  allPersons: Person[];
  currentPerson: Person | null;
  isAdmin: boolean;
  userSession: UserSession;
  onUpdatePersons: (persons: Person[]) => void;
  onSavedPerson?: (updatedPerson: Person) => void;
  driveConfig?: GoogleDriveConfig;
  onUpdateDriveConfig?: (config: GoogleDriveConfig) => void;
}

// AI Helper for Date of Birth & Age analysis
function getAiBirthAnalysis(birthDateStr: string) {
  if (!birthDateStr) return null;
  const dateObj = new Date(birthDateStr);
  if (isNaN(dateObj.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - dateObj.getFullYear();
  const m = today.getMonth() - dateObj.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dateObj.getDate())) {
    age--;
  }

  let ageCategory = 'Dewasa';
  if (age < 2) ageCategory = 'Bayi';
  else if (age < 13) ageCategory = 'Kanak-kanak';
  else if (age < 20) ageCategory = 'Remaja';
  else if (age < 60) ageCategory = 'Dewasa';
  else ageCategory = 'Warga Emas';

  const formattedDate = dateObj.toLocaleDateString('ms-MY', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return {
    age: Math.max(0, age),
    year: dateObj.getFullYear(),
    category: ageCategory,
    formattedDate,
  };
}

export const EditPersonModal: React.FC<EditPersonModalProps> = ({
  person,
  isOpen,
  onClose,
  allPersons,
  currentPerson,
  isAdmin,
  userSession,
  onUpdatePersons,
  onSavedPerson,
  driveConfig = storageService.getDriveConfig(),
  onUpdateDriveConfig,
}) => {
  const [formData, setFormData] = useState({
    fullName: '',
    nickname: '',
    gender: 'male' as 'male' | 'female',
    relationToFounder: 'ANAK' as 'ANAK' | 'CUCU' | 'CICIT' | 'PIUT' | 'PIUT_PIUT' | 'PASANGAN' | 'PENGASAS' | 'LAIN',
    birthOrder: '1',
    parentId: '',
    spouseName: '',
    birthDate: '',
    deathDate: '',
    occupation: '',
    phone: '',
    isPhonePrivate: false,
    address: '',
    bio: '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [syncDetails, setSyncDetails] = useState<{
    folderId: string;
    timestamp: string;
    filename?: string;
  } | null>(null);

  // Check user permission
  const permissionCheck = storageService.canEditPerson(person, currentPerson, isAdmin);

  // Check if person is root founder (Mamat bin Ismail or Hafsah binti Ismail)
  const isRootFounder = Boolean(
    person && (
      person.id === 'WMH-000001' ||
      person.id === 'WMH-000002' ||
      person.relationToFounder === 'PENGASAS' ||
      person.generation === 1 ||
      person.fullName.toLowerCase().includes('mamat bin ismail') ||
      person.fullName.toLowerCase().includes('hafsah binti ismail')
    )
  );

  // Populate form when person changes
  useEffect(() => {
    if (person) {
      const spouseNames = (person.spouseIds || [])
        .map((sId) => allPersons.find((p) => p.id === sId)?.fullName)
        .filter(Boolean)
        .join(', ');

      const defaultRelation = person.relationToFounder || (
        person.generation === 1 ? 'PENGASAS' :
        person.generation === 2 ? 'ANAK' :
        person.generation === 3 ? 'CUCU' :
        person.generation === 4 ? 'CICIT' :
        person.generation === 5 ? 'PIUT' :
        person.generation === 6 ? 'PIUT_PIUT' : 'ANAK'
      );

      const effectiveParentId = person.fatherId || person.motherId || '';

      setFormData({
        fullName: person.fullName || '',
        nickname: person.nickname || '',
        gender: person.gender || 'male',
        relationToFounder: defaultRelation,
        birthOrder: person.birthOrder ? String(person.birthOrder) : '1',
        parentId: effectiveParentId,
        spouseName: spouseNames,
        birthDate: person.birthDate || (person.birthYear ? `${person.birthYear}-01-01` : ''),
        deathDate: person.deathDate || '',
        occupation: person.occupation || '',
        phone: person.phone || '',
        isPhonePrivate: person.isPhonePrivate ?? false,
        address: person.address || person.city || '',
        bio: person.bio || '',
      });

      setSuccessMessage('');
      setErrorMessage('');
      setSyncDetails(null);
    }
  }, [person, allPersons]);

  if (!isOpen || !person) return null;

  // Potential Parent candidates if relation is not ANAK
  const candidateParents = allPersons.filter((p) => {
    if (p.id === person.id) return false;
    if (formData.relationToFounder === 'ANAK') return false;
    const targetGen = formData.relationToFounder === 'CUCU' ? 2 :
                      formData.relationToFounder === 'CICIT' ? 3 :
                      formData.relationToFounder === 'PIUT' ? 4 : 5;
    return p.generation === targetGen;
  });

  const aiBirthInfo = getAiBirthAnalysis(formData.birthDate);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      setErrorMessage('Sila masukkan nama penuh.');
      return;
    }

    if (!permissionCheck.canEdit) {
      setErrorMessage(permissionCheck.reason || 'Tiada kebenaran untuk mengedit profil ini.');
      return;
    }

    setIsSaving(true);
    setErrorMessage('');

    try {
      let updatedPersonsList = [...allPersons];

      // Calculate generation
      let newGen = person.generation;
      let newFatherId = person.fatherId;
      let newMotherId = person.motherId;

      if (isRootFounder) {
        newGen = 1;
        newFatherId = null;
        newMotherId = null;
      } else if (formData.relationToFounder === 'ANAK') {
        newGen = 2;
        newFatherId = 'WMH-000001';
        newMotherId = 'WMH-000002';
      } else if (formData.relationToFounder === 'PASANGAN') {
        // Keep existing gen
      } else {
        newGen = storageService.getGenerationFromRelation(formData.relationToFounder);
        if (formData.parentId) {
          const parentObj = allPersons.find((p) => p.id === formData.parentId);
          if (parentObj) {
            if (parentObj.gender === 'male') {
              newFatherId = parentObj.id;
              newMotherId = parentObj.spouseIds?.[0] || null;
            } else {
              newMotherId = parentObj.id;
              newFatherId = parentObj.spouseIds?.[0] || null;
            }
            newGen = parentObj.generation + 1;
          }
        }
      }

      // Check Circular Parent Relation
      if (newFatherId && storageService.isCircularParent(person.id, newFatherId, allPersons)) {
        setErrorMessage('Ralat: Struktur pertalian ibu bapa ini mencetuskan pusingan tidak sah.');
        setIsSaving(false);
        return;
      }

      // Handle spouse names / linking
      let currentSpouseIds = [...(person.spouseIds || [])];
      if (formData.spouseName.trim()) {
        const spouseNameClean = formData.spouseName.trim();
        const existingSpouse = allPersons.find(
          (p) => p.fullName.toLowerCase() === spouseNameClean.toLowerCase() && p.id !== person.id
        );

        if (existingSpouse) {
          if (!currentSpouseIds.includes(existingSpouse.id)) {
            currentSpouseIds.push(existingSpouse.id);
          }
          updatedPersonsList = updatedPersonsList.map((p) => {
            if (p.id === existingSpouse.id) {
              return {
                ...p,
                spouseIds: Array.from(new Set([...(p.spouseIds || []), person.id])),
              };
            }
            return p;
          });
        } else if (!currentSpouseIds.length) {
          // Create new spouse
          const spouseId = storageService.generateNextPersonId(updatedPersonsList);
          const spousePerson: Person = {
            id: spouseId,
            fullName: spouseNameClean,
            gender: formData.gender === 'male' ? 'female' : 'male',
            generation: newGen,
            relationToFounder: 'PASANGAN',
            spouseIds: [person.id],
            childrenIds: [],
            isDeceased: false,
            isVerified: Boolean(isAdmin),
            createdAt: new Date().toISOString(),
          };
          currentSpouseIds.push(spouseId);
          updatedPersonsList.push(spousePerson);
        }
      }

      const parsedBirthYear = formData.birthDate ? new Date(formData.birthDate).getFullYear() : person.birthYear;
      const isDeceased = Boolean(formData.deathDate && formData.deathDate.trim() !== '');
      const parsedDeathYear = isDeceased ? new Date(formData.deathDate).getFullYear() : undefined;

      const updatedPerson: Person = {
        ...person,
        fullName: formData.fullName.trim(),
        nickname: formData.nickname.trim() || undefined,
        gender: formData.gender,
        generation: isRootFounder ? 1 : newGen,
        relationToFounder: isRootFounder ? 'PENGASAS' : formData.relationToFounder,
        birthOrder: isRootFounder ? undefined : (formData.birthOrder ? Number(formData.birthOrder) : person.birthOrder),
        fatherId: isRootFounder ? null : newFatherId,
        motherId: isRootFounder ? null : newMotherId,
        spouseIds: currentSpouseIds,
        birthDate: formData.birthDate.trim() || undefined,
        birthYear: !isNaN(Number(parsedBirthYear)) ? Number(parsedBirthYear) : person.birthYear,
        isDeceased,
        deathDate: isDeceased ? formData.deathDate.trim() : undefined,
        deathYear: parsedDeathYear,
        occupation: formData.occupation.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        isPhonePrivate: formData.isPhonePrivate,
        address: formData.address.trim() || undefined,
        city: formData.address.trim() || undefined,
        bio: formData.bio.trim() || undefined,
        updatedAt: new Date().toISOString(),
      };

      updatedPersonsList = updatedPersonsList.map((p) => (p.id === person.id ? updatedPerson : p));

      // Re-sort parent's children array if parent assigned
      if (newFatherId || newMotherId) {
        updatedPersonsList = updatedPersonsList.map((p) => {
          if (p.id === newFatherId || p.id === newMotherId) {
            const rawKids = Array.from(new Set([...(p.childrenIds || []), person.id]));
            const sortedKids = storageService.sortChildrenIds(rawKids, updatedPersonsList);
            return {
              ...p,
              childrenIds: sortedKids,
            };
          }
          return p;
        });
      }

      // Save to storage
      storageService.savePersons(updatedPersonsList);
      onUpdatePersons(updatedPersonsList);
      if (onSavedPerson) {
        onSavedPerson(updatedPerson);
      }

      storageService.addAuditLog(
        'KEMASKINI_WARIS',
        `Mengemaskini profil: ${updatedPerson.fullName} (${updatedPerson.id}, Gen ${updatedPerson.generation}).`,
        userSession.userName || (isAdmin ? 'Admin' : 'Pengguna'),
        updatedPerson.fullName
      );

      // Auto Sync with Google Drive
      const syncResult = await storageService.syncWithDrive(`Kemaskini profil ${updatedPerson.fullName}`);
      if (onUpdateDriveConfig) {
        onUpdateDriveConfig(syncResult.driveConfig);
      }

      setSyncDetails({
        folderId: syncResult.folderId,
        timestamp: syncResult.timestamp,
        filename: syncResult.snapshot.filename,
      });

      setSuccessMessage('data berjaya disimpan');
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setErrorMessage('Ralat ketika menyimpan perubahan.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/75 p-3 sm:p-4 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 text-slate-100 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg shadow-inner ${
                person.gender === 'male' ? 'bg-blue-900 text-blue-200' : 'bg-rose-900 text-rose-200'
              }`}
            >
              {person.fullName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center space-x-2">
                  <Edit3 className="w-4 h-4 text-emerald-400" />
                  <span>Kemaskini Profil: {person.fullName}</span>
                </h3>
              </div>
              <div className="flex items-center space-x-2 text-xs text-slate-400 mt-0.5">
                <span className="font-mono text-emerald-400 font-bold">{person.id}</span>
                <span>•</span>
                <span>Generasi {person.generation}</span>
                <span>•</span>
                {permissionCheck.canEdit ? (
                  <span className="text-emerald-300 font-semibold flex items-center space-x-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{permissionCheck.relationLabel}</span>
                  </span>
                ) : (
                  <span className="text-rose-400 font-semibold flex items-center space-x-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                    <span>Akses Terhad</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Permission Denied Notice for Regular Users */}
        {!permissionCheck.canEdit && (
          <div className="p-5 rounded-2xl bg-amber-950/60 border border-amber-500/80 text-amber-200 text-xs space-y-3 animate-fade-in">
            <div className="flex items-center space-x-2 text-amber-300 font-bold text-sm">
              <Lock className="w-5 h-5 text-amber-400" />
              <span>Had Akses Penyuntingan Profil</span>
            </div>
            <p className="leading-relaxed">
              {permissionCheck.reason}
            </p>
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300 space-y-1">
              <p className="font-semibold text-white">Peraturan Suntingan Sistem:</p>
              <p>• <b>Admin:</b> Boleh mengedit mana-mana profil waris dalam sistem.</p>
              <p>• <b>Pengguna Biasa:</b> Boleh mengedit profil diri sendiri, pasangan, dan anak-anak dalam susur galur keluarga.</p>
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold cursor-pointer"
              >
                Kembali
              </button>
            </div>
          </div>
        )}

        {/* If Permission Granted: Show Full Edit Form */}
        {permissionCheck.canEdit && (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Success Alert */}
            {successMessage && (
              <div className="p-4 rounded-2xl bg-emerald-950/90 border-2 border-emerald-500 text-slate-100 text-xs shadow-xl space-y-2 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span className="font-bold text-white text-sm capitalize">{successMessage}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSuccessMessage('')}
                    className="text-slate-400 hover:text-white px-2 py-1 text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
                {syncDetails && (
                  <p className="text-[11px] text-emerald-300">
                    Disegerakkan ke Google Drive (Folder: {syncDetails.folderId}) pada {syncDetails.timestamp}.
                  </p>
                )}
              </div>
            )}

            {/* Error Alert */}
            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-rose-950 border border-rose-500 text-rose-200 text-xs flex items-center space-x-2 animate-fade-in">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Susur Galur / Lineage Section (Dikecualikan bagi Pengasas Asal: Mamat bin Ismail & Hafsah binti Ismail) */}
            {!isRootFounder && (
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700 space-y-3">
                <h4 className="font-bold text-emerald-400 flex items-center space-x-2 text-xs">
                  <GitBranch className="w-4 h-4" />
                  <span>Kedudukan Dalam Susur Galur Salasilah</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      Hubungan dengan Mamat + Hafsah:
                    </label>
                    <select
                      value={formData.relationToFounder}
                      onChange={(e) => setFormData({ ...formData, relationToFounder: e.target.value as any })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:border-emerald-500 focus:outline-hidden"
                    >
                      <option value="ANAK">Anak (Generasi 2)</option>
                      <option value="CUCU">Cucu (Generasi 3)</option>
                      <option value="CICIT">Cicit (Generasi 4)</option>
                      <option value="PIUT">Piut (Generasi 5)</option>
                      <option value="PIUT_PIUT">Piut-piut / Onyang (Generasi 6)</option>
                      <option value="PASANGAN">Pasangan / Menantu</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      Anak Yang Ke- (Susunan Kelahiran):
                    </label>
                    <select
                      value={formData.birthOrder}
                      onChange={(e) => setFormData({ ...formData, birthOrder: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:border-emerald-500 focus:outline-hidden"
                    >
                      {Array.from({ length: 15 }, (_, i) => i + 1).map((num) => (
                        <option key={num} value={num}>
                          {num === 1 ? 'Anak Pertama (Sulung) - Ke-1' : `Anak Ke-${num}`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {formData.relationToFounder !== 'ANAK' && formData.relationToFounder !== 'PASANGAN' && candidateParents.length > 0 && (
                  <div className="pt-2 border-t border-slate-700/60">
                    <label className="block font-semibold text-slate-300 mb-1">
                      Pilih Ibu / Bapa (Susur Galur Generasi Sebelum):
                    </label>
                    <select
                      value={formData.parentId}
                      onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:border-emerald-500 focus:outline-hidden"
                    >
                      <option value="">-- Pilih Ibu / Bapa --</option>
                      {candidateParents.map((parent) => (
                        <option key={parent.id} value={parent.id}>
                          {parent.fullName} ({parent.id} • Gen {parent.generation})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Personal Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Nama Penuh: *</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Nama Panggilan / Gelaran:</label>
                <input
                  type="text"
                  value={formData.nickname}
                  onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Jantina:</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:border-emerald-500 focus:outline-hidden"
                >
                  <option value="male">Lelaki</option>
                  <option value="female">Perempuan</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Nama Pasangan:</label>
                <input
                  type="text"
                  placeholder="Contoh: Siti Fatimah"
                  value={formData.spouseName}
                  onChange={(e) => setFormData({ ...formData, spouseName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              {/* 1. TARIKH LAHIR (AI) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-300 flex items-center space-x-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Tarikh Lahir (AI):</span>
                  </label>
                  {aiBirthInfo && (
                    <span className="text-[10px] text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-600/40">
                      Umur: <b>{aiBirthInfo.age} thn</b> ({aiBirthInfo.category})
                    </span>
                  )}
                </div>
                <input
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:border-emerald-500 focus:outline-hidden"
                />
                {aiBirthInfo && (
                  <p className="text-[10px] text-slate-400 mt-1">
                    Tarikh: <span className="text-slate-200">{aiBirthInfo.formattedDate}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Pekerjaan / Bidang:</label>
                <input
                  type="text"
                  placeholder="Contoh: Jurutera, Guru..."
                  value={formData.occupation}
                  onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">No. Telefon:</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:border-emerald-500 focus:outline-hidden"
                />
                <label className="flex items-center space-x-2 mt-1.5 text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPhonePrivate}
                    onChange={(e) => setFormData({ ...formData, isPhonePrivate: e.target.checked })}
                    className="rounded bg-slate-800 border-slate-700 text-emerald-500 cursor-pointer"
                  />
                  <span>Kekalkan No. Telefon Rahsia</span>
                </label>
              </div>

              {/* 2. ALAMAT TERKINI */}
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-300 mb-1 flex items-center space-x-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Alamat Terkini:</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: No. 15, Jalan Melati 3, Kampung Losong Haji Su, 21000 Kuala Terengganu"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:border-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* 4. TARIKH MENINGGAL */}
            <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-300 flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5 text-rose-400" />
                  <span>Tarikh Meninggal:</span>
                </label>
                {formData.deathDate && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, deathDate: '' })}
                    className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center space-x-1 cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Padam (Tandai Masih Hidup)</span>
                  </button>
                )}
              </div>
              <input
                type="date"
                value={formData.deathDate}
                onChange={(e) => setFormData({ ...formData, deathDate: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:border-rose-500 focus:outline-hidden"
              />
              <p className="text-[10px] text-slate-400">
                {formData.deathDate ? (
                  <span className="text-rose-300 font-semibold">
                    Status: Almarhum / Almarhumah (Meninggal pada {formData.deathDate})
                  </span>
                ) : (
                  <span>Biarkan kosong jika masih hidup. Profil akan ditandai sebagai Almarhum jika tarikh diisi.</span>
                )}
              </p>
            </div>

            {/* Biografi */}
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Catatan Biografi / Nota Ringkas:</label>
              <textarea
                rows={2}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:border-emerald-500 focus:outline-hidden"
                placeholder="Catatan mengenai waris..."
              />
            </div>

            {/* Sync Footnote */}
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between text-slate-300 text-[11px]">
              <div className="flex items-center space-x-2">
                <Cloud className="w-4 h-4 text-emerald-400" />
                <span>Simpanan disegerakkan ke Google Drive (<b>{driveConfig.folderId}</b>).</span>
              </div>
              <span className="text-emerald-400 font-bold">Auto-Sync On</span>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Simpan Perubahan</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
