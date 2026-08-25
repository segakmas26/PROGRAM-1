import React from 'react';
import { Home, TreeDeciduous, Users, Search, Sparkles, User, Printer } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  pendingCount: number;
  isAdmin: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  pendingCount,
  isAdmin,
}) => {
  const navItems = [
    { id: 'home', label: 'Utama', icon: Home },
    { id: 'tree', label: 'Susur Galur', icon: TreeDeciduous },
    { id: 'search', label: 'Cari & Hubung', icon: Search },
    { id: 'ai', label: 'AI Waris', icon: Sparkles },
    { id: 'profile', label: 'Profil', icon: User },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-emerald-950/95 border-t border-emerald-800/80 backdrop-blur-md px-2 py-1.5 shadow-2xl">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`bottom-nav-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
                isActive
                  ? 'text-emerald-300 font-bold scale-105'
                  : 'text-emerald-400/70 hover:text-emerald-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-300' : 'text-emerald-400/80'}`} />
                {item.id === 'profile' && pendingCount > 0 && isAdmin && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight font-medium">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
