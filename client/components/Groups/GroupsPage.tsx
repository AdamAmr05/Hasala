import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, ArrowRight, Wallet, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';

interface Group {
    _id: string;
    name: string;
    members: any[];
    inviteCode: string;
    currency: string;
}

const GroupsPage: React.FC = () => {
    const navigate = useNavigate();
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);

    // Form states
    const [newGroupName, setNewGroupName] = useState('');
    const [joinCode, setJoinCode] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Error states
    const [error, setError] = useState<string | null>(null);
    const [createError, setCreateError] = useState<string | null>(null);
    const [joinError, setJoinError] = useState<string | null>(null);

    useEffect(() => {
        fetchGroups();
    }, []);

    const fetchGroups = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get('/groups');
            setGroups(res.data);
        } catch (error: any) {
            console.error('Error fetching groups:', error);
            setError(error.response?.data?.message || 'Failed to load groups. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGroupName.trim()) return;

        setSubmitting(true);
        setCreateError(null);
        try {
            await api.post('/groups', { name: newGroupName });
            setShowCreateModal(false);
            setNewGroupName('');
            fetchGroups();
        } catch (error: any) {
            console.error('Error creating group:', error);
            setCreateError(error.response?.data?.message || 'Failed to create group. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleJoinGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!joinCode.trim()) return;

        setSubmitting(true);
        setJoinError(null);
        try {
            await api.post('/groups/join', { inviteCode: joinCode });
            setShowJoinModal(false);
            setJoinCode('');
            fetchGroups();
        } catch (error: any) {
            console.error('Error joining group:', error);
            setJoinError(error.response?.data?.message || 'Invalid code or already a member.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading && groups.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    return (
        <div className="p-6 pb-32 animate-[fadeIn_0.5s_ease-out]">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-primary">Groups</h1>
                    <p className="text-gray-400 font-medium mt-1">Manage shared expenses</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 hover:bg-black/80 transition-all hover:scale-105 active:scale-95"
                >
                    <Plus size={24} />
                </button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-6 flex items-center gap-3 text-red-600">
                    <AlertCircle size={20} />
                    <span className="font-medium">{error}</span>
                    <button onClick={fetchGroups} className="ml-auto text-sm font-bold underline hover:text-red-800">Retry</button>
                </div>
            )}

            {groups.length === 0 && !loading && !error ? (
                <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-gray-200">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                        <Users size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-primary mb-2">No groups yet</h3>
                    <p className="text-gray-400 text-sm mb-6 max-w-xs mx-auto">Create a group to start splitting bills with friends or family.</p>
                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:bg-black/80 transition-all"
                        >
                            Create Group
                        </button>
                        <button
                            onClick={() => setShowJoinModal(true)}
                            className="px-6 py-3 bg-white text-primary border border-gray-200 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all"
                        >
                            Join via Code
                        </button>
                    </div>
                </div>
            ) : (
                <div className="grid gap-4">
                    {groups.map(group => (
                        <div
                            key={group._id}
                            onClick={() => navigate(`/groups/${group._id}`)}
                            className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group active:scale-[0.99]"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-xl font-bold text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                        {group.name?.charAt(0).toUpperCase() || '?'}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-primary mb-1">{group.name}</h3>
                                        <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
                                            <Users size={14} />
                                            <span>{group.members.length} members</span>
                                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                            <span>{group.currency}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                    <ArrowRight size={20} />
                                </div>
                            </div>
                        </div>
                    ))}

                    <button
                        onClick={() => setShowJoinModal(true)}
                        className="mt-4 w-full py-4 border border-dashed border-gray-300 rounded-3xl text-gray-400 font-bold hover:bg-gray-50 hover:border-gray-400 transition-all flex items-center justify-center gap-2"
                    >
                        <Wallet size={20} />
                        Have an invite code? Join Group
                    </button>
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
                    <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-[slideUp_0.3s_ease-out]">
                        <h2 className="text-xl font-bold text-primary mb-4">Create New Group</h2>

                        {createError && (
                            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl font-medium flex items-start gap-2">
                                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                {createError}
                            </div>
                        )}

                        <form onSubmit={handleCreateGroup}>
                            <input
                                type="text"
                                value={newGroupName}
                                onChange={e => setNewGroupName(e.target.value)}
                                placeholder="Group Name (e.g. Ski Trip)"
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-primary font-semibold mb-4 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                                autoFocus
                            />
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => { setShowCreateModal(false); setCreateError(null); }}
                                    className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-black/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {submitting && <Loader2 size={16} className="animate-spin" />}
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Join Modal */}
            {showJoinModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
                    <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-[slideUp_0.3s_ease-out]">
                        <h2 className="text-xl font-bold text-primary mb-4">Join Group</h2>

                        {joinError && (
                            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl font-medium flex items-start gap-2">
                                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                {joinError}
                            </div>
                        )}

                        <form onSubmit={handleJoinGroup}>
                            <input
                                type="text"
                                value={joinCode}
                                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                                placeholder="Enter Invite Code"
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-primary font-semibold mb-4 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all uppercase tracking-widest"
                                autoFocus
                            />
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => { setShowJoinModal(false); setJoinError(null); }}
                                    className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-black/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {submitting && <Loader2 size={16} className="animate-spin" />}
                                    Join
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GroupsPage;
