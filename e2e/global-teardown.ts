import fs from 'fs';

export default async () => {
  console.log('🧹 E2E Global Teardown: Starting...');
  if (process.env.MEDIA_DIR) {
    try {
      fs.rmSync(process.env.MEDIA_DIR, { recursive: true, force: true });
      console.log(`✅ Removed temporary media directory: ${process.env.MEDIA_DIR}`);
    } catch (error) {
      console.error(`🔥 Failed to remove temporary media directory: ${process.env.MEDIA_DIR}`, error);
    }
  }
  console.log('🎉 E2E Global Teardown: Complete.');
};
