import express, { Request, Response } from 'express';
import { resizeImage, ResizeParams } from '../../utils/imageProcessor';

const router = express.Router();

/**
 * GET /api/images
 * Endpoint to resize images based on query parameters
 * Query params:
 *  - filename: Name of the image file (without extension)
 *  - width: Desired width in pixels
 *  - height: Desired height in pixels
 *  - format: (Optional) Output format (jpg, png, webp, gif, tiff, avif)
 *
 * Examples:
 *  - /api/images?filename=argentina&width=100&height=100
 *  - /api/images?filename=photo&width=200&height=200&format=webp
 *  - /api/images?filename=logo&width=300&height=300&format=png
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { filename, width, height, format } = req.query;

    // Validate that all required parameters are provided
    if (!filename) {
      res.status(400).json({
        error: 'Missing required parameter: filename',
        message: 'Please provide a filename parameter',
      });
      return;
    }

    if (!width || !height) {
      res.status(400).json({
        error: 'Missing required parameters',
        message: 'Both width and height parameters are required',
      });
      return;
    }

    // Prepare resize parameters
    const resizeParams: ResizeParams = {
      filename: filename as string,
      width: Number(width),
      height: Number(height),
      format: format ? (format as string) : undefined,
    };

    // Process the image
    const result = await resizeImage(resizeParams);

    if (!result.success) {
      // Handle different error types
      if (result.error?.includes('not found')) {
        res.status(404).json({
          error: 'Image not found',
          message: result.error,
        });
        return;
      }

      res.status(400).json({
        error: 'Image processing failed',
        message: result.error,
      });
      return;
    }

    // Send the resized image
    if (result.outputPath) {
      res.sendFile(result.outputPath, (err) => {
        if (err) {
          console.error('Error sending file:', err);
          res.status(500).json({
            error: 'Failed to send image',
            message: 'An error occurred while sending the resized image',
          });
        }
      });
    }
  } catch (error) {
    console.error('Unexpected error in /api/images:', error);
    res.status(500).json({
      error: 'Internal server error',
      message:
        error instanceof Error ? error.message : 'An unexpected error occurred',
    });
  }
});

export default router;
