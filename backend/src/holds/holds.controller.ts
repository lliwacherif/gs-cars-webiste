import {
  Body,
  Controller,
  Delete,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Request } from 'express';
import { HoldsService } from './holds.service';
import { CreateHoldDto } from './dto/create-hold.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

@ApiTags('Holds')
@Controller('holds')
export class HoldsController {
  constructor(private readonly holdsService: HoldsService) {}

  /**
   * Place a temporary hold on a vehicle for given dates.
   * Auth is optional — guests can hold too, but the hold is anonymous.
   * Returns the hold document including its _id (used to release it later).
   */
  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Create a temporary availability hold (10 min TTL)' })
  @ApiResponse({ status: 201, description: 'Hold created — returns hold document' })
  @ApiResponse({ status: 400, description: 'Conflicting hold already exists or invalid dates' })
  create(
    @Body() dto: CreateHoldDto,
    @CurrentUser('_id') userId: string | undefined,
  ) {
    return this.holdsService.create(dto, userId ?? null);
  }

  /**
   * Release a hold early (e.g. user cancelled, or booking was confirmed).
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Release a hold by id' })
  @ApiResponse({ status: 200, description: 'Hold released' })
  async release(@Param('id') id: string) {
    await this.holdsService.release(id);
    return { message: 'Hold released' };
  }
}
