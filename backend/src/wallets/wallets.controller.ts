import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { DataSource } from 'typeorm';
import { Payment } from '../payments/payment.entity';
import { PaymentSettings } from '../settings/payment-settings.entity';
import { decryptCredentials } from '../payments/crypto.helper';
import { ZarinpalProvider } from '../payments/providers/zarinpal.provider';
import { User } from '../users/user.entity';

@UseGuards(JwtAuthGuard)
@Controller('wallet')
export class WalletsController {
  constructor(
    private walletsService: WalletsService,
    private dataSource: DataSource,
  ) {}

  @Get()
  async getMyWallet(@CurrentUser('id') userId: string) {
    return this.walletsService.getWalletByUserId(userId);
  }

  @Get('transactions')
  async getMyTransactions(
    @CurrentUser('id') userId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    const wallet = await this.walletsService.getWalletByUserId(userId);
    return this.walletsService.getTransactions(wallet.id, Number(page), Number(limit));
  }

  @Post('top-ups')
  async startTopUp(
    @CurrentUser('id') userId: string,
    @Body('amount') amount: number,
  ) {
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      throw new BadRequestException('مبلغ نامعتبر است');
    }

    const paymentSettings = await this.dataSource.getRepository(PaymentSettings).findOne({
      where: { id: 'default' },
    });

    const minAmount = paymentSettings ? Number(paymentSettings.minTopUpAmount) : 10000;
    const maxAmount = paymentSettings ? Number(paymentSettings.maxTopUpAmount) : 50000000;

    if (numAmount < minAmount) {
      throw new BadRequestException(`حداقل مبلغ شارژ ${minAmount.toLocaleString()} تومان است`);
    }
    if (numAmount > maxAmount) {
      throw new BadRequestException(`حداکثر مبلغ شارژ ${maxAmount.toLocaleString()} تومان است`);
    }

    const topUp = await this.walletsService.createTopUp(userId, numAmount);

    const activeProvider = paymentSettings?.activeProvider || 'sandbox';
    const mode = paymentSettings?.mode || 'SANDBOX';

    // Create payment record
    const paymentRepo = this.dataSource.getRepository(Payment);
    const payment = paymentRepo.create({
      userId,
      topUpId: topUp.id,
      amount: numAmount,
      provider: activeProvider,
      mode,
      status: 'PENDING',
    });
    const savedPayment = await paymentRepo.save(payment);

    const user = await this.dataSource.getRepository(User).findOne({ where: { id: userId } });
    const creds = paymentSettings?.credentialsEnc ? decryptCredentials(paymentSettings.credentialsEnc) : {};
    const backendUrl = process.env.BACKEND_URL || process.env.FRONTEND_URL || 'http://localhost:3001';
    const callbackUrl = `${backendUrl}/api/v1/payments/callback/${activeProvider}?paymentId=${savedPayment.id}`;

    let redirectUrl = `/pay/sandbox?paymentId=${savedPayment.id}`;
    let authorityOrToken: string | undefined = undefined;

    if (activeProvider === 'zarinpal') {
      const zp = new ZarinpalProvider();
      const zpRes = await zp.createPayment({
        paymentId: savedPayment.id,
        amount: savedPayment.amount,
        description: `شارژ کیف پول بوفه رُکاد به مبلغ ${savedPayment.amount.toLocaleString()} تومان`,
        callbackUrl,
        userMobile: user?.mobile,
        userName: user?.name,
        credentials: creds['zarinpal'],
        isSandbox: paymentSettings?.zarinpalSandbox ?? true,
      });
      redirectUrl = zpRes.redirectUrl;
      authorityOrToken = zpRes.authorityOrToken;
    } else {
      redirectUrl = `/pay/sandbox?paymentId=${savedPayment.id}`;
      authorityOrToken = `SBX-${Math.floor(100000 + Math.random() * 900000)}`;
    }

    if (authorityOrToken) {
      savedPayment.authorityOrToken = authorityOrToken;
      await paymentRepo.save(savedPayment);
    }

    return {
      topUpId: topUp.id,
      paymentId: savedPayment.id,
      redirectUrl,
    };
  }

  @Get('top-ups/:id/status')
  async getTopUpStatus(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    const topUp = await this.dataSource.getRepository('wallet_topups').findOne({
      where: { id, userId },
    });
    if (!topUp) throw new BadRequestException('یافت نشد');
    const wallet = await this.walletsService.getWalletByUserId(userId);
    return {
      status: (topUp as any).status,
      amount: Number((topUp as any).amount),
      balance: Number(wallet.balance),
    };
  }
}
