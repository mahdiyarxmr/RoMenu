import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Product } from './product.entity';
import { InventoryMovement } from './inventory-movement.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productsRepo: Repository<Product>,
    @InjectRepository(InventoryMovement)
    private movementsRepo: Repository<InventoryMovement>,
    private dataSource: DataSource,
  ) {}

  async findAll(forCustomer = true): Promise<any[]> {
    const qb = this.productsRepo.createQueryBuilder('p').where('p.isDeleted = false');

    if (forCustomer) {
      qb.andWhere('p.isActive = true');
    }

    qb.orderBy('p.createdAt', 'ASC');
    const products = await qb.getMany();

    if (forCustomer) {
      return products.map((p) => {
        const isSoldOut = p.trackInventory && p.stock <= 0;
        return {
          id: p.id,
          name: p.name,
          price: Number(p.price),
          description: p.description,
          category: p.category,
          imageUrl: p.imageUrl,
          isActive: p.isActive,
          trackInventory: p.trackInventory,
          isSoldOut,
          // Stock number is NOT returned to customer
        };
      });
    }

    return products.map((p) => ({
      ...p,
      price: Number(p.price),
    }));
  }

  async findById(id: string, forCustomer = true): Promise<any> {
    const product = await this.productsRepo.findOne({
      where: { id, isDeleted: false },
    });
    if (!product) throw new NotFoundException('محصول یافت نشد');

    if (forCustomer) {
      const isSoldOut = product.trackInventory && product.stock <= 0;
      return {
        id: product.id,
        name: product.name,
        price: Number(product.price),
        description: product.description,
        category: product.category,
        imageUrl: product.imageUrl,
        isActive: product.isActive,
        trackInventory: product.trackInventory,
        isSoldOut,
      };
    }

    return {
      ...product,
      price: Number(product.price),
    };
  }

  async create(data: Partial<Product>, adminId?: string): Promise<Product> {
    const product = this.productsRepo.create({
      ...data,
      stock: data.stock ?? 50,
      isActive: data.isActive ?? true,
      trackInventory: data.trackInventory ?? true,
    });
    const saved = await this.productsRepo.save(product);

    // Initial movement
    const movement = this.movementsRepo.create({
      productId: saved.id,
      type: 'INITIAL',
      quantityChange: saved.stock,
      stockBefore: 0,
      stockAfter: saved.stock,
      reason: 'موجودی اولیه محصول',
      adminId,
    });
    await this.movementsRepo.save(movement);

    return saved;
  }

  async update(id: string, data: Partial<Product>): Promise<Product> {
    const product = await this.productsRepo.findOne({ where: { id, isDeleted: false } });
    if (!product) throw new NotFoundException('محصول یافت نشد');

    // If stock is passed in regular update without restock, prevent unintended jumps or handle cleanly
    delete (data as any).stock;

    Object.assign(product, data);
    return this.productsRepo.save(product);
  }

  async delete(id: string): Promise<boolean> {
    const product = await this.productsRepo.findOne({ where: { id } });
    if (!product) throw new NotFoundException('محصول یافت نشد');
    product.isDeleted = true;
    await this.productsRepo.save(product);
    return true;
  }

  async restock(
    id: string,
    params: { quantityChange: number; reason: string; setExact?: boolean; adminId?: string },
  ): Promise<Product> {
    if (!params.reason || params.reason.trim().length === 0) {
      throw new BadRequestException('ثبت دلیل تغییر موجودی الزامی است');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const product = await queryRunner.manager.findOne(Product, {
        where: { id, isDeleted: false },
        lock: { mode: 'pessimistic_write' },
      });
      if (!product) throw new NotFoundException('محصول یافت نشد');

      const stockBefore = product.stock;
      let stockAfter: number;
      let qtyChange: number;

      if (params.setExact) {
        stockAfter = Math.max(0, params.quantityChange);
        qtyChange = stockAfter - stockBefore;
      } else {
        qtyChange = params.quantityChange;
        stockAfter = Math.max(0, stockBefore + qtyChange);
      }

      product.stock = stockAfter;
      await queryRunner.manager.save(product);

      const movement = queryRunner.manager.create(InventoryMovement, {
        productId: product.id,
        type: params.setExact ? 'ADJUSTMENT' : qtyChange >= 0 ? 'RESTOCK' : 'ADJUSTMENT',
        quantityChange: qtyChange,
        stockBefore,
        stockAfter,
        reason: params.reason,
        adminId: params.adminId,
      });
      await queryRunner.manager.save(movement);

      await queryRunner.commitTransaction();
      return product;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async getMovements(productId: string): Promise<InventoryMovement[]> {
    return this.movementsRepo.find({
      where: { productId },
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  async reserveStockForOrder(
    items: { productId: string; quantity: number }[],
    orderId: string,
    manager: EntityManager,
  ) {
    for (const item of items) {
      const product = await manager.findOne(Product, {
        where: { id: item.productId, isDeleted: false },
        lock: { mode: 'pessimistic_write' },
      });

      if (!product) {
        throw new BadRequestException(`محصول ${item.productId} یافت نشد`);
      }

      if (product.trackInventory) {
        if (product.stock < item.quantity) {
          throw new BadRequestException(
            `موجودی محصول «${product.name}» کافی نیست (باقی‌مانده: ${product.stock} عدد)`,
          );
        }
        const stockBefore = product.stock;
        const stockAfter = stockBefore - item.quantity;
        product.stock = stockAfter;
        await manager.save(product);

        const movement = manager.create(InventoryMovement, {
          productId: product.id,
          type: 'RESERVE',
          quantityChange: -item.quantity,
          stockBefore,
          stockAfter,
          reason: 'رزرو موقت سفارش در انتظار پرداخت',
          orderId,
        });
        await manager.save(movement);
      }
    }
  }

  async releaseStockForOrder(orderId: string, manager: EntityManager) {
    const movements = await manager.find(InventoryMovement, {
      where: { orderId, type: 'RESERVE' },
    });

    for (const mov of movements) {
      const product = await manager.findOne(Product, {
        where: { id: mov.productId },
        lock: { mode: 'pessimistic_write' },
      });
      if (product && product.trackInventory) {
        const qtyToReturn = Math.abs(mov.quantityChange);
        const stockBefore = product.stock;
        const stockAfter = stockBefore + qtyToReturn;
        product.stock = stockAfter;
        await manager.save(product);

        const releaseMov = manager.create(InventoryMovement, {
          productId: product.id,
          type: 'RELEASE',
          quantityChange: qtyToReturn,
          stockBefore,
          stockAfter,
          reason: 'آزادسازی موجودی رزرو شده به علت لغو یا انقضای سفارش',
          orderId,
        });
        await manager.save(releaseMov);
      }
    }
  }

  async finalizeStockSale(
    items: { productId: string; quantity: number }[],
    orderId: string,
    manager: EntityManager,
    wasReserved = false,
  ) {
    if (wasReserved) {
      // Stock was already deducted during reservation, just record final SALE audit
      for (const item of items) {
        const product = await manager.findOne(Product, { where: { id: item.productId } });
        if (product) {
          const saleMov = manager.create(InventoryMovement, {
            productId: product.id,
            type: 'SALE',
            quantityChange: 0,
            stockBefore: product.stock,
            stockAfter: product.stock,
            reason: 'تایید نهایی فروش و کسر از رزرو',
            orderId,
          });
          await manager.save(saleMov);
        }
      }
    } else {
      // Immediate wallet payment: deduct directly and record SALE
      for (const item of items) {
        const product = await manager.findOne(Product, {
          where: { id: item.productId, isDeleted: false },
          lock: { mode: 'pessimistic_write' },
        });

        if (!product) throw new BadRequestException(`محصول یافت نشد`);

        if (product.trackInventory) {
          if (product.stock < item.quantity) {
            throw new BadRequestException(`موجودی محصول «${product.name}» کافی نیست`);
          }
          const stockBefore = product.stock;
          const stockAfter = stockBefore - item.quantity;
          product.stock = stockAfter;
          await manager.save(product);

          const movement = manager.create(InventoryMovement, {
            productId: product.id,
            type: 'SALE',
            quantityChange: -item.quantity,
            stockBefore,
            stockAfter,
            reason: 'فروش موفق بوفه با تسویه فوری',
            orderId,
          });
          await manager.save(movement);
        }
      }
    }
  }
}
