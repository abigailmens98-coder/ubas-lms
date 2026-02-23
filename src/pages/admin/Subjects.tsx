import { useState } from 'react'
import { Plus, BookOpen, Edit3, Trash2, X, Loader2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface SubjectItem {
    id: string
    name: string
    code: string
    teacher?: { name: string }
    color: string
}

interface Teacher {
    id: string
    name: string
    role: string
}

const subjectColors = [
    'from-blue-400 to-blue-600',
    'from-emerald-400 to-emerald-600',
    'from-purple-400 to-purple-600',
    'from-amber-400 to-amber-600',
    'from-rose-400 to-rose-600',
    'from-cyan-400 to-cyan-600',
    'from-indigo-400 to-indigo-600',
    'from-orange-400 to-orange-600',
]

export default function AdminSubjects() {
    const queryClient = useQueryClient()
    const [showModal, setShowModal] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        teacherId: '',
        color: subjectColors[0]
    })

    // Fetch Subjects
    const { data: subjects = [], isLoading } = useQuery<SubjectItem[]>({
        queryKey: ['subjects'],
        queryFn: async () => {
            const res = await fetch('http://localhost:3001/api/subjects')
            if (!res.ok) throw new Error('Failed to fetch subjects')
            return res.json()
        }
    })

    // Fetch Teachers
    const { data: teachers = [] } = useQuery<Teacher[]>({
        queryKey: ['users', 'teachers'],
        queryFn: async () => {
            const res = await fetch('http://localhost:3001/api/users')
            if (!res.ok) throw new Error('Failed to fetch users')
            const allUsers = await res.json()
            return allUsers.filter((u: Teacher) => u.role === 'teacher' || u.role === 'admin')
        }
    })

    // Create Subject Mutation
    const createMutation = useMutation({
        mutationFn: async (newSubject: typeof formData) => {
            const res = await fetch('http://localhost:3001/api/subjects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newSubject)
            })
            if (!res.ok) throw new Error('Failed to create subject')
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subjects'] })
            setShowModal(false)
            setFormData({ name: '', code: '', teacherId: '', color: subjectColors[0] })
        }
    })

    // Delete Subject Mutation
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`http://localhost:3001/api/subjects/${id}`, {
                method: 'DELETE'
            })
            if (!res.ok) throw new Error('Failed to delete subject')
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subjects'] })
        }
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        // Assign a random color if not set (though we default to index 0)
        const payload = { ...formData, color: formData.color || subjectColors[Math.floor(Math.random() * subjectColors.length)] }
        createMutation.mutate(payload)
    }

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this subject?')) {
            deleteMutation.mutate(id)
        }
    }

    return (
        <div className="animate-fade-in">
            <div className="flex items-start justify-between mb-8">
                <div className="page-header mb-0">
                    <h1 className="page-title">Manage Subjects</h1>
                    <p className="page-subtitle">Configure subjects and assign teachers</p>
                </div>
                <button onClick={() => setShowModal(true)} className="btn-primary">
                    <Plus className="w-4 h-4" />
                    Add Subject
                </button>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-sm border border-slate-100 min-h-[400px]">
                    <Loader2 className="w-10 h-10 text-primary-500 animate-spin mb-3" />
                    <p className="text-slate-400">Loading subjects...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {subjects.map((subject, index) => (
                        <div
                            key={subject.id}
                            className="content-card group hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${subject.color || 'from-slate-400 to-slate-600'} 
                                flex items-center justify-center shadow-md`}>
                                    <BookOpen className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                                        <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(subject.id)}
                                        className="p-1.5 rounded-lg hover:bg-danger-50 text-slate-400 hover:text-danger-500 transition-colors"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>

                            <h3 className="text-sm font-bold text-slate-800 mb-0.5 truncate">{subject.name}</h3>
                            <p className="text-xs text-slate-400 mb-3 whitespace-nowrap overflow-hidden text-ellipsis">
                                {subject.code} · {subject.teacher?.name || 'Unassigned'}
                            </p>
                        </div>
                    ))}
                    {subjects.length === 0 && (
                        <div className="col-span-full py-20 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500">No subjects found. Add your first subject!</p>
                        </div>
                    )}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in text-slate-700">
                    <div className="bg-white rounded-2xl shadow-modal w-full max-w-md p-6 animate-scale-in">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-slate-800">Add New Subject</h2>
                            <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
                                <X className="w-4 h-4 text-slate-500" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1.5">Subject Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Mathematics"
                                    className="input-field shadow-none"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1.5">Subject Code</label>
                                <input
                                    type="text"
                                    placeholder="e.g. MATH"
                                    className="input-field shadow-none"
                                    required
                                    value={formData.code}
                                    onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1.5">Assign Teacher</label>
                                <select
                                    className="input-field shadow-none"
                                    value={formData.teacherId}
                                    onChange={e => setFormData({ ...formData, teacherId: e.target.value })}
                                >
                                    <option value="">Select teacher (Optional)</option>
                                    {teachers.map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-2.5">Pick a Color Theme</label>
                                <div className="flex flex-wrap gap-3">
                                    {subjectColors.map((color) => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, color })}
                                            className={`w-8 h-8 rounded-lg bg-gradient-to-br ${color} transition-transform 
                                ${formData.color === color ? 'ring-2 ring-offset-2 ring-primary-500 scale-110 shadow-md' : 'hover:scale-105'}`}
                                        />
                                    ))}
                                </div>
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
                                            Add Subject
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
