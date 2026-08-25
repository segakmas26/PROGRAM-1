import React, { useState, useEffect } from 'react';
import { Person, UserSession, GoogleDriveConfig } from '../types/family';
import { storageService } from '../services/storageService';
import {
  User,
  UserPlus,
  ShieldCheck,
  Clock,
  Heart,
  AlertCircle,
  CheckCircle2,
  Lock,
  Save,
  TreeDeciduous,
  Cloud,
  RefreshCw,
  FolderCheck,
  Calendar,
  Sparkles,
  GitBranch,
  Search,
  MapPin,
  XCircle,
} from 'lucide-react';

interface MyProfileViewProps {
  allPersons: Person[];
  currentPerson: Person | null;
  userSession: UserSession;
  setUserSession: (session: UserSession) => void;
  onUpdatePersons: (persons: Person[]) => void;
  onOpenPersonDetail: (person: Person) => void;
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

export const MyProfileView: React.FC<MyProfileViewProps> = ({
  allPersons,
  currentPerson,
  userSession,
  setUserSession,
  onUpdatePersons,
  onOpenPersonDetail,
  driveConfig = storageService.getDriveConfig(),
  onUpdateDriveConfig,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'PROFILE' | 'ADD_MEMBER'>('PROFILE');
  const [successMessage, setSuccessMessage] = useState('');
  const [syncDetails, setSyncDetails] = useState<{
    folderId: string;
    timestamp: string;
    filename?: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Self Profile Form State
  const [formData, setFormData] = useState({
    fullName: currentPerson?.fullName || '',
    nickname: currentPerson?.nickname || '',
    birthDate: currentPerson?.birthDate || (currentPerson?.birthYear ? `${currentPerson.birthYear}-01-01` : ''),
    birthOrder: currentPerson?.birthOrder ? String(currentPerson.birthOrder) : '1',
    relationToFounder: currentPerson?.relationToFounder || (currentPerson?.generation === 2 ? 'ANAK' : currentPerson?.generation === 3 ? 'CUCU' : currentPerson?.generation === 4 ? 'CICIT' : currentPerson?.generation === 5 ? 'PIUT' : currentPerson?.generation === 6 ? 'PIUT_PIUT' : 'ANAK'),
    spouseName: '',
    deathDate: currentPerson?.deathDate || '',
    phone: currentPerson?.phone || '',
    occupation: currentPerson?.occupation || '',
    address: currentPerson?.address || currentPerson?.city || '',
    bio: currentPerson?.bio || '',
    isPhonePrivate: currentPerson?.isPhonePrivate ?? false,
  });

  const isSelfRootFounder = Boolean(
    currentPerson && (
      currentPerson.id === 'WMH-000001' ||
      currentPerson.id === 'WMH-000002' ||
      currentPerson.relationToFounder === 'PENGASAS' ||
      currentPerson.generation === 1 ||
      currentPerson.fullName.toLowerCase().includes('mamat bin ismail') ||
      currentPerson.fullName.toLowerCase().includes('hafsah binti ismail')
    )
  );

  // Resolve self parents and children for rich interactive profile overview
  const selfFather = React.useMemo(() => {
    if (!currentPerson) return null;
    if (currentPerson.fatherId) {
      return allPersons.find((p) => p.id === currentPerson.fatherId) || null;
    }
    if (currentPerson.generation === 2) {
      return allPersons.find((p) => p.id === 'WMH-000001') || null;
    }
    return null;
  }, [currentPerson?.fatherId, currentPerson?.generation, allPersons]);

  const selfMother = React.useMemo(() => {
    if (!currentPerson) return null;
    if (currentPerson.motherId) {
      return allPersons.find((p) => p.id === currentPerson.motherId) || null;
    }
    if (currentPerson.generation === 2) {
      return allPersons.find((p) => p.id === 'WMH-000002') || null;
    }
    return null;
  }, [currentPerson?.motherId, currentPerson?.generation, allPersons]);

  const selfSpouses = React.useMemo(() => {
    if (!currentPerson?.spouseIds?.length) return [];
    return allPersons.filter((p) => currentPerson.spouseIds?.includes(p.id));
  }, [currentPerson?.spouseIds, allPersons]);

  const selfChildren = React.useMemo(() => {
    if (!currentPerson) return [];
    const directChildren = (currentPerson.childrenIds || [])
      .map((id) => allPersons.find((p) => p.id === id))
      .filter((p): p is Person => Boolean(p));
    
    // Also include anyone who points to currentPerson as father or mother
    const reverseChildren = allPersons.filter(
      (p) => (p.fatherId === currentPerson.id || p.motherId === currentPerson.id) && !currentPerson.childrenIds?.includes(p.id)
    );

    const combined = [...directChildren, ...reverseChildren];
    return storageService.sortChildrenIds(combined.map((c) => c.id), allPersons)
      .map((id) => allPersons.find((p) => p.id === id))
      .filter((p): p is Person => Boolean(p));
  }, [currentPerson?.id, currentPerson?.childrenIds, allPersons]);

  // Keep form data synchronized if currentPerson prop changes
  useEffect(() => {
    if (currentPerson) {
      const spouseNames = (currentPerson.spouseIds || [])
        .map((sId) => allPersons.find((p) => p.id === sId)?.fullName)
        .filter(Boolean)
        .join(', ');

      const defaultRelation = currentPerson.relationToFounder || (
        currentPerson.generation === 1 ? 'PENGASAS' :
        currentPerson.generation === 2 ? 'ANAK' :
        currentPerson.generation === 3 ? 'CUCU' :
        currentPerson.generation === 4 ? 'CICIT' :
        currentPerson.generation === 5 ? 'PIUT' :
        currentPerson.generation === 6 ? 'PIUT_PIUT' : 'ANAK'
      );

      setFormData({
        fullName: currentPerson.fullName || '',
        nickname: currentPerson.nickname || '',
        birthDate: currentPerson.birthDate || (currentPerson.birthYear ? `${currentPerson.birthYear}-01-01` : ''),
        birthOrder: currentPerson.birthOrder ? String(currentPerson.birthOrder) : '1',
        relationToFounder: defaultRelation,
        spouseName: spouseNames,
        deathDate: currentPerson.deathDate || '',
        phone: currentPerson.phone || '',
        occupation: currentPerson.occupation || '',
        address: currentPerson.address || currentPerson.city || '',
        bio: currentPerson.bio || '',
        isPhonePrivate: currentPerson.isPhonePrivate ?? false,
      });
    }
  }, [currentPerson?.id, allPersons]);

  // Add Member Form State
  const [newFullName, setNewFullName] = useState('');
  const [newNickname, setNewNickname] = useState('');
  const [newGender, setNewGender] = useState<'male' | 'female'>('male');
  const [newRelationToFounder, setNewRelationToFounder] = useState<'ANAK' | 'CUCU' | 'CICIT' | 'PIUT' | 'PIUT_PIUT'>('CUCU');
  const [newBirthOrder, setNewBirthOrder] = useState<number>(1);
  const [newSpouseName, setNewSpouseName] = useState('');
  const [newDeathDate, setNewDeathDate] = useState('');
  const [newBirthDate, setNewBirthDate] = useState<string>('');
  const [newOccupation, setNewOccupation] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newBio, setNewBio] = useState('');
  const [selectedParentId, setSelectedParentId] = useState<string>('');

  // Parent candidate list based on selected relation to Mamat + Hafsah
  const candidateParents = React.useMemo(() => {
    if (newRelationToFounder === 'ANAK') {
      return [];
    }
    const targetGen = newRelationToFounder === 'CUCU' ? 2 :
                      newRelationToFounder === 'CICIT' ? 3 :
                      newRelationToFounder === 'PIUT' ? 4 : 5;
    return allPersons.filter((p) => p.generation === targetGen);
  }, [newRelationToFounder, allPersons]);

  // Auto select default parent when candidate list changes
  useEffect(() => {
    if (candidateParents.length > 0) {
      const userAsParent = candidateParents.find((p) => p.id === currentPerson?.id);
      setSelectedParentId(userAsParent ? userAsParent.id : candidateParents[0].id);
    } else {
      setSelectedParentId('');
    }
  }, [newRelationToFounder, candidateParents.length, currentPerson?.id]);

  // Duplicate Check
  const potentialDuplicates = newFullName.trim().length >= 3
    ? storageService.findPotentialDuplicates(newFullName, allPersons)
    : [];

  // Live AI Birth Analysis for Self Profile & New Member
  const selfAiBirthInfo = getAiBirthAnalysis(formData.birthDate);
  const newMemberAiBirthInfo = getAiBirthAnalysis(newBirthDate);

  // SMART SAVE PROFILE
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPerson) return;

    setIsSaving(true);
    setErrorMessage('');

    try {
      let updatedPersonsList = [...allPersons];

      // Handle spouse linkage if provided
      let currentSpouseIds = [...(currentPerson.spouseIds || [])];
      if (formData.spouseName.trim()) {
        const spouseNameClean = formData.spouseName.trim();
        let existingSpouse = allPersons.find(
          (p) => p.fullName.toLowerCase() === spouseNameClean.toLowerCase() && p.id !== currentPerson.id
        );

        if (existingSpouse) {
          if (!currentSpouseIds.includes(existingSpouse.id)) {
            currentSpouseIds.push(existingSpouse.id);
          }
          updatedPersonsList = updatedPersonsList.map((p) => {
            if (p.id === existingSpouse!.id) {
              return {
                ...p,
                spouseIds: Array.from(new Set([...(p.spouseIds || []), currentPerson.id])),
              };
            }
            return p;
          });
        }
      }

      // Calculate birthYear from birthDate if available
      const parsedBirthYear = formData.birthDate ? new Date(formData.birthDate).getFullYear() : currentPerson.birthYear;
      const isDeceased = Boolean(formData.deathDate && formData.deathDate.trim() !== '');
      const parsedDeathYear = isDeceased ? new Date(formData.deathDate).getFullYear() : undefined;

      updatedPersonsList = updatedPersonsList.map((p) => {
        if (p.id === currentPerson.id) {
          return {
            ...p,
            fullName: formData.fullName.trim() || p.fullName,
            nickname: formData.nickname.trim() || p.nickname,
            generation: isSelfRootFounder ? 1 : p.generation,
            birthDate: formData.birthDate.trim() || undefined,
            birthYear: !isNaN(Number(parsedBirthYear)) ? Number(parsedBirthYear) : p.birthYear,
            birthOrder: isSelfRootFounder ? undefined : (formData.birthOrder ? Number(formData.birthOrder) : p.birthOrder),
            relationToFounder: isSelfRootFounder ? 'PENGASAS' : (formData.relationToFounder as any),
            spouseIds: currentSpouseIds,
            isDeceased,
            deathDate: isDeceased ? formData.deathDate.trim() : undefined,
            deathYear: parsedDeathYear,
            phone: formData.phone.trim(),
            occupation: formData.occupation.trim(),
            address: formData.address.trim(),
            city: formData.address.trim(),
            bio: formData.bio.trim(),
            isPhonePrivate: formData.isPhonePrivate,
            updatedAt: new Date().toISOString(),
          };
        }
        return p;
      });

      // Update in-memory state & localStorage
      onUpdatePersons(updatedPersonsList);
      storageService.savePersons(updatedPersonsList);
      storageService.addAuditLog(
        'KEMASKINI_WARIS',
        `Mengemaskini profil kendiri: ${formData.fullName}`,
        userSession.userName || 'Ahli Keluarga',
        formData.fullName
      );

      // Otomatis Sync dengan Google Drive yang Didaftarkan
      const syncResult = await storageService.syncWithDrive(`Kemaskini profil ${formData.fullName}`);
      if (onUpdateDriveConfig) {
        onUpdateDriveConfig(syncResult.driveConfig);
      }

      setSyncDetails({
        folderId: syncResult.folderId,
        timestamp: syncResult.timestamp,
        filename: syncResult.snapshot.filename,
      });

      // Pemakluman automatik
      setSuccessMessage('data berjaya disimpan');
    } catch (err: any) {
      console.error('Error saving profile and syncing drive:', err);
      setErrorMessage('Ralat ketika menyimpan atau menyelaraskan data.');
    } finally {
      setIsSaving(false);
    }
  };

