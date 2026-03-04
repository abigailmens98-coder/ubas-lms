import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'

dotenv.config()

const prisma = new PrismaClient()
const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

// --- Multer & File Uploads ---
import multer from 'multer'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const uploadDir = path.join(__dirname, 'uploads')

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
})
const upload = multer({ storage })

app.use('/uploads', express.static(uploadDir))

app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
    const fileUrl = `/uploads/${req.file.filename}`
    res.json({ fileUrl })
})


// --- Auth Routes ---

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body

    try {
        const user = await prisma.user.findUnique({
            where: { email },
        })

        if (!user || user.password !== password) {
            return res.status(401).json({ message: 'Invalid email or password' })
        }

        // Return user info (excluding password in real apps)
        const { password: _, ...userInfo } = user
        userInfo.role = userInfo.role.toLowerCase()
        res.json(userInfo)
    } catch (error) {
        console.error('Login error:', error)
        res.status(500).json({ message: 'Internal server error' })
    }
})

// --- Stats Routes ---

app.get('/api/stats/:role/:userId', async (req, res) => {
    const { role, userId } = req.params

    try {
        let stats = {};

        if (role === 'admin') {
            const subjects = await prisma.subject.count();
            const students = await prisma.user.count({ where: { role: 'STUDENT' } });
            const classes = await prisma.class.count();
            const quizzes = await prisma.quiz.count();

            const quizAttempts = await prisma.quizAttempt.findMany({
                include: { quiz: { include: { subject: true } } }
            });

            const subjectStats = {};
            quizAttempts.forEach(a => {
                const sName = a.quiz.subject.name;
                if (!subjectStats[sName]) subjectStats[sName] = { score: 0, max: 0, count: 0 };
                subjectStats[sName].score += a.score;
                subjectStats[sName].max += a.maxScore;
                subjectStats[sName].count += 1;
            });
            const performanceChart = Object.keys(subjectStats).map(s => ({
                subject: s,
                averageScore: subjectStats[s].max > 0 ? Math.round((subjectStats[s].score / subjectStats[s].max) * 100) : 0,
                attempts: subjectStats[s].count
            }));

            stats = { subjects, students, classes, quizzes, performanceChart };
        } else if (role === 'teacher') {
            const subjects = await prisma.subject.count({ where: { teacherId: userId } });
            const classes = await prisma.class.count({ where: { teacherId: userId } });
            const quizzes = await prisma.quiz.count({ where: { subject: { teacherId: userId } } });

            const quizAttempts = await prisma.quizAttempt.findMany({
                where: { quiz: { subject: { teacherId: userId } } },
                include: { quiz: { include: { subject: true } } }
            });

            const subjectStats = {};
            quizAttempts.forEach(a => {
                const sName = a.quiz.subject.name;
                if (!subjectStats[sName]) subjectStats[sName] = { score: 0, max: 0, count: 0 };
                subjectStats[sName].score += a.score;
                subjectStats[sName].max += a.maxScore;
                subjectStats[sName].count += 1;
            });
            const performanceChart = Object.keys(subjectStats).map(s => ({
                subject: s,
                averageScore: subjectStats[s].max > 0 ? Math.round((subjectStats[s].score / subjectStats[s].max) * 100) : 0,
                attempts: subjectStats[s].count
            }));

            stats = { subjects, students: 0, classes, quizzes, performanceChart };
        } else {
            stats = {
                subjects: await prisma.subject.count(),
                students: await prisma.user.count({ where: { role: 'STUDENT' } }),
                classes: await prisma.class.count(),
                quizzes: await prisma.quiz.count(),
            }
        }
        res.json(stats);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch stats' })
    }
})

import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "YOUR_GEMINI_KEY")

// --- Users & Enrollment ---

app.get('/api/users', async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            include: { class: { select: { name: true, section: true } } },
            orderBy: { createdAt: 'desc' }
        })
        const formattedUsers = users.map(u => ({ ...u, role: u.role.toLowerCase() }))
        res.json(formattedUsers)
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' })
    }
})

app.patch('/api/users/:id/enroll', async (req, res) => {
    const { id } = req.params
    const { classId } = req.body
    try {
        const user = await prisma.user.update({
            where: { id },
            data: { classId: classId || null },
        })
        res.json(user)
    } catch (error) {
        res.status(500).json({ error: 'Failed to enroll student' })
    }
})

