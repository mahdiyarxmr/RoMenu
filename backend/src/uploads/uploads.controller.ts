import {
  Controller,
  Post,
  Get,
  Param,
  Res,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';

const UPLOAD_DIR = join(process.cwd(), 'uploads', 'products');
if (!existsSync(UPLOAD_DIR)) {
  mkdirSync(UPLOAD_DIR, { recursive: true });
}

@Controller('uploads')
export class UploadsController {
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'finance_admin')
  @Post('product-image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: UPLOAD_DIR,
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname).toLowerCase();
          cb(null, `prod-${uniqueSuffix}${ext}`);
        },
      }),
      limits: { fileSize: 3 * 1024 * 1024 }, // 3MB
      fileFilter: (req, file, cb) => {
        const allowed = /\.(jpg|jpeg|png|webp)$/i;
        if (!file.originalname.match(allowed)) {
          return cb(new BadRequestException('تنها فرمت‌های JPG, PNG و WebP مجاز هستند'), false);
        }
        cb(null, true);
      },
    }),
  )
  uploadProductImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('فایل تصویری ارسال نشده است');
    return {
      url: `/uploads/products/${file.filename}`,
    };
  }

  @Public()
  @Get('products/:filename')
  serveProductImage(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = join(UPLOAD_DIR, filename);
    if (!existsSync(filePath)) {
      return res.status(404).send('Not Found');
    }
    return res.sendFile(filePath);
  }
}
