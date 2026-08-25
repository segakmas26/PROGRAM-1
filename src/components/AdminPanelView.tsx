import React, { useState } from 'react';
import {
  Person,
  UserSession,
  RootFamilyConfig,
  PrintSettings,
  GoogleDriveConfig,
  AuditLog,
  PendingSubmission,
  BackupSnapshot,
} from '../types/family';
import { storageService } from '../services/storageService';
import { EditPersonModal } from './EditPersonModal';
import {
  Shield,
  Users,
  CheckCircle,
  XCircle,
  Cloud,
  CloudUpload,
  RefreshCw,
  Clock,
  Printer,
  FileText,
  Trash2,
  Edit,
  Edit3,
  GitMerge,
  AlertTriangle,
  Download,
  Upload,
  Lock,
  History,
  Settings,
  TreeDeciduous,
  Search,
  CheckSquare,
  Square,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';

interface AdminPanelViewProps {
  allPersons: Person[];
  onUpdatePersons: (persons: Person[]) => void;
  rootConfig: RootFamilyConfig;
  onUpdateRootConfig: (config: RootFamilyConfig) => void;
  printSettings: PrintSettings;
  onUpdatePrintSettings: (settings: PrintSettings) => void;
  driveConfig: GoogleDriveConfig;
  onUpdateDriveConfig: (config: GoogleDriveConfig) => void;
  userSession: UserSession;
  onOpenPersonDetail: (person: Person) => void;
}

export const AdminPanelView: React.FC<AdminPanelViewProps> = ({
  allPersons,
  onUpdatePersons,
  rootConfig,
  onUpdateRootConfig,
  printSettings,
  onUpdatePrintSettings,
  driveConfig,
  onUpdateDriveConfig,
  userSession,
  onOpenPersonDetail,
}) => {
  const [activeAdminTab, setActiveAdminTab] = useState<
    'MODERATION' | 'TREE_MANAGEMENT' | 'DRIVE_BACKUP' | 'PRINT_SETTINGS' | 'AUDIT_LOGS'
  >('MODERATION');
  const [pendingSubmissions, setPendingSubmissions] = useState<PendingSubmission[]>(() =>
    storageService.getPendingSubmissions()
  );
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => storageService.getAuditLogs());
  const [backupSnapshots, setBackupSnapshots] = useState<BackupSnapshot[]>(() =>
    storageService.getBackupSnapshots()
  );

  // Search & Filter in Admin Tree Management
  const [warisSearch, setWarisSearch] = useState('');
  const [warisGenFilter, setWarisGenFilter] = useState<number | 'ALL'>('ALL');
  const [selectedPersonIds, setSelectedPersonIds] = useState<Set<string>>(new Set());

  // Modal State for Delete Single Person
  const [personToDelete, setPersonToDelete] = useState<Person | null>(null);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);

  // Modal State for Batch Delete
  const [showBatchDeleteModal, setShowBatchDeleteModal] = useState(false);

  // Modal State for Clear Audit Logs
  const [showClearAuditModal, setShowClearAuditModal] = useState(false);

  // Modal State for Reset Database
  const [showResetDbModal, setShowResetDbModal] = useState(false);

  // State for Restore Modal
  const [targetRestoreSnapshot, setTargetRestoreSnapshot] = useState<BackupSnapshot | null>(null);
  const [snapshotToDelete, setSnapshotToDelete] = useState<BackupSnapshot | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Duplicate Merge State
  const [mergeSourceId, setMergeSourceId] = useState<string>('');
  const [mergeTargetId, setMergeTargetId] = useState<string>('');

  const showNotice = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // Moderation: Approve
  const handleApproveSubmission = (sub: PendingSubmission) => {
    let updatedPersons = [...allPersons];

    if (sub.data && sub.data.id) {
      const newPerson: Person = {
        id: sub.data.id,
        fullName: sub.data.fullName || 'Waris',
        nickname: sub.data.nickname,
        gender: sub.data.gender || 'male',
        generation: sub.data.generation || 3,
        fatherId: sub.data.fatherId,
        motherId: sub.data.motherId,
        spouseIds: sub.data.spouseIds || [],
        childrenIds: sub.data.childrenIds || [],
        birthYear: sub.data.birthYear,
        occupation: sub.data.occupation,
        city: sub.data.city,
        state: sub.data.state,
        bio: sub.data.bio,
        isDeceased: false,
        isVerified: true,
      };

      if (!updatedPersons.some((p) => p.id === newPerson.id)) {
        updatedPersons.push(newPerson);
      } else {
        updatedPersons = updatedPersons.map((p) => (p.id === newPerson.id ? newPerson : p));
      }
    }

    onUpdatePersons(updatedPersons);
    storageService.savePersons(updatedPersons);

    const updatedSubs = pendingSubmissions.map((s) =>
      s.id === sub.id ? { ...s, status: 'APPROVED' as const } : s
    );
    setPendingSubmissions(updatedSubs);
    storageService.savePendingSubmissions(updatedSubs);

    storageService.addAuditLog(
      'MODERASI_TERIMA',
      `Meluluskan pendaftaran waris: ${sub.data?.fullName || sub.id}`,
      userSession.userName || 'Admin',
      sub.data?.fullName
    );
    setAuditLogs(storageService.getAuditLogs());

    showNotice(`Permohonan ${sub.data?.fullName || sub.id} berjaya diluluskan & disahkan!`);
  };

  // Moderation: Reject
  const handleRejectSubmission = (sub: PendingSubmission) => {
    const updatedSubs = pendingSubmissions.map((s) =>
      s.id === sub.id ? { ...s, status: 'REJECTED' as const } : s
    );
    setPendingSubmissions(updatedSubs);
    storageService.savePendingSubmissions(updatedSubs);

    storageService.addAuditLog(
      'MODERASI_TOLAK',
      `Menolak permohonan pendaftaran: ${sub.data?.fullName || sub.id}`,
      userSession.userName || 'Admin'
    );
    setAuditLogs(storageService.getAuditLogs());

    showNotice(`Permohonan ${sub.id} telah ditolak.`, 'error');
  };

  // Moderation: Delete Single Submission
  const handleDeleteSubmission = (sub: PendingSubmission) => {
    const updated = storageService.deletePendingSubmission(sub.id, userSession.userName || 'Admin');
    setPendingSubmissions(updated);
    setAuditLogs(storageService.getAuditLogs());
    showNotice(`Permohonan ${sub.id} berjaya dipadam.`);
  };

  // Moderation: Clear all rejected submissions
  const handleClearRejectedSubmissions = () => {
    const updated = storageService.clearRejectedSubmissions(userSession.userName || 'Admin');
    setPendingSubmissions(updated);
    setAuditLogs(storageService.getAuditLogs());
    showNotice('Semua permohonan yang ditolak telah dibersihkan.');
  };

  // Create Backup Snapshot
  const handleCreateBackup = () => {
    const snapshot = storageService.createBackupSnapshot('MANUAL', 'Sandaran manual oleh Admin');
    setBackupSnapshots(storageService.getBackupSnapshots());
    onUpdateDriveConfig(storageService.getDriveConfig());
    setAuditLogs(storageService.getAuditLogs());
    showNotice(`Sandaran berjaya dicipta: ${snapshot.filename} (${snapshot.personCount} waris).`);
  };

  // Execute Restore Snapshot
  const handleExecuteRestore = () => {
    if (!targetRestoreSnapshot) return;
    const res = storageService.restoreBackupSnapshot(targetRestoreSnapshot.id);
    if (res.success) {
      onUpdatePersons(storageService.getPersons());
      onUpdateRootConfig(storageService.getRootConfig());
      onUpdatePrintSettings(storageService.getPrintSettings());
      setAuditLogs(storageService.getAuditLogs());
      showNotice(res.message);
    } else {
      showNotice(res.message, 'error');
    }
    setTargetRestoreSnapshot(null);
  };

  // Delete Backup Snapshot
  const handleExecuteDeleteSnapshot = () => {
    if (!snapshotToDelete) return;
    const updated = storageService.deleteBackupSnapshot(snapshotToDelete.id);
    setBackupSnapshots(updated);
    storageService.addAuditLog(
      'PADAM_WARIS',
      `Memadam fail sandaran: ${snapshotToDelete.filename}`,
      userSession.userName || 'Admin'
    );
    setAuditLogs(storageService.getAuditLogs());
    showNotice(`Fail sandaran "${snapshotToDelete.filename}" berjaya dipadam.`);
    setSnapshotToDelete(null);
  };

  // Export JSON file directly to user download
  const handleExportJSON = () => {
    const exportData = {
      app: 'WARIS MAMAT & HAFSAH',
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      googleDriveFolderId: driveConfig.folderId,
      rootConfig,
      printSettings,
      persons: allPersons,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `WARIS_MAMAT_HAFSAH_DATA_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotice('Fail JSON pangkalan data berjaya dieksport!');
  };

  // Merge Duplicates
  const handleMergeDuplicates = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mergeSourceId || !mergeTargetId || mergeSourceId === mergeTargetId) {
      showNotice('Sila pilih 2 rekod berbeza untuk digabungkan.', 'error');
      return;
    }

    const sourcePerson = allPersons.find((p) => p.id === mergeSourceId);
    const targetPerson = allPersons.find((p) => p.id === mergeTargetId);
    if (!sourcePerson || !targetPerson) return;

    const updated = allPersons
      .filter((p) => p.id !== sourcePerson.id)
      .map((p) => {
        let fId = p.fatherId === sourcePerson.id ? targetPerson.id : p.fatherId;
        let mId = p.motherId === sourcePerson.id ? targetPerson.id : p.motherId;
        let sIds = (p.spouseIds || []).map((id) => (id === sourcePerson.id ? targetPerson.id : id));
        let cIds = (p.childrenIds || []).map((id) => (id === sourcePerson.id ? targetPerson.id : id));

        return {
          ...p,
          fatherId: fId,
          motherId: mId,
          spouseIds: Array.from(new Set(sIds)),
          childrenIds: Array.from(new Set(cIds)),
        };
      });

    onUpdatePersons(updated);
    storageService.savePersons(updated);

    storageService.addAuditLog(
      'MERGE_DUPLICATES',
      `Menggabungkan rekod pendua: ${sourcePerson.fullName} (${sourcePerson.id}) ke dalam ${targetPerson.fullName} (${targetPerson.id}).`,
      userSession.userName || 'Admin'
    );
    setAuditLogs(storageService.getAuditLogs());

    setMergeSourceId('');
    setMergeTargetId('');
    showNotice(`Rekod ${sourcePerson.id} berjaya digabungkan ke dalam ${targetPerson.id}!`);
  };

  // Delete Single Person with safe cascading unlinking
  const handleConfirmDeletePerson = () => {
    if (!personToDelete) return;
    const res = storageService.deletePerson(personToDelete.id, userSession.userName || 'Admin');
    if (res.success) {
      onUpdatePersons(res.updatedPersons);
      setAuditLogs(storageService.getAuditLogs());
      showNotice(res.message);
      // Remove from selection if was selected
      if (selectedPersonIds.has(personToDelete.id)) {
        const next = new Set(selectedPersonIds);
        next.delete(personToDelete.id);
        setSelectedPersonIds(next);
      }
    } else {
      showNotice(res.message, 'error');
    }
    setPersonToDelete(null);
  };

  // Batch Delete Selected Persons
  const handleConfirmBatchDelete = () => {
    const ids = Array.from(selectedPersonIds);
    const res = storageService.deletePersons(ids, userSession.userName || 'Admin');
    if (res.success) {
      onUpdatePersons(res.updatedPersons);
      setSelectedPersonIds(new Set());
      setAuditLogs(storageService.getAuditLogs());
      showNotice(res.message);
    } else {
      showNotice(res.message, 'error');
    }
    setShowBatchDeleteModal(false);
  };

  // Delete Single Audit Log
  const handleDeleteAuditLog = (logId: string) => {
    const updated = storageService.deleteAuditLog(logId);
    setAuditLogs(updated);
    showNotice('Entri log audit telah dipadam.');
  };

  // Clear All Audit Logs
  const handleClearAllAuditLogs = () => {
    const updated = storageService.clearAuditLogs(userSession.userName || 'Admin');
    setAuditLogs(updated);
    setShowClearAuditModal(false);
    showNotice('Semua log audit telah dikosongkan.');
  };

  // Reset Database to Initial Seed
  const handleExecuteResetDatabase = () => {
    const res = storageService.resetDatabaseToInitial(userSession.userName || 'Admin');
    onUpdatePersons(res.persons);
    onUpdateRootConfig(res.rootConfig);
    setAuditLogs(storageService.getAuditLogs());
    setPendingSubmissions(storageService.getPendingSubmissions());
    setSelectedPersonIds(new Set());
    setShowResetDbModal(false);
    showNotice('Pangkalan data berjaya diset semula ke rekod asas asal.');
  };

  // Filtered persons for tree management list
  const filteredWaris = allPersons.filter((p) => {
    if (warisGenFilter !== 'ALL' && p.generation !== warisGenFilter) return false;
    if (warisSearch.trim()) {
      const q = warisSearch.toLowerCase();
      const matchName = p.fullName.toLowerCase().includes(q);
      const matchNick = p.nickname?.toLowerCase().includes(q);
      const matchId = p.id.toLowerCase().includes(q);
      const matchCity = p.city?.toLowerCase().includes(q);
      const matchJob = p.occupation?.toLowerCase().includes(q);
      return Boolean(matchName || matchNick || matchId || matchCity || matchJob);
    }
    return true;
  });

  const toggleSelectPerson = (id: string) => {
    if (id === 'WMH-000001' || id === 'WMH-000002') return;
    const next = new Set(selectedPersonIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedPersonIds(next);
  };

  const toggleSelectAllVisible = () => {
    const deletableVisibleIds = filteredWaris
      .filter((p) => p.id !== 'WMH-000001' && p.id !== 'WMH-000002')
      .map((p) => p.id);

    const allSelected = deletableVisibleIds.every((id) => selectedPersonIds.has(id));
    const next = new Set(selectedPersonIds);

    if (allSelected) {
      deletableVisibleIds.forEach((id) => next.delete(id));
    } else {
      deletableVisibleIds.forEach((id) => next.add(id));
    }
    setSelectedPersonIds(next);
  };

  const pendingCount = pendingSubmissions.filter((s) => s.status === 'PENDING').length;

  return (
    <div className="space-y-6 pb-12 animate-fade-in max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-white">Panel Kawalan Pentadbir (Admin Panel)</h2>
                <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 text-[10px] font-black uppercase">
                  Akses Penuh
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Pengurusan salasilah, padam rekod waris, moderasi pendaftaran, sandaran Google Drive, dan log audit.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              id="admin-backup-btn"
              onClick={handleCreateBackup}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <CloudUpload className="w-4 h-4 text-emerald-400" />
              <span>Sandar Sekarang</span>
            </button>
            <button
              id="admin-export-json-btn"
              onClick={handleExportJSON}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-blue-400" />
              <span>Eksport JSON</span>
            </button>
          </div>
        </div>

        {/* Notifications */}
        {notification && (
          <div
            id="admin-alert-banner"
            className={`mt-4 p-3.5 rounded-2xl text-xs flex items-center space-x-2 animate-fade-in ${
              notification.type === 'success'
                ? 'bg-emerald-950 border border-emerald-500 text-emerald-200'
                : 'bg-rose-950 border border-rose-500 text-rose-200'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
        )}

        {/* Admin Navigation Tabs */}
        <div className="flex space-x-2 overflow-x-auto pt-6 border-t border-slate-800 mt-6 text-xs font-bold">
          <button
            id="admin-tab-moderation"
            onClick={() => setActiveAdminTab('MODERATION')}
            className={`px-4 py-2.5 rounded-xl transition-all flex items-center space-x-2 shrink-0 cursor-pointer ${
              activeAdminTab === 'MODERATION'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            <span>Pengesahan ({pendingCount})</span>
          </button>
          <button
            id="admin-tab-tree-mgmt"
            onClick={() => setActiveAdminTab('TREE_MANAGEMENT')}
            className={`px-4 py-2.5 rounded-xl transition-all flex items-center space-x-2 shrink-0 cursor-pointer ${
              activeAdminTab === 'TREE_MANAGEMENT'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <TreeDeciduous className="w-4 h-4" />
            <span>Pengurusan & Padam Waris ({allPersons.length})</span>
          </button>
          <button
            id="admin-tab-drive-backup"
            onClick={() => setActiveAdminTab('DRIVE_BACKUP')}
            className={`px-4 py-2.5 rounded-xl transition-all flex items-center space-x-2 shrink-0 cursor-pointer ${
              activeAdminTab === 'DRIVE_BACKUP'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Cloud className="w-4 h-4" />
            <span>Google Drive & Sandaran</span>
          </button>
          <button
            id="admin-tab-print-settings"
            onClick={() => setActiveAdminTab('PRINT_SETTINGS')}
            className={`px-4 py-2.5 rounded-xl transition-all flex items-center space-x-2 shrink-0 cursor-pointer ${
              activeAdminTab === 'PRINT_SETTINGS'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>Tetapan Cetakan Rasmi</span>
          </button>
          <button
            id="admin-tab-audit-logs"
            onClick={() => setActiveAdminTab('AUDIT_LOGS')}
            className={`px-4 py-2.5 rounded-xl transition-all flex items-center space-x-2 shrink-0 cursor-pointer ${
              activeAdminTab === 'AUDIT_LOGS'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Audit Trail ({auditLogs.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: MODERATION QUEUE */}
      {activeAdminTab === 'MODERATION' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <span>Senarai Menunggu Pengesahan Hubungan / Pendaftaran Baru</span>
            </h3>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400 font-mono">
                {pendingCount} Permohonan Tertangguh
              </span>
              {pendingSubmissions.some((s) => s.status === 'REJECTED') && (
                <button
                  onClick={handleClearRejectedSubmissions}
                  className="px-2.5 py-1 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 text-[11px] font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Padam Rekod Ditolak</span>
                </button>
              )}
            </div>
          </div>

          {pendingSubmissions.length === 0 ? (
            <div className="p-8 text-center text-slate-400 bg-slate-950/60 rounded-2xl border border-slate-800">
              <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
              <p className="font-semibold text-white">Semua permohonan telah selesai disahkan!</p>
              <p className="text-xs mt-0.5">Tiada pendaftaran baru yang menunggu tindakan pentadbir.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingSubmissions.map((sub) => (
                <div
                  key={sub.id}
                  className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-white">
                        {sub.data?.fullName || 'Waris Tanpa Nama'}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px] font-mono">
                        {sub.data?.id} • Gen {sub.data?.generation || 3}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                          sub.status === 'PENDING'
                            ? 'bg-amber-950 text-amber-300'
                            : sub.status === 'APPROVED'
                            ? 'bg-emerald-950 text-emerald-300'
                            : 'bg-rose-950 text-rose-300'
                        }`}
                      >
                        {sub.status === 'PENDING'
                          ? `Menunggu (${sub.relationshipType || sub.type})`
                          : sub.status === 'APPROVED'
                          ? 'Diluluskan'
                          : 'Ditolak'}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px]">
                      Dihantar oleh: <b>{sub.submittedBy}</b> (
                      {sub.submittedByEmail || 'E-mel tidak dinyatakan'}) • {sub.timestamp}
                    </p>
                    {sub.data?.occupation && (
                      <p className="text-slate-400 text-[11px]">Pekerjaan: {sub.data.occupation}</p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    {sub.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => handleApproveSubmission(sub)}
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors flex items-center space-x-1 cursor-pointer"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Sahkan & Lulus</span>
                        </button>
                        <button
                          onClick={() => handleRejectSubmission(sub)}
                          className="px-3.5 py-2 rounded-xl bg-rose-900 hover:bg-rose-800 text-rose-200 font-semibold transition-colors flex items-center space-x-1 cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Tolak</span>
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleDeleteSubmission(sub)}
                      className="p-2 rounded-xl bg-slate-700 hover:bg-rose-950 hover:text-rose-300 text-slate-400 transition-colors cursor-pointer"
                      title="Padam Permohonan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TREE & WARIS DATA MANAGEMENT / DELETE */}
      {activeAdminTab === 'TREE_MANAGEMENT' && (
        <div className="space-y-6">
          {/* Main Waris Data Directory with Delete, Search, Batch Delete */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <Users className="w-5 h-5 text-emerald-400" />
                  <span>Pengurusan & Pemadaman Data Waris ({allPersons.length} Rekod)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Admin mempunyai kuasa penuh untuk memadam rekod waris yang tersilap atau tidak sah dengan nyahpaut automatik.
                </p>
              </div>

              {/* Batch Delete Action Button */}
              {selectedPersonIds.size > 0 && (
                <div className="flex items-center space-x-2 animate-fade-in">
                  <button
                    id="admin-batch-delete-btn"
                    onClick={() => setShowBatchDeleteModal(true)}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center space-x-2 shadow-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Padam {selectedPersonIds.size} Rekod Terpilih</span>
                  </button>
                </div>
              )}
            </div>

            {/* Search & Filter Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-800">
              <div className="relative sm:col-span-2">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  id="admin-waris-search"
                  type="text"
                  placeholder="Cari nama, ID, pekerjaan, bandar untuk dipadam atau diurus..."
                  value={warisSearch}
                  onChange={(e) => setWarisSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <select
                id="admin-waris-gen-filter"
                value={warisGenFilter}
                onChange={(e) =>
                  setWarisGenFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-hidden focus:border-emerald-500"
              >
                <option value="ALL">Semua Generasi (1-5)</option>
                <option value={1}>Gen 1 (Pengasas Asal)</option>
                <option value={2}>Gen 2 (Anak)</option>
                <option value={3}>Gen 3 (Cucu)</option>
                <option value={4}>Gen 4 (Cicit)</option>
                <option value={5}>Gen 5 (Piut)</option>
              </select>
            </div>

            {/* Select All Toggle Bar */}
            <div className="flex items-center justify-between text-xs text-slate-400 px-1 py-1 border-b border-slate-800">
              <button
                type="button"
                onClick={toggleSelectAllVisible}
                className="flex items-center space-x-1.5 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                {filteredWaris.length > 0 &&
                filteredWaris
                  .filter((p) => p.id !== 'WMH-000001' && p.id !== 'WMH-000002')
                  .every((p) => selectedPersonIds.has(p.id)) ? (
                  <CheckSquare className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Square className="w-4 h-4 text-slate-500" />
                )}
                <span>Pilih Semua Yang Dipaparkan ({filteredWaris.length})</span>
              </button>
              <span>{selectedPersonIds.size} rekod dipilih</span>
            </div>

            {/* Waris List for Deletion / Management */}
            <div className="max-h-[420px] overflow-y-auto space-y-2 pr-1">
              {filteredWaris.length === 0 ? (
                <div className="p-8 text-center text-slate-400 bg-slate-950/40 rounded-2xl border border-slate-800">
                  <p className="text-sm font-semibold text-slate-300">Tiada rekod waris yang sepadan</p>
                  <p className="text-xs mt-0.5">Sila cuba kata kunci carian atau tapisan lain.</p>
                </div>
              ) : (
                filteredWaris.map((p) => {
                  const isRoot = p.id === 'WMH-000001' || p.id === 'WMH-000002';
                  const isSelected = selectedPersonIds.has(p.id);
                  const spouseCount = p.spouseIds?.length || 0;
                  const childrenCount = p.childrenIds?.length || 0;

                  return (
                    <div
                      key={p.id}
                      id={`admin-waris-row-${p.id}`}
                      className={`p-3 rounded-2xl border flex items-center justify-between text-xs transition-all ${
                        isSelected
                          ? 'bg-rose-950/40 border-rose-700/80 ring-1 ring-rose-500'
                          : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        {/* Checkbox */}
                        {!isRoot ? (
                          <button
                            type="button"
                            onClick={() => toggleSelectPerson(p.id)}
                            className="p-1 text-slate-400 hover:text-white cursor-pointer"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-rose-400" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-500" />
                            )}
                          </button>
                        ) : (
                          <span
                            className="w-6 flex items-center justify-center text-amber-500"
                            title="Pengasas Asal (Dilindungi)"
                          >
                            🔒
                          </span>
                        )}

                        {/* Avatar */}
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-inner ${
                            p.gender === 'male'
                              ? 'bg-blue-900 text-blue-200 border border-blue-700/60'
                              : 'bg-rose-900 text-rose-200 border border-rose-700/60'
                          }`}
                        >
                          {p.fullName.charAt(0)}
                        </div>

                        {/* Details */}
                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-white truncate text-xs sm:text-sm">
                              {p.fullName}
                            </span>
                            {p.nickname && (
                              <span className="text-[11px] text-slate-400 hidden sm:inline">
                                ({p.nickname})
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                            <span className="font-mono text-emerald-400">{p.id}</span>
                            <span>•</span>
                            <span>Gen {p.generation}</span>
                            <span>•</span>
                            <span>{p.gender === 'male' ? 'Lelaki' : 'Perempuan'}</span>
                            {p.birthYear && <span>• Lahir {p.birthYear}</span>}
                            {(spouseCount > 0 || childrenCount > 0) && (
                              <span className="text-purple-300">
                                • {spouseCount > 0 && `${spouseCount} Pasangan`}{' '}
                                {childrenCount > 0 && `${childrenCount} Anak`}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center space-x-2 shrink-0 ml-2">
                        <button
                          type="button"
                          id={`btn-admin-edit-waris-${p.id}`}
                          onClick={() => setEditingPerson(p)}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center space-x-1 transition-colors cursor-pointer"
                          title="Kemaskini / Edit Profil Waris Ini"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenPersonDetail(p)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-[11px] font-semibold transition-colors cursor-pointer"
                        >
                          Lihat
                        </button>
                        {!isRoot ? (
                          <button
                            type="button"
                            id={`btn-delete-waris-${p.id}`}
                            onClick={() => setPersonToDelete(p)}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 text-[11px] font-bold flex items-center space-x-1 transition-colors cursor-pointer"
                            title="Padam Rekod Waris"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Padam</span>
                          </button>
                        ) : (
                          <span className="px-2 py-1 rounded bg-slate-800 text-[10px] text-amber-400/80 font-mono">
                            Pengasas
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Duplicate Merge Tool */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-md space-y-4">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <GitMerge className="w-5 h-5 text-purple-400" />
              <span>Alat Penggabungan Rekod Pendua (Duplicate Merge Tool)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Pilih rekod pendua yang ingin dihapuskan (Sumber) dan rekod utama yang ingin dikekalkan (Sasaran). Semua hubungan waris akan dialihkan secara automatik.
            </p>

            <form onSubmit={handleMergeDuplicates} className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Rekod Sumber (Akan Dipadam):
                </label>
                <select
                  value={mergeSourceId}
                  onChange={(e) => setMergeSourceId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                >
                  <option value="">-- Pilih Sumber --</option>
                  {allPersons.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} ({p.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Rekod Utama / Sasaran (Dikekalkan):
                </label>
                <select
                  value={mergeTargetId}
                  onChange={(e) => setMergeTargetId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                >
                  <option value="">-- Pilih Sasaran --</option>
                  {allPersons.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} ({p.id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
                >
                  [ GABUNG REKOD PENDUA ]
                </button>
              </div>
            </form>
          </div>

          {/* Danger Zone: Database Reset */}
          <div className="bg-slate-900 border border-rose-900/50 rounded-3xl p-6 shadow-md space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Zon Bahaya & Tetapan Semula Pangkalan Data</h3>
                <p className="text-xs text-slate-400">
                  Tetapkan semula seluruh pangkalan data ke rekod asal silsilah (Factory Reset).
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-900/60 text-xs text-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="font-bold block text-white">Tetapan Semula ke Rekod Asas (Factory Reset):</span>
                <span className="text-slate-400">
                  Tindakan ini akan mengembalikan pangkalan data kepada rekod induk asal 44 waris rasmi.
                </span>
              </div>
              <button
                type="button"
                id="btn-open-reset-db"
                onClick={() => setShowResetDbModal(true)}
                className="px-4 py-2 rounded-xl bg-rose-900 hover:bg-rose-800 border border-rose-700 text-rose-100 font-bold text-xs flex items-center space-x-1.5 shrink-0 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset Data ke Asal</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: GOOGLE DRIVE BACKUP & RESTORE */}
      {activeAdminTab === 'DRIVE_BACKUP' && (
        <div className="space-y-6">
          {/* Drive Status Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-md space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Cloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Integrasi Google Drive & Folder Rasmi</h3>
                  <p className="text-xs text-slate-400">
                    Penyelarasan automatik bagi arkib selamat susur galur keluarga.
                  </p>
                </div>
              </div>

              <span className="px-3 py-1 rounded-full bg-emerald-950 border border-emerald-700/60 text-emerald-300 text-xs font-bold flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>BERSAMBUNG (ACTIVE)</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-800 border border-slate-700 space-y-1">
                <span className="text-slate-400 block text-[11px]">FOLDER GOOGLE DRIVE RASMI:</span>
                <span className="font-mono text-emerald-400 font-bold text-xs select-all">
                  {driveConfig.folderId}
                </span>
                <p className="text-[10px] text-slate-400 mt-1">
                  Folder sandaran master bagi arkib JSON, PDF & rekod silsilah.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800 border border-slate-700 space-y-1">
                <span className="text-slate-400 block text-[11px]">STATUS SANDARAN TERAKHIR:</span>
                <div className="font-semibold text-white">
                  {driveConfig.lastBackupTime || 'Baru sahaja'} • <b className="text-emerald-400">{driveConfig.lastBackupStatus}</b>
                </div>
                <p className="text-[10px] text-slate-400">
                  Jumlah sandaran arkib tersimpan: {backupSnapshots.length} fail
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <button
                onClick={handleCreateBackup}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center space-x-2 transition-colors cursor-pointer"
              >
                <CloudUpload className="w-4 h-4" />
                <span>[ CIPTA SANDARAN SEKARANG ]</span>
              </button>
            </div>
          </div>

          {/* Backup Snapshots List */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-md space-y-4">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Clock className="w-5 h-5 text-emerald-400" />
              <span>Senarai Titik Pemulihan (Backup Snapshots)</span>
            </h3>

            <div className="space-y-2.5">
              {backupSnapshots.map((snp) => (
                <div
                  key={snp.id}
                  className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="font-bold text-white flex items-center space-x-2">
                      <FileText className="w-3.5 h-3.5 text-blue-400" />
                      <span>{snp.filename}</span>
                      <span className="text-[10px] px-2 py-0.2 rounded bg-slate-700 text-slate-300">
                        {snp.personCount} Waris
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Tarikh: {snp.timestamp} • Jenis: {snp.type} • {snp.notes}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => setTargetRestoreSnapshot(snp)}
                      className="px-3.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 font-bold text-xs transition-colors cursor-pointer"
                    >
                      Pulihkan Data (Restore)
                    </button>
                    <button
                      onClick={() => setSnapshotToDelete(snp)}
                      className="p-1.5 rounded-lg bg-slate-700 hover:bg-rose-950 hover:text-rose-300 text-slate-400 transition-colors cursor-pointer"
                      title="Padam Fail Sandaran"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PRINT SETTINGS */}
      {activeAdminTab === 'PRINT_SETTINGS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-md space-y-5">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Printer className="w-5 h-5 text-emerald-400" />
              <span>Tetapan Cetakan & Format Rasmi</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Ubah kepala surat, tajuk rasmi, dan teks tera air untuk cetakan silsilah.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Tajuk Rasmi Dokumen:</label>
              <input
                type="text"
                value={printSettings.officialTitle}
                onChange={(e) => {
                  const updated = { ...printSettings, officialTitle: e.target.value };
                  onUpdatePrintSettings(updated);
                  storageService.savePrintSettings(updated);
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Sub-tajuk Rasmi:</label>
              <input
                type="text"
                value={printSettings.officialSubtitle}
                onChange={(e) => {
                  const updated = { ...printSettings, officialSubtitle: e.target.value };
                  onUpdatePrintSettings(updated);
                  storageService.savePrintSettings(updated);
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Teks Tera Air (Watermark):</label>
              <input
                type="text"
                value={printSettings.watermarkText}
                onChange={(e) => {
                  const updated = { ...printSettings, watermarkText: e.target.value };
                  onUpdatePrintSettings(updated);
                  storageService.savePrintSettings(updated);
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Teks Kaki Rasmi (Footer):</label>
              <input
                type="text"
                value={printSettings.footerText}
                onChange={(e) => {
                  const updated = { ...printSettings, footerText: e.target.value };
                  onUpdatePrintSettings(updated);
                  storageService.savePrintSettings(updated);
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: AUDIT LOGS */}
      {activeAdminTab === 'AUDIT_LOGS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <History className="w-5 h-5 text-emerald-400" />
              <span>Audit Trail & Rekod Aktiviti Sistem</span>
            </h3>
            {auditLogs.length > 0 && (
              <button
                id="btn-clear-all-logs"
                onClick={() => setShowClearAuditModal(true)}
                className="px-3 py-1.5 rounded-xl bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Padam Semua Log</span>
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto space-y-2 pr-2 text-xs">
            {auditLogs.length === 0 ? (
              <div className="p-8 text-center text-slate-400 bg-slate-950/40 rounded-2xl border border-slate-800">
                <p className="text-sm font-semibold text-slate-300">Tiada rekod log aktiviti</p>
              </div>
            ) : (
              auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/60 flex items-start justify-between space-x-3"
                >
                  <div className="flex items-start space-x-3 flex-1 min-w-0">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{log.action}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{log.timestamp}</span>
                      </div>
                      <p className="text-slate-300 mt-0.5">{log.details}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Oleh: {log.performedBy}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteAuditLog(log.id)}
                    className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors ml-2 cursor-pointer"
                    title="Padam entri log ini"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* MODAL: DELETE SINGLE PERSON CONFIRMATION */}
      {personToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
          <div className="bg-slate-900 border border-rose-600 text-slate-100 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-fade-in">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Pengesahan Padam Rekod Waris</h3>
                <p className="text-xs text-rose-300 font-medium">
                  Tindakan ini akan memadam data individu secara kekal.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800 border border-slate-700 text-xs space-y-2">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                    personToDelete.gender === 'male' ? 'bg-blue-900 text-blue-200' : 'bg-rose-900 text-rose-200'
                  }`}
                >
                  {personToDelete.fullName.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-sm text-white">{personToDelete.fullName}</div>
                  <div className="text-slate-400 font-mono text-[11px]">
                    {personToDelete.id} • Generasi {personToDelete.generation}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-700 text-[11px] text-slate-300 space-y-1">
                <p className="font-semibold text-amber-300">Penyelarasan Hubungan Automatik:</p>
                <p className="text-slate-400">
                  • Pertalian dengan ibu bapa, pasangan ({personToDelete.spouseIds?.length || 0}), dan anak ({personToDelete.childrenIds?.length || 0}) akan dinyahpaut secara selamat tanpa merosakkan struktur pokok salasilah.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPersonToDelete(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
              >
                [ BATAL ]
              </button>
              <button
                type="button"
                id="btn-confirm-delete-person"
                onClick={handleConfirmDeletePerson}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors cursor-pointer flex items-center space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>[ SAHKAN PADAM REKOD ]</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: BATCH DELETE CONFIRMATION */}
      {showBatchDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
          <div className="bg-slate-900 border border-rose-600 text-slate-100 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-fade-in">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Padam Kelompok Rekod Waris</h3>
                <p className="text-xs text-rose-300 font-medium">
                  Adakah anda pasti mahu memadam {selectedPersonIds.size} rekod serentak?
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              Semua {selectedPersonIds.size} rekod waris terpilih akan dipadam dan pertalian berkaitan akan dinyahpaut secara selamat.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowBatchDeleteModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
              >
                [ BATAL ]
              </button>
              <button
                type="button"
                id="btn-confirm-batch-delete"
                onClick={handleConfirmBatchDelete}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors cursor-pointer flex items-center space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>[ SAHKAN PADAM {selectedPersonIds.size} REKOD ]</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CLEAR AUDIT LOGS CONFIRMATION */}
      {showClearAuditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 text-slate-100 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-fade-in">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <History className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Kosongkan Log Audit</h3>
                <p className="text-xs text-slate-400">Padam semua rekod sejarah aktiviti sistem.</p>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              Adakah anda pasti mahu memadam kesemua {auditLogs.length} rekod log audit sistem?
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowClearAuditModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
              >
                [ BATAL ]
              </button>
              <button
                type="button"
                id="btn-confirm-clear-logs"
                onClick={handleClearAllAuditLogs}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                [ KOSONGKAN LOG ]
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DELETE SNAPSHOT CONFIRMATION */}
      {snapshotToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 text-slate-100 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-fade-in">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Padam Fail Sandaran</h3>
                <p className="text-xs text-slate-400">{snapshotToDelete.filename}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              Adakah anda pasti mahu memadam fail sandaran titik pemulihan ini ({snapshotToDelete.personCount} waris)?
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSnapshotToDelete(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
              >
                [ BATAL ]
              </button>
              <button
                type="button"
                id="btn-confirm-delete-snapshot"
                onClick={handleExecuteDeleteSnapshot}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                [ PADAM SANDARAN ]
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RESET DATABASE CONFIRMATION */}
      {showResetDbModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
          <div className="bg-slate-900 border border-rose-500 text-slate-100 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-fade-in">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Tetapan Semula Kilang (Reset All Data)</h3>
                <p className="text-xs text-rose-300 font-medium">
                  Semua data tersuai akan dipadam dan dikembalikan ke silsilah asas asal.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Tindakan ini akan mengosongkan sebarang data tambahan atau perubahan tersuai dan memuatkan semula susur galur rasmi 44 waris.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResetDbModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
              >
                [ BATAL ]
              </button>
              <button
                type="button"
                id="btn-confirm-reset-database"
                onClick={handleExecuteResetDatabase}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                [ TERUSKAN RESET SEMULA ]
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANDATORY RESTORE CONFIRMATION MODAL (Objektif 54, 55) */}
      {targetRestoreSnapshot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
          <div className="bg-slate-900 border border-amber-500 text-slate-100 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-fade-in">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Pengesahan Pemulihan Data (Restore)</h3>
                <p className="text-xs text-amber-300 font-medium">
                  "Restore akan menggantikan data semasa dengan backup yang dipilih."
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800 border border-slate-700 text-xs space-y-1">
              <div>
                <b>Fail Sandaran:</b> {targetRestoreSnapshot.filename}
              </div>
              <div>
                <b>Masa Dicipta:</b> {targetRestoreSnapshot.timestamp}
              </div>
              <div>
                <b>Jumlah Waris Dalam Sandaran:</b> {targetRestoreSnapshot.personCount} Orang
              </div>
            </div>

            <p className="text-xs text-slate-400">
              Sila pastikan anda membuat sandaran terkini sebelum memulihkan data lama jika perlu.
            </p>

            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTargetRestoreSnapshot(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
              >
                [ BATAL ]
              </button>
              <button
                type="button"
                onClick={() => {
                  handleCreateBackup();
                  handleExecuteRestore();
                }}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                [ BACKUP CURRENT DATA & RESTORE ]
              </button>
              <button
                type="button"
                onClick={handleExecuteRestore}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
              >
                [ TERUSKAN RESTORE ]
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Person Modal */}
      {editingPerson && (
        <EditPersonModal
          person={editingPerson}
          isOpen={Boolean(editingPerson)}
          onClose={() => setEditingPerson(null)}
          allPersons={allPersons}
          currentPerson={allPersons.find((p) => p.id === userSession.currentPersonId) || null}
          isAdmin={true}
          userSession={userSession}
          onUpdatePersons={onUpdatePersons}
          onSavedPerson={(updated) => {
            setEditingPerson(null);
            showNotice(`Profil waris ${updated.fullName} berjaya dikemaskini oleh Admin.`);
          }}
          driveConfig={driveConfig}
          onUpdateDriveConfig={onUpdateDriveConfig}
        />
      )}
    </div>
  );
};
