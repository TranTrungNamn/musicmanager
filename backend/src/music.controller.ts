import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import { ScannerService } from './scanner.service';
import * as express from 'express'; // Khắc phục lỗi isolatedModules
import { join } from 'path';
import * as fs from 'fs';

@Controller('music')
export class MusicController {
  constructor(private readonly scannerService: ScannerService) {}

  /**
   * API: Kích hoạt quét thư viện nhạc từ folder đã mount
   * URL: GET http://localhost:3000/music/scan
   */
  @Get('scan')
  async scan() {
    return await this.scannerService.scanLibrary();
  }

  /**
   * API: Lấy ảnh nghệ sĩ (artist.jpg)
   * URL: GET http://localhost:3000/music/artist-pic/Jacob%20Vallen
   */
  @Get('artist-pic/:artistName')
  getArtistPicture(
    @Param('artistName') artistName: string, 
    @Res() res: express.Response // Sử dụng namespace để tránh lỗi metadata
  ) {
    const rootPath = '/usr/src/app/library';
    const imagePath = join(rootPath, artistName, 'artist.jpg');

    if (fs.existsSync(imagePath)) {
      // Gửi file trực tiếp về trình duyệt
      return res.sendFile(imagePath);
    } else {
      throw new NotFoundException(`Không tìm thấy ảnh của nghệ sĩ: ${artistName}`);
    }
  }

  /**
   * API: Kiểm tra xem Docker có thực sự nhìn thấy các folder nhạc không
   * URL: GET http://localhost:3000/music/test-read
   */
  @Get('test-read')
  testRead() {
    const rootPath = '/usr/src/app/library';
    try {
      const folders = fs.readdirSync(rootPath);
      return { 
        status: 'success', 
        message: 'Kết nối thư mục thành công', 
        data: folders 
      };
    } catch (error) {
      return { 
        status: 'error', 
        message: 'Không thể truy cập thư mục library bên trong Docker', 
        error: error.message 
      };
    }
  }
}