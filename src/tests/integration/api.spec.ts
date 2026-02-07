import supertest from 'supertest';
import app from '../../index';
import path from 'path';
import fs from 'fs/promises';
import { ensureDirectoryExists } from '../../utils/imageProcessor';

const request = supertest(app);

describe('[integration] API Endpoint Tests', () => {
  const testImagePath = path.join(
    process.cwd(),
    'assets',
    'full',
    'apitest.jpg'
  );
  const thumbDir = path.join(process.cwd(), 'assets', 'thumb');

  const safeDeleteFile = async (
    filePath: string,
    retries = 2
  ): Promise<void> => {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        await fs.unlink(filePath);
        return;
      } catch {
        if (attempt < retries) {
          await new Promise((resolve) =>
            setTimeout(resolve, 100 * (attempt + 1))
          );
        } else {
          console.warn(`Unable to delete ${path.basename(filePath)}`);
        }
      }
    }
  };

  beforeAll(async () => {
    const fullDir = path.join(process.cwd(), 'assets', 'full');
    await ensureDirectoryExists(fullDir);

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

  afterAll(async () => {
    // Allow file handles to close before cleanup
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Clean up test image
    await safeDeleteFile(testImagePath);

    // Clean up thumbnail files
    try {
      const thumbFiles = await fs.readdir(thumbDir);
      const testThumbs = thumbFiles.filter((file) =>
        file.startsWith('apitest_')
      );

      await Promise.all(
        testThumbs.map((file) => safeDeleteFile(path.join(thumbDir, file)))
      );
    } catch {
      // Thumb directory might not exist
    }
  });

  describe('GET /', () => {
    it('should return 200 and API information', async () => {
      const response = await request.get('/');
      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
      expect(response.body.message).toBe('Image Processing API');
    });
  });

  describe('GET /api/images', () => {
    it('should return 400 when filename parameter is missing', async () => {
      const response = await request
        .get('/api/images')
        .query({ width: 100, height: 100 });
      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
      expect(response.body.message).toContain('filename');
    });

    it('should return 400 when width parameter is missing', async () => {
      const response = await request
        .get('/api/images')
        .query({ filename: 'apitest', height: 100 });
      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
      expect(response.body.message).toContain('width and height');
    });

    it('should return 400 when height parameter is missing', async () => {
      const response = await request
        .get('/api/images')
        .query({ filename: 'apitest', width: 100 });
      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
      expect(response.body.message).toContain('width and height');
    });

    it('should return 404 when image file does not exist', async () => {
      const response = await request
        .get('/api/images')
        .query({ filename: 'nonexistent', width: 100, height: 100 });
      expect(response.status).toBe(404);
      expect(response.body.error).toBeDefined();
      expect(response.body.message).toContain('not found');
    });

    it('should return 400 for invalid width value', async () => {
      const response = await request
        .get('/api/images')
        .query({ filename: 'apitest', width: -50, height: 100 });
      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should return 400 for invalid height value', async () => {
      const response = await request
        .get('/api/images')
        .query({ filename: 'apitest', width: 100, height: 0 });
      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should return 400 for non-numeric width', async () => {
      const response = await request
        .get('/api/images')
        .query({ filename: 'apitest', width: 'abc', height: 100 });
      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should return 200 and resized image for valid parameters', async () => {
      const response = await request
        .get('/api/images')
        .query({ filename: 'apitest', width: 100, height: 100 });
      expect(response.status).toBe(200);
      expect(response.type).toBe('image/jpeg');
    });

    it('should serve cached image on subsequent request', async () => {
      const firstResponse = await request
        .get('/api/images')
        .query({ filename: 'apitest', width: 150, height: 150 });
      expect(firstResponse.status).toBe(200);

      const secondResponse = await request
        .get('/api/images')
        .query({ filename: 'apitest', width: 150, height: 150 });
      expect(secondResponse.status).toBe(200);
      expect(secondResponse.type).toBe('image/jpeg');

      const cachedPath = path.join(thumbDir, 'apitest_150x150.jpg');
      const exists = await fs
        .access(cachedPath)
        .then(() => true)
        .catch(() => false);
      expect(exists).toBe(true);
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request.get('/nonexistent-route');
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Not Found');
    });
  });
});
