import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Video, Clock, Loader2, Calendar, Play } from 'lucide-react'
import VideoRoom from '../../components/VideoRoom'

export default function StudentLiveClasses({ user }: { user: any }) {
    const [currentTime, setCurrentTime] = useState(new Date())
    const [activeRoom, setActiveRoom] = useState<string | null>(null)

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    const { data: classes = [], isLoading } = useQuery({
        queryKey: ['live-classes', 'student', user.id],
        queryFn: async () => {
            const res = await fetch(`/api/live-classes?role=student&userId=${user.id}`)
            if (!res.ok) throw new Error('Failed to fetch classes')
            return res.json()
        }
    })

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
            <h1 className="text-2xl font-bold mb-1 text-slate-800">Live Classes</h1>
            <p className="text-slate-500 text-sm mb-8">Join your upcoming scheduled sessions</p>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {classes.length === 0 && (
                    <div className="col-span-full p-12 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50">
                        <Video className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <h2 className="text-lg font-semibold text-slate-700">No Upcoming Classes</h2>
                        <p className="text-slate-500 text-sm">Enjoy your free time!</p>
                    </div>
                )}
                {classes.map((c: any) => {
                    const startTime = new Date(c.startTime)
                    const isLive = currentTime >= startTime && currentTime <= new Date(startTime.getTime() + c.duration * 60000)
                    const isUpcoming = currentTime < startTime
                    const isInApp = isWebRTCRoom(c.joinUrl)

                    let timeRemaining = ''
                    if (isUpcoming) {
                        const diff = startTime.getTime() - currentTime.getTime()
                        const hours = Math.floor(diff / (1000 * 60 * 60))
                        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
                        const secs = Math.floor((diff % (1000 * 60)) / 1000)
                        timeRemaining = `${hours}h ${mins}m ${secs}s`
                    }

                    return (
                        <div key={c.id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col group hover:shadow-md transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`w-12 h-12 rounded-2xl flex justify-center items-center shadow-md bg-gradient-to-br ${c.subject?.color || 'from-primary-400 to-primary-600'}`}>
                                    <Video className="w-6 h-6 text-white" />
                                </div>
                                {isLive ? (
                                    <span className="flex items-center gap-1.5 px-3 py-1 bg-danger-50 text-danger-600 rounded-full text-xs font-bold uppercase tracking-wider animate-pulse">
                                        <div className="w-2 h-2 bg-danger-500 rounded-full" />
                                        Live Now
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold uppercase tracking-wider">
                                        Upcoming
                                    </span>
                                )}
                            </div>

                            <h3 className="text-lg font-bold text-slate-800 mb-1">{c.title}</h3>
                            <p className="text-sm font-medium text-slate-500 mb-6">{c.subject?.name} • {c.teacher?.name}</p>

                            <div className="space-y-3 mb-6">
                                <div className="flex items-center gap-3 text-sm text-slate-600">
                                    <Clock className="w-4 h-4" />
                                    <span className="font-semibold">{startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({c.duration}m)</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-slate-600">
                                    <Calendar className="w-4 h-4" />
                                    <span>{startTime.toLocaleDateString()}</span>
                                </div>
                            </div>

                            {isUpcoming && <div className="p-3 bg-slate-50 text-slate-600 text-center rounded-xl font-mono text-lg font-bold shadow-inner mb-6 tracking-wider">
                                {timeRemaining}
                            </div>}

                            <div className="mt-auto">
                                {isInApp ? (
                                    <button
                                        onClick={() => isLive && setActiveRoom(getRoomId(c.joinUrl))}
                                        className={`w-full py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm text-sm
                                            ${isLive ? 'bg-gradient-to-r from-success-500 to-success-600 text-white hover:shadow-lg' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                                        disabled={!isLive}
                                    >
                                        <Play className="w-4 h-4" /> {isLive ? 'Join Class' : 'Not Started Yet'}
                                    </button>
                                ) : (
                                    <a
                                        href={isLive ? c.joinUrl : undefined}
                                        target="_blank"
                                        rel="noreferrer"
                                        className={`w-full py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm text-sm
                                            ${isLive ? 'bg-primary-500 text-white hover:bg-primary-600' : 'bg-slate-100 text-slate-400 pointer-events-none'}`}
                                    >
                                        <Video className="w-4 h-4" /> {isLive ? 'Join External Link' : 'Not Started Yet'}
                                    </a>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
