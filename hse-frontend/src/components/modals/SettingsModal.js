import React, { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle2, Users, UserPlus, Trash2, Shield, User, Download, Key } from 'lucide-react';
import { changePassword, getUsers, inviteUser, deleteUser, updateUserRole, exportData, getProjects, updateUserAssignments } from '../../api';

export const SettingsModal = ({ isOpen, onClose, currentUser, projects = [], onRefresh }) => {
    const [activeTab, setActiveTab] = useState('security'); // 'security' or 'team'
    const [form, setForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // Team State
    const [teamMembers, setTeamMembers] = useState([]);
    const [inviteForm, setInviteForm] = useState({
        username: '',
        password: '',
        email: '',
        fullName: '',
        company_name: currentUser?.organization?.name || 'My Company'
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Access Control State
    const [allProjects, setAllProjects] = useState(projects);
    const [selectedUserForAccess, setSelectedUserForAccess] = useState(null);
    const [userAccessIds, setUserAccessIds] = useState([]);

    useEffect(() => {
        if (isOpen && (activeTab === 'team' || activeTab === 'access') && currentUser?.role === 'admin') {
            fetchTeam();
        }
        if (isOpen && activeTab === 'access' && currentUser?.role === 'admin') {
            fetchAllProjects();
        }
    }, [isOpen, activeTab, currentUser]);

    useEffect(() => {
        setAllProjects(projects);
    }, [projects]);

    const fetchAllProjects = async () => {
        try {
            const data = await getProjects();
            setAllProjects(data);
        } catch (err) {
            console.error('Failed to fetch projects');
        }
    };

    const fetchTeam = async () => {
        try {
            setLoading(true);
            const data = await getUsers();
            setTeamMembers(data);
        } catch (err) {
            setError('Failed to load team members');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (form.newPassword !== form.confirmPassword) {
            setError('New passwords do not match');
            return;
        }

        if (form.newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            await changePassword(form.currentPassword, form.newPassword);
            setSuccess('Password updated successfully!');
            setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setTimeout(() => {
                onClose();
                setSuccess('');
            }, 2000);
        } catch (err) {
            setError(err.message || 'Failed to update password');
        } finally {
            setLoading(false);
        }
    };

    const handleInviteUser = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            await inviteUser({
                ...inviteForm,
                company_name: currentUser?.organization?.name || 'Existing' // This is ignored by special invite route but kept for schema safety
            });
            setSuccess('Team member invited successfully!');
            setInviteForm({ username: '', password: '', email: '', fullName: '' });
            fetchTeam();
        } catch (err) {
            setError(err.message || 'Failed to invite user');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to remove this member?')) return;
        try {
            setLoading(true);
            await deleteUser(userId);
            setSuccess('Member removed.');
            fetchTeam();
        } catch (err) {
            setError('Failed to remove member.');
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            setLoading(true);
            setError('');
            await updateUserRole(userId, newRole);
            setSuccess(`Role updated to ${newRole}`);
            fetchTeam();
        } catch (err) {
            setError(err.message || 'Failed to update role');
        } finally {
            setLoading(false);
        }
    };

    const toggleProjectAccess = (projectId) => {
        setUserAccessIds(prev =>
            prev.includes(projectId) ? prev.filter(id => id !== projectId) : [...prev, projectId]
        );
    };

    const handleUpdateAssignments = async () => {
        if (!selectedUserForAccess) return;
        try {
            setLoading(true);
            setError('');
            await updateUserAssignments(selectedUserForAccess.id, userAccessIds);
            setSuccess('Project access updated successfully');

            // 1. Refresh global project state in App.js
            if (onRefresh) onRefresh();

            // 2. Refresh local project state in this modal to update assigned_leads
            await fetchAllProjects();

            fetchTeam();
        } catch (err) {
            setError('Failed to update project access');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;


    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-surface w-full max-w-2xl rounded-3xl shadow-2xl border border-border overflow-hidden relative animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="bg-gradient-to-br from-primary/5 to-transparent p-6 border-b border-border relative shrink-0">
                    <button onClick={onClose} className="absolute right-4 top-4 p-2 hover:bg-border/50 rounded-full transition-colors text-text-body">
                        <X size={20} />
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                            <Shield size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-text-main leading-tight">Settings & Workspace</h2>
                            <p className="text-xs text-text-body font-bold uppercase tracking-widest opacity-60">Manage your profile and team</p>
                        </div>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className="flex border-b border-border px-6 gap-6 shrink-0 bg-background/30">
                    <button
                        onClick={() => setActiveTab('security')}
                        className={`py-4 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'security' ? 'border-primary text-primary' : 'border-transparent text-text-body opacity-50 hover:opacity-100'}`}
                    >
                        Security
                    </button>
                    {currentUser?.role === 'admin' && (
                        <>
                            <button
                                onClick={() => setActiveTab('team')}
                                className={`py-4 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'team' ? 'border-primary text-primary' : 'border-transparent text-text-body opacity-50 hover:opacity-100'}`}
                            >
                                Team Members
                            </button>
                            <button
                                onClick={() => setActiveTab('access')}
                                className={`py-4 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'access' ? 'border-primary text-primary' : 'border-transparent text-text-body opacity-50 hover:opacity-100'}`}
                            >
                                Access Control
                            </button>
                        </>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-error/10 border border-error/20 rounded-2xl mb-4">
                            <AlertCircle size={16} className="text-error shrink-0" />
                            <p className="text-error text-xs font-black uppercase tracking-tight">{error}</p>
                        </div>
                    )}

                    {success && (
                        <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/20 rounded-2xl mb-4">
                            <CheckCircle2 size={16} className="text-success shrink-0" />
                            <p className="text-success text-xs font-black uppercase tracking-tight">{success}</p>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <>
                            <form onSubmit={handlePasswordSubmit} className="space-y-5 max-w-md">
                                <div className="bg-background/50 rounded-2xl p-4 border border-border/50 flex items-center gap-4 mb-4">
                                    <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center font-black text-primary">
                                        {currentUser?.username[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-text-body uppercase tracking-tighter opacity-40">Active Account</p>
                                        <p className="text-sm font-bold text-text-main">{currentUser?.full_name || currentUser?.username}</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="relative group">
                                        <label className="text-[10px] font-black text-text-body absolute top-2 left-4 z-10 uppercase tracking-tighter opacity-40">Current Password</label>
                                        <input
                                            type="password"
                                            value={form.currentPassword}
                                            onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                                            className="w-full bg-background border border-border rounded-2xl px-4 pt-6 pb-2.5 text-text-main font-bold outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                                            placeholder="••••••••"
                                            required
                                        />
                                    </div>

                                    <div className="relative group">
                                        <label className="text-[10px] font-black text-text-body absolute top-2 left-4 z-10 uppercase tracking-tighter opacity-40">New Password</label>
                                        <input
                                            type="password"
                                            value={form.newPassword}
                                            onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                                            className="w-full bg-background border border-border rounded-2xl px-4 pt-6 pb-2.5 text-text-main font-bold outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                                            placeholder="Minimum 6 characters"
                                            required
                                        />
                                    </div>

                                    <div className="relative group">
                                        <label className="text-[10px] font-black text-text-body absolute top-2 left-4 z-10 uppercase tracking-tighter opacity-40">Confirm New Password</label>
                                        <input
                                            type="password"
                                            value={form.confirmPassword}
                                            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                                            className="w-full bg-background border border-border rounded-2xl px-4 pt-6 pb-2.5 text-text-main font-bold outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                                            placeholder="Repeat new password"
                                            required
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-primary text-white py-4 rounded-2xl hover:opacity-90 disabled:opacity-50 font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-primary/30 flex items-center justify-center gap-2"
                                >
                                    {loading ? 'Updating...' : 'Update Password'}
                                </button>
                            </form>

                            <div className="border-t border-border pt-6 mt-6 max-w-md">
                                <h3 className="text-sm font-black text-text-main uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Download size={18} className="text-primary" />
                                    Data Export
                                </h3>
                                <button
                                    onClick={async () => {
                                        try {
                                            setLoading(true);
                                            const blob = await exportData();
                                            const url = window.URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = `hse_backup_${new Date().toISOString().split('T')[0]}.json`;
                                            document.body.appendChild(a);
                                            a.click();
                                            a.remove();
                                            setSuccess('Data exported successfully!');
                                        } catch (err) {
                                            setError('Failed to export data');
                                        } finally {
                                            setLoading(false);
                                        }
                                    }}
                                    disabled={loading}
                                    className="w-full bg-surface border-2 border-dashed border-primary/20 hover:border-primary text-primary py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all hover:bg-primary/5 flex items-center justify-center gap-2"
                                >
                                    <Download size={16} />
                                    Download Full Backup
                                </button>
                            </div>
                        </>
                    )}

                    {activeTab === 'team' && (
                        <div className="space-y-8">
                            {/* Invite Section */}
                            <div className="bg-background/50 rounded-3xl p-6 border border-border/50">
                                <h3 className="text-sm font-black text-text-main uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <UserPlus size={18} className="text-primary" />
                                    Add Team Member
                                </h3>
                                <form onSubmit={handleInviteUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="relative group">
                                        <label className="text-[10px] font-black text-text-body absolute top-2 left-4 z-10 uppercase tracking-tighter opacity-40">Username</label>
                                        <input
                                            type="text"
                                            value={inviteForm.username}
                                            onChange={(e) => setInviteForm({ ...inviteForm, username: e.target.value })}
                                            className="w-full bg-surface border border-border rounded-2xl px-4 pt-6 pb-2.5 text-text-main font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                                            placeholder="johndoe"
                                            required
                                        />
                                    </div>
                                    <div className="relative group">
                                        <label className="text-[10px] font-black text-text-body absolute top-2 left-4 z-10 uppercase tracking-tighter opacity-40">Password</label>
                                        <input
                                            type="password"
                                            value={inviteForm.password}
                                            onChange={(e) => setInviteForm({ ...inviteForm, password: e.target.value })}
                                            className="w-full bg-surface border border-border rounded-2xl px-4 pt-6 pb-2.5 text-text-main font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                                            placeholder="••••••••"
                                            required
                                        />
                                    </div>
                                    <div className="relative group">
                                        <label className="text-[10px] font-black text-text-body absolute top-2 left-4 z-10 uppercase tracking-tighter opacity-40">Full Name</label>
                                        <input
                                            type="text"
                                            value={inviteForm.fullName}
                                            onChange={(e) => setInviteForm({ ...inviteForm, fullName: e.target.value })}
                                            className="w-full bg-surface border border-border rounded-2xl px-4 pt-6 pb-2.5 text-text-main font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                                            placeholder="John Doe"
                                            required
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="bg-primary text-white px-6 rounded-2xl hover:opacity-90 font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 h-[52px]"
                                    >
                                        Add Member
                                    </button>
                                </form>
                            </div>

                            {/* Members List */}
                            <div>
                                <h3 className="text-sm font-black text-text-main uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Users size={18} className="text-primary" />
                                    Active Members ({teamMembers.length})
                                </h3>
                                <div className="space-y-3">
                                    {teamMembers.map(member => (
                                        <div key={member.id} className="flex items-center justify-between p-4 bg-surface rounded-2xl border border-border hover:shadow-md transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white border-2 ${member.role === 'admin' ? 'bg-primary border-primary' : member.role === 'lead' ? 'bg-primary/80 border-primary/20' : 'bg-gray-400 border-gray-400'}`}>
                                                    {member.full_name ? member.full_name[0].toUpperCase() : member.username[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-text-main text-sm">{member.full_name || member.username}</p>
                                                    <div className="flex gap-1 mt-1">
                                                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${member.role === 'admin'
                                                            ? 'bg-primary/10 text-primary border-primary/20'
                                                            : member.role === 'lead'
                                                                ? 'bg-primary/5 text-primary/80 border-primary/10'
                                                                : 'bg-gray-100 text-gray-600 border-gray-200'
                                                            }`}>
                                                            {member.role}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {/* Role Dropdown */}
                                                {member.id !== currentUser.id ? (
                                                    <select
                                                        value={member.role}
                                                        onChange={(e) => handleRoleChange(member.id, e.target.value)}
                                                        disabled={loading}
                                                        className={`text-xs font-black uppercase tracking-tight px-3 py-2 rounded-xl border cursor-pointer transition-all ${member.role === 'admin'
                                                            ? 'bg-primary/10 text-primary border-primary/20'
                                                            : member.role === 'lead'
                                                                ? 'bg-primary/5 text-primary/80 border-primary/10'
                                                                : 'bg-gray-100 text-gray-600 border-gray-200'
                                                            }`}
                                                    >
                                                        <option value="admin">Admin</option>
                                                        <option value="lead">Lead</option>
                                                        <option value="viewer">Viewer</option>
                                                    </select>
                                                ) : (
                                                    <span className="text-xs font-black px-3 py-2 bg-primary/10 text-primary rounded-xl uppercase tracking-tight">
                                                        {member.role} (You)
                                                    </span>
                                                )}
                                                {/* Delete Button */}
                                                {member.id !== currentUser.id && (
                                                    <button
                                                        onClick={() => handleDeleteUser(member.id)}
                                                        className="p-2 text-text-body hover:text-error hover:bg-error/10 rounded-xl transition-all"
                                                        title="Remove user"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>
                    )}

                    {activeTab === 'access' && (
                        <div className="space-y-6">
                            <div className="bg-background/50 rounded-2xl p-6 border border-border">
                                <h3 className="text-sm font-black text-text-main uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <User size={18} className="text-primary" />
                                    1. Select Team Member
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {teamMembers.filter(u => u.role !== 'admin').map(user => (
                                        <button
                                            key={user.id}
                                            onClick={() => {
                                                setSelectedUserForAccess(user);
                                                // If your API returns assigned_projects, use them. 
                                                // For now, let's assume we need to manage them locally or fetch them.
                                                // To stay consistent with current flow, we'll try to find assignments.
                                                const projectIds = allProjects.filter(p =>
                                                    p.assignedLeads?.some(l => l.id === user.id)
                                                ).map(p => p.id);
                                                setUserAccessIds(projectIds);
                                            }}
                                            className={`p-3 rounded-xl border text-left transition-all ${selectedUserForAccess?.id === user.id ? 'bg-primary/10 border-primary ring-1 ring-primary' : 'bg-surface border-border/50 hover:border-border'}`}
                                        >
                                            <p className="text-xs font-black truncate">{user.full_name || user.username}</p>
                                            <p className="text-[10px] text-text-body/60 uppercase font-bold tracking-tight">{user.role}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {selectedUserForAccess && (
                                <div className="animate-in slide-in-from-bottom-2 duration-300">
                                    <div className="bg-background/50 rounded-2xl p-6 border border-border">
                                        <h3 className="text-sm font-black text-text-main uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <Key size={18} className="text-primary" />
                                            2. Manage Project Access for {selectedUserForAccess.full_name || selectedUserForAccess.username}
                                        </h3>
                                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                                            {allProjects.map(project => (
                                                <button
                                                    key={project.id}
                                                    onClick={() => toggleProjectAccess(project.id)}
                                                    className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${userAccessIds.includes(project.id) ? 'bg-primary/5 border-primary shadow-sm' : 'bg-surface border-border/50'}`}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${userAccessIds.includes(project.id) ? 'bg-primary text-white' : 'bg-background border text-text-body'}`}>
                                                            {project.name[0].toUpperCase()}
                                                        </div>
                                                        <div className="text-left">
                                                            <p className="text-sm font-bold text-text-main">{project.name}</p>
                                                            <p className="text-xs text-text-body/60">{project.location}</p>
                                                        </div>
                                                    </div>
                                                    {userAccessIds.includes(project.id) && <CheckCircle2 size={20} className="text-primary" />}
                                                </button>
                                            ))}
                                        </div>
                                        <button
                                            onClick={handleUpdateAssignments}
                                            disabled={loading}
                                            className="w-full mt-6 bg-primary text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 hover:opacity-90 transition-all disabled:opacity-50"
                                        >
                                            {loading ? 'Saving Assignments...' : 'Save Access Rules'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
