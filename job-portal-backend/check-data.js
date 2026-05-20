const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  console.log('=== Checking Database Data ===\n');
  
  // Check Industries
  const industries = await prisma.jobIndustry.findMany();
  console.log('Industries in DB:');
  if (industries.length === 0) {
    console.log('  No industries found!');
  } else {
    industries.forEach(i => {
      console.log('  ID: ' + i.id + ' - Name: ' + i.industry_name);
    });
  }
  
  console.log('\n');
  
  // Check Employment Types
  const employmentTypes = await prisma.employmentType.findMany();
  console.log('Employment Types in DB:');
  if (employmentTypes.length === 0) {
    console.log('  No employment types found!');
  } else {
    employmentTypes.forEach(e => {
      console.log('  ID: ' + e.id + ' - Name: ' + e.type_name);
    });
  }
  
  console.log('\n');
  
  // Check Jobs with their relations
  const jobs = await prisma.jobPost.findMany({
    take: 5,
    include: {
      industry: true,
      employment_type: true
    }
  });
  
  console.log('Sample Jobs (first 5):');
  jobs.forEach(job => {
    console.log('  Job: ' + job.title);
    console.log('    Industry: ' + (job.industry?.industry_name || 'NULL'));
    console.log('    Employment Type: ' + (job.employment_type?.type_name || 'NULL'));
    console.log('  ---');
  });
  
  await prisma.$disconnect();
}

check();