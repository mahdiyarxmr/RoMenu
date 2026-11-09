import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentSettings } from './payment-settings.entity';
import { StoreSettings } from './store-settings.entity';
import { decryptCredentials, encryptCredentials, maskCredentialsMap } from '../payments/crypto.helper';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(PaymentSettings)
    private paymentSettingsRepo: Repository<PaymentSettings>,
    @InjectRepository(StoreSettings)
    private storeSettingsRepo: Repository<StoreSettings>,
    private auditService: AuditService,
  ) {}

  async getPaymentSettings(): Promise<any> {
    let settings = await this.paymentSettingsRepo.findOne({ where: { id: 'default' } });
    if (!settings) {
      settings = this.paymentSettingsRepo.create({
        id: 'default',
        mode: 'SANDBOX',
        activeProvider: 'sandbox',
        minTopUpAmount: 10000,
        maxTopUpAmount: 50000000,
        zarinpalSandbox: true,
      });
      await this.paymentSettingsRepo.save(settings);
    }

    const decrypted = settings.credentialsEnc ? decryptCredentials(settings.credentialsEnc) : {};
    const masked = maskCredentialsMap(decrypted);

    return {
      id: settings.id,
      mode: settings.mode,
      activeProvider: settings.activeProvider,
      minTopUpAmount: Number(settings.minTopUpAmount),
      maxTopUpAmount: Number(settings.maxTopUpAmount),
      zarinpalSandbox: settings.zarinpalSandbox,
      credentialsMasked: masked,
    };
  }

  async updatePaymentSettings(
    dto: Partial<PaymentSettings>,
    adminId: string,
    adminName?: string,
  ): Promise<any> {
    let settings = await this.paymentSettingsRepo.findOne({ where: { id: 'default' } });
    if (!settings) {
      settings = this.paymentSettingsRepo.create({ id: 'default' });
    }

    // Gate: switching to LIVE requires valid credentials for activeProvider or throws
    if (dto.mode === 'LIVE') {
      const active = dto.activeProvider || settings.activeProvider;
      if (active === 'sandbox') {
        throw new BadRequestException('درگاه شبیه‌ساز (Sandbox) نمی‌تواند در حالت Live فعال باشد');
      }
      const existingCreds = settings.credentialsEnc ? decryptCredentials(settings.credentialsEnc) : {};
      if (!existingCreds[active] && !process.env[`${active.toUpperCase()}_MERCHANT_ID`]) {
        throw new BadRequestException(`برای فعال‌سازی حالت Live درگاه ${active}، ثبت اطلاعات اتصال (Credential) الزامی است`);
      }
    }

    const before = { mode: settings.mode, activeProvider: settings.activeProvider };
    Object.assign(settings, dto);
    const saved = await this.paymentSettingsRepo.save(settings);

    await this.auditService.log({
      adminId,
      adminName,
      action: 'UPDATE_PAYMENT_SETTINGS',
      entity: 'PaymentSettings',
      entityId: saved.id,
      details: { before, after: { mode: saved.mode, activeProvider: saved.activeProvider } },
    });

    return this.getPaymentSettings();
  }

  async saveCredentials(
    provider: string,
    keys: Record<string, string>,
    adminId: string,
    adminName?: string,
  ): Promise<any> {
    let settings = await this.paymentSettingsRepo.findOne({ where: { id: 'default' } });
    if (!settings) {
      settings = this.paymentSettingsRepo.create({ id: 'default' });
    }

    const existingCreds = settings.credentialsEnc ? decryptCredentials(settings.credentialsEnc) : {};
    existingCreds[provider] = { ...(existingCreds[provider] || {}), ...keys };

    settings.credentialsEnc = encryptCredentials(existingCreds);
    await this.paymentSettingsRepo.save(settings);

    await this.auditService.log({
      adminId,
      adminName,
      action: 'UPDATE_GATEWAY_CREDENTIALS',
      entity: 'PaymentSettings',
      entityId: provider,
      details: { provider, keysUpdated: Object.keys(keys) },
    });

    return this.getPaymentSettings();
  }

  async getStoreSettings(): Promise<StoreSettings> {
    let settings = await this.storeSettingsRepo.findOne({ where: { id: 'default' } });
    if (!settings) {
      settings = this.storeSettingsRepo.create({
        id: 'default',
        storeName: 'بوفه رُکاد',
        activeTheme: 'neo-brutal',
        timezone: 'Asia/Tehran',
      });
      await this.storeSettingsRepo.save(settings);
    }
    return settings;
  }

  async updateStoreSettings(
    dto: Partial<StoreSettings>,
    adminId: string,
    adminName?: string,
  ): Promise<StoreSettings> {
    let settings = await this.getStoreSettings();
    const before = { ...settings };
    Object.assign(settings, dto);
    const saved = await this.storeSettingsRepo.save(settings);

    await this.auditService.log({
      adminId,
      adminName,
      action: 'UPDATE_STORE_SETTINGS',
      entity: 'StoreSettings',
      entityId: saved.id,
      details: { before, after: saved },
    });

    return saved;
  }
}
