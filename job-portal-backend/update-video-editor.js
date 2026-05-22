const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateVideoEditor() {
  const jobId = '53ccee8d-fd0e-4e6b-91ee-2c35ef340ad3';
  
  const updated = await prisma.jobPost.update({
    where: { id: jobId },
    data: {
      requirements: 'Proven experience as a Video Editor\nProficiency in Adobe Premiere Pro, After Effects, or Final Cut Pro\nStrong understanding of video formats, codecs, and compression\nAbility to work with color grading and audio mixing\nAttention to detail and creative storytelling skills\nPortfolio of previous work required',
      benefits: 'Competitive salary ($40,000 - $60,000)\nFlexible working hours\nRemote work options\nAccess to latest editing software and equipment\nProfessional development opportunities\nCreative and collaborative work environment'
    }
  });
  
  console.log('✅ Job updated successfully!');
  console.log('Title: ' + updated.title);
  console.log('Requirements: ' + updated.requirements);
  console.log('Benefits: ' + updated.benefits);
}

updateVideoEditor();