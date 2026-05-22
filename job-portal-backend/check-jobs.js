const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findAllJobs() {
  const jobs = await prisma.jobPost.findMany({
    select: { id: true, title: true, requirements: true, benefits: true }
  });
  
  console.log('All jobs in database:');
  console.log('========================');
  
  jobs.forEach(job => {
    console.log('ID: ' + job.id);
    console.log('Title: ' + job.title);
    console.log('Requirements: ' + (job.requirements ? 'Has data' : 'Empty'));
    console.log('Benefits: ' + (job.benefits ? 'Has data' : 'Empty'));
    console.log('---');
  });
}

findAllJobs();