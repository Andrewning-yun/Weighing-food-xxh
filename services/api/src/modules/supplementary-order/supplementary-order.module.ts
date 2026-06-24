import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/user.entity';
import { SupplementaryOrderController } from './supplementary-order.controller';
import { SupplementaryOrder } from './supplementary-order.entity';
import { SupplementaryOrderService } from './supplementary-order.service';

@Module({
  imports: [TypeOrmModule.forFeature([SupplementaryOrder, User])],
  controllers: [SupplementaryOrderController],
  providers: [SupplementaryOrderService],
  exports: [SupplementaryOrderService],
})
export class SupplementaryOrderModule {}
