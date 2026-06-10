// backend/src/controllers/settingsController.ts
import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Get system settings
export const getSettings = async (req: Request, res: Response) => {
  try {
    let settings = await prisma.systemSetting.findFirst()
    
    if (!settings) {
      // Create default settings if none exist
      settings = await prisma.systemSetting.create({
        data: {
          site_name: 'JobPortal Ethiopia',
          site_description: 'Find your dream job in Ethiopia',
          contact_email: 'admin@jobportal.com',
          support_email: 'support@jobportal.com',
          enable_registration: true,
          require_email_verification: true,
          auto_approve_employers: false,
          require_job_approval: true,
          job_expiry_days: 30,
          max_job_posts_per_employer: 10,
          require_resume_upload: true,
          notify_employer_on_application: true,
          password_min_length: 6,
          maintenance_mode: false,
          smtp_host: 'smtp.gmail.com',
          smtp_port: 587,
          smtp_user: '',
          smtp_password: '',
          from_email: '',
          admin_alert_emails: ''
        }
      })
    }
    
    // Map fields to match frontend interface
    const mappedSettings = {
      site_name: settings.site_name,
      site_description: settings.site_description,
      contact_email: settings.contact_email,
      support_email: settings.support_email,
      enable_registration: settings.enable_registration,
      email_verification: settings.require_email_verification,
      auto_approve_employers: settings.auto_approve_employers,
      require_job_approval: settings.require_job_approval,
      job_expiry_days: settings.job_expiry_days,
      max_free_jobs_per_employer: settings.max_job_posts_per_employer,
      require_resume_upload: settings.require_resume_upload,
      notify_on_application: settings.notify_employer_on_application,
      password_min_length: settings.password_min_length,
      maintenance_mode: settings.maintenance_mode,
      admin_alert_emails: settings.admin_alert_emails,
      smtp_host: settings.smtp_host,
      smtp_port: settings.smtp_port,
      smtp_user: settings.smtp_user,
      smtp_password: settings.smtp_password,
      from_email: settings.from_email
    }
    
    res.json({ success: true, data: mappedSettings })
  } catch (error) {
    console.error('Error fetching settings:', error)
    res.status(500).json({ success: false, message: (error as Error).message })
  }
}

// Update system settings
export const updateSettings = async (req: Request, res: Response) => {
  try {
    const settings = await prisma.systemSetting.findFirst()
    
    if (!settings) {
      const newSettings = await prisma.systemSetting.create({
        data: {
          site_name: req.body.site_name || 'JobPortal',
          site_description: req.body.site_description || '',
          contact_email: req.body.contact_email || 'admin@jobportal.com',
          support_email: req.body.support_email || 'support@jobportal.com',
          enable_registration: req.body.enable_registration ?? true,
          require_email_verification: req.body.email_verification ?? true,
          auto_approve_employers: req.body.auto_approve_employers ?? false,
          require_job_approval: req.body.require_job_approval ?? true,
          job_expiry_days: req.body.job_expiry_days ?? 30,
          max_job_posts_per_employer: req.body.max_free_jobs_per_employer ?? 10,
          require_resume_upload: req.body.require_resume_upload ?? true,
          notify_employer_on_application: req.body.notify_on_application ?? true,
          password_min_length: req.body.password_min_length ?? 6,
          maintenance_mode: req.body.maintenance_mode ?? false,
          admin_alert_emails: req.body.admin_alert_emails || '',
          smtp_host: req.body.smtp_host || 'smtp.gmail.com',
          smtp_port: req.body.smtp_port || 587,
          smtp_user: req.body.smtp_user || '',
          smtp_password: req.body.smtp_password || '',
          from_email: req.body.from_email || ''
        }
      })
      return res.json({ success: true, data: newSettings })
    }
    
    const updated = await prisma.systemSetting.update({
      where: { id: settings.id },
      data: {
        site_name: req.body.site_name,
        site_description: req.body.site_description,
        contact_email: req.body.contact_email,
        support_email: req.body.support_email,
        enable_registration: req.body.enable_registration,
        require_email_verification: req.body.email_verification,
        auto_approve_employers: req.body.auto_approve_employers,
        require_job_approval: req.body.require_job_approval,
        job_expiry_days: req.body.job_expiry_days,
        max_job_posts_per_employer: req.body.max_free_jobs_per_employer,
        require_resume_upload: req.body.require_resume_upload,
        notify_employer_on_application: req.body.notify_on_application,
        password_min_length: req.body.password_min_length,
        maintenance_mode: req.body.maintenance_mode,
        admin_alert_emails: req.body.admin_alert_emails,
        smtp_host: req.body.smtp_host,
        smtp_port: req.body.smtp_port,
        smtp_user: req.body.smtp_user,
        smtp_password: req.body.smtp_password,
        from_email: req.body.from_email
      }
    })
    
    // Map response to match frontend
    const mappedResponse = {
      site_name: updated.site_name,
      site_description: updated.site_description,
      contact_email: updated.contact_email,
      support_email: updated.support_email,
      enable_registration: updated.enable_registration,
      email_verification: updated.require_email_verification,
      auto_approve_employers: updated.auto_approve_employers,
      require_job_approval: updated.require_job_approval,
      job_expiry_days: updated.job_expiry_days,
      max_free_jobs_per_employer: updated.max_job_posts_per_employer,
      require_resume_upload: updated.require_resume_upload,
      notify_on_application: updated.notify_employer_on_application,
      password_min_length: updated.password_min_length,
      maintenance_mode: updated.maintenance_mode,
      admin_alert_emails: updated.admin_alert_emails,
      smtp_host: updated.smtp_host,
      smtp_port: updated.smtp_port,
      smtp_user: updated.smtp_user,
      smtp_password: updated.smtp_password,
      from_email: updated.from_email
    }
    
    res.json({ success: true, data: mappedResponse })
  } catch (error) {
    console.error('Error updating settings:', error)
    res.status(500).json({ success: false, message: (error as Error).message })
  }
}