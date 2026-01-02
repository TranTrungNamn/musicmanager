import { Controller, Get } from '@nestjs/common';
import * as fs from 'fs';
import { join } from 'path';

@Controller('music')
export class MusicController {
  @Get('test-read')
  testRead() {
    // Đường dẫn bên trong Docker mà bạn đã mount ở docker-compose
    const rootPath = '/usr/src/app/library'; 
    
    try {
      const files = fs.readdirSync(rootPath);
      return {
        message: 'Kết nối thư mục thành công!',
        foldersInRoot: files,
      };
    } catch (error) {
      return { error: 'Không tìm thấy thư mục. Hãy kiểm tra lại Docker Volume!' };
    }
  }
}