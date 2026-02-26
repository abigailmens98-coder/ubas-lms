import { useState } from 'react'
import { Plus, GraduationCap, Users, Trash2, Edit3, X, Loader2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface ClassItem {
    id: string
    name: string
    section: string
    classTeacher?: { name: string }
    _count: { students: number }
}

interface Teacher {
    id: string
    name: string
    role: string
}

export default function AdminClasses() {
    const queryClient = useQueryClient()
    const [showModal, setShowModal] = useState(false)
    const [formData, setFormData] = useState({
        name: 'JHS 1',
        section: '',
        teacherId: ''
    })

    // Fetch Classes
    const { data: classes = [], isLoading } = useQuery<ClassItem[]>({
        queryKey: ['classes'],
        queryFn: async () => {
            const res = await fetch('/api/classes')
            if (!res.ok) throw new Error('Failed to fetch classes')
            return res.json()
        }
    })

    // Fetch Teachers (for selection)
    const { data: teachers = [] } = useQuery<Teacher[]>({
        queryKey: ['users', 'teachers'],
        queryFn: async () => {
            const res = await fetch('/api/users')
            if (!res.ok) throw new Error('Failed to fetch users')
            const allUsers = await res.json()
            return allUsers.filter((u: Teacher) => u.role === 'teacher' || u.role === 'admin')
        }
    })

    // Create Class Mutation
    const createMutation = useMutation({
        mutationFn: async (newClass: typeof formData) => {
            const res = await fetch('/api/classes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newClass)
            })
            if (!res.ok) throw new Error('Failed to create class')
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['classes'] })
            setShowModal(false)
            setFormData({ name: 'JHS 1', section: '', teacherId: '' })
        }
    })

    // Delete Class Mutation
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/classes/${id}`, {
                method: 'DELETE'
            })
            if (!res.ok) throw new Error('Failed to delete class')
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['classes'] })
        }
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        createMutation.mutate(formData)
    }

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this class?')) {
            deleteMutation.mutate(id)
        }
    }

    return (
        <div className="animate-fade-in">
            <div className="flex items-start justify-between mb-8">
                <div className="page-header mb-0">
                    <h1 className="page-title">Manage Classes</h1>
                    <p className="page-subtitle">Create and organize classes for Basic 7-9</p>
                </div>
                <button onClick={() => setShowModal(true)} className="btn-primary">
                    <Plus className="w-4 h-4" />
                    Add Class
                </button>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-sm border border-slate-100 min-h-[400px]">
                    <Loader2 className="w-10 h-10 text-primary-500 animate-spin mb-3" />
                    <p className="text-slate-400">Loading classes...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {classes.map((cls, index) => (
                        <div
                            key={cls.id}
                            className="content-card group hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300"
                            style={{ animationDelay: `${index * 60}ms` }}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 
                               flex items-center justify-center shadow-md">
                                    <GraduationCap className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex items-center gap-1">
                                    <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                                        <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(cls.id)}
                                        className="p-1.5 rounded-lg hover:bg-danger-50 text-slate-400 hover:text-danger-500 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <h3 className="text-lg font-bold text-slate-800 mb-1">
                                {cls.name} {cls.section}
                            </h3>
                            <p className="text-sm text-slate-400 mb-4 whitespace-nowrap overflow-hidden text-ellipsis">
                                Class Teacher: {cls.classTeacher?.name || 'Unassigned'}
                            </p>

                            <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                                <Users className="w-4 h-4 text-slate-400" />
                                <span className="text-sm font-medium text-slate-500">{cls._count.students} Students</span>
                            </div>
                        </div>
                    ))}
                    {classes.length === 0 && (
                        <div className="col-span-full py-20 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                            <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500">No classes found. Add your first class!</p>
                        </div>
                    )}
                </div>
            )}

            {/* Add Class Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in text-slate-700">
                    <div className="bg-white rounded-2xl shadow-modal w-full max-w-md p-6 animate-scale-in">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-slate-800">Add New Class</h2>
                            <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
                                <X className="w-4 h-4 text-slate-500" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1.5">Class Name</label>
                                <select
                                    className="input-field shadow-none"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                >
                                    <option value="JHS 1">JHS 1 (Basic 7)</option>
                                    <option value="JHS 2">JHS 2 (Basic 8)</option>
                                    <option value="JHS 3">JHS 3 (Basic 9)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1.5">Section</label>
                                <input
                                    type="text"
                                    placeholder="e.g. A, B, C"
                                    className="input-field shadow-none"
                                    required
                                    value={formData.section}
                                    onChange={e => setFormData({ ...formData, section: e.target.value.toUpperCase() })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1.5">Class Teacher</label>
                                <select
                                    className="input-field shadow-none"
                                    value={formData.teacherId}
                                    onChange={e => setFormData({ ...formData, teacherId: e.target.value })}
                                >
                                    <option value="">Assign a teacher (Optional)</option>
                                    {teachers.map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-100">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-outline flex-1 justify-center">Cancel</button>
                                <button
                                    type="submit"
                                    disabled={createMutation.isPending}
                                    className="btn-primary flex-1 justify-center disabled:opacity-50"
                                >
                                    {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : (
                                        <>
                                            <Plus className="w-4 h-4" />
                                            Create Class
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
