import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Users, DollarSign, Percent, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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

interface Props {
    group: Group;
    myId: string;
    onClose: () => void;
    onSuccess: () => void;
}

const AddGroupExpenseModal: React.FC<Props> = ({ group, myId, onClose, onSuccess }) => {
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [payer, setPayer] = useState(myId);
    const [splitMethod, setSplitMethod] = useState<'EQUAL' | 'EXACT' | 'PERCENT'>('EQUAL');
    const [splits, setSplits] = useState<{ [key: string]: number }>({});
    const [selectedMembers, setSelectedMembers] = useState<string[]>(group.members.map((m) => m.user._id));
    const [isSettlement, setIsSettlement] = useState(false);

    // Helper to calculate equal splits with penny allocation
    const calculateEqualSplits = (total: number, members: string[]) => {
        const count = members.length;
        if (count === 0) return {};

        const totalCents = Math.round(total * 100);
        const baseShareCents = Math.floor(totalCents / count);
        const remainderCents = totalCents % count;

        const newSplits: { [key: string]: number } = {};
        members.forEach((id, index) => {
            // Distribute remainder to the first 'remainderCents' users
            const shareCents = baseShareCents + (index < remainderCents ? 1 : 0);
            newSplits[id] = Number((shareCents / 100).toFixed(2));
        });
        return newSplits;
    };

    // Handle Split Method Change
    useEffect(() => {
        if (splitMethod === 'EQUAL') {
            const totalAmount = parseFloat(amount) || 0;
            setSplits(calculateEqualSplits(totalAmount, selectedMembers));
        } else if (splitMethod === 'EXACT') {
            // Reset to 0s for Exact to avoid confusion
            const newSplits: { [key: string]: number } = {};
            selectedMembers.forEach(id => newSplits[id] = 0);
            setSplits(newSplits);
        } else if (splitMethod === 'PERCENT') {
            // Default to equal percentages
            const count = selectedMembers.length;
            const val = count > 0 ? 100 / count : 0;
            const newSplits: { [key: string]: number } = {};
            selectedMembers.forEach(id => newSplits[id] = val);
            setSplits(newSplits);
        }
    }, [splitMethod]);

    // Handle Member Selection Change
    useEffect(() => {
        if (splitMethod === 'EQUAL') {
            const totalAmount = parseFloat(amount) || 0;
            setSplits(calculateEqualSplits(totalAmount, selectedMembers));
        } else if (splitMethod === 'EXACT') {
            // Preserve existing values, add 0 for new members
            setSplits(prev => {
                const newSplits: { [key: string]: number } = { ...prev };
                // Remove deselected
                Object.keys(newSplits).forEach(id => {
                    if (!selectedMembers.includes(id)) delete newSplits[id];
                });
                // Add new
                selectedMembers.forEach(id => {
                    if (newSplits[id] === undefined) newSplits[id] = 0;
                });
                return newSplits;
            });
        } else if (splitMethod === 'PERCENT') {
            // Recalculate equal percentages for simplicity when members change
            const count = selectedMembers.length;
            const val = count > 0 ? 100 / count : 0;
            const newSplits: { [key: string]: number } = {};
            selectedMembers.forEach(id => newSplits[id] = val);
            setSplits(newSplits);
        }
    }, [selectedMembers]);

    // Update Equal splits when amount changes
    useEffect(() => {
        if (splitMethod === 'EQUAL') {
            const totalAmount = parseFloat(amount) || 0;
            setSplits(calculateEqualSplits(totalAmount, selectedMembers));
        }
    }, [amount]);

    // Handle manual split changes (Exact or Percent)
    const handleSplitChange = (userId: string, val: string) => {
        const num = parseFloat(val) || 0;
        setSplits(prev => ({ ...prev, [userId]: num }));
    };

    const toggleMemberSelection = (userId: string) => {
        if (selectedMembers.includes(userId)) {
            setSelectedMembers(prev => prev.filter(id => id !== userId));
        } else {
            setSelectedMembers(prev => [...prev, userId]);
        }
    };

    // Derived values for UI feedback
    const totalSplit = Object.values(splits).reduce((a: number, b: number) => a + b, 0) as number;
    const totalAmount = parseFloat(amount) || 0;
    const remaining = totalAmount - totalSplit;
    const remainingPercent = 100 - totalSplit;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!description || !totalAmount) return;

        // Validation
        if (!isSettlement && splitMethod !== 'EQUAL') {
            if (splitMethod === 'PERCENT' && Math.abs(remainingPercent) > 0.1) {
                alert(`Percentages must add up to 100% (Current: ${(totalSplit as number).toFixed(1)}%)`);
                return;
            }
            if (splitMethod === 'EXACT' && Math.abs(remaining) > 0.1) {
                alert(`Split amounts must equal total (Remaining: ${remaining.toFixed(2)})`);
                return;
            }
        }

        // Prepare payload - use pre-calculated splits for EQUAL to preserve penny allocation
        const splitDetails = group.members.map((m) => {
            let userAmount = 0;
            if (selectedMembers.includes(m.user._id)) {
                if (splitMethod === 'EQUAL') {
                    // Use the pre-calculated penny-allocated split amount
                    userAmount = splits[m.user._id] || 0;
                } else if (splitMethod === 'PERCENT') {
                    const percent = splits[m.user._id] || 0;
                    userAmount = (totalAmount * percent) / 100;
                } else {
                    // EXACT mode
                    userAmount = splits[m.user._id] || 0;
                }
            }
            return { user: m.user._id, amount: userAmount };
        });

        try {
            await api.post(`/groups/${group._id}/expenses`, {
                description,
                amount: totalAmount,
                payer,
                splitDetails,
                isSettlement
            });
            onSuccess();
        } catch (error) {
            alert('Failed to add expense');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
            <div className="bg-white dark:bg-[#1C1C1E] w-full max-w-lg rounded-3xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto animate-[slideUp_0.3s_ease-out]">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-bold text-primary dark:text-white">Add Expense</h2>
                    <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-[#2C2C2E] rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#3A3A3C] transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-2">Description</label>
                        <input
                            type="text"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-[#2C2C2E] border border-gray-200 dark:border-[#3A3A3C] rounded-2xl px-5 py-4 text-primary dark:text-white text-lg font-semibold focus:outline-none focus:border-primary dark:focus:border-accent-blue focus:ring-2 focus:ring-primary/10 dark:focus:ring-accent-blue/10 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
                            placeholder="e.g. Dinner"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-2">Amount</label>
                        <div className="relative">
                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-lg font-bold">EGP</span>
                            <input
                                type="text"
                                inputMode="decimal"
                                value={amount}
                                onChange={e => {
                                    const val = e.target.value;
                                    if (/^\d*\.?\d{0,2}$/.test(val)) {
                                        setAmount(val);
                                    }
                                }}
                                className="w-full bg-gray-50 dark:bg-[#2C2C2E] border border-gray-200 dark:border-[#3A3A3C] rounded-2xl pl-16 pr-5 py-4 text-primary dark:text-white text-2xl font-bold focus:outline-none focus:border-primary dark:focus:border-accent-blue focus:ring-2 focus:ring-primary/10 dark:focus:ring-accent-blue/10 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    {/* Split Method Tabs */}
                    <div className="flex p-1 bg-gray-100 dark:bg-[#2C2C2E] rounded-2xl">
                        <button
                            type="button"
                            onClick={() => setSplitMethod('EQUAL')}
                            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${splitMethod === 'EQUAL' ? 'bg-white dark:bg-[#3A3A3C] text-primary dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                        >
                            = Equal
                        </button>
                        <button
                            type="button"
                            onClick={() => setSplitMethod('EXACT')}
                            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${splitMethod === 'EXACT' ? 'bg-white dark:bg-[#3A3A3C] text-primary dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                        >
                            Exact
                        </button>
                        <button
                            type="button"
                            onClick={() => setSplitMethod('PERCENT')}
                            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${splitMethod === 'PERCENT' ? 'bg-white dark:bg-[#3A3A3C] text-primary dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                        >
                            % Percent
                        </button>
                    </div>

                    {/* Feedback for Exact/Percent */}
                    {/* Feedback for Exact/Percent */}
                    <AnimatePresence mode="wait">
                        {splitMethod === 'EXACT' && totalAmount > 0 && Math.abs(remaining) > 0.01 && (
                            <motion.div
                                key="exact-error"
                                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
                                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                className={`text-center text-sm font-bold overflow-hidden ${remaining > 0 ? 'text-orange-500' : 'text-red-500'}`}
                            >
                                {remaining > 0 ? `${remaining.toFixed(2)} EGP left to split` : `${Math.abs(remaining).toFixed(2)} EGP over total`}
                            </motion.div>
                        )}
                        {splitMethod === 'PERCENT' && Math.abs(remainingPercent) > 0.1 && (
                            <motion.div
                                key="percent-error"
                                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
                                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                className={`text-center text-sm font-bold overflow-hidden ${remainingPercent > 0 ? 'text-orange-500' : 'text-red-500'}`}
                            >
                                {remainingPercent > 0 ? `${remainingPercent.toFixed(1)}% left to split` : `${Math.abs(remainingPercent).toFixed(1)}% over total`}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Members List */}
                    <div className="space-y-3 mt-4">
                        <p className="text-gray-400 dark:text-gray-500 text-xs font-bold uppercase">Split amongst</p>
                        {group.members.map((m) => {
                            const isSelected = selectedMembers.includes(m.user._id);
                            return (
                                <div key={m.user._id} className={`flex items-center justify-between p-4 rounded-2xl border shadow-sm transition-all ${isSelected ? 'bg-white dark:bg-[#1C1C1E] border-gray-100 dark:border-[#2C2C2E]' : 'bg-gray-50 dark:bg-[#2C2C2E] border-transparent opacity-60'}`}>
                                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => toggleMemberSelection(m.user._id)}>
                                        <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${isSelected ? 'bg-primary dark:bg-white border-primary dark:border-white' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-[#3A3A3C]'}`}>
                                            {isSelected && <Check size={14} className="text-white dark:text-primary" />}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-[#2C2C2E] border border-gray-200 dark:border-[#3A3A3C] flex items-center justify-center text-sm font-bold text-primary dark:text-white">
                                                {m.user.name[0]}
                                            </div>
                                            <span className="text-primary dark:text-white font-bold">{m.user.name}</span>
                                        </div>
                                    </div>

                                    {isSelected && (
                                        <motion.div
                                            initial={{ opacity: 0, width: 0 }}
                                            animate={{ opacity: 1, width: 'auto' }}
                                            exit={{ opacity: 0, width: 0 }}
                                            className="flex items-center gap-2 overflow-hidden h-[42px]"
                                        >
                                            {splitMethod === 'EQUAL' && (
                                                <div className="flex items-center h-full px-3">
                                                    <span className="text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">
                                                        {(splits[m.user._id] || 0).toFixed(2)} EGP
                                                    </span>
                                                </div>
                                            )}

                                            {splitMethod === 'EXACT' && (
                                                <div className="relative w-24 shrink-0 h-full">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-sm font-bold">EGP</span>
                                                    <input
                                                        type="text"
                                                        inputMode="decimal"
                                                        value={splits[m.user._id] || ''}
                                                        onChange={e => {
                                                            const val = e.target.value;
                                                            if (/^\d*\.?\d{0,2}$/.test(val)) {
                                                                handleSplitChange(m.user._id, val);
                                                            }
                                                        }}
                                                        className="w-full h-full bg-gray-50 dark:bg-[#2C2C2E] border border-gray-200 dark:border-[#3A3A3C] rounded-xl pl-10 pr-2 text-primary dark:text-white font-bold text-right focus:outline-none focus:border-primary dark:focus:border-accent-blue focus:ring-2 focus:ring-primary/10 dark:focus:ring-accent-blue/10 transition-all text-sm"
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                            )}

                                            {splitMethod === 'PERCENT' && (
                                                <div className="relative w-24 shrink-0 h-full">
                                                    <input
                                                        type="text"
                                                        inputMode="decimal"
                                                        value={splits[m.user._id] || ''}
                                                        onChange={e => {
                                                            const val = e.target.value;
                                                            if (/^\d*\.?\d{0,1}$/.test(val)) {
                                                                handleSplitChange(m.user._id, val);
                                                            }
                                                        }}
                                                        className="w-full h-full bg-gray-50 dark:bg-[#2C2C2E] border border-gray-200 dark:border-[#3A3A3C] rounded-xl pl-3 pr-7 text-primary dark:text-white font-bold text-right focus:outline-none focus:border-primary dark:focus:border-accent-blue focus:ring-2 focus:ring-primary/10 dark:focus:ring-accent-blue/10 transition-all text-sm"
                                                        placeholder="0"
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-sm font-bold">%</span>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <button
                        type="submit"
                        className="w-full py-4 bg-primary dark:bg-white text-white dark:text-primary rounded-2xl font-bold shadow-xl shadow-primary/30 dark:shadow-white/20 hover:bg-black/80 dark:hover:bg-gray-200 hover:scale-[1.02] active:scale-[0.98] transition-all mt-4"
                    >
                        Save Expense
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AddGroupExpenseModal;
