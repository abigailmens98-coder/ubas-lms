import { useState } from 'react'
import { Plus, BookOpen, Clock, Loader2, Users, FileUp, Download } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export default function TeacherAssignments({ user }: { user: any }) {
    const queryClient = useQueryClient()
    const [showModal, setShowModal] = useState(false)
    const [form, setForm] = useState({ title: '', description: '', dueDate: '', fileUrl: '', subjectId: '' })
    const [uploading, setUploading] = useState(false)

    const { data: subjectsData = [] } = useQuery({
        queryKey: ['teacher-subjects', user.id], queryFn: async () => {
            const res = await fetch(`http://localhost:3001/api/subjects`); return res.json();
        }
    })
    const subjects = Array.isArray(subjectsData) ? subjectsData : []
    const teacherSubjects = subjects.filter((s: any) => s.teacherId === user.id)

    const { data: assignmentsData = [], isLoading } = useQuery({
        queryKey: ['teacher-assignments', user.id], queryFn: async () => {
            const res = await fetch(`http://localhost:3001/api/assignments?role=teacher&userId=${user.id}`); return res.json();
        }
    })
    const assignments = Array.isArray(assignmentsData) ? assignmentsData : []

    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch(`http://localhost:3001/api/assignments`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
            }); return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['teacher-assignments', user.id] })
            setShowModal(false); setForm({ title: '', description: '', dueDate: '', fileUrl: '', subjectId: '' })
        }
    })

    const handleFileUpload = async (file: File) => {
        setUploading(true)
        const formData = new FormData()
        formData.append('file', file)
        try {
            const res = await fetch('http://localhost:3001/api/upload', { method: 'POST', body: formData })
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
                    <h1 className="text-2xl font-bold mb-1 sm:mb-2 text-slate-800">Assignments</h1>
                    <p className="text-sm sm:text-base text-slate-500">Create assignments and review student submissions</p>
                </div>
                <button onClick={() => setShowModal(true)} className="w-full sm:w-auto px-5 py-2.5 bg-success-500 text-white shadow-md hover:bg-success-600 rounded-xl font-semibold flex items-center justify-center gap-2">
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
                    <div key={assignment.id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row gap-8 items-start">
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-slate-800 mb-1">{assignment.title}</h3>
                            <p className="text-sm font-semibold text-primary-500 mb-4">{assignment.subject?.name}</p>
                            <p className="text-slate-600 mb-6">{assignment.description}</p>

                            <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm text-slate-500 font-medium mt-4">
                                <span className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100"><Clock className="w-4 h-4 text-slate-400" /> Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                                <span className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100"><Users className="w-4 h-4 text-slate-400" /> {assignment.submissions?.length || 0} Submissions</span>
                                {assignment.fileUrl && <a href={`http://localhost:3001${assignment.fileUrl}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-primary-600 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg border border-primary-100 transition-colors"><Download className="w-4 h-4" /> Reference File</a>}
                            </div>
                        </div>

                        <div className="w-full md:w-1/3 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                            <h4 className="font-bold text-slate-800 mb-4">Latest Submissions</h4>
                            {assignment.submissions?.length === 0 ? <p className="text-sm text-slate-400">None yet.</p> : (
                                <ul className="space-y-3">
                                    {assignment.submissions.slice(0, 3).map((sub: any) => (
                                        <li key={sub.id} className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                            <span className="text-sm font-semibold text-slate-700 truncate">Student ID: {sub.studentId.substring(0, 8)}</span>
                                            <a href={`http://localhost:3001${sub.fileUrl}`} target="_blank" className="text-primary-500 hover:text-primary-700"><Download className="w-4 h-4" /></a>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl">
                        <h2 className="text-xl font-bold mb-6 text-slate-800">New Assignment</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Subject</label>
                                <select value={form.subjectId} onChange={e => setForm({ ...form, subjectId: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-primary-500">
                                    <option value="">Select a subject</option>
                                    {teacherSubjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Title</label>
                                <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-primary-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-primary-500 h-24 resize-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Due Date & Time</label>
                                <input type="datetime-local" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-primary-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Attachment (Optional)</label>
                                {form.fileUrl ? (
                                    <div className="flex items-center gap-2 text-sm text-success-600 bg-success-50 p-3 rounded-xl"><FileUp className="w-4 h-4" /> File attached</div>
                                ) : (
                                    <label className="flex items-center gap-2 cursor-pointer w-full justify-center px-4 py-3 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl hover:bg-slate-100 transition-colors text-slate-500 font-medium">
                                        {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileUp className="w-5 h-5" />}
                                        {uploading ? 'Uploading...' : 'Upload File'}
                                        <input type="file" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0]) }} />
                                    </label>
                                )}
                            </div>
                        </div>



                        <div className="mt-8 flex flex-col-reverse sm:flex-row gap-3">
                            <button onClick={() => setShowModal(false)} className="w-full sm:flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors" disabled={createMutation.isPending || uploading}>Cancel</button>
                            <button onClick={() => createMutation.mutate(form)} className="w-full sm:flex-1 py-3 bg-primary-500 text-white rounded-xl font-bold hover:bg-primary-600 transition-colors shadow-md flex justify-center items-center" disabled={!form.subjectId || !form.title || !form.dueDate || createMutation.isPending || uploading}>
                                {createMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Publish Assignment'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
