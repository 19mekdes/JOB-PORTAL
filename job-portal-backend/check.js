// check.js
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function check() {
  const count = await prisma.user.count()
  console.log(`Total users: ${count}`)
  
  if (count > 0) {
    const users = await prisma.user.findMany({
      take: 5,
      include: { user_type: true }
    })
    console.log('\nUsers:')
    users.forEach(u => {
      console.log(`- ${u.email} | ${u.full_name || 'No name'} | ${u.user_type?.type_name || 'No role'} | ${u.is_active ? 'Active' : 'Suspended'}`)
    })
  } else {
    console.log('\n❌ No users found! Database is empty.')
  }
  
  await prisma.$disconnect()
}

check()