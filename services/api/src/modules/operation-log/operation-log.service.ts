import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OperationLog } from './operation-log.entity';

@Injectable()
export class OperationLogService {
  constructor(
    @InjectRepository(OperationLog)
    private readonly logRepository: Repository<OperationLog>,
  ) {}

  async log(
    storeId: string,
    operatedBy: string,
    operatedByName: string,
    module: string,
    action: string,
    targetId: string,
    targetName?: string,
    before?: Record<string, any>,
    after?: Record<string, any>,
    summary?: string,
  ): Promise<OperationLog> {
    const entry = this.logRepository.create({
      storeId,
      operatedBy,
      operatedByName,
      module,
      action,
      targetId,
      targetName,
      before,
      after,
      summary,
    });
    return this.logRepository.save(entry);
  }

  async findByQuery(
    storeId: string,
    module?: string,
    action?: string,
    operatedBy?: string,
    startDate?: string,
    endDate?: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ data: OperationLog[]; total: number; page: number; limit: number }> {
    const qb = this.logRepository
      .createQueryBuilder('log')
      .where('log.storeId = :storeId', { storeId });

    if (module) {
      qb.andWhere('log.module = :module', { module });
    }

    if (action) {
      qb.andWhere('log.action = :action', { action });
    }

    if (operatedBy) {
      qb.andWhere('log.operatedBy = :operatedBy', { operatedBy });
    }

    if (startDate) {
      qb.andWhere('log.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      qb.andWhere('log.createdAt <= :endDate', { endDate });
    }

    qb.orderBy('log.createdAt', 'DESC');

    const skip = (page - 1) * limit;
    qb.skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return { data, total, page, limit };
  }

  async getStats(
    storeId: string,
  ): Promise<{ byModule: { module: string; count: number }[]; byOperator: { operatedBy: string; operatedByName: string; count: number }[] }> {
    const byModule = await this.logRepository
      .createQueryBuilder('log')
      .select('log.module', 'module')
      .addSelect('COUNT(*)', 'count')
      .where('log.storeId = :storeId', { storeId })
      .groupBy('log.module')
      .orderBy('count', 'DESC')
      .getRawMany();

    const byOperator = await this.logRepository
      .createQueryBuilder('log')
      .select('log.operatedBy', 'operatedBy')
      .addSelect('log.operatedByName', 'operatedByName')
      .addSelect('COUNT(*)', 'count')
      .where('log.storeId = :storeId', { storeId })
      .groupBy('log.operatedBy')
      .addGroupBy('log.operatedByName')
      .orderBy('count', 'DESC')
      .getRawMany();

    return {
      byModule: byModule.map((row) => ({ module: row.module, count: parseInt(row.count, 10) })),
      byOperator: byOperator.map((row) => ({
        operatedBy: row.operatedBy,
        operatedByName: row.operatedByName,
        count: parseInt(row.count, 10),
      })),
    };
  }
}
