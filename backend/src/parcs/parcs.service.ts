import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Parc, ParcDocument } from './schemas/parc.schema';
import { CreateParcDto } from './dto/create-parc.dto';
import { UpdateParcDto } from './dto/update-parc.dto';

@Injectable()
export class ParcsService {
  constructor(
    @InjectModel(Parc.name) private readonly parcModel: Model<ParcDocument>,
  ) {}

  async create(dto: CreateParcDto): Promise<ParcDocument> {
    return this.parcModel.create(dto);
  }

  async findAll(): Promise<ParcDocument[]> {
    return this.parcModel.find().sort({ name: 1 }).exec();
  }

  async findOne(id: string): Promise<ParcDocument> {
    const parc = await this.parcModel.findById(id).exec();
    if (!parc) throw new NotFoundException('Parc not found');
    return parc;
  }

  async update(id: string, dto: UpdateParcDto): Promise<ParcDocument> {
    const parc = await this.parcModel
      .findByIdAndUpdate(id, dto, { returnDocument: 'after' })
      .exec();
    if (!parc) throw new NotFoundException('Parc not found');
    return parc;
  }

  async remove(id: string): Promise<{ message: string }> {
    const parc = await this.parcModel.findByIdAndDelete(id).exec();
    if (!parc) throw new NotFoundException('Parc not found');
    return { message: 'Parc deleted successfully' };
  }
}
