import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './audit-log.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditRepo: Repository<AuditLog>,
  ) {}

  async log(params: {
    adminId: string;
    adminName?: string;
    action: string;
    entity: string;
    entityId?: string;
    details?: any;
  }): Promise<AuditLog> {
    const cleanDetails = this.scrubSensitiveData(params.details);
    const entry = this.auditRepo.create({
      adminId: params.adminId,
      adminName: params.adminName,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      details: cleanDetails ? JSON.stringify(cleanDetails) : undefined,
    });
    return this.auditRepo.save(entry);
  }

  async findAll(params?: { search?: string; page?: number; limit?: number }) {
    const page = params?.page || 1;
    const limit = params?.limit || 30;
    const qb = this.auditRepo.createQueryBuilder('log').orderBy('log.createdAt', 'DESC');

    if (params?.search) {
      qb.andWhere(
        '(log.action ILIKE :s OR log.entity ILIKE :s OR log.entityId ILIKE :s OR log.adminName ILIKE :s)',
        { s: `%${params.search}%` },
      );
    }

    const [logs, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { logs, total };
  }

  private scrubSensitiveData(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    const copy = Array.isArray(obj) ? [...obj] : { ...obj };
    const sensitiveKeys = ['password', 'passwordHash', 'merchantId', 'secretKey', 'apiKey', 'token'];
    for (const key of Object.keys(copy)) {
      if (sensitiveKeys.some((k) => key.toLowerCase().includes(k.toLowerCase()))) {
        copy[key] = '********';
      } else if (typeof copy[key] === 'object') {
        copy[key] = this.scrubSensitiveData(copy[key]);
      }
    }
    return copy;
  }
}
