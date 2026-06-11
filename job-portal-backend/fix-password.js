const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function fixPassword() {
  try {
    // The password you want to use
    const password = '21mek#BDU';
    
    // Generate new hash
    const hashedPassword = await bcrypt.hash(password, 10);
    
    console.log('========================================');
    console.log('🔧 FIXING PASSWORD');
    console.log('========================================');
    console.log('Email: info@network.com');
    console.log('Password:', password);
    console.log('New Hash:', hashedPassword);
    console.log('========================================');
    
    // Update the user
    const user = await prisma.user.update({
      where: { email: 'info@network.com' },
      data: { password: hashedPassword }
    });
    
    console.log('✅ Password updated successfully for:', user.email);
    console.log('');
    console.log('Now try logging in with:');
    console.log('   Email: info@network.com');
    console.log('   Password: 21mek#BDU');
    
    // Verify it works
    const verify = await bcrypt.compare(password, user.password);
    console.log('');
    console.log('Verification test:', verify ? '✅ PASSED' : '❌ FAILED');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixPassword();