import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Users, DollarSign, Percent, Check } from 'lucide-react';

interface Props {
    group: any;
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
    const [selectedMembers, setSelectedMembers] = useState<string[]>(group.members.map((m: any) => m.user._id));
    const [isSettlement, setIsSettlement] = useState(false);

    // Initialize splits logic
    useEffect(() => {
        const totalAmount = parseFloat(amount) || 0;

        if (splitMethod === 'EQUAL') {
            // Distribute equally among selected members
            const count = selectedMembers.length;
            const val = count > 0 ? totalAmount / count : 0;
            const newSplits: any = {};
            // Only assign to selected members
            selectedMembers.forEach(id => newSplits[id] = val);
            setSplits(newSplits);
        } else if (splitMethod === 'PERCENT') {
            // Default to equal percentages if switching to percent
            // But only if splits are empty or we just switched? 
            // The user said "percent should be split equally until they themselves change it"
            // We can do this by checking if the current splits sum to ~100 or if it's a fresh switch
            // For simplicity, let's reset to equal percentages when amount changes or method switches to percent
            // BUT we must allow manual edits. 
            // Let's just set it once when switching to PERCENT or when selectedMembers changes
            const count = selectedMembers.length;
            const val = count > 0 ? 100 / count : 0;
            const newSplits: any = {};
            selectedMembers.forEach(id => newSplits[id] = val);
            setSplits(newSplits);
        }
    }, [amount, splitMethod, selectedMembers.length]); // Re-run when amount, method or selection count changes

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
    const totalSplit = Object.values(splits).reduce((a: number, b: number) => a + b, 0);
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

        // Prepare payload
        const splitDetails = group.members.map((m: any) => {
            let userAmount = 0;
            if (selectedMembers.includes(m.user._id)) {
                if (splitMethod === 'EQUAL') {
                    userAmount = totalAmount / selectedMembers.length;
                } else if (splitMethod === 'PERCENT') {
                    const percent = splits[m.user._id] as number || 0;
                    userAmount = (totalAmount * percent) / 100;
                } else {
                    userAmount = splits[m.user._id] as number || 0;
                }
            }
            return { user: m.user._id, amount: userAmount };
        });

        try {
            await axios.post(`http://localhost:5001/api/groups/${group._id}/expenses`, {
                description,
                amount: totalAmount,
                payer,
                splitDetails,
                isSettlement
            }, { withCredentials: true });
            onSuccess();
        } catch (error) {
            console.error(error);
            alert('Failed to add expense');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-3xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto animate-[slideUp_0.3s_ease-out]">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-bold text-primary">Add Expense</h2>
                    <button onClick={onClose} className="p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Description</label>
                        <input
                            type="text"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-primary text-lg font-semibold focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                            placeholder="e.g. Dinner"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Amount</label>
                        <div className="relative">
                            <span className="absolute left-5 top-4 text-gray-400 text-lg font-bold">EGP</span>
                            <input
                                type="number"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-16 pr-5 py-4 text-primary text-2xl font-bold focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    {/* Split Method Tabs */}
                    <div className="flex p-1 bg-gray-100 rounded-2xl">
                        <button
                            type="button"
                            onClick={() => setSplitMethod('EQUAL')}
                            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${splitMethod === 'EQUAL' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            = Equal
                        </button>
                        <button
                            type="button"
                            onClick={() => setSplitMethod('EXACT')}
                            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${splitMethod === 'EXACT' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            EGP Exact
                        </button>
                        <button
                            type="button"
                            onClick={() => setSplitMethod('PERCENT')}
                            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${splitMethod === 'PERCENT' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            % Percent
                        </button>
                    </div>

                    {/* Feedback for Exact/Percent */}
                    {splitMethod === 'EXACT' && Math.abs(remaining) > 0.01 && (
                        <div className={`text-center text-sm font-bold ${remaining > 0 ? 'text-orange-500' : 'text-red-500'}`}>
                            {remaining > 0 ? `${remaining.toFixed(2)} EGP left to split` : `${Math.abs(remaining).toFixed(2)} EGP over total`}
                        </div>
                    )}
                    {splitMethod === 'PERCENT' && Math.abs(remainingPercent) > 0.1 && (
                        <div className={`text-center text-sm font-bold ${remainingPercent > 0 ? 'text-orange-500' : 'text-red-500'}`}>
                            {remainingPercent > 0 ? `${remainingPercent.toFixed(1)}% left to split` : `${Math.abs(remainingPercent).toFixed(1)}% over total`}
                        </div>
                    )}

                    {/* Members List */}
                    <div className="space-y-3 mt-4">
                        <p className="text-gray-400 text-xs font-bold uppercase">Split amongst</p>
                        {group.members.map((m: any) => {
                            const isSelected = selectedMembers.includes(m.user._id);
                            return (
                                <div key={m.user._id} className={`flex items-center justify-between p-4 rounded-2xl border shadow-sm transition-all ${isSelected ? 'bg-white border-gray-100' : 'bg-gray-50 border-transparent opacity-60'}`}>
                                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => toggleMemberSelection(m.user._id)}>
                                        <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${isSelected ? 'bg-primary border-primary' : 'border-gray-300 bg-white'}`}>
                                            {isSelected && <Check size={14} className="text-white" />}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-sm font-bold text-primary">
                                                {m.user.name[0]}
                                            </div>
                                            <span className="text-primary font-bold">{m.user.name}</span>
                                        </div>
                                    </div>

                                    {isSelected && (
                                        <>
                                            {splitMethod === 'EQUAL' && (
                                                <span className="text-gray-500 font-medium">
                                                    {amount ? (parseFloat(amount) / selectedMembers.length).toFixed(2) : '0.00'} EGP
                                                </span>
                                            )}

                                            {splitMethod === 'EXACT' && (
                                                <div className="relative w-28">
                                                    <span className="absolute left-3 top-2.5 text-gray-400 text-sm font-bold">EGP</span>
                                                    <input
                                                        type="number"
                                                        value={splits[m.user._id] || ''}
                                                        onChange={e => handleSplitChange(m.user._id, e.target.value)}
                                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-3 py-2 text-primary font-bold text-right focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                            )}

                                            {splitMethod === 'PERCENT' && (
                                                <div className="relative w-24">
                                                    <input
                                                        type="number"
                                                        value={splits[m.user._id] || ''}
                                                        onChange={e => handleSplitChange(m.user._id, e.target.value)}
                                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-3 pr-7 py-2 text-primary font-bold text-right focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                                                        placeholder="0"
                                                    />
                                                    <span className="absolute right-3 top-2.5 text-gray-400 text-sm font-bold">%</span>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <button
                        type="submit"
                        className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/30 hover:bg-black/80 hover:scale-[1.02] active:scale-[0.98] transition-all mt-4"
                    >
                        Save Expense
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AddGroupExpenseModal;
