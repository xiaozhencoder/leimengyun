import { Injectable, BadRequestException } from '@nestjs/common'
import { extname } from 'path'
import { randomUUID } from 'crypto'

@Injectable()
export class UploadService {
  generateFilename(originalname: string): string {
    const ext = extname(originalname).toLowerCase()
    return `${randomUUID()}${ext}`
  }

  getFileUrl(filename: string): string {
    return `/uploads/${filename}`
  }

  validateImageFile(mimetype: string, size: number): void {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowed.includes(mimetype)) {
      throw new BadRequestException('仅支持 JPEG、PNG、GIF、WebP 格式的图片')
    }
    if (size > 10 * 1024 * 1024) {
      throw new BadRequestException('图片大小不能超过 10MB')
    }
  }
}
