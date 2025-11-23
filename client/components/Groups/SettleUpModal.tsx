import React, { useState } from 'react';
import axios from 'axios';
import { X, Check, ArrowRight } from 'lucide-react';

interface Props {
    group: any;
    debt: {
        from: string;
        to: string;
        amount: number;
    };
    onClose: () => void;
    onSuccess: () => void;
}

const SettleUpModal: React.FC<Props> = ({ group, debt, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);

    // Find user names
    const toUser = group.members.find((m: any) => m.user._id === debt.to)?.user;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // For a settlement:
        // Payer = Me (debt.from)
        // Amount = debt.amount
        // SplitDetails = [{ user: debt.to, amount: debt.amount }]
        // This means I paid X, and that X was entirely "consumed" by the recipient (they received it).
        // Ledger math:
        // Me: +Amount (Paid) - 0 (Consumed) = +Amount balance change.
        // Recipient: +0 (Paid) - Amount (Consumed/Received) = -Amount balance change.
        // If I started with -50 (Debtor), adding +50 makes me 0.
        // If Recipient started with +50 (Creditor), adding -50 makes them 0.

        try {
            await axios.post(`http://localhost:5001/api/groups/${group._id}/expenses`, {
                description: 'Settlement',
                amount: debt.amount,
                payer: debt.from,
                splitDetails: [{ user: debt.to, amount: debt.amount }],
                isSettlement: true
            }, { withCredentials: true });
            onSuccess();
        } catch (error) {
            console.error(error);
            alert('Failed to settle up');
        } finally {
            setLoading(false);
        }
    };

    if (!toUser) return null;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl animate-[slideUp_0.3s_ease-out]">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-primary">Settle Up</h2>
                    <button onClick={onClose} className="p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="text-center mb-8">
                    <p className="text-gray-500 font-medium mb-4">You are paying</p>

                    <div className="flex items-center justify-center gap-4 mb-4">
                        <div className="w-16 h-16 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-xl font-bold text-primary">
                            You
                        </div>
                        <ArrowRight className="text-gray-300" size={24} />
                        <div className="w-16 h-16 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-xl font-bold text-primary">
                            {toUser.name[0]}
                        </div>
                    </div>

                    <h3 className="text-4xl font-bold text-primary mb-2">
                        {debt.amount.toFixed(2)} <span className="text-lg text-gray-400">{group.currency}</span>
                    </h3>
                    <p className="text-gray-400 font-medium">to {toUser.name}</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-green-500 text-white rounded-2xl font-bold shadow-xl shadow-green-500/20 hover:bg-green-600 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? 'Processing...' : (
                            <>
                                <Check size={20} />
                                Confirm Payment
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SettleUpModal;
