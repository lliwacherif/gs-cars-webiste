import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { randomBytes } from 'crypto';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { extname, join } from 'path';
import { Readable } from 'stream';

const UPLOAD_DIR = join(process.cwd(), 'uploads');
const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

@Injectable()
export class UploadService {
  private readonly cloudinaryReady: boolean;

  constructor(private readonly configService: ConfigService) {
    const cloudName = configService.get<string>('cloudinary.cloudName');
    const apiKey = configService.get<string>('cloudinary.apiKey');
    const apiSecret = configService.get<string>('cloudinary.apiSecret');
    this.cloudinaryReady = Boolean(cloudName && apiKey && apiSecret);
    if (this.cloudinaryReady) {
      cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
    }
  }

  // ── Image upload → Cloudinary ──────────────────────────────────────────
  async uploadImage(
    file: Express.Multer.File,
    folder = 'tunisia-car-rental',
    baseUrl = 'http://localhost:3000',
  ): Promise<UploadApiResponse> {
    if (!this.cloudinaryReady) return this.saveLocalImage(file, baseUrl);

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

  private async saveLocalImage(file: Express.Multer.File, baseUrl: string): Promise<UploadApiResponse> {
    await mkdir(UPLOAD_DIR, { recursive: true });
    const rawExt = extname(file.originalname || '').toLowerCase();
    const ext = IMAGE_EXTS.has(rawExt) ? rawExt : '.jpg';
    const filename = `${Date.now()}-${randomBytes(6).toString('hex')}${ext}`;
    await writeFile(join(UPLOAD_DIR, filename), file.buffer);

    return {
      secure_url: `${baseUrl.replace(/\/$/, '')}/uploads/${filename}`,
      public_id: filename,
      width: 0,
      height: 0,
      format: ext.slice(1),
    } as UploadApiResponse;
  }

  // ── Image delete → Cloudinary or local disk ──────────────────────────
  async deleteImage(publicId: string): Promise<void> {
    if (!publicId.includes('/') && !this.cloudinaryReady) {
      await unlink(join(UPLOAD_DIR, publicId)).catch(() => undefined);
      return;
    }
    if (this.cloudinaryReady) await cloudinary.uploader.destroy(publicId);
  }

  extractPublicId(url: string): string {
    const parts = url.split('/');
    const filenameWithExt = parts[parts.length - 1];
    const filename = filenameWithExt.split('.')[0];
    const folder = parts[parts.length - 2];
    return `${folder}/${filename}`;
  }
}
