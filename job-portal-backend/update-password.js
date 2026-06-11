const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    // Generate hash for the password
    const password = '21mek#BDU';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    console.log('Generated hash:', hashedPassword);
    
    // Update the user
    const user = await prisma.user.update({
      where: { email: 'info@network.com' },
      data: { password: hashedPassword }
    });
    
    console.log('✅ Password updated successfully for:', user.email);
    console.log('You can now login with:');
    console.log('   Email:', user.email);
    console.log('   Password:', password);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();