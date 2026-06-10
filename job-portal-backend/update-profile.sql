-- update-profile.sql
UPDATE "JobSeekerProfile" 
SET 
  title = 'Senior Software Engineer',
  linkedin_url = 'https://linkedin.com/in/mekdeswale',
  github_url = 'https://github.com/mekdeswale',
  portfolio_url = 'https://mekdeswale.com',
  availability = 'immediate'
WHERE user_id = '33144c90-d314-414c-896b-4f4ffe735c42';