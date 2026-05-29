const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createAuditLogs() {
  try {
    // Get super admin user
    const admin = await prisma.user.findFirst({
      where: {
        user_type: { type_name: 'Super Admin' }
      }
    });

    if (!admin) {
      console.log('No Super Admin found!');
      return;
    }

    console.log(`Creating audit logs for admin: ${admin.email}`);

    const actions = [
      { action: 'LOGIN', target_type: 'auth', details: { message: 'Successful login' } },
      { action: 'CREATE_ADMIN', target_type: 'User', details: { full_name: 'John Doe', role: 'Admin' } },
      { action: 'UPDATE_SETTINGS', target_type: 'System', details: { setting: 'site_name' } },
      { action: 'VERIFY_COMPANY', target_type: 'Company', details: { company_name: 'TechCorp' } },
      { action: 'APPROVE_JOB', target_type: 'Job', details: { job_title: 'Developer' } },
      { action: 'SUSPEND_USER', target_type: 'User', details: { user_email: 'baduser@example.com' } },
      { action: 'DELETE_ADMIN', target_type: 'User', details: { deleted_admin: 'oldadmin@example.com' } },
      { action: 'RESET_PASSWORD', target_type: 'User', details: { user_email: 'forgot@example.com' } },
      { action: 'BULK_DELETE_JOBS', target_type: 'Job', details: { count: 5 } },
      { action: 'EXPORT_DATA', target_type: 'Analytics', details: { format: 'CSV' } }
    ];

    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      await prisma.auditLog.create({
        data: {
          admin_id: admin.id,
          action: action.action,
          target_type: action.target_type,
          target_id: `${action.target_type.toLowerCase()}_${i + 1}`,
          details: action.details,
          ip_address: '192.168.1.100',
          created_at: new Date(Date.now() - i * 86400000) // Different days
        }
      });
      console.log(`Created: ${action.action}`);
    }

    const count = await prisma.auditLog.count();
    console.log(`\n✅ Total audit logs: ${count}`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAuditLogs();