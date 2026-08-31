import path from 'path';
import fs from 'fs/promises';

/**
 * Storage Service Abstraction Driver
 */
class StorageService {
  constructor() {
    this.driver = process.env.STORAGE_DRIVER || 'local';
    this.uploadDir = path.join(process.cwd(), 'uploads');
  }

  async init() {
    if (this.driver === 'local') {
      try {
        await fs.mkdir(this.uploadDir, { recursive: true });
      } catch (err) {
        console.error('Failed to create local uploads directory:', err);
      }
    }
  }

  async saveFile(fileName, buffer) {
    if (this.driver === 'local') {
      const filePath = path.join(this.uploadDir, fileName);
      await fs.writeFile(filePath, buffer);
      return `/uploads/${fileName}`;
    }
    // Storage driver hooks for S3/MinIO can be wired here
    throw new Error(`Storage driver ${this.driver} not supported.`);
  }
}

export const storageService = new StorageService();
storageService.init();
