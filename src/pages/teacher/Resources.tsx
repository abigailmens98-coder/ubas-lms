import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FolderOpen, Upload, Trash2, FileText, Video, Link2, File, Loader2, X, Plus } from 'lucide-react'

const typeIcons: Record<string, any> = { pdf: FileText, video: Video, link: Link2, document: File }
const typeColors: Record<string, string> = {
    pdf: 'from-red-400 to-red-600', video: 'from-violet-400 to-violet-600',
    link: 'from-cyan-400 to-cyan-600', document: 'from-amber-400 to-amber-600'
}

export default function TeacherResources({ user }: { user: any }) {
    const qc = useQueryClient()
    const [showModal, setShowModal] = useState(false)
    const [form, setForm] = useState({ title: '', description: '', type: 'pdf', fileUrl: '', subjectId: '' })
    const [uploading, setUploading] = useState(false)
    const [filter, setFilter] = useState('')

    const { data: resources = [], isLoading } = useQuery({
        queryKey: ['resources'],
        queryFn: async () => { const r = await fetch('/api/resources'); return r.json() }
    })

    const { data: subjects = [] } = useQuery({
        queryKey: ['my-subjects', user.id],
        queryFn: async () => { const r = await fetch(`/api/subjects?teacherId=${user.id}`); return r.json() }
    })

    const createMut = useMutation({
        mutationFn: async (data: any) => {
            const r = await fetch('/api/resources', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, uploadedById: user.id }) })
            if (!r.ok) throw new Error(); return r.json()
        },
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['resources'] }); setShowModal(false); setForm({ title: '', description: '', type: 'pdf', fileUrl: '', subjectId: '' }) }
    })

    const deleteMut = useMutation({
        mutationFn: async (id: string) => { await fetch(`/api/resources/${id}`, { method: 'DELETE' }) },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['resources'] })
    })

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setUploading(true)
        const fd = new FormData(); fd.append('file', file)
        const r = await fetch('/api/upload', { method: 'POST', body: fd })
        const data = await r.json()
        setForm(prev => ({ ...prev, fileUrl: data.fileUrl }))
        setUploading(false)
    }

    const myResources = resources.filter((r: any) => r.uploadedById === user.id && (filter ? r.subjectId === filter : true))

    return (
        <div className="animate-fade-in text-slate-700">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                <div><h1 className="text-2xl font-bold text-slate-800 tracking-tight">Resource Library</h1><p className="text-sm text-slate-500 mt-1">Upload and manage learning materials for your students</p></div>
                <button onClick={() => setShowModal(true)} className="btn-primary"><Plus className="w-4 h-4" /> Upload Resource</button>
            </div>

            {/* Filter */}
            <div className="flex gap-2 mb-6 flex-wrap">
                <button onClick={() => setFilter('')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${!filter ? 'bg-primary-500 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>All</button>
                {subjects.map((s: any) => (
                    <button key={s.id} onClick={() => setFilter(s.id)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filter === s.id ? 'bg-primary-500 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{s.name}</button>
                ))}
            </div>

            {isLoading ? <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {myResources.length === 0 && (
                        <div className="col-span-full p-12 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                            <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <h2 className="text-lg font-semibold text-slate-700">No Resources Yet</h2>
                            <p className="text-sm text-slate-500">Upload PDFs, videos, or links for your students</p>
                        </div>
                    )}
                    {myResources.map((res: any) => {
                        const Icon = typeIcons[res.type] || File
                        return (
                            <div key={res.id} className="bg-white rounded-2xl shadow-sm border border-slate-100/80 p-5 hover:shadow-md transition-all group">
                                <div className="flex items-start justify-between mb-3">
                                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${typeColors[res.type] || 'from-slate-400 to-slate-600'} flex items-center justify-center shadow-md`}>
                                        <Icon className="w-5 h-5 text-white" />
                                    </div>
                                    <button onClick={() => { if (confirm('Delete this resource?')) deleteMut.mutate(res.id) }} className="p-1.5 rounded-lg hover:bg-danger-50 text-slate-400 hover:text-danger-500 opacity-0 group-hover:opacity-100 transition-all">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                <h3 className="font-bold text-slate-800 text-sm mb-1 line-clamp-1">{res.title}</h3>
                                {res.description && <p className="text-xs text-slate-400 mb-3 line-clamp-2">{res.description}</p>}
                                <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{res.subject?.name}</span>
                                    <a href={res.type === 'link' ? res.fileUrl : res.fileUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-primary-500 hover:text-primary-600">
                                        {res.type === 'link' ? 'Open Link' : 'Download'}
                                    </a>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Upload Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-modal w-full max-w-md p-6 animate-scale-in">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-slate-800">Upload Resource</h2>
                            <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-slate-100"><X className="w-4 h-4 text-slate-500" /></button>
                        </div>
                        <div className="space-y-4">
                            <div><label className="block text-sm font-medium text-slate-600 mb-1.5">Title</label>
                                <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Chapter 5 Notes" className="input-field" required /></div>
                            <div><label className="block text-sm font-medium text-slate-600 mb-1.5">Description</label>
                                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Brief description..." className="input-field" rows={2} /></div>
                            <div><label className="block text-sm font-medium text-slate-600 mb-1.5">Subject</label>
                                <select value={form.subjectId} onChange={e => setForm({ ...form, subjectId: e.target.value })} className="input-field">
                                    <option value="">Select subject</option>
                                    {subjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                            <div><label className="block text-sm font-medium text-slate-600 mb-1.5">Type</label>
                                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="input-field">
                                    <option value="pdf">PDF</option><option value="video">Video</option><option value="document">Document</option><option value="link">Link</option>
                                </select></div>
                            {form.type === 'link' ? (
                                <div><label className="block text-sm font-medium text-slate-600 mb-1.5">URL</label>
                                    <input type="url" value={form.fileUrl} onChange={e => setForm({ ...form, fileUrl: e.target.value })} placeholder="https://..." className="input-field" /></div>
                            ) : (
                                <div><label className="block text-sm font-medium text-slate-600 mb-1.5">File</label>
                                    <input type="file" onChange={handleFileUpload} className="input-field text-xs" />
                                    {uploading && <p className="text-xs text-primary-500 mt-1 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Uploading...</p>}
                                    {form.fileUrl && !uploading && <p className="text-xs text-success-600 mt-1">✓ File uploaded</p>}
                                </div>
                            )}
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setShowModal(false)} className="btn-outline flex-1 justify-center">Cancel</button>
                            <button onClick={() => createMut.mutate(form)} disabled={!form.title || !form.subjectId || !form.fileUrl || createMut.isPending}
                                className="btn-primary flex-1 justify-center disabled:opacity-50">
                                {createMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Upload className="w-4 h-4" /> Upload</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
