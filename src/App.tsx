import React, { useState, useEffect } from 'react';
import { Person, UserSession, RootFamilyConfig, PrintSettings, GoogleDriveConfig } from './types/family';
import { storageService } from './services/storageService';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { HomeView } from './components/HomeView';
import { FamilyTreeView } from './components/FamilyTreeView';
import { WarisListView } from './components/WarisListView';
import { SearchAndRelationshipView } from './components/SearchAndRelationshipView';
import { AIWarisChatView } from './components/AIWarisChatView';
import { PrintView } from './components/PrintView';
import { MyProfileView } from './components/MyProfileView';
import { AdminPanelView } from './components/AdminPanelView';
import { PersonDetailModal } from './components/PersonDetailModal';
import { TreeDeciduous, Heart, Shield, Sparkles } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [allPersons, setAllPersons] = useState<Person[]>(() => storageService.getPersons());
  const [rootConfig, setRootConfig] = useState<RootFamilyConfig>(() => storageService.getRootConfig());
  const [printSettings, setPrintSettings] = useState<PrintSettings>(() => storageService.getPrintSettings());
  const [driveConfig, setDriveConfig] = useState<GoogleDriveConfig>(() => storageService.getDriveConfig());
  const [userSession, setUserSession] = useState<UserSession>(() => storageService.getUserSession());

  // Modal State
  const [selectedPersonForDetail, setSelectedPersonForDetail] = useState<Person | null>(null);

  // Search/Relationship pre-selected params
  const [searchTargetBId, setSearchTargetBId] = useState<string | undefined>(undefined);

  // Synchronize session changes
  const handleUpdateSession = (newSession: UserSession) => {
    setUserSession(newSession);
    storageService.saveUserSession(newSession);
  };

  // Find Current User Person Object
  const currentPerson = allPersons.find((p) => p.id === userSession.currentPersonId) || allPersons[0] || null;

  // Pending Submissions Count
  const pendingCount = storageService.getPendingSubmissions().filter((s) => s.status === 'PENDING').length;

  const handleOpenPersonDetail = (person: Person) => {
    setSelectedPersonForDetail(person);
  };

  const handleDeletePerson = (person: Person) => {
    const res = storageService.deletePerson(person.id, userSession.userName || 'Admin');
    if (res.success) {
      setAllPersons(res.updatedPersons);
      if (selectedPersonForDetail?.id === person.id) {
        setSelectedPersonForDetail(null);
      }
    }
    return res;
  };

  const handleNavigateWithParams = (tab: string, extra?: { personBId?: string }) => {
    if (extra?.personBId) {
      setSearchTargetBId(extra.personBId);
    }
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Main Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userSession={userSession}
        setUserSession={handleUpdateSession}
        rootConfig={rootConfig}
        allPersons={allPersons}
        currentPerson={currentPerson}
        onOpenPersonDetail={handleOpenPersonDetail}
        pendingCount={pendingCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Tab 1: Home */}
        {activeTab === 'home' && (
          <HomeView
            rootConfig={rootConfig}
            allPersons={allPersons}
            currentPerson={currentPerson}
            setActiveTab={setActiveTab}
            onOpenPersonDetail={handleOpenPersonDetail}
          />
        )}

        {/* Tab 2: Tree */}
        {activeTab === 'tree' && (
          <FamilyTreeView
            allPersons={allPersons}
            currentPerson={currentPerson}
            onOpenPersonDetail={handleOpenPersonDetail}
            isAdmin={Boolean(userSession.isAdminUnlocked)}
            userSession={userSession}
            onUpdatePersons={(updated) => setAllPersons(updated)}
            driveConfig={driveConfig}
            onUpdateDriveConfig={(dc) => setDriveConfig(dc)}
          />
        )}

        {/* Tab 3: Waris Directory */}
        {activeTab === 'waris' && (
          <WarisListView
            allPersons={allPersons}
            currentPerson={currentPerson}
            onOpenPersonDetail={handleOpenPersonDetail}
            isAdmin={Boolean(userSession.isAdminUnlocked)}
            userSession={userSession}
            onUpdatePersons={(updated) => setAllPersons(updated)}
            driveConfig={driveConfig}
            onUpdateDriveConfig={(dc) => setDriveConfig(dc)}
          />
        )}

        {/* Tab 4: Search & Relationship ("Apa Hubungan Kita?") */}
        {activeTab === 'search' && (
          <SearchAndRelationshipView
            allPersons={allPersons}
            currentPerson={currentPerson}
            onOpenPersonDetail={handleOpenPersonDetail}
            initialPersonAId={currentPerson?.id}
            initialPersonBId={searchTargetBId}
          />
        )}

        {/* Tab 5: AI Waris */}
        {activeTab === 'ai' && (
          <AIWarisChatView
            allPersons={allPersons}
            currentPerson={currentPerson}
            setActiveTab={setActiveTab}
            onOpenPersonDetail={handleOpenPersonDetail}
          />
        )}

        {/* Tab 7: Print / PDF */}
        {activeTab === 'print' && (
          <PrintView
            allPersons={allPersons}
            rootConfig={rootConfig}
            printSettings={printSettings}
            currentPerson={currentPerson}
            isAdmin={Boolean(userSession.isAdminUnlocked)}
          />
        )}

        {/* Tab 8: My Profile & Add Member */}
        {activeTab === 'profile' && (
          <MyProfileView
            allPersons={allPersons}
            currentPerson={currentPerson}
            userSession={userSession}
            setUserSession={handleUpdateSession}
            onUpdatePersons={(updated) => setAllPersons(updated)}
            onOpenPersonDetail={handleOpenPersonDetail}
            driveConfig={driveConfig}
            onUpdateDriveConfig={(dc) => setDriveConfig(dc)}
          />
        )}

        {/* Tab 9: Admin Panel */}
        {activeTab === 'admin' && userSession.isAdminUnlocked && (
          <AdminPanelView
            allPersons={allPersons}
            onUpdatePersons={(updated) => setAllPersons(updated)}
            rootConfig={rootConfig}
            onUpdateRootConfig={(cfg) => setRootConfig(cfg)}
            printSettings={printSettings}
            onUpdatePrintSettings={(st) => setPrintSettings(st)}
            driveConfig={driveConfig}
            onUpdateDriveConfig={(dc) => setDriveConfig(dc)}
            userSession={userSession}
            onOpenPersonDetail={handleOpenPersonDetail}
          />
        )}
      </main>

      {/* Person Detail Drawer / Modal */}
      {selectedPersonForDetail && (
        <PersonDetailModal
          person={selectedPersonForDetail}
          onClose={() => setSelectedPersonForDetail(null)}
          allPersons={allPersons}
          currentPerson={currentPerson}
          onSelectPerson={(p) => setSelectedPersonForDetail(p)}
          onNavigateToTab={handleNavigateWithParams}
          isAdmin={Boolean(userSession.isAdminUnlocked)}
          onDeletePerson={handleDeletePerson}
          onUpdatePersons={(updated) => setAllPersons(updated)}
          userSession={userSession}
          driveConfig={driveConfig}
          onUpdateDriveConfig={(dc) => setDriveConfig(dc)}
        />
      )}

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-8 px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-400 space-y-2 mb-14 md:mb-0">
        <div className="flex items-center justify-center space-x-2 text-white font-bold text-sm">
          <TreeDeciduous className="w-4 h-4 text-emerald-400" />
          <span>WARIS MAMAT & HAFSAH</span>
        </div>
        <p className="max-w-xl mx-auto text-[11px] text-slate-400">
          "{rootConfig.tagline}"
        </p>
        <p className="text-[10px] text-slate-400">
          Pangkalan Data Keturunan Rasmi • Google Drive Folder: <span className="font-mono text-emerald-400">{driveConfig.folderId}</span>
        </p>
      </footer>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingCount={pendingCount}
        isAdmin={Boolean(userSession.isAdminUnlocked)}
      />
    </div>
  );
}
