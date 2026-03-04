import { useState } from 'react'
import { Plus, BookOpen, Clock, Loader2, Users, FileUp, Download, X, Star, Send } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export default function TeacherAssignments({ user }: { user: any }) {
    const queryClient = useQueryClient()
    const [showModal, setShowModal] = useState(false)
    const [showGradeModal, setShowGradeModal] = useState<any>(null)
    const [gradeForm, setGradeForm] = useState({ grade: '', feedback: '' })
    const [viewSubmissions, setViewSubmissions] = useState<string | null>(null)
    const [form, setForm] = useState({ title: '', description: '', dueDate: '', fileUrl: '', subjectId: '' })
    const [uploading, setUploading] = useState(false)

    const { data: subjectsData = [] } = useQuery({
        queryKey: ['teacher-subjects', user.id], queryFn: async () => {
            const res = await fetch(`/api/subjects`); return res.json();
        }
    })
    const subjects = Array.isArray(subjectsData) ? subjectsData : []
    const teacherSubjects = subjects.filter((s: any) => s.teacherId === user.id)

    const { data: assignmentsData = [], isLoading } = useQuery({
        queryKey: ['teacher-assignments', user.id], queryFn: async () => {
            const res = await fetch(`/api/assignments?role=teacher&userId=${user.id}`); return res.json();
        }
    })
    const assignments = Array.isArray(assignmentsData) ? assignmentsData : []

    // Fetch submissions for selected assignment
    const { data: submissions = [], isLoading: loadingSubs } = useQuery({
        queryKey: ['assignment-submissions', viewSubmissions],
        queryFn: async () => {
            const res = await fetch(`/api/assignments/${viewSubmissions}/submissions`)
            if (!res.ok) throw new Error()
            return res.json()
        },
        enabled: !!viewSubmissions
    })

    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch(`/api/assignments`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
            }); return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['teacher-assignments', user.id] })
            setShowModal(false); setForm({ title: '', description: '', dueDate: '', fileUrl: '', subjectId: '' })
        }
    })

    const gradeMutation = useMutation({
        mutationFn: async ({ submissionId, grade, feedback }: { submissionId: string, grade: string, feedback: string }) => {
            const res = await fetch(`/api/submissions/${submissionId}/grade`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ grade, feedback })
            })
            if (!res.ok) throw new Error()
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['assignment-submissions', viewSubmissions] })
            setShowGradeModal(null)
            setGradeForm({ grade: '', feedback: '' })
        }
    })

    const handleFileUpload = async (file: File) => {
        setUploading(true)
        const formData = new FormData()
        formData.append('file', file)
        try {
            const res = await fetch('/api/upload', { method: 'POST', body: formData })
            const { fileUrl } = await res.json()
            setForm({ ...form, fileUrl })
        } catch { alert('Upload failed') }
        setUploading(false)
    }

    if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>

    return (
        <div className="p-4 sm:p-6 text-slate-700 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold mb-1 text-slate-800">Assignments</h1>
                    <p className="text-sm text-slate-500">Create assignments and grade student submissions</p>
                </div>
                <button onClick={() => setShowModal(true)} className="w-full sm:w-auto px-5 py-2.5 bg-success-500 text-white shadow-md hover:bg-success-600 rounded-xl font-semibold flex items-center justify-center gap-2 text-sm">
                    <Plus className="w-4 h-4" /> New Assignment
                </button>
            </div>

            <div className="space-y-6">
                {assignments.length === 0 && (
                    <div className="p-12 text-center border-2 border-dashed border-slate-200 bg-slate-50 rounded-3xl">
                        <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <h2 className="text-lg font-semibold text-slate-700">No Assignments</h2>
                    </div>
                )}
                {assignments.map((assignment: any) => (
                    <div key={assignment.id} className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-100">
                        <div className="flex flex-col md:flex-row gap-6">
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-slate-800 mb-1">{assignment.title}</h3>
                                <p className="text-sm font-semibold text-primary-500 mb-3">{assignment.subject?.name}</p>
                                <p className="text-sm text-slate-600 mb-4 line-clamp-2">{assignment.description}</p>

                                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
                                    <span className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                        <Clock className="w-3.5 h-3.5 text-slate-400" /> Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                    </span>
                                    <span className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                        <Users className="w-3.5 h-3.5 text-slate-400" /> {assignment.submissions?.length || 0} Submissions
                                    </span>
                                    {assignment.fileUrl && <a href={assignment.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-primary-600 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg border border-primary-100 transition-colors"><Download className="w-3.5 h-3.5" /> File</a>}
                                </div>
                            </div>

                            <div className="flex sm:flex-col gap-2">
                                <button onClick={() => setViewSubmissions(viewSubmissions === assignment.id ? null : assignment.id)}
                                    className={`flex-1 sm:flex-none px-4 py-2 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${viewSubmissions === assignment.id ? 'bg-primary-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                                    <Star className="w-4 h-4" /> Grade
                                </button>
                            </div>
                        </div>

                        {/* Expandable Submissions */}
                        {viewSubmissions === assignment.id && (
                            <div className="mt-6 pt-6 border-t border-slate-100">
                                <h4 className="font-bold text-slate-800 mb-4 text-sm">Student Submissions</h4>
                                {loadingSubs ? (
                                    <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-primary-500" /></div>
                                ) : submissions.length === 0 ? (
                                    <p className="text-sm text-slate-400 text-center py-6">No submissions yet</p>
                                ) : (
                                    <div className="space-y-3">
                                        {submissions.map((sub: any) => (
                                            <div key={sub.id} className="flex items-center justify-between p-3 sm:p-4 bg-slate-50 rounded-xl border border-slate-100 gap-3">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                                                        {sub.student?.avatar ? <img src={sub.student.avatar} className="w-full h-full rounded-full object-cover" /> : sub.student?.name?.charAt(0)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-slate-800 text-sm truncate">{sub.student?.name}</p>
                                                        <p className="text-[10px] text-slate-400">{new Date(sub.submittedAt).toLocaleString()}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <a href={sub.fileUrl} target="_blank" rel="noreferrer" className="p-2 bg-white rounded-lg border border-slate-200 text-primary-500 hover:bg-primary-50">
                                                        <Download className="w-4 h-4" />
                                                    </a>
                                                    {sub.grade !== null ? (
                                                        <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${sub.grade >= 70 ? 'bg-success-100 text-success-700' : sub.grade >= 50 ? 'bg-warning-100 text-warning-700' : 'bg-danger-100 text-danger-700'}`}>
                                                            {sub.grade}/100
                                                        </span>
                                                    ) : (
                                                        <button onClick={() => { setShowGradeModal(sub); setGradeForm({ grade: '', feedback: '' }) }}
                                                            className="px-3 py-1.5 bg-primary-500 text-white rounded-lg text-xs font-bold hover:bg-primary-600 transition-all">
                                                            Grade
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Grade Modal */}
            {showGradeModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-slate-800">Grade Submission</h2>
                            <button onClick={() => setShowGradeModal(null)} className="p-2 rounded-xl hover:bg-slate-100"><X className="w-5 h-5 text-slate-400" /></button>
                        </div>
                        <p className="text-sm text-slate-500 mb-6">Grading <strong>{showGradeModal.student?.name}</strong>'s submission</p>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Score (out of 100)</label>
                                <input type="number" min={0} max={100} value={gradeForm.grade} onChange={e => setGradeForm({ ...gradeForm, grade: e.target.value })}
                                    placeholder="e.g. 85" className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-slate-50" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Feedback (Optional)</label>
                                <textarea value={gradeForm.feedback} onChange={e => setGradeForm({ ...gradeForm, feedback: e.target.value })}
                                    placeholder="Good work! Consider improving..." className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-slate-50 h-24 resize-none" />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setShowGradeModal(null)} className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 text-sm">Cancel</button>
                            <button
                                onClick={() => gradeMutation.mutate({ submissionId: showGradeModal.id, grade: gradeForm.grade, feedback: gradeForm.feedback })}
                                disabled={!gradeForm.grade || gradeMutation.isPending}
                                className="flex-1 py-3 rounded-xl bg-primary-500 text-white font-bold hover:bg-primary-600 shadow-md text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                                {gradeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Submit Grade</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Assignment Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl">
                        <h2 className="text-xl font-bold mb-6 text-slate-800">New Assignment</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Subject</label>
                                <select value={form.subjectId} onChange={e => setForm({ ...form, subjectId: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-primary-500 text-sm">
                                    <option value="">Select a subject</option>
                                    {teacherSubjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Title</label>
                                <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-primary-500 text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-primary-500 h-24 resize-none text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Due Date & Time</label>
                                <input type="datetime-local" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-primary-500 text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Attachment (Optional)</label>
                                {form.fileUrl ? (
                                    <div className="flex items-center gap-2 text-sm text-success-600 bg-success-50 p-3 rounded-xl"><FileUp className="w-4 h-4" /> File attached</div>
                                ) : (
                                    <label className="flex items-center gap-2 cursor-pointer w-full justify-center px-4 py-3 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl hover:bg-slate-100 transition-colors text-slate-500 font-medium text-sm">
                                        {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileUp className="w-5 h-5" />}
                                        {uploading ? 'Uploading...' : 'Upload File'}
                                        <input type="file" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0]) }} />
                                    </label>
                                )}
                            </div>
                        </div>

                        <div className="mt-8 flex flex-col-reverse sm:flex-row gap-3">
                            <button onClick={() => setShowModal(false)} className="w-full sm:flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 text-sm" disabled={createMutation.isPending || uploading}>Cancel</button>
                            <button onClick={() => createMutation.mutate(form)} className="w-full sm:flex-1 py-3 bg-primary-500 text-white rounded-xl font-bold hover:bg-primary-600 shadow-md flex justify-center items-center text-sm" disabled={!form.subjectId || !form.title || !form.dueDate || createMutation.isPending || uploading}>
                                {createMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Publish Assignment'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
