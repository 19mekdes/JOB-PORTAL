const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function fix() {
  const result = await prisma.user.updateMany({
    where: {
      email: {
        in: ['seeker@example.com', 'employer@example.com', 'admin@jobportal.com']
      }
    },
    data: { email_verified: true }
  })
  console.log(`✅ Updated ${result.count} users`)
  await prisma.$disconnect()
}

fix()