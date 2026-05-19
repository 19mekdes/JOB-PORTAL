const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function sync() {
  console.log('=== SYNCING APPLICATIONS ===\n');
  
  const userId = 'e3cd0f14-3309-47fb-9773-584a991461dc';
  const seekerId = '7129e15c-80eb-4c2a-895f-1ab875bda54a';
  
  // Verify the link
  const seeker = await prisma.jobSeekerProfile.findFirst({
    where: { id: seekerId }
  });
  
  console.log('Seeker user_id:', seeker.user_id);
  console.log('Should be:', userId);
  
  if (seeker.user_id !== userId) {
    await prisma.jobSeekerProfile.update({
      where: { id: seekerId },
      data: { user_id: userId }
    });
    console.log('✅ Fixed the link!');
  } else {
    console.log('✅ Link is correct');
  }
  
  // Get all applications for this seeker
  const apps = await prisma.jobApplication.findMany({
    where: { seeker_id: seekerId },
    include: { job: true }
  });
  
  console.log('\n📊 Applications found: ' + apps.length);
  apps.forEach(app => {
    console.log('   - ' + app.job.title);
  });
  
  console.log('\n✅ Refresh your Applications page now!');
  
  await prisma.$disconnect();
}

sync().catch(console.error);
