import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Video, Clock, Loader2, Calendar } from 'lucide-react'

export default function TeacherLiveClasses({ user }: { user: any }) {
    const queryClient = useQueryClient()
    const [showModal, setShowModal] = useState(false)
    const [form, setForm] = useState({ title: '', topic: '', startTime: '', duration: 60, joinUrl: '', subjectId: '' })

    const { data: subjects = [] } = useQuery({
        queryKey: ['teacher-subjects', user.id],
        queryFn: async () => {
            const res = await fetch(`http://localhost:3001/api/subjects`)
            if (!res.ok) throw new Error()
            return res.json()
        }
    })

    // Filter subjects by teacherId
    const teacherSubjects = subjects.filter((s: any) => s.teacherId === user.id)

    const { data: classes = [], isLoading } = useQuery({
        queryKey: ['live-classes', 'teacher', user.id],
        queryFn: async () => {
            const res = await fetch(`http://localhost:3001/api/live-classes?role=teacher&userId=${user.id}`)
            if (!res.ok) throw new Error('Failed to fetch classes')
            return res.json()
        }
    })

    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch(`http://localhost:3001/api/live-classes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...data, teacherId: user.id })
            })
            if (!res.ok) throw new Error('Failed to create')
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['live-classes', 'teacher', user.id] })
            setShowModal(false)
            setForm({ title: '', topic: '', startTime: '', duration: 60, joinUrl: '', subjectId: '' })
        }
    })

    if (isLoading) {
        return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>
    }

    return (
        <div className="p-6 text-slate-700 animate-fade-in">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold mb-2 text-slate-800">Live Classes</h1>
                    <p className="text-slate-500">Schedule Zoom/Meet classes for your subjects</p>
                </div>
                <button onClick={() => setShowModal(true)} className="px-5 py-2.5 bg-success-500 text-white shadow-md hover:bg-success-600 rounded-xl font-semibold flex items-center gap-2 transition-all">
                    <Plus className="w-4 h-4" />
                    Schedule Class
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {classes.length === 0 && (
                    <div className="col-span-full p-12 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50">
                        <Video className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <h2 className="text-lg font-semibold text-slate-700">No Scheduled Classes</h2>
                        <p className="text-slate-500">Click the button above to schedule a class</p>
                    </div>
                )}
                {classes.map((c: any) => {
                    const startTime = new Date(c.startTime)
                    return (
                        <div key={c.id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col">
                            <h3 className="text-lg font-bold text-slate-800 mb-1">{c.title}</h3>
                            <p className="text-xs tracking-wider uppercase font-bold text-primary-500 mb-4">{c.subject?.name}</p>

                            <div className="space-y-3 mb-6 flex-1">
                                <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                                    <Clock className="w-5 h-5 text-slate-400" />
                                    <span>{startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({c.duration}m)</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                                    <Calendar className="w-5 h-5 text-slate-400" />
                                    <span>{startTime.toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                                    <Video className="w-5 h-5 text-slate-400" />
                                    <a href={c.joinUrl} target="_blank" className="text-primary-600 underline truncate">{c.joinUrl}</a>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl">
                        <h2 className="text-xl font-bold mb-6 text-slate-800">Schedule Live Class</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Subject</label>
                                <select value={form.subjectId} onChange={e => setForm({ ...form, subjectId: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary-500">
                                    <option value="">Select a subject</option>
                                    {teacherSubjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Title</label>
                                <input type="text" placeholder="e.g. Weekly Math Review" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Topic</label>
                                <input type="text" placeholder="e.g. Algebra III" value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary-500" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Start Date & Time</label>
                                    <input type="datetime-local" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Duration (mins)</label>
                                    <input type="number" value={form.duration} onChange={e => setForm({ ...form, duration: parseInt(e.target.value) })} className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary-500" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Zoom / Meet Link</label>
                                <input type="url" placeholder="https://zoom.us/j/..." value={form.joinUrl} onChange={e => setForm({ ...form, joinUrl: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary-500" />
                            </div>
                        </div>

                        <div className="mt-8 flex gap-3">
                            <button onClick={() => setShowModal(false)} className="flex-1 py-3 px-4 rounded-xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200" disabled={createMutation.isPending}>Cancel</button>
                            <button onClick={() => createMutation.mutate(form)} className="flex-1 py-3 px-4 rounded-xl font-bold bg-primary-500 text-white hover:bg-primary-600 shadow-md flex justify-center items-center" disabled={!form.subjectId || !form.title || !form.startTime || !form.joinUrl || createMutation.isPending}>
                                {createMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Schedule'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
