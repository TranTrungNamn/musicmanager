import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import { ScannerService } from './scanner.service';
import * as express from 'express';
import { join } from 'path';
import * as fs from 'fs';

@Controller('music')
export class MusicController {
  constructor(private readonly scannerService: ScannerService) {}

  // 1. Quét thư viện
  @Get('scan')
  async scan() {
    return await this.scannerService.scanLibrary();
  }

  // 2. Lấy danh sách nghệ sĩ
  @Get('artists')
  async getArtists() {
    const artists = await this.scannerService.getAllArtists();
    return artists.map(artist => ({
      id: artist.id,
      name: artist.name,
      pictureUrl: artist.picturePath 
        ? `http://localhost:3000/music/artist-pic/${encodeURIComponent(artist.name)}` 
        : null,
    }));
  }

  // 3. Trả về file ảnh nghệ sĩ
  @Get('artist-pic/:artistName')
  getArtistPicture(@Param('artistName') name: string, @Res() res: express.Response) {
    const path = join('/usr/src/app/library', name, 'artist.jpg');
    if (fs.existsSync(path)) {
      return res.sendFile(path);
    }
    throw new NotFoundException('Không tìm thấy ảnh nghệ sĩ');
  }

  // 4. Lấy danh sách Album của một nghệ sĩ
  @Get('artist/:id/albums')
  async getArtistAlbums(@Param('id') id: string) {
    const albums = await this.scannerService.getAlbumsByArtist(id);
    return albums.map(album => ({
      id: album.id,
      title: album.title,
      year: album.releaseYear,
      coverUrl: `http://localhost:3000/music/album-cover/${album.id}`,
    }));
  }

  // 5. Trả về file ảnh bìa Album
  @Get('album-cover/:albumId')
  async getAlbumCover(@Param('albumId') id: string, @Res() res: express.Response) {
    const album = await this.scannerService.getAlbumById(id);
    if (!album || !album.coverPath) {
      throw new NotFoundException('Không tìm thấy thông tin album');
    }
    const path = join('/usr/src/app/library', album.coverPath);
    if (fs.existsSync(path)) {
      return res.sendFile(path);
    }
    throw new NotFoundException('File ảnh bìa không tồn tại');
  }

  // 6. Lấy danh sách bài hát trong một Album
  @Get('album/:id/tracks')
  async getAlbumTracks(@Param('id') id: string) {
    const tracks = await this.scannerService.getTracksByAlbum(id);
    return tracks.map(track => ({
      id: track.id,
      title: track.title,
      fileName: track.fileName,
      duration: track.duration,
      streamUrl: `http://localhost:3000/music/stream/${track.id}`,
    }));
  }

  // 7. Stream nhạc FLAC
  @Get('stream/:trackId')
  async streamTrack(@Param('trackId') id: string, @Res() res: express.Response) {
    const track = await this.scannerService.getTrackById(id);
    if (!track) {
      throw new NotFoundException('Không tìm thấy bài hát trong DB');
    }
    
    const path = join('/usr/src/app/library', track.relativePath);
    if (!fs.existsSync(path)) {
      throw new NotFoundException('File nhạc không tồn tại trên ổ đĩa');
    }

    const stat = fs.statSync(path);
    res.writeHead(200, {
      'Content-Type': 'audio/flac',
      'Content-Length': stat.size,
      'Accept-Ranges': 'bytes',
    });

    const readStream = fs.createReadStream(path);
    readStream.pipe(res);
  }
}