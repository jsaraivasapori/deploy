import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Res,
  Query,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger'; // Adicionei ApiTags/ApiQuery para documentação
import { WeatherService } from './weather.service';
import { CreateWeatherDto } from './dto/create-weather.dto';
import { WeatherResponseDto } from './dto/weather-response.dto';

@ApiTags('Weather') // Organiza no Swagger
@Controller('weather') // Prefixo /api/v1/weather
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  // --- ROTA PÚBLICA (Para o Worker Go) ---
  @Post('logs')
  create(@Body() createWeatherDto: CreateWeatherDto) {
    return this.weatherService.create(createWeatherDto);
  }

  // --- ROTA DE LISTAGEM PAGINADA (Frontend) ---
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Get('logs')
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Histórico paginado',
    type: WeatherResponseDto, // <--- Aponta para o DTO
  })
  findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return this.weatherService.findAll(Number(page), 10);
  }

  // --- INSIGHTS DE IA ---
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Get('insights')
  async getInsights() {
    return this.weatherService.generateInsights();
  }

  // --- EXPORTAÇÃO CSV ---
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Get('export.csv')
  async exportCsv(@Res() res: Response) {
    const csv = await this.weatherService.generateCsv();

    res.header('Content-Type', 'text/csv');
    res.attachment('historico_clima.csv');

    return res.send(csv);
  }

  // --- EXPORTAÇÃO EXCEL (XLSX) ---
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Get('export.xlsx')
  async exportXlsx(@Res() res: Response) {
    const buffer = await this.weatherService.generateXlsx();

    res.header(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.attachment('historico_clima.xlsx');

    return res.send(buffer);
  }
}
