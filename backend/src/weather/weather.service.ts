import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as XLSX from 'xlsx';
import { Parser } from 'json2csv';

import { CreateWeatherDto } from './dto/create-weather.dto';
import { Weather, WeatherDocument } from './entities/weather.entity';
import { WeatherResponseDto } from './dto/weather-response.dto';

@Injectable()
export class WeatherService {
  private genAIApi: GoogleGenerativeAI;
  private readonly logger = new Logger(WeatherService.name);

  constructor(
    @InjectModel(Weather.name) private weatherModel: Model<WeatherDocument>,
    private configService: ConfigService,
  ) {
    // Busca a chave no .env (Gerada no Google AI Studio, independente do seu plano pessoal)
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');

    if (apiKey) {
      this.genAIApi = new GoogleGenerativeAI(apiKey);
    } else {
      this.logger.warn(
        'GEMINI_API_KEY não encontrada. Insights de IA desativados.',
      );
    }
  }

  // --- 1. RECEBER DADOS DO GO ---
  async create(createWeatherDto: CreateWeatherDto): Promise<Weather> {
    const createdLog = new this.weatherModel(createWeatherDto);
    // this.logger.log(`Recebido log de clima: ${createWeatherDto.temperature}°C`);
    return createdLog.save();
  }

  // --- 2. LISTAR DADOS (Paginado ou Geral) ---

  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<WeatherResponseDto> {
    const skip = (page - 1) * limit;

    const data = await this.weatherModel
      .find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    const total = await this.weatherModel.countDocuments();

    return {
      data,
      total,
      page,
      last_page: Math.ceil(total / limit),
    };
  }

  // --- 3. GERAR INSIGHTS COM IA ---
  async generateInsights() {
    // Busca os últimos 10 registros para contexto
    const weatherData = await this.weatherModel
      .find()
      .sort({ createdAt: -1 })
      .limit(5)
      .lean()
      .exec();

    if (!weatherData.length)
      return { message: 'Dados insuficientes para análise.' };

    if (!this.genAIApi) {
      return { message: 'Funcionalidade de IA indisponível (Falta API Key).' };
    }

    try {
      // Usa o modelo Flash (Rápido e Grátis no AI Studio)
      const model = this.genAIApi.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: { responseMimeType: 'application/json' },
      });

      // Prepara os dados para a IA ler
      const dataContext = JSON.stringify(
        weatherData.map((l) => ({
          temp: l.temperature,
          hum: l.humidity,
          wind: l.wind_speed,
          date: l.collected_at,
        })),
      );

      const prompt = `
        Atue como um meteorologista. Analise estes dados climáticos recentes (JSON): ${dataContext}.
        
        Retorne APENAS um objeto JSON seguindo estritamente este esquema:
        {
          "summary": "Resumo da tendência climática em uma frase curta (Português)",
          "alert": "Algum alerta? (Calor, Frio, Chuva, Vento) ou 'Normal'",
          "recommendation": "Dica curta para a pessoa (Ex: Beber água, levar guarda-chuva)",
           "temperature_next_hour": "Temperatura média da coleção em °C",
          "predicted_weather_next_hour": "Previsão do tempo para a próxima hora  em uma frase curta deve incluir valor da humidade e vento não deve incluir temperatura"
        }
      `;

      const result = await model.generateContent(prompt);
      const response = result.response;
      const aiJson = JSON.parse(response.text());

      return {
        source: 'Google Gemini 2.5 Flash',
        analysis_date: new Date(),
        ...aiJson,
        raw_data_samples: weatherData.length,
      };
    } catch (error) {
      this.logger.error('Erro ao chamar Gemini', error);
      return {
        message: 'IA indisponível no momento.',
        error_details:
          error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  // --- 4. GERAR CSV ---
  async generateCsv(): Promise<string> {
    const logs = await this.weatherModel
      .find()
      .sort({ createdAt: -1 })
      .limit(1000) // Limite de segurança
      .lean()
      .exec();

    if (!logs.length) return '';

    const fields = [
      'location_lat',
      'location_lon',
      'temperature',
      'humidity',
      'wind_speed',
      'condition_code',
      'collected_at',
    ];

    const parser = new Parser({ fields });
    return parser.parse(logs);
  }

  // --- 5. GERAR EXCEL (XLSX) ---
  async generateXlsx(): Promise<Buffer> {
    const logs = await this.weatherModel
      .find()
      .sort({ createdAt: -1 })
      .limit(1000)
      .lean()
      .exec();

    // Cria a planilha
    const worksheet = XLSX.utils.json_to_sheet(logs);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Dados Climáticos');

    // Retorna o buffer binário
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }
}
