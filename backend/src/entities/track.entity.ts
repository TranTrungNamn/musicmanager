import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Album } from './album.entity';

@Entity('track')
export class Track {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column() // Thêm dòng này để sửa lỗi DeepPartial
  path: string;

  @Column({ default: 0 })
  duration: number;

  @ManyToOne(() => Album, (album) => album.tracks)
  album: Album;
}