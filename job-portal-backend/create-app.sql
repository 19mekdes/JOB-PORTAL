INSERT INTO "JobApplication" (
  "id",
  "job_id", 
  "seeker_id", 
  "status_id", 
  "cover_letter", 
  "applied_at"
)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM "JobPost" LIMIT 1),
  (SELECT id FROM "JobSeekerProfile" WHERE user_id = 'e3cd0f14-3309-47fb-9773-584a991461dc' LIMIT 1),
  (SELECT id FROM "JobApplicationStatus" WHERE status_name = 'Pending' LIMIT 1),
  'Test application for mekdes',
  NOW();
