const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetTo21mek() {
  try {
    const password = '21mek#BDU';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // List of all employer emails from your output
    const employerEmails = [
      'employer@example.com',
      'info@alphaline.com',
      'mekdiwale59@gmail.com',
      'henok@gmail.com',
      'mulu@gmail.com',
      'info@nobelmind.com',
      'info@network.com'
    ];
    
    console.log('========================================');
    console.log('🔧 RESETTING ALL EMPLOYER PASSWORDS');
    console.log('========================================');
    console.log(`Password: ${password}`);
    console.log(`New Hash: ${hashedPassword}`);
    console.log('========================================\n');
    
    for (const email of employerEmails) {
      const user = await prisma.user.update({
        where: { email },
        data: { password: hashedPassword }
      });
      console.log(`✅ Reset password for: ${email}`);
    }
    
    console.log('\n========================================');
    console.log('✅ ALL EMPLOYER PASSWORDS RESET TO: 21mek#BDU');
    console.log('========================================');
    console.log('\n📝 You can now login with ANY employer email and password: 21mek#BDU');
    console.log('\nExample employers:');
    console.log('   1. info@network.com');
    console.log('   2. info@nobelmind.com');
    console.log('   3. info@alphaline.com');
    console.log('   4. mekdiwale59@gmail.com');
    console.log('   5. mulu@gmail.com');
    console.log('   6. employer@example.com');
    console.log('   7. henok@gmail.com');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

resetTo21mek();