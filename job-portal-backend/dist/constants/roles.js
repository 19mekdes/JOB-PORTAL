"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationTypes = exports.JobStatus = exports.ApplicationStatus = exports.UserTypes = void 0;
exports.UserTypes = {
    JOB_SEEKER: 'Job Seeker',
    EMPLOYER: 'Employer',
    ADMIN: 'Admin',
    SUPER_ADMIN: 'Super Admin'
};
exports.ApplicationStatus = {
    PENDING: 'Pending',
    REVIEWED: 'Reviewed',
    SHORTLISTED: 'Shortlisted',
    INTERVIEW: 'Interview',
    ACCEPTED: 'Accepted',
    REJECTED: 'Rejected'
};
exports.JobStatus = {
    OPEN: 'Open',
    CLOSED: 'Closed',
    DRAFT: 'Draft',
    ARCHIVED: 'Archived'
};
exports.NotificationTypes = {
    APPLICATION_UPDATE: 'application_update',
    NEW_JOB: 'new_job',
    STATUS_CHANGE: 'status_change',
    APPLICATION_RECEIVED: 'application_received'
};
