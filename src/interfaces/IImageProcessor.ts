export interface IResizeParams {
  filename: string;
  width: number;
  height: number;
  format?: string;
}

export interface IProcessingResult {
  success: boolean;
  outputPath?: string;
  error?: string;
  cached?: boolean;
}
