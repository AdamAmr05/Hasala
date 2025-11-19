import React from 'react';

interface TabBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const TabBar: React.FC<TabBarProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'home', icon: 'Home', label: 'Home' },
    { id: 'add', icon: 'Plus', label: 'Add', isMain: true },
    { id: 'chat', icon: 'MessageCircle', label: 'Hasala AI' },
    { id: 'family', icon: 'Users', label: 'Family' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 flex justify-center z-50 pb-8 pointer-events-none">
      <div className="w-full max-w-md px-6 pointer-events-auto">
        <div className="glass-dark bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-white/20 flex justify-around items-center h-20 px-2 relative">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center w-16 h-full transition-all duration-300 relative z-10 ${
                tab.isMain ? '-mt-12' : ''
              }`}
            >
              {tab.isMain ? (
                <div className="w-16 h-16 bg-[#007AFF] rounded-full shadow-[0_8px_24px_rgba(0,122,255,0.35)] flex items-center justify-center text-white transform transition hover:scale-105 active:scale-95 ring-4 ring-[#F2F2F7]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </div>
              ) : (
                <div className={`flex flex-col items-center transition-colors duration-300 ${activeTab === tab.id ? 'text-[#007AFF]' : 'text-gray-400'}`}>
                  {tab.icon === 'Home' && <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill={activeTab === tab.id ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>}
                  {tab.icon === 'MessageCircle' && <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill={activeTab === tab.id ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>}
                  {tab.icon === 'Users' && <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill={activeTab === tab.id ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>}
                  <span className="text-[10px] font-medium mt-1 tracking-tight">{tab.label}</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TabBar;