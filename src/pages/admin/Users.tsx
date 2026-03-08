import { useState } from 'react'
import { Search, UserPlus, Edit3, X, Trash2, Loader2, GraduationCap, Link2, Copy, Check, BookOpen } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

type UserRole = 'admin' | 'teacher' | 'student'
type FilterTab = 'all' | 'students' | 'teachers' | 'unassigned'

interface UserItem {
    id: string
    name: string
    email: string
    role: UserRole
    classId?: string
    class?: { name: string; section: string }
    managedClasses?: { id: string; name: string; section: string }[]
}

interface ClassItem {
    id: string
    name: string
    section: string
}

const roleBadgeClass: Record<UserRole, string> = {
    admin: 'badge-admin',
    teacher: 'badge-teacher',
    student: 'badge-student',
}

const getInitial = (name: string) => name.charAt(0).toUpperCase()

const getAvatarColor = (name: string) => {
    const colors = [
        'from-primary-400 to-primary-600',
        'from-success-400 to-success-600',
        'from-purple-400 to-purple-600',
        'from-warning-400 to-warning-600',
        'from-danger-400 to-danger-500',
        'from-sky-400 to-sky-600',
        'from-pink-400 to-pink-600',
    ]
    const index = name.charCodeAt(0) % colors.length
    return colors[index]
}

