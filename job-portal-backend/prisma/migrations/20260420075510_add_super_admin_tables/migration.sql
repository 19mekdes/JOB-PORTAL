-- CreateTable
CREATE TABLE "SystemSetting" (
    "id" SERIAL NOT NULL,
    "site_name" TEXT NOT NULL DEFAULT 'Job Portal',
    "site_description" TEXT NOT NULL DEFAULT 'Connect job seekers with employers',
    "contact_email" TEXT NOT NULL DEFAULT 'admin@jobportal.com',
    "enable_registration" BOOLEAN NOT NULL DEFAULT true,
    "require_email_verification" BOOLEAN NOT NULL DEFAULT true,
    "max_job_posts_per_employer" INTEGER NOT NULL DEFAULT 50,
    "max_applications_per_seeker" INTEGER NOT NULL DEFAULT 100,
    "job_expiry_days" INTEGER NOT NULL DEFAULT 30,
    "maintenance_mode" BOOLEAN NOT NULL DEFAULT false,
    "allowed_file_types" TEXT[] DEFAULT ARRAY['pdf', 'doc', 'docx', 'txt']::TEXT[],
    "max_file_size_mb" INTEGER NOT NULL DEFAULT 5,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" SERIAL NOT NULL,
    "admin_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "details" JSONB,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
