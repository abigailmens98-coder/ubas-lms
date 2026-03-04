import { useState, useRef, useEffect, useCallback } from 'react'
import { Video, VideoOff, Mic, MicOff, PhoneOff, Monitor, Users, MessageSquare, Send, X } from 'lucide-react'

interface VideoRoomProps {
    roomId: string
    userName: string
    onLeave: () => void
}

export default function VideoRoom({ roomId, userName, onLeave }: VideoRoomProps) {
    const [isCameraOn, setIsCameraOn] = useState(true)
    const [isMicOn, setIsMicOn] = useState(true)
    const [isScreenSharing, setIsScreenSharing] = useState(false)
    const [showChat, setShowChat] = useState(false)
    const [chatMessages, setChatMessages] = useState<{ sender: string; text: string; time: string }[]>([])
    const [chatInput, setChatInput] = useState('')
    const [participants, setParticipants] = useState<string[]>([userName])
    const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'failed'>('connecting')

    const localVideoRef = useRef<HTMLVideoElement>(null)
    const localStreamRef = useRef<MediaStream | null>(null)
    const screenStreamRef = useRef<MediaStream | null>(null)
    const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map())
    const dataChannelsRef = useRef<Map<string, RTCDataChannel>>(new Map())
    const remoteVideosRef = useRef<Map<string, HTMLVideoElement>>(new Map())
    const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map())

    // ICE servers configuration
    const iceConfig: RTCConfiguration = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
        ]
    }

    // Initialize local media
    const initLocalMedia = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 1280 }, height: { ideal: 720 } },
                audio: true
            })
            localStreamRef.current = stream
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream
            }
            setConnectionStatus('connected')
        } catch (err) {
            console.error('Failed to get media:', err)
            // Try audio only
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true })
                localStreamRef.current = stream
                setIsCameraOn(false)
                setConnectionStatus('connected')
            } catch {
                setConnectionStatus('failed')
            }
        }
    }, [])

    useEffect(() => {
        initLocalMedia()
        return () => {
            // Cleanup
            localStreamRef.current?.getTracks().forEach(t => t.stop())
            screenStreamRef.current?.getTracks().forEach(t => t.stop())
            peerConnectionsRef.current.forEach(pc => pc.close())
        }
    }, [initLocalMedia])

    // Toggle Camera
    const toggleCamera = () => {
        if (localStreamRef.current) {
            const videoTrack = localStreamRef.current.getVideoTracks()[0]
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled
                setIsCameraOn(videoTrack.enabled)
            }
        }
    }

    // Toggle Mic
    const toggleMic = () => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0]
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled
                setIsMicOn(audioTrack.enabled)
            }
        }
    }

    // Screen Share
    const toggleScreenShare = async () => {
        if (isScreenSharing) {
            screenStreamRef.current?.getTracks().forEach(t => t.stop())
            if (localVideoRef.current && localStreamRef.current) {
                localVideoRef.current.srcObject = localStreamRef.current
            }
            setIsScreenSharing(false)
        } else {
            try {
                const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true })
                screenStreamRef.current = screenStream
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = screenStream
                }
                screenStream.getVideoTracks()[0].onended = () => {
                    if (localVideoRef.current && localStreamRef.current) {
                        localVideoRef.current.srcObject = localStreamRef.current
                    }
                    setIsScreenSharing(false)
                }
                setIsScreenSharing(true)
            } catch (err) {
                console.error('Screen share failed:', err)
            }
        }
    }

    // Leave room
    const handleLeave = () => {
        localStreamRef.current?.getTracks().forEach(t => t.stop())
        screenStreamRef.current?.getTracks().forEach(t => t.stop())
        peerConnectionsRef.current.forEach(pc => pc.close())
        onLeave()
    }

    // Send chat message
    const sendChat = (e: React.FormEvent) => {
        e.preventDefault()
        if (!chatInput.trim()) return
        const msg = { sender: userName, text: chatInput.trim(), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
        setChatMessages(prev => [...prev, msg])
        // Broadcast to peers via data channels
        dataChannelsRef.current.forEach(dc => {
            if (dc.readyState === 'open') {
                dc.send(JSON.stringify(msg))
            }
        })
        setChatInput('')
    }

    const remoteStreamEntries = Array.from(remoteStreams.entries())

    return (
        <div className="fixed inset-0 bg-slate-900 z-50 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-slate-800/80 border-b border-slate-700/50">
                <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${connectionStatus === 'connected' ? 'bg-success-400 animate-pulse' : connectionStatus === 'connecting' ? 'bg-warning-400 animate-pulse' : 'bg-danger-400'}`} />
                    <span className="text-white font-semibold text-sm sm:text-base truncate max-w-[200px]">Live Class</span>
                    <span className="text-slate-400 text-xs hidden sm:inline">Room: {roomId.slice(0, 8)}...</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-slate-400 text-sm flex items-center gap-1.5">
                        <Users className="w-4 h-4" /> {participants.length + remoteStreamEntries.length}
                    </span>
                    <button onClick={() => setShowChat(!showChat)}
                        className={`p-2 rounded-lg transition-colors ${showChat ? 'bg-primary-500 text-white' : 'bg-slate-700 text-slate-300 hover:text-white'}`}>
                        <MessageSquare className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Video Grid */}
                <div className={`flex-1 p-3 sm:p-4 transition-all ${showChat ? 'pr-0' : ''}`}>
                    <div className={`grid gap-3 h-full ${remoteStreamEntries.length === 0 ? 'grid-cols-1' : remoteStreamEntries.length <= 1 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3'}`}>
                        {/* Local Video */}
                        <div className="relative rounded-2xl overflow-hidden bg-slate-800 border border-slate-700/50 shadow-lg">
                            <video
                                ref={localVideoRef}
                                autoPlay
                                playsInline
                                muted
                                className={`w-full h-full object-cover ${!isCameraOn ? 'hidden' : ''}`}
                            />
                            {!isCameraOn && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-800">
                                    <div className="w-20 h-20 rounded-full bg-primary-500/20 flex items-center justify-center">
                                        <span className="text-3xl font-bold text-primary-400">{userName.charAt(0)}</span>
                                    </div>
                                </div>
                            )}
                            <div className="absolute bottom-3 left-3 px-3 py-1.5 bg-slate-900/70 backdrop-blur-sm rounded-lg flex items-center gap-2">
                                <span className="text-white text-xs font-semibold">{userName} (You)</span>
                                {!isMicOn && <MicOff className="w-3 h-3 text-danger-400" />}
                            </div>
                            {isScreenSharing && (
                                <div className="absolute top-3 left-3 px-2 py-1 bg-success-500/90 rounded-lg">
                                    <span className="text-white text-[10px] font-bold uppercase">Sharing Screen</span>
                                </div>
                            )}
                        </div>

                        {/* Remote Videos */}
                        {remoteStreamEntries.map(([peerId, stream]) => (
                            <div key={peerId} className="relative rounded-2xl overflow-hidden bg-slate-800 border border-slate-700/50 shadow-lg">
                                <video
                                    autoPlay
                                    playsInline
                                    ref={el => { if (el) { el.srcObject = stream } }}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute bottom-3 left-3 px-3 py-1.5 bg-slate-900/70 backdrop-blur-sm rounded-lg">
                                    <span className="text-white text-xs font-semibold">Participant</span>
                                </div>
                            </div>
                        ))}

                        {/* Empty state for single user */}
                        {remoteStreamEntries.length === 0 && (
                            <div className="rounded-2xl overflow-hidden bg-slate-800/50 border-2 border-dashed border-slate-700 flex flex-col items-center justify-center text-slate-500 gap-3">
                                <div className="w-16 h-16 rounded-full bg-slate-700/50 flex items-center justify-center">
                                    <Users className="w-8 h-8 text-slate-500" />
                                </div>
                                <p className="text-sm font-medium">Waiting for others to join...</p>
                                <p className="text-xs text-slate-600">Share the room link with your students</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Chat Sidebar */}
                {showChat && (
                    <div className="w-80 bg-slate-800 border-l border-slate-700/50 flex flex-col animate-slide-in">
                        <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
                            <h3 className="text-white font-bold text-sm">Class Chat</h3>
                            <button onClick={() => setShowChat(false)} className="p-1 rounded hover:bg-slate-700 text-slate-400">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 space-y-2">
                            {chatMessages.length === 0 ? (
                                <p className="text-slate-500 text-xs text-center py-8">No messages yet. Start the conversation!</p>
                            ) : (
                                chatMessages.map((msg, i) => (
                                    <div key={i} className={`p-2.5 rounded-xl text-sm ${msg.sender === userName ? 'bg-primary-600/30 text-primary-200' : 'bg-slate-700/50 text-slate-300'}`}>
                                        <p className="font-semibold text-xs text-slate-400 mb-0.5">{msg.sender} · {msg.time}</p>
                                        <p>{msg.text}</p>
                                    </div>
                                ))
                            )}
                        </div>
                        <form onSubmit={sendChat} className="p-3 border-t border-slate-700/50 flex gap-2">
                            <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Message..." className="flex-1 px-3 py-2 rounded-lg bg-slate-700 text-white text-sm outline-none border border-slate-600 focus:border-primary-500 placeholder:text-slate-500" />
                            <button type="submit" className="p-2 bg-primary-500 rounded-lg text-white hover:bg-primary-600">
                                <Send className="w-4 h-4" />
                            </button>
                        </form>
                    </div>
                )}
            </div>

            {/* Controls Bar */}
            <div className="flex items-center justify-center gap-3 sm:gap-4 px-4 py-4 bg-slate-800/80 border-t border-slate-700/50">
                <button onClick={toggleMic}
                    className={`p-3 sm:p-4 rounded-full transition-all shadow-lg ${isMicOn ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-danger-500 text-white hover:bg-danger-600'}`}>
                    {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </button>
                <button onClick={toggleCamera}
                    className={`p-3 sm:p-4 rounded-full transition-all shadow-lg ${isCameraOn ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-danger-500 text-white hover:bg-danger-600'}`}>
                    {isCameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </button>
                <button onClick={toggleScreenShare}
                    className={`p-3 sm:p-4 rounded-full transition-all shadow-lg ${isScreenSharing ? 'bg-success-500 text-white hover:bg-success-600' : 'bg-slate-700 text-white hover:bg-slate-600'}`}>
                    <Monitor className="w-5 h-5" />
                </button>
                <button onClick={handleLeave}
                    className="p-3 sm:p-4 rounded-full bg-danger-500 text-white hover:bg-danger-600 transition-all shadow-lg ml-4">
                    <PhoneOff className="w-5 h-5" />
                </button>
            </div>
        </div>
    )
}
