import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './user.entity';
import { Wallet } from '../wallets/wallet.entity';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepo: Repository<User>,
    @InjectRepository(Wallet)
    private walletsRepo: Repository<Wallet>,
  ) {}

  async findByMobile(mobile: string): Promise<User | null> {
    return this.usersRepo.findOne({
      where: { mobile },
      relations: ['wallet'],
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepo.findOne({
      where: { id },
      relations: ['wallet'],
    });
  }

  async create(params: {
    name: string;
    mobile: string;
    password: string;
    role?: UserRole;
  }): Promise<User> {
    const existing = await this.findByMobile(params.mobile);
    if (existing) {
      throw new ConflictException('این شماره موبایل قبلاً در سیستم ثبت شده است');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(params.password, salt);

    const user = this.usersRepo.create({
      name: params.name,
      mobile: params.mobile,
      passwordHash,
      role: params.role || 'customer',
      isActive: true,
    });

    const savedUser = await this.usersRepo.save(user);

    // Create wallet automatically
    const wallet = this.walletsRepo.create({
      userId: savedUser.id,
      balance: 0,
    });
    await this.walletsRepo.save(wallet);

    savedUser.wallet = wallet;
    return savedUser;
  }

  async findAll(search?: string): Promise<User[]> {
    const qb = this.usersRepo.createQueryBuilder('user')
      .leftJoinAndSelect('user.wallet', 'wallet')
      .orderBy('user.createdAt', 'DESC');

    if (search) {
      qb.andWhere('(user.name ILIKE :s OR user.mobile ILIKE :s)', { s: `%${search}%` });
    }

    return qb.getMany();
  }

  async setActive(id: string, isActive: boolean): Promise<User> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('کاربر یافت نشد');
    user.isActive = isActive;
    return this.usersRepo.save(user);
  }

  async countAll(): Promise<number> {
    return this.usersRepo.count();
  }
}
