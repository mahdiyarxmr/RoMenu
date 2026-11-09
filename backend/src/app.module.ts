import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

// Entities
import { User } from './users/user.entity';
import { Wallet } from './wallets/wallet.entity';
import { WalletTransaction } from './wallets/wallet-transaction.entity';
import { WalletTopUp } from './wallets/wallet-topup.entity';
import { Product } from './products/product.entity';
import { InventoryMovement } from './products/inventory-movement.entity';
import { Order } from './orders/order.entity';
import { OrderItem } from './orders/order-item.entity';
import { Payment } from './payments/payment.entity';
import { PaymentSettings } from './settings/payment-settings.entity';
import { StoreSettings } from './settings/store-settings.entity';
import { AuditLog } from './audit/audit-log.entity';

// Modules
import { UsersModule } from './users/users.module';
import { WalletsModule } from './wallets/wallets.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { SettingsModule } from './settings/settings.module';
import { AuditModule } from './audit/audit.module';
import { AdminModule } from './admin/admin.module';
import { UploadsModule } from './uploads/uploads.module';
import { SeedModule } from './seed/seed.module';
import { AuthModule } from './auth/auth.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const dbUrl = config.get<string>('DATABASE_URL') || config.get<string>('POSTGRES_URL');
        const isSsl = config.get<string>('DB_SSL') === 'true' || !!dbUrl;

        return {
          type: 'postgres' as const,
          ...(dbUrl
            ? { url: dbUrl }
            : {
                host: config.get<string>('DB_HOST', 'localhost'),
                port: Number(config.get<string>('DB_PORT', '5432')),
                username: config.get<string>('DB_USER', 'rokad'),
                password: config.get<string>('DB_PASS', 'rokad'),
                database: config.get<string>('DB_NAME', 'rokad_store'),
              }),
          ssl: isSsl ? { rejectUnauthorized: false } : false,
          entities: [
            User,
            Wallet,
            WalletTransaction,
            WalletTopUp,
            Product,
            InventoryMovement,
            Order,
            OrderItem,
            Payment,
            PaymentSettings,
            StoreSettings,
            AuditLog,
          ],
          synchronize: true, // auto create/sync tables in dev/preview
          logging: false,
        };
      },
    }),
    AuthModule,
    UsersModule,
    WalletsModule,
    ProductsModule,
    OrdersModule,
    PaymentsModule,
    SettingsModule,
    AuditModule,
    AdminModule,
    UploadsModule,
    SeedModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
