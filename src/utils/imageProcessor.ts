import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import {
  IResizeParams,
  IProcessingResult,
} from '../interfaces/IImageProcessor';

export const SUPPORTED_FORMATS = [
  'jpg',
  'jpeg',
  'png',
  'webp',
  'gif',
  'tiff',
  'avif',
] as const;

export const fileExists = async (filePath: string): Promise<boolean> => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

export const validateResizeParams = (
  params: IResizeParams
): { isValid: boolean; error?: string } => {
  const { filename, width, height } = params;

  if (!filename || filename.trim() === '') {
    return { isValid: false, error: 'Filename is required' };
  }

  if (
    width === null ||
    width === undefined ||
    height === null ||
    height === undefined
  ) {
    return {
      isValid: false,
      error: 'Both width and height parameters are required',
    };
  }

  const widthNum = Number(width);
  const heightNum = Number(height);

  if (isNaN(widthNum) || isNaN(heightNum)) {
    return { isValid: false, error: 'Width and height must be valid numbers' };
  }

  if (widthNum <= 0 || heightNum <= 0) {
    return {
      isValid: false,
      error: 'Width and height must be positive numbers',
    };
  }

  return { isValid: true };
};

export const ensureDirectoryExists = async (dirPath: string): Promise<void> => {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
};

export const findImageFile = async (
  baseDir: string,
  filename: string
): Promise<{ filePath: string; extension: string } | null> => {
  for (const ext of SUPPORTED_FORMATS) {
    const filePath = path.join(baseDir, `${filename}.${ext}`);
    if (await fileExists(filePath)) {
      return { filePath, extension: ext };
    }
  }
  return null;
};

const getFormatOptions = (
  format: string
): { format: string; options: Record<string, unknown> } => {
  const normalizedFormat = format.toLowerCase();
  const quality = { quality: 90 };

  switch (normalizedFormat) {
    case 'jpg':
    case 'jpeg':
      return { format: 'jpeg', options: quality };
    case 'png':
      return { format: 'png', options: { compressionLevel: 9 } };
    case 'webp':
    case 'tiff':
    case 'avif':
      return { format: normalizedFormat, options: quality };
    case 'gif':
      return { format: 'gif', options: {} };
    default:
      return { format: 'jpeg', options: quality };
  }
};

const applyFormat = async (
  sharpInstance: sharp.Sharp,
  format: string,
  options: Record<string, unknown>,
  outputPath: string
): Promise<void> => {
  switch (format) {
    case 'jpeg':
      await sharpInstance.jpeg(options as sharp.JpegOptions).toFile(outputPath);
      break;
    case 'png':
      await sharpInstance.png(options as sharp.PngOptions).toFile(outputPath);
      break;
    case 'webp':
      await sharpInstance.webp(options as sharp.WebpOptions).toFile(outputPath);
      break;
    case 'gif':
      await sharpInstance.gif(options as sharp.GifOptions).toFile(outputPath);
      break;
    case 'tiff':
      await sharpInstance.tiff(options as sharp.TiffOptions).toFile(outputPath);
      break;
    case 'avif':
      await sharpInstance.avif(options as sharp.AvifOptions).toFile(outputPath);
      break;
    default:
      await sharpInstance.jpeg(options as sharp.JpegOptions).toFile(outputPath);
  }
};

export const resizeImage = async (
  params: IResizeParams
): Promise<IProcessingResult> => {
  try {
    const { filename, width, height, format } = params;

    const validation = validateResizeParams(params);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    const fullDir = path.join(process.cwd(), 'assets', 'full');
    const thumbDir = path.join(process.cwd(), 'assets', 'thumb');

    const imageFile = await findImageFile(fullDir, filename);
    if (!imageFile) {
      return {
        success: false,
        error: `Image '${filename}' not found in full folder. Supported formats: ${SUPPORTED_FORMATS.join(', ')}`,
      };
    }

    const outputFormat = format || imageFile.extension;
    const outputExt =
      outputFormat === 'jpeg' ? 'jpg' : outputFormat.toLowerCase();
    const thumbPath = path.join(
      thumbDir,
      `${filename}_${width}x${height}.${outputExt}`
    );

    await ensureDirectoryExists(thumbDir);

    if (await fileExists(thumbPath)) {
      return { success: true, outputPath: thumbPath, cached: true };
    }

    const { format: sharpFormat, options: formatOptions } =
      getFormatOptions(outputFormat);
    const sharpInstance = sharp(imageFile.filePath).resize(
      Number(width),
      Number(height),
      {
        fit: 'cover',
        position: 'center',
      }
    );

    await applyFormat(sharpInstance, sharpFormat, formatOptions, thumbPath);

    return { success: true, outputPath: thumbPath, cached: false };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'An unknown error occurred during image processing',
    };
  }
};
