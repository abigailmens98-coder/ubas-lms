import { useState } from 'react'
import { Plus, Trophy, Sparkles, X, Clock, Users, Loader2, Download } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

const statusStyles: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-500',
    published: 'bg-success-100 text-success-700',
    closed: 'bg-danger-100 text-danger-700',
}

export default function TeacherQuizzes() {
    const user = JSON.parse(localStorage.getItem('ubas_user') || '{}')
    const [showAIModal, setShowAIModal] = useState(false)
    const [isGenerating, setIsGenerating] = useState(false)
    const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([])

    const [aiForm, setAiForm] = useState({
        subject: 'Computing',
        lesson: '',
        questionTypes: { multipleChoice: true, trueFalse: false, shortAnswer: false },
        numberOfQuestions: 5,
        difficulty: 'Medium',
    })

    const { data: quizzes = [], isLoading } = useQuery({
        queryKey: ['teacher-quizzes', user.id],
        queryFn: async () => {
            const res = await fetch(`http://localhost:3001/api/quizzes/teacher/${user.id}`)
            if (!res.ok) throw new Error('Failed to fetch quizzes')
            return res.json()
        },
        enabled: !!user?.id
    })

    const handleGenerateAI = async () => {
        setIsGenerating(true)
        try {
            const res = await fetch('http://localhost:3001/api/ai/generate-quiz', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subject: aiForm.subject,
                    lesson: aiForm.lesson,
                    difficulty: aiForm.difficulty,
                    count: aiForm.numberOfQuestions,
                    types: aiForm.questionTypes
                })
            })

            if (!res.ok) throw new Error('AI Generation failed')
            const data = await res.json()
            setGeneratedQuestions(data.questions)
            alert(`AI successfully generated ${data.questions.length} questions! You can now review them.`)
            setShowAIModal(false)
        } catch (err) {
            console.error(err)
            alert('AI Generation failed. Check your API key in .env')
        } finally {
            setIsGenerating(false)
        }
    }

    const downloadPDF = (quiz: any) => {
        const doc = new jsPDF()

        doc.setFontSize(20)
        doc.text(`Broadsheet - ${quiz.title}`, 14, 22)

        doc.setFontSize(11)
        doc.text(`Subject: ${quiz.subject.name}`, 14, 30)
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 36)

        const tableColumn = ["Student Name", "Score", "Max Score", "Percentage", "Date Completed"]
        const tableRows: any[] = []

        quiz.attempts.forEach((attempt: any) => {
            const percentage = Math.round((attempt.score / attempt.maxScore) * 100) + "%"
            const attemptData = [
                attempt.student?.name || 'Unknown',
                attempt.score,
                attempt.maxScore,
                percentage,
                new Date(attempt.completedAt).toLocaleDateString()
            ]
            tableRows.push(attemptData)
        })

        // @ts-ignore
        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 42,
            styles: { fontSize: 10, cellPadding: 3 },
            headStyles: { fillColor: [59, 130, 246] }
        })

        doc.save(`${quiz.title.replace(/\s+/g, '_')}_Broadsheet.pdf`)
    }

    return (
        <div className="animate-fade-in text-slate-700 p-6">
            <div className="flex items-start justify-between mb-8">
                <div className="page-header mb-0">
                    <h1 className="text-2xl font-bold text-slate-800">Quizzes</h1>
                    <p className="text-slate-500">Create and manage quizzes</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => setShowAIModal(true)} className="px-4 py-2 bg-purple-500 text-white rounded-xl shadow-sm hover:bg-purple-600 transition-colors flex items-center gap-2 font-medium">
                        <Sparkles className="w-4 h-4" />
                        Generate AI
                    </button>
                    <button className="px-4 py-2 bg-success-500 text-white rounded-xl shadow-sm hover:bg-success-600 transition-colors flex items-center gap-2 font-medium">
                        <Plus className="w-4 h-4" />
                        New Quiz
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {quizzes.length === 0 && (
                        <div className="col-span-full py-12 text-center text-slate-500 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                            No quizzes found. Create one or generate with AI.
                        </div>
                    )}
                    {quizzes.map((quiz: any, index: number) => (
                        <div key={quiz.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 group hover:shadow-md transition-all duration-300">
                            <div className="flex items-start justify-between mb-3">
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${quiz.subject?.color || 'from-primary-400 to-primary-600'} flex items-center justify-center shadow-md`}>
                                    <Trophy className="w-6 h-6 text-white" />
                                </div>
                                <span className={`px-2 py-1 rounded-md text-xs font-semibold ${statusStyles[quiz.status] || 'bg-slate-100 text-slate-600'}`}>
                                    {quiz.status}
                                </span>
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
                                    <Download className="w-4 h-4 text-primary-500" />
                                    Download Broadsheet
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {showAIModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Generate Quiz with AI</h2>
                                <p className="text-sm text-slate-500 mt-1">Let AI create a quiz based on your topic</p>
                            </div>
                            <button onClick={() => !isGenerating && setShowAIModal(false)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors" disabled={isGenerating}>
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Subject</label>
                                <select value={aiForm.subject} onChange={(e) => setAiForm({ ...aiForm, subject: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-slate-50" disabled={isGenerating}>
                                    <option value="Computing">Computing</option>
                                    <option value="Mathematics">Mathematics</option>
                                    <option value="Integrated Science">Integrated Science</option>
                                    <option value="English Language">English Language</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Topic / Lesson Content</label>
                                <textarea placeholder="e.g. Parts of a Computer, Solar System, etc." value={aiForm.lesson} onChange={(e) => setAiForm({ ...aiForm, lesson: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-slate-50 h-28 resize-none" disabled={isGenerating} />
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Questions count</label>
                                    <input type="number" value={aiForm.numberOfQuestions} onChange={(e) => setAiForm({ ...aiForm, numberOfQuestions: parseInt(e.target.value) })} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-slate-50" disabled={isGenerating} />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Difficulty</label>
                                    <select value={aiForm.difficulty} onChange={(e) => setAiForm({ ...aiForm, difficulty: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-slate-50" disabled={isGenerating}>
                                        <option value="Easy">Easy (Beginner)</option>
                                        <option value="Medium">Medium (Intermediate)</option>
                                        <option value="Hard">Hard (Advanced)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 mt-10 pt-6 border-t border-slate-100">
                            <button onClick={() => setShowAIModal(false)} className="flex-1 py-3 px-4 rounded-xl font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors" disabled={isGenerating}>Cancel</button>
                            <button onClick={handleGenerateAI} className="flex-1 py-3 px-4 rounded-xl font-semibold text-white bg-purple-500 hover:bg-purple-600 shadow-md transition-colors flex justify-center items-center disabled:opacity-50" disabled={isGenerating || !aiForm.lesson}>
                                {isGenerating ? <><Loader2 className="w-5 h-5 animate-spin mr-2" />Generating...</> : <><Sparkles className="w-5 h-5 mr-2" />Generate Quiz</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
