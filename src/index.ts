import express, { Application, Request, Response } from 'express';
import imagesRouter from './routes/api/images';

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req: Request, _res: Response, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// API Routes
app.use('/api/images', imagesRouter);

// Root endpoint
app.get('/', (_req: Request, res: Response): void => {
  res.json({
    message: 'Image Processing API',
    version: '2.0.0',
    description:
      'Resize images with support for multiple formats: jpg, jpeg, png, webp, gif, tiff, avif',
    endpoints: {
      images:
        '/api/images?filename=<name>&width=<pixels>&height=<pixels>&format=<format>',
    },
    parameters: {
      filename: 'Image name without extension (required)',
      width: 'Width in pixels (required)',
      height: 'Height in pixels (required)',
      format: 'Output format: jpg, png, webp, gif, tiff, avif (optional)',
    },
    examples: [
      '/api/images?filename=argentina&width=100&height=100',
      '/api/images?filename=photo&width=200&height=200&format=webp',
      '/api/images?filename=logo&width=300&height=300&format=png',
    ],
    supportedFormats: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'tiff', 'avif'],
  });
});

// 404 handler
app.use((req: Request, res: Response): void => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.path} not found`,
  });
});

// Start server only if not in test environment
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, (): void => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Image resize endpoint: http://localhost:${PORT}/api/images`);
  });
}

export default app;
