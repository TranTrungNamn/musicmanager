import { Injectable, NotFoundException } from '@nestjs/common';
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
    const results: any[] = [];

    for (const artistName of artistFolders) {
      const artistPath = join(this.rootPath, artistName);
      if (!fs.lstatSync(artistPath).isDirectory()) continue;

      // 1. Tìm hoặc tạo Artist
      let artist = await this.artistRepo.findOne({ where: { name: artistName } });
      if (!artist) {
        artist = await this.artistRepo.save(this.artistRepo.create({
          name: artistName,
          picturePath: fs.existsSync(join(artistPath, 'artist.jpg')) ? 'artist.jpg' : null
        }));
        console.log(`[SCAN] Đã tạo Artist: ${artistName}`);
      }

      const albumFolders = fs.readdirSync(artistPath);
      for (const albumFolderName of albumFolders) {
        console.log(`Checking folder: ${albumFolderName}`);
        
        const albumPath = join(artistPath, albumFolderName);
        if (!fs.lstatSync(albumPath).isDirectory()) continue;
        const info = this.parseAlbumFolder(albumFolderName);

        if (!info) {
          console.log(`!!! Folder sai định dạng Regex: ${albumFolderName}`); 
          continue;
        }

        if (info) {
          // 2. Tìm hoặc tạo Album (Gắn vào Artist trên)
          let album = await this.albumRepo.findOne({ 
            where: { title: info.title, artist: { id: artist.id } } 
          });

          if (!album) {
            album = await this.albumRepo.save(this.albumRepo.create({
              title: info.title,
              releaseYear: parseInt(info.year),
              bitDepth: parseInt(info.bitDepth),
              sampleRate: parseFloat(info.sampleRate),
              artist: artist,
              coverPath: join(artistName, albumFolderName, 'cover.jpg')
            }));
            console.log(`[SCAN]   -> Đã tạo Album: ${info.title}`);
          }

          // 3. Quét file .flac và lưu Track (Gắn vào Album trên)
          const files = fs.readdirSync(albumPath);
          for (const fileName of files) {
            if (fileName.endsWith('.flac')) {
              const trackExist = await this.trackRepo.findOne({
                where: { fileName: fileName, album: { id: album.id } }
              });

              if (!trackExist) {
                const metadata = await mm.parseFile(join(albumPath, fileName));
                await this.trackRepo.save(this.trackRepo.create({
                  title: metadata.common.title || fileName,
                  fileName: fileName,
                  relativePath: join(artistName, albumFolderName, fileName),
                  duration: Math.round(metadata.format.duration || 0),
                  bitDepth: metadata.format.bitsPerSample,
                  sampleRate: metadata.format.sampleRate,
                  album: album
                }));
                console.log(`[SCAN]     - Đã lưu Track: ${fileName}`);
              }
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

    if (match && match.groups) {
      return {
        title: match.groups.title,
        year: match.groups.year,
        bitDepth: match.groups.bit,
        sampleRate: match.groups.sample,
      };
    }

    // CHẾ ĐỘ DỰ PHÒNG: Nếu tên thư mục không đúng chuẩn, vẫn lấy tên đó làm tên Album
    return {
      title: folderName, 
      year: "2026",
      bitDepth: "24",
      sampleRate: "96"
    };
  }

  // --- CÁC HÀM TRUY VẤN DỮ LIỆU ---
  async getAllArtists() {
    return await this.artistRepo.find({ order: { name: 'ASC' } });
  }

  async getAlbumsByArtist(artistId: string) {
    return await this.albumRepo.find({
      where: { artist: { id: artistId } },
      order: { releaseYear: 'DESC' }
    });
  }

  async getAlbumById(albumId: string) {
    return await this.albumRepo.findOne({ 
      where: { id: albumId }, 
      relations: ['artist'] 
    });
  }

  async getTracksByAlbum(albumId: string) {
    return await this.trackRepo.find({
      where: { album: { id: albumId } },
      order: { fileName: 'ASC' }
    });
  }

  async getTrackById(trackId: string) {
    return await this.trackRepo.findOne({ where: { id: trackId } });
  }
}