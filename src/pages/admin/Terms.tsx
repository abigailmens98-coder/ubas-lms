import { useState } from 'react'
import { Plus, Calendar, Edit3, Trash2, X, CheckCircle2 } from 'lucide-react'

interface Term {
    id: string
    name: string
    startDate: string
    endDate: string
    status: 'active' | 'upcoming' | 'completed'
    year: string
}

const mockTerms: Term[] = [
    { id: '1', name: 'First Term', startDate: 'Sep 4, 2025', endDate: 'Dec 20, 2025', status: 'completed', year: '2025/2026' },
    { id: '2', name: 'Second Term', startDate: 'Jan 6, 2026', endDate: 'Apr 10, 2026', status: 'active', year: '2025/2026' },
    { id: '3', name: 'Third Term', startDate: 'May 4, 2026', endDate: 'Jul 30, 2026', status: 'upcoming', year: '2025/2026' },
]

const statusStyles = {
    active: 'bg-success-100 text-success-700',
    upcoming: 'bg-primary-100 text-primary-700',
    completed: 'bg-slate-100 text-slate-500',
}

export default function AdminTerms() {
    const [showModal, setShowModal] = useState(false)

    return (
        <div className="animate-fade-in">
            <div className="flex items-start justify-between mb-8">
                <div className="page-header mb-0">
                    <h1 className="page-title">Academic Terms</h1>
                    <p className="page-subtitle">Manage academic terms and school calendar</p>
                </div>
                <button onClick={() => setShowModal(true)} className="btn-primary">
                    <Plus className="w-4 h-4" />
                    Add Term
                </button>
            </div>

            <div className="space-y-4">
                {mockTerms.map((term, index) => (
                    <div
                        key={term.id}
                        className={`content-card flex items-center gap-6 hover:shadow-card-hover transition-all duration-300
                        ${term.status === 'active' ? 'ring-2 ring-success-200' : ''}`}
                        style={{ animationDelay: `${index * 80}ms` }}
                    >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
                            ${term.status === 'active' ? 'bg-gradient-to-br from-success-400 to-success-600' :
                                term.status === 'upcoming' ? 'bg-gradient-to-br from-primary-400 to-primary-600' :
                                    'bg-gradient-to-br from-slate-300 to-slate-400'}`}>
                            {term.status === 'active' ? (
                                <CheckCircle2 className="w-6 h-6 text-white" />
                            ) : (
                                <Calendar className="w-6 h-6 text-white" />
                            )}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                                <h3 className="text-base font-bold text-slate-800">{term.name}</h3>
                                <span className={`badge ${statusStyles[term.status]}`}>{term.status}</span>
                            </div>
                            <p className="text-sm text-slate-400">
                                {term.year} · {term.startDate} — {term.endDate}
                            </p>
                        </div>
                        <div className="flex items-center gap-1">
                            <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                                <Edit3 className="w-4 h-4" />
                            </button>
                            <button className="p-2 rounded-lg hover:bg-danger-50 text-slate-400 hover:text-danger-500 transition-colors">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-modal w-full max-w-md p-6 animate-scale-in">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-slate-800">Add Academic Term</h2>
                            <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-slate-100">
                                <X className="w-4 h-4 text-slate-500" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1.5">Term Name</label>
                                <select className="input-field">
                                    <option>First Term</option>
                                    <option>Second Term</option>
                                    <option>Third Term</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1.5">Academic Year</label>
                                <input type="text" placeholder="e.g. 2025/2026" className="input-field" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1.5">Start Date</label>
                                    <input type="date" className="input-field" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1.5">End Date</label>
                                    <input type="date" className="input-field" />
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-100">
                            <button onClick={() => setShowModal(false)} className="btn-outline flex-1 justify-center">Cancel</button>
                            <button className="btn-primary flex-1 justify-center">Add Term</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
