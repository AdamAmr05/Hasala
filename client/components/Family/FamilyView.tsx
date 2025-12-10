import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Plus, UserPlus, Copy, Check, X, ChevronRight,
  AlertTriangle, CheckCircle, XCircle, TrendingUp, PieChart
} from 'lucide-react';
import {
  familyApi,
  FamilyGroup,
  FamilyMemberSummary,
  FamilyDetailsResponse,
} from '../../services/api';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer } from 'recharts';

// ============================================================================
// Constants
// ============================================================================

const CATEGORY_COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#06b6d4', '#f97316'];

const STATUS_CONFIG = {
  safe: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
  warning: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  critical: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
};

// ============================================================================
// Sub-Components
// ============================================================================

const CreateFamilyModal: React.FC<{ onClose: () => void; onSuccess: () => void }> = ({ onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (familyName: string) => familyApi.create(familyName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['families'] });
      onSuccess();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      createMutation.mutate(name.trim());
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white dark:bg-[#1C1C1E] rounded-3xl p-6 shadow-xl"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create Family</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Family Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Amr Family"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#2C2C2E] text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={!name.trim() || createMutation.isPending}
            className="w-full py-3 px-4 bg-primary text-white font-semibold rounded-xl disabled:opacity-50 transition-all hover:bg-primary/90"
          >
            {createMutation.isPending ? 'Creating...' : 'Create Family'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
};

const JoinFamilyModal: React.FC<{ onClose: () => void; onSuccess: () => void }> = ({ onClose, onSuccess }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const queryClient = useQueryClient();

  const joinMutation = useMutation({
    mutationFn: (inviteCode: string) => familyApi.join(inviteCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['families'] });
      onSuccess();
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to join family');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (code.trim()) {
      joinMutation.mutate(code.trim());
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white dark:bg-[#1C1C1E] rounded-3xl p-6 shadow-xl"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Join Family</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Invite Code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Enter code (e.g., ABC123)"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#2C2C2E] text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-center text-lg tracking-widest"
              autoFocus
              maxLength={8}
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={!code.trim() || joinMutation.isPending}
            className="w-full py-3 px-4 bg-primary text-white font-semibold rounded-xl disabled:opacity-50 transition-all hover:bg-primary/90"
          >
            {joinMutation.isPending ? 'Joining...' : 'Join Family'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
};

const MemberCard: React.FC<{ member: FamilyMemberSummary; isExpanded: boolean; onToggle: () => void }> = ({
  member,
  isExpanded,
  onToggle,
}) => {
  const StatusIcon = STATUS_CONFIG[member.status].icon;
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

  return (
    <motion.div
      layout
      className="bg-white dark:bg-[#1C1C1E] rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800"
    >
      {/* Main Row */}
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center gap-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center text-primary font-bold text-lg">
          {member.user.name.charAt(0).toUpperCase()}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">{member.user.name}</h3>
            {member.role === 'ADMIN' && (
              <span className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary rounded-full font-medium">
                Admin
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{member.insight}</p>
        </div>

        {/* Status */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="font-bold text-gray-900 dark:text-white">
              {member.totalSpent.toLocaleString()}
              <span className="text-xs text-gray-400 ml-1">EGP</span>
            </p>
            <p className="text-xs text-gray-500">{Math.round(member.budgetPercentUsed)}% of budget</p>
          </div>
          <div className={`p-2 rounded-full ${STATUS_CONFIG[member.status].bg}`}>
            <StatusIcon size={18} className={STATUS_CONFIG[member.status].color} />
          </div>
          <ChevronRight
            size={18}
            className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
          />
        </div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-2 border-t border-gray-100 dark:border-gray-800">
              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Income</p>
                  <p className="font-bold text-gray-900 dark:text-white">
                    {member.totalIncome.toLocaleString()}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Spent</p>
                  <p className="font-bold text-gray-900 dark:text-white">
                    {member.totalSpent.toLocaleString()}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Budget</p>
                  <p className="font-bold text-gray-900 dark:text-white">
                    {member.budget > 0 ? member.budget.toLocaleString() : 'Not set'}
                  </p>
                </div>
              </div>

              {/* Category Breakdown Chart */}
              {member.categoryBreakdown.length > 0 && (
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie>
                        <Pie
                          data={member.categoryBreakdown as any}
                          dataKey="amount"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={20}
                          outerRadius={40}
                          paddingAngle={2}
                          onMouseEnter={(_, index) => setActiveIndex(index)}
                          onMouseLeave={() => setActiveIndex(null)}
                        >
                          {member.categoryBreakdown.map((_, index) => (
                            <Cell
                              key={index}
                              fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                              opacity={activeIndex === null || activeIndex === index ? 1 : 0.4}
                              style={{ transition: 'opacity 0.15s ease' }}
                            />
                          ))}
                        </Pie>
                      </RechartsPie>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    {member.categoryBreakdown.slice(0, 4).map((cat, idx) => (
                      <div
                        key={cat.name}
                        className={`flex items-center gap-2 transition-opacity duration-150 cursor-default ${activeIndex === null || activeIndex === idx ? 'opacity-100' : 'opacity-40'
                          }`}
                        onMouseEnter={() => setActiveIndex(idx)}
                        onMouseLeave={() => setActiveIndex(null)}
                      >
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }}
                        />
                        <span className="text-xs text-gray-600 dark:text-gray-400 truncate">{cat.name}</span>
                        <span className="text-xs font-medium text-gray-900 dark:text-white ml-auto">
                          {cat.amount.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const FamilyDetailView: React.FC<{ familyId: string; onBack: () => void }> = ({ familyId, onBack }) => {
  const [expandedMember, setExpandedMember] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { data, isLoading } = useQuery<FamilyDetailsResponse>({
    queryKey: ['family', familyId],
    queryFn: () => familyApi.getDetails(familyId),
  });

  const handleCopyCode = () => {
    if (data?.family.inviteCode) {
      navigator.clipboard.writeText(data.family.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Family not found</p>
        <button onClick={onBack} className="mt-4 text-primary font-medium">
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          <ChevronRight size={20} className="rotate-180" />
          <span>Back</span>
        </button>
      </div>

      {/* Family Info Card */}
      <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-3xl p-6 border border-primary/20">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{data.family.name}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {data.members.length} member{data.members.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Invite Code:</span>
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 rounded-lg font-mono text-sm font-bold shadow-sm hover:shadow transition-all"
            >
              {data.family.inviteCode}
              {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-gray-400" />}
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/60 dark:bg-gray-800/60 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-500">Total Spent</p>
            <p className="font-bold text-lg text-gray-900 dark:text-white">
              {data.members.reduce((sum, m) => sum + m.totalSpent, 0).toLocaleString()}
              <span className="text-xs text-gray-400 ml-1">EGP</span>
            </p>
          </div>
          <div className="bg-white/60 dark:bg-gray-800/60 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-500">At Risk</p>
            <p className="font-bold text-lg text-amber-500">
              {data.members.filter((m) => m.status !== 'safe').length}
            </p>
          </div>
          <div className="bg-white/60 dark:bg-gray-800/60 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-500">Doing Great</p>
            <p className="font-bold text-lg text-green-500">
              {data.members.filter((m) => m.status === 'safe').length}
            </p>
          </div>
        </div>
      </div>

      {/* Members List */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-1">
          Members
        </h2>
        {data.members.map((member) => (
          <MemberCard
            key={member.user._id}
            member={member}
            isExpanded={expandedMember === member.user._id}
            onToggle={() => setExpandedMember(expandedMember === member.user._id ? null : member.user._id)}
          />
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

const FamilyView: React.FC = () => {
  const [selectedFamily, setSelectedFamily] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  const { data: families, isLoading } = useQuery<FamilyGroup[]>({
    queryKey: ['families'],
    queryFn: familyApi.list,
  });

  // Show detail view if a family is selected
  if (selectedFamily) {
    return (
      <div className="pt-8 px-6 pb-24">
        <FamilyDetailView familyId={selectedFamily} onBack={() => setSelectedFamily(null)} />
      </div>
    );
  }

  return (
    <div className="pt-8 px-6 pb-24 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Family Sync</h1>
        <p className="text-gray-500 dark:text-gray-400">Monitor your family's financial health together.</p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-all"
        >
          <Plus size={18} />
          Create Family
        </button>
        <button
          onClick={() => setShowJoinModal(true)}
          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
        >
          <UserPlus size={18} />
          Join Family
        </button>
      </div>

      {/* Families List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : families && families.length > 0 ? (
        <div className="space-y-3">
          {families.map((family) => (
            <motion.button
              key={family._id}
              onClick={() => setSelectedFamily(family._id)}
              className="w-full bg-white dark:bg-[#1C1C1E] rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-4 text-left hover:shadow-md transition-all"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                <Users size={24} className="text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">{family.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {family.members.length} member{family.members.length !== 1 ? 's' : ''}
                </p>
              </div>
              <ChevronRight size={20} className="text-gray-400" />
            </motion.button>
          ))}
        </div>
      ) : (
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-3xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <Users size={32} className="text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No families yet</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs mx-auto">
            Create a new family group or join an existing one using an invite code.
          </p>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateFamilyModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => setShowCreateModal(false)}
          />
        )}
        {showJoinModal && (
          <JoinFamilyModal
            onClose={() => setShowJoinModal(false)}
            onSuccess={() => setShowJoinModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default FamilyView;