import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Camera, Save, Lock, Loader2, CheckCircle2, User as UserIcon, Mail, Shield } from 'lucide-react'

export default function Profile({ user, onUpdateUser }: { user: any, onUpdateUser: (u: any) => void }) {
    const [name, setName] = useState(user.name)
    const [avatar, setAvatar] = useState(user.avatar || '')
    const [uploading, setUploading] = useState(false)
    const [currentPw, setCurrentPw] = useState('')
    const [newPw, setNewPw] = useState('')
    const [confirmPw, setConfirmPw] = useState('')
    const [pwMsg, setPwMsg] = useState('')
    const [profileSaved, setProfileSaved] = useState(false)

    const profileMutation = useMutation({
        mutationFn: async (data: { name: string; avatar: string }) => {
            const res = await fetch(`/api/users/${user.id}/profile`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })
            if (!res.ok) throw new Error('Failed')
            return res.json()
        },
        onSuccess: (data) => {
            onUpdateUser(data)
            setProfileSaved(true)
            setTimeout(() => setProfileSaved(false), 3000)
        }
    })

    const passwordMutation = useMutation({
        mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
            const res = await fetch(`/api/users/${user.id}/password`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })
            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.message || 'Failed')
            }
            return res.json()
        },
        onSuccess: () => {
            setPwMsg('Password changed successfully!')
            setCurrentPw(''); setNewPw(''); setConfirmPw('')
            setTimeout(() => setPwMsg(''), 4000)
        },
        onError: (err: Error) => {
            setPwMsg(err.message)
            setTimeout(() => setPwMsg(''), 4000)
        }
    })

    const handleAvatarUpload = async (file: File) => {
        setUploading(true)
        const formData = new FormData()
        formData.append('file', file)
        try {
            const res = await fetch('/api/upload', { method: 'POST', body: formData })
            const { fileUrl } = await res.json()
            setAvatar(fileUrl)
        } catch { alert('Upload failed') }
        setUploading(false)
    }

    const handlePasswordChange = () => {
        if (newPw !== confirmPw) { setPwMsg('Passwords do not match'); return }
        if (newPw.length < 6) { setPwMsg('Password must be at least 6 characters'); return }
        passwordMutation.mutate({ currentPassword: currentPw, newPassword: newPw })
    }

    const roleColors: Record<string, string> = {
        admin: 'bg-danger-100 text-danger-700 border-danger-200',
        teacher: 'bg-primary-100 text-primary-700 border-primary-200',
        student: 'bg-success-100 text-success-700 border-success-200',
    }

    return (
        <div className="p-4 lg:p-6 animate-fade-in text-slate-700 max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold mb-2 text-slate-800">Profile Settings</h1>
            <p className="text-slate-500 mb-8 text-sm">Manage your personal information and security</p>

            {/* Profile Card */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mb-8">
                {/* Banner */}
                <div className="h-28 bg-gradient-to-r from-primary-500 via-primary-400 to-primary-600 relative">
                    <div className="absolute -bottom-12 left-6">
                        <div className="relative group">
                            <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg bg-white flex items-center justify-center overflow-hidden">
                                {avatar ? (
                                    <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-3xl font-bold text-primary-500">{user.name.charAt(0)}</span>
                                )}
                            </div>
                            <label className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                                {uploading ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <Camera className="w-6 h-6 text-white" />}
                                <input type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) handleAvatarUpload(e.target.files[0]) }} />
                            </label>
                        </div>
                    </div>
                </div>

                <div className="pt-16 px-6 pb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">{user.name}</h2>
                            <p className="text-sm text-slate-500">{user.email}</p>
                        </div>
                        <span className={`self-start px-3 py-1 rounded-full text-xs font-bold border uppercase ${roleColors[user.role] || ''}`}>
                            {user.role}
                        </span>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2"><UserIcon className="w-4 h-4" /> Display Name</label>
                            <input value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-primary-500 transition" />
                        </div>
                        <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2"><Mail className="w-4 h-4" /> Email Address</label>
                            <input value={user.email} disabled className="w-full px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 outline-none text-slate-500 cursor-not-allowed" />
                        </div>
                        <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2"><Shield className="w-4 h-4" /> Role</label>
                            <input value={user.role.charAt(0).toUpperCase() + user.role.slice(1)} disabled className="w-full px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 outline-none text-slate-500 cursor-not-allowed" />
                        </div>
                    </div>

                    <button
                        onClick={() => profileMutation.mutate({ name, avatar })}
                        disabled={profileMutation.isPending}
                        className="mt-6 w-full sm:w-auto px-8 py-3 bg-primary-500 text-white rounded-xl font-bold hover:bg-primary-600 shadow-md flex items-center justify-center gap-2 transition-colors"
                    >
                        {profileMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : profileSaved ? <><CheckCircle2 className="w-5 h-5" /> Saved!</> : <><Save className="w-5 h-5" /> Save Changes</>}
                    </button>
                </div>
            </div>

            {/* Password Card */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-1 flex items-center gap-2"><Lock className="w-5 h-5" /> Change Password</h3>
                <p className="text-sm text-slate-500 mb-6">Update your password to keep your account secure</p>

                <div className="space-y-4 max-w-md">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Current Password</label>
                        <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">New Password</label>
                        <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Confirm New Password</label>
                        <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>
                </div>

                {pwMsg && (
                    <p className={`mt-4 text-sm font-semibold ${pwMsg.includes('success') ? 'text-success-600' : 'text-danger-600'}`}>{pwMsg}</p>
                )}

                <button
                    onClick={handlePasswordChange}
                    disabled={!currentPw || !newPw || !confirmPw || passwordMutation.isPending}
                    className="mt-6 w-full sm:w-auto px-8 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 shadow-md flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                    {passwordMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Lock className="w-5 h-5" /> Update Password</>}
                </button>
            </div>
        </div>
    )
}