  // SMART ADD NEW MEMBER IN LINEAGE
  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName.trim()) {
      setErrorMessage('Sila masukkan nama penuh waris.');
      return;
    }

    setIsSaving(true);
    setErrorMessage('');

    try {
      const nextId = storageService.generateNextPersonId(allPersons);
      let fatherId: string | null = null;
      let motherId: string | null = null;
      let calculatedGen = storageService.getGenerationFromRelation(newRelationToFounder);

      // Smart Parent Resolution:
      if (newRelationToFounder === 'ANAK') {
        fatherId = 'WMH-000001';
        motherId = 'WMH-000002';
        calculatedGen = 2;
      } else {
        if (selectedParentId) {
          const parentObj = allPersons.find((p) => p.id === selectedParentId);
          if (parentObj) {
            if (parentObj.gender === 'male') {
              fatherId = parentObj.id;
              motherId = parentObj.spouseIds?.[0] || null;
            } else {
              motherId = parentObj.id;
              fatherId = parentObj.spouseIds?.[0] || null;
            }
            calculatedGen = parentObj.generation + 1;
          }
        }
      }

      // Check Circular Parent Relation
      if (fatherId && storageService.isCircularParent(fatherId, nextId, allPersons)) {
        setErrorMessage('Ralat: Struktur pertalian ibu bapa ini mencetuskan pusingan tidak sah.');
        setIsSaving(false);
        return;
      }

      const parsedBirthYear = newBirthDate ? new Date(newBirthDate).getFullYear() : undefined;
      const isDeceased = Boolean(newDeathDate && newDeathDate.trim() !== '');
      const parsedDeathYear = isDeceased ? new Date(newDeathDate).getFullYear() : undefined;

      // Create new Person object
      const newPerson: Person = {
        id: nextId,
        fullName: newFullName.trim(),
        nickname: newNickname.trim() || undefined,
        gender: newGender,
        generation: calculatedGen,
        relationToFounder: newRelationToFounder,
        birthOrder: newBirthOrder,
        fatherId,
        motherId,
        spouseIds: [],
        childrenIds: [],
        birthDate: newBirthDate.trim() || undefined,
        birthYear: parsedBirthYear,
        isDeceased,
        deathDate: isDeceased ? newDeathDate.trim() : undefined,
        deathYear: parsedDeathYear,
        occupation: newOccupation.trim() || undefined,
        address: newAddress.trim() || undefined,
        city: newAddress.trim() || undefined,
        bio: newBio.trim() || undefined,
        isVerified: Boolean(userSession.isAdminUnlocked),
        createdAt: new Date().toISOString(),
      };

      let updatedList = [...allPersons, newPerson];

      // Handle spouse registration / linking if spouse name entered
      if (newSpouseName.trim()) {
        const spouseNameClean = newSpouseName.trim();
        const existingSpouse = allPersons.find(
          (p) => p.fullName.toLowerCase() === spouseNameClean.toLowerCase()
        );

        if (existingSpouse) {
          newPerson.spouseIds = [existingSpouse.id];
          updatedList = updatedList.map((p) => {
            if (p.id === existingSpouse.id) {
              return {
                ...p,
                spouseIds: Array.from(new Set([...(p.spouseIds || []), nextId])),
              };
            }
            return p;
          });
        } else {
          // Auto create spouse record as well
          const spouseId = storageService.generateNextPersonId(updatedList);
          const spousePerson: Person = {
            id: spouseId,
            fullName: spouseNameClean,
            gender: newGender === 'male' ? 'female' : 'male',
            generation: calculatedGen,
            relationToFounder: 'PASANGAN',
            spouseIds: [nextId],
            childrenIds: [],
            isDeceased: false,
            isVerified: Boolean(userSession.isAdminUnlocked),
            createdAt: new Date().toISOString(),
          };
          newPerson.spouseIds = [spouseId];
          updatedList.push(spousePerson);
        }
      }

      // Smart Two-Way Binding & Auto-Sorting in Parent's children list
      if (fatherId || motherId) {
        updatedList = updatedList.map((p) => {
          if (p.id === fatherId || p.id === motherId) {
            const rawChildren = Array.from(new Set([...(p.childrenIds || []), nextId]));
            const sortedChildren = storageService.sortChildrenIds(rawChildren, updatedList);
            return {
              ...p,
              childrenIds: sortedChildren,
            };
          }
          return p;
        });
      }

      // Save to local & state
      onUpdatePersons(updatedList);
      storageService.savePersons(updatedList);

      // If not admin, add to moderation queue
      if (!userSession.isAdminUnlocked) {
        storageService.addPendingSubmission({
          type: 'NEW_PERSON',
          submittedBy: userSession.userName || 'Ahli Keluarga',
          submittedByEmail: userSession.userEmail,
          data: newPerson,
          targetPersonId: fatherId || motherId || undefined,
          relationshipType: newRelationToFounder,
        });
      }

      storageService.addAuditLog(
        'TAMBAH_WARIS',
        `Menambah waris baru susur galur: ${newPerson.fullName} (${newPerson.id}, Gen ${newPerson.generation}, Anak ke-${newBirthOrder}, ${newRelationToFounder}).`,
        userSession.userName || 'Ahli Keluarga',
        newPerson.fullName
      );

      // Otomatis Sync dengan Google Drive
      const syncResult = await storageService.syncWithDrive(`Pendaftaran waris susur galur ${newPerson.fullName}`);
      if (onUpdateDriveConfig) {
        onUpdateDriveConfig(syncResult.driveConfig);
      }

      setSyncDetails({
        folderId: syncResult.folderId,
        timestamp: syncResult.timestamp,
        filename: syncResult.snapshot.filename,
      });

      setSuccessMessage('data berjaya disimpan');

      // Reset Form
      setNewFullName('');
      setNewNickname('');
      setNewBirthDate('');
      setNewSpouseName('');
      setNewDeathDate('');
      setNewOccupation('');
      setNewAddress('');
      setNewBio('');
    } catch (err: any) {
      console.error('Error adding member and syncing drive:', err);
      setErrorMessage('Ralat ketika menambah waris atau menyelaraskan Google Drive.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in max-w-4xl mx-auto">
      {/* Google Drive Live Registration & Sync Status Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Google Drive Berdaftar
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1.5"></span>
                Auto-Sync Aktif
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              Folder ID: <span className="text-emerald-400 font-bold">{driveConfig.folderId}</span>
            </p>
          </div>
        </div>

        <div className="text-right sm:border-l sm:border-slate-800 sm:pl-4 w-full sm:w-auto flex sm:flex-col justify-between items-center sm:items-end text-[11px] text-slate-400">
          <span>Penyelarasan Terakhir:</span>
          <span className="font-semibold text-slate-200">
            {driveConfig.lastBackupTime || 'Sedia untuk sinkronisasi'}
          </span>
        </div>
      </div>

      {/* Main Sub Tabs */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-2.5 shadow-md flex space-x-2">
        <button
          id="subtab-my-profile"
          onClick={() => setActiveSubTab('PROFILE')}
          className={`flex-1 py-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all cursor-pointer ${
            activeSubTab === 'PROFILE'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Profil Saya</span>
        </button>
        <button
          id="subtab-add-member"
          onClick={() => setActiveSubTab('ADD_MEMBER')}
          className={`flex-1 py-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all cursor-pointer ${
            activeSubTab === 'ADD_MEMBER'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Tambah Waris Baru</span>
        </button>
      </div>

      {/* Pemakluman 'Data Berjaya Disimpan' & Drive Sync Result Alert */}
      {successMessage && (
        <div
          id="profile-save-success-alert"
          className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-emerald-950/90 to-slate-900 border-2 border-emerald-500 text-slate-100 text-xs shadow-2xl space-y-2.5 animate-fade-in"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-white text-sm sm:text-base tracking-wide capitalize">
                  {successMessage}
                </h4>
                <p className="text-[11px] text-emerald-300">
                  Data telah disusun mengikut susur galur salasilah dan disegerakkan secara automatik ke Google Drive.
                </p>
              </div>
            </div>
            <button
              onClick={() => setSuccessMessage('')}
              className="text-slate-400 hover:text-white px-2 py-1 text-xs cursor-pointer"
            >
              ✕
            </button>
          </div>

          {syncDetails && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-emerald-900/60 text-[11px]">
              <div className="flex items-center space-x-1.5 text-slate-300">
                <FolderCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  <b>Drive Folder:</b> <span className="font-mono text-emerald-300">{syncDetails.folderId}</span>
                </span>
              </div>
              <div className="flex items-center space-x-1.5 text-slate-300">
                <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  <b>Masa Simpan:</b> {syncDetails.timestamp}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-950 border border-rose-500 text-rose-200 text-xs flex items-center space-x-2 animate-fade-in shadow-md">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* TAB 1: EDIT SELF PROFILE */}
      {activeSubTab === 'PROFILE' && currentPerson && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 gap-3">
            <div className="flex items-center space-x-4">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl shadow-inner ${
                  currentPerson.gender === 'male' ? 'bg-blue-900 text-blue-200' : 'bg-rose-900 text-rose-200'
                }`}
              >
                {currentPerson.fullName.charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{currentPerson.fullName}</h3>
                <p className="text-xs text-slate-400">
                  ID: <span className="text-emerald-400 font-mono">{currentPerson.id}</span> • Generasi {currentPerson.generation}
                  {currentPerson.birthOrder ? ` • Anak Ke-${currentPerson.birthOrder}` : ''}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => onOpenPersonDetail(currentPerson)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Lihat Paparan Salasilah
              </button>
            </div>
          </div>

          {/* Quick Lineage Links (Ibu Bapa, Pasangan & Anak-anak Terpapar Secara Automatik) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-3.5 text-xs">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-200 flex items-center space-x-2 text-xs">
                <GitBranch className="w-4 h-4 text-emerald-400" />
                <span>Pertalian Keluarga Langsung (Tersusun Secara Automatik):</span>
              </h4>
              <span className="text-[10px] text-slate-400 hidden sm:inline">
                Klik mana-mana nama untuk membuka profil lengkap
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* 1. IBU BAPA */}
              <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                  <span className="flex items-center space-x-1.5">
                    <User className="w-3.5 h-3.5 text-blue-400" />
                    <span>Ibu Bapa:</span>
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Gen {currentPerson.generation > 1 ? currentPerson.generation - 1 : 1}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {isSelfRootFounder ? (
                    <p className="text-[11px] text-emerald-400/90 italic">
                      Pengasas Utama Salasilah (Punca Keturunan)
                    </p>
                  ) : selfFather || selfMother ? (
                    <div className="space-y-1">
                      {selfFather && (
                        <button
                          type="button"
                          onClick={() => onOpenPersonDetail(selfFather)}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-700 border border-blue-900/60 text-blue-300 font-semibold flex items-center justify-between transition-colors cursor-pointer"
                        >
                          <span className="truncate">👨 Bapa: {selfFather.fullName}</span>
                          <span className="text-[10px] text-slate-400 shrink-0 ml-1">{selfFather.id}</span>
                        </button>
                      )}
                      {selfMother && (
                        <button
                          type="button"
                          onClick={() => onOpenPersonDetail(selfMother)}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-700 border border-rose-900/60 text-rose-300 font-semibold flex items-center justify-between transition-colors cursor-pointer"
                        >
                          <span className="truncate">👩 Ibu: {selfMother.fullName}</span>
                          <span className="text-[10px] text-slate-400 shrink-0 ml-1">{selfMother.id}</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">
                      Belum dipautkan rekod ibu bapa
                    </p>
                  )}
                </div>
              </div>

              {/* 2. PASANGAN */}
              <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                  <span className="flex items-center space-x-1.5">
                    <Heart className="w-3.5 h-3.5 text-rose-400" />
                    <span>Pasangan ({selfSpouses.length}):</span>
                  </span>
                </div>
                <div className="space-y-1">
                  {selfSpouses.length > 0 ? (
                    selfSpouses.map((spouse) => (
                      <button
                        key={spouse.id}
                        type="button"
                        onClick={() => onOpenPersonDetail(spouse)}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-700 border border-purple-900/60 text-purple-300 font-semibold flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <span className="truncate">💍 {spouse.fullName}</span>
                        <span className="text-[10px] text-slate-400 shrink-0 ml-1">{spouse.id}</span>
                      </button>
                    ))
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">
                      Belum direkodkan pasangan
                    </p>
                  )}
                </div>
              </div>

              {/* 3. ANAK-ANAK */}
              <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                  <span className="flex items-center space-x-1.5">
                    <TreeDeciduous className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Anak-anak ({selfChildren.length}):</span>
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Gen {currentPerson.generation + 1}
                  </span>
                </div>
                <div className="max-h-32 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                  {selfChildren.length > 0 ? (
                    selfChildren.map((kid) => (
                      <button
                        key={kid.id}
                        type="button"
                        onClick={() => onOpenPersonDetail(kid)}
                        className="w-full text-left px-2 py-1 rounded-lg bg-slate-900/90 hover:bg-slate-700 border border-slate-700/60 text-emerald-300 font-medium flex items-center justify-between transition-colors cursor-pointer text-[11px]"
                      >
                        <span className="truncate">
                          {kid.birthOrder ? `${kid.birthOrder}. ` : '• '}{kid.fullName}
                        </span>
                        <span className="text-[9px] text-slate-400 shrink-0 ml-1">
                          {kid.gender === 'male' ? 'L' : 'P'}
                        </span>
                      </button>
                    ))
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">
                      Belum direkodkan anak
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            {/* Essential Lineage Info (Dikecualikan bagi Pengasas Asal: Mamat bin Ismail & Hafsah binti Ismail) */}
            {!isSelfRootFounder && (
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700 space-y-3">
                <h4 className="font-bold text-emerald-400 flex items-center space-x-2 text-xs">
                  <GitBranch className="w-4 h-4" />
                  <span>Kedudukan Dalam Susur Galur Salasilah</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              </div>
            )}

            {/* Profile Particulars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Nama Penuh:</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
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
                  {selfAiBirthInfo && (
                    <span className="text-[10px] text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-600/40">
                      Umur: <b>{selfAiBirthInfo.age} tahun</b> ({selfAiBirthInfo.category})
                    </span>
                  )}
                </div>
                <input
                  id="self-profile-birthdate"
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:border-emerald-500 focus:outline-hidden"
                />
                {selfAiBirthInfo && (
                  <p className="text-[10px] text-slate-400 mt-1">
                    Tarikh diformat: <span className="text-slate-200 font-medium">{selfAiBirthInfo.formattedDate}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Pekerjaan / Bidang:</label>
                <input
                  type="text"
                  placeholder="Contoh: Pegawai Tadbir / Guru"
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
                  <span>Kekalkan No. Telefon Rahsia (Hanya untuk Admin)</span>
                </label>
              </div>

              {/* 2. ALAMAT TERKINI */}
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-300 mb-1 flex items-center space-x-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Alamat Terkini:</span>
                </label>
                <input
                  id="self-profile-address"
                  type="text"
                  placeholder="Contoh: No. 15, Jalan Melati 3, Kampung Losong Haji Su, 21000 Kuala Terengganu"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:border-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* 4. TARIKH MENINGGAL FIELD */}
            <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700 space-y-2">
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
                id="self-profile-deathdate"
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

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Catatan Biografi / Nota Ringkas:</label>
              <textarea
                rows={3}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:border-emerald-500 focus:outline-hidden"
                placeholder="Kongsi serba sedikit tentang diri anda atau pesanan untuk keturunan..."
              />
            </div>

            {/* Sync Information Footnote */}
            <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between text-slate-300 text-[11px]">
              <div className="flex items-center space-x-2">
                <Cloud className="w-4 h-4 text-emerald-400" />
                <span>
                  Simpanan akan disegerakkan secara automatik ke Google Drive (ID: <b>{driveConfig.folderId}</b>).
                </span>
              </div>
              <span className="text-emerald-400 font-bold">Auto-Sync On</span>
            </div>

            <div className="flex justify-end pt-2">
              <button
                id="btn-save-profile"
                type="submit"
                disabled={isSaving}
                className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-98 disabled:opacity-50 text-slate-950 font-extrabold text-xs sm:text-sm shadow-xl transition-all flex items-center space-x-2 cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Menyimpan & Menyegerak ke Drive...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Simpan Kemaskini Profil</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: SMART ADD NEW MEMBER IN LINEAGE */}
      {activeSubTab === 'ADD_MEMBER' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-emerald-400" />
                <span>Pendaftaran Ahli Salasilah (Penyusunan Pintar)</span>
              </h3>
              <span className="px-2.5 py-1 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-bold text-[11px] flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Susur Galur Automatik</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Pilih hubungan dengan Mamat + Hafsah, anak yang ke berapa, nama pasangan, dan tarikh meninggal (jika ada). Sistem akan menyusun profil ini ke dalam susur galur keluarga secara bijak.
            </p>
          </div>

          {/* Duplicate Detection Alert */}
          {potentialDuplicates.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-950/50 border border-amber-500 text-amber-200 text-xs space-y-2 animate-fade-in">
              <div className="flex items-center space-x-2 font-bold text-amber-300">
                <AlertCircle className="w-4 h-4" />
                <span>Amaran Potensi Rekod Pendua:</span>
              </div>
              <p>
                Sistem mengesan nama yang hampir serupa dalam pangkalan data. Adakah individu ini sudah wujud?
              </p>
              <div className="space-y-1 pt-1">
                {potentialDuplicates.map((dup) => (
                  <div key={dup.id} className="p-2 rounded-xl bg-slate-900/90 border border-slate-700 flex items-center justify-between text-white">
                    <div>
                      <b>{dup.fullName}</b> <span className="text-slate-400">({dup.id}, Gen {dup.generation})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onOpenPersonDetail(dup)}
                      className="px-2.5 py-1 rounded bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-bold cursor-pointer"
                    >
                      [ Guna Rekod Sedia Ada ]
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleCreateMember} className="space-y-4 text-xs">
            {/* SECTION 1: HUBUNGAN & SUSUR GALUR MAMAT + HAFSAH */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-4">
              <h4 className="font-bold text-white text-xs sm:text-sm flex items-center space-x-2 text-emerald-400">
                <GitBranch className="w-4 h-4" />
                <span>1. Susur Galur & Hubungan Keturunan</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* HUBUNGAN DENGAN MAMAT + HAFSAH */}
                <div>
                  <label className="block font-semibold text-slate-200 mb-1.5">
                    Hubungan dengan Mamat + Hafsah: *
                  </label>
                  <select
                    id="select-relation-to-founder"
                    value={newRelationToFounder}
                    onChange={(e) => setNewRelationToFounder(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-semibold focus:outline-hidden focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="ANAK">Anak (Generasi 2)</option>
                    <option value="CUCU">Cucu (Generasi 3)</option>
                    <option value="CICIT">Cicit (Generasi 4)</option>
                    <option value="PIUT">Piut (Generasi 5)</option>
                    <option value="PIUT_PIUT">Piut-piut / Onyang (Generasi 6)</option>
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {newRelationToFounder === 'ANAK' && 'Ibu Bapa Automatik: Tok Mamat (WMH-000001) & Tok Hafsah (WMH-000002).'}
                    {newRelationToFounder === 'CUCU' && 'Cucu kepada Mamat & Hafsah (Generasi 3).'}
                    {newRelationToFounder === 'CICIT' && 'Cicit kepada Mamat & Hafsah (Generasi 4).'}
                    {newRelationToFounder === 'PIUT' && 'Piut kepada Mamat & Hafsah (Generasi 5).'}
                    {newRelationToFounder === 'PIUT_PIUT' && 'Piut-piut kepada Mamat & Hafsah (Generasi 6).'}
                  </p>
                </div>

                {/* ANAK YANG KE (1-15) */}
                <div>
                  <label className="block font-semibold text-slate-200 mb-1.5">
                    Anak Yang Ke-: *
                  </label>
                  <select
                    id="select-birth-order"
                    value={newBirthOrder}
                    onChange={(e) => setNewBirthOrder(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-semibold focus:outline-hidden focus:border-emerald-500 cursor-pointer"
                  >
                    {Array.from({ length: 15 }, (_, i) => i + 1).map((num) => (
                      <option key={num} value={num}>
                        {num === 1 ? 'Anak Pertama (Sulung) - Ke-1' : `Anak Ke-${num}`}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Susunan kedudukan anak dalam keluarga (1 hingga 15).
                  </p>
                </div>
              </div>

              {/* Dynamic Branch Selection if CUCU, CICIT, PIUT, PIUT_PIUT */}
              {newRelationToFounder !== 'ANAK' && (
                <div className="pt-2 border-t border-slate-700/60">
                  <label className="block font-semibold text-slate-200 mb-1.5">
                    {newRelationToFounder === 'CUCU' && 'Pilih Ibu/Bapa (Anak Mamat & Hafsah): *'}
                    {newRelationToFounder === 'CICIT' && 'Pilih Ibu/Bapa (Cucu Mamat & Hafsah): *'}
                    {newRelationToFounder === 'PIUT' && 'Pilih Ibu/Bapa (Cicit Mamat & Hafsah): *'}
                    {newRelationToFounder === 'PIUT_PIUT' && 'Pilih Ibu/Bapa (Piut Mamat & Hafsah): *'}
                  </label>

                  <select
                    id="select-branch-parent"
                    value={selectedParentId}
                    onChange={(e) => setSelectedParentId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-hidden focus:border-emerald-500 cursor-pointer"
                  >
                    {candidateParents.map((parent) => (
                      <option key={parent.id} value={parent.id}>
                        {parent.fullName} ({parent.id} • Gen {parent.generation} • {parent.gender === 'male' ? 'Bapa' : 'Ibu'})
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-emerald-400/90 mt-1 flex items-center space-x-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Sistem akan menghubungkan waris ini ke dalam cabang keturunan ibu bapa yang dipilih secara automatik.</span>
                  </p>
                </div>
              )}
            </div>

            {/* SECTION 2: BUTIRAN PERIBADI & PASANGAN */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-4">
              <h4 className="font-bold text-white text-xs sm:text-sm flex items-center space-x-2 text-emerald-400">
                <User className="w-4 h-4" />
                <span>2. Maklumat Peribadi & Pasangan</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Nama Penuh Waris: *
                  </label>
                  <input
                    id="new-member-fullname"
                    type="text"
                    placeholder="Contoh: Luqman Hakim bin Ahmad"
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Nama Panggilan / Gelaran:
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Man"
                    value={newNickname}
                    onChange={(e) => setNewNickname(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Jantina: *
                  </label>
                  <select
                    value={newGender}
                    onChange={(e) => setNewGender(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-hidden focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="male">Lelaki</option>
                    <option value="female">Perempuan</option>
                  </select>
                </div>

                {/* NAMA PASANGAN */}
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Nama Pasangan (Suami / Isteri):
                  </label>
                  <input
                    id="new-member-spouse-name"
                    type="text"
                    placeholder="Contoh: Siti Aisyah binti Osman"
                    value={newSpouseName}
                    onChange={(e) => setNewSpouseName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-hidden focus:border-emerald-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Biarkan kosong jika belum berkahwin.
                  </p>
                </div>

                {/* 1. TARIKH LAHIR (AI) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-300 flex items-center space-x-1.5">
                      <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Tarikh Lahir (AI):</span>
                    </label>
                    {newMemberAiBirthInfo && (
                      <span className="text-[10px] text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-600/40">
                        Umur: <b>{newMemberAiBirthInfo.age} tahun</b> ({newMemberAiBirthInfo.category})
                      </span>
                    )}
                  </div>
                  <input
                    id="new-member-birthdate"
                    type="date"
                    value={newBirthDate}
                    onChange={(e) => setNewBirthDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-hidden focus:border-emerald-500"
                  />
                  {newMemberAiBirthInfo && (
                    <p className="text-[10px] text-slate-400 mt-1">
                      Tarikh diformat: <span className="text-slate-200 font-medium">{newMemberAiBirthInfo.formattedDate}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Pekerjaan / Bidang:
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Jurutera, Pelajar..."
                    value={newOccupation}
                    onChange={(e) => setNewOccupation(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                {/* 2. ALAMAT TERKINI */}
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-300 mb-1 flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Alamat Terkini:</span>
                  </label>
                  <input
                    id="new-member-address"
                    type="text"
                    placeholder="Contoh: No. 24, Taman Melur, 21000 Kuala Terengganu"
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* 4. TARIKH MENINGGAL */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-white text-xs sm:text-sm flex items-center space-x-2 text-rose-400">
                  <Calendar className="w-4 h-4" />
                  <span>Tarikh Meninggal</span>
                </h4>
                {newDeathDate && (
                  <button
                    type="button"
                    onClick={() => setNewDeathDate('')}
                    className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center space-x-1 cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Padam (Tandai Masih Hidup)</span>
                  </button>
                )}
              </div>

              <input
                id="new-member-death-date"
                type="date"
                value={newDeathDate}
                onChange={(e) => setNewDeathDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-hidden focus:border-rose-500"
              />
              <p className="text-[10px] text-slate-400">
                {newDeathDate ? (
                  <span className="text-rose-300 font-semibold">
                    Status: Almarhum / Almarhumah (Meninggal pada {newDeathDate})
                  </span>
                ) : (
                  <span>Biarkan kosong jika masih hidup. Profil akan ditandai sebagai Almarhum jika tarikh diisi.</span>
                )}
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Catatan Ringkas / Biografi:
              </label>
              <textarea
                rows={2}
                placeholder="Maklumat tambahan jika ada..."
                value={newBio}
                onChange={(e) => setNewBio(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:border-emerald-500 focus:outline-hidden"
              />
            </div>

            <div className="flex justify-end pt-4">
              <button
                id="btn-submit-new-member"
                type="submit"
                disabled={isSaving}
                className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-98 disabled:opacity-50 text-slate-950 font-bold text-xs sm:text-sm shadow-xl transition-all flex items-center space-x-2 cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Menyusun Salasilah & Menyegerak ke Drive...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>
                      {userSession.isAdminUnlocked ? '[ SAHKAN & SUSUN KE SALASILAH ]' : '[ HANTAR UNTUK PENGESAHAN ]'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
