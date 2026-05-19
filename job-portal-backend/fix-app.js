const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  console.log('=== CHECKING YOUR APPLICATIONS ===\n');
  
  const userId = 'e3cd0f14-3309-47fb-9773-584a991461dc';
  const seekerId = '7129e15c-80eb-4c2a-895f-1ab875bda54a';
  
  // 1. Show existing applications
  const existingApps = await prisma.jobApplication.findMany({
    where: { seeker_id: seekerId },
    include: { job: true, status: true }
  });
  
  console.log('Your existing applications:');
  if (existingApps.length === 0) {
    console.log('   None yet');
  } else {
    existingApps.forEach(app => {
      console.log(`   - ${app.job.title} (${app.status.status_name})`);
    });
  }
  
  // 2. Get a job you haven't applied to yet
  const appliedJobIds = existingApps.map(app => app.job_id);
  
  const newJob = await prisma.jobPost.findFirst({
    where: {
      id: { notIn: appliedJobIds }
    }
  });
  
  if (!newJob) {
    console.log('\nYou have applied to all available jobs!');
    return;
  }
  
  console.log(`\nNew job to apply: ${newJob.title}`);
  
  // 3. Get pending status
  const pendingStatus = await prisma.jobApplicationStatus.findFirst({
    where: { status_name: 'Pending' }
  });
  
  // 4. Create application for new job
  const application = await prisma.jobApplication.create({
    data: {
      job_id: newJob.id,
      seeker_id: seekerId,
      status_id: pendingStatus.id,
      cover_letter: 'I am very interested in this position!',
      applied_at: new Date()
    }
  });
  
  console.log(`\n✅ NEW APPLICATION CREATED for: ${newJob.title}`);
  console.log(`   Application ID: ${application.id}`);
  
  // 5. Show all applications now
  const allApps = await prisma.jobApplication.findMany({
    where: { seeker_id: seekerId },
    include: { job: true, status: true }
  });
  
  console.log(`\nTotal applications now: ${allApps.length}`);
  allApps.forEach(app => {
    console.log(`   ✅ ${app.job.title} (${app.status.status_name})`);
  });
  
  console.log('\n🎉 REFRESH YOUR APPLICATIONS PAGE NOW!');
  
  await prisma.$disconnect();
}

fix().catch(console.error);
