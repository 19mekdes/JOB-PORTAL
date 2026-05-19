// setup-jobs.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function setupJobs() {
  try {
    console.log('🚀 Setting up job portal with your schema...\n');

    // ==================== CREATE USER TYPES ====================
    console.log('📝 Creating user types...');
    const userTypes = [
      { type_name: 'Job Seeker' },
      { type_name: 'Employer' },
      { type_name: 'Admin' },
      { type_name: 'Super Admin' }
    ];
    
    for (const type of userTypes) {
      await prisma.userType.upsert({
        where: { type_name: type.type_name },
        update: {},
        create: type
      });
    }
    console.log('✅ User types created\n');

    // ==================== CREATE JOB STATUSES ====================
    console.log('📝 Creating job statuses...');
    const jobStatuses = [
      { status_name: 'Open' },
      { status_name: 'Closed' },
      { status_name: 'Draft' },
      { status_name: 'Archived' }
    ];
    
    for (const status of jobStatuses) {
      await prisma.jobPostStatus.upsert({
        where: { status_name: status.status_name },
        update: {},
        create: status
      });
    }
    console.log('✅ Job statuses created\n');

    // ==================== CREATE APPLICATION STATUSES ====================
    console.log('📝 Creating application statuses...');
    const appStatuses = [
      { status_name: 'Pending' },
      { status_name: 'Reviewed' },
      { status_name: 'Shortlisted' },
      { status_name: 'Interview' },
      { status_name: 'Accepted' },
      { status_name: 'Rejected' }
    ];
    
    for (const status of appStatuses) {
      await prisma.jobApplicationStatus.upsert({
        where: { status_name: status.status_name },
        update: {},
        create: status
      });
    }
    console.log('✅ Application statuses created\n');

    // ==================== CREATE EMPLOYMENT TYPES ====================
    console.log('📝 Creating employment types...');
    const employmentTypes = [
      { type_name: 'Full-time' },
      { type_name: 'Part-time' },
      { type_name: 'Contract' },
      { type_name: 'Remote' },
      { type_name: 'Hybrid' },
      { type_name: 'Internship' }
    ];
    
    for (const type of employmentTypes) {
      await prisma.employmentType.upsert({
        where: { type_name: type.type_name },
        update: {},
        create: type
      });
    }
    console.log('✅ Employment types created\n');

    // ==================== CREATE INDUSTRIES ====================
    console.log('📝 Creating industries...');
    const industries = [
      'Technology', 'Healthcare', 'Finance', 'Education', 'Retail',
      'Manufacturing', 'Construction', 'Real Estate', 'Transportation',
      'Hospitality', 'Media', 'Consulting', 'Non-profit', 'Government'
    ];
    
    for (const industry of industries) {
      await prisma.jobIndustry.upsert({
        where: { industry_name: industry },
        update: {},
        create: { industry_name: industry }
      });
    }
    console.log('✅ Industries created\n');

    // Get required IDs
    const employerType = await prisma.userType.findFirst({ where: { type_name: 'Employer' } });
    const jobSeekerType = await prisma.userType.findFirst({ where: { type_name: 'Job Seeker' } });
    const adminType = await prisma.userType.findFirst({ where: { type_name: 'Admin' } });
    const superAdminType = await prisma.userType.findFirst({ where: { type_name: 'Super Admin' } });
    const openStatus = await prisma.jobPostStatus.findFirst({ where: { status_name: 'Open' } });
    const techIndustry = await prisma.jobIndustry.findFirst({ where: { industry_name: 'Technology' } });
    const fullTime = await prisma.employmentType.findFirst({ where: { type_name: 'Full-time' } });

    const hashedPassword = await bcrypt.hash('password123', 10);
    const adminPassword = await bcrypt.hash('Admin@123', 10);

    // ==================== CREATE EMPLOYER ====================
    console.log('🏢 Creating employer...');
    
    let employerUser = await prisma.user.findUnique({
      where: { email: 'employer@techcorp.com' }
    });
    
    if (!employerUser) {
      employerUser = await prisma.user.create({
        data: {
          email: 'employer@techcorp.com',
          password: hashedPassword,
          user_type_id: employerType.id,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        }
      });
      console.log('✅ Employer user created: employer@techcorp.com / password123');
    }
    
    let employerProfile = await prisma.employerProfile.findUnique({
      where: { user_id: employerUser.id }
    });
    
    if (!employerProfile) {
      employerProfile = await prisma.employerProfile.create({
        data: {
          user_id: employerUser.id,
          company_name: 'TechCorp Solutions',
          company_description: 'Leading technology company providing innovative solutions worldwide.',
          website: 'https://techcorp.com',
          logo_url: 'https://via.placeholder.com/150',
          industry_id: techIndustry.id,
          company_size: '51-200',
          location: 'San Francisco, CA'
        }
      });
      console.log('✅ Employer profile created with ID:', employerProfile.id);
    } else {
      console.log('✅ Employer profile already exists with ID:', employerProfile.id);
    }

    // ==================== CREATE JOB SEEKER ====================
    console.log('\n👨‍💼 Creating job seeker...');
    
    let seekerUser = await prisma.user.findUnique({
      where: { email: 'seeker@example.com' }
    });
    
    if (!seekerUser) {
      seekerUser = await prisma.user.create({
        data: {
          email: 'seeker@example.com',
          password: hashedPassword,
          user_type_id: jobSeekerType.id,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        }
      });
      
      await prisma.jobSeekerProfile.create({
        data: {
          user_id: seekerUser.id,
          full_name: 'John Seeker',
          phone: '+1 (555) 123-4567',
          location: 'New York, NY',
          skills: ['React', 'TypeScript', 'Node.js', 'Python', 'PostgreSQL'],
          experience: '5 years',
          education: "Bachelor's in Computer Science"
        }
      });
      console.log('✅ Job seeker created: seeker@example.com / password123');
    } else {
      console.log('✅ Job seeker already exists');
    }

    // ==================== CREATE ADMIN ====================
    console.log('\n👮 Creating admin...');
    
    let adminUser = await prisma.user.findUnique({
      where: { email: 'admin@jobportal.com' }
    });
    
    if (!adminUser) {
      adminUser = await prisma.user.create({
        data: {
          email: 'admin@jobportal.com',
          password: adminPassword,
          user_type_id: adminType.id,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        }
      });
      console.log('✅ Admin created: admin@jobportal.com / Admin@123');
    } else {
      console.log('✅ Admin already exists');
    }

    // ==================== CREATE SUPER ADMIN ====================
    console.log('\n👑 Creating super admin...');
    
    let superAdminUser = await prisma.user.findUnique({
      where: { email: 'superadmin@jobportal.com' }
    });
    
    if (!superAdminUser) {
      superAdminUser = await prisma.user.create({
        data: {
          email: 'superadmin@jobportal.com',
          password: adminPassword,
          user_type_id: superAdminType.id,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        }
      });
      console.log('✅ Super admin created: superadmin@jobportal.com / Admin@123');
    } else {
      console.log('✅ Super admin already exists');
    }

    // ==================== CREATE JOBS ====================
    console.log('\n💼 Creating jobs posted by employer...');
    
    // Clear existing jobs
    const deleted = await prisma.jobPost.deleteMany();
    console.log(`🗑️  Cleared ${deleted.count} existing jobs`);
    
    const jobs = [
      {
        title: 'Senior React Developer',
        description: `We are seeking an experienced React Developer to join our dynamic team.

Key Responsibilities:
- Develop modern web applications using React.js
- Collaborate with cross-functional teams
- Optimize applications for maximum performance
- Mentor junior developers

Requirements:
- 5+ years of React experience
- Strong TypeScript skills
- Experience with state management (Redux/Zustand)
- Knowledge of modern frontend tools`,
        requirements: '5+ years React, TypeScript, Redux, Node.js',
        benefits: 'Health insurance, 401k, Remote work, Stock options',
        location: 'Remote',
        salary_min: 120000,
        salary_max: 160000,
        salary_range: '$120,000 - $160,000',
        is_remote: true
      },
      {
        title: 'Full Stack Engineer',
        description: `Join our engineering team to build scalable web applications.

Responsibilities:
- Build end-to-end features
- Design RESTful APIs
- Work on both frontend and backend
- Ensure code quality and testing

Requirements:
- 3+ years of full-stack experience
- Proficiency in React and Node.js
- Experience with PostgreSQL
- Understanding of cloud services`,
        requirements: 'React, Node.js, PostgreSQL, AWS',
        benefits: 'Flexible hours, Learning budget, Great culture',
        location: 'San Francisco, CA',
        salary_min: 140000,
        salary_max: 180000,
        salary_range: '$140,000 - $180,000',
        is_remote: false
      },
      {
        title: 'Backend Developer',
        description: `Looking for a backend specialist to work on our core API infrastructure.

Key Responsibilities:
- Design and implement scalable APIs
- Optimize database queries
- Handle authentication and authorization
- Monitor system performance

Requirements:
- 4+ years backend experience
- Strong Node.js/Python skills
- Experience with PostgreSQL/MongoDB
- Knowledge of caching strategies`,
        requirements: 'Node.js, Python, PostgreSQL, Redis',
        benefits: 'Remote work, Competitive salary, Growth opportunities',
        location: 'Remote',
        salary_min: 130000,
        salary_max: 170000,
        salary_range: '$130,000 - $170,000',
        is_remote: true
      },
      {
        title: 'DevOps Engineer',
        description: `Seeking a DevOps engineer to manage our cloud infrastructure.

Responsibilities:
- Maintain AWS infrastructure
- Implement CI/CD pipelines
- Monitor system health
- Automate deployment processes

Requirements:
- 3+ years DevOps experience
- AWS certification preferred
- Experience with Docker/Kubernetes
- Knowledge of Infrastructure as Code`,
        requirements: 'AWS, Docker, Kubernetes, Terraform, Jenkins',
        benefits: 'Remote-first culture, Professional development budget',
        location: 'Remote',
        salary_min: 150000,
        salary_max: 190000,
        salary_range: '$150,000 - $190,000',
        is_remote: true
      },
      {
        title: 'Product Manager',
        description: `Looking for a product manager to lead our product development.

Key Responsibilities:
- Define product roadmap
- Gather requirements from stakeholders
- Work with engineering teams
- Analyze market trends

Requirements:
- 4+ years product management
- Technical background preferred
- Excellent communication skills
- Data-driven decision making`,
        requirements: 'Product management, Agile, JIRA, Data analysis',
        benefits: 'Equity, Flexible hours, Health benefits',
        location: 'New York, NY',
        salary_min: 130000,
        salary_max: 170000,
        salary_range: '$130,000 - $170,000',
        is_remote: false
      },
      {
        title: 'UI/UX Designer',
        description: `Creative designer wanted for our product team.

Responsibilities:
- Create user-centered designs
- Conduct user research
- Create wireframes and prototypes
- Collaborate with developers

Requirements:
- 3+ years UI/UX experience
- Proficiency in Figma/Sketch
- Portfolio of past work
- Understanding of responsive design`,
        requirements: 'Figma, Adobe XD, User research, Prototyping',
        benefits: 'Creative environment, Flexible schedule',
        location: 'Remote',
        salary_min: 90000,
        salary_max: 120000,
        salary_range: '$90,000 - $120,000',
        is_remote: true
      },
      {
        title: 'Data Scientist',
        description: `Join our data team to derive insights from large datasets.

Key Responsibilities:
- Analyze complex datasets
- Build predictive models
- Create data visualizations
- Collaborate with product teams

Requirements:
- Master's in Data Science or related
- Experience with Python/R
- Knowledge of machine learning
- Strong statistical background`,
        requirements: 'Python, SQL, Machine Learning, Statistics, TensorFlow',
        benefits: 'Research budget, Conference attendance',
        location: 'Remote',
        salary_min: 140000,
        salary_max: 180000,
        salary_range: '$140,000 - $180,000',
        is_remote: true
      },
      {
        title: 'Technical Support Engineer',
        description: `Looking for a technical support engineer to help our customers.

Responsibilities:
- Troubleshoot technical issues
- Respond to customer tickets
- Document solutions
- Work with engineering team

Requirements:
- 2+ years technical support
- Understanding of web technologies
- Excellent communication
- Problem-solving skills`,
        requirements: 'Customer support, Troubleshooting, Communication',
        benefits: 'Training provided, Career growth',
        location: 'Austin, TX',
        salary_min: 60000,
        salary_max: 80000,
        salary_range: '$60,000 - $80,000',
        is_remote: false
      }
    ];

    let createdCount = 0;
    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i];
      const jobId = String(i + 1);
      
      await prisma.jobPost.create({
        data: {
          id: jobId,
          title: job.title,
          description: job.description,
          requirements: job.requirements,
          benefits: job.benefits,
          employer_id: employerProfile.id,  // Using EmployerProfile.id (UUID)
          industry_id: techIndustry.id,
          employment_type_id: fullTime.id,
          salary_range: job.salary_range,
          salary_min: job.salary_min,
          salary_max: job.salary_max,
          status_id: openStatus.id,
          location: job.location,
          is_remote: job.is_remote,
          created_at: new Date(),
          views_count: 0,
          applications_count: 0
        }
      });
      createdCount++;
      console.log(`  ✅ Job ${jobId}: ${job.title} - ${job.location}`);
    }

    console.log(`\n✅ Successfully created ${createdCount} jobs!`);
    
    // Verify
    const totalJobs = await prisma.jobPost.count();
    console.log(`\n📊 Total jobs in database: ${totalJobs}`);
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 SETUP COMPLETE!');
    console.log('='.repeat(60));
    console.log('\n📋 ACCESS CREDENTIALS:');
    console.log('─────────────────────────────────────────');
    console.log('👨‍💼 Job Seeker:   seeker@example.com / password123');
    console.log('🏢 Employer:     employer@techcorp.com / password123');
    console.log('👮 Admin:        admin@jobportal.com / Admin@123');
    console.log('👑 Super Admin:  superadmin@jobportal.com / Admin@123');
    console.log('─────────────────────────────────────────');
    console.log('\n🔗 Try these URLs in your frontend:');
    for (let i = 1; i <= Math.min(totalJobs, 5); i++) {
      console.log(`  http://localhost:5173/jobs/${i}`);
    }
    
    // Show API test commands
    console.log('\n📡 Test with curl:');
    console.log('  curl http://localhost:5000/api/jobs');
    console.log('  curl http://localhost:5000/api/jobs/1');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

setupJobs();