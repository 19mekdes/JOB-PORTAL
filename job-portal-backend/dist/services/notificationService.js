"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = exports.NotificationTypes = void 0;
const client_1 = require("@prisma/client");
const errorMiddleware_js_1 = require("../middleware/errorMiddleware.js");
const prisma = new client_1.PrismaClient();
// ========== NOTIFICATION TYPES CONSTANTS ==========
exports.NotificationTypes = {
    APPLICATION_SUBMITTED: 'application_submitted',
    APPLICATION_STATUS_CHANGE: 'status_change',
    APPLICATION_WITHDRAWN: 'application_withdrawn',
    APPLICATION_RECEIVED: 'application_received',
    NEW_JOB: 'new_job',
    JOB_MODERATED: 'job_moderated',
    JOB_DELETED: 'job_deleted',
    JOB_REMOVED: 'job_removed',
    ACCOUNT_SUSPENDED: 'account_suspended',
    ACCOUNT_ACTIVATED: 'account_activated',
    PASSWORD_CHANGED: 'password_changed',
    PROFILE_UPDATE: 'profile_update',
    WELCOME: 'welcome',
    REMINDER: 'reminder',
    SYSTEM_ALERT: 'system_alert'
};
// ========== NOTIFICATION SERVICE ==========
class NotificationService {
    constructor() {
        this.prisma = prisma;
    }
    // ========== CREATE SINGLE NOTIFICATION ==========
    async createNotification(data) {
        const { userId, title, message, type, metadata } = data;
        const user = await this.prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            throw new errorMiddleware_js_1.NotFoundError('User');
        }
        const preferences = await this.getNotificationPreferences(userId);
        const notification = await this.prisma.notification.create({
            data: {
                user_id: userId,
                title,
                message,
                type
            }
        });
        if (preferences.email_notifications && this.shouldSendEmail(type, preferences)) {
            await this.sendEmailNotification(user.email, title, message, type);
        }
        if (preferences.push_notifications && this.shouldSendPush(type, preferences)) {
            await this.sendPushNotification(userId, title, message);
        }
        return notification;
    }
    // ========== CREATE BULK NOTIFICATIONS ==========
    async createBulkNotifications(data) {
        const { userIds, title, message, type, metadata } = data;
        const notifications = await this.prisma.notification.createMany({
            data: userIds.map(userId => ({
                user_id: userId,
                title,
                message,
                type,
                metadata: metadata || {}
            }))
        });
        this.sendBulkEmails(userIds, title, message, type).catch(console.error);
        return {
            count: notifications.count,
            message: `${notifications.count} notifications created successfully`
        };
    }
    // ========== GET USER NOTIFICATIONS ==========
    async getUserNotifications(userId, filters = {}) {
        const { type, is_read, start_date, end_date, page = 1, limit = 20 } = filters;
        const where = {
            user_id: userId
        };
        if (type) {
            where.type = type;
        }
        if (is_read !== undefined) {
            where.is_read = is_read;
        }
        if (start_date || end_date) {
            where.created_at = {};
            if (start_date)
                where.created_at.gte = start_date;
            if (end_date)
                where.created_at.lte = end_date;
        }
        const skip = (page - 1) * limit;
        const [notifications, total] = await Promise.all([
            this.prisma.notification.findMany({
                where,
                orderBy: { created_at: 'desc' },
                skip,
                take: limit
            }),
            this.prisma.notification.count({ where })
        ]);
        const unreadCount = await this.prisma.notification.count({
            where: {
                user_id: userId,
                is_read: false
            }
        });
        const groupedNotifications = this.groupNotificationsByDate(notifications);
        return {
            notifications,
            grouped: groupedNotifications,
            unread_count: unreadCount,
            total,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }
    // ========== GET NOTIFICATION BY ID ==========
    async getNotificationById(notificationId, userId) {
        const notification = await this.prisma.notification.findFirst({
            where: {
                id: notificationId,
                user_id: userId
            }
        });
        if (!notification) {
            throw new errorMiddleware_js_1.NotFoundError('Notification');
        }
        return notification;
    }
    // ========== MARK AS READ ==========
    async markAsRead(notificationId, userId) {
        const notification = await this.prisma.notification.findFirst({
            where: {
                id: notificationId,
                user_id: userId
            }
        });
        if (!notification) {
            throw new errorMiddleware_js_1.NotFoundError('Notification');
        }
        const updated = await this.prisma.notification.update({
            where: { id: notificationId },
            data: { is_read: true }
        });
        return updated;
    }
    // ========== MARK MULTIPLE AS READ ==========
    async markMultipleAsRead(notificationIds, userId) {
        const result = await this.prisma.notification.updateMany({
            where: {
                id: { in: notificationIds },
                user_id: userId
            },
            data: { is_read: true }
        });
        return {
            updated_count: result.count,
            message: `${result.count} notifications marked as read`
        };
    }
    // ========== MARK ALL AS READ ==========
    async markAllAsRead(userId) {
        const result = await this.prisma.notification.updateMany({
            where: {
                user_id: userId,
                is_read: false
            },
            data: { is_read: true }
        });
        return {
            updated_count: result.count,
            message: `All ${result.count} notifications marked as read`
        };
    }
    // ========== DELETE NOTIFICATION ==========
    async deleteNotification(notificationId, userId) {
        const notification = await this.prisma.notification.findFirst({
            where: {
                id: notificationId,
                user_id: userId
            }
        });
        if (!notification) {
            throw new errorMiddleware_js_1.NotFoundError('Notification');
        }
        await this.prisma.notification.delete({
            where: { id: notificationId }
        });
        return { message: 'Notification deleted successfully' };
    }
    // ========== DELETE ALL READ NOTIFICATIONS ==========
    async deleteAllRead(userId) {
        const result = await this.prisma.notification.deleteMany({
            where: {
                user_id: userId,
                is_read: true
            }
        });
        return {
            deleted_count: result.count,
            message: `${result.count} read notifications deleted successfully`
        };
    }
    // ========== DELETE ALL NOTIFICATIONS ==========
    async deleteAllNotifications(userId) {
        const result = await this.prisma.notification.deleteMany({
            where: { user_id: userId }
        });
        return {
            deleted_count: result.count,
            message: `All ${result.count} notifications deleted successfully`
        };
    }
    // ========== GET NOTIFICATION PREFERENCES ==========
    async getNotificationPreferences(userId) {
        // Use type assertion for notificationPreference (camelCase)
        const prismaAny = this.prisma;
        const preferences = await prismaAny.notificationPreference?.findUnique({
            where: { user_id: userId }
        });
        if (preferences) {
            return {
                email_notifications: preferences.email_notifications,
                push_notifications: preferences.push_notifications,
                application_updates: preferences.application_updates,
                new_job_alerts: preferences.new_job_alerts,
                status_changes: preferences.status_changes,
                marketing_emails: preferences.marketing_emails,
                weekly_digest: preferences.weekly_digest
            };
        }
        return {
            email_notifications: true,
            push_notifications: true,
            application_updates: true,
            new_job_alerts: true,
            status_changes: true,
            marketing_emails: false,
            weekly_digest: true
        };
    }
    // ========== UPDATE NOTIFICATION PREFERENCES ==========
    async updateNotificationPreferences(userId, preferences) {
        const prismaAny = this.prisma;
        const existing = await prismaAny.notificationPreference?.findUnique({
            where: { user_id: userId }
        });
        let updated;
        if (existing) {
            updated = await prismaAny.notificationPreference.update({
                where: { user_id: userId },
                data: preferences
            });
        }
        else {
            updated = await prismaAny.notificationPreference.create({
                data: {
                    user_id: userId,
                    ...preferences
                }
            });
        }
        return updated;
    }
    // ========== GET UNREAD COUNT ==========
    async getUnreadCount(userId) {
        const count = await this.prisma.notification.count({
            where: {
                user_id: userId,
                is_read: false
            }
        });
        return { count, has_unread: count > 0 };
    }
    // ========== GET NOTIFICATION STATISTICS ==========
    async getNotificationStats(userId) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const [total, unread, last30Days, byType] = await Promise.all([
            this.prisma.notification.count({ where: { user_id: userId } }),
            this.prisma.notification.count({ where: { user_id: userId, is_read: false } }),
            this.prisma.notification.count({
                where: {
                    user_id: userId,
                    created_at: { gte: thirtyDaysAgo }
                }
            }),
            this.prisma.notification.groupBy({
                by: ['type'],
                where: { user_id: userId },
                _count: true
            })
        ]);
        return {
            total,
            unread,
            last_30_days: last30Days,
            by_type: byType.map(t => ({
                type: t.type,
                count: t._count
            }))
        };
    }
    // ========== SEND TEST NOTIFICATION ==========
    async sendTestNotification(userId) {
        const notification = await this.createNotification({
            userId,
            title: 'Test Notification',
            message: 'This is a test notification to verify the notification system is working correctly.',
            type: exports.NotificationTypes.SYSTEM_ALERT,
            metadata: { test: true }
        });
        return notification;
    }
    // ========== HELPER METHODS ==========
    groupNotificationsByDate(notifications) {
        const grouped = {};
        for (const notification of notifications) {
            const date = new Date(notification.created_at).toLocaleDateString();
            if (!grouped[date]) {
                grouped[date] = [];
            }
            grouped[date].push(notification);
        }
        return grouped;
    }
    shouldSendEmail(type, preferences) {
        switch (type) {
            case exports.NotificationTypes.APPLICATION_SUBMITTED:
            case exports.NotificationTypes.APPLICATION_RECEIVED:
                return preferences.application_updates;
            case exports.NotificationTypes.APPLICATION_STATUS_CHANGE:
                return preferences.status_changes;
            case exports.NotificationTypes.NEW_JOB:
                return preferences.new_job_alerts;
            case exports.NotificationTypes.WELCOME:
            case exports.NotificationTypes.PASSWORD_CHANGED:
            case exports.NotificationTypes.ACCOUNT_SUSPENDED:
            case exports.NotificationTypes.ACCOUNT_ACTIVATED:
                return preferences.email_notifications;
            default:
                return preferences.email_notifications;
        }
    }
    shouldSendPush(type, preferences) {
        return preferences.push_notifications;
    }
    async sendEmailNotification(email, title, message, type) {
        console.log(`Sending email to ${email}: ${title} - ${message}`);
    }
    async sendPushNotification(userId, title, message) {
        console.log(`Sending push notification to user ${userId}: ${title} - ${message}`);
    }
    async sendBulkEmails(userIds, title, message, type) {
        const users = await this.prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, email: true }
        });
        for (const user of users) {
            const preferences = await this.getNotificationPreferences(user.id);
            if (this.shouldSendEmail(type, preferences)) {
                await this.sendEmailNotification(user.email, title, message, type);
            }
        }
    }
    // ========== SPECIFIC NOTIFICATION CREATORS ==========
    async notifyApplicationSubmitted(seekerUserId, jobTitle, employerUserId) {
        await this.createNotification({
            userId: seekerUserId,
            title: 'Application Submitted',
            message: `Your application for "${jobTitle}" has been submitted successfully.`,
            type: exports.NotificationTypes.APPLICATION_SUBMITTED
        });
        await this.createNotification({
            userId: employerUserId,
            title: 'New Application Received',
            message: `A new application has been received for "${jobTitle}".`,
            type: exports.NotificationTypes.APPLICATION_RECEIVED
        });
    }
    async notifyApplicationStatusChange(seekerUserId, jobTitle, status, feedback) {
        let message = `Your application for "${jobTitle}" has been ${status.toLowerCase()}`;
        if (feedback) {
            message += `. Feedback: ${feedback}`;
        }
        await this.createNotification({
            userId: seekerUserId,
            title: `Application ${status}`,
            message,
            type: exports.NotificationTypes.APPLICATION_STATUS_CHANGE,
            metadata: { status, feedback }
        });
    }
    async notifyNewJobAlert(userIds, jobTitle, companyName) {
        if (userIds.length === 0)
            return;
        await this.createBulkNotifications({
            userIds,
            title: 'New Job Alert',
            message: `${companyName} has posted a new job: "${jobTitle}". Apply now!`,
            type: exports.NotificationTypes.NEW_JOB,
            metadata: { jobTitle, companyName }
        });
    }
    async notifyWelcomeNewUser(userId, userName) {
        await this.createNotification({
            userId,
            title: 'Welcome to Job Portal!',
            message: `Welcome ${userName}! Start exploring jobs and building your career today.`,
            type: exports.NotificationTypes.WELCOME,
            metadata: { userName }
        });
    }
    async notifyPasswordChanged(userId) {
        await this.createNotification({
            userId,
            title: 'Password Changed',
            message: 'Your password was successfully changed. If this wasn\'t you, please contact support immediately.',
            type: exports.NotificationTypes.PASSWORD_CHANGED
        });
    }
    async notifyAccountSuspended(userId, reason) {
        const message = reason
            ? `Your account has been suspended. Reason: ${reason}`
            : 'Your account has been suspended. Please contact support for more information.';
        await this.createNotification({
            userId,
            title: 'Account Suspended',
            message,
            type: exports.NotificationTypes.ACCOUNT_SUSPENDED,
            metadata: { reason }
        });
    }
    async notifyAccountActivated(userId) {
        await this.createNotification({
            userId,
            title: 'Account Activated',
            message: 'Your account has been reactivated. You can now log in and use the platform.',
            type: exports.NotificationTypes.ACCOUNT_ACTIVATED
        });
    }
    async notifyJobModerated(employerUserId, jobTitle, status, reason) {
        const message = `Your job "${jobTitle}" has been ${status.toLowerCase()} by an administrator.${reason ? ` Reason: ${reason}` : ''}`;
        await this.createNotification({
            userId: employerUserId,
            title: `Job ${status}`,
            message,
            type: exports.NotificationTypes.JOB_MODERATED,
            metadata: { jobTitle, status, reason }
        });
    }
    // ========== WEEKLY DIGEST ==========
    async sendWeeklyDigest() {
        const prismaAny = this.prisma;
        const usersWithDigest = await prismaAny.notificationPreference?.findMany({
            where: { weekly_digest: true },
            include: { user: true }
        });
        if (!usersWithDigest)
            return;
        for (const pref of usersWithDigest) {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            const notifications = await this.prisma.notification.findMany({
                where: {
                    user_id: pref.user_id,
                    created_at: { gte: weekAgo },
                    is_read: false
                },
                orderBy: { created_at: 'desc' }
            });
            if (notifications.length > 0) {
                const digestHtml = this.generateDigestHtml(notifications, pref.user.email);
                await this.sendEmailNotification(pref.user.email, 'Your Weekly Job Portal Digest', digestHtml, 'weekly_digest');
            }
        }
    }
    generateDigestHtml(notifications, email) {
        const notificationsHtml = notifications.map(n => `
      <div style="padding: 10px; margin: 5px 0; border-left: 3px solid #4CAF50;">
        <strong>${n.title}</strong><br/>
        <small>${new Date(n.created_at).toLocaleString()}</small>
        <p>${n.message}</p>
      </div>
    `).join('');
        return `
      <h2>Your Weekly Job Portal Digest</h2>
      <p>Hello,</p>
      <p>Here's a summary of your notifications from the past week:</p>
      ${notificationsHtml}
      <p><a href="${process.env.CLIENT_URL}/notifications">View all notifications</a></p>
      <hr/>
      <small>You're receiving this because you subscribed to weekly digests.</small>
    `;
    }
    // ========== CLEANUP OLD NOTIFICATIONS ==========
    async cleanupOldNotifications(daysOld = 90) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);
        const result = await this.prisma.notification.deleteMany({
            where: {
                is_read: true,
                created_at: { lt: cutoffDate }
            }
        });
        return {
            deleted_count: result.count,
            message: `${result.count} old notifications cleaned up`
        };
    }
}
exports.NotificationService = NotificationService;
// ========== DEFAULT EXPORT ==========
exports.default = new NotificationService();
