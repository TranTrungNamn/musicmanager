import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Album } from './album.entity';

@Entity()
export class Artist {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string; // Ví dụ: Arctic Monkeys

  @OneToMany(() => Album, (album) => album.artist)
  albums: Album[];
}