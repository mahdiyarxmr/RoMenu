export interface CreatePaymentParams {
  paymentId: string;
  amount: number; // in Tomans
  description: string;
  callbackUrl: string;
  userMobile?: string;
  userName?: string;
  credentials?: Record<string, string>;
  isSandbox?: boolean;
}

export interface CreatePaymentResult {
  redirectUrl: string;
  authorityOrToken?: string;
}

export interface VerifyPaymentParams {
  paymentId: string;
  amount: number; // in Tomans
  authorityOrToken?: string;
  queryParams?: Record<string, any>;
  credentials?: Record<string, string>;
  isSandbox?: boolean;
}

export interface VerifyPaymentResult {
  success: boolean;
  referenceId?: string;
  message?: string;
}

export interface PaymentProvider {
  createPayment(params: CreatePaymentParams): Promise<CreatePaymentResult>;
  verify(params: VerifyPaymentParams): Promise<VerifyPaymentResult>;
}
