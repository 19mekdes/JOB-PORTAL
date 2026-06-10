-- check-profile.sql
SELECT 
  user_id, 
  title, 
  linkedin_url, 
  github_url, 
  portfolio_url, 
  availability 
FROM "JobSeekerProfile" 
WHERE user_id = '33144c90-d314-414c-896b-4f4ffe735c42';