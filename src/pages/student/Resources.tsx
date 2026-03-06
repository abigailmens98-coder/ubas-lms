import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FolderOpen, FileText, Video, Link2, File, Loader2, Download, ExternalLink, Search } from 'lucide-react'

const typeIcons: Record<string, any> = { pdf: FileText, video: Video, link: Link2, document: File }
const typeColors: Record<string, string> = {
    pdf: 'from-red-400 to-red-600', video: 'from-violet-400 to-violet-600',
    link: 'from-cyan-400 to-cyan-600', document: 'from-amber-400 to-amber-600'
}

export default function StudentResources({ user }: { user: any }) {
    const [filter, setFilter] = useState('')
    const [search, setSearch] = useState('')

    const { data: resources = [], isLoading } = useQuery({
        queryKey: ['resources'],
        queryFn: async () => { const r = await fetch('/api/resources'); return r.json() }
    })

    const { data: subjects = [] } = useQuery({
        queryKey: ['subjects'],
        queryFn: async () => { const r = await fetch('/api/subjects'); return r.json() }
    })

    const filtered = resources.filter((r: any) =>
        (filter ? r.subjectId === filter : true) &&
        (search ? r.title.toLowerCase().includes(search.toLowerCase()) : true)
    )

    return (
        <div className="animate-fade-in text-slate-700">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight mb-1">Resource Library</h1>
            <p className="text-sm text-slate-500 mb-6">Browse and download learning materials from your teachers</p>

            {/* Search */}
            <div className="relative mb-5">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="Search resources..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-11" />
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-6 flex-wrap">
                <button onClick={() => setFilter('')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${!filter ? 'bg-primary-500 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>All</button>
                {subjects.map((s: any) => (
                    <button key={s.id} onClick={() => setFilter(s.id)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filter === s.id ? 'bg-primary-500 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{s.name}</button>
                ))}
            </div>

            {isLoading ? <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.length === 0 && (
                        <div className="col-span-full p-12 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                            <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <h2 className="text-lg font-semibold text-slate-700">No Resources Found</h2>
                            <p className="text-sm text-slate-500">Check back later for new materials</p>
                        </div>
                    )}
                    {filtered.map((res: any) => {
                        const Icon = typeIcons[res.type] || File
                        return (
                            <div key={res.id} className="bg-white rounded-2xl shadow-sm border border-slate-100/80 p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all group">
                                <div className="flex items-start gap-4 mb-4">
                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${typeColors[res.type] || 'from-slate-400 to-slate-600'} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                                        <Icon className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-slate-800 text-sm line-clamp-1">{res.title}</h3>
                                        <p className="text-xs text-slate-400 mt-0.5">{res.subject?.name} • by {res.uploadedBy?.name}</p>
                                    </div>
                                </div>
                                {res.description && <p className="text-xs text-slate-400 mb-4 line-clamp-2">{res.description}</p>}
                                <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                                    <span className="text-[10px] text-slate-400 font-medium">{new Date(res.createdAt).toLocaleDateString()}</span>
                                    <a href={res.fileUrl} target="_blank" rel="noreferrer"
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-600 rounded-lg text-xs font-bold hover:bg-primary-500 hover:text-white transition-all">
                                        {res.type === 'link' ? <><ExternalLink className="w-3.5 h-3.5" /> Open</> : <><Download className="w-3.5 h-3.5" /> Download</>}
                                    </a>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
