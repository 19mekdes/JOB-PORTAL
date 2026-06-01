// check-data.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  console.log('=== COMPLETE DATABASE CHECK ===\n');
  
  // Check all jobs with employer info
  const jobs = await prisma.jobPost.findMany({
    include: {
      employer: {
        include: {
          user: true
        }
      },
      status: true
    }
  });
  
  console.log(`Total Jobs: ${jobs.length}`);
  for (const job of jobs) {
    console.log(`  - ${job.title}`);
    console.log(`    Employer: ${job.employer?.company_name || 'NO EMPLOYER!'}`);
    console.log(`    Employer ID: ${job.employer_id}`);
    console.log(`    Status: ${job.status?.status_name}`);
    console.log(`    Applications: ${job.applications_count || 0}`);
    console.log(`    Views: ${job.views_count || 0}`);
    console.log('  ---');
  }
  
  // Check applications
  const applications = await prisma.jobApplication.findMany({
    include: {
      job: true,
      seeker: {
        include: {
          user: true
        }
      },
      status: true
    }
  });
  
  console.log(`\nTotal Applications: ${applications.length}`);
  for (const app of applications) {
    console.log(`  - Application for: ${app.job?.title || 'Unknown Job'}`);
    console.log(`    Seeker: ${app.seeker?.full_name || app.seeker?.user?.email || 'Unknown'}`);
    console.log(`    Status: ${app.status?.status_name}`);
    console.log('  ---');
  }
  
  // Check employer profiles with job counts
  const employers = await prisma.employerProfile.findMany({
    include: {
      user: true,
      jobs: true
    }
  });
  
  console.log(`\nEmployer Profiles: ${employers.length}`);
  for (const emp of employers) {
    console.log(`  - ${emp.company_name}`);
    console.log(`    Email: ${emp.user?.email}`);
    console.log(`    Jobs posted: ${emp.jobs.length}`);
    for (const job of emp.jobs) {
      console.log(`      * ${job.title} (${job.applications_count || 0} applications)`);
    }
  }
  
  // Check seeker profiles with application counts
  const seekers = await prisma.seekerProfile.findMany({
    include: {
      user: true,
      applications: true
    }
  });
  
  console.log(`\nSeeker Profiles: ${seekers.length}`);
  for (const seek of seekers) {
    console.log(`  - ${seek.full_name || seek.user?.email}`);
    console.log(`    Applications submitted: ${seek.applications.length}`);
  }
  
  await prisma.$disconnect();
}

check();