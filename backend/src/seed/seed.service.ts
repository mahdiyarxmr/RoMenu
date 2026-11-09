import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User } from '../users/user.entity';
import { Wallet } from '../wallets/wallet.entity';
import { Product } from '../products/product.entity';
import { InventoryMovement } from '../products/inventory-movement.entity';
import { PaymentSettings } from '../settings/payment-settings.entity';
import { StoreSettings } from '../settings/store-settings.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(private dataSource: DataSource) {}

  async onApplicationBootstrap() {
    await this.runSeed();
  }

  async runSeed() {
    const userRepo = this.dataSource.getRepository(User);
    const walletRepo = this.dataSource.getRepository(Wallet);
    const productRepo = this.dataSource.getRepository(Product);
    const movementRepo = this.dataSource.getRepository(InventoryMovement);
    const paymentSettingsRepo = this.dataSource.getRepository(PaymentSettings);
    const storeSettingsRepo = this.dataSource.getRepository(StoreSettings);

    // 1. Seed Default Settings
    let paymentSettings = await paymentSettingsRepo.findOne({ where: { id: 'default' } });
    if (!paymentSettings) {
      paymentSettings = paymentSettingsRepo.create({
        id: 'default',
        mode: 'SANDBOX',
        activeProvider: 'sandbox',
        minTopUpAmount: 10000,
        maxTopUpAmount: 50000000,
        zarinpalSandbox: true,
      });
      await paymentSettingsRepo.save(paymentSettings);
      this.logger.log('Payment settings initialized.');
    }

    let storeSettings = await storeSettingsRepo.findOne({ where: { id: 'default' } });
    if (!storeSettings) {
      storeSettings = storeSettingsRepo.create({
        id: 'default',
        storeName: 'بوفه رُکاد',
        activeTheme: 'neo-brutal',
        timezone: 'Asia/Tehran',
      });
      await storeSettingsRepo.save(storeSettings);
      this.logger.log('Store settings initialized.');
    }

    // 2. Seed Users
    const usersToSeed = [
      { name: 'مدیر بوفه رُکاد', mobile: '09120000000', password: 'admin123', role: 'admin' as const, wallet: 1000000 },
      { name: 'امیرحسین رضایی', mobile: '09120000001', password: 'demo1234', role: 'customer' as const, wallet: 50000 },
      { name: 'سارا محمدی', mobile: '09120000002', password: 'demo1234', role: 'customer' as const, wallet: 0 },
    ];

    for (const u of usersToSeed) {
      let existing = await userRepo.findOne({ where: { mobile: u.mobile }, relations: ['wallet'] });
      if (!existing) {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(u.password, salt);
        const user = userRepo.create({
          name: u.name,
          mobile: u.mobile,
          passwordHash,
          role: u.role,
          isActive: true,
        });
        existing = await userRepo.save(user);

        const wallet = walletRepo.create({
          userId: existing.id,
          balance: u.wallet,
        });
        await walletRepo.save(wallet);
        this.logger.log(`User seeded: ${u.mobile} (${u.role})`);
      }
    }

    // 3. Seed 20 Buffet Products
    const productsToSeed: {
      name: string;
      price: number;
      category: string;
      description: string;
      imageUrl: string;
    }[] = [
      // نوشیدنی
      { name: 'آیس‌مانکی استوایی', price: 100000, category: 'نوشیدنی', description: 'انرژی‌بخش خنک با طعم میوه‌های استوایی', imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80' },
      { name: 'نوشیدنی بیگ‌بیر قوطی', price: 145000, category: 'نوشیدنی', description: 'ماءالشعیر کلاسیک اصل با گاز طبیعی', imageUrl: 'https://images.unsplash.com/photo-1608270192809-56338b2488a0?w=600&auto=format&fit=crop&q=80' },
      { name: 'شیرموز پاکتی ۲۰۰ml', price: 56000, category: 'نوشیدنی', description: 'شیر تازه غنی‌شده با پوره موز طبیعی', imageUrl: 'https://images.unsplash.com/photo-1577805947697-89e18249d767?w=600&auto=format&fit=crop&q=80' },
      { name: 'نوشابه کوکا کولا قوطی', price: 55000, category: 'نوشیدنی', description: 'کوکاکولا خنک اورجینال ۳۳۰ میلی‌لیتر', imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop&q=80' },
      { name: 'ایستک لیمو خنک', price: 100000, category: 'نوشیدنی', description: 'نوشیدنی مالت لیمو بدون الکل', imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=80' },
      { name: 'آبمیوه رانی هلو پالپ‌دار', price: 100000, category: 'نوشیدنی', description: 'آبمیوه قوطی با تکه‌های لذیذ هلو', imageUrl: 'https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?w=600&auto=format&fit=crop&q=80' },

      // ساندویچ
      { name: 'ساندویچ کالباس مجتبی', price: 80000, category: 'ساندویچ', description: 'نان باگت تازه با کالباس مرغ، خیارشور و گوجه', imageUrl: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=600&auto=format&fit=crop&q=80' },
      { name: 'ساندویچ فلافل معینی‌پور', price: 65000, category: 'ساندویچ', description: 'فلافل ترد و تازه با سس انبه مخصوص', imageUrl: 'https://images.unsplash.com/photo-1541518763669-27fef04b14ea?w=600&auto=format&fit=crop&q=80' },
      { name: 'ساندویچ ژامبون تنوری داغ', price: 162000, category: 'ساندویچ', description: 'ژامبون ۹۰ درصد تنوری شده با پنیر گودا', imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&auto=format&fit=crop&q=80' },

      // تنقلات
      { name: 'چیپس کتل چیپسی چی‌توز', price: 70000, category: 'تنقلات', description: 'چیپس ضخیم برشته نمکی چی‌توز', imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=600&auto=format&fit=crop&q=80' },
      { name: 'کیک پچ‌پچ شکلاتی', price: 55000, category: 'تنقلات', description: 'کروسان نرم مغزدار با کرم کاکائو', imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&auto=format&fit=crop&q=80' },
      { name: 'چیپس چاکلز فلفلی', price: 70000, category: 'تنقلات', description: 'ورقه‌های برشته سیب‌زمینی تند چاکلز', imageUrl: 'https://images.unsplash.com/photo-1527842891421-42eec6e703ea?w=600&auto=format&fit=crop&q=80' },
      { name: 'پفک چاکلز پنیری', price: 50000, category: 'تنقلات', description: 'اسنک طلایی ترد و پرپنیر خوشمزه', imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&auto=format&fit=crop&q=80' },
      { name: 'ویفر هیس شکلاتی', price: 40000, category: 'تنقلات', description: 'لایه‌های نازک ویفر با روکش غلیظ شکلات شیرین', imageUrl: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=600&auto=format&fit=crop&q=80' },
      { name: 'بیسکویت های‌بای شکلاتی', price: 50000, category: 'تنقلات', description: 'بیسکویت دورنگ مغزدار کرم کاکائویی', imageUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&auto=format&fit=crop&q=80' },

      // کیک و شیرینی
      { name: 'نان شیرمال سنتی بوفه', price: 60000, category: 'کیک و شیرینی', description: 'شیرمال گرم پخته شده با کنجد و زعفران', imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80' },
      { name: 'دبی‌کیک نوتلا دار', price: 55000, category: 'کیک و شیرینی', description: 'کیک اسفنجی خوشمزه با مغز شکلات فندقی', imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop&q=80' },
      { name: 'رول اسفنجی وانیلی', price: 50000, category: 'کیک و شیرینی', description: 'رول نرم و لطیف با مغز خامه تازه وانیل', imageUrl: 'https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?w=600&auto=format&fit=crop&q=80' },
      { name: 'کیک کرمدار طلایی', price: 50000, category: 'کیک و شیرینی', description: 'کیک عصرانه لذیذ با روکش کرم شیری', imageUrl: 'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=600&auto=format&fit=crop&q=80' },
      { name: 'کلوچه سنتی لاهیجان', price: 55000, category: 'کیک و شیرینی', description: 'کلوچه تازه با مغز گردو و هل معطر', imageUrl: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=600&auto=format&fit=crop&q=80' },
    ];

    for (const item of productsToSeed) {
      const existingProduct = await productRepo.findOne({ where: { name: item.name } });
      if (!existingProduct) {
        const prod = productRepo.create({
          ...item,
          stock: 50,
          isActive: true,
          trackInventory: true,
        });
        const savedProd = await productRepo.save(prod);

        const movement = movementRepo.create({
          productId: savedProd.id,
          type: 'INITIAL',
          quantityChange: 50,
          stockBefore: 0,
          stockAfter: 50,
          reason: 'موجودی اولیه بوفه در زمان راه‌اندازی',
        });
        await movementRepo.save(movement);
        this.logger.log(`Product seeded: ${item.name} (${item.price} تومان)`);
      }
    }
  }
}
