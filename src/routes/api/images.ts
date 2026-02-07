import express, { Request, Response } from 'express';
import { resizeImage } from '../../utils/imageProcessor';
import { IResizeParams } from '../../interfaces/IImageProcessor';

const router = express.Router();

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { filename, width, height, format } = req.query;

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

    const resizeParams: IResizeParams = {
      filename: filename as string,
      width: Number(width),
      height: Number(height),
      format: format ? (format as string) : undefined,
    };

    const result = await resizeImage(resizeParams);

    if (!result.success) {
      const status = result.error?.includes('not found') ? 404 : 400;
      const error =
        status === 404 ? 'Image not found' : 'Image processing failed';
      res.status(status).json({ error, message: result.error });
      return;
    }

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
