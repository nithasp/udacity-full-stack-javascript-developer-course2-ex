# Image Processing API

A high-performance image resizing API built with Node.js, Express, TypeScript, and Sharp. Supports multiple formats with automatic caching.

## Features

- Fast image resizing powered by Sharp
- Automatic caching for optimal performance
- Multiple format support (JPG, PNG, WebP, GIF, TIFF, AVIF)
- Comprehensive error handling and validation
- Full test coverage with Jasmine and SuperTest
- TypeScript with ESLint and Prettier

## Quick Start

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Start the server
npm start
```

Server runs on `http://localhost:5000`

## API Endpoints

### GET /
Returns API information and usage instructions

### GET /api/images
Resize images with query parameters

**Required Parameters:**
- `filename` - Image name without extension
- `width` - Width in pixels (positive integer)
- `height` - Height in pixels (positive integer)

**Optional Parameters:**
- `format` - Output format (jpg, png, webp, gif, tiff, avif)

**Examples:**
http://localhost:5000/api/images?filename=beach&width=300&height=300

## Available Scripts

```bash
npm run build    # Compile TypeScript
npm start        # Start production server
npm run dev      # Start with auto-reload
npm test         # Run all tests
npm run lint     # Check code quality
npm run format   # Format code
```

## Project Structure
```
src/
├── index.ts                    # Express server
├── interfaces/
│   └── IImageProcessor.ts      # Image processor interface
├── routes/
│   └── api/
│       └── images.ts           # Image endpoint
├── utils/
│   └── imageProcessor.ts       # Image processing logic
└── tests/
    ├── integration/
    │   └── api.spec.ts         # API integration tests
    └── unit/
        └── imageProcessor.spec.ts  # Unit tests
assets/
├── full/                       # Original images
└── thumb/                      # Cached resized images
spec/
├── helpers/
│   └── reporter.ts             # Jasmine test reporter
└── support/
    └── jasmine.json            # Jasmine configuration
```

## How It Works

1. Place original images in `assets/full/`
2. Request an image with specific dimensions
3. First request: API resizes and caches the image
4. Subsequent requests: Serves from cache (faster)

## Testing

```bash
npm test
```

Includes comprehensive tests for:
- API endpoints (success and error scenarios)
- Image processing utilities
- Parameter validation
- Caching functionality
