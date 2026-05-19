-- CreateTable
CREATE TABLE "UserType" (
    "id" SERIAL NOT NULL,
    "type_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "user_type_id" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobSeekerProfile" (
    "id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone" TEXT,
    "resume_url" TEXT,
    "skills" TEXT[],
    "experience" TEXT,
    "education" TEXT,
    "location" TEXT,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "JobSeekerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployerProfile" (
    "id" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "company_description" TEXT,
    "website" TEXT,
    "logo_url" TEXT,
    "industry_id" INTEGER NOT NULL,
    "company_size" TEXT,
    "location" TEXT,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "EmployerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobIndustry" (
    "id" SERIAL NOT NULL,
    "industry_name" TEXT NOT NULL,

    CONSTRAINT "JobIndustry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmploymentType" (
    "id" SERIAL NOT NULL,
    "type_name" TEXT NOT NULL,

    CONSTRAINT "EmploymentType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobPostStatus" (
    "id" SERIAL NOT NULL,
    "status_name" TEXT NOT NULL,

    CONSTRAINT "JobPostStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobApplicationStatus" (
    "id" SERIAL NOT NULL,
    "status_name" TEXT NOT NULL,

    CONSTRAINT "JobApplicationStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobPost" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "requirements" TEXT,
    "benefits" TEXT,
    "employer_id" TEXT NOT NULL,
    "industry_id" INTEGER NOT NULL,
    "employment_type_id" INTEGER NOT NULL,
    "salary_min" DECIMAL(10,2),
    "salary_max" DECIMAL(10,2),
    "salary_range" TEXT,
    "location" TEXT NOT NULL,
    "is_remote" BOOLEAN NOT NULL DEFAULT false,
    "status_id" INTEGER NOT NULL,
    "views_count" INTEGER NOT NULL DEFAULT 0,
    "applications_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobApplication" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "seeker_id" TEXT NOT NULL,
    "resume_url" TEXT,
    "cover_letter" TEXT,
    "status_id" INTEGER NOT NULL,
    "employer_notes" TEXT,
    "applied_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobApplicationNote" (
    "id" SERIAL NOT NULL,
    "application_id" TEXT NOT NULL,
    "employer_id" TEXT NOT NULL,
    "note_text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobApplicationNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobBookmark" (
    "id" SERIAL NOT NULL,
    "seeker_id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobBookmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchLog" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT,
    "search_term" TEXT NOT NULL,
    "filters" JSONB,
    "results_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserType_type_name_key" ON "UserType"("type_name");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_user_type_id_idx" ON "User"("user_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "JobSeekerProfile_user_id_key" ON "JobSeekerProfile"("user_id");

-- CreateIndex
CREATE INDEX "JobSeekerProfile_user_id_idx" ON "JobSeekerProfile"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "EmployerProfile_user_id_key" ON "EmployerProfile"("user_id");

-- CreateIndex
CREATE INDEX "EmployerProfile_user_id_idx" ON "EmployerProfile"("user_id");

-- CreateIndex
CREATE INDEX "EmployerProfile_industry_id_idx" ON "EmployerProfile"("industry_id");

-- CreateIndex
CREATE UNIQUE INDEX "JobIndustry_industry_name_key" ON "JobIndustry"("industry_name");

-- CreateIndex
CREATE UNIQUE INDEX "EmploymentType_type_name_key" ON "EmploymentType"("type_name");

-- CreateIndex
CREATE UNIQUE INDEX "JobPostStatus_status_name_key" ON "JobPostStatus"("status_name");

-- CreateIndex
CREATE UNIQUE INDEX "JobApplicationStatus_status_name_key" ON "JobApplicationStatus"("status_name");

-- CreateIndex
CREATE INDEX "JobPost_employer_id_idx" ON "JobPost"("employer_id");

-- CreateIndex
CREATE INDEX "JobPost_status_id_idx" ON "JobPost"("status_id");

-- CreateIndex
CREATE INDEX "JobPost_industry_id_idx" ON "JobPost"("industry_id");

-- CreateIndex
CREATE INDEX "JobPost_employment_type_id_idx" ON "JobPost"("employment_type_id");

-- CreateIndex
CREATE INDEX "JobPost_created_at_idx" ON "JobPost"("created_at");

-- CreateIndex
CREATE INDEX "JobApplication_job_id_idx" ON "JobApplication"("job_id");

-- CreateIndex
CREATE INDEX "JobApplication_seeker_id_idx" ON "JobApplication"("seeker_id");

-- CreateIndex
CREATE INDEX "JobApplication_status_id_idx" ON "JobApplication"("status_id");

-- CreateIndex
CREATE UNIQUE INDEX "JobApplication_job_id_seeker_id_key" ON "JobApplication"("job_id", "seeker_id");

-- CreateIndex
CREATE INDEX "JobApplicationNote_application_id_idx" ON "JobApplicationNote"("application_id");

-- CreateIndex
CREATE INDEX "JobBookmark_seeker_id_idx" ON "JobBookmark"("seeker_id");

-- CreateIndex
CREATE INDEX "JobBookmark_job_id_idx" ON "JobBookmark"("job_id");

-- CreateIndex
CREATE UNIQUE INDEX "JobBookmark_seeker_id_job_id_key" ON "JobBookmark"("seeker_id", "job_id");

-- CreateIndex
CREATE INDEX "Notification_user_id_idx" ON "Notification"("user_id");

-- CreateIndex
CREATE INDEX "Notification_is_read_idx" ON "Notification"("is_read");

-- CreateIndex
CREATE INDEX "Notification_created_at_idx" ON "Notification"("created_at");

-- CreateIndex
CREATE INDEX "SearchLog_created_at_idx" ON "SearchLog"("created_at");

-- CreateIndex
CREATE INDEX "SearchLog_search_term_idx" ON "SearchLog"("search_term");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_user_type_id_fkey" FOREIGN KEY ("user_type_id") REFERENCES "UserType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobSeekerProfile" ADD CONSTRAINT "JobSeekerProfile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployerProfile" ADD CONSTRAINT "EmployerProfile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployerProfile" ADD CONSTRAINT "EmployerProfile_industry_id_fkey" FOREIGN KEY ("industry_id") REFERENCES "JobIndustry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobPost" ADD CONSTRAINT "JobPost_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "EmployerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobPost" ADD CONSTRAINT "JobPost_industry_id_fkey" FOREIGN KEY ("industry_id") REFERENCES "JobIndustry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobPost" ADD CONSTRAINT "JobPost_employment_type_id_fkey" FOREIGN KEY ("employment_type_id") REFERENCES "EmploymentType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobPost" ADD CONSTRAINT "JobPost_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "JobPostStatus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "JobPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_seeker_id_fkey" FOREIGN KEY ("seeker_id") REFERENCES "JobSeekerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "JobApplicationStatus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobApplicationNote" ADD CONSTRAINT "JobApplicationNote_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "JobApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobApplicationNote" ADD CONSTRAINT "JobApplicationNote_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "EmployerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobBookmark" ADD CONSTRAINT "JobBookmark_seeker_id_fkey" FOREIGN KEY ("seeker_id") REFERENCES "JobSeekerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobBookmark" ADD CONSTRAINT "JobBookmark_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "JobPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchLog" ADD CONSTRAINT "SearchLog_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
