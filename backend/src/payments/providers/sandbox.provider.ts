import { Injectable } from '@nestjs/common';
import {
  PaymentProvider,
  CreatePaymentParams,
  CreatePaymentResult,
  VerifyPaymentParams,
  VerifyPaymentResult,
} from './payment-provider.interface';

@Injectable()
export class SandboxProvider implements PaymentProvider {
  async createPayment(params: CreatePaymentParams): Promise<CreatePaymentResult> {
    return {
      redirectUrl: `/pay/sandbox?paymentId=${params.paymentId}`,
      authorityOrToken: `SBX-TOKEN-${params.paymentId.slice(0, 8)}`,
    };
  }

  async verify(params: VerifyPaymentParams): Promise<VerifyPaymentResult> {
    const action = params.queryParams?.action || 'success';
    if (action === 'success') {
      return {
        success: true,
        referenceId: `SBX-${Math.floor(100000 + Math.random() * 900000)}`,
        message: 'پرداخت آزمایشی در محیط سندباکس با موفقیت انجام شد',
      };
    }
    return {
      success: false,
      message: action === 'cancel' ? 'پرداخت توسط کاربر لغو شد' : 'خطای شبیه‌سازی شده در پرداخت سندباکس',
    };
  }
}
