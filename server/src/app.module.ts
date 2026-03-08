import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DrizzleModule } from './db/drizzle.module';
import { CategoriesModule } from './categories/categories.module';
import { ServicesModule } from './services/services.module';

@Module({
  imports: [DrizzleModule, CategoriesModule, ServicesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
