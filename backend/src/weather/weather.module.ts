import { Module } from '@nestjs/common';
import { WeatherService } from './weather.service';
import { WeatherController } from './weather.controller';
import { Weather, WeatherSchema } from './entities/weather.entity';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    // Ensina ao Módulo que a coleção 'weather' existe
    MongooseModule.forFeature([{ name: Weather.name, schema: WeatherSchema }]),
  ],
  controllers: [WeatherController],
  providers: [WeatherService],
})
export class WeatherModule {}
