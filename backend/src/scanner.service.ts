import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import { join } from 'path';
import * as mm from 'music-metadata';
import { Artist } from './entities/artist.entity';
import { Album } from './entities/album.entity';
import { Track } from './entities/track.entity';

@Injectable()
export class ScannerService {
  constructor(
    @InjectRepository(Artist) private artistRepo: Repository<Artist>,
    @InjectRepository(Album) private albumRepo: Repository<Album>,
    @InjectRepository(Track) private trackRepo: Repository<Track>,
  ) {}

  private readonly rootPath = '/usr/src/app/library';

  async scanLibrary() {
    const artistFolders = fs.readdirSync(this.rootPath);
    const results: any[] = []; // Khai báo any[] để tránh lỗi 'never'

    for (const artistName of artistFolders) {
      const artistPath = join(this.rootPath, artistName);
      if (!fs.lstatSync(artistPath).isDirectory()) continue;

      // Kiểm tra ảnh nghệ sĩ
      const artistFiles = fs.readdirSync(artistPath);
      const hasArtistPic = artistFiles.includes('artist.jpg');

      // 1. Tìm hoặc tạo Artist (Đảm bảo dùng findOne để lấy đối tượng đơn lẻ)
      let artist = await this.artistRepo.findOne({ where: { name: artistName } });
      
      if (!artist) {
        artist = await this.artistRepo.save(
          this.artistRepo.create({ 
            name: artistName,
            picturePath: hasArtistPic ? join(artistName, 'artist.jpg') : null 
          })
        );
      } else if (hasArtistPic && !artist.picturePath) {
        artist.picturePath = join(artistName, 'artist.jpg');
        await this.artistRepo.save(artist);
      }

      const albumFolders = fs.readdirSync(artistPath);
      for (const albumFolderName of albumFolders) {
        const info = this.parseAlbumFolder(albumFolderName);
        
        // Phải kiểm tra 'artist' tồn tại để tránh lỗi 'possibly null'
        if (info && artist) {
          const albumPath = join(artistPath, albumFolderName);
          
          // 2. Lưu Album (Ép kiểu string sang number để khớp với Entity)
          const album = await this.albumRepo.save(this.albumRepo.create({
            title: info.title,
            releaseYear: parseInt(info.year), 
            bitDepth: parseInt(info.bitDepth),
            sampleRate: parseFloat(info.sampleRate),
            artist: artist, // Gán trực tiếp đối tượng Artist vừa tìm/tạo được
            coverPath: join(artistName, albumFolderName, 'cover.jpg')
          }));

          const files = fs.readdirSync(albumPath);
          for (const fileName of files) {
            if (fileName.endsWith('.flac')) {
              const filePath = join(albumPath, fileName);
              const metadata = await mm.parseFile(filePath);
              
              // 3. Lưu Track
              await this.trackRepo.save(this.trackRepo.create({
                title: metadata.common.title || fileName,
                fileName: fileName,
                relativePath: join(artistName, albumFolderName, fileName),
                duration: Math.round(metadata.format.duration || 0),
                bitDepth: metadata.format.bitsPerSample,
                sampleRate: metadata.format.sampleRate,
                album: album
              }));
            }
          }
          results.push({ artist: artistName, album: info.title });
        }
      }
    }
    return results;
  }

  private parseAlbumFolder(folderName: string) {
    const regex = /^(?<artist>.+?) - (?<title>.+?) \((?<year>\d{4})\) \[(?<bit>\d+)B-(?<sample>[\d.]+)kHz\]$/;
    const match = folderName.match(regex);

    // Kiểm tra match.groups để tránh lỗi 'possibly undefined'
    if (match && match.groups) {
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