import { useState } from 'react'
import { Search, UserPlus, Edit3, X, Trash2, Loader2, GraduationCap } from 'lucide-react'
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
            const res = await fetch('http://localhost:3001/api/users')
            if (!res.ok) throw new Error('Failed to fetch users')
            return res.json()
        }
    })

    // Fetch Classes
    const { data: classes = [] } = useQuery<ClassItem[]>({
        queryKey: ['classes'],
        queryFn: async () => {
            const res = await fetch('http://localhost:3001/api/classes')
            if (!res.ok) throw new Error('Failed to fetch classes')
            return res.json()
        }
    })

    // Create User Mutation
    const createMutation = useMutation({
        mutationFn: async (newUser: typeof formData) => {
            const res = await fetch('http://localhost:3001/api/users', {
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
            const res = await fetch(`http://localhost:3001/api/users/${userId}/enroll`, {
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

    // Delete User Mutation
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`http://localhost:3001/api/users/${id}`, {
                method: 'DELETE'
            })
            if (!res.ok) throw new Error('Failed to delete user')
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] })
        }
    })

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

    return (
        <div className="animate-fade-in">
            {/* Page Header */}
            <div className="flex items-start justify-between mb-8">
                <div className="page-header mb-0">
                    <h1 className="page-title">Manage Users</h1>
                    <p className="page-subtitle">Add and manage students, teachers, and admins</p>
                </div>
                <button
                    onClick={() => setShowInviteModal(true)}
                    className="btn-success"
                >
                    <UserPlus className="w-4 h-4" />
                    Invite User
                </button>
            </div>

            {/* Search Bar */}
            <div className="relative mb-5">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input-field pl-11"
                />
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
                            <div
                                key={user.id}
                                className={`flex items-center gap-4 px-6 py-4 hover:bg-slate-50/80 transition-colors
                ${index !== filteredUsers.length - 1 ? 'border-b border-slate-100' : ''}`}
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${getAvatarColor(user.name)} 
                    flex items-center justify-center shadow-sm flex-shrink-0`}>
                                    <span className="text-white font-semibold text-sm">
                                        {getInitial(user.name)}
                                    </span>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-700">{user.name}</p>
                                    <p className="text-xs text-slate-400">{user.email}</p>
                                    {user.role === 'student' && (
                                        <button
                                            onClick={() => setShowEnrollModal(user)}
                                            className="text-[10px] mt-1 flex items-center gap-1 text-primary-600 font-medium hover:underline"
                                        >
                                            <GraduationCap className="w-3 h-3" />
                                            {user.class ? `${user.class.name} ${user.class.section}` : 'Assign Class'}
                                        </button>
                                    )}
                                </div>

                                <span className={`${roleBadgeClass[user.role]}`}>
                                    {user.role}
                                </span>

                                <div className="flex items-center gap-1">
                                    <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                                        <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteUser(user.id)}
                                        className="p-2 rounded-lg hover:bg-danger-50 text-slate-400 hover:text-danger-500"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </>
                )}
            </div>

            {/* Enroll Modal */}
            {showEnrollModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in text-slate-700">
                    <div className="bg-white rounded-2xl shadow-modal w-full max-w-sm p-6 animate-scale-in">
                        <h2 className="text-lg font-semibold mb-4 text-slate-800">Enroll {showEnrollModal.name}</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Select Class</label>
                                <select
                                    className="input-field shadow-none"
                                    defaultValue={showEnrollModal.classId || ''}
                                    onChange={(e) => enrollMutation.mutate({ userId: showEnrollModal.id, classId: e.target.value })}
                                >
                                    <option value="">No Class</option>
                                    {classes.map(c => (
                                        <option key={c.id} value={c.id}>{c.name} {c.section}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowEnrollModal(null)}
                            className="mt-6 w-full btn-outline"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Invite Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in text-slate-700">
                    <div className="bg-white rounded-2xl shadow-modal w-full max-w-md p-6 animate-scale-in">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-slate-800">Invite New User</h2>
                            <button
                                onClick={() => setShowInviteModal(false)}
                                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                            >
                                <X className="w-4 h-4 text-slate-500" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1.5">Full Name</label>
                                <input
                                    type="text"
                                    placeholder="Enter full name"
                                    className="input-field shadow-none"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1.5">Email Address</label>
                                <input
                                    type="email"
                                    placeholder="Enter email address"
                                    className="input-field shadow-none"
                                    required
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1.5">Role</label>
                                <select
                                    className="input-field shadow-none"
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                                >
                                    <option value="student">Student</option>
                                    <option value="teacher">Teacher</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowInviteModal(false)}
                                    className="btn-outline flex-1 justify-center"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createMutation.isPending}
                                    className="btn-success flex-1 justify-center disabled:opacity-50"
                                >
                                    {createMutation.isPending ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            <UserPlus className="w-4 h-4" />
                                            Send Invite
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
