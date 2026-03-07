import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, Send, ArrowLeft, Smile, Search } from 'lucide-react'

const EMOJI_LIST = ['😀', '😂', '😍', '🥰', '😎', '🤔', '👍', '👏', '🙏', '❤️', '🔥', '🎉', '✅', '📚', '✏️', '💡', '⭐', '🏆', '💪', '🤝', '👋', '😊', '🙌', '💯', '📝', '📖', '🎓', '🌟', '💬', '👀']

export default function Messages({ user }: { user: any }) {
    const [selectedContact, setSelectedContact] = useState<any>(null)
    const [newMessage, setNewMessage] = useState('')
    const [showEmoji, setShowEmoji] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [showContacts, setShowContacts] = useState(true)
    const queryClient = useQueryClient()
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const emojiRef = useRef<HTMLDivElement>(null)

    const { data: contacts, isLoading: loadingContacts } = useQuery({
        queryKey: ['contacts', user.id],
        queryFn: async () => {
            const res = await fetch(`/api/users/contacts/${user.id}`)
            if (!res.ok) throw new Error('Failed to fetch contacts')
            return res.json()
        }
    })

    const { data: messages, isLoading: loadingMessages } = useQuery({
        queryKey: ['messages', user.id, selectedContact?.id],
        queryFn: async () => {
            if (!selectedContact) return []
            const res = await fetch(`/api/messages/${user.id}/${selectedContact.id}`)
            if (!res.ok) throw new Error('Failed to fetch messages')
            return res.json()
        },
        enabled: !!selectedContact,
        refetchInterval: 3000
    })

    const sendMessageMutation = useMutation({
        mutationFn: async (content: string) => {
            const res = await fetch(`/api/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ senderId: user.id, receiverId: selectedContact.id, content })
            })
            if (!res.ok) throw new Error('Failed to send message')
            return res.json()
        },
        onSuccess: () => {
            setNewMessage('')
            queryClient.invalidateQueries({ queryKey: ['messages', user.id, selectedContact?.id] })
        }
    })

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) setShowEmoji(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    // Heartbeat — update lastSeen every 30 seconds
    useEffect(() => {
        const ping = () => fetch(`/api/users/${user.id}/heartbeat`, { method: 'PATCH' }).catch(() => { })
        ping()
        const interval = setInterval(ping, 30000)
        return () => clearInterval(interval)
    }, [user.id])

    const getLastSeen = (lastSeen: string | null) => {
        if (!lastSeen) return 'Offline'
        const diff = Date.now() - new Date(lastSeen).getTime()
        const mins = Math.floor(diff / 60000)
        if (mins < 2) return 'Online'
        if (mins < 60) return `${mins} min ago`
        const hours = Math.floor(mins / 60)
        if (hours < 24) return `${hours}h ago`
        return new Date(lastSeen).toLocaleDateString()
    }

    const isOnline = (lastSeen: string | null) => {
        if (!lastSeen) return false
        return (Date.now() - new Date(lastSeen).getTime()) < 120000
    }

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim() || !selectedContact) return
        sendMessageMutation.mutate(newMessage.trim())
        setShowEmoji(false)
    }

    const handleSelectContact = (contact: any) => {
        setSelectedContact(contact)
        setShowContacts(false)
    }

    const filteredContacts = (contacts || []).filter((c: any) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Group contacts by role
    const grouped: Record<string, any[]> = {}
    filteredContacts.forEach((c: any) => {
        const role = c.role.toLowerCase()
        if (!grouped[role]) grouped[role] = []
        grouped[role].push(c)
    })

    const roleOrder = ['admin', 'teacher', 'student']
    const roleLabels: Record<string, string> = { admin: '🛡️ Admin', teacher: '👨‍🏫 Teachers', student: '👩‍🎓 Classmates' }

    return (
        <div className="h-[calc(100vh-120px)] flex bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-fade-in mt-2 lg:mt-6 mx-2 lg:mx-6">
            {/* Contacts Sidebar */}
            <div className={`${showContacts ? 'flex' : 'hidden'} lg:flex w-full lg:w-[320px] border-r border-slate-100 flex-col bg-slate-50 h-full`}>
                <div className="p-4 border-b border-slate-200 bg-white">
                    <h2 className="text-xl font-bold text-slate-800 mb-3">Messages</h2>
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Search contacts..."
                            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-primary-300 text-sm"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {loadingContacts ? (
                        <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-primary-500" /></div>
                    ) : (
                        roleOrder.map(role => {
                            const list = grouped[role]
                            if (!list || list.length === 0) return null
                            return (
                                <div key={role}>
                                    <p className="px-4 pt-4 pb-1 text-xs font-bold text-slate-400 uppercase tracking-wider">{roleLabels[role] || role}</p>
                                    {list.map((contact: any) => (
                                        <button
                                            key={contact.id}
                                            onClick={() => handleSelectContact(contact)}
                                            className={`w-full p-3.5 px-4 flex items-center gap-3 text-left transition-colors border-b border-slate-100/60
                                            ${selectedContact?.id === contact.id ? 'bg-primary-50 border-l-4 border-l-primary-500' : 'hover:bg-slate-100/80'}`}
                                        >
                                            <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden relative">
                                                {contact.avatar ? <img src={contact.avatar} className="w-full h-full object-cover" /> : contact.name.charAt(0)}
                                                {isOnline(contact.lastSeen) && <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white" />}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-semibold text-slate-800 text-sm truncate">{contact.name}</p>
                                                <p className="text-[10px] text-slate-400 font-medium">{getLastSeen(contact.lastSeen)}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )
                        })
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className={`${!showContacts || selectedContact ? 'flex' : 'hidden'} lg:flex flex-1 flex-col bg-white h-full`}>
                {selectedContact ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-white">
                            <button onClick={() => { setShowContacts(true); setSelectedContact(null) }} className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100">
                                <ArrowLeft className="w-5 h-5 text-slate-600" />
                            </button>
                            <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden relative">
                                {selectedContact.avatar ? <img src={selectedContact.avatar} className="w-full h-full object-cover" /> : selectedContact.name.charAt(0)}
                                {isOnline(selectedContact.lastSeen) && <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white" />}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800">{selectedContact.name}</h3>
                                <p className={`text-xs ${isOnline(selectedContact.lastSeen) ? 'text-emerald-500 font-semibold' : 'text-slate-400'}`}>{getLastSeen(selectedContact.lastSeen)}</p>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F8FAFC]">
                            {loadingMessages ? (
                                <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-primary-500" /></div>
                            ) : messages?.length === 0 ? (
                                <div className="text-center py-12 text-slate-400 text-sm">
                                    <p className="text-4xl mb-3">👋</p>
                                    <p>Say hello! Start a conversation.</p>
                                </div>
                            ) : (
                                messages?.map((msg: any) => {
                                    const isMe = msg.senderId === user.id
                                    return (
                                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[80%] sm:max-w-[70%] px-4 py-2.5 rounded-2xl shadow-sm ${isMe
                                                ? 'bg-primary-500 text-white rounded-br-md'
                                                : 'bg-white text-slate-700 border border-slate-100 rounded-bl-md'
                                                }`}>
                                                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                                                <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-white/60' : 'text-slate-400'}`}>
                                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Message Input */}
                        <form onSubmit={handleSend} className="p-3 sm:p-4 border-t border-slate-100 bg-white flex gap-2 items-end relative">
                            {/* Emoji Picker */}
                            {showEmoji && (
                                <div ref={emojiRef} className="absolute bottom-16 left-3 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 w-72 z-50 animate-scale-in">
                                    <p className="text-xs font-bold text-slate-400 mb-2 uppercase">Pick an emoji</p>
                                    <div className="grid grid-cols-10 gap-1">
                                        {EMOJI_LIST.map(emoji => (
                                            <button key={emoji} type="button" onClick={() => { setNewMessage(prev => prev + emoji); setShowEmoji(false) }}
                                                className="text-xl hover:scale-125 transition-transform p-0.5 rounded hover:bg-slate-100">
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <button type="button" onClick={() => setShowEmoji(!showEmoji)}
                                className="p-2.5 rounded-xl hover:bg-slate-100 transition-colors shrink-0 text-slate-400 hover:text-warning-500">
                                <Smile className="w-5 h-5" />
                            </button>
                            <input
                                type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)}
                                placeholder="Type a message..."
                                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-300 bg-slate-50 text-sm"
                            />
                            <button type="submit" disabled={!newMessage.trim() || sendMessageMutation.isPending}
                                className="p-2.5 bg-primary-500 text-white rounded-xl hover:bg-primary-600 disabled:opacity-50 transition-colors shrink-0 shadow-sm">
                                {sendMessageMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center flex-col text-slate-400 p-8">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                            <Send className="w-10 h-10 text-slate-300" />
                        </div>
                        <p className="font-semibold text-slate-600 text-lg mb-1">Your Messages</p>
                        <p className="text-sm">Select a contact to start messaging</p>
                    </div>
                )}
            </div>
        </div>
    )
}
