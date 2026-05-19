// test-cloudinary.js
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 'dwpnbbcd7',
  api_key: '854783363296519',
  api_secret: 'Vr5E5CCbtQ2Er63sOn6-Cg9pFQY',
});

async function test() {
  try {
    console.log('Testing Cloudinary connection...');
    
    // Test upload (you can comment this if you don't have an image)
    const result = await cloudinary.uploader.upload('https://picsum.photos/200/300', {
      folder: 'jobportal/test',
      public_id: 'test-image'
    });
    
    console.log('✅ Cloudinary is working!');
    console.log('Image URL:', result.secure_url);
  } catch (error) {
    console.error('❌ Cloudinary error:', error.message);
  }
}

test();