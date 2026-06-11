const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function listEmployers() {
  try {
    // Get all employer users
    const employers = await prisma.user.findMany({
      where: {
        user_type: {
          type_name: 'Employer'
        }
      },
      include: {
        employer_profile: true,
        user_type: true
      }
    });
    
    console.log('========================================');
    console.log('📋 LIST OF EMPLOYERS');
    console.log('========================================');
    
    for (const employer of employers) {
      console.log(`\n📧 Email: ${employer.email}`);
      console.log(`   Company: ${employer.employer_profile?.company_name || 'N/A'}`);
      console.log(`   User Type: ${employer.user_type?.type_name}`);
      console.log(`   is_active: ${employer.is_active}`);
      console.log(`   is_verified: ${employer.employer_profile?.is_verified || false}`);
      console.log(`   Password hash: ${employer.password.substring(0, 30)}...`);
    }
    
    console.log('\n========================================');
    console.log(`Total Employers: ${employers.length}`);
    console.log('========================================');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

listEmployers();