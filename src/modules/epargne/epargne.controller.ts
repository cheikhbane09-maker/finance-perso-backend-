import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { EpargneService } from './epargne.service';
import { CreateEpargneDto } from './dto/create-epargne.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('epargne')
export class EpargneController {
  constructor(private readonly epargneService: EpargneService) {}

  @Post()
  create(@Req() req, @Body() dto: CreateEpargneDto) {
    return this.epargneService.create(req.user.id, dto);
  }

  @Get()
  findAll(@Req() req, @Query('devise') devise?: string) {
    return this.epargneService.findAllForUser(req.user.id, devise);
  }

  // Endpoint utilisant l'API externe ExchangeRate (conversion de devises)
  @Get('taux')
  tauxDeChange() {
    return this.epargneService.tauxDeChange();
  }

  @Delete(':id')
  remove(@Req() req, @Param('id', ParseIntPipe) id: number) {
    return this.epargneService.remove(id, req.user.id, req.user.role);
  }
}
