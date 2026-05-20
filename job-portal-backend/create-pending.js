const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createPendingJob() {
  try {
    console.log('Creating pending job...');
    
    // Get or create Pending status
    let pendingStatus = await prisma.jobPostStatus.findFirst({
      where: { status_name: 'Pending' }
    });
    
    if (!pendingStatus) {
      pendingStatus = await prisma.jobPostStatus.create({
        data: { status_name: 'Pending' }
      });
      console.log('Created Pending status');
    }
    
    // Get employer
    const employer = await prisma.employerProfile.findFirst();
    if (!employer) {
      console.log('ERROR: No employer found');
      return;
    }
    
    // Get industry and employment type
    const industry = await prisma.jobIndustry.findFirst();
    const employmentType = await prisma.employmentType.findFirst();
    
    if (!industry || !employmentType) {
      console.log('ERROR: Missing industry or employment type');
      return;
    }
    
    // Create pending job
    const job = await prisma.jobPost.create({
      data: {
        title: 'PENDING JOB - NEEDS ADMIN APPROVAL',
        description: 'This job is waiting for admin approval. Please review and approve or reject.',
        location: 'Addis Ababa',
        employer_id: employer.id,
        industry_id: industry.id,
        employment_type_id: employmentType.id,
        status_id: pendingStatus.id,
        is_remote: false,
        views_count: 0,
        applications_count: 0,
        created_at: new Date(),
        updated_at: new Date()
      }
    });
    
    console.log('\n========================================');
    console.log('SUCCESS: Pending job created!');
    console.log('========================================');
    console.log('Job Title:', job.title);
    console.log('Job ID:', job.id);
    console.log('Status: Pending');
    console.log('========================================\n');
    console.log('NEXT:');
    console.log('1. Go to: http://localhost:5173/admin/jobs');
    console.log('2. Click the "Pending" tab');
    console.log('3. You will see Approve and Reject buttons');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createPendingJob();