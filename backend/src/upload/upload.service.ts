import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class UploadService {
  constructor(private readonly configService: ConfigService) {
    // ── Cloudinary (images) ───────────────────────────────────────────────
    try {
      cloudinary.config({
        cloud_name: configService.get<string>('cloudinary.cloudName'),
        api_key:    configService.get<string>('cloudinary.apiKey'),
        api_secret: configService.get<string>('cloudinary.apiSecret'),
      });
    } catch (e) {}
  }

  // ── Image upload → Cloudinary ──────────────────────────────────────────
  async uploadImage(
    file: Express.Multer.File,
    folder = 'tunisia-car-rental',
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          transformation: [
            { width: 1200, height: 800, crop: 'limit', quality: 'auto', fetch_format: 'auto' },
          ],
        },
        (error, result) => {
          if (error) return reject(error);
          if (!result) return reject(new Error('Upload failed: no result returned'));
          resolve(result);
        },
      );

      const readable = new Readable();
      readable.push(file.buffer);
      readable.push(null);
      readable.pipe(uploadStream);
    });
  }

  // 3D GLB upload is disabled (Supabase storage is not used).
  async uploadRaw(
    _fileBuffer: Buffer,
    _filename: string,
    _folder = 'tunisia-car-rental/3d-models',
  ): Promise<{ secure_url: string; public_id: string }> {
    throw new Error('3D model upload is disabled');
  }

  // ── Image delete → Cloudinary ─────────────────────────────────────────
  async deleteImage(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId);
  }

  extractPublicId(url: string): string {
    const parts = url.split('/');
    const filenameWithExt = parts[parts.length - 1];
    const filename = filenameWithExt.split('.')[0];
    const folder = parts[parts.length - 2];
    return `${folder}/${filename}`;
  }
}
