import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Trophy, Clock, Loader2, CheckCircle2, XCircle, ChevronRight } from 'lucide-react'

export default function StudentQuizzes({ user }: { user: any }) {
    const queryClient = useQueryClient()
    const [activeQuiz, setActiveQuiz] = useState<any>(null)
    const [answers, setAnswers] = useState<Record<string, string>>({})
    const [submitted, setSubmitted] = useState(false)
    const [result, setResult] = useState<{ score: number; maxScore: number } | null>(null)

    const { data: quizzes = [], isLoading } = useQuery({
        queryKey: ['student-quizzes'],
        queryFn: async () => {
            const res = await fetch('/api/quizzes')
            if (!res.ok) throw new Error()
            return res.json()
        }
    })

    // Fetch quiz detail when taking
    const { data: quizDetail } = useQuery({
        queryKey: ['quiz-detail', activeQuiz?.id],
        queryFn: async () => {
            const res = await fetch(`/api/quizzes/${activeQuiz.id}`)
            if (!res.ok) throw new Error()
            return res.json()
        },
        enabled: !!activeQuiz?.id
    })

    // Fetch attempts
    const { data: attempts = [] } = useQuery({
        queryKey: ['my-quiz-attempts', user.id],
        queryFn: async () => {
            const res = await fetch(`/api/quizzes/student/${user.id}/attempts`)
            if (!res.ok) return []
            return res.json()
        },
        enabled: !!user?.id
    })

    const submitMutation = useMutation({
        mutationFn: async ({ quizId, score, maxScore }: { quizId: string; score: number; maxScore: number }) => {
            const res = await fetch('/api/quizzes/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quizId, studentId: user.id, score, maxScore })
            })
            if (!res.ok) throw new Error()
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-quiz-attempts'] })
        }
    })

    const handleSubmitQuiz = () => {
        if (!quizDetail) return
        let score = 0
        const maxScore = quizDetail.questions.length
        quizDetail.questions.forEach((q: any) => {
            if (answers[q.id] === q.correctAnswer) score++
        })
        setResult({ score, maxScore })
        setSubmitted(true)
        submitMutation.mutate({ quizId: activeQuiz.id, score, maxScore })
    }

    const hasAttempted = (quizId: string) => {
        return attempts.some((a: any) => a.quizId === quizId)
    }

    const getAttempt = (quizId: string) => {
        return attempts.find((a: any) => a.quizId === quizId)
    }

    // Quiz Taking View
    if (activeQuiz && quizDetail) {
        return (
            <div className="p-4 lg:p-6 text-slate-700 animate-fade-in">
                <button onClick={() => { setActiveQuiz(null); setAnswers({}); setSubmitted(false); setResult(null) }}
                    className="text-sm text-primary-500 hover:text-primary-600 font-semibold mb-4 flex items-center gap-1">
                    ← Back to Quizzes
                </button>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-5 bg-gradient-to-r from-primary-500 to-primary-600 text-white">
                        <h2 className="text-lg font-bold">{quizDetail.title}</h2>
                        <p className="text-primary-100 text-sm mt-1">{quizDetail.subject?.name} • {quizDetail.questions.length} Questions • {quizDetail.duration}m</p>
                    </div>

                    {submitted && result ? (
                        <div className="p-8 text-center">
                            <div className={`w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center ${result.score / result.maxScore >= 0.7 ? 'bg-success-100' : result.score / result.maxScore >= 0.5 ? 'bg-warning-100' : 'bg-danger-100'}`}>
                                <span className={`text-3xl font-bold ${result.score / result.maxScore >= 0.7 ? 'text-success-600' : result.score / result.maxScore >= 0.5 ? 'text-warning-600' : 'text-danger-600'}`}>
                                    {Math.round((result.score / result.maxScore) * 100)}%
                                </span>
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">
                                {result.score / result.maxScore >= 0.7 ? '🎉 Excellent!' : result.score / result.maxScore >= 0.5 ? '👍 Good Try!' : '📚 Keep Learning!'}
                            </h3>
                            <p className="text-slate-500 mb-6">You scored {result.score} out of {result.maxScore}</p>

                            {/* Show answers review */}
                            <div className="text-left space-y-4 max-w-2xl mx-auto">
                                {quizDetail.questions.map((q: any, i: number) => {
                                    const isCorrect = answers[q.id] === q.correctAnswer
                                    return (
                                        <div key={q.id} className={`p-4 rounded-xl border ${isCorrect ? 'bg-success-50 border-success-200' : 'bg-danger-50 border-danger-200'}`}>
                                            <div className="flex items-start gap-2 mb-2">
                                                {isCorrect ? <CheckCircle2 className="w-5 h-5 text-success-500 shrink-0 mt-0.5" /> : <XCircle className="w-5 h-5 text-danger-500 shrink-0 mt-0.5" />}
                                                <p className="font-semibold text-slate-800 text-sm">{i + 1}. {q.text}</p>
                                            </div>
                                            {!isCorrect && <p className="text-xs text-danger-600 ml-7">Your answer: {answers[q.id] || 'Not answered'}</p>}
                                            <p className="text-xs text-success-600 ml-7 font-semibold">Correct: {q.correctAnswer}</p>
                                            {q.explanation && <p className="text-xs text-slate-500 ml-7 mt-1 italic">💡 {q.explanation}</p>}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ) : (
                        <div>
                            <div className="divide-y divide-slate-50">
                                {quizDetail.questions.map((q: any, i: number) => (
                                    <div key={q.id} className="p-5">
                                        <p className="font-semibold text-slate-800 mb-3 text-sm">
                                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-primary-100 text-primary-600 text-xs font-bold mr-2">{i + 1}</span>
                                            {q.text}
                                        </p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 ml-8">
                                            {(q.options || []).map((opt: string, j: number) => (
                                                <button key={j} onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt }))}
                                                    className={`text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${answers[q.id] === opt ? 'bg-primary-500 text-white border-primary-500 shadow-md' : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-primary-300'}`}>
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="p-5 border-t border-slate-100 bg-slate-50">
                                <button onClick={handleSubmitQuiz}
                                    disabled={Object.keys(answers).length < quizDetail.questions.length}
                                    className="w-full py-3 bg-primary-500 text-white font-bold rounded-xl hover:bg-primary-600 shadow-md transition-all disabled:opacity-50 text-sm flex items-center justify-center gap-2">
                                    <CheckCircle2 className="w-4 h-4" /> Submit Quiz ({Object.keys(answers).length}/{quizDetail.questions.length} answered)
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    // Quiz List View
    if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>

    const publishedQuizzes = quizzes.filter((q: any) => q.status === 'published')

    return (
        <div className="p-4 lg:p-6 text-slate-700 animate-fade-in">
            <h1 className="text-2xl font-bold text-slate-800 mb-1">Quizzes</h1>
            <p className="text-sm text-slate-500 mb-8">Take quizzes assigned by your teachers</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {publishedQuizzes.length === 0 && (
                    <div className="col-span-full p-12 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                        <Trophy className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <h2 className="text-lg font-semibold text-slate-700">No Quizzes Available</h2>
                        <p className="text-sm text-slate-500">Check back later for new quizzes from your teachers</p>
                    </div>
                )}
                {publishedQuizzes.map((quiz: any) => {
                    const attempted = hasAttempted(quiz.id)
                    const attempt = getAttempt(quiz.id)

                    return (
                        <div key={quiz.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-all flex flex-col">
                            <div className="flex items-start justify-between mb-3">
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${quiz.subject?.color || 'from-primary-400 to-primary-600'} flex items-center justify-center shadow-md`}>
                                    <Trophy className="w-6 h-6 text-white" />
                                </div>
                                {attempted && (
                                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${attempt.score / attempt.maxScore >= 0.7 ? 'bg-success-100 text-success-700' : attempt.score / attempt.maxScore >= 0.5 ? 'bg-warning-100 text-warning-700' : 'bg-danger-100 text-danger-700'}`}>
                                        {Math.round((attempt.score / attempt.maxScore) * 100)}%
                                    </span>
                                )}
                            </div>

                            <h3 className="text-lg font-bold text-slate-800 mb-1">{quiz.title}</h3>
                            <p className="text-sm text-slate-400 mb-4">{quiz.subject?.name}</p>

                            <div className="flex items-center gap-4 text-xs text-slate-500 font-medium mb-5 mt-auto pt-4 border-t border-slate-100">
                                <span className="flex items-center gap-1"><Trophy className="w-3.5 h-3.5" />{quiz._count?.questions || quiz.questions?.length || 0} Qs</span>
                                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{quiz.duration}m</span>
                            </div>

                            <button onClick={() => { setActiveQuiz(quiz); setAnswers({}); setSubmitted(false); setResult(null) }}
                                className={`w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${attempted ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-primary-500 text-white hover:bg-primary-600 shadow-md'}`}>
                                {attempted ? 'Retake Quiz' : 'Start Quiz'} <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
