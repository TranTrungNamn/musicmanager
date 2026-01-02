import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import { join } from 'path';
import * as mm from 'music-metadata';

@Injectable()
export class ScannerService {
  private readonly rootPath = '/usr/src/app/library';

  async scanLibrary() {
    // 1. Đọc danh sách nghệ sĩ (Thư mục cấp 1: Arctic Monkeys)
    const artists = fs.readdirSync(this.rootPath);
    const results = [];

    for (const artistName of artists) {
      const artistPath = join(this.rootPath, artistName);
      if (!fs.lstatSync(artistPath).isDirectory()) continue;

      // 2. Đọc danh sách Album (Thư mục cấp 2)
      const albums = fs.readdirSync(artistPath);
      for (const albumFolderName of albums) {
        // Sử dụng Regex để bóc tách thông tin từ tên folder của bạn
        const albumInfo = this.parseAlbumFolder(albumFolderName);
        
        if (albumInfo) {
          const albumPath = join(artistPath, albumFolderName);
          
          // 3. Đọc các file bên trong Album (Track và Cover)
          const files = fs.readdirSync(albumPath);
          const tracks = [];

          for (const fileName of files) {
            if (fileName.endsWith('.flac')) {
              const filePath = join(albumPath, fileName);
              // Đọc metadata bên trong file FLAC (Thời lượng, sample rate thật...)
              const metadata = await mm.parseFile(filePath);
              
              tracks.push({
                fileName,
                title: metadata.common.title || fileName,
                duration: metadata.format.duration,
                sampleRate: metadata.format.sampleRate,
                bitDepth: metadata.format.bitsPerSample
              });
            }
          }

          results.push({
            artist: artistName,
            album: albumInfo,
            tracks: tracks,
            hasCover: files.includes('cover.jpg')
          });
        }
      }
    }
    return results;
  }

  // Hàm Regex xử lý cấu trúc: "Artist - Album (Year) [Bit-Sample]"
  private parseAlbumFolder(folderName: string) {
    const regex = /^(?<artist>.+?) - (?<title>.+?) \((?<year>\d{4})\) \[(?<bit>\d+)B-(?<sample>[\d.]+)kHz\]$/;
    const match = folderName.match(regex);

    if (match) {
      return {
        title: match.groups.title,
        year: match.groups.year,
        bitDepth: match.groups.bit,
        sampleRate: match.groups.sample,
      };
    }
    return null;
  }
}