import {
  resizeImage,
  validateResizeParams,
  fileExists,
  ensureDirectoryExists,
} from '../utils/imageProcessor';
import { IResizeParams } from '../interfaces/IImageProcessor';
import path from 'path';
import fs from 'fs/promises';

describe('Image Processor Utility Tests', () => {
  const testImagePath = path.join(process.cwd(), 'assets', 'full', 'test.jpg');
  const thumbDir = path.join(process.cwd(), 'assets', 'thumb');

  // Setup: Create a simple test image before running tests
  beforeAll(async () => {
    const fullDir = path.join(process.cwd(), 'assets', 'full');
    await ensureDirectoryExists(fullDir);

    // Create a minimal valid JPEG file for testing
    // This is a 1x1 pixel red JPEG image
    const minimalJpeg = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
      0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
      0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12,
      0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20,
      0x24, 0x2e, 0x27, 0x20, 0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29,
      0x2c, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1f, 0x27, 0x39, 0x3d, 0x38, 0x32,
      0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01,
      0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4, 0x00, 0x14, 0x00, 0x01,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x03, 0xff, 0xc4, 0x00, 0x14, 0x10, 0x01, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00,
      0x37, 0xff, 0xd9,
    ]);

    await fs.writeFile(testImagePath, minimalJpeg);
  });

  // Cleanup: Remove test images after all tests
  afterAll(async () => {
    try {
      // Clean up test image
      await fs.unlink(testImagePath);

      // Clean up any generated thumbnails
      const thumbFiles = await fs.readdir(thumbDir);
      for (const file of thumbFiles) {
        if (file.startsWith('test_')) {
          await fs.unlink(path.join(thumbDir, file));
        }
      }
    } catch (error) {
      // Ignore errors during cleanup
    }
  });

  describe('validateResizeParams', () => {
    it('should return valid for correct parameters', () => {
      const params: IResizeParams = {
        filename: 'test',
        width: 100,
        height: 100,
      };
      const result = validateResizeParams(params);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return invalid for missing filename', () => {
      const params: IResizeParams = {
        filename: '',
        width: 100,
        height: 100,
      };
      const result = validateResizeParams(params);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Filename is required');
    });

    it('should return invalid for missing width', () => {
      const params = {
        filename: 'test',
        width: null as unknown as number,
        height: 100,
      };
      const result = validateResizeParams(params);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('width and height');
    });

    it('should return invalid for negative dimensions', () => {
      const params: IResizeParams = {
        filename: 'test',
        width: -100,
        height: 100,
      };
      const result = validateResizeParams(params);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('positive numbers');
    });

    it('should return invalid for zero dimensions', () => {
      const params: IResizeParams = {
        filename: 'test',
        width: 0,
        height: 100,
      };
      const result = validateResizeParams(params);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('positive numbers');
    });

    it('should return invalid for non-numeric dimensions', () => {
      const params = {
        filename: 'test',
        width: 'abc' as unknown as number,
        height: 100,
      };
      const result = validateResizeParams(params);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('valid numbers');
    });
  });

  describe('fileExists', () => {
    it('should return true for existing file', async () => {
      const exists = await fileExists(testImagePath);
      expect(exists).toBe(true);
    });

    it('should return false for non-existing file', async () => {
      const nonExistentPath = path.join(
        process.cwd(),
        'assets',
        'full',
        'nonexistent.jpg'
      );
      const exists = await fileExists(nonExistentPath);
      expect(exists).toBe(false);
    });
  });

  describe('ensureDirectoryExists', () => {
    it('should create directory if it does not exist', async () => {
      const testDir = path.join(process.cwd(), 'assets', 'test-temp-dir');
      await ensureDirectoryExists(testDir);
      const exists = await fileExists(testDir);
      expect(exists).toBe(true);
      // Cleanup
      await fs.rmdir(testDir);
    });
  });

  describe('resizeImage', () => {
    it('should successfully resize an existing image', async () => {
      const params: IResizeParams = {
        filename: 'test',
        width: 50,
        height: 50,
      };

      const result = await resizeImage(params);

      expect(result.success).toBe(true);
      expect(result.outputPath).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    it('should use cached image on subsequent requests', async () => {
      const params: IResizeParams = {
        filename: 'test',
        width: 75,
        height: 75,
      };

      // Clean up any existing cached file first
      const cachedPath = path.join(thumbDir, 'test_75x75.jpg');
      try {
        await fs.unlink(cachedPath);
      } catch {
        // Ignore if file doesn't exist
      }

      // First call - creates the image
      const firstResult = await resizeImage(params);
      expect(firstResult.success).toBe(true);
      expect(firstResult.cached).toBe(false);

      // Second call - should use cached version
      const secondResult = await resizeImage(params);
      expect(secondResult.success).toBe(true);
      expect(secondResult.cached).toBe(true);
    });

    it('should return error for non-existent image', async () => {
      const params: IResizeParams = {
        filename: 'nonexistent',
        width: 100,
        height: 100,
      };

      const result = await resizeImage(params);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should return error for invalid width', async () => {
      const params: IResizeParams = {
        filename: 'test',
        width: -50,
        height: 50,
      };

      const result = await resizeImage(params);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should return error for invalid height', async () => {
      const params: IResizeParams = {
        filename: 'test',
        width: 50,
        height: 0,
      };

      const result = await resizeImage(params);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
