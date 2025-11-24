import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Copy, Check } from 'lucide-react';
import { motion } from 'framer-motion';
// Modal component
import AddGroupExpenseModal from './AddGroupExpenseModal';
import SettleUpModal from './SettleUpModal';
import CategoryIcon from '../UI/CategoryIcon';
import { api } from '../../services/api';

// Proper TypeScript interfaces
interface GroupMember {
    user: {
        _id: string;
        name: string;
        email: string;
        avatar?: string;
    };
    joinedAt: string;
}

interface Group {
    _id: string;
    name: string;
    currency: string;
    inviteCode: string;
    members: GroupMember[];
    createdBy: string;
}

interface Debt {
    from: string;
    to: string;
    amount: number;
}

interface Expense {
    _id: string;
    description: string;
    amount: number;
    payer: { _id: string; name: string };
    date: string;
    isSettlement: boolean;
    category?: string;
}

const GroupView: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [group, setGroup] = useState<Group | null>(null);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [debts, setDebts] = useState<Debt[]>([]);
    const [balances, setBalances] = useState<{ [key: string]: number }>({});
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [settleDebt, setSettleDebt] = useState<Debt | null>(null);
    const [copied, setCopied] = useState(false);

    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    const [myId, setMyId] = useState<string>('');

    useEffect(() => {
        fetchGroupDetails();
        // Fetch current user ID
        api.get('/auth/me')
            .then(res => setMyId(res.data._id))
            .catch(() => { /* User will see group but not personalized view */ });
    }, [id]);

    const fetchGroupDetails = async () => {
        try {
            const res = await api.get(`/groups/${id}`);
            setGroup(res.data.group);
            setExpenses(res.data.expenses);
            setDebts(res.data.debts);
            setBalances(res.data.balances);
            setPage(1);
            setHasMore(res.data.expenses.length === 10);
        } catch (error) {
            // Error handled by loading state
        } finally {
            setLoading(false);
        }
    };

    const loadMoreExpenses = async () => {
        if (loadingMore || !hasMore) return;
        setLoadingMore(true);
        try {
            const nextPage = page + 1;
            const res = await api.get(`/groups/${id}/expenses?page=${nextPage}`);
            const newExpenses = res.data;
            if (newExpenses.length < 10) {
                setHasMore(false);
            }
            setExpenses(prev => [...prev, ...newExpenses]);
            setPage(nextPage);
        } catch (error) {
            // Error handled silently
        } finally {
            setLoadingMore(false);
        }
    };

    const copyCode = () => {
        navigator.clipboard.writeText(group.inviteCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) return <div className="p-6 text-gray-500 dark:text-gray-400">Loading...</div>;
    if (!group) return <div className="p-6 text-gray-500 dark:text-gray-400">Group not found</div>;

    const myBalance = balances[myId] || 0;

    return (
        <div className="p-6 max-w-4xl mx-auto pb-32 animate-[fadeIn_0.5s_ease-out]">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => navigate('/groups')}
                    className="w-10 h-10 rounded-full bg-white dark:bg-[#1C1C1E] shadow-sm border border-gray-200 dark:border-[#2C2C2E] flex items-center justify-center hover:bg-gray-50 dark:hover:bg-[#2C2C2E] transition-colors"
                >
                    <ArrowLeft size={20} className="text-primary dark:text-white" />
                </button>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold text-primary dark:text-white">{group.name}</h1>
                    <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 text-sm mt-1">
                        <span className="font-mono bg-gray-100 dark:bg-[#2C2C2E] px-2 py-0.5 rounded text-gray-600 dark:text-gray-300 font-bold">{group.inviteCode}</span>
                        <button onClick={copyCode} className="hover:text-primary dark:hover:text-white transition-colors">
                            {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                        </button>
                    </div>
                </div>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowAddModal(true)}
                    className="px-4 py-3 bg-primary dark:bg-white text-white dark:text-primary rounded-2xl font-bold hover:bg-black/80 dark:hover:bg-gray-200 transition-all shadow-lg shadow-primary/20 dark:shadow-white/20 flex items-center gap-2 text-sm"
                >
                    <Plus size={18} />
                    Add Expense
                </motion.button>
            </div>

            {/* Balances Summary */}
            <div className="flex flex-col gap-6 mb-8">
                {/* My Status */}
                <div className={`p-8 rounded-3xl border shadow-sm transition-all ${myBalance > 0 ? 'bg-green-50 dark:bg-green-500/10 border-green-100 dark:border-green-500/20' :
                    myBalance < 0 ? 'bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20' :
                        'bg-white dark:bg-[#1C1C1E] border-gray-100 dark:border-[#2C2C2E]'
                    }`}>
                    <p className={`text-sm font-bold uppercase mb-2 ${myBalance > 0 ? 'text-green-600' :
                        myBalance < 0 ? 'text-red-600' :
                            'text-gray-400 dark:text-gray-500'
                        }`}>Your Net Balance</p>
                    <h2 className={`text-4xl font-bold mb-2 ${myBalance > 0 ? 'text-green-600' :
                        myBalance < 0 ? 'text-red-600' :
                            'text-primary dark:text-white'
                        }`}>
                        {myBalance > 0 ? '+' : ''}{myBalance.toFixed(2)} <span className="text-lg text-gray-400 dark:text-gray-500 font-medium">{group.currency}</span>
                    </h2>
                    <p className={`text-sm font-medium ${myBalance > 0 ? 'text-green-700/60 dark:text-green-400/60' :
                        myBalance < 0 ? 'text-red-700/60 dark:text-red-400/60' :
                            'text-gray-400 dark:text-gray-500'
                        }`}>
                        {myBalance > 0 ? 'You are owed money' :
                            myBalance < 0 ? 'You owe money' :
                                'You are all settled up'}
                    </p>
                </div>

                {/* Who owes Who */}
                <div className="bg-white dark:bg-[#1C1C1E] p-8 rounded-3xl border border-gray-100 dark:border-[#2C2C2E] shadow-sm">
                    <h3 className="text-lg font-bold text-primary dark:text-white mb-6">Suggested Payments</h3>
                    {debts.length === 0 ? (
                        <div className="text-gray-400 dark:text-gray-500 text-sm flex items-center gap-2">
                            <Check size={16} />
                            All debts settled.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {debts.map((debt, idx) => {
                                const fromName = group.members.find((m) => m.user._id === debt.from)?.user.name || 'Unknown';
                                const toName = group.members.find((m) => m.user._id === debt.to)?.user.name || 'Unknown';
                                const isMeFrom = debt.from === myId;
                                const isMeTo = debt.to === myId;

                                return (
                                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 dark:bg-[#2C2C2E] rounded-2xl border border-gray-100 dark:border-[#3A3A3C] gap-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-10 h-10 rounded-full bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-[#3A3A3C] flex items-center justify-center text-sm font-bold text-primary dark:text-white shadow-sm shrink-0">
                                                {fromName[0]}
                                            </div>
                                            <div className="flex flex-col truncate">
                                                <span className="text-gray-900 dark:text-white font-bold text-sm truncate">
                                                    {isMeFrom ? 'You' : fromName}
                                                </span>
                                                <span className="text-gray-400 dark:text-gray-500 text-xs flex items-center gap-1">
                                                    {isMeFrom ? 'owe' : 'owes'} {isMeTo ? 'You' : toName}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto mt-1 sm:mt-0 pl-12 sm:pl-0">
                                            <span className="font-bold text-primary dark:text-white text-lg">
                                                {debt.amount.toFixed(2)}
                                            </span>
                                            {isMeFrom && (
                                                <button
                                                    onClick={() => setSettleDebt(debt)}
                                                    className="px-4 py-2 bg-primary dark:bg-white text-white dark:text-primary rounded-xl font-bold text-xs hover:bg-black/90 dark:hover:bg-gray-200 transition-all shadow-lg shadow-primary/20 dark:shadow-white/20 flex items-center gap-2 active:scale-95 whitespace-nowrap"
                                                >
                                                    <Check size={14} strokeWidth={3} />
                                                    Settle
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Expenses List */}
            <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl border border-gray-100 dark:border-[#2C2C2E] shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-50 dark:border-[#2C2C2E] flex justify-between items-center">
                    <h3 className="text-lg font-bold text-primary dark:text-white">Recent Activity</h3>
                </div>
                <div className="divide-y divide-gray-50 dark:divide-[#2C2C2E]">
                    {expenses.length === 0 ? (
                        <div className="p-12 text-center text-gray-400 dark:text-gray-500">No expenses yet.</div>
                    ) : (
                        <>
                            {expenses.map(exp => (
                                <div key={exp._id} className="p-5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#2C2C2E] transition-colors group cursor-pointer">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl shadow-sm ${exp.isSettlement ? 'bg-green-100 dark:bg-green-500/10 text-green-600' : 'bg-gray-100 dark:bg-[#2C2C2E] text-gray-600 dark:text-gray-300'
                                            }`}>
                                            {exp.isSettlement ? <Check size={20} /> : <CategoryIcon category={exp.category || 'General'} size={20} />}
                                        </div>
                                        <div>
                                            <h4 className="text-primary dark:text-white font-bold text-lg">{exp.description}</h4>
                                            <p className="text-gray-400 dark:text-gray-500 text-xs font-medium mt-0.5">
                                                <span className="text-gray-600 dark:text-gray-300">{exp.payer._id === myId ? 'You' : exp.payer.name}</span> paid {exp.amount.toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-gray-400 dark:text-gray-500 text-xs font-medium bg-gray-100 dark:bg-[#2C2C2E] px-2 py-1 rounded-lg">
                                            {new Date(exp.date).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {hasMore && (
                                <div className="p-4 text-center">
                                    <button
                                        onClick={loadMoreExpenses}
                                        disabled={loadingMore}
                                        className="text-primary dark:text-white font-bold text-sm hover:underline disabled:opacity-50"
                                    >
                                        {loadingMore ? 'Loading...' : 'Load More'}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {showAddModal && (
                <AddGroupExpenseModal
                    group={group}
                    myId={myId}
                    onClose={() => setShowAddModal(false)}
                    onSuccess={() => {
                        setShowAddModal(false);
                        fetchGroupDetails();
                    }}
                />
            )}

            {settleDebt && (
                <SettleUpModal
                    group={group}
                    debt={settleDebt}
                    onClose={() => setSettleDebt(null)}
                    onSuccess={() => {
                        setSettleDebt(null);
                        fetchGroupDetails();
                    }}
                />
            )}
        </div>
    );
};

export default GroupView;
