import { CalendarClock } from 'lucide-react'

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const periods = ['8:00-8:40', '8:40-9:20', '9:20-10:00', '10:00-10:30', '10:30-11:10', '11:10-11:50', '11:50-12:30', '12:30-1:10', '1:10-1:50']
const breakPeriod = 3 // index 3 is break time

const subjectColors: Record<string, string> = {
    'Mathematics': 'bg-blue-50 text-blue-700 border-blue-200',
    'English': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Science': 'bg-purple-50 text-purple-700 border-purple-200',
    'Social Studies': 'bg-amber-50 text-amber-700 border-amber-200',
    'ICT': 'bg-rose-50 text-rose-700 border-rose-200',
    'French': 'bg-cyan-50 text-cyan-700 border-cyan-200',
    'RME': 'bg-indigo-50 text-indigo-700 border-indigo-200',
    'Creative Arts': 'bg-orange-50 text-orange-700 border-orange-200',
    'Break': 'bg-slate-100 text-slate-500 border-slate-200',
}

const timetableData: Record<string, string[]> = {
    'Monday': ['Mathematics', 'English', 'Science', 'Break', 'ICT', 'French', 'Social Studies', 'RME', 'Creative Arts'],
    'Tuesday': ['English', 'Mathematics', 'ICT', 'Break', 'Science', 'Social Studies', 'French', 'Creative Arts', 'RME'],
    'Wednesday': ['Science', 'French', 'Mathematics', 'Break', 'English', 'RME', 'ICT', 'Social Studies', 'Creative Arts'],
    'Thursday': ['Social Studies', 'Science', 'English', 'Break', 'Mathematics', 'Creative Arts', 'RME', 'French', 'ICT'],
    'Friday': ['French', 'ICT', 'Social Studies', 'Break', 'Creative Arts', 'Mathematics', 'English', 'Science', 'RME'],
}

export default function AdminTimetable() {
    return (
        <div className="animate-fade-in">
            <div className="flex items-start justify-between mb-8">
                <div className="page-header mb-0">
                    <h1 className="page-title">Timetable</h1>
                    <p className="page-subtitle">Weekly class schedule for all classes</p>
                </div>
                <div className="flex items-center gap-3">
                    <select className="input-field w-auto">
                        <option>JHS 1A</option>
                        <option>JHS 1B</option>
                        <option>JHS 2A</option>
                        <option>JHS 2B</option>
                        <option>JHS 3A</option>
                        <option>JHS 3B</option>
                    </select>
                </div>
            </div>

            <div className="content-card overflow-x-auto p-0">
                <table className="w-full min-w-[800px]">
                    <thead>
                        <tr className="border-b border-slate-100">
                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider w-24">
                                <CalendarClock className="w-4 h-4 inline mr-1" />
                                Day
                            </th>
                            {periods.map((period, i) => (
                                <th key={i} className={`text-center px-2 py-3 text-xs font-medium ${i === breakPeriod ? 'text-slate-400 bg-slate-50' : 'text-slate-500'}`}>
                                    {i === breakPeriod ? 'Break' : period}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {days.map((day) => (
                            <tr key={day} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                <td className="px-4 py-3 text-sm font-semibold text-slate-700">{day}</td>
                                {timetableData[day].map((subject, i) => (
                                    <td key={i} className="px-1.5 py-2 text-center">
                                        <div className={`px-2 py-2 rounded-lg text-xs font-medium border
                                    ${subjectColors[subject] || 'bg-slate-50 text-slate-500 border-slate-100'}
                                    ${i === breakPeriod ? 'opacity-60' : ''}`}>
                                            {subject}
                                        </div>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
