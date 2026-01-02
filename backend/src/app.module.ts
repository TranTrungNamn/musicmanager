import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MusicController } from './music.controller'; //
import { ScannerService } from './scanner.service'; //
import { Artist } from './entities/artist.entity'; //
import { Album } from './entities/album.entity'; //
import { Track } from './entities/track.entity'; //

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'db',
      port: 5432,
      username: 'user',
      password: 'pass',
      database: 'mydb',
      entities: [Artist, Album, Track],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([Artist, Album, Track]), // QUAN TRỌNG: Thêm dòng này
  ],
  controllers: [AppController, MusicController], // Đăng ký MusicController
  providers: [AppService, ScannerService], // Đăng ký ScannerService
})
export class AppModule {}