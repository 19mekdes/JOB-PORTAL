// fix-users.js - CORRECTED WITH YOUR EXACT MODEL NAMES
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getUsersWithCounts() {
  try {
    // Get all users
    const users = await prisma.user.findMany({
      include: {
        user_type: true,
        seeker_profile: true,
        employer_profile: true
      }
    });
    
    console.log('Total users:', users.length);
    
    // Get all job counts using correct model names
    const jobCounts = await prisma.$queryRaw`
      SELECT ep.id as profile_id, COUNT(jp.id) as count
      FROM "EmployerProfile" ep
      LEFT JOIN "JobPost" jp ON jp.employer_id = ep.id
      GROUP BY ep.id
    `;
    
    const jobMap = {};
    for (const row of jobCounts) {
      jobMap[row.profile_id] = Number(row.count);
    }
    
    // Get all application counts using correct model names
    const appCounts = await prisma.$queryRaw`
      SELECT sp.id as profile_id, COUNT(ja.id) as count
      FROM "JobSeekerProfile" sp
      LEFT JOIN "JobApplication" ja ON ja.seeker_id = sp.id
      GROUP BY sp.id
    `;
    
    const appMap = {};
    for (const row of appCounts) {
      appMap[row.profile_id] = Number(row.count);
    }
    
    console.log('\nJob Counts Map:', jobMap);
    console.log('App Counts Map:', appMap);
    
    // Format users
    console.log('\n=== USERS WITH COUNTS ===');
    for (const user of users) {
      let jobsCount = 0;
      let appsCount = 0;
      
      if (user.employer_profile) {
        jobsCount = jobMap[user.employer_profile.id] || 0;
      }
      if (user.seeker_profile) {
        appsCount = appMap[user.seeker_profile.id] || 0;
      }
      
      console.log(`${user.email} | ${user.user_type?.type_name} | Jobs: ${jobsCount} | Apps: ${appsCount}`);
    }
    
    // Specifically check target users
    const employerUser = users.find(u => u.email === 'mekdiwale59@gmail.com');
    const seekerUser = users.find(u => u.email === 'mekdesw60@gmail.com');
    
    console.log('\n=== TARGET USERS ===');
    if (employerUser) {
      const jobs = jobMap[employerUser.employer_profile?.id] || 0;
      console.log(`Employer ${employerUser.email}: ${jobs} jobs`);
    }
    if (seekerUser) {
      const apps = appMap[seekerUser.seeker_profile?.id] || 0;
      console.log(`Seeker ${seekerUser.email}: ${apps} apps`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getUsersWithCounts();