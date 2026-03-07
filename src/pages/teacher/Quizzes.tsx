import { useState } from 'react'
import { Plus, Trophy, Sparkles, X, Clock, Users, Loader2, Download, FileUp, BookOpen, CheckCircle2, Save, Trash2, PlusCircle } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

const statusStyles: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-500',
    published: 'bg-success-100 text-success-700',
    closed: 'bg-danger-100 text-danger-700',
}

interface ManualQuestion {
    text: string
    options: string[]
    correctAnswer: string
    explanation: string
}

const emptyQuestion = (): ManualQuestion => ({ text: '', options: ['', '', '', ''], correctAnswer: '', explanation: '' })

export default function TeacherQuizzes() {
    const user = JSON.parse(localStorage.getItem('ubas_user') || '{}')
    const queryClient = useQueryClient()
    const [showAIModal, setShowAIModal] = useState(false)
    const [showManualModal, setShowManualModal] = useState(false)
    const [isGenerating, setIsGenerating] = useState(false)
    const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([])
    const [aiMode, setAiMode] = useState<'text' | 'pdf'>('text')
    const [pdfFile, setPdfFile] = useState<File | null>(null)
    const [quizTitle, setQuizTitle] = useState('')
    const [quizDuration, setQuizDuration] = useState(30)
    const [publishSubjectId, setPublishSubjectId] = useState('')

    // Manual quiz state
    const [manualTitle, setManualTitle] = useState('')
    const [manualDuration, setManualDuration] = useState(30)
    const [manualSubjectId, setManualSubjectId] = useState('')
    const [manualQuestions, setManualQuestions] = useState<ManualQuestion[]>([emptyQuestion()])

    const [aiForm, setAiForm] = useState({
        subject: 'Computing',
        lesson: '',
        questionTypes: { multipleChoice: true, trueFalse: false, shortAnswer: false },
        numberOfQuestions: 5,
        difficulty: 'Medium',
        classLevel: 'JHS 1',
    })

    const { data: quizzes = [], isLoading } = useQuery({
        queryKey: ['teacher-quizzes', user.id],
        queryFn: async () => {
            const res = await fetch(`/api/quizzes/teacher/${user.id}`)
            if (!res.ok) throw new Error('Failed to fetch quizzes')
            return res.json()
        },
        enabled: !!user?.id
    })

    const { data: allSubjects = [] } = useQuery({
        queryKey: ['subjects-all'],
        queryFn: async () => { const r = await fetch('/api/subjects'); if (!r.ok) throw new Error(); return r.json() }
    })
    const teacherSubjects = allSubjects.filter((s: any) => s.teacherId === user.id)

    const publishMutation = useMutation({
        mutationFn: async (payload: { title: string; duration: number; subjectId: string; questions: any[] }) => {
            const res = await fetch('/api/quizzes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...payload, status: 'published' })
            })
            if (!res.ok) throw new Error('Failed to publish quiz')
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['teacher-quizzes'] })
            setGeneratedQuestions([])
            setQuizTitle('')
            setPublishSubjectId('')
            setShowManualModal(false)
            setManualQuestions([emptyQuestion()])
            setManualTitle('')
            setManualSubjectId('')
            alert('Quiz published successfully! Students have been notified.')
        }
    })

    const handlePublishAI = () => {
        publishMutation.mutate({ title: quizTitle, duration: quizDuration, subjectId: publishSubjectId, questions: generatedQuestions })
    }

    const handlePublishManual = () => {
        const valid = manualQuestions.every(q => q.text && q.options.every(o => o) && q.correctAnswer)
        if (!valid) { alert('Please fill all questions, options, and select correct answers'); return }
        const questions = manualQuestions.map(q => ({
            text: q.text,
            type: 'multiple_choice',
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation || ''
        }))
        publishMutation.mutate({ title: manualTitle, duration: manualDuration, subjectId: manualSubjectId, questions })
    }

    const updateManualQuestion = (index: number, field: string, value: any) => {
        setManualQuestions(prev => prev.map((q, i) => i === index ? { ...q, [field]: value } : q))
    }
    const updateManualOption = (qIndex: number, oIndex: number, value: string) => {
        setManualQuestions(prev => prev.map((q, i) => i === qIndex ? { ...q, options: q.options.map((o, j) => j === oIndex ? value : o) } : q))
    }
    const addManualQuestion = () => setManualQuestions(prev => [...prev, emptyQuestion()])
    const removeManualQuestion = (index: number) => setManualQuestions(prev => prev.filter((_, i) => i !== index))

    const handleGenerateAI = async () => {
        setIsGenerating(true)
        try {
            const res = await fetch('/api/ai/generate-quiz', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subject: aiForm.subject, lesson: aiForm.lesson, difficulty: aiForm.difficulty, count: aiForm.numberOfQuestions, types: aiForm.questionTypes })
            })
            if (!res.ok) throw new Error('AI Generation failed')
            const data = await res.json()
            setGeneratedQuestions(data.questions)
            alert(`AI successfully generated ${data.questions.length} questions!`)
            setShowAIModal(false)
        } catch { alert('AI Generation failed. Check your API key in .env') }
        finally { setIsGenerating(false) }
    }

    const handleGenerateFromPDF = async () => {
        if (!pdfFile) return
        setIsGenerating(true)
        try {
            const fd = new FormData(); fd.append('pdf', pdfFile); fd.append('subject', aiForm.subject); fd.append('difficulty', aiForm.difficulty); fd.append('count', String(aiForm.numberOfQuestions)); fd.append('classLevel', aiForm.classLevel)
            const res = await fetch('/api/ai/generate-quiz-from-pdf', { method: 'POST', body: fd })
            if (!res.ok) throw new Error()
            const data = await res.json()
            setGeneratedQuestions(data.questions)
            alert(`AI generated ${data.questions.length} questions from your PDF!`)
            setShowAIModal(false); setPdfFile(null)
        } catch { alert('Failed to generate quiz from PDF.') }
        finally { setIsGenerating(false) }
    }

    const downloadPDF = (quiz: any) => {
        const doc = new jsPDF()
        doc.setFontSize(20); doc.text(`Broadsheet - ${quiz.title}`, 14, 22)
        doc.setFontSize(11); doc.text(`Subject: ${quiz.subject.name}`, 14, 30); doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 36)
        const tableColumn = ["Student Name", "Score", "Max Score", "Percentage", "Date Completed"]
        const tableRows: any[] = []
        quiz.attempts.forEach((a: any) => { tableRows.push([a.student?.name || 'Unknown', a.score, a.maxScore, Math.round((a.score / a.maxScore) * 100) + "%", new Date(a.completedAt).toLocaleDateString()]) })
        // @ts-ignore
        doc.autoTable({ head: [tableColumn], body: tableRows, startY: 42, styles: { fontSize: 10, cellPadding: 3 }, headStyles: { fillColor: [59, 130, 246] } })
        doc.save(`${quiz.title.replace(/\s+/g, '_')}_Broadsheet.pdf`)
    }

    return (
        <div className="animate-fade-in text-slate-700 p-4 lg:p-6">
            {/* Review AI-Generated Questions */}
            {generatedQuestions.length > 0 && (
                <div className="mb-8 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-5 bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                        <h2 className="text-lg font-bold">📝 Review Generated Questions ({generatedQuestions.length})</h2>
                        <p className="text-purple-100 text-sm mt-1">Review, set a title, and publish to your students</p>
                    </div>
                    <div className="p-5 border-b border-slate-100">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Quiz Title</label>
                                <input type="text" value={quizTitle} onChange={e => setQuizTitle(e.target.value)} placeholder="e.g. Week 4 - Computer Parts" className="input-field" /></div>
                            <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Subject</label>
                                <select value={publishSubjectId} onChange={e => setPublishSubjectId(e.target.value)} className="input-field">
                                    <option value="">Select subject</option>{teacherSubjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                            <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Duration (mins)</label>
                                <input type="number" value={quizDuration} onChange={e => setQuizDuration(parseInt(e.target.value))} className="input-field" /></div>
                        </div>
                    </div>
                    <div className="divide-y divide-slate-50 max-h-[400px] overflow-y-auto">
                        {generatedQuestions.map((q: any, i: number) => (
                            <div key={i} className="p-4 hover:bg-slate-50 transition-colors">
                                <div className="flex gap-3">
                                    <span className="w-7 h-7 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-xs shrink-0">{i + 1}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-slate-800 text-sm mb-2">{q.text}</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-2">
                                            {(q.options || []).map((opt: string, j: number) => (
                                                <div key={j} className={`text-xs px-3 py-1.5 rounded-lg ${opt === q.correctAnswer ? 'bg-success-100 text-success-700 font-bold' : 'bg-slate-100 text-slate-600'}`}>
                                                    {opt === q.correctAnswer && <CheckCircle2 className="w-3 h-3 inline mr-1" />}{opt}
                                                </div>
                                            ))}
                                        </div>
                                        {q.explanation && <p className="text-[11px] text-slate-400 italic">💡 {q.explanation}</p>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="p-4 bg-slate-50 flex flex-col sm:flex-row gap-3">
                        <button onClick={() => setGeneratedQuestions([])} className="flex-1 py-2.5 bg-slate-200 text-slate-600 rounded-xl font-semibold text-sm hover:bg-slate-300">Discard</button>
                        <button onClick={handlePublishAI} disabled={!quizTitle || !publishSubjectId || publishMutation.isPending}
                            className="flex-1 py-2.5 bg-success-500 text-white rounded-xl font-semibold text-sm hover:bg-success-600 shadow-md flex items-center justify-center gap-2 disabled:opacity-50">
                            {publishMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Publish Quiz</>}
                        </button>
                    </div>
                </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
                <div className="page-header mb-0">
                    <h1 className="text-2xl font-bold text-slate-800">Quizzes</h1>
                    <p className="text-slate-500 text-sm">Create and manage quizzes — aligned with Ghana Basic School curriculum</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => setShowManualModal(true)} className="px-4 py-2 bg-primary-500 text-white rounded-xl shadow-sm hover:bg-primary-600 transition-colors flex items-center gap-2 font-medium text-sm">
                        <Plus className="w-4 h-4" /> Create Quiz
                    </button>
                    <button onClick={() => { setShowAIModal(true); setAiMode('text') }} className="px-4 py-2 bg-purple-500 text-white rounded-xl shadow-sm hover:bg-purple-600 transition-colors flex items-center gap-2 font-medium text-sm">
                        <Sparkles className="w-4 h-4" /> Generate AI
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {quizzes.length === 0 && (
                        <div className="col-span-full py-12 text-center text-slate-500 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                            No quizzes found. Create one or generate with AI.
                        </div>
                    )}
                    {quizzes.map((quiz: any) => (
                        <div key={quiz.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 group hover:shadow-md transition-all duration-300">
                            <div className="flex items-start justify-between mb-3">
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${quiz.subject?.color || 'from-primary-400 to-primary-600'} flex items-center justify-center shadow-md`}>
                                    <Trophy className="w-6 h-6 text-white" />
                                </div>
                                <span className={`px-2 py-1 rounded-md text-xs font-semibold ${statusStyles[quiz.status] || 'bg-slate-100 text-slate-600'}`}>{quiz.status}</span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 mb-1">{quiz.title}</h3>
                            <p className="text-sm text-slate-400 mb-6">{quiz.subject?.name || 'No subject'}</p>
                            <div className="flex items-center gap-4 pt-4 border-t border-slate-100 text-xs text-slate-500 font-medium mb-4">
                                <span className="flex items-center gap-1"><Trophy className="w-3.5 h-3.5" />{quiz._count?.questions || 0} Qs</span>
                                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{quiz.duration}m</span>
                                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{quiz.attempts?.length || 0} attempts</span>
                            </div>
                            {quiz.attempts && quiz.attempts.length > 0 && (
                                <button onClick={() => downloadPDF(quiz)} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl transition-colors border border-slate-200 text-sm font-semibold">
                                    <Download className="w-4 h-4 text-primary-500" /> Download Broadsheet
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* MANUAL CREATE QUIZ MODAL */}
            {showManualModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10 rounded-t-3xl">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">✏️ Create Quiz</h2>
                                <p className="text-sm text-slate-500 mt-0.5">Manually type your questions and options</p>
                            </div>
                            <button onClick={() => setShowManualModal(false)} className="p-2 rounded-xl hover:bg-slate-100"><X className="w-5 h-5 text-slate-400" /></button>
                        </div>

                        <div className="p-6 space-y-5">
                            {/* Quiz Meta */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Quiz Title *</label>
                                    <input type="text" value={manualTitle} onChange={e => setManualTitle(e.target.value)} placeholder="e.g. Week 4 Assessment" className="input-field" /></div>
                                <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Subject *</label>
                                    <select value={manualSubjectId} onChange={e => setManualSubjectId(e.target.value)} className="input-field">
                                        <option value="">Select subject</option>{teacherSubjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                                <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Duration (mins)</label>
                                    <input type="number" value={manualDuration} onChange={e => setManualDuration(parseInt(e.target.value) || 30)} className="input-field" /></div>
                            </div>

                            {/* Questions */}
                            <div className="space-y-4">
                                <p className="text-sm font-bold text-slate-700">Questions ({manualQuestions.length})</p>
                                {manualQuestions.map((q, qIdx) => (
                                    <div key={qIdx} className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="w-8 h-8 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-sm">Q{qIdx + 1}</span>
                                            {manualQuestions.length > 1 && (
                                                <button onClick={() => removeManualQuestion(qIdx)} className="p-1.5 rounded-lg hover:bg-danger-50 text-slate-400 hover:text-danger-500 transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                        <div className="mb-3">
                                            <textarea value={q.text} onChange={e => updateManualQuestion(qIdx, 'text', e.target.value)} placeholder="Type your question here..." className="input-field" rows={2} />
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                                            {q.options.map((opt, oIdx) => (
                                                <div key={oIdx} className="flex items-center gap-2">
                                                    <button type="button" onClick={() => updateManualQuestion(qIdx, 'correctAnswer', q.options[oIdx])}
                                                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${q.correctAnswer === opt && opt ? 'border-success-500 bg-success-500 text-white' : 'border-slate-300 hover:border-primary-400'}`}>
                                                        {q.correctAnswer === opt && opt && <CheckCircle2 className="w-4 h-4" />}
                                                    </button>
                                                    <input type="text" value={opt} onChange={e => updateManualOption(qIdx, oIdx, e.target.value)} placeholder={`Option ${String.fromCharCode(65 + oIdx)}`} className="input-field flex-1 text-sm" />
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-[10px] text-slate-400 mb-2">Click the circle to mark the correct answer</p>
                                        <input type="text" value={q.explanation} onChange={e => updateManualQuestion(qIdx, 'explanation', e.target.value)} placeholder="Explanation (optional)" className="input-field text-sm" />
                                    </div>
                                ))}

                                <button onClick={addManualQuestion} className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-sm text-slate-500 hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50 transition-all flex items-center justify-center gap-2 font-semibold">
                                    <PlusCircle className="w-4 h-4" /> Add Question
                                </button>
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-100 flex gap-3 sticky bottom-0 bg-white rounded-b-3xl">
                            <button onClick={() => setShowManualModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-semibold text-sm hover:bg-slate-200">Cancel</button>
                            <button onClick={handlePublishManual} disabled={!manualTitle || !manualSubjectId || manualQuestions.length === 0 || publishMutation.isPending}
                                className="flex-1 py-3 bg-success-500 text-white rounded-xl font-semibold text-sm hover:bg-success-600 shadow-md flex items-center justify-center gap-2 disabled:opacity-50">
                                {publishMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Publish Quiz</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* AI MODAL */}
            {showAIModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">{aiMode === 'pdf' ? '📄 Generate from PDF' : '✨ Generate with AI'}</h2>
                                <p className="text-sm text-slate-500 mt-1">{aiMode === 'pdf' ? 'Upload a PDF and AI will create quiz questions' : 'AI creates quiz aligned with Ghana curriculum'}</p>
                            </div>
                            <button onClick={() => !isGenerating && setShowAIModal(false)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400" disabled={isGenerating}><X className="w-5 h-5" /></button>
                        </div>

                        <div className="flex gap-2 mb-6 p-1 bg-slate-100 rounded-xl">
                            <button onClick={() => setAiMode('text')} className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${aiMode === 'text' ? 'bg-white shadow-sm text-purple-600' : 'text-slate-500'}`}><Sparkles className="w-4 h-4 inline mr-1" /> By Topic</button>
                            <button onClick={() => setAiMode('pdf')} className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${aiMode === 'pdf' ? 'bg-white shadow-sm text-amber-600' : 'text-slate-500'}`}><FileUp className="w-4 h-4 inline mr-1" /> From PDF</button>
                        </div>

                        <div className="space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-semibold text-slate-700 mb-2">Subject</label>
                                    <select value={aiForm.subject} onChange={e => setAiForm({ ...aiForm, subject: e.target.value })} className="input-field" disabled={isGenerating}>
                                        {['Computing', 'Mathematics', 'Integrated Science', 'English Language', 'Social Studies', 'French', 'Ghanaian Language', 'Creative Arts', 'Religious & Moral Education'].map(s => <option key={s} value={s}>{s}</option>)}
                                    </select></div>
                                <div><label className="block text-sm font-semibold text-slate-700 mb-2">Class Level</label>
                                    <select value={aiForm.classLevel} onChange={e => setAiForm({ ...aiForm, classLevel: e.target.value })} className="input-field" disabled={isGenerating}>
                                        {['Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6', 'JHS 1', 'JHS 2', 'JHS 3'].map(c => <option key={c} value={c}>{c}</option>)}
                                    </select></div>
                            </div>
                            {aiMode === 'text' ? (
                                <div><label className="block text-sm font-semibold text-slate-700 mb-2">Topic / Lesson Content</label>
                                    <textarea placeholder="e.g. Parts of a Computer, Solar System..." value={aiForm.lesson} onChange={e => setAiForm({ ...aiForm, lesson: e.target.value })} className="input-field h-28 resize-none" disabled={isGenerating} /></div>
                            ) : (
                                <div><label className="block text-sm font-semibold text-slate-700 mb-2">Upload PDF Document</label>
                                    <div className={`border-2 border-dashed rounded-2xl p-6 text-center transition-colors ${pdfFile ? 'border-amber-300 bg-amber-50' : 'border-slate-200 hover:border-purple-300 bg-slate-50'}`}>
                                        {pdfFile ? (
                                            <div className="flex items-center justify-center gap-3">
                                                <BookOpen className="w-8 h-8 text-amber-500" />
                                                <div className="text-left"><p className="font-semibold text-slate-800 text-sm">{pdfFile.name}</p><p className="text-xs text-slate-400">{(pdfFile.size / 1024).toFixed(1)} KB</p></div>
                                                <button onClick={() => setPdfFile(null)} className="p-1 rounded-lg hover:bg-amber-100"><X className="w-4 h-4 text-slate-400" /></button>
                                            </div>
                                        ) : (
                                            <label className="cursor-pointer"><FileUp className="w-10 h-10 text-slate-300 mx-auto mb-2" /><p className="text-sm font-semibold text-slate-600">Click to upload PDF</p>
                                                <input type="file" accept=".pdf" className="hidden" onChange={e => { if (e.target.files?.[0]) setPdfFile(e.target.files[0]) }} disabled={isGenerating} /></label>
                                        )}
                                    </div></div>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-semibold text-slate-700 mb-2">Questions</label>
                                    <input type="number" min={1} max={30} value={aiForm.numberOfQuestions} onChange={e => setAiForm({ ...aiForm, numberOfQuestions: parseInt(e.target.value) })} className="input-field" disabled={isGenerating} /></div>
                                <div><label className="block text-sm font-semibold text-slate-700 mb-2">Difficulty</label>
                                    <select value={aiForm.difficulty} onChange={e => setAiForm({ ...aiForm, difficulty: e.target.value })} className="input-field" disabled={isGenerating}>
                                        <option value="Easy">Easy</option><option value="Medium">Medium</option><option value="Hard">Hard</option></select></div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 mt-8 pt-6 border-t border-slate-100">
                            <button onClick={() => setShowAIModal(false)} className="flex-1 py-3 rounded-xl font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200" disabled={isGenerating}>Cancel</button>
                            <button onClick={aiMode === 'pdf' ? handleGenerateFromPDF : handleGenerateAI}
                                className={`flex-1 py-3 rounded-xl font-semibold text-white shadow-md flex justify-center items-center disabled:opacity-50 ${aiMode === 'pdf' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-purple-500 hover:bg-purple-600'}`}
                                disabled={isGenerating || (aiMode === 'text' && !aiForm.lesson) || (aiMode === 'pdf' && !pdfFile)}>
                                {isGenerating ? <><Loader2 className="w-5 h-5 animate-spin mr-2" />Generating...</> : aiMode === 'pdf' ? <><FileUp className="w-5 h-5 mr-2" />Generate from PDF</> : <><Sparkles className="w-5 h-5 mr-2" />Generate Quiz</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

