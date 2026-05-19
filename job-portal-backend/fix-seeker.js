const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  console.log('=== FIXING APPLICATIONS ===\n');
  
  const userEmail = 'mekdesw60@gmail.com';
  
  // Get user
  const user = await prisma.user.findUnique({
    where: { email: userEmail }
  });
  
  if (!user) {
    console.log('❌ User not found!');
    return;
  }
  
  console.log('✅ User found:', user.id);
  
  // Get or create seeker profile
  let seeker = await prisma.jobSeekerProfile.findFirst({
    where: { user_id: user.id }
  });
  
  if (!seeker) {
    console.log('Creating seeker profile...');
    seeker = await prisma.jobSeekerProfile.create({
      data: {
        user_id: user.id,
        full_name: 'Mekdes Wale',
        skills: ['JavaScript', 'React', 'Node.js']
      }
    });
    console.log('✅ Created seeker ID:', seeker.id);
  } else {
    console.log('✅ Existing seeker ID:', seeker.id);
  }
  
  // Check applications
  let apps = await prisma.jobApplication.findMany({
    where: { seeker_id: seeker.id },
    include: { job: true }
  });
  
  console.log('\n📊 Found ' + apps.length + ' applications for this user');
  
  if (apps.length === 0) {
    console.log('\n📝 No applications found. Creating a test application...');
    
    const job = await prisma.jobPost.findFirst();
    const pendingStatus = await prisma.jobApplicationStatus.findFirst({
      where: { status_name: 'Pending' }
    });
    
    if (job) {
      const newApp = await prisma.jobApplication.create({
        data: {
          job_id: job.id,
          seeker_id: seeker.id,
          status_id: pendingStatus.id,
          cover_letter: 'Test application from fix script',
          applied_at: new Date()
        }
      });
      console.log('✅ Created test application:', newApp.id);
      console.log('   Job:', job.title);
    } else {
      console.log('❌ No jobs available to apply for');
    }
  }
  
  // Final count
  const finalApps = await prisma.jobApplication.findMany({
    where: { seeker_id: seeker.id },
    include: { job: true }
  });
  
  console.log('\n📊 FINAL TOTAL: ' + finalApps.length + ' applications');
  finalApps.forEach(app => {
    console.log('   - ' + app.job.title);
  });
  
  console.log('\n✅ Refresh your Applications page now!');
  
  await prisma.$disconnect();
}

fix().catch(console.error);
