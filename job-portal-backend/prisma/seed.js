// prisma/seed.js
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // 1. Create User Types
  console.log('📝 Creating user types...')
  const userTypes = [
    { type_name: 'Job Seeker' },
    { type_name: 'Employer' },
    { type_name: 'Admin' },
    { type_name: 'Super Admin' }
  ]
  
  for (const type of userTypes) {
    await prisma.userType.upsert({
      where: { type_name: type.type_name },
      update: {},
      create: type
    })
  }
  console.log('✅ User types created')

  // 2. Create Job Post Statuses
  console.log('📝 Creating job post statuses...')
  const jobStatuses = [
    { status_name: 'Open' },
    { status_name: 'Closed' },
    { status_name: 'Draft' },
    { status_name: 'Archived' }
  ]
  
  for (const status of jobStatuses) {
    await prisma.jobPostStatus.upsert({
      where: { status_name: status.status_name },
      update: {},
      create: status
    })
  }
  console.log('✅ Job post statuses created')

  // 3. Create Job Application Statuses
  console.log('📝 Creating job application statuses...')
  const appStatuses = [
    { status_name: 'Pending' },
    { status_name: 'Reviewed' },
    { status_name: 'Shortlisted' },
    { status_name: 'Interview' },
    { status_name: 'Accepted' },
    { status_name: 'Rejected' }
  ]
  
  for (const status of appStatuses) {
    await prisma.jobApplicationStatus.upsert({
      where: { status_name: status.status_name },
      update: {},
      create: status
    })
  }
  console.log('✅ Job application statuses created')

  // 4. Create Employment Types
  console.log('📝 Creating employment types...')
  const employmentTypes = [
    { type_name: 'Full-time' },
    { type_name: 'Part-time' },
    { type_name: 'Contract' },
    { type_name: 'Remote' },
    { type_name: 'Hybrid' },
    { type_name: 'Internship' }
  ]
  
  for (const type of employmentTypes) {
    await prisma.employmentType.upsert({
      where: { type_name: type.type_name },
      update: {},
      create: type
    })
  }
  console.log('✅ Employment types created')

  // 5. Create Job Industries
  console.log('📝 Creating job industries...')
  const industries = [
    'Technology', 'Healthcare', 'Finance', 'Education', 'Retail',
    'Manufacturing', 'Construction', 'Real Estate', 'Transportation',
    'Hospitality', 'Media', 'Consulting', 'Non-profit', 'Government'
  ]
  
  for (const industry of industries) {
    await prisma.jobIndustry.upsert({
      where: { industry_name: industry },
      update: {},
      create: { industry_name: industry }
    })
  }
  console.log('✅ Job industries created')

  // Get all needed IDs
  const employerType = await prisma.userType.findFirst({
    where: { type_name: 'Employer' }
  })
  const jobSeekerType = await prisma.userType.findFirst({
    where: { type_name: 'Job Seeker' }
  })
  const adminType = await prisma.userType.findFirst({
    where: { type_name: 'Admin' }
  })
  const superAdminType = await prisma.userType.findFirst({
    where: { type_name: 'Super Admin' }
  })
  
  const openStatus = await prisma.jobPostStatus.findFirst({
    where: { status_name: 'Open' }
  })
  const pendingStatus = await prisma.jobApplicationStatus.findFirst({
    where: { status_name: 'Pending' }
  })
  const techIndustry = await prisma.jobIndustry.findFirst({
    where: { industry_name: 'Technology' }
  })
  const fullTimeType = await prisma.employmentType.findFirst({
    where: { type_name: 'Full-time' }
  })

  const hashedPassword = await bcrypt.hash('password123', 10)
  const adminPassword = await bcrypt.hash('Admin@123', 10)

  // 6. Create Employer User and Profile
  console.log('📝 Creating test employer...')
  
  let employerUser = await prisma.user.findUnique({
    where: { email: 'employer@example.com' }
  })
  
  if (!employerUser && employerType) {
    employerUser = await prisma.user.create({
      data: {
        email: 'employer@example.com',
        password: hashedPassword,
        user_type_id: employerType.id,
        created_at: new Date(),
        updated_at: new Date()
      }
    })
    console.log('✅ Employer user created with ID:', employerUser.id)
  }

  // Create employer profile
  let employerProfile = null
  if (employerUser) {
    employerProfile = await prisma.employerProfile.upsert({
      where: { user_id: employerUser.id },
      update: {},
      create: {
        user_id: employerUser.id,
        company_name: 'TechCorp Solutions',
        website: 'https://techcorp.com',
        logo_url: 'https://via.placeholder.com/150',
        industry_id: techIndustry?.id || 1,
        location: 'San Francisco, CA'
      }
    })
    console.log('✅ Employer profile created with user_id:', employerProfile.user_id)
  }

  // 7. Create Job Seeker
  console.log('📝 Creating test job seeker...')
  
  let seekerUser = await prisma.user.findUnique({
    where: { email: 'seeker@example.com' }
  })
  
  if (!seekerUser && jobSeekerType) {
    seekerUser = await prisma.user.create({
      data: {
        email: 'seeker@example.com',
        password: hashedPassword,
        user_type_id: jobSeekerType.id,
        created_at: new Date(),
        updated_at: new Date()
      }
    })
    
    await prisma.jobSeekerProfile.create({
      data: {
        user_id: seekerUser.id,
        full_name: 'Test Job Seeker',
        phone: '+1 234 567 8900',
        location: 'New York, NY',
        skills: ['React', 'TypeScript', 'Node.js', 'Python'],
        resume_url: null
      }
    })
    console.log('✅ Test job seeker created')
  }

  // 8. Create Admin
  console.log('📝 Creating admin user...')
  
  let adminUser = await prisma.user.findUnique({
    where: { email: 'admin@jobportal.com' }
  })
  
  if (!adminUser && adminType) {
    adminUser = await prisma.user.create({
      data: {
        email: 'admin@jobportal.com',
        password: adminPassword,
        user_type_id: adminType.id,
        created_at: new Date(),
        updated_at: new Date()
      }
    })
    console.log('✅ Admin user created')
  }

  // 9. Create Super Admin
  console.log('📝 Creating super admin...')
  
  let superAdminUser = await prisma.user.findUnique({
    where: { email: 'superadmin@jobportal.com' }
  })
  
  if (!superAdminUser && superAdminType) {
    superAdminUser = await prisma.user.create({
      data: {
        email: 'superadmin@jobportal.com',
        password: adminPassword,
        user_type_id: superAdminType.id,
        created_at: new Date(),
        updated_at: new Date()
      }
    })
    console.log('✅ Super admin created')
  }

  // 10. Create Sample Jobs - FIXED VERSION
  console.log('📝 Creating sample jobs...')
  
  // Get the employer profile again to ensure we have it
  const employerForJobs = await prisma.employerProfile.findFirst({
    where: { user: { email: 'employer@example.com' } }
  })
  
  console.log('Employer profile found:', employerForJobs ? 'Yes' : 'No')
  if (employerForJobs) {
    console.log('Employer user_id:', employerForJobs.user_id)
  }
  
  if (employerForJobs && openStatus && techIndustry && fullTimeType) {
    const existingJobs = await prisma.jobPost.count()
    console.log(`Existing jobs count: ${existingJobs}`)
    
    if (existingJobs === 0) {
      const sampleJobs = [
        {
          id: '1',
          title: 'Senior React Developer',
          description: 'We are looking for an experienced React developer to join our team. You will be building modern web applications using React, TypeScript, and Next.js.',
          employer_id: employerForJobs.user_id,  // Use the user_id from employer profile
          industry_id: techIndustry.id,
          employment_type_id: fullTimeType.id,
          salary_range: '$120,000 - $160,000',
          status_id: openStatus.id,
          location: 'Remote',
          created_at: new Date()
        },
        {
          id: '2',
          title: 'Full Stack Engineer',
          description: 'Join our engineering team to build scalable web applications. Looking for someone with experience in both frontend and backend development.',
          employer_id: employerForJobs.user_id,
          industry_id: techIndustry.id,
          employment_type_id: fullTimeType.id,
          salary_range: '$140,000 - $180,000',
          status_id: openStatus.id,
          location: 'San Francisco, CA',
          created_at: new Date()
        },
        {
          id: '3',
          title: 'Backend Developer',
          description: 'Looking for a backend specialist to work on our core API. Experience with Node.js, Python, or Go required.',
          employer_id: employerForJobs.user_id,
          industry_id: techIndustry.id,
          employment_type_id: fullTimeType.id,
          salary_range: '$130,000 - $170,000',
          status_id: openStatus.id,
          location: 'Remote',
          created_at: new Date()
        }
      ]

      for (const job of sampleJobs) {
        try {
          const created = await prisma.jobPost.create({
            data: job
          })
          console.log(`  Created job: ${created.title} (ID: ${created.id})`)
        } catch (error) {
          console.error(`  Failed to create job ${job.title}:`, error.message)
        }
      }
      console.log(`✅ Sample jobs created`)
    } else {
      console.log(`⚠️ ${existingJobs} jobs already exist, skipping job creation`)
    }
  } else {
    console.log('❌ Missing required data for job creation:')
    if (!employerForJobs) console.log('  - Employer profile not found')
    if (!openStatus) console.log('  - Open status not found')
    if (!techIndustry) console.log('  - Technology industry not found')
    if (!fullTimeType) console.log('  - Full-time employment type not found')
  }

  console.log('\n🎉 Seeding completed successfully!')
  console.log('\n📋 Login Credentials:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('👨‍💼 Job Seeker:   seeker@example.com / password123')
  console.log('🏢 Employer:     employer@example.com / password123')
  console.log('👮 Admin:        admin@jobportal.com / Admin@123')
  console.log('👑 Super Admin:  superadmin@jobportal.com / Admin@123')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

main()
  .catch(e => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })