import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Album } from './album.entity';

@Entity()
export class Track {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string; // Do I Wanna Know

  @Column()
  fileName: string; // 01. Do I wanna know.flac

  @Column()
  relativePath: string; // Đường dẫn để NestJS tìm thấy file trong Docker

  @Column({ nullable: true })
  duration: number; // Thời lượng bài hát (giây)

  @ManyToOne(() => Album, (album) => album.tracks)
  album: Album;
}