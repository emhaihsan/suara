import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('voice_jobs')
export class VoiceJob {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    userId!: string;

    @Column('text')
    text!: string;

    @Column()
    voiceId!: string;

    @Column({ default: 'PENDING' })
    status!: string; // PENDING, PROCESSING, COMPLETED, FAILED

    @Column({ nullable: true })
    audioUrl?: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
