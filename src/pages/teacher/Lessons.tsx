import { useState } from 'react'
import { Plus, FileText, Eye, Edit3, Trash2, X, Clock, BookOpen, Loader2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface Lesson {
    id: string
    title: string
    content: string
    subjectId: string
    subject: { name: string }
    attachmentUrl?: string
    createdAt: string
}

interface Subject {
    id: string
    name: string
}

export default function TeacherLessons() {
    const queryClient = useQueryClient()
    const [showModal, setShowModal] = useState(false)
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        subjectId: '',
        attachmentUrl: ''
    })

    // Fetch Lessons
    const { data: lessons = [], isLoading } = useQuery<Lesson[]>({
        queryKey: ['lessons'],
        queryFn: async () => {
            const res = await fetch('/api/lessons')
            if (!res.ok) throw new Error('Failed to fetch lessons')
            return res.json()
        }
    })

    // Fetch Teacher's Subjects
    const { data: subjects = [] } = useQuery<Subject[]>({
        queryKey: ['subjects'],
        queryFn: async () => {
            const res = await fetch('/api/subjects')
            if (!res.ok) throw new Error('Failed to fetch subjects')
            return res.json()
        }
    })

    // Create Lesson Mutation
    const createMutation = useMutation({
        mutationFn: async (newLesson: typeof formData) => {
            const res = await fetch('/api/lessons', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newLesson)
            })
            if (!res.ok) throw new Error('Failed to create lesson')
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['lessons'] })
            setShowModal(false)
            setFormData({ title: '', content: '', subjectId: '', attachmentUrl: '' })
        }
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        createMutation.mutate(formData)
    }

    return (
        <div className="animate-fade-in text-slate-700">
            <div className="flex items-start justify-between mb-8">
                <div className="page-header mb-0">
                    <h1 className="page-title text-primary-500">Lessons</h1>
                    <p className="page-subtitle">Create and manage lesson content</p>
                </div>
                <button onClick={() => setShowModal(true)} className="btn-primary">
                    <Plus className="w-4 h-4" />
                    Create Lesson
                </button>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 min-h-[400px]">
                    <Loader2 className="w-10 h-10 text-primary-500 animate-spin mb-3" />
                    <p className="text-slate-400 font-medium">Loading lessons...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {lessons.map((lesson, index) => (
                        <div key={lesson.id} className="content-card group hover:shadow-card-hover transition-all duration-300" style={{ animationDelay: `${index * 60}ms` }}>
                            <div className="flex items-start justify-between mb-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-success-400 to-success-600 flex items-center justify-center shadow-md">
                                    <FileText className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"><Eye className="w-4 h-4" /></button>
                                    <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"><Edit3 className="w-4 h-4" /></button>
                                    <button className="p-1.5 rounded-lg hover:bg-danger-50 text-slate-400 hover:text-danger-500"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                            <h3 className="text-sm font-bold text-slate-800 mb-0.5">{lesson.title}</h3>
                            <p className="text-xs text-slate-400 mb-3">{lesson.subject.name}</p>
                            <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                                <span className="flex items-center gap-1 text-xs text-slate-400">
                                    <Clock className="w-3.5 h-3.5" />
                                    {new Date(lesson.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    ))}
                    {lessons.length === 0 && (
                        <div className="col-span-full py-20 text-center bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
                            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500 font-medium">No lessons yet. Start creating!</p>
                        </div>
                    )}
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in text-slate-700">
                    <div className="bg-white rounded-2xl shadow-modal w-full max-w-lg p-6 animate-scale-in">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-slate-800">Create New Lesson</h2>
                            <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-slate-100"><X className="w-4 h-4 text-slate-500" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1.5">Lesson Title</label>
                                <input
                                    type="text"
                                    placeholder="Enter lesson title"
                                    className="input-field shadow-none"
                                    required
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1.5">Subject</label>
                                <select
                                    className="input-field shadow-none"
                                    required
                                    value={formData.subjectId}
                                    onChange={e => setFormData({ ...formData, subjectId: e.target.value })}
                                >
                                    <option value="">Select subject</option>
                                    {subjects.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1.5">Lesson Content</label>
                                <textarea
                                    rows={4}
                                    placeholder="Write lesson content..."
                                    className="input-field resize-none shadow-none"
                                    required
                                    value={formData.content}
                                    onChange={e => setFormData({ ...formData, content: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1.5">Attachments</label>
                                <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-primary-300 transition-colors cursor-pointer">
                                    <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                    <p className="text-sm text-slate-400">Drag & drop files or click to browse</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-100">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-outline flex-1 justify-center">Cancel</button>
                                <button
                                    type="submit"
                                    disabled={createMutation.isPending}
                                    className="btn-primary flex-1 justify-center disabled:opacity-50"
                                >
                                    {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Lesson'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
