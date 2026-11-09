import { Controller, Get, Param } from '@nestjs/common';
import { ProductsService } from './products.service';
import { Public } from '../common/decorators/public.decorator';

@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Public()
  @Get()
  async getAll() {
    return this.productsService.findAll(true);
  }

  @Public()
  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.productsService.findById(id, true);
  }
}