app.post('/api/users', async (req, res) => {
    const { name, email, password, role } = req.body
    try {
        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: password || 'password123',
                role: role.toUpperCase(),
            },
        })
        const { password: _, ...userInfo } = newUser
        userInfo.role = userInfo.role.toLowerCase()
        res.status(201).json(userInfo)
    } catch (error) {
        console.error('Create user error:', error)
        res.status(400).json({ message: 'User already exists or invalid data' })
    }
})

app.delete('/api/users/:id', async (req, res) => {
    const { id } = req.params
    try {
        await prisma.user.delete({ where: { id } })
        res.status(204).end()
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete user' })
    }
})

// --- Lessons Routes ---

app.get('/api/lessons', async (req, res) => {
    const { subjectId } = req.query
    try {
        const lessons = await prisma.lesson.findMany({
            where: subjectId ? { subjectId } : {},
            include: { subject: { select: { name: true } } },
            orderBy: { createdAt: 'desc' }
        })
        res.json(lessons)
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch lessons' })
    }
})

app.post('/api/lessons', async (req, res) => {
    const { title, content, subjectId, attachmentUrl } = req.body
    try {
        const newLesson = await prisma.lesson.create({
            data: { title, content, subjectId, attachmentUrl },
        })
        res.status(201).json(newLesson)
    } catch (error) {
        res.status(400).json({ message: 'Error creating lesson' })
    }
})

// --- Classes Routes ---

app.get('/api/classes', async (req, res) => {
    try {
        const classes = await prisma.class.findMany({
            include: {
                classTeacher: { select: { name: true } },
                _count: { select: { students: true } }
            }
        })
        res.json(classes)
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch classes' })
    }
})

app.post('/api/classes', async (req, res) => {
    const { name, section, teacherId } = req.body
    try {
        const newClass = await prisma.class.create({
            data: { name, section, teacherId },
            include: { classTeacher: { select: { name: true } }, _count: { select: { students: true } } }
        })
        res.status(201).json(newClass)
    } catch (error) {
        res.status(400).json({ message: 'Error creating class' })
    }
})

app.delete('/api/classes/:id', async (req, res) => {
    try {
        await prisma.class.delete({ where: { id: req.params.id } })
        res.status(204).end()
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete class' })
    }
})

// --- Subjects Routes ---

app.get('/api/subjects', async (req, res) => {
    try {
        const subjects = await prisma.subject.findMany({
            include: {
                teacher: { select: { name: true } },
                _count: { select: { quizzes: true, lessons: true } }
            }
        })
        res.json(subjects)
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch subjects' })
    }
})

app.post('/api/subjects', async (req, res) => {
    const { name, code, color, teacherId } = req.body
    try {
        const newSubject = await prisma.subject.create({
            data: { name, code, color, teacherId },
            include: { teacher: { select: { name: true } }, _count: { select: { quizzes: true, lessons: true } } }
        })
        res.status(201).json(newSubject)
    } catch (error) {
        res.status(400).json({ message: 'Error creating subject' })
    }
})

app.delete('/api/subjects/:id', async (req, res) => {
    try {
        await prisma.subject.delete({ where: { id: req.params.id } })
        res.status(204).end()
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete subject' })
    }
})

// --- AI Quiz Generation ---

app.post('/api/ai/generate-quiz', async (req, res) => {
    const { subject, lesson, difficulty, count, types } = req.body

    if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ message: "Gemini API Key missing in .env" })
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

        const prompt = `You are an expert Ghana Basic School curriculum quiz generator following the Ghana Education Service (GES) National Pre-Tertiary Education Curriculum Framework.

Generate a quiz about "${subject} - ${lesson}" for ${difficulty} level students in a Ghana Basic School. 
Total questions: ${count}. 
Question types: ${Object.entries(types).filter(([_, v]) => v).map(([k]) => k).join(", ")}.

GUIDELINES:
- Questions must align with the Ghana Basic School curriculum standards
- Use language and examples relevant to Ghanaian students
- Test knowledge, understanding, application, and analysis
- Include a mix of difficulty levels within the specified range

Return the response ONLY as a JSON array of objects with the following structure:
[{ "text": "Question here", "type": "multiple_choice", "options": ["A) opt1", "B) opt2", "C) opt3", "D) opt4"], "correctAnswer": "A) opt1", "explanation": "Why?" }]`

        const result = await model.generateContent(prompt)
        const response = await result.response
        const text = response.text()

        // Clean JSON from markdown if needed
        const cleanJson = text.replace(/```json|```/g, "").trim()
        const questions = JSON.parse(cleanJson)

        res.json({ questions })
    } catch (error) {
        console.error("AI Error:", error)
        res.status(500).json({ message: "AI failed to generate quiz" })
    }
})

// --- AI Quiz Generation from PDF ---
app.post('/api/ai/generate-quiz-from-pdf', upload.single('pdf'), async (req, res) => {
    if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ message: "Gemini API Key missing in .env" })
    }
    if (!req.file) {
        return res.status(400).json({ message: "No PDF uploaded" })
    }

    const { subject, difficulty, count, classLevel } = req.body

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

        // Read PDF as base64
        const pdfBuffer = fs.readFileSync(req.file.path)
        const pdfBase64 = pdfBuffer.toString('base64')

        const prompt = `You are an expert Ghana Basic School curriculum quiz generator. 
Analyze the attached PDF document content and generate ${count || 10} quiz questions based on it.

Subject: ${subject || 'General'}
Class Level: ${classLevel || 'JHS'}
Difficulty: ${difficulty || 'Medium'}

IMPORTANT GUIDELINES - Following Ghana Education Service (GES) National Pre-Tertiary Education Curriculum Framework:
- Questions must be age-appropriate for ${classLevel || 'JHS'} students in Ghana
- Align with the Ghana Basic School curriculum standards and competencies
- Include questions that test knowledge, understanding, application, and analysis
- Use language and examples relevant to Ghanaian students  
- For JHS: Focus on analytical thinking and application
- For Primary: Focus on recall and basic understanding
- Include a mix of easy, medium, and challenging questions

Return ONLY a JSON array (no markdown, no explanation) with this exact structure:
[{ "text": "Question text here", "type": "multiple_choice", "options": ["A) option1", "B) option2", "C) option3", "D) option4"], "correctAnswer": "A) option1", "explanation": "Brief explanation why this is correct" }]`

        const result = await model.generateContent([
            { text: prompt },
            { inlineData: { mimeType: 'application/pdf', data: pdfBase64 } }
        ])
        const response = await result.response
        const text = response.text()

        const cleanJson = text.replace(/```json|```/g, "").trim()
        const questions = JSON.parse(cleanJson)

        // Clean up uploaded PDF
        fs.unlinkSync(req.file.path)

        res.json({ questions })
    } catch (error) {
        console.error("AI PDF Error:", error)
        if (req.file?.path) try { fs.unlinkSync(req.file.path) } catch { }
        res.status(500).json({ message: "AI failed to generate quiz from PDF" })
    }
})

// --- Quizzes & Attempts ---

app.get('/api/quizzes/teacher/:userId', async (req, res) => {
    try {
        const quizzes = await prisma.quiz.findMany({
            where: { subject: { teacherId: req.params.userId } },
            include: {
                subject: { select: { name: true, color: true } },
                _count: { select: { questions: true } },
                attempts: {
                    include: { student: { select: { name: true } } }
                }
            },
            orderBy: { createdAt: 'desc' }
        })
        res.json(quizzes)
    } catch (error) {
        res.status(500).json({ error: 'Failed' })
    }
})

app.get('/api/quizzes', async (req, res) => {
    try {
        const quizzes = await prisma.quiz.findMany({
            where: { status: 'published' },
            include: {
                subject: { select: { name: true, color: true } },
                _count: { select: { questions: true } }
            },
            orderBy: { createdAt: 'desc' }
        })
        res.json(quizzes)
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch quizzes' })
    }
})

app.get('/api/quizzes/:id', async (req, res) => {
    try {
        const quiz = await prisma.quiz.findUnique({
            where: { id: req.params.id },
            include: {
                questions: true,
                subject: { select: { name: true } },
                attempts: {
                    include: { student: { select: { name: true } } }
                }
            }
        })
        res.json(quiz)
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch quiz details' })
    }
})

// Create a new quiz
app.post('/api/quizzes', async (req, res) => {
    const { title, duration, status, subjectId, questions } = req.body;
    try {
        const quiz = await prisma.quiz.create({
            data: {
                title,
                duration: duration || 30,
                status: status || 'published',
                subjectId,
                questions: {
                    create: (questions || []).map((q) => ({
                        text: q.text,
                        type: q.type || 'multiple_choice',
                        options: q.options || [],
                        correctAnswer: q.correctAnswer,
                        explanation: q.explanation || ''
                    }))
                }
            },
            include: { subject: { select: { name: true, classes: { include: { students: { select: { id: true } } } } } }, _count: { select: { questions: true } } }
        });

        // Notify students if quiz is published
        if (quiz.status === 'published' && quiz.subject?.classes) {
            const studentIds = quiz.subject.classes.flatMap(c => c.students.map(s => s.id));
            const uniqueIds = [...new Set(studentIds)];
            if (uniqueIds.length > 0) {
                await prisma.notification.createMany({
                    data: uniqueIds.map(sid => ({
                        userId: sid,
                        title: 'New Quiz Available',
                        message: `"${title}" has been published in ${quiz.subject.name}. Take it now!`,
                        type: 'quiz',
                        link: '/'
                    }))
                });
            }
        }

        res.status(201).json(quiz);
    } catch (error) {
        console.error('Quiz create error:', error);
        res.status(500).json({ error: 'Failed to create quiz' });
    }
});

app.post('/api/quizzes/submit', async (req, res) => {
    const { quizId, studentId, score, maxScore } = req.body
    try {
        const attempt = await prisma.quizAttempt.create({
            data: { quizId, studentId, score, maxScore }
        })
        // Notify the teacher
        const quiz = await prisma.quiz.findUnique({ where: { id: quizId }, include: { subject: { select: { teacherId: true, name: true } } } });
        const student = await prisma.user.findUnique({ where: { id: studentId }, select: { name: true } });
        if (quiz?.subject?.teacherId) {
            await prisma.notification.create({
                data: {
                    userId: quiz.subject.teacherId,
                    title: 'Quiz Completed',
                    message: `${student?.name} scored ${score}/${maxScore} on ${quiz.title}`,
                    type: 'quiz',
                    link: '/quizzes'
                }
            });
        }
        res.status(201).json(attempt)
    } catch (error) {
        res.status(500).json({ error: 'Failed to save quiz attempt' })
    }
})

