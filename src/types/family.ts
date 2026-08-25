export type Gender = 'male' | 'female';

export interface Person {
  id: string;
  fullName: string;
  nickname?: string;
  gender: Gender;
  generation: number; // 1 = Root (Mamat & Hafsah), 2 = Children, 3 = Grandchildren, 4 = Great-grandchildren, 5 = Great-great-grandchildren
  birthDate?: string;
  birthYear?: number;
  birthOrder?: number; // Anak yang ke (1 - 15)
  relationToFounder?: 'ANAK' | 'CUCU' | 'CICIT' | 'PIUT' | 'PIUT_PIUT' | 'PASANGAN' | 'PENGASAS' | 'LAIN';
  deathDate?: string;
  deathYear?: number;
  isDeceased: boolean;
  fatherId?: string | null;
  motherId?: string | null;
  spouseIds: string[];
  childrenIds: string[];
  phone?: string;
  isPhonePrivate?: boolean;
  email?: string;
  isEmailPrivate?: boolean;
  address?: string;
  city?: string;
  state?: string;
  occupation?: string;
  education?: string;
  avatar?: string;
  bio?: string;
  isSusuan?: boolean;
  susuanNotes?: string;
  isVerified: boolean;
  submittedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RootFamilyConfig {
  fatherId: string;
  fatherName: string;
  fatherTitle: string;
  motherId: string;
  motherName: string;
  motherTitle: string;
  tagline: string;
  motto: string;
  originLocation: string;
  establishedYear: number;
}

export interface PrintSettings {
  officialTitle: string;
  officialSubtitle: string;
  logoUrl?: string;
  showWatermark: boolean;
  watermarkText: string;
  footerText: string;
  paperSize: 'A4' | 'A3';
  orientation: 'portrait' | 'landscape';
  headerColor: string;
  includeDeceasedBadge: boolean;
  includeContact: boolean;
}

export interface GoogleDriveConfig {
  folderId: string;
  folderName: string;
  isConnected: boolean;
  lastBackupTime?: string;
  lastBackupStatus?: 'SUCCESS' | 'FAILED' | 'PENDING';
  autoBackupFrequency: 'EVERY_CHANGE' | 'HOURLY' | 'DAILY' | 'MANUAL';
  serviceAccountEmail?: string;
  backupCount: number;
}

export interface BackupSnapshot {
  id: string;
  filename: string;
  timestamp: string;
  type: 'AUTO' | 'MANUAL' | 'DRIVE_SYNC' | 'PRE_RESTORE';
  personCount: number;
  data: {
    persons: Person[];
    rootConfig: RootFamilyConfig;
    printSettings: PrintSettings;
    version: string;
  };
  notes?: string;
}

export interface AuditLog {
  id: string;
  action:
    | 'TAMBAH_WARIS'
    | 'KEMASKINI_WARIS'
    | 'PADAM_WARIS'
    | 'BACKUP_DRIVE'
    | 'RESTORE_DATA'
    | 'KEMASKINI_TETAPAN'
    | 'MODERASI_TERIMA'
    | 'MODERASI_TOLAK'
    | 'LOGIN_ADMIN'
    | 'MERGE_DUPLICATES';
  details: string;
  targetPersonName?: string;
  performedBy: string;
  timestamp: string;
  ipAddress?: string;
}

export interface PendingSubmission {
  id: string;
  type: 'NEW_PERSON' | 'UPDATE_PERSON';
  targetPersonId?: string;
  data: Partial<Person>;
  submittedBy: string;
  submittedByEmail?: string;
  submittedByPhone?: string;
  submissionNotes?: string;
  relationshipType?: string;
  timestamp: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export type UserRole = 'PUBLIC' | 'FAMILY_MEMBER' | 'EDITOR' | 'ADMIN';

export interface UserSession {
  role: UserRole;
  currentPersonId?: string; // "Saya = Ahmad"
  userEmail?: string;
  userName?: string;
  isAdminUnlocked: boolean;
}

export interface MahramAnalysis {
  person: Person;
  target: Person;
  isMahram: boolean;
  mahramType: 'NASAB' | 'MUSAHARAH' | 'RADAAH' | 'BUKAN_MAHRAM_AJNABI' | 'MAHRAM_SEMENTARA';
  title: string;
  description: string;
  relationshipPath: string[];
  syarakNotes: string;
  hukumAurat: string;
  hukumBersalaman: string;
  hukumNikah: string;
}

export interface RelationshipResult {
  personA: Person;
  personB: Person;
  relationshipName: string;
  generationalDifference: number;
  directPath: string[]; // List of names or nodes
  pathDetails: {
    from: Person;
    to: Person;
    relation: string;
  }[];
  detailedSteps?: {
    stepIndex: number;
    from: Person;
    to: Person;
    relation: string;
    direction: 'UP' | 'DOWN' | 'LATERAL' | 'SPOUSE';
  }[];
  explanation: string;
  traditionalHonorific?: string;
  kinshipSide?: string;
  commonAncestors: Person[];
  isDirectDescendant: boolean;
  isSibling: boolean;
  isCousin: boolean;
  cousinDegree?: number; // 1 for first cousin, 2 for second cousin, 3 for third cousin, etc.
  cousinDetail?: {
    degree: number;
    removed: number;
    explanation: string;
  };
  isSpouse: boolean;
  isInLaw: boolean;
  category?:
    | 'DIRI'
    | 'KETURUNAN_LANGSUNG'
    | 'LELUHUR_LANGSUNG'
    | 'ADIK_BERADIK'
    | 'SAUDARA_IBU_BAPA'
    | 'ANAK_SAUDARA'
    | 'DATUK_NENEK_SAUDARA'
    | 'CUCU_SAUDARA'
    | 'MOYANG_SAUDARA'
    | 'CICIT_SAUDARA'
    | 'PIUT_SAUDARA'
    | 'PIUT_PIUT_SAUDARA'
    | 'SEPUPU'
    | 'PASANGAN'
    | 'SEMENDA_MERTUA'
    | 'SEMENDA_MENANTU'
    | 'SEMENDA_IPAR'
    | 'SEMENDA_BIRAS'
    | 'SEMENDA_BESAN'
    | 'SEMENDA_LAIN'
    | 'WARIS_SALASILAH'
    | 'LAIN';
  generationLabelA?: string;
  generationLabelB?: string;
}
