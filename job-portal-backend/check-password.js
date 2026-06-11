const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function checkPassword() {
  try {
    // First, get the user
    const user = await prisma.user.findUnique({
      where: { email: 'info@network.com' }
    });
    
    if (!user) {
      console.log('❌ User not found!');
      return;
    }
    
    console.log('========================================');
    console.log('🔍 PASSWORD CHECK');
    console.log('========================================');
    console.log('Email:', user.email);
    console.log('Stored hash:', user.password);
    console.log('');
    
    // Test the password you're trying to use
    const testPassword = '21mek#BDU';
    
    const isValid = await bcrypt.compare(testPassword, user.password);
    
    console.log('Testing password:', testPassword);
    console.log('Password matches:', isValid ? '✅ YES' : '❌ NO');
    console.log('');
    
    if (!isValid) {
      // Try to see what password would generate the stored hash
      console.log('The stored hash does NOT match "21mek#BDU"');
      console.log('');
      console.log('To fix this, run: node fix-password.js');
    } else {
      console.log('✅ Password is CORRECT! Login should work.');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkPassword();