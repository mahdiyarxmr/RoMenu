import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './payment.entity';
import { Order } from '../orders/order.entity';
import { WalletTopUp } from '../wallets/wallet-topup.entity';
import { PaymentSettings } from '../settings/payment-settings.entity';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { SandboxProvider } from './providers/sandbox.provider';
import { ZarinpalProvider } from './providers/zarinpal.provider';
import { WalletsModule } from '../wallets/wallets.module';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, Order, WalletTopUp, PaymentSettings]),
    WalletsModule,
    ProductsModule,
  ],
  providers: [
    PaymentsService,
    SandboxProvider,
    ZarinpalProvider,
  ],
  controllers: [PaymentsController],
  exports: [PaymentsService],
})
export class PaymentsModule {}
