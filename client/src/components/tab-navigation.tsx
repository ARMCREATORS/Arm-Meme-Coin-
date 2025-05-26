import { Check, Users, Trophy, User } from "lucide-react";

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  const tabs = [
    { id: 'tasks', label: 'Tasks', icon: Check },
    { id: 'referrals', label: 'Referrals', icon: Users },
    { id: 'leaderboard', label: 'Rankings', icon: Trophy },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white dark:bg-card border-t border-gray-200 dark:border-gray-700 z-50 safe-area-inset-bottom glass-effect">
      <div className="flex justify-around py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center py-2 px-4 transition-colors touch-friendly ${
                isActive 
                  ? 'text-cyan-500 dark:text-cyan-400' 
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              <Icon className="text-lg mb-1 h-5 w-5" />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