export default function AdminUsers() {
    const queryClient = useQueryClient()
    const [searchQuery, setSearchQuery] = useState('')
    const [activeTab, setActiveTab] = useState<FilterTab>('all')
    const [showInviteModal, setShowInviteModal] = useState(false)
    const [showEnrollModal, setShowEnrollModal] = useState<UserItem | null>(null)
    const [showEditModal, setShowEditModal] = useState<UserItem | null>(null)
    const [showInviteLinkModal, setShowInviteLinkModal] = useState(false)
    const [showSubjectsModal, setShowSubjectsModal] = useState<UserItem | null>(null)
    const [inviteLink, setInviteLink] = useState('')
    const [linkCopied, setLinkCopied] = useState(false)
    const [inviteLinkForm, setInviteLinkForm] = useState({ role: 'student', classId: '' })
    const [editForm, setEditForm] = useState<{ name: string; role: string; classId: string; classIds: string[] }>({ name: '', role: '', classId: '', classIds: [] })
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])

    // New User Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'student',
        password: 'password123'
    })

    // Fetch Users
    const { data: users = [], isLoading } = useQuery<UserItem[]>({
        queryKey: ['users'],
        queryFn: async () => {
            const res = await fetch('/api/users')
            if (!res.ok) throw new Error('Failed to fetch users')
            return res.json()
        }
    })

    // Fetch Classes
    const { data: classes = [] } = useQuery<ClassItem[]>({
        queryKey: ['classes'],
        queryFn: async () => {
            const res = await fetch('/api/classes')
            if (!res.ok) throw new Error('Failed to fetch classes')
            return res.json()
        }
    })

    // Fetch Subjects
    const { data: subjects = [] } = useQuery({
        queryKey: ['subjects'],
        queryFn: async () => {
            const res = await fetch('/api/subjects')
            if (!res.ok) throw new Error()
            return res.json()
        }
    })

    // Create User Mutation
    const createMutation = useMutation({
        mutationFn: async (newUser: typeof formData) => {
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser)
            })
            if (!res.ok) throw new Error('Failed to create user')
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] })
            setShowInviteModal(false)
            setFormData({ name: '', email: '', role: 'student', password: 'password123' })
        }
    })

    // Enrollment Mutation
    const enrollMutation = useMutation({
        mutationFn: async ({ userId, classId }: { userId: string, classId: string }) => {
            const res = await fetch(`/api/users/${userId}/enroll`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ classId })
            })
            if (!res.ok) throw new Error('Failed to enroll user')
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] })
            setShowEnrollModal(null)
        }
    })

    // Edit User Mutation
    const editMutation = useMutation({
        mutationFn: async ({ userId, data }: { userId: string, data: any }) => {
            const res = await fetch(`/api/users/${userId}/edit`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })
            if (!res.ok) throw new Error('Failed to update')
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] })
            setShowEditModal(null)
        }
    })

    // Subjects Assignment Mutation
    const subjectsMutation = useMutation({
        mutationFn: async ({ userId, subjectIds }: { userId: string, subjectIds: string[] }) => {
            const res = await fetch(`/api/users/${userId}/subjects`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subjectIds })
            })
            if (!res.ok) throw new Error()
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] })
            queryClient.invalidateQueries({ queryKey: ['subjects'] })
            setShowSubjectsModal(null)
        }
    })

    // Delete User Mutation
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/users/${id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('Failed to delete user')
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] })
        }
    })

    // Generate Invite Link
    const generateLink = async () => {
        try {
            const res = await fetch('/api/invite-link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(inviteLinkForm)
            })
            const data = await res.json()
            setInviteLink(data.link)
        } catch {
            alert('Failed to generate link')
        }
    }

    const copyLink = () => {
        navigator.clipboard.writeText(inviteLink)
        setLinkCopied(true)
        setTimeout(() => setLinkCopied(false), 2000)
    }

    const filteredUsers = users.filter((user) => {
        const matchesSearch =
            user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesTab =
            activeTab === 'all' ||
            (activeTab === 'students' && user.role === 'student') ||
            (activeTab === 'teachers' && user.role === 'teacher') ||
            (activeTab === 'unassigned' && !user.role)
        return matchesSearch && matchesTab
    })

    const handleCreateUser = (e: React.FormEvent) => {
        e.preventDefault()
        createMutation.mutate(formData)
    }

    const handleDeleteUser = (id: string) => {
        if (confirm('Are you sure you want to delete this user?')) {
            deleteMutation.mutate(id)
        }
    }

    const openEditModal = (user: any) => {
        const managedIds = (user.managedClasses || []).map((c: any) => c.id)
        setEditForm({ name: user.name, role: user.role, classId: user.classId || '', classIds: managedIds.length > 0 ? managedIds : (user.classId ? [user.classId] : []) })
        setShowEditModal(user)
    }

    const openSubjectsModal = (user: UserItem) => {
        const teacherSubs = subjects.filter((s: any) => s.teacherId === user.id).map((s: any) => s.id)
        setSelectedSubjects(teacherSubs)
        setShowSubjectsModal(user)
    }

    const tabs: { key: FilterTab; label: string }[] = [
        { key: 'all', label: `All (${users.length})` },
        { key: 'students', label: `Students (${users.filter(u => u.role === 'student').length})` },
        { key: 'teachers', label: `Teachers (${users.filter(u => u.role === 'teacher').length})` },
    ]

    return (
        <div className="animate-fade-in">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                <div className="page-header mb-0">
                    <h1 className="page-title">Manage Users</h1>
                    <p className="page-subtitle">Add, edit, and manage students, teachers, and admins</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setShowInviteLinkModal(true)} className="px-4 py-2 bg-purple-500 text-white rounded-xl font-semibold text-sm flex items-center gap-2 hover:bg-purple-600 transition-colors shadow-sm">
                        <Link2 className="w-4 h-4" /> Invite Link
                    </button>
                    <button onClick={() => setShowInviteModal(true)} className="btn-success text-sm">
                        <UserPlus className="w-4 h-4" /> Add User
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-4 p-1 bg-slate-100 rounded-xl w-fit">
                {tabs.map(tab => (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === tab.key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Search Bar */}
            <div className="relative mb-5">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="Search users..." value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)} className="input-field pl-11" />
            </div>

            <div className="content-card p-0 overflow-hidden min-h-[400px]">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-10 h-10 text-primary-500 animate-spin mb-3" />
                        <p className="text-slate-400">Loading users...</p>
                    </div>
                ) : (
                    <>
                        {filteredUsers.map((user, index) => (
                            <div key={user.id}
                                className={`flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-4 hover:bg-slate-50/80 transition-colors
                                ${index !== filteredUsers.length - 1 ? 'border-b border-slate-100' : ''}`}>
                                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarColor(user.name)} 
                                    flex items-center justify-center shadow-sm flex-shrink-0`}>
                                    <span className="text-white font-semibold text-sm">{getInitial(user.name)}</span>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-700 truncate">{user.name}</p>
                                    <p className="text-xs text-slate-400 truncate">{user.email}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        {user.role === 'student' && (
                                            <button onClick={() => setShowEnrollModal(user)}
                                                className="text-[10px] flex items-center gap-1 text-primary-600 font-medium hover:underline">
                                                <GraduationCap className="w-3 h-3" />
                                                {user.class ? `${user.class.name} ${user.class.section}` : 'Assign Class'}
                                            </button>
                                        )}
                                        {(user.role === 'teacher' || user.role === 'admin') && (
                                            <div className="flex flex-wrap gap-2">
                                                {user.managedClasses && user.managedClasses.length > 0 ? (
                                                    <span className="text-[10px] flex items-center gap-1 text-emerald-600 font-medium">
                                                        <GraduationCap className="w-3 h-3" />
                                                        {user.managedClasses.map((c: any) => `${c.name}${c.section}`).join(', ')}
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] text-slate-400 italic">No classes assigned</span>
                                                )}
                                                <button onClick={() => openSubjectsModal(user)}
                                                    className="text-[10px] flex items-center gap-1 text-purple-600 font-medium hover:underline">
                                                    <BookOpen className="w-3 h-3" />
                                                    {subjects.filter((s: any) => s.teacherId === user.id).length} subjects
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <span className={`${roleBadgeClass[user.role]} hidden sm:inline-flex`}>{user.role}</span>

                                <div className="flex items-center gap-1">
                                    <button onClick={() => openEditModal(user)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                                        <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDeleteUser(user.id)}
                                        className="p-2 rounded-lg hover:bg-danger-50 text-slate-400 hover:text-danger-500">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </>
                )}
            </div>

            {/* ===== EDIT USER MODAL ===== */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in text-slate-700 p-4">
                    <div className="bg-white rounded-2xl shadow-modal w-full max-w-md p-6 animate-scale-in">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-slate-800">Edit User</h2>
                            <button onClick={() => setShowEditModal(null)} className="p-2 rounded-lg hover:bg-slate-100"><X className="w-4 h-4 text-slate-500" /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1.5">Name</label>
                                <input type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                    className="input-field shadow-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1.5">Role</label>
                                <select value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                                    className="input-field shadow-none">
                                    <option value="student">Student</option>
                                    <option value="teacher">Teacher</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1.5">
                                    {editForm.role === 'student' ? 'Assign Class' : 'Assign Classes'}
                                </label>
                                {editForm.role === 'student' ? (
                                    <select value={editForm.classId} onChange={e => setEditForm({ ...editForm, classId: e.target.value })}
                                        className="input-field shadow-none">
                                        <option value="">No class</option>
                                        {classes.map(c => <option key={c.id} value={c.id}>{c.name} {c.section}</option>)}
                                    </select>
                                ) : (
                                    <div className="space-y-1.5 max-h-[200px] overflow-y-auto border border-slate-200 rounded-xl p-3 bg-slate-50">
                                        {classes.length === 0 && <p className="text-xs text-slate-400">No classes available</p>}
                                        {classes.map(c => {
                                            const isChecked = (editForm.classIds || []).includes(c.id)
                                            return (
                                                <label key={c.id} className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all ${isChecked ? 'bg-primary-50 border border-primary-200' : 'hover:bg-slate-100 border border-transparent'}`}>
                                                    <input type="checkbox" checked={isChecked}
                                                        onChange={() => {
                                                            const ids = editForm.classIds || []
                                                            if (isChecked) {
                                                                setEditForm({ ...editForm, classIds: ids.filter((id: string) => id !== c.id) })
                                                            } else {
                                                                setEditForm({ ...editForm, classIds: [...ids, c.id] })
                                                            }
                                                        }}
                                                        className="accent-primary-500 w-4 h-4" />
                                                    <span className="text-sm font-medium text-slate-700">{c.name} {c.section}</span>
                                                </label>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setShowEditModal(null)} className="btn-outline flex-1 justify-center">Cancel</button>
                            <button onClick={() => {
                                const payload = { ...editForm }
                                if (payload.role === 'student') {
                                    payload.classIds = [] // Clear managed classes
                                } else {
                                    payload.classId = '' // Clear student class
                                }
                                editMutation.mutate({ userId: showEditModal.id, data: payload })
                            }}
                                disabled={editMutation.isPending}
                                className="btn-success flex-1 justify-center disabled:opacity-50">
                                {editMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== ASSIGN SUBJECTS MODAL ===== */}
            {showSubjectsModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in text-slate-700 p-4">
                    <div className="bg-white rounded-2xl shadow-modal w-full max-w-md p-6 animate-scale-in">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-slate-800">Assign Subjects</h2>
                            <button onClick={() => setShowSubjectsModal(null)} className="p-2 rounded-lg hover:bg-slate-100"><X className="w-4 h-4 text-slate-500" /></button>
                        </div>
                        <p className="text-sm text-slate-500 mb-4">Select subjects for <strong>{showSubjectsModal.name}</strong></p>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                            {subjects.map((s: any) => (
                                <label key={s.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selectedSubjects.includes(s.id) ? 'bg-primary-50 border-primary-300' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}>
                                    <input type="checkbox" checked={selectedSubjects.includes(s.id)}
                                        onChange={() => {
                                            if (selectedSubjects.includes(s.id)) {
                                                setSelectedSubjects(prev => prev.filter(id => id !== s.id))
                                            } else {
                                                setSelectedSubjects(prev => [...prev, s.id])
                                            }
                                        }}
                                        className="accent-primary-500 w-4 h-4" />
                                    <div>
                                        <p className="font-semibold text-sm text-slate-800">{s.name}</p>
                                        <p className="text-xs text-slate-400">{s.code}</p>
                                    </div>
                                </label>
                            ))}
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setShowSubjectsModal(null)} className="btn-outline flex-1 justify-center">Cancel</button>
                            <button onClick={() => subjectsMutation.mutate({ userId: showSubjectsModal.id, subjectIds: selectedSubjects })}
                                disabled={subjectsMutation.isPending}
                                className="btn-success flex-1 justify-center disabled:opacity-50">
                                {subjectsMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Subjects'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== ENROLL MODAL ===== */}
            {showEnrollModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in text-slate-700 p-4">
                    <div className="bg-white rounded-2xl shadow-modal w-full max-w-sm p-6 animate-scale-in">
                        <h2 className="text-lg font-semibold mb-4 text-slate-800">Enroll {showEnrollModal.name}</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Select Class</label>
                                <select className="input-field shadow-none"
                                    defaultValue={showEnrollModal.classId || ''}
                                    onChange={(e) => enrollMutation.mutate({ userId: showEnrollModal.id, classId: e.target.value })}>
                                    <option value="">No Class</option>
                                    {classes.map(c => <option key={c.id} value={c.id}>{c.name} {c.section}</option>)}
                                </select>
                            </div>
                        </div>
                        <button onClick={() => setShowEnrollModal(null)} className="mt-6 w-full btn-outline">Cancel</button>
                    </div>
                </div>
            )}

            {/* ===== INVITE LINK MODAL ===== */}
            {showInviteLinkModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in text-slate-700 p-4">
                    <div className="bg-white rounded-2xl shadow-modal w-full max-w-md p-6 animate-scale-in">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-slate-800">Generate Invite Link</h2>
                            <button onClick={() => { setShowInviteLinkModal(false); setInviteLink('') }} className="p-2 rounded-lg hover:bg-slate-100">
                                <X className="w-4 h-4 text-slate-500" />
                            </button>
                        </div>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1.5">Role for new user</label>
                                <select value={inviteLinkForm.role} onChange={e => setInviteLinkForm({ ...inviteLinkForm, role: e.target.value })} className="input-field shadow-none">
                                    <option value="student">Student</option>
                                    <option value="teacher">Teacher</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            {inviteLinkForm.role === 'student' && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1.5">Auto-assign to Class (Optional)</label>
                                    <select value={inviteLinkForm.classId} onChange={e => setInviteLinkForm({ ...inviteLinkForm, classId: e.target.value })} className="input-field shadow-none">
                                        <option value="">No class</option>
                                        {classes.map(c => <option key={c.id} value={c.id}>{c.name} {c.section}</option>)}
                                    </select>
                                </div>
                            )}
                        </div>

                        {!inviteLink ? (
                            <button onClick={generateLink} className="w-full py-3 bg-purple-500 text-white rounded-xl font-bold hover:bg-purple-600 shadow-md flex items-center justify-center gap-2 text-sm transition-all">
                                <Link2 className="w-4 h-4" /> Generate Link
                            </button>
                        ) : (
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1.5">Invite Link (share with user)</label>
                                <div className="flex gap-2">
                                    <input type="text" readOnly value={inviteLink} className="input-field shadow-none text-xs flex-1" />
                                    <button onClick={copyLink} className={`px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${linkCopied ? 'bg-success-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                                        {linkCopied ? <><Check className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy</>}
                                    </button>
                                </div>
                                <button onClick={() => { setInviteLink(''); generateLink() }} className="w-full mt-3 py-2 text-sm text-purple-600 font-semibold hover:bg-purple-50 rounded-xl transition-colors">
                                    Generate New Link
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ===== ADD USER MODAL ===== */}
            {showInviteModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in text-slate-700 p-4">
                    <div className="bg-white rounded-2xl shadow-modal w-full max-w-md p-6 animate-scale-in">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-slate-800">Add New User</h2>
                            <button onClick={() => setShowInviteModal(false)} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
                                <X className="w-4 h-4 text-slate-500" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1.5">Full Name</label>
                                <input type="text" placeholder="Enter full name" className="input-field shadow-none" required
                                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1.5">Email Address</label>
                                <input type="email" placeholder="Enter email address" className="input-field shadow-none" required
                                    value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1.5">Role</label>
                                <select className="input-field shadow-none" value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value })}>
                                    <option value="student">Student</option>
                                    <option value="teacher">Teacher</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-100">
                                <button type="button" onClick={() => setShowInviteModal(false)} className="btn-outline flex-1 justify-center">Cancel</button>
                                <button type="submit" disabled={createMutation.isPending} className="btn-success flex-1 justify-center disabled:opacity-50">
                                    {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><UserPlus className="w-4 h-4" /> Add User</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
