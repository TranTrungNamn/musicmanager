import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class ScanHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  // Đường dẫn đã quét
  path: string;

  @CreateDateColumn()
  // Ngày thực hiện quét
  scanDate: Date;
}