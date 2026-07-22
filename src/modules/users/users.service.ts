import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { Role } from './role.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  findById(id: number): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  create(data: { email: string; password: string; nom: string; role?: Role }): Promise<User> {
    const user = this.usersRepository.create({
      email: data.email,
      password: data.password,
      nom: data.nom,
      role: data.role ?? Role.USER,
    });
    return this.usersRepository.save(user);
  }
}
