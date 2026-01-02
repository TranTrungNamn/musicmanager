import { Injectable } from '@nestjs/common';
import { join, relative } from 'path';

@Injectable()
export class FileManagerService {
  private readonly rootPath = '/usr/src/app/library';

  // Chuyển đường dẫn tuyệt đối sang tương đối để lưu vào DB
  getRelativePath(absolutePath: string): string {
    return relative(this.rootPath, absolutePath);
  }

  // Tạo đường dẫn đầy đủ để NestJS có thể đọc file
  getAbsolutePath(relativePath: string): string {
    return join(this.rootPath, relativePath);
  }

  // Kiểm tra file có tồn tại không trước khi xử lý
  exists(path: string): boolean {
    const fs = require('fs');
    return fs.existsSync(this.getAbsolutePath(path));
  }
}