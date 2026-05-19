// create-profile.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createProfile() {
  // CHANGE THIS TO YOUR EMAIL
  const YOUR_EMAIL = 'mekdes@example.com'; // ← CHANGE THIS!
  
  console.log(`Looking for user with email: ${YOUR_EMAIL}`);
  
  const user = await prisma.user.findUnique({
    where: { email: YOUR_EMAIL }
  });
  
  if (!user) {
    console.log('❌ User not found!');
    console.log('Available users:');
    const allUsers = await prisma.user.findMany();
    allUsers.forEach(u => console.log(`  - ${u.email}`));
    return;
  }
  
  console.log('✅ User found:', user.id);
  
  // Check if profile exists
  const existing = await prisma.jobSeekerProfile.findUnique({
    where: { user_id: user.id }
  });
  
  if (existing) {
    console.log('✅ Profile already exists!', existing.id);
    return;
  }
  
  // Create profile
  const profile = await prisma.jobSeekerProfile.create({
    data: {
      user_id: user.id,
      full_name: 'Job Seeker',
      skills: ['JavaScript', 'React', 'Node.js'],
      created_at: new Date(),
      updated_at: new Date()
    }
  });
  
  console.log('✅ Profile created successfully!', profile.id);
  console.log('🎉 Now go to your app and apply for a job!');
}

createProfile().catch(console.error);