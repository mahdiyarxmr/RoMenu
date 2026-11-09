import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post()
  async createOrder(
    @CurrentUser('id') userId: string,
    @Body() payload: { items: { productId: string; quantity: number }[]; idempotencyKey?: string },
  ) {
    return this.ordersService.create(userId, payload);
  }

  @Get()
  async getMyOrders(
    @CurrentUser('id') userId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '30',
  ) {
    return this.ordersService.getMyOrders(userId, Number(page), Number(limit));
  }

  @Get(':id')
  async getOrderById(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
    @Param('id') id: string,
  ) {
    const isAdmin = role === 'admin' || role === 'finance_admin';
    return this.ordersService.getById(id, userId, isAdmin);
  }

  @Post(':id/cancel')
  async cancelOrder(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
    @Param('id') id: string,
  ) {
    const isAdmin = role === 'admin' || role === 'finance_admin';
    return this.ordersService.cancel(id, userId, isAdmin);
  }
}
