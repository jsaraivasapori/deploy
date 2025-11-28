import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './entities/user.entity';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private configService: ConfigService,
  ) {}

  // --- SEED: Cria usuário admin ao iniciar ---
  async onModuleInit() {
    const adminEmail = this.configService.get<string>('DEFAULT_ADMIN_EMAIL');
    const adminPass = this.configService.get<string>('DEFAULT_ADMIN_PASSWORD');

    if (adminEmail && adminPass) {
      const exists = await this.userModel.findOne({ email: adminEmail });
      if (!exists) {
        this.logger.log(`Criando Admin Padrão: ${adminEmail}`);
        await this.create({
          email: adminEmail,
          password: adminPass,
          role: 'admin',
        });
      }
    }
  }
  async create(createUserDto: CreateUserDto): Promise<User> {
    const { email, password, role } = createUserDto;

    const userExists = await this.userModel.findOne({ email });
    if (userExists) {
      throw new BadRequestException('Email já está em uso.');
    }

    const jamps = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, jamps);

    const newUser = new this.userModel({
      email,
      password: hashedPassword,
      role,
    });

    return newUser.save();
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  // Método auxiliar para o AuthModule
  async findOneByEmail(
    email: string,
  ): Promise<UserDocument | undefined | null> {
    return this.userModel.findOne({ email }).select('+password').exec();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(`Usuário com ID ${id} não encontrado`);
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    if (updateUserDto.email) {
      const userExists = await this.userModel.findOne({
        email: updateUserDto.email,
      });
      // Garante que não é o próprio usuário (caso ele mande o mesmo email)
      if (userExists && userExists._id.toString() !== id) {
        throw new BadRequestException(
          'Este e-mail já está em uso por outro usuário.',
        );
      }
    }

    // SE o usuário mandou uma nova senha, precisamos criptografar antes
    if (updateUserDto.password) {
      const salt = await bcrypt.genSalt();
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, salt);
    }

    // new: true -> Retorna o objeto JÁ alterado (e não o antigo)
    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .exec();

    if (!updatedUser) {
      throw new NotFoundException(`Usuário com ID ${id} não encontrado`);
    }

    return updatedUser;
  }

  async remove(id: string): Promise<User> {
    // Tenta encontrar e deletar em um único comando
    const deletedUser = await this.userModel.findByIdAndDelete(id).exec();

    if (!deletedUser) {
      throw new NotFoundException(`Usuário com ID ${id} não encontrado.`);
    }

    return deletedUser;
  }
}
