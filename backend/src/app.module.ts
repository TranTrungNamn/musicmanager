import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MusicController } from './music.controller';
import { ScannerService } from './scanner.service';
import { FileManagerService } from './file-manager.service';
import { Artist } from './entities/artist.entity';
import { Album } from './entities/album.entity';
import { Track } from './entities/track.entity';
import { ScanHistory } from './entities/scan-history.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'db',
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'pass',
      database: process.env.DB_NAME || 'postgres',
      entities: [Artist, Album, Track, ScanHistory],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([Artist, Album, Track, ScanHistory]),
  ],
  controllers: [AppController, MusicController],
  providers: [AppService, ScannerService, FileManagerService],
})
export class AppModule {}