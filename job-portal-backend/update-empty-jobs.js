const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateEmptyJobs() {
  const emptyJobs = [
    { id: 'b749412e-4457-4377-bfcb-038a0048a73d', title: 'project management' },
    { id: '47c9fd62-a763-440b-8dc5-4c4eaf46ae73', title: 'hgfds' },
    { id: 'ea0090be-ac95-4232-a74f-d11d0fe249b8', title: 'fddsaewe' },
    { id: '7f509f48-d162-406c-8d3f-ead4487b2af2', title: 'fffffffff' },
    { id: 'fe94a04e-e145-4380-a87f-ae635d8eaad0', title: 'PENDING JOB - NEEDS ADMIN APPROVAL' },
    { id: '53ccee8d-fd0e-4e6b-91ee-2c35ef340ad3', title: 'Video Editor' },
    { id: 'd2ac2423-629d-449d-9a2f-853ea38a31b3', title: 'Graphics\' design' }
  ];
  
  let updatedCount = 0;
  
  for (const job of emptyJobs) {
    const updated = await prisma.jobPost.update({
      where: { id: job.id },
      data: {
        requirements: '• Relevant experience in the field\n• Strong problem-solving skills\n• Excellent communication skills\n• Team player mentality\n• Ability to work independently',
        benefits: '• Competitive salary\n• Health insurance coverage\n• Paid time off\n• Professional development opportunities\n• Friendly work environment'
      }
    });
    updatedCount++;
    console.log('✓ Updated: ' + updated.title);
  }
  
  console.log('\n✅ Updated ' + updatedCount + ' jobs with requirements and benefits');
  console.log('\nNow refresh your Job Details page to see the changes!');
}

updateEmptyJobs();