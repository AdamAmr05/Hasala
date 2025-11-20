import React from 'react';
import { Home, MessageCircle, PieChart, Settings, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';

interface TabBarProps {
  onAddClick: () => void;
}

const TabBar: React.FC<TabBarProps> = ({ onAddClick }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab = location.pathname;

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 flex justify-center z-40 pb-8 pointer-events-none">
      <div className="w-full max-w-md px-6 pointer-events-auto">
        <div className="glass bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-float border border-white/20 flex justify-around items-center h-20 px-2 relative">

          <TabButton
            path="/"
            icon={<Home size={24} />}
            label="Home"
            isActive={activeTab === '/'}
            onClick={handleNavigation}
          />

          <TabButton
            path="/chat"
            icon={<MessageCircle size={24} />}
            label="Hasala AI"
            isActive={activeTab === '/chat'}
            onClick={handleNavigation}
          />

          {/* Central Action Button */}
          <div className="-mt-12 relative z-10">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onAddClick}
              className="w-16 h-16 rounded-full bg-primary text-white shadow-xl flex items-center justify-center ring-4 ring-[#F2F2F7]"
            >
              <Plus size={32} />
            </motion.button>
          </div>

          <TabButton
            path="/analytics"
            icon={<PieChart size={24} />}
            label="Analytics"
            isActive={activeTab === '/analytics'}
            onClick={handleNavigation}
          />

          <TabButton
            path="/settings"
            icon={<Settings size={24} />}
            label="Settings"
            isActive={activeTab === '/settings'}
            onClick={handleNavigation}
          />

        </div>
      </div>
    </div>
  );
};

const TabButton: React.FC<{ path: string; icon: React.ReactNode; label: string; isActive: boolean; onClick: (path: string) => void }> = ({ path, icon, label, isActive, onClick }) => (
  <button
    onClick={() => onClick(path)}
    className={`flex flex-col items-center justify-center w-14 h-full transition-colors duration-300 relative ${isActive ? 'text-accent-blue' : 'text-gray-400'}`}
  >
    {icon}
    <span className="text-[10px] font-medium mt-1 tracking-tight">{label}</span>
    {isActive && (
      <motion.div
        layoutId="activeTab"
        className="absolute -bottom-1 w-1 h-1 rounded-full bg-accent-blue"
      />
    )}
  </button>
);

export default TabBar;
