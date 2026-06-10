// fix-superadmin.js
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function fix() {
  try {
    console.log('🔧 Fixing superadmin email verification...')
    
    const result = await prisma.user.updateMany({
      where: { email: 'superadmin@jobportal.com' },
      data: { email_verified: true }
    })
    
    console.log(`✅ Updated ${result.count} user(s)`)
    
    // Verify the update
    const user = await prisma.user.findUnique({
      where: { email: 'superadmin@jobportal.com' }
    })
    
    if (user) {
      console.log(`📧 Email: ${user.email}`)
      console.log(`✅ Email verified: ${user.email_verified}`)
    } else {
      console.log('❌ Super admin not found!')
    }
    
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

fix()