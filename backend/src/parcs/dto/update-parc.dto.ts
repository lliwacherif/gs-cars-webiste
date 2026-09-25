import { PartialType } from '@nestjs/swagger';
import { CreateParcDto } from './create-parc.dto';

export class UpdateParcDto extends PartialType(CreateParcDto) {}
