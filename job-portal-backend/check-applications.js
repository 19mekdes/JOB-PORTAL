// check-applications.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  console.log('=== CHECKING DATABASE ===\n');
  
  // 1. Get all users
  const users = await prisma.user.findMany();
  console.log('Users:');
  users.forEach(u => {
    console.log(`  - ${u.email} (ID: ${u.id})`);
  });
  
  console.log('\n---');
  
  // 2. Get all seeker profiles
  const seekers = await prisma.jobSeekerProfile.findMany({
    include: { user: true }
  });
  console.log('JobSeekerProfiles:');
  seekers.forEach(s => {
    console.log(`  - Seeker ID: ${s.id}, User: ${s.user?.email}, Name: ${s.full_name}`);
  });
  
  console.log('\n---');
  
  // 3. Get all applications
  const applications = await prisma.jobApplication.findMany({
    include: { 
      seeker: { include: { user: true } },
      job: true
    }
  });
  console.log('Applications:');
  applications.forEach(a => {
    console.log(`  - App ID: ${a.id}, Seeker: ${a.seeker?.user?.email || 'NO LINK'}, Job: ${a.job?.title}`);
  });
  
  console.log('\n---');
  
  // 4. Find applications for a specific email (change this)
  const specificEmail = 'your_email@example.com'; // CHANGE THIS
  console.log(`Applications for ${specificEmail}:`);
  const myApps = applications.filter(a => a.seeker?.user?.email === specificEmail);
  if (myApps.length === 0) {
    console.log('  ❌ No applications found for this email');
    console.log('  🔧 Fix: Create a JobSeekerProfile for this user first');
  } else {
    myApps.forEach(a => {
      console.log(`  ✅ ${a.job?.title} - ${a.status?.status_name || 'Pending'}`);
    });
  }
  
  await prisma.$disconnect();
}

check().catch(console.error);