import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Users, ArrowRight } from 'lucide-react';

interface Group {
    _id: string;
    name: string;
    members: any[];
    currency: string;
}

const GroupsPage: React.FC = () => {
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [inviteCode, setInviteCode] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchGroups();
    }, []);

    const fetchGroups = async () => {
        try {
            const res = await axios.get('http://localhost:5001/api/groups', {
                withCredentials: true
            });
            setGroups(res.data);
        } catch (error) {
            console.error('Error fetching groups:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5001/api/groups', {
                name: newGroupName
            }, { withCredentials: true });
            setShowCreateModal(false);
            setNewGroupName('');
            fetchGroups();
        } catch (error) {
            console.error('Error creating group:', error);
        }
    };

    const handleJoinGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5001/api/groups/join', {
                inviteCode
            }, { withCredentials: true });
            setShowJoinModal(false);
            setInviteCode('');
            fetchGroups();
        } catch (error) {
            alert('Invalid code or already a member');
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto pb-32 animate-[fadeIn_0.5s_ease-out]">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-primary mb-1">Split Groups</h1>
                    <p className="text-gray-500">Manage shared expenses</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowJoinModal(true)}
                        className="px-4 py-2 bg-white text-primary border border-gray-200 rounded-2xl hover:bg-gray-50 transition-colors text-sm font-bold shadow-sm"
                    >
                        Join Code
                    </button>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-4 py-2 bg-primary text-white rounded-2xl hover:bg-black/80 transition-all shadow-lg shadow-primary/20 flex items-center gap-2 text-sm font-bold"
                    >
                        <Plus size={18} />
                        New Group
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-400">Loading groups...</p>
                </div>
            ) : groups.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl shadow-apple border border-gray-100">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Users size={32} className="text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold text-primary mb-2">No groups yet</h3>
                    <p className="text-gray-500 max-w-xs mx-auto mb-8">
                        Create a group for a trip, apartment, or dinner to start splitting expenses.
                    </p>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-8 py-4 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/30 hover:scale-105 transition-transform"
                    >
                        Create your first group
                    </button>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {groups.map(group => (
                        <div
                            key={group._id}
                            onClick={() => navigate(`/groups/${group._id}`)}
                            className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-apple hover:border-gray-200 transition-all cursor-pointer group relative overflow-hidden"
                        >
                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-2xl font-bold text-primary border border-gray-100">
                                    {group.name[0].toUpperCase()}
                                </div>
                                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                                    <ArrowRight size={20} />
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-primary mb-1 relative z-10">{group.name}</h3>
                            <p className="text-gray-500 text-sm relative z-10">{group.members.length} members</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl animate-[slideUp_0.3s_ease-out]">
                        <h2 className="text-2xl font-bold text-primary mb-6">Create New Group</h2>
                        <form onSubmit={handleCreateGroup}>
                            <div className="mb-6">
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Group Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Summer Trip"
                                    value={newGroupName}
                                    onChange={e => setNewGroupName(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-primary text-lg font-semibold focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                                    autoFocus
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!newGroupName.trim()}
                                    className="flex-1 py-4 bg-primary text-white rounded-2xl font-bold hover:bg-black/80 disabled:opacity-50 transition-colors shadow-lg shadow-primary/20"
                                >
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Join Modal */}
            {showJoinModal && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl animate-[slideUp_0.3s_ease-out]">
                        <h2 className="text-2xl font-bold text-primary mb-6">Join Group</h2>
                        <form onSubmit={handleJoinGroup}>
                            <div className="mb-6">
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Invite Code</label>
                                <input
                                    type="text"
                                    placeholder="ABCD-1234"
                                    value={inviteCode}
                                    onChange={e => setInviteCode(e.target.value.toUpperCase())}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-primary text-2xl font-mono font-bold text-center tracking-widest focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all uppercase"
                                    maxLength={8}
                                    autoFocus
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowJoinModal(false)}
                                    className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!inviteCode.trim()}
                                    className="flex-1 py-4 bg-primary text-white rounded-2xl font-bold hover:bg-black/80 disabled:opacity-50 transition-colors shadow-lg shadow-primary/20"
                                >
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
