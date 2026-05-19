const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getMyApplications = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('=== API CALLED ===');
    console.log('User ID:', userId);
    
    // Find the seeker profile for this user
    const seeker = await prisma.jobSeekerProfile.findFirst({
      where: { user_id: userId }
    });
    
    if (!seeker) {
      console.log('No seeker profile, returning empty');
      return res.json({ success: true, data: [], count: 0 });
    }
    
    console.log('Seeker ID:', seeker.id);
    
    // Get all applications for this seeker
    const applications = await prisma.jobApplication.findMany({
      where: { seeker_id: seeker.id },
      include: {
        job: {
          include: {
            employer: true
          }
        },
        status: true
      },
      orderBy: { applied_at: 'desc' }
    });
    
    console.log(`Found ${applications.length} applications`);
    
    res.json({
      success: true,
      data: applications,
      count: applications.length
    });
  } catch (error) {
    console.error('Server error:', error);
    res.json({ success: true, data: [], count: 0 });
  }
};

module.exports = { getMyApplications };
