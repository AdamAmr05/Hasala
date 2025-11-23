import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Users, DollarSign, Percent } from 'lucide-react';

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
    const [isSettlement, setIsSettlement] = useState(false);

    // Initialize splits
    useEffect(() => {
        if (splitMethod === 'EQUAL' && amount) {
            const val = parseFloat(amount) / group.members.length;
            const newSplits: any = {};
            group.members.forEach((m: any) => newSplits[m.user._id] = val);
            setSplits(newSplits);
        }
    }, [amount, splitMethod, group.members]);

    const handleSplitChange = (userId: string, val: string) => {
        const num = parseFloat(val) || 0;
        setSplits(prev => ({ ...prev, [userId]: num }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const totalAmount = parseFloat(amount);
        if (!description || !totalAmount) return;

        // Validation
        if (!isSettlement && splitMethod !== 'EQUAL') {
            const totalSplit = Object.values(splits).reduce((a: number, b: number) => a + b, 0);

            if (splitMethod === 'PERCENT' && Math.abs((totalSplit as number) - 100) > 0.1) {
                alert('Percentages must add up to 100%');
                return;
            }
            if (splitMethod === 'EXACT' && Math.abs((totalSplit as number) - totalAmount) > 0.1) {
                alert(`Split amounts (${totalSplit}) must equal total (${totalAmount})`);
                return;
            }
        }

        // Prepare payload
        const splitDetails = group.members.map((m: any) => {
            let userAmount = 0;
            if (isSettlement) {
                // For settlement, it's 1-to-1 usually. 
                // But let's keep it simple: Payer pays, Receiver gets.
                // We need to select receiver.
                // For now, let's assume simple expense logic.
                // Actually, settlement UI should be different (Select Receiver).
                // Let's stick to Expenses for this MVP modal, maybe add basic settlement later.
                // If isSettlement is true, we assume the splitDetails contains the receiver with full amount.
                userAmount = splits[m.user._id] || 0;
            } else if (splitMethod === 'EQUAL') {
                userAmount = totalAmount / group.members.length;
            } else if (splitMethod === 'PERCENT') {
                userAmount = (totalAmount * (splits[m.user._id] || 0)) / 100;
            } else {
                userAmount = splits[m.user._id] || 0;
            }
            return { user: m.user._id, amount: userAmount };
        });

        try {
            await axios.post(`http://localhost:5001/api/groups/${group._id}/expenses`, {
                description,
                amount: totalAmount,
                payer, // We need to send payer if we want to support "Bob paid"
                // Wait, my backend assumes req.user is payer?
                // Let's check backend... 
                // Backend: payer: req.user?._id.
                // Ah, so I can only add expenses I paid? 
                // Splitwise allows adding for others.
                // I should update backend to allow setting payer if I am admin or just allow it.
                // For now, let's assume I am payer.
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
                            <span className="absolute left-5 top-4 text-gray-400 text-lg font-bold">$</span>
                            <input
                                type="number"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-10 pr-5 py-4 text-primary text-2xl font-bold focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
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
                            $ Exact
                        </button>
                        <button
                            type="button"
                            onClick={() => setSplitMethod('PERCENT')}
                            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${splitMethod === 'PERCENT' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            % Percent
                        </button>
                    </div>

                    {/* Members List */}
                    <div className="space-y-3 mt-4">
                        <p className="text-gray-400 text-xs font-bold uppercase">Split amongst</p>
                        {group.members.map((m: any) => (
                            <div key={m.user._id} className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-sm font-bold text-primary">
                                        {m.user.name[0]}
                                    </div>
                                    <span className="text-primary font-bold">{m.user.name}</span>
                                </div>

                                {splitMethod === 'EQUAL' && (
                                    <span className="text-gray-500 font-medium">
                                        ${amount ? (parseFloat(amount) / group.members.length).toFixed(2) : '0.00'}
                                    </span>
                                )}

                                {splitMethod === 'EXACT' && (
                                    <div className="relative w-28">
                                        <span className="absolute left-3 top-2.5 text-gray-400 text-sm font-bold">$</span>
                                        <input
                                            type="number"
                                            value={splits[m.user._id] || ''}
                                            onChange={e => handleSplitChange(m.user._id, e.target.value)}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-6 pr-3 py-2 text-primary font-bold text-right focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
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
                            </div>
                        ))}
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