app.get('/api/messages/:userId/:otherUserId', async (req, res) => {
    const { userId, otherUserId } = req.params;

    try {
        const messages = await prisma.message.findMany({
            where: {
                OR: [
                    { senderId: userId, receiverId: otherUserId },
                    { senderId: otherUserId, receiverId: userId }
                ]
            },
            orderBy: { createdAt: 'asc' }
        });

        // Mark as read
        await prisma.message.updateMany({
            where: { senderId: otherUserId, receiverId: userId, read: false },
            data: { read: true }
        });

        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

app.post('/api/messages', async (req, res) => {
    const { senderId, receiverId, content } = req.body;
    try {
        const newMessage = await prisma.message.create({
            data: { senderId, receiverId, content }
        });
        // Create notification for receiver
        const sender = await prisma.user.findUnique({ where: { id: senderId }, select: { name: true } });
        await prisma.notification.create({
            data: {
                userId: receiverId,
                title: 'New Message',
                message: `${sender?.name || 'Someone'} sent you a message`,
                type: 'message',
                link: '/messages'
            }
        });
        res.status(201).json(newMessage);
    } catch (error) {
        res.status(400).json({ message: 'Error sending message' });
    }
});

app.get('/api/users/contacts/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        let contacts = [];
        if (!user) return res.status(404).json({ error: 'Not found' });

        if (user.role === 'ADMIN') {
            contacts = await prisma.user.findMany({
                where: { id: { not: user.id } },
                select: { id: true, name: true, role: true, avatar: true }
            });
        } else if (user.role === 'TEACHER') {
            contacts = await prisma.user.findMany({
                where: { role: { in: ['STUDENT', 'ADMIN'] }, id: { not: user.id } },
                select: { id: true, name: true, role: true, avatar: true }
            });
        } else {
            // Teachers + Admin + Classmates
            const teachersAndAdmin = await prisma.user.findMany({
                where: { role: { in: ['TEACHER', 'ADMIN'] }, id: { not: user.id } },
                select: { id: true, name: true, role: true, avatar: true }
            });
            let classmates = [];
            if (user.classId) {
                classmates = await prisma.user.findMany({
                    where: { classId: user.classId, id: { not: user.id }, role: 'STUDENT' },
                    select: { id: true, name: true, role: true, avatar: true }
                });
            }
            contacts = [...teachersAndAdmin, ...classmates];
        }
        res.json(contacts);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch contacts' });
    }
});

// --- Assignments ---
app.get('/api/assignments', async (req, res) => {
    const { role, userId } = req.query;
    try {
        let where = {};
        if (role === 'student') {
            const user = await prisma.user.findUnique({ where: { id: userId }, include: { class: { include: { subjects: true } } } });
            if (user?.class) {
                where = { subjectId: { in: user.class.subjects.map(s => s.id) } };
            }
        } else if (role === 'teacher') {
            where = { subject: { teacherId: userId } };
        }

        const assignments = await prisma.assignment.findMany({
            where,
            include: { subject: { select: { name: true, color: true } }, submissions: true },
            orderBy: { dueDate: 'asc' }
        });
        res.json(assignments);
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
});

app.post('/api/assignments', async (req, res) => {
    const { title, description, dueDate, fileUrl, subjectId } = req.body;
    try {
        const assignment = await prisma.assignment.create({
            data: { title, description, dueDate: new Date(dueDate), fileUrl, subjectId },
            include: { subject: { select: { name: true, color: true } }, submissions: true }
        });

        // Notify students
        const students = await prisma.user.findMany({
            where: { role: 'STUDENT', class: { subjects: { some: { id: subjectId } } } }
        });
        await prisma.notification.createMany({
            data: students.map(s => ({
                userId: s.id,
                title: 'New Assignment',
                message: `New assignment posted: ${title}`,
                type: 'assignment'
            }))
        });

        // Notify students in classes linked to this subject
        const subject = await prisma.subject.findUnique({
            where: { id: assignment.subjectId },
            include: { classes: { include: { students: { select: { id: true } } } } }
        });
        if (subject) {
            const studentIds = subject.classes.flatMap(c => c.students.map(s => s.id));
            const uniqueIds = [...new Set(studentIds)];
            await prisma.notification.createMany({
                data: uniqueIds.map(sid => ({
                    userId: sid,
                    title: 'New Assignment',
                    message: `"${assignment.title}" has been posted in ${subject.name}`,
                    type: 'assignment',
                    link: '/assignments'
                }))
            });
        }
        res.status(201).json(assignment);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed' });
    }
});

app.post('/api/assignments/:id/submit', async (req, res) => {
    const { studentId, fileUrl } = req.body;
    try {
        const submission = await prisma.assignmentSubmission.create({
            data: { assignmentId: req.params.id, studentId, fileUrl }
        });
        res.status(201).json(submission);
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
});

// Grade a submission
app.patch('/api/submissions/:id/grade', async (req, res) => {
    const { grade, feedback } = req.body;
    try {
        const submission = await prisma.assignmentSubmission.update({
            where: { id: req.params.id },
            data: { grade: parseInt(grade), feedback },
            include: { student: { select: { id: true, name: true } }, assignment: { select: { title: true } } }
        });
        // Notify the student
        await prisma.notification.create({
            data: {
                userId: submission.student.id,
                title: 'Assignment Graded',
                message: `Your submission for "${submission.assignment.title}" received ${grade}/100`,
                type: 'assignment',
                link: '/assignments'
            }
        });
        res.json(submission);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to grade' });
    }
});

// Get submissions for an assignment
app.get('/api/assignments/:id/submissions', async (req, res) => {
    try {
        const submissions = await prisma.assignmentSubmission.findMany({
            where: { assignmentId: req.params.id },
            include: { student: { select: { name: true, email: true, avatar: true } } },
            orderBy: { submittedAt: 'desc' }
        });
        res.json(submissions);
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
});

// --- Attendance ---
app.get('/api/attendance', async (req, res) => {
    const { classId, date } = req.query;
    try {
        const where = {};
        if (classId) where.classId = classId;
        if (date) {
            const d = new Date(date);
            d.setHours(0, 0, 0, 0);
            const nextDay = new Date(d);
            nextDay.setDate(nextDay.getDate() + 1);
            where.date = { gte: d, lt: nextDay };
        }
        const records = await prisma.attendance.findMany({
            where,
            include: { student: { select: { id: true, name: true, avatar: true } } },
            orderBy: { student: { name: 'asc' } }
        });
        res.json(records);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch attendance' });
    }
});

app.post('/api/attendance', async (req, res) => {
    const { records, classId, date, markedById } = req.body;
    // records: [{ studentId, status }]
    try {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);

        // Upsert each record
        const results = await Promise.all(
            records.map((r) =>
                prisma.attendance.upsert({
                    where: {
                        studentId_classId_date: {
                            studentId: r.studentId,
                            classId,
                            date: d
                        }
                    },
                    update: { status: r.status },
                    create: {
                        studentId: r.studentId,
                        classId,
                        date: d,
                        status: r.status,
                        markedById
                    }
                })
            )
        );
        res.json({ saved: results.length });
    } catch (error) {
        console.error('Attendance error:', error);
        res.status(500).json({ error: 'Failed to save attendance' });
    }
});

// Attendance summary for a class
app.get('/api/attendance/summary/:classId', async (req, res) => {
    try {
        const records = await prisma.attendance.findMany({
            where: { classId: req.params.classId },
            include: { student: { select: { id: true, name: true } } }
        });
        // Group by student
        const summary = {};
        records.forEach(r => {
            if (!summary[r.studentId]) summary[r.studentId] = { name: r.student.name, present: 0, absent: 0, late: 0, total: 0 };
            summary[r.studentId].total++;
            if (r.status === 'PRESENT') summary[r.studentId].present++;
            else if (r.status === 'ABSENT') summary[r.studentId].absent++;
            else if (r.status === 'LATE') summary[r.studentId].late++;
        });
        res.json(Object.entries(summary).map(([id, data]) => ({ studentId: id, ...data })));
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
});

// --- Live Classes ---

app.get('/api/live-classes', async (req, res) => {
    const { role, userId } = req.query;
    try {
        let where = {};
        if (role === 'student') {
            const user = await prisma.user.findUnique({ where: { id: userId }, include: { class: { include: { subjects: true } } } });
            if (user?.class) {
                where = { subjectId: { in: user.class.subjects.map(s => s.id) }, startTime: { gte: new Date() } };
            }
        } else if (role === 'teacher') {
            where = { teacherId: userId };
        }

        const classes = await prisma.liveClass.findMany({
            where,
            include: { subject: { select: { name: true, color: true } }, teacher: { select: { name: true } } },
            orderBy: { startTime: 'asc' }
        });
        res.json(classes);
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
});

app.post('/api/live-classes', async (req, res) => {
    const { title, topic, startTime, duration, joinUrl, subjectId, teacherId } = req.body;
    try {
        const liveClass = await prisma.liveClass.create({
            data: { title, topic, startTime: new Date(startTime), duration, joinUrl, subjectId, teacherId },
            include: { subject: { select: { name: true, color: true, classes: { include: { students: { select: { id: true } } } } } }, teacher: { select: { name: true } } }
        });
        // Notify students
        const studentIds = liveClass.subject?.classes?.flatMap(c => c.students.map(s => s.id)) || [];
        const uniqueIds = [...new Set(studentIds)];
        if (uniqueIds.length > 0) {
            await prisma.notification.createMany({
                data: uniqueIds.map(sid => ({
                    userId: sid,
                    title: 'Live Class Scheduled',
                    message: `${liveClass.teacher?.name} scheduled "${title}" on ${new Date(startTime).toLocaleDateString()}`,
                    type: 'live_class',
                    link: '/live-classes'
                }))
            });
        }
        res.status(201).json(liveClass);
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
});

// --- Announcements ---
app.get('/api/announcements', async (req, res) => {
    try {
        const announcements = await prisma.announcement.findMany({
            include: { author: { select: { name: true } } },
            orderBy: { createdAt: 'desc' },
            take: 10
        });
        res.json(announcements);
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
});

app.post('/api/announcements', async (req, res) => {
    const { title, content, authorId } = req.body;
    try {
        const announcement = await prisma.announcement.create({
            data: { title, content, authorId },
            include: { author: { select: { name: true } } }
        });

        // Notify everyone
        const allUsers = await prisma.user.findMany({ where: { id: { not: authorId } } });
        await prisma.notification.createMany({
            data: allUsers.map(u => ({
                userId: u.id,
                title: 'New Announcement',
                message: title,
                type: 'announcement'
            }))
        });

        res.status(201).json(announcement);
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
});

// --- Notifications ---
app.get('/api/notifications/:userId', async (req, res) => {
    try {
        const notifications = await prisma.notification.findMany({
            where: { userId: req.params.userId },
            orderBy: { createdAt: 'desc' },
            take: 20
        });
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
});

app.patch('/api/notifications/:userId/read', async (req, res) => {
    try {
        await prisma.notification.updateMany({
            where: { userId: req.params.userId, read: false },
            data: { read: true }
        });
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
});

// --- User Profile ---
app.patch('/api/users/:id/profile', async (req, res) => {
    const { name, avatar } = req.body;
    try {
        const user = await prisma.user.update({
            where: { id: req.params.id },
            data: { ...(name && { name }), ...(avatar !== undefined && { avatar }) }
        });
        const { password: _, ...userInfo } = user;
        userInfo.role = userInfo.role.toLowerCase();
        res.json(userInfo);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

app.patch('/api/users/:id/password', async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { id: req.params.id } });
        if (!user || user.password !== currentPassword) {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }
        await prisma.user.update({ where: { id: req.params.id }, data: { password: newPassword } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to change password' });
    }
});

// --- Enhanced Dashboard Stats ---
app.get('/api/dashboard/:role/:userId', async (req, res) => {
    const { role, userId } = req.params;
    try {
        if (role === 'admin') {
            const [students, teachers, classes, subjects, assignments, announcements] = await Promise.all([
                prisma.user.count({ where: { role: 'STUDENT' } }),
                prisma.user.count({ where: { role: 'TEACHER' } }),
                prisma.class.count(),
                prisma.subject.count(),
                prisma.assignment.count(),
                prisma.announcement.count(),
            ]);
            const recentActivity = await prisma.notification.findMany({
                orderBy: { createdAt: 'desc' }, take: 8,
                select: { title: true, message: true, type: true, createdAt: true }
            });
            res.json({ students, teachers, classes, subjects, assignments, announcements, recentActivity });
        } else if (role === 'teacher') {
            const [subjects, classes, assignments, liveClasses] = await Promise.all([
                prisma.subject.count({ where: { teacherId: userId } }),
                prisma.class.count({ where: { subjects: { some: { teacherId: userId } } } }),
                prisma.assignment.count({ where: { subject: { teacherId: userId } } }),
                prisma.liveClass.count({ where: { teacherId: userId, startTime: { gte: new Date() } } }),
            ]);
            const recentSubmissions = await prisma.assignmentSubmission.findMany({
                where: { assignment: { subject: { teacherId: userId } } },
                orderBy: { submittedAt: 'desc' }, take: 5,
                include: { student: { select: { name: true } }, assignment: { select: { title: true } } }
            });
            res.json({ subjects, classes, assignments, liveClasses, recentSubmissions });
        } else {
            const user = await prisma.user.findUnique({ where: { id: userId }, include: { class: { include: { subjects: true } } } });
            const subjectIds = user?.class?.subjects?.map(s => s.id) || [];
            const [assignmentsDue, completedAssignments, upcomingClasses] = await Promise.all([
                prisma.assignment.count({ where: { subjectId: { in: subjectIds }, dueDate: { gte: new Date() } } }),
                prisma.assignmentSubmission.count({ where: { studentId: userId } }),
                prisma.liveClass.count({ where: { subjectId: { in: subjectIds }, startTime: { gte: new Date() } } }),
            ]);
            const quizAttempts = await prisma.quizAttempt.findMany({ where: { studentId: userId } });
            const avgGrade = quizAttempts.length > 0
                ? Math.round(quizAttempts.reduce((s, a) => s + (a.score / a.maxScore) * 100, 0) / quizAttempts.length)
                : 0;
            const recentActivity = await prisma.notification.findMany({
                where: { userId }, orderBy: { createdAt: 'desc' }, take: 5,
                select: { title: true, message: true, type: true, createdAt: true }
            });
            res.json({ assignmentsDue, completedAssignments, upcomingClasses, avgGrade, quizzesTaken: quizAttempts.length, recentActivity });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch dashboard' });
    }
});

// --- Serve React App ---
const distPath = path.join(__dirname, '../dist')
app.use(express.static(distPath))

app.use((req, res) => {
    res.sendFile(path.join(distPath, 'index.html'))
})

app.listen(PORT, () => {
    console.log(`🚀 Backend running on http://localhost:${PORT}`)
})
