import {
  Controller, Post, Delete, Param,
  UploadedFile, UseGuards, UseInterceptors,
  BadRequestException, Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import {
  ApiTags, ApiOperation, ApiResponse, ApiBearerAuth,
  ApiParam, ApiConsumes, ApiBody,
} from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

/** Multer file type filter — only allow image MIME types */
const imageFilter = (_req: any, file: Express.Multer.File, cb: any) => {
  if (!file.mimetype.match(/\/(jpg|jpeg|png|webp|gif)$/)) {
    return cb(new BadRequestException('Only image files are allowed'), false);
  }
  cb(null, true);
};

/** Multer file type filter — allow .glb and .gltf files */
const glbFilter = (_req: any, file: Express.Multer.File, cb: any) => {
  if (!file.originalname.match(/\.(glb|gltf)$/i)) {
    return cb(new BadRequestException('Only .glb and .gltf 3D model files are allowed'), false);
  }
  cb(null, true);
};

@ApiTags('Upload')
@ApiBearerAuth('JWT')
@Controller('upload')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  /**
   * Uploads a single image file to Cloudinary.
   *
   * - Accepts: jpg, jpeg, png, webp, gif (max 5 MB)
   * - Image is automatically resized to max 1200×800 px with quality optimisation.
   * - Returns the secure Cloudinary URL to be stored in `vehicle.images[]`.
   */
  @Post('image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      fileFilter: imageFilter,
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    }),
  )
  @ApiOperation({
    summary: '[Admin] Upload an image to Cloudinary',
    description:
      'Uploads a vehicle image to Cloudinary.\n\n' +
      '**Accepted types:** jpg, jpeg, png, webp, gif\n' +
      '**Max size:** 5 MB\n' +
      '**Auto-transform:** resized to max 1200×800, quality & format optimised.\n\n' +
      'Use the returned `url` as a value in the vehicle `images` array.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary', description: 'Image file (jpg/png/webp/gif, max 5 MB)' },
        folder: { type: 'string', example: 'tunisia-car-rental/vehicles', description: 'Cloudinary folder (optional, defaults to tunisia-car-rental)' },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Returns { url, publicId, width, height, format }',
    schema: {
      example: {
        success: true,
        data: {
          url: 'https://res.cloudinary.com/ddf8htsld/image/upload/v1/tunisia-car-rental/abc123.jpg',
          publicId: 'tunisia-car-rental/abc123',
          width: 1200,
          height: 800,
          format: 'jpg',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'No file provided or invalid file type' })
  @ApiResponse({ status: 403, description: 'Forbidden — admin role required' })
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder?: string,
  ) {
    if (!file) throw new BadRequestException('No file provided');
    const result = await this.uploadService.uploadImage(file, folder);
    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
    };
  }

  /**
   * Uploads a 3D model file (.glb / .gltf) to Cloudinary.
   */
  @Post('glb')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      fileFilter: glbFilter,
      limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
    }),
  )
  @ApiOperation({
    summary: '[Admin] Upload a 3D GLB model to Cloudinary',
    description: 'Uploads a vehicle 3D model (.glb / .gltf) to Cloudinary (max 50 MB).',
  })
  @ApiConsumes('multipart/form-data')
  async uploadGlb(
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder?: string,
  ) {
    if (!file) throw new BadRequestException('No 3D file provided');
    const safeName = file.originalname.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${safeName}_${Date.now()}`;
    try {
      const result = await this.uploadService.uploadRaw(file.buffer, filename, folder || 'tunisia-car-rental/3d-models');
      return {
        url: result.secure_url,
        publicId: result.public_id,
      };
    } catch (err) {
      console.error('[uploadGlb] Failed:', err?.message);
      throw new BadRequestException(err?.message || 'GLB upload to Cloudinary failed');
    }
  }

  /**
   * Deletes an image from Cloudinary by its `public_id`.
   * The `publicId` path parameter must be URL-encoded if it contains slashes.
   */
  @Delete('image/:publicId')
  @ApiOperation({
    summary: '[Admin] Delete an image from Cloudinary',
    description:
      'Removes an image from Cloudinary by its `public_id`.\n\n' +
      '**Note:** URL-encode slashes in the publicId (e.g. `tunisia-car-rental%2Fabc123`).',
  })
  @ApiParam({ name: 'publicId', description: 'URL-encoded Cloudinary public_id', example: 'tunisia-car-rental%2Fabc123' })
  @ApiResponse({ status: 200, description: '{ message: "Image deleted successfully" }' })
  @ApiResponse({ status: 403, description: 'Forbidden — admin role required' })
  async deleteImage(@Param('publicId') publicId: string) {
    await this.uploadService.deleteImage(decodeURIComponent(publicId));
    return { message: 'Image deleted successfully' };
  }
}
