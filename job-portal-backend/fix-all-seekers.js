// fix-all-seekers.js
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function fixAllSeekers() {
  try {
    console.log('🔧 ========== FIXING ALL JOB SEEKER PROFILES ==========\n')
    
    // Get all job seekers
    const jobSeekers = await prisma.user.findMany({
      where: {
        user_type: {
          type_name: 'Job Seeker'
        }
      },
      include: {
        seeker_profile: true
      }
    })
    
    console.log(`Found ${jobSeekers.length} job seeker(s)\n`)
    
    for (const seeker of jobSeekers) {
      console.log(`📝 Processing: ${seeker.email}`)
      
      // Default profile data based on email
      let profileData = {
        title: 'Job Seeker',
        linkedin_url: null,
        github_url: null,
        portfolio_url: null,
        availability: 'immediate'
      }
      
      // Customize based on email
      if (seeker.email === 'seeker@example.com') {
        profileData = {
          title: 'Demo Job Seeker',
          linkedin_url: 'https://linkedin.com/in/demoseeker',
          github_url: 'https://github.com/demoseeker',
          portfolio_url: 'https://demoseeker.com',
          availability: 'immediate'
        }
      } else if (seeker.email === 'test@example.com') {
        profileData = {
          title: 'Test User',
          linkedin_url: 'https://linkedin.com/in/testuser',
          github_url: 'https://github.com/testuser',
          portfolio_url: 'https://testuser.com',
          availability: 'two_weeks'
        }
      } else if (seeker.email === 'mekdesw60@gmail.com') {
        profileData = {
          title: 'Senior Software Engineer',
          linkedin_url: 'https://linkedin.com/in/mekdeswale',
          github_url: 'https://github.com/mekdeswale',
          portfolio_url: 'https://mekdeswale.com',
          availability: 'immediate'
        }
      }
      
      // Update or create profile
      let updatedProfile
      if (seeker.seeker_profile) {
        updatedProfile = await prisma.jobSeekerProfile.update({
          where: { id: seeker.seeker_profile.id },
          data: profileData
        })
        console.log(`  ✅ Updated profile for ${seeker.email}`)
      } else {
        updatedProfile = await prisma.jobSeekerProfile.create({
          data: {
            user_id: seeker.id,
            full_name: seeker.full_name || seeker.email.split('@')[0],
            skills: [],
            ...profileData
          }
        })
        console.log(`  ✅ Created profile for ${seeker.email}`)
      }
      
      console.log(`     Title: ${updatedProfile.title}`)
      console.log(`     LinkedIn: ${updatedProfile.linkedin_url || 'Not set'}`)
      console.log(`     GitHub: ${updatedProfile.github_url || 'Not set'}`)
      console.log(`     Portfolio: ${updatedProfile.portfolio_url || 'Not set'}`)
      console.log(`     Availability: ${updatedProfile.availability || 'Not set'}`)
      console.log('')
    }
    
    console.log('✅ ========== ALL JOB SEEKERS FIXED ==========')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixAllSeekers()