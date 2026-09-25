import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Hold, HoldDocument } from './schemas/hold.schema';
import { CreateHoldDto } from './dto/create-hold.dto';

/** How long a hold is valid, in seconds. Default: 10 minutes. */
const HOLD_TTL_MS = parseInt(process.env.HOLD_TTL_SECONDS ?? '600', 10) * 1000;

@Injectable()
export class HoldsService {
  constructor(
    @InjectModel(Hold.name) private readonly holdModel: Model<HoldDocument>,
  ) {}

  /**
   * Create a short-lived hold on a vehicle for given dates.
   * Throws 409 if a conflicting hold or — the caller should also check
   * confirmed reservations — another user has the slot.
   */
  async create(dto: CreateHoldDto, userId: string | null): Promise<HoldDocument> {
    const pickup = new Date(dto.pickupDate);
    const dropoff = new Date(dto.dropoffDate);

    if (dropoff <= pickup) {
      throw new BadRequestException('Drop-off date must be after pick-up date');
    }

    await this.assertNoConflict(dto.vehicleId, pickup, dropoff);

    const expiresAt = new Date(Date.now() + HOLD_TTL_MS);

    return this.holdModel.create({
      vehicle: new Types.ObjectId(dto.vehicleId),
      user: userId ? new Types.ObjectId(userId) : null,
      pickupDate: pickup,
      dropoffDate: dropoff,
      expiresAt,
    });
  }

  /** Release a hold by its id. Silently succeeds if already expired/gone. */
  async release(holdId: string): Promise<void> {
    await this.holdModel.findByIdAndDelete(holdId);
  }

  /**
   * Returns true if a live (not-yet-expired) hold exists that overlaps
   * with the given vehicle + date range.
   */
  async hasConflict(
    vehicleId: string,
    pickup: Date,
    dropoff: Date,
    excludeHoldId?: string,
  ): Promise<boolean> {
    const filter: Record<string, unknown> = {
      vehicle: new Types.ObjectId(vehicleId),
      expiresAt: { $gt: new Date() },
      $or: [{ pickupDate: { $lt: dropoff }, dropoffDate: { $gt: pickup } }],
    };
    if (excludeHoldId) filter._id = { $ne: new Types.ObjectId(excludeHoldId) };

    const found = await this.holdModel.findOne(filter).lean();
    return !!found;
  }

  // ── Private ────────────────────────────────────────────────────────────

  private async assertNoConflict(
    vehicleId: string,
    pickup: Date,
    dropoff: Date,
  ): Promise<void> {
    const conflict = await this.hasConflict(vehicleId, pickup, dropoff);
    if (conflict) {
      throw new BadRequestException(
        'Ce véhicule est temporairement réservé pour ces dates. Veuillez réessayer dans quelques minutes.',
      );
    }
  }
}
