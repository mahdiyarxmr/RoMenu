import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Res,
  UseGuards,
  All,
} from '@nestjs/common';
import { Response } from 'express';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('orders/start')
  async startOrderPayment(
    @CurrentUser('id') userId: string,
    @Body('orderId') orderId: string,
  ) {
    return this.paymentsService.startOrderPayment(orderId, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('sandbox/action')
  async sandboxAction(
    @CurrentUser('id') userId: string,
    @Body() body: { paymentId: string; action: 'success' | 'failed' | 'cancel' },
  ) {
    const result = await this.paymentsService.verifyPayment(body.paymentId, { action: body.action });
    const redirectUrl = `/pay/result?status=${result.success ? 'success' : 'failed'}&paymentId=${body.paymentId}&referenceId=${result.referenceId || ''}&message=${encodeURIComponent(result.message || '')}`;
    return { redirectUrl };
  }

  @UseGuards(JwtAuthGuard)
  @Get('mine/:id')
  async getMinePayment(
    @CurrentUser('id') userId: string,
    @Param('id') paymentId: string,
  ) {
    return this.paymentsService.getMinePayment(paymentId, userId);
  }

  @Public()
  @All('callback/:provider')
  async handleCallback(
    @Param('provider') provider: string,
    @Query() query: Record<string, any>,
    @Body() body: Record<string, any>,
    @Res() res: Response,
  ) {
    let paymentId = query.paymentId || body.paymentId;
    const authority = query.Authority || query.authority || body.Authority || body.authority;

    if (!paymentId && authority) {
      const p = await this.paymentsService.findByAuthority(authority);
      if (p) paymentId = p.id;
    }

    const queryParams = { ...query, ...body };

    let redirectUrl = `/pay/result?status=failed&message=${encodeURIComponent('شناسه پرداخت یا کلید تراکنش نامعتبر است')}`;

    if (paymentId) {
      const result = await this.paymentsService.verifyPayment(paymentId, queryParams);
      redirectUrl = `/pay/result?status=${result.success ? 'success' : 'failed'}&paymentId=${paymentId}&referenceId=${result.referenceId || ''}&message=${encodeURIComponent(result.message || '')}`;
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3002';
    return res.redirect(`${frontendUrl}${redirectUrl}`);
  }
}
