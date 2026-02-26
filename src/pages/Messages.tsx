import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, Send } from 'lucide-react'

export default function Messages({ user }: { user: any }) {
    const [selectedContact, setSelectedContact] = useState<any>(null)
    const [newMessage, setNewMessage] = useState('')
    const queryClient = useQueryClient()
    const messagesEndRef = useRef<HTMLDivElement>(null)

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

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim() || !selectedContact) return
        sendMessageMutation.mutate(newMessage.trim())
    }

    return (
        <div className="h-[calc(100vh-120px)] flex bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-fade-in p-0 mt-6 mx-6">
            {/* Contacts Sidebar */}
            <div className="w-1/3 border-r border-slate-100 flex flex-col bg-slate-50 h-full">
                <div className="p-4 border-b border-slate-200 bg-white">
                    <h2 className="text-xl font-bold text-slate-800">Messages</h2>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {loadingContacts ? (
                        <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-primary-500" /></div>
                    ) : (
                        contacts?.map((contact: any) => (
                            <button
                                key={contact.id}
                                onClick={() => setSelectedContact(contact)}
                                className={`w-full p-4 flex items-center gap-3 text-left transition-colors border-b border-slate-100
                                ${selectedContact?.id === contact.id ? 'bg-primary-50 border-primary-100' : 'hover:bg-slate-100'}`}
                            >
                                <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold">
                                    {contact.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-800">{contact.name}</p>
                                    <p className="text-xs text-slate-500 uppercase">{contact.role}</p>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-white h-full">
                {selectedContact ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold">
                                {selectedContact.name.charAt(0)}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800">{selectedContact.name}</h3>
                                <p className="text-xs text-slate-500 uppercase">{selectedContact.role}</p>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {loadingMessages ? (
                                <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-primary-500" /></div>
                            ) : (
                                messages?.map((msg: any) => {
                                    const isMe = msg.senderId === user.id
                                    return (
                                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[70%] p-3 rounded-2xl ${isMe ? 'bg-primary-500 text-white rounded-tr-none' : 'bg-slate-100 text-slate-700 rounded-tl-none'
                                                }`}>
                                                <p>{msg.content}</p>
                                                <p className="text-[10px] opacity-70 mt-1 text-right">
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
                        <form onSubmit={handleSend} className="p-4 border-t border-slate-100 bg-slate-50 flex gap-2">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type a message..."
                                className="flex-1 px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                            />
                            <button
                                type="submit"
                                disabled={!newMessage.trim() || sendMessageMutation.isPending}
                                className="p-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 disabled:opacity-50 transition-colors"
                            >
                                {sendMessageMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center flex-col text-slate-400">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                            <Send className="w-8 h-8 text-slate-300" />
                        </div>
                        <p>Select a contact to start messaging</p>
                    </div>
                )}
            </div>
        </div>
    )
}
