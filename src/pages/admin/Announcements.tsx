import { useState } from 'react'
import { Plus, Bell, Loader2, Send } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export default function AdminAnnouncements({ user }: { user: any }) {
    const queryClient = useQueryClient()
    const [showModal, setShowModal] = useState(false)
    const [form, setForm] = useState({ title: '', content: '' })

    const { data: announcements = [], isLoading } = useQuery({
        queryKey: ['announcements'],
        queryFn: async () => {
            const res = await fetch(`/api/announcements`)
            if (!res.ok) throw new Error('Failed to fetch')
            return res.json()
        }
    })

    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch(`/api/announcements`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })
            if (!res.ok) throw new Error('Failed to create')
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['announcements'] })
            setShowModal(false)
            setForm({ title: '', content: '' })
        }
    })

    if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>

    return (
        <div className="p-6 text-slate-700 animate-fade-in">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold mb-2 text-slate-800">Announcements</h1>
                    <p className="text-slate-500">Post global announcements targeting all users</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="px-5 py-2.5 bg-success-500 text-white shadow-md hover:bg-success-600 rounded-xl font-semibold flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    New Announcement
                </button>
            </div>

            <div className="space-y-6 max-w-3xl">
                {announcements.length === 0 && (
                    <div className="p-12 text-center border-2 border-dashed border-slate-200 bg-slate-50 rounded-3xl">
                        <Bell className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <h2 className="text-lg font-semibold text-slate-700">No Announcements</h2>
                    </div>
                )}
                {announcements.map((a: any) => (
                    <div key={a.id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary-100 text-primary-600 flex justify-center items-center shadow-sm shrink-0">
                            <Bell className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 mb-1">{a.title}</h3>
                            <p className="text-xs font-semibold text-slate-400 mb-3">
                                Posted by Admin • {new Date(a.createdAt).toLocaleString()}
                            </p>
                            <p className="text-slate-600 leading-relaxed text-sm">{a.content}</p>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl">
                        <h2 className="text-xl font-bold mb-6 text-slate-800">New Announcement</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Title</label>
                                <input
                                    type="text"
                                    value={form.title}
                                    onChange={e => setForm({ ...form, title: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Message Content</label>
                                <textarea
                                    value={form.content}
                                    onChange={e => setForm({ ...form, content: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-primary-500 h-32 resize-none"
                                />
                            </div>
                        </div>

                        <div className="mt-8 flex gap-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200"
                                disabled={createMutation.isPending}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => createMutation.mutate({ ...form, authorId: user.id })}
                                className="flex-1 py-3 bg-primary-500 text-white rounded-xl font-bold hover:bg-primary-600 shadow-md flex justify-center items-center gap-2"
                                disabled={!form.title || !form.content || createMutation.isPending}
                            >
                                {createMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4" /> Publish</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
