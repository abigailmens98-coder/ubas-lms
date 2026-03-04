import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Video, Clock, Loader2, Calendar, Play, Users } from 'lucide-react'
import VideoRoom from '../../components/VideoRoom'

export default function TeacherLiveClasses({ user }: { user: any }) {
    const queryClient = useQueryClient()
    const [showModal, setShowModal] = useState(false)
    const [activeRoom, setActiveRoom] = useState<string | null>(null)
    const [form, setForm] = useState({ title: '', topic: '', startTime: '', duration: 60, joinUrl: '', subjectId: '' })

    const { data: subjects = [] } = useQuery({
        queryKey: ['teacher-subjects', user.id],
        queryFn: async () => {
            const res = await fetch(`/api/subjects`)
            if (!res.ok) throw new Error()
            return res.json()
        }
    })

    // Filter subjects by teacherId
    const teacherSubjects = subjects.filter((s: any) => s.teacherId === user.id)

    const { data: classes = [], isLoading } = useQuery({
        queryKey: ['live-classes', 'teacher', user.id],
        queryFn: async () => {
            const res = await fetch(`/api/live-classes?role=teacher&userId=${user.id}`)
            if (!res.ok) throw new Error('Failed to fetch classes')
            return res.json()
        }
    })

    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch(`/api/live-classes`, {
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

    const handleCreate = () => {
        // If no external link provided, generate an in-app room
        const data = { ...form }
        if (!data.joinUrl) {
            data.joinUrl = `webrtc://${data.title.replace(/\s+/g, '-').toLowerCase()}-${Date.now().toString(36)}`
        }
        createMutation.mutate(data)
    }

    const isWebRTCRoom = (url: string) => url.startsWith('webrtc://')
    const getRoomId = (url: string) => url.replace('webrtc://', '')

    if (activeRoom) {
        return <VideoRoom roomId={activeRoom} userName={user.name} onLeave={() => setActiveRoom(null)} />
    }

    if (isLoading) {
        return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>
    }

    return (
        <div className="p-4 lg:p-6 text-slate-700 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold mb-1 text-slate-800">Live Classes</h1>
                    <p className="text-slate-500 text-sm">Schedule and start video classes with WebRTC</p>
                </div>
                <button onClick={() => setShowModal(true)} className="px-5 py-2.5 bg-success-500 text-white shadow-md hover:bg-success-600 rounded-xl font-semibold flex items-center gap-2 transition-all text-sm">
                    <Plus className="w-4 h-4" />
                    Schedule Class
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {classes.length === 0 && (
                    <div className="col-span-full p-12 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50">
                        <Video className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <h2 className="text-lg font-semibold text-slate-700">No Scheduled Classes</h2>
                        <p className="text-slate-500 text-sm">Click the button above to schedule a class</p>
                    </div>
                )}
                {classes.map((c: any) => {
                    const startTime = new Date(c.startTime)
                    const isLive = startTime <= new Date()
                    const isInApp = isWebRTCRoom(c.joinUrl)

                    return (
                        <div key={c.id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col hover:shadow-md transition-all">
                            <div className="flex items-start justify-between mb-3">
                                <h3 className="text-lg font-bold text-slate-800">{c.title}</h3>
                                {isLive && (
                                    <span className="px-2 py-1 bg-danger-100 text-danger-600 text-[10px] font-bold rounded-lg uppercase animate-pulse">Live Now</span>
                                )}
                            </div>
                            <p className="text-xs tracking-wider uppercase font-bold text-primary-500 mb-4">{c.subject?.name}</p>

                            <div className="space-y-3 mb-6 flex-1">
                                <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                                    <Clock className="w-4 h-4 text-slate-400" />
                                    <span>{startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({c.duration}m)</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                                    <Calendar className="w-4 h-4 text-slate-400" />
                                    <span>{startTime.toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                                    <Video className="w-4 h-4 text-slate-400" />
                                    <span className="truncate">{isInApp ? 'In-App Video Call' : c.joinUrl}</span>
                                </div>
                            </div>

                            {isInApp ? (
                                <button onClick={() => setActiveRoom(getRoomId(c.joinUrl))}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-success-500 to-success-600 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all text-sm">
                                    <Play className="w-4 h-4" /> Start Class
                                </button>
                            ) : (
                                <a href={c.joinUrl} target="_blank"
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-500 text-white rounded-xl font-bold shadow-md hover:bg-primary-600 transition-all text-sm">
                                    <Video className="w-4 h-4" /> Join External Link
                                </a>
                            )}
                        </div>
                    )
                })}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl">
                        <h2 className="text-xl font-bold mb-6 text-slate-800">Schedule Live Class</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Subject</label>
                                <select value={form.subjectId} onChange={e => setForm({ ...form, subjectId: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary-500 text-sm">
                                    <option value="">Select a subject</option>
                                    {teacherSubjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Title</label>
                                <input type="text" placeholder="e.g. Weekly Math Review" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary-500 text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Topic</label>
                                <input type="text" placeholder="e.g. Algebra III" value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary-500 text-sm" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Start Date & Time</label>
                                    <input type="datetime-local" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary-500 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Duration (mins)</label>
                                    <input type="number" value={form.duration} onChange={e => setForm({ ...form, duration: parseInt(e.target.value) })} className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary-500 text-sm" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">External Link <span className="text-xs text-slate-400 font-normal">(leave empty for in-app video call)</span></label>
                                <input type="url" placeholder="https://zoom.us/j/... or leave empty" value={form.joinUrl} onChange={e => setForm({ ...form, joinUrl: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary-500 text-sm" />
                                <p className="text-xs text-slate-400 mt-1.5">💡 Leave empty to create a built-in WebRTC video classroom</p>
                            </div>
                        </div>

                        <div className="mt-8 flex gap-3">
                            <button onClick={() => setShowModal(false)} className="flex-1 py-3 px-4 rounded-xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 text-sm" disabled={createMutation.isPending}>Cancel</button>
                            <button onClick={handleCreate} className="flex-1 py-3 px-4 rounded-xl font-bold bg-primary-500 text-white hover:bg-primary-600 shadow-md flex justify-center items-center text-sm" disabled={!form.subjectId || !form.title || !form.startTime || createMutation.isPending}>
                                {createMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Schedule'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
