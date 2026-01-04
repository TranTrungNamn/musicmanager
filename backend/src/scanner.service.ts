import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { join } from 'path';
import * as path from 'path';
import * as fs from 'fs';
import { Artist } from './entities/artist.entity';
import { Album } from './entities/album.entity';
import { Track } from './entities/track.entity';
import { ScanHistory } from './entities/scan-history.entity';

@Injectable()
export class ScannerService {
  private readonly logger = new Logger(ScannerService.name);

  constructor(
    @InjectRepository(ScanHistory) private historyRepo: Repository<ScanHistory>,
    @InjectRepository(Artist) private artistRepo: Repository<Artist>,
    @InjectRepository(Album) private albumRepo: Repository<Album>,
    @InjectRepository(Track) private trackRepo: Repository<Track>,
  ) {}

  // Hàm quét chính
  async scanDirectory(customPath: string) {
    if (!fs.existsSync(customPath)) throw new Error(`Path not found: ${customPath}`);
    await this.historyRepo.save({ path: customPath });

    const artistFolders = fs.readdirSync(customPath);
    const results: any[] = [];

    for (const artistName of artistFolders) {
      const artistPath = join(customPath, artistName);
      if (!fs.lstatSync(artistPath).isDirectory()) continue;

      let artist = await this.artistRepo.findOne({ where: { name: artistName } });
      if (!artist) {
        artist = await this.artistRepo.save(this.artistRepo.create({ name: artistName }));
      }

      const albumFolders = fs.readdirSync(artistPath);
      for (const albumFolderName of albumFolders) {
        const albumPath = join(artistPath, albumFolderName);
        if (!fs.lstatSync(albumPath).isDirectory()) continue;

        const info = this.parseAlbumFolder(albumFolderName);
        
        // SỬA LỖI TS2740: Sử dụng findOne để lấy đúng 1 Object
        let currentAlbum = await this.albumRepo.findOne({ 
          where: { title: info.title, artist: { id: artist.id } } 
        });
        
        if (!currentAlbum) {
          // SỬA LỖI TS2769: Khai báo kiểu DeepPartial rõ ràng
          const albumData: DeepPartial<Album> = {
            title: info.title,
            releaseYear: info.year,
            bitDepth: info.bitDepth,
            sampleRate: info.sampleRate,
            artist: artist
          };
          currentAlbum = await this.albumRepo.save(this.albumRepo.create(albumData));
        }

        const files = fs.readdirSync(albumPath);
        for (const fileName of files) {
          if (['.flac', '.mp3', '.wav'].includes(path.extname(fileName).toLowerCase())) {
            const filePath = join(albumPath, fileName);
            const existingTrack = await this.trackRepo.findOne({ where: { path: filePath } });
            
            if (!existingTrack && currentAlbum) {
              const trackData: DeepPartial<Track> = {
                title: path.parse(fileName).name,
                path: filePath,
                duration: 0,
                album: currentAlbum
              };
              await this.trackRepo.save(this.trackRepo.create(trackData));
            }
          }
        }
        results.push({ artist: artistName, album: info.title });
      }
    }
    return results;
  }

  // --- CÁC HÀM BỔ SUNG CHO CONTROLLER ---
  async scanLibrary() { return this.scanDirectory('/music_data'); }
  async getAllArtists() { return await this.artistRepo.find({ order: { name: 'ASC' } }); }
  async getAlbumsByArtist(id: any) { return await this.albumRepo.find({ where: { artist: { id } }, order: { releaseYear: 'DESC' } }); }
  async getAlbumById(id: any) { 
    const album = await this.albumRepo.findOne({ where: { id }, relations: ['artist'] });
    if (!album) throw new NotFoundException();
    return album;
  }
  async getTracksByAlbum(id: any) { return await this.trackRepo.find({ where: { album: { id } }, order: { title: 'ASC' } }); }
  async getTrackById(id: any) { return await this.trackRepo.findOne({ where: { id }, relations: ['album'] }); }

  private parseAlbumFolder(folderName: string) {
    const regex = /^(.*?) - (.*?) \((\d{4})\) \[(\d+)B-([\d.]+)kHz\]$/;
    const match = folderName.match(regex);
    if (match) return { title: match[2], year: match[3], bitDepth: match[4], sampleRate: match[5] };
    return { title: folderName, year: "2026", bitDepth: "24", sampleRate: "96" };
  }
}