/**
 * Interface for image resize parameters
 */
export interface IResizeParams {
  filename: string;
  width: number;
  height: number;
  format?: string; // Optional output format
}

/**
 * Interface for image processing result
 */
export interface IProcessingResult {
  success: boolean;
  outputPath?: string;
  error?: string;
  cached?: boolean;
}
