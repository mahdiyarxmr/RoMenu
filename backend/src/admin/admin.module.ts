import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { UsersModule } from '../users/users.module';
import { WalletsModule } from '../wallets/wallets.module';
import { ProductsModule } from '../products/products.module';
import { OrdersModule } from '../orders/orders.module';
import { PaymentsModule } from '../payments/payments.module';
import { SettingsModule } from '../settings/settings.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    UsersModule,
    WalletsModule,
    ProductsModule,
    OrdersModule,
    PaymentsModule,
    SettingsModule,
    AuditModule,
  ],
  controllers: [AdminController],
})
export class AdminModule {}
