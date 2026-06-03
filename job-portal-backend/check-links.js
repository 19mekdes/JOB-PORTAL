// check-links.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  console.log('=== CHECKING USER-PROFILE LINKS ===\n');
  
  // Check employer: mekdiwale59@gmail.com
  const employer = await prisma.user.findFirst({
    where: { email: 'mekdiwale59@gmail.com' },
    include: { employer_profile: true }
  });
  
  console.log('Employer:', employer?.email);
  console.log('Has employer_profile:', !!employer?.employer_profile);
  console.log('Employer Profile ID:', employer?.employer_profile?.id);
  
  if (employer?.employer_profile) {
    const jobs = await prisma.jobPost.findMany({
      where: { employer_id: employer.employer_profile.id }
    });
    console.log('Jobs found:', jobs.length);
    jobs.forEach(j => console.log('  -', j.title));
  }
  
  // Check job seeker: mekdesw60@gmail.com
  const seeker = await prisma.user.findFirst({
    where: { email: 'mekdesw60@gmail.com' },
    include: { seeker_profile: true }
  });
  
  console.log('\nJob Seeker:', seeker?.email);
  console.log('Has seeker_profile:', !!seeker?.seeker_profile);
  console.log('Seeker Profile ID:', seeker?.seeker_profile?.id);
  
  if (seeker?.seeker_profile) {
    const apps = await prisma.jobApplication.findMany({
      where: { seeker_id: seeker.seeker_profile.id }
    });
    console.log('Applications found:', apps.length);
  }
  
  await prisma.$disconnect();
}

check();