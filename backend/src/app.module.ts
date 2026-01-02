import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
// Etities
import { Artist } from './entities/artist.entity';
import { Album } from './entities/album.entity';
import { Track } from './entities/track.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'db', // 'db' là tên service trong docker-compose
      port: 5432,
      username: 'user',
      password: 'pass',
      database: 'mydb',
      entities: [Artist, Album, Track], // Khai báo các file bạn vừa tạo
      synchronize: true, // Tự động tạo bảng dựa trên code (Chỉ dùng khi học tập/dev)
    }),
  ],
})
export class AppModule {}