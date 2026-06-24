import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/user.entity';
import { CreateSupplementaryOrderDto } from './dto/create-supplementary-order.dto';
import { SupplementaryOrder } from './supplementary-order.entity';

type RequestUser = {
  sub?: string;
  username?: string;
  storeId?: string;
  station?: string;
};

type RequestLike = {
  user?: RequestUser;
};

@Injectable({ scope: Scope.REQUEST })
export class SupplementaryOrderService {
  constructor(
    @InjectRepository(SupplementaryOrder)
    private readonly orderRepository: Repository<SupplementaryOrder>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Inject(REQUEST)
    private readonly request: RequestLike,
  ) {}

  async create(dto: CreateSupplementaryOrderDto) {
    const actor = await this.resolveActor();
    const order = this.orderRepository.create({
      storeId: actor.storeId,
      date: new Date().toISOString().slice(0, 10),
      menuPlanId: dto.menuPlanId,
      dishId: dto.dishId,
      dishName: dto.dishName,
      station: actor.station || '',
      userId: actor.id,
      userName: actor.name,
      reason: dto.reason || null,
      estimatedQuantity: dto.estimatedQuantity ?? null,
    });
    return this.orderRepository.save(order);
  }

  findByMenuPlan(menuPlanId: string) {
    return this.orderRepository.find({
      where: { menuPlanId },
      order: { createdAt: 'DESC' },
    });
  }

  findByDate(date: string, storeId?: string) {
    const where: any = { date };
    if (storeId) where.storeId = storeId;
    return this.orderRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async remove(id: string) {
    await this.orderRepository.delete(id);
    return { id };
  }

  private async resolveActor() {
    const requestUser = this.request?.user;
    const actorId = requestUser?.sub || 'unknown';
    const actor = await this.userRepository
      .findOne({ where: { id: actorId }, relations: ['store'] })
      .catch(() => null);

    return {
      id: actorId,
      name: actor?.name || requestUser?.username || actorId,
      station: actor?.station || requestUser?.station || '',
      storeId: requestUser?.storeId || actor?.storeId || 'unknown',
    };
  }
}
