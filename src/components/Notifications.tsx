import { useState } from 'react'
import { Bell, Check, Trash } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export default function Notifications({ userId }: { userId: string }) {
    const [isOpen, setIsOpen] = useState(false)
    const queryClient = useQueryClient()

    const { data: notifications = [] } = useQuery({
        queryKey: ['notifications', userId],
        queryFn: async () => {
            const res = await fetch(`/api/notifications/${userId}`)
            if (!res.ok) throw new Error()
            return res.json()
        },
        refetchInterval: 10000 // poll every 10s
    })

    const unreadCount = notifications.filter((n: any) => !n.read).length

    const readMutation = useMutation({
        mutationFn: async () => {
            await fetch(`/api/notifications/${userId}/read`, { method: 'PATCH' })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications', userId] })
        }
    })

    const handleOpen = () => {
        setIsOpen(!isOpen)
        if (!isOpen && unreadCount > 0) readMutation.mutate()
    }

    return (
        <div className="relative z-50">
            <button
                onClick={handleOpen}
                className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-primary-600 hover:border-primary-200 transition-all shadow-sm relative"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <div className="absolute top-1.5 right-1.5 w-3 h-3 bg-danger-500 rounded-full border-2 border-white animate-pulse" />
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-50 transform origin-top-right animate-scale-in">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <h3 className="font-bold text-slate-800">Notifications</h3>
                        <span className="bg-primary-100 text-primary-700 font-bold text-xs px-2 py-0.5 rounded-full">{unreadCount} New</span>
                    </div>

                    <div className="max-h-[350px] overflow-y-auto w-full p-2 space-y-1">
                        {notifications.length === 0 ? (
                            <div className="p-6 text-center text-slate-400">
                                <Bell className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                                <p className="text-sm font-medium">No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map((n: any) => (
                                <div key={n.id} className={`p-4 rounded-2xl flex items-start gap-3 transition-colors ${!n.read ? 'bg-primary-50/50' : 'hover:bg-slate-50'}`}>
                                    <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${!n.read ? 'bg-primary-500' : 'bg-transparent'}`} />
                                    <div>
                                        <p className="font-bold text-slate-800 text-sm mb-0.5">{n.title}</p>
                                        <p className="text-slate-500 text-xs leading-relaxed">{n.message}</p>
                                        <p className="text-[10px] text-slate-400 mt-2 font-medium tracking-wider">
                                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
