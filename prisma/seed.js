import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    console.log('--- Seeding UBaS LMS Database ---')

    // 1. Create Admin
    const admin = await prisma.user.upsert({
        where: { email: 'admin@ubas.edu' },
        update: {},
        create: {
            email: 'admin@ubas.edu',
            password: 'password123', // In a real app, hash this!
            name: 'Phinehas Kwofie',
            role: 'ADMIN',
        },
    })
    console.log('Created Admin:', admin.email)

    // 2. Create Teacher
    const teacher = await prisma.user.upsert({
        where: { email: 'teacher@ubas.edu' },
        update: {},
        create: {
            email: 'teacher@ubas.edu',
            password: 'password123',
            name: 'Clement Kwofie',
            role: 'TEACHER',
        },
    })
    console.log('Created Teacher:', teacher.email)

    // 3. Create Student
    const student = await prisma.user.upsert({
        where: { email: 'student@ubas.edu' },
        update: {},
        create: {
            email: 'student@ubas.edu',
            password: 'password123',
            name: 'Festus Wilson',
            role: 'STUDENT',
        },
    })
    console.log('Created Student:', student.email)

    // 4. Create a sample Subject
    const subject = await prisma.subject.create({
        data: {
            name: 'Computing (ICT)',
            code: 'ICT',
            color: 'from-rose-400 to-rose-600',
            teacherId: admin.id, // Admin handles ICT in this demo
        }
    })
    console.log('Created Subject:', subject.name)

    console.log('--- Seeding Complete ---')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
