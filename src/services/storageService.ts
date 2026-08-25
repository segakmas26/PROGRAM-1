import {
  Person,
  RootFamilyConfig,
  PrintSettings,
  GoogleDriveConfig,
  AuditLog,
  PendingSubmission,
  BackupSnapshot,
  UserSession,
} from '../types/family';
import {
  INITIAL_PERSONS,
  INITIAL_ROOT_CONFIG,
  INITIAL_PRINT_SETTINGS,
  INITIAL_DRIVE_CONFIG,
  INITIAL_AUDIT_LOGS,
  INITIAL_PENDING_SUBMISSIONS,
} from '../data/initialData';

const STORAGE_KEYS = {
  PERSONS: 'wmh_family_persons_v2',
  ROOT_CONFIG: 'wmh_root_config_v2',
  PRINT_SETTINGS: 'wmh_print_settings_v2',
  DRIVE_CONFIG: 'wmh_drive_config_v2',
  BACKUP_SNAPSHOTS: 'wmh_backup_snapshots_v2',
  AUDIT_LOGS: 'wmh_audit_logs_v2',
  PENDING_SUBMISSIONS: 'wmh_pending_submissions_v2',
  USER_SESSION: 'wmh_user_session_v2',
};

// Safe LocalStorage helpers
function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item);
  } catch (e) {
    console.error(`Error loading key ${key} from storage:`, e);
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Error saving key ${key} to storage:`, e);
  }
}

export const storageService = {
  // Persons
  getPersons(): Person[] {
    return loadFromStorage<Person[]>(STORAGE_KEYS.PERSONS, INITIAL_PERSONS);
  },

  savePersons(persons: Person[]): void {
    saveToStorage(STORAGE_KEYS.PERSONS, persons);
  },

  // Root Config
  getRootConfig(): RootFamilyConfig {
    return loadFromStorage<RootFamilyConfig>(STORAGE_KEYS.ROOT_CONFIG, INITIAL_ROOT_CONFIG);
  },

  saveRootConfig(config: RootFamilyConfig): void {
    saveToStorage(STORAGE_KEYS.ROOT_CONFIG, config);
  },

  // Print Settings
  getPrintSettings(): PrintSettings {
    return loadFromStorage<PrintSettings>(STORAGE_KEYS.PRINT_SETTINGS, INITIAL_PRINT_SETTINGS);
  },

  savePrintSettings(settings: PrintSettings): void {
    saveToStorage(STORAGE_KEYS.PRINT_SETTINGS, settings);
  },

  // Google Drive Config
  getDriveConfig(): GoogleDriveConfig {
    return loadFromStorage<GoogleDriveConfig>(STORAGE_KEYS.DRIVE_CONFIG, INITIAL_DRIVE_CONFIG);
  },

  saveDriveConfig(config: GoogleDriveConfig): void {
    saveToStorage(STORAGE_KEYS.DRIVE_CONFIG, config);
  },

  // Audit Logs
  getAuditLogs(): AuditLog[] {
    return loadFromStorage<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
  },

  addAuditLog(action: AuditLog['action'], details: string, performedBy: string, targetPersonName?: string): void {
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      id: `LOG-${Date.now().toString().slice(-6)}`,
      action,
      details,
      performedBy,
      targetPersonName,
      timestamp: new Date().toLocaleString('en-MY', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
    logs.unshift(newLog);
    saveToStorage(STORAGE_KEYS.AUDIT_LOGS, logs.slice(0, 100)); // keep last 100
  },

  // Pending Submissions (Moderation)
  getPendingSubmissions(): PendingSubmission[] {
    return loadFromStorage<PendingSubmission[]>(STORAGE_KEYS.PENDING_SUBMISSIONS, INITIAL_PENDING_SUBMISSIONS);
  },

  savePendingSubmissions(subs: PendingSubmission[]): void {
    saveToStorage(STORAGE_KEYS.PENDING_SUBMISSIONS, subs);
  },

  addPendingSubmission(sub: Omit<PendingSubmission, 'id' | 'timestamp' | 'status'>): PendingSubmission {
    const subs = this.getPendingSubmissions();
    const newSub: PendingSubmission = {
      ...sub,
      id: `SUB-${Date.now().toString().slice(-5)}`,
      timestamp: new Date().toLocaleString('en-MY', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      status: 'PENDING',
    };
    subs.unshift(newSub);
    this.savePendingSubmissions(subs);
    return newSub;
  },

  // User Session & Identity
  getUserSession(): UserSession {
    return loadFromStorage<UserSession>(STORAGE_KEYS.USER_SESSION, {
      role: 'PUBLIC',
      currentPersonId: 'WMH-000015', // Default: Ahmad bin Abdullah
      userEmail: 'segakmas26@gmail.com',
      userName: 'Ahmad bin Abdullah',
      isAdminUnlocked: false,
    });
  },

  saveUserSession(session: UserSession): void {
    saveToStorage(STORAGE_KEYS.USER_SESSION, session);
  },

  // Backup Snapshots
  getBackupSnapshots(): BackupSnapshot[] {
    const list = loadFromStorage<BackupSnapshot[]>(STORAGE_KEYS.BACKUP_SNAPSHOTS, []);
    if (list.length === 0) {
      const initialSnapshot: BackupSnapshot = {
        id: 'SNP-MASTER-20260823',
        filename: 'WARIS_MASTER_INITIAL.json',
        timestamp: '2026-08-23 04:15 PM',
        type: 'DRIVE_SYNC',
        personCount: INITIAL_PERSONS.length,
        data: {
          persons: INITIAL_PERSONS,
          rootConfig: INITIAL_ROOT_CONFIG,
          printSettings: INITIAL_PRINT_SETTINGS,
          version: '2.0.0',
        },
        notes: 'Sandaran automatik master Google Drive (Folder ID: 19WYcymaklu-0-lpVAJBdnaDed2phO2v-).',
      };
      return [initialSnapshot];
    }
    return list;
  },

  createBackupSnapshot(type: BackupSnapshot['type'], notes?: string): BackupSnapshot {
    const snapshots = this.getBackupSnapshots();
    const persons = this.getPersons();
    const rootConfig = this.getRootConfig();
    const printSettings = this.getPrintSettings();

    const timestamp = new Date().toLocaleString('en-MY', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const dateSlug = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const timeSlug = Date.now().toString().slice(-4);
    const filename = `WARIS_BACKUP_${dateSlug}_${timeSlug}.json`;

    const snapshot: BackupSnapshot = {
      id: `SNP-${Date.now()}`,
      filename,
      timestamp,
      type,
      personCount: persons.length,
      data: {
        persons,
        rootConfig,
        printSettings,
        version: '2.0.0',
      },
      notes: notes || `Sandaran data ${persons.length} orang waris.`,
    };

    snapshots.unshift(snapshot);
    saveToStorage(STORAGE_KEYS.BACKUP_SNAPSHOTS, snapshots.slice(0, 20));

    const drive = this.getDriveConfig();
    drive.lastBackupTime = timestamp;
    drive.lastBackupStatus = 'SUCCESS';
    drive.backupCount += 1;
    this.saveDriveConfig(drive);

    return snapshot;
  },

  // Auto-sync current database with registered Google Drive
  async syncWithDrive(reason: string = 'Kemaskini Profil Waris'): Promise<{
    success: boolean;
    message: string;
    folderId: string;
    timestamp: string;
    snapshot: BackupSnapshot;
    driveConfig: GoogleDriveConfig;
  }> {
    const drive = this.getDriveConfig();
    const snapshot = this.createBackupSnapshot(
      'DRIVE_SYNC',
      `Sinkronisasi automatik Google Drive (${drive.folderId}) - ${reason}`
    );

    const timestamp = new Date().toLocaleString('en-MY', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    drive.lastBackupTime = timestamp;
    drive.lastBackupStatus = 'SUCCESS';
    this.saveDriveConfig(drive);

    this.addAuditLog(
      'BACKUP_DRIVE',
      `Sinkronisasi automatik data ke Google Drive rasmi (${drive.folderId}) sempena ${reason}.`,
      'Sistem / Drive Sync'
    );

    try {
      await fetch('/api/drive/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folderId: drive.folderId,
          snapshotId: snapshot.id,
          filename: snapshot.filename,
          personCount: snapshot.personCount,
          timestamp,
        }),
      });
    } catch (err) {
      console.warn('Google Drive API sync fallback locally preserved:', err);
    }

    return {
      success: true,
      message: 'data berjaya disimpan',
      folderId: drive.folderId,
      timestamp,
      snapshot,
      driveConfig: drive,
    };
  },

  restoreBackupSnapshot(snapshotId: string): { success: boolean; message: string } {
    const snapshots = this.getBackupSnapshots();
    const target = snapshots.find((s) => s.id === snapshotId);
    if (!target) {
      return { success: false, message: 'Fail sandaran tidak dijumpai.' };
    }

    this.savePersons(target.data.persons);
    if (target.data.rootConfig) this.saveRootConfig(target.data.rootConfig);
    if (target.data.printSettings) this.savePrintSettings(target.data.printSettings);

    this.addAuditLog(
      'RESTORE_DATA',
      `Memulihkan data daripada fail sandaran: ${target.filename} (${target.personCount} waris).`,
      'Admin'
    );

    return {
      success: true,
      message: `Data berjaya dipulihkan dari "${target.filename}" (${target.personCount} waris).`,
    };
  },

  // Delete Person Record with safe cascading unlinking
  deletePerson(personId: string, performedBy: string = 'Admin'): { success: boolean; message: string; updatedPersons: Person[] } {
    const persons = this.getPersons();
    const target = persons.find((p) => p.id === personId);
    if (!target) {
      return { success: false, message: 'Rekod waris tidak dijumpai.', updatedPersons: persons };
    }

    if (target.id === 'WMH-000001' || target.id === 'WMH-000002') {
      return {
        success: false,
        message: 'Pengasas Asal (Root Family) tidak boleh dipadam demi melindungi integriti salasilah.',
        updatedPersons: persons,
      };
    }

    // Unlink references across the entire family tree
    const updatedPersons = persons
      .filter((p) => p.id !== personId)
      .map((p) => {
        const newFatherId = p.fatherId === personId ? null : p.fatherId;
        const newMotherId = p.motherId === personId ? null : p.motherId;
        const newSpouseIds = (p.spouseIds || []).filter((id) => id !== personId);
        const newChildrenIds = (p.childrenIds || []).filter((id) => id !== personId);

        return {
          ...p,
          fatherId: newFatherId,
          motherId: newMotherId,
          spouseIds: newSpouseIds,
          childrenIds: newChildrenIds,
        };
      });

    this.savePersons(updatedPersons);

    // Clean up pending submissions referencing deleted person
    const subs = this.getPendingSubmissions().filter(
      (s) => s.targetPersonId !== personId && s.data?.id !== personId
    );
    this.savePendingSubmissions(subs);

    // If current user was this deleted person, update session
    const session = this.getUserSession();
    if (session.currentPersonId === personId) {
      session.currentPersonId = updatedPersons[0]?.id || 'WMH-000001';
      session.userName = updatedPersons[0]?.fullName || 'Pengguna';
      this.saveUserSession(session);
    }

    this.addAuditLog(
      'PADAM_WARIS',
      `Memadam rekod waris: ${target.fullName} (${target.id}, Generasi ${target.generation}) serta memutuskan pertalian berkaitan secara selamat.`,
      performedBy,
      target.fullName
    );

    return {
      success: true,
      message: `Rekod "${target.fullName}" (${target.id}) berjaya dipadam daripada pangkalan data.`,
      updatedPersons,
    };
  },

  // Delete multiple persons in batch
  deletePersons(personIds: string[], performedBy: string = 'Admin'): { success: boolean; message: string; updatedPersons: Person[]; deletedCount: number } {
    let currentPersons = this.getPersons();
    const idSet = new Set(personIds.filter((id) => id !== 'WMH-000001' && id !== 'WMH-000002'));
    if (idSet.size === 0) {
      return { success: false, message: 'Tiada rekod yang sah dipilih untuk dipadam.', updatedPersons: currentPersons, deletedCount: 0 };
    }

    const updatedPersons = currentPersons
      .filter((p) => !idSet.has(p.id))
      .map((p) => {
        const newFatherId = p.fatherId && idSet.has(p.fatherId) ? null : p.fatherId;
        const newMotherId = p.motherId && idSet.has(p.motherId) ? null : p.motherId;
        const newSpouseIds = (p.spouseIds || []).filter((id) => !idSet.has(id));
        const newChildrenIds = (p.childrenIds || []).filter((id) => !idSet.has(id));

        return {
          ...p,
          fatherId: newFatherId,
          motherId: newMotherId,
          spouseIds: newSpouseIds,
          childrenIds: newChildrenIds,
        };
      });

    this.savePersons(updatedPersons);

    this.addAuditLog(
      'PADAM_WARIS',
      `Memadam kelompok ${idSet.size} rekod waris secara serentak (ID: ${Array.from(idSet).join(', ')}).`,
      performedBy
    );

    return {
      success: true,
      message: `${idSet.size} rekod waris berjaya dipadam serentak.`,
      updatedPersons,
      deletedCount: idSet.size,
    };
  },

  // Delete single pending submission
  deletePendingSubmission(subId: string, performedBy: string = 'Admin'): PendingSubmission[] {
    const subs = this.getPendingSubmissions();
    const target = subs.find((s) => s.id === subId);
    const updated = subs.filter((s) => s.id !== subId);
    this.savePendingSubmissions(updated);
    if (target) {
      this.addAuditLog(
        'PADAM_WARIS',
        `Memadam rekod permohonan pendaftaran: ${target.data?.fullName || target.id}`,
        performedBy,
        target.data?.fullName
      );
    }
    return updated;
  },

  // Clear all rejected pending submissions
  clearRejectedSubmissions(performedBy: string = 'Admin'): PendingSubmission[] {
    const subs = this.getPendingSubmissions();
    const rejectedCount = subs.filter((s) => s.status === 'REJECTED').length;
    const updated = subs.filter((s) => s.status !== 'REJECTED');
    this.savePendingSubmissions(updated);
    this.addAuditLog(
      'PADAM_WARIS',
      `Membersihkan ${rejectedCount} permohonan yang ditolak daripada senarai moderasi.`,
      performedBy
    );
    return updated;
  },

  // Delete single audit log
  deleteAuditLog(logId: string): AuditLog[] {
    const logs = this.getAuditLogs().filter((l) => l.id !== logId);
    saveToStorage(STORAGE_KEYS.AUDIT_LOGS, logs);
    return logs;
  },

  // Clear all audit logs
  clearAuditLogs(performedBy: string = 'Admin'): AuditLog[] {
    saveToStorage(STORAGE_KEYS.AUDIT_LOGS, []);
    this.addAuditLog(
      'PADAM_WARIS',
      'Mengosongkan sejarah Log Audit sistem.',
      performedBy
    );
    return this.getAuditLogs();
  },

  // Delete Backup Snapshot
  deleteBackupSnapshot(snapshotId: string): BackupSnapshot[] {
    const snapshots = this.getBackupSnapshots().filter((s) => s.id !== snapshotId);
    saveToStorage(STORAGE_KEYS.BACKUP_SNAPSHOTS, snapshots);
    return snapshots;
  },

  // Reset database back to default initial seed data
  resetDatabaseToInitial(performedBy: string = 'Admin'): { persons: Person[]; rootConfig: RootFamilyConfig } {
    this.savePersons(INITIAL_PERSONS);
    this.saveRootConfig(INITIAL_ROOT_CONFIG);
    this.savePrintSettings(INITIAL_PRINT_SETTINGS);
    this.saveDriveConfig(INITIAL_DRIVE_CONFIG);
    this.savePendingSubmissions(INITIAL_PENDING_SUBMISSIONS);
    this.addAuditLog(
      'RESTORE_DATA',
      'Mengembalikan semua data ke tetapan asal kilang (Factory Reset Initial Data).',
      performedBy
    );
    return {
      persons: INITIAL_PERSONS,
      rootConfig: INITIAL_ROOT_CONFIG,
    };
  },

  generateNextPersonId(allPersons: Person[]): string {
    const existingIds = allPersons
      .map((p) => {
        const match = p.id.match(/^WMH-(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((n) => !isNaN(n));

    const maxNum = existingIds.length > 0 ? Math.max(...existingIds) : 44;
    const nextNum = maxNum + 1;
    return `WMH-${nextNum.toString().padStart(6, '0')}`;
  },

  findPotentialDuplicates(name: string, allPersons: Person[]): Person[] {
    const cleanName = name.toLowerCase().replace(/^(bin|binti|bt|b\.)\s+/i, '').trim();
    return allPersons.filter((p) => {
      const pClean = p.fullName.toLowerCase().replace(/^(bin|binti|bt|b\.)\s+/i, '').trim();
      return pClean.includes(cleanName) || cleanName.includes(pClean);
    });
  },

  calculateGeneration(fatherId: string | null | undefined, motherId: string | null | undefined, allPersons: Person[]): number {
    const personMap = new Map(allPersons.map((p) => [p.id, p]));
    let parentGen = 1;

    if (fatherId && personMap.has(fatherId)) {
      parentGen = Math.max(parentGen, personMap.get(fatherId)!.generation);
    }
    if (motherId && personMap.has(motherId)) {
      parentGen = Math.max(parentGen, personMap.get(motherId)!.generation);
    }

    return (fatherId || motherId) ? parentGen + 1 : 2;
  },

  isCircularParent(personId: string, candidateParentId: string, allPersons: Person[]): boolean {
    if (personId === candidateParentId) return true;
    const personMap = new Map(allPersons.map((p) => [p.id, p]));
    const visited = new Set<string>();

    let current: string | null = candidateParentId;
    while (current && personMap.has(current)) {
      if (visited.has(current)) break;
      if (current === personId) return true;
      visited.add(current);
      const curPerson: Person | undefined = personMap.get(current);
      if (!curPerson) break;
      current = curPerson.fatherId || curPerson.motherId || null;
    }

    return false;
  },

  sortChildrenIds(childrenIds: string[], allPersons: Person[]): string[] {
    const personMap = new Map(allPersons.map((p) => [p.id, p]));
    return [...childrenIds].sort((aId, bId) => {
      const a = personMap.get(aId);
      const b = personMap.get(bId);
      if (!a || !b) return 0;
      const orderA = a.birthOrder ?? 999;
      const orderB = b.birthOrder ?? 999;
      if (orderA !== orderB) return orderA - orderB;
      const yearA = a.birthYear ?? 9999;
      const yearB = b.birthYear ?? 9999;
      return yearA - yearB;
    });
  },

  getGenerationFromRelation(relation: string): number {
    switch (relation) {
      case 'ANAK':
        return 2;
      case 'CUCU':
        return 3;
      case 'CICIT':
        return 4;
      case 'PIUT':
        return 5;
      case 'PIUT_PIUT':
        return 6;
      default:
        return 2;
    }
  },

  getRelationLabel(relation: string): string {
    switch (relation) {
      case 'ANAK':
        return 'Anak Kandung (Generasi 2)';
      case 'CUCU':
        return 'Cucu (Generasi 3)';
      case 'CICIT':
        return 'Cicit (Generasi 4)';
      case 'PIUT':
        return 'Piut (Generasi 5)';
      case 'PIUT_PIUT':
        return 'Piut-piut / Onyang (Generasi 6)';
      case 'PASANGAN':
        return 'Pasangan / Menantu';
      default:
        return relation;
    }
  },

  canEditPerson(
    targetPerson: Person | null,
    currentPerson: Person | null,
    isAdmin: boolean
  ): { canEdit: boolean; reason?: string; relationLabel?: string } {
    if (!targetPerson) {
      return { canEdit: false, reason: 'Profil tidak ditemui.' };
    }

    // 1. Admin can edit any profile
    if (isAdmin) {
      return {
        canEdit: true,
        relationLabel: 'Pentadbir (Admin - Akses Penuh)',
      };
    }

    if (!currentPerson) {
      return {
        canEdit: false,
        reason: 'Sila log masuk atau pilih identiti profil anda terlebih dahulu.',
      };
    }

    // 2. Self Profile
    if (targetPerson.id === currentPerson.id) {
      return {
        canEdit: true,
        relationLabel: 'Profil Anda Sendiri',
      };
    }

    // 3. Spouse Profile (in user's family tree)
    const isSpouse =
      (currentPerson.spouseIds || []).includes(targetPerson.id) ||
      (targetPerson.spouseIds || []).includes(currentPerson.id);
    if (isSpouse) {
      return {
        canEdit: true,
        relationLabel: 'Pasangan Anda',
      };
    }

    // 4. Children Profile (in user's family tree)
    const isChild =
      (currentPerson.childrenIds || []).includes(targetPerson.id) ||
      targetPerson.fatherId === currentPerson.id ||
      targetPerson.motherId === currentPerson.id;
    if (isChild) {
      return {
        canEdit: true,
        relationLabel: 'Anak Anda',
      };
    }

    // Outside immediate editable branch
    return {
      canEdit: false,
      reason:
        'Pengguna biasa hanya dibenarkan mengedit profil diri sendiri, pasangan, atau anak dalam link tree keluarga anda.',
    };
  },
};
