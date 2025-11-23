import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Plus, Copy, Check } from 'lucide-react';
// Modal component
import AddGroupExpenseModal from './AddGroupExpenseModal';

interface Member {
    user: {
        _id: string;
        name: string;
        email: string;
        avatar?: string;
    };
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
}

const GroupView: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [group, setGroup] = useState<any>(null);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [debts, setDebts] = useState<Debt[]>([]);
    const [balances, setBalances] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [copied, setCopied] = useState(false);

    // Get current user ID from localStorage or context (assuming stored in localStorage for now as per common pattern, or we'd need a context hook)
    // For this snippet, I'll rely on the fact that the API returns data relative to the user, but for UI highlighting I might need it.
    // Let's assume we can derive "Me" from the fact that I'm viewing it, but for "You owe X", I need my ID.
    // I'll fetch user profile or decode token if needed, but for now let's just use the balances map keys.
    const [myId, setMyId] = useState<string>('');

    useEffect(() => {
        fetchGroupDetails();
        // Quick hack to get my ID: fetch /api/auth/me or parse token. 
        // For now, let's assume the backend response might help or we just check who I am.
        // Actually, let's fetch /api/auth/me to be sure.
        axios.get('http://localhost:5001/api/auth/me', { withCredentials: true })
            .then(res => setMyId(res.data.data._id))
            .catch(err => console.error(err));
    }, [id]);

    const fetchGroupDetails = async () => {
        try {
            const res = await axios.get(`http://localhost:5001/api/groups/${id}`, {
                withCredentials: true
            });
            setGroup(res.data.group);
            setExpenses(res.data.expenses);
            setDebts(res.data.debts);
            setBalances(res.data.balances);
        } catch (error) {
            console.error('Error fetching group:', error);
        } finally {
            setLoading(false);
        }
    };

    const copyCode = () => {
        navigator.clipboard.writeText(group.inviteCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) return <div className="p-6 text-white/40">Loading...</div>;
    if (!group) return <div className="p-6 text-white/40">Group not found</div>;

    const myBalance = balances[myId] || 0;

    return (
        <div className="p-6 max-w-4xl mx-auto pb-32 animate-[fadeIn_0.5s_ease-out]">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => navigate('/groups')}
                    className="w-10 h-10 rounded-full bg-white shadow-sm border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                >
                    <ArrowLeft size={20} className="text-primary" />
                </button>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold text-primary">{group.name}</h1>
                    <div className="flex items-center gap-2 text-gray-400 text-sm mt-1">
                        <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-600 font-bold">{group.inviteCode}</span>
                        <button onClick={copyCode} className="hover:text-primary transition-colors">
                            {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                        </button>
                    </div>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="px-4 py-3 bg-primary text-white rounded-2xl font-bold hover:bg-black/80 transition-all shadow-lg shadow-primary/20 flex items-center gap-2 text-sm"
                >
                    <Plus size={18} />
                    Add Expense
                </button>
            </div>

            {/* Balances Summary */}
            <div className="grid gap-6 md:grid-cols-2 mb-8">
                {/* My Status */}
                <div className={`p-8 rounded-3xl border shadow-sm transition-all ${myBalance > 0 ? 'bg-green-50 border-green-100' :
                    myBalance < 0 ? 'bg-red-50 border-red-100' :
                        'bg-white border-gray-100'
                    }`}>
                    <p className={`text-sm font-bold uppercase mb-2 ${myBalance > 0 ? 'text-green-600' :
                        myBalance < 0 ? 'text-red-600' :
                            'text-gray-400'
                        }`}>Your Net Balance</p>
                    <h2 className={`text-4xl font-bold mb-2 ${myBalance > 0 ? 'text-green-600' :
                        myBalance < 0 ? 'text-red-600' :
                            'text-primary'
                        }`}>
                        {myBalance > 0 ? '+' : ''}{myBalance.toFixed(2)} <span className="text-lg text-gray-400 font-medium">{group.currency}</span>
                    </h2>
                    <p className={`text-sm font-medium ${myBalance > 0 ? 'text-green-700/60' :
                        myBalance < 0 ? 'text-red-700/60' :
                            'text-gray-400'
                        }`}>
                        {myBalance > 0 ? 'You are owed money' :
                            myBalance < 0 ? 'You owe money' :
                                'You are all settled up'}
                    </p>
                </div>

                {/* Who owes Who */}
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-bold text-primary mb-6">Suggested Payments</h3>
                    {debts.length === 0 ? (
                        <div className="text-gray-400 text-sm flex items-center gap-2">
                            <Check size={16} />
                            All debts settled.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {debts.map((debt, idx) => {
                                const fromName = group.members.find((m: any) => m.user._id === debt.from)?.user.name || 'Unknown';
                                const toName = group.members.find((m: any) => m.user._id === debt.to)?.user.name || 'Unknown';
                                const isMeFrom = debt.from === myId;
                                const isMeTo = debt.to === myId;

                                return (
                                    <div key={idx} className="flex items-center justify-between text-sm p-3 bg-gray-50 rounded-2xl border border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xs font-bold text-primary shadow-sm">
                                                {fromName[0]}
                                            </div>
                                            <span className="text-gray-600 font-medium">
                                                {isMeFrom ? <span className="text-primary font-bold">You</span> : fromName}
                                                <span className="text-gray-400 mx-1">→</span>
                                                {isMeTo ? <span className="text-primary font-bold">You</span> : toName}
                                            </span>
                                        </div>
                                        <span className="font-bold text-primary bg-white px-3 py-1 rounded-lg border border-gray-200 shadow-sm">
                                            {debt.amount.toFixed(2)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Expenses List */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-primary">Recent Activity</h3>
                </div>
                <div className="divide-y divide-gray-50">
                    {expenses.length === 0 ? (
                        <div className="p-12 text-center text-gray-400">No expenses yet.</div>
                    ) : (
                        expenses.map(exp => (
                            <div key={exp._id} className="p-5 flex items-center justify-between hover:bg-gray-50 transition-colors group cursor-pointer">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm ${exp.isSettlement ? 'bg-green-100 text-green-600' : 'bg-blue-50 text-blue-500'
                                        }`}>
                                        {exp.isSettlement ? '$' : '🧾'}
                                    </div>
                                    <div>
                                        <h4 className="text-primary font-bold text-lg">{exp.description}</h4>
                                        <p className="text-gray-400 text-xs font-medium mt-0.5">
                                            <span className="text-gray-600">{exp.payer._id === myId ? 'You' : exp.payer.name}</span> paid {exp.amount.toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-gray-400 text-xs font-medium bg-gray-100 px-2 py-1 rounded-lg">
                                        {new Date(exp.date).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        ))
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
        </div>
    );
};

export default GroupView;
