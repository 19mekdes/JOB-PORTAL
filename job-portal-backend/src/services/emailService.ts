import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Email transporter configuration
let transporter: nodemailer.Transporter;

const configureTransporter = () => {
  const isGmail = process.env.EMAIL_USER?.includes('gmail');
  const isOutlook = process.env.EMAIL_USER?.includes('outlook') || process.env.EMAIL_USER?.includes('hotmail');
  const isEthereal = process.env.EMAIL_HOST?.includes('ethereal');

  if (isGmail) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  } else if (isOutlook) {
    transporter = nodemailer.createTransport({
      service: 'hotmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  } else if (isEthereal || process.env.EMAIL_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  } else {
    // Default configuration
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
};

// Initialize transporter
configureTransporter();

// Test email configuration
export const testEmailConfig = async (): Promise<boolean> => {
  try {
    await transporter.verify();
    console.log('✅ Email service configured successfully');
    return true;
  } catch (error) {
    console.error('❌ Email configuration error:', error);
    return false;
  }
};

// Send email function
export const sendEmail = async (
  to: string,
  subject: string,
  html: string
): Promise<{ success: boolean; messageId?: string; error?: any }> => {
  try {
    const info = await transporter.sendMail({
      from: `"Job Portal" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`✅ Email sent to ${to}, Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email sending failed:', error);
    return { success: false, error };
  }
};

// ========== EMAIL TEMPLATES ==========

// Welcome Email Template
export const sendWelcomeEmail = async (email: string, name: string): Promise<void> => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Job Portal</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #2563eb, #1e40af); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
        .button:hover { background: #1e40af; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; margin-top: 20px; }
        h2 { margin: 0; }
        h3 { color: #1f2937; }
        .highlight { color: #2563eb; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>🎉 Welcome to Job Portal!</h2>
        </div>
        <div class="content">
          <h3>Hello ${name},</h3>
          <p>Thank you for registering with <span class="highlight">Job Portal</span>! We're excited to help you find your next opportunity.</p>
          <p>Your account has been successfully created with email: <strong>${email}</strong></p>
          <p>Here's what you can do next:</p>
          <ul>
            <li>✅ Complete your profile to attract employers</li>
            <li>✅ Browse thousands of job opportunities</li>
            <li>✅ Apply to jobs with one click</li>
            <li>✅ Get personalized job recommendations</li>
          </ul>
          <div style="text-align: center;">
            <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/profile" class="button">Complete Your Profile</a>
          </div>
          <p>If you have any questions, feel free to reply to this email.</p>
          <p>Best regards,<br><strong>Job Portal Team</strong></p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Job Portal. All rights reserved.</p>
          <p>Connecting Talent with Opportunity</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail(email, 'Welcome to Job Portal! 🎉', html);
};

// Application Status Update Email
export const sendApplicationStatusEmail = async (
  email: string,
  userName: string,
  jobTitle: string,
  status: string,
  companyName: string,
  message?: string
): Promise<void> => {
  const statusColors: Record<string, string> = {
    Pending: '#f59e0b',
    Reviewed: '#3b82f6',
    Shortlisted: '#8b5cf6',
    Interview: '#06b6d4',
    Accepted: '#10b981',
    Rejected: '#ef4444',
  };

  const statusMessages: Record<string, string> = {
    Pending: 'Your application is under review',
    Reviewed: 'Your application has been reviewed by the employer',
    Shortlisted: '🎉 Congratulations! You have been shortlisted',
    Interview: '📅 You have been selected for an interview',
    Accepted: '🎊 Congratulations! Your application has been accepted',
    Rejected: 'Thank you for your interest, but you have not been selected',
  };

  const statusActions: Record<string, string> = {
    Interview: 'Prepare for your interview and check your email for details',
    Shortlisted: 'The employer will contact you soon with next steps',
    Accepted: 'You will receive an offer letter shortly',
  };

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Application Status Update</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #2563eb, #1e40af); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .status-badge { display: inline-block; padding: 8px 20px; border-radius: 50px; font-weight: bold; background: ${statusColors[status]}; color: white; font-size: 14px; }
        .button { background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; margin-top: 20px; }
        .message-box { background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>📋 Application Status Update</h2>
        </div>
        <div class="content">
          <h3>Hello ${userName},</h3>
          <p>Your application status for <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has been updated.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <span class="status-badge">${status}</span>
          </div>
          
          <p><strong>${statusMessages[status]}</strong></p>
          ${statusActions[status] ? `<p>${statusActions[status]}</p>` : ''}
          
          ${message ? `
            <div class="message-box">
              <strong>📝 Message from employer:</strong><br>
              ${message}
            </div>
          ` : ''}
          
          <div style="text-align: center;">
            <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/applications" class="button">View My Applications</a>
          </div>
          
          <p>Best regards,<br><strong>Job Portal Team</strong></p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Job Portal. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail(email, `Application Status: ${status} - ${jobTitle}`, html);
};

// New Job Alert Email
export const sendNewJobAlertEmail = async (
  email: string,
  userName: string,
  jobs: any[]
): Promise<void> => {
  const jobsList = jobs
    .map(
      (job) => `
      <div style="border: 1px solid #e5e7eb; padding: 15px; margin-bottom: 15px; border-radius: 8px; background: white;">
        <h3 style="margin: 0 0 5px 0; color: #1f2937;">${job.title}</h3>
        <p style="color: #6b7280; margin: 0 0 5px 0;">
          <strong>${job.company_name || 'Unknown Company'}</strong> • ${job.location || 'Location not specified'}
        </p>
        <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
          ${job.salary_range ? `💰 Salary: ${job.salary_range}` : '💰 Salary: Competitive'}
        </p>
        <p style="margin: 0;">
          <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/jobs/${job.id}" 
             style="color: #2563eb; text-decoration: none; font-weight: 500;">View Details →</a>
        </p>
      </div>
    `
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Job Alerts</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #2563eb, #1e40af); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; margin-top: 20px; }
        .alert-badge { background: #ef4444; color: white; padding: 2px 8px; border-radius: 20px; font-size: 12px; display: inline-block; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>🔔 New Job Alerts</h2>
        </div>
        <div class="content">
          <h3>Hello ${userName},</h3>
          <p>We found <span class="alert-badge">${jobs.length} new job${jobs.length > 1 ? 's' : ''}</span> that match your preferences:</p>
          
          ${jobsList}
          
          <div style="text-align: center;">
            <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/jobs" class="button">Browse All Jobs</a>
          </div>
          
          <hr>
          <p style="font-size: 12px; color: #6b7280; text-align: center;">
            You received this email because you subscribed to job alerts.<br>
            <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/jobseeker/preferences" style="color: #2563eb;">Manage Preferences</a>
          </p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Job Portal. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail(email, `🔔 ${jobs.length} New Job${jobs.length > 1 ? 's' : ''} Alert`, html);
};

// Password Reset Email
export const sendPasswordResetEmail = async (
  email: string,
  userName: string,
  resetToken: string
): Promise<void> => {
  const resetLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset Request</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #2563eb, #1e40af); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
        .button:hover { background: #1e40af; }
        .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>🔐 Password Reset Request</h2>
        </div>
        <div class="content">
          <h3>Hello ${userName},</h3>
          <p>We received a request to reset your password for your Job Portal account.</p>
          
          <div style="text-align: center;">
            <a href="${resetLink}" class="button">Reset Password</a>
          </div>
          
          <div class="warning">
            <strong>⚠️ This link will expire in 1 hour</strong><br>
            If you didn't request this, please ignore this email.
          </div>
          
          <p>For security reasons, do not share this link with anyone.</p>
          
          <p>Best regards,<br><strong>Job Portal Team</strong></p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Job Portal. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail(email, 'Password Reset Request - Job Portal', html);
};

// Contact Form Email (for users contacting admin)
export const sendContactFormEmail = async (
  name: string,
  email: string,
  subject: string,
  message: string
): Promise<void> => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>New Contact Form Submission</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { background: #f9fafb; padding: 20px; }
        .info { background: white; padding: 15px; border-radius: 8px; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>📧 New Contact Form Message</h2>
        </div>
        <div class="content">
          <div class="info">
            <p><strong>From:</strong> ${name} (${email})</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Message:</strong></p>
            <p>${message.replace(/\n/g, '<br>')}</p>
          </div>
          <p><small>Sent at: ${new Date().toLocaleString()}</small></p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail(process.env.EMAIL_USER || 'admin@jobportal.com', `Contact Form: ${subject}`, html);
};

// New Application Notification for Employer
export const sendNewApplicationNotification = async (
  employerEmail: string,
  employerName: string,
  jobTitle: string,
  applicantName: string,
  applicationId: string
): Promise<void> => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>New Job Application</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10b981; color: white; padding: 20px; text-align: center; }
        .content { background: #f9fafb; padding: 20px; }
        .button { background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>🎯 New Application Received!</h2>
        </div>
        <div class="content">
          <h3>Hello ${employerName},</h3>
          <p>A new candidate has applied for <strong>${jobTitle}</strong>.</p>
          <p><strong>Applicant:</strong> ${applicantName}</p>
          <div style="text-align: center;">
            <a href="${process.env.CLIENT_URL}/employer/applications/${applicationId}" class="button">View Application</a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail(employerEmail, `New Application for ${jobTitle}`, html);
};

// Export all email functions
export default {
  testEmailConfig,
  sendEmail,
  sendWelcomeEmail,
  sendApplicationStatusEmail,
  sendNewJobAlertEmail,
  sendPasswordResetEmail,
  sendContactFormEmail,
  sendNewApplicationNotification,
};