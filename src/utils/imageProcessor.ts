import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

/**
 * Supported image formats
 */
export const SUPPORTED_FORMATS = [
  'jpg',
  'jpeg',
  'png',
  'webp',
  'gif',
  'tiff',
  'avif',
] as const;

/**
 * Interface for image resize parameters
 */
export interface ResizeParams {
  filename: string;
  width: number;
  height: number;
  format?: string; // Optional output format
}

/**
 * Interface for image processing result
 */
export interface ProcessingResult {
  success: boolean;
  outputPath?: string;
  error?: string;
  cached?: boolean;
}

/**
 * Validates if a file exists at the given path
 * @param filePath - Path to check
 * @returns Promise<boolean> - True if file exists
 */
export const fileExists = async (filePath: string): Promise<boolean> => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validates resize parameters
 * @param params - Resize parameters to validate
 * @returns Object with isValid flag and optional error message
 */
export const validateResizeParams = (
  params: ResizeParams
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
    return {
      isValid: false,
      error: 'Width and height must be valid numbers',
    };
  }

  if (widthNum <= 0 || heightNum <= 0) {
    return {
      isValid: false,
      error: 'Width and height must be positive numbers',
    };
  }

  return { isValid: true };
};

/**
 * Creates directory if it doesn't exist
 * @param dirPath - Directory path to create
 */
export const ensureDirectoryExists = async (dirPath: string): Promise<void> => {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
};

/**
 * Finds an image file with any supported extension
 * @param baseDir - Directory to search in
 * @param filename - Filename without extension
 * @returns Object with the full path and extension if found
 */
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

/**
 * Gets the output format configuration for Sharp
 * @param format - Desired output format
 * @returns Sharp format options
 */
export const getFormatOptions = (
  format: string
): { format: string; options: Record<string, unknown> } => {
  switch (format.toLowerCase()) {
    case 'jpg':
    case 'jpeg':
      return { format: 'jpeg', options: { quality: 90 } };
    case 'png':
      return { format: 'png', options: { compressionLevel: 9 } };
    case 'webp':
      return { format: 'webp', options: { quality: 90 } };
    case 'gif':
      return { format: 'gif', options: {} };
    case 'tiff':
      return { format: 'tiff', options: { quality: 90 } };
    case 'avif':
      return { format: 'avif', options: { quality: 90 } };
    default:
      return { format: 'jpeg', options: { quality: 90 } };
  }
};

/**
 * Resizes an image using Sharp library
 * Supports multiple input formats: jpg, jpeg, png, webp, gif, tiff, avif
 * @param params - Image resize parameters
 * @returns Promise<ProcessingResult> - Result of the processing operation
 */
export const resizeImage = async (
  params: ResizeParams
): Promise<ProcessingResult> => {
  try {
    const { filename, width, height, format } = params;

    // Validate parameters
    const validation = validateResizeParams(params);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error,
      };
    }

    // Define base directory
    const fullDir = path.join(process.cwd(), 'assets', 'full');
    const thumbDir = path.join(process.cwd(), 'assets', 'thumb');

    // Find the original image with any supported extension
    const imageFile = await findImageFile(fullDir, filename);
    if (!imageFile) {
      return {
        success: false,
        error: `Image '${filename}' not found in full folder. Supported formats: ${SUPPORTED_FORMATS.join(', ')}`,
      };
    }

    // Determine output format (use provided format or keep original)
    const outputFormat = format || imageFile.extension;
    const outputExt =
      outputFormat === 'jpeg' ? 'jpg' : outputFormat.toLowerCase();

    // Define thumb path with format extension
    const thumbPath = path.join(
      thumbDir,
      `${filename}_${width}x${height}.${outputExt}`
    );

    // Ensure thumb directory exists
    await ensureDirectoryExists(thumbDir);

    // Check if resized image already exists (caching)
    const thumbExists = await fileExists(thumbPath);
    if (thumbExists) {
      return {
        success: true,
        outputPath: thumbPath,
        cached: true,
      };
    }

    // Get format-specific options
    const { format: sharpFormat, options: formatOptions } =
      getFormatOptions(outputFormat);

    // Resize the image with the specified format
    const sharpInstance = sharp(imageFile.filePath).resize(
      Number(width),
      Number(height),
      {
        fit: 'cover',
        position: 'center',
      }
    );

    // Apply format-specific conversion
    switch (sharpFormat) {
      case 'jpeg':
        await sharpInstance
          .jpeg(formatOptions as sharp.JpegOptions)
          .toFile(thumbPath);
        break;
      case 'png':
        await sharpInstance
          .png(formatOptions as sharp.PngOptions)
          .toFile(thumbPath);
        break;
      case 'webp':
        await sharpInstance
          .webp(formatOptions as sharp.WebpOptions)
          .toFile(thumbPath);
        break;
      case 'gif':
        await sharpInstance
          .gif(formatOptions as sharp.GifOptions)
          .toFile(thumbPath);
        break;
      case 'tiff':
        await sharpInstance
          .tiff(formatOptions as sharp.TiffOptions)
          .toFile(thumbPath);
        break;
      case 'avif':
        await sharpInstance
          .avif(formatOptions as sharp.AvifOptions)
          .toFile(thumbPath);
        break;
      default:
        await sharpInstance
          .jpeg(formatOptions as sharp.JpegOptions)
          .toFile(thumbPath);
    }

    return {
      success: true,
      outputPath: thumbPath,
      cached: false,
    };
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
