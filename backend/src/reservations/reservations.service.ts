import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Reservation, ReservationDocument, ReservationStatus, PaymentOption, PaymentStatus,
} from './schemas/reservation.schema';
import { VehiclesService } from '../vehicles/vehicles.service';
import { VehicleStatus } from '../vehicles/schemas/vehicle.schema';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationStatusDto } from './dto/update-reservation.dto';
import { HoldsService } from '../holds/holds.service';
import { MailService } from '../mail/mail.service';

const TVA_RATE = 0.19;

@Injectable()
export class ReservationsService {
  constructor(
    @InjectModel(Reservation.name)
    private readonly reservationModel: Model<ReservationDocument>,
    private readonly vehiclesService: VehiclesService,
    private readonly holdsService: HoldsService,
    private readonly mailService: MailService,
  ) {}

  // ── Create ───────────────────────────────────────────────────────────────
  async create(dto: CreateReservationDto, userId: string) {
    const vehicle = await this.vehiclesService.findOne(dto.vehicleId);

    if (vehicle.status !== VehicleStatus.DISPONIBLE || !vehicle.isActive) {
      throw new BadRequestException('Vehicle is not available for reservation');
    }

    const pickup  = new Date(dto.pickupDate);
    const dropoff = new Date(dto.dropoffDate);
    if (dropoff <= pickup) throw new BadRequestException('Drop-off date must be after pick-up date');

    // Conflict check — only CONFIRMED reservations actually lock the car
    const conflict = await this.reservationModel.findOne({
      vehicle: new Types.ObjectId(dto.vehicleId),
      status: { $in: [ReservationStatus.CONFIRMED] },
      $or: [{ pickupDate: { $lt: dropoff }, dropoffDate: { $gt: pickup } }],
    });
    if (conflict) throw new BadRequestException('Vehicle is already reserved for those dates');

    // Conflict check against active holds (excluding caller's own hold)
    const holdConflict = await this.holdsService.hasConflict(dto.vehicleId, pickup, dropoff, dto.holdId);
    if (holdConflict) throw new BadRequestException('Ce véhicule est temporairement réservé pour ces dates.');

    // Pricing
    const totalDays  = Math.ceil((dropoff.getTime() - pickup.getTime()) / 86400000);
    const subtotalHT = parseFloat(((vehicle.pricePerDay * totalDays) / (1 + TVA_RATE)).toFixed(2));
    const tva        = parseFloat((subtotalHT * TVA_RATE).toFixed(2));
    const totalTTC   = parseFloat((vehicle.pricePerDay * totalDays).toFixed(2));

    // NEW LOGIC: At creation, 0 TND is paid. Status starts at RECU.
    const amountPaid = 0;
    const remaining  = totalTTC;
    const paymentStatus = PaymentStatus.PENDING;

    const reqPct = dto.paymentOption === 'moitie' ? 50 : dto.paymentOption === 'total' ? 100 : 10;
    const reqAmt = parseFloat((totalTTC * (reqPct / 100)).toFixed(2));

    const reservation = await this.reservationModel.create({
      vehicle:          new Types.ObjectId(dto.vehicleId),
      user:             new Types.ObjectId(userId),
      pickupLocation:   dto.pickupLocation,
      dropoffLocation:  dto.dropoffLocation,
      pickupDate:       pickup,
      dropoffDate:      dropoff,
      driverAge:        dto.driverAge,
      totalDays,
      pricePerDay:      vehicle.pricePerDay,
      subtotalHT,
      tva,
      totalTTC,
      depositAmount:    vehicle.depositAmount ?? 0,
      paymentOption:    dto.paymentOption,
      amountPaid,
      remainingBalance: remaining,
      paymentStatus,
      status:           ReservationStatus.RECU,
      requiredDepositPercentage: reqPct,
      requiredDepositAmount:     reqAmt,
      options:           dto.options || [],
      notes:             dto.notes,
      acceptAlternative: dto.acceptAlternative ?? true,
    });

    // Release hold if provided
    if (dto.holdId) await this.holdsService.release(dto.holdId);

    return reservation.populate(['vehicle', 'user']);
  }

  // ── List ─────────────────────────────────────────────────────────────────
  async findAll(userId: string, userRole: string) {
    const filter = userRole === 'admin' ? {} : { user: new Types.ObjectId(userId) };
    return this.reservationModel
      .find(filter)
      .populate('vehicle', 'name brand category images pricePerDay plate year')
      .populate('user', '-password')
      .sort({ createdAt: -1 })
      .exec();
  }

  // ── Single ────────────────────────────────────────────────────────────────
  async findOne(id: string, userId: string, userRole: string) {
    const r = await this.reservationModel.findById(id).populate('vehicle').populate('user', '-password').exec();
    if (!r) throw new NotFoundException('Reservation not found');
    if (userRole !== 'admin' && r.user.toString() !== userId) throw new ForbiddenException('Access denied');
    return r;
  }

  // ── Update status ─────────────────────────────────────────────────────────
  async updateStatus(id: string, dto: UpdateReservationStatusDto) {
    const existing = await this.reservationModel.findById(id).populate('user').populate('vehicle').exec();
    if (!existing) throw new NotFoundException('Reservation not found');

    const update: Record<string, unknown> = { status: dto.status };

    if (dto.notes)            update.notes = dto.notes;
    if (dto.internalNotes)    update.internalNotes = dto.internalNotes;
    if (dto.cancelReason)     update.cancelReason = dto.cancelReason;
    if (dto.mileageAtPickup  !== undefined) update.mileageAtPickup  = dto.mileageAtPickup;
    if (dto.mileageAtDropoff !== undefined) update.mileageAtDropoff = dto.mileageAtDropoff;

    // Handle required deposit percentage update by admin
    if (dto.requiredDepositPercentage !== undefined) {
      update.requiredDepositPercentage = dto.requiredDepositPercentage;
      update.requiredDepositAmount = parseFloat((existing.totalTTC * (dto.requiredDepositPercentage / 100)).toFixed(2));
    }

    // Payment updates
    if (dto.amountPaid !== undefined) {
      update.amountPaid = dto.amountPaid;
      update.remainingBalance = parseFloat((existing.totalTTC - dto.amountPaid).toFixed(2));
      
      // Auto-set payment status based on amount paid
      if (dto.amountPaid <= 0) {
        update.paymentStatus = PaymentStatus.PENDING;
      } else if (dto.amountPaid >= existing.totalTTC) {
        update.paymentStatus = PaymentStatus.PAID;
      } else {
        update.paymentStatus = PaymentStatus.PARTIAL;
      }
    }

    if (dto.paymentStatus !== undefined) update.paymentStatus = dto.paymentStatus;
    if (dto.paymentMethod)     update.paymentMethod = dto.paymentMethod;
    if (dto.paymentReference)  update.paymentReference = dto.paymentReference;

    // Lifecycle timestamps
    if (dto.status === ReservationStatus.CONFIRMED)  update.confirmedAt  = new Date();
    if (dto.status === ReservationStatus.CANCELLED)  update.cancelledAt  = new Date();
    if (dto.status === ReservationStatus.COMPLETED)  update.completedAt  = new Date();

    // Update vehicle mileage on completion
    if (dto.status === ReservationStatus.COMPLETED && dto.mileageAtDropoff !== undefined) {
      await this.vehiclesService.update(existing.vehicle._id.toString(), { mileage: dto.mileageAtDropoff });
    }

    const reservation = await this.reservationModel
      .findByIdAndUpdate(id, update, { returnDocument: 'after' })
      .populate('vehicle')
      .populate('user', '-password')
      .exec();
    if (!reservation) throw new NotFoundException('Reservation not found');

    // Trigger email notification if admin approves from RECU to PENDING
    if (existing.status === ReservationStatus.RECU && dto.status === ReservationStatus.PENDING) {
      const userObj = reservation.user as any;
      const vehicleObj = reservation.vehicle as any;
      if (userObj?.email) {
        const pct = (update.requiredDepositPercentage as number) ?? reservation.requiredDepositPercentage ?? 30;
        const amt = (update.requiredDepositAmount as number) ?? reservation.requiredDepositAmount ?? (reservation.totalTTC * 0.3);
        await this.mailService.sendReservationApproval(
          userObj.email,
          userObj.firstName || 'Client',
          reservation._id.toString(),
          vehicleObj?.name || 'Véhicule',
          pct,
          amt
        );
      }
    }

    // Recompute vehicle status from actual reservations
    const vehicleId = (reservation.vehicle as any)?._id?.toString() ?? reservation.vehicle.toString();
    await this.vehiclesService.syncVehicleStatus(vehicleId);

    return reservation;
  }

  // ── Calendar ───────────────────────────────────────────────────────────────────
  /**
   * Returns all vehicles + only the pending/confirmed reservations that overlap
   * the [startDate, endDate] window.  Used exclusively by the admin calendar tab.
   * Overlap condition: pickupDate < endDate AND dropoffDate > startDate
   */
  async getCalendar(startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end   = new Date(endDate);

    const [vehicles, reservations] = await Promise.all([
      // All vehicles (admin view: active + inactive)
      this.vehiclesService.findAllAdmin(),

      // Only active reservations that touch this week
      this.reservationModel
        .find({
          status: { $in: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED] },
          pickupDate:  { $lt: end },
          dropoffDate: { $gt: start },
        })
        .populate('user', '-password')
        .populate('vehicle', 'name brand images')
        .lean()
        .exec(),
    ]);

    return { vehicles, reservations };
  }

  // ── Delete ───────────────────────────────────────────────────────────────────
  async remove(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid reservation ID');
    }

    // Capture vehicleId BEFORE deletion — after delete it's gone
    const r = await this.reservationModel.findById(id).lean().exec();
    if (!r) throw new NotFoundException('Reservation not found');

    const vehicleRef = r.vehicle as unknown;
    const vehicleId =
      vehicleRef && typeof vehicleRef === 'object' && '_id' in (vehicleRef as object)
        ? String((vehicleRef as { _id: unknown })._id)
        : vehicleRef
          ? String(vehicleRef)
          : undefined;

    await this.reservationModel.findByIdAndDelete(id);

    // Recompute vehicle status now that this reservation is gone
    if (vehicleId && Types.ObjectId.isValid(vehicleId)) {
      await this.vehiclesService.syncVehicleStatus(vehicleId);
    }

    return { message: 'Reservation deleted successfully', id };
  }

  // ── Upcoming ──────────────────────────────────────────────────────────────
  async getUpcoming(limit = 10) {
    return this.reservationModel
      .find({
        status: { $in: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED] },
        pickupDate: { $gte: new Date() },
      })
      .populate('vehicle', 'name brand category images')
      .populate('user', '-password')
      .sort({ pickupDate: 1 })
      .limit(limit)
      .exec();
  }

  // ── Dashboard stats (pure aggregation — no fake data) ────────────────────
  async getStats() {
    const now = new Date();
    const startOfMonth     = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const [
      totalReservations,
      thisMonthReservations,
      lastMonthReservations,
      statusBreakdown,
      revenueThisMonth,
      revenueLastMonth,
      totalRevenue,
      topVehicles,
      recentActivity,
    ] = await Promise.all([
      // Total count
      this.reservationModel.countDocuments(),

      // This month count
      this.reservationModel.countDocuments({ createdAt: { $gte: startOfMonth } }),

      // Last month count
      this.reservationModel.countDocuments({ createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } }),

      // Status breakdown
      this.reservationModel.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),

      // Revenue this month (sum of amountPaid)
      this.reservationModel.aggregate([
        { $match: { createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$amountPaid' } } },
      ]),

      // Revenue last month
      this.reservationModel.aggregate([
        { $match: { createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
        { $group: { _id: null, total: { $sum: '$amountPaid' } } },
      ]),

      // Total revenue all time
      this.reservationModel.aggregate([
        { $group: { _id: null, total: { $sum: '$amountPaid' } } },
      ]),

      // Top 5 most-booked vehicles
      this.reservationModel.aggregate([
        { $group: { _id: '$vehicle', count: { $sum: 1 }, revenue: { $sum: '$amountPaid' } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'vehicles', localField: '_id', foreignField: '_id', as: 'vehicle' } },
        { $unwind: { path: '$vehicle', preserveNullAndEmptyArrays: true } },
        { $project: {
          vehicleId: '$_id',
          count: 1,
          revenue: 1,
          name: '$vehicle.name',
          brand: '$vehicle.brand',
          category: '$vehicle.category',
          images: '$vehicle.images',
          pricePerDay: '$vehicle.pricePerDay',
        }},
      ]),

      // Last 10 reservations with vehicle + user info
      this.reservationModel
        .find()
        .populate('vehicle', 'name brand category images pricePerDay')
        .populate('user', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
    ]);

    const statusMap: Record<string, number> = {};
    for (const s of statusBreakdown) statusMap[s._id] = s.count;

    const revThisMonth = revenueThisMonth[0]?.total ?? 0;
    const revLastMonth = revenueLastMonth[0]?.total ?? 0;
    const revTrend = revLastMonth > 0
      ? parseFloat(((revThisMonth - revLastMonth) / revLastMonth * 100).toFixed(1))
      : null;

    const countTrend = lastMonthReservations > 0
      ? parseFloat(((thisMonthReservations - lastMonthReservations) / lastMonthReservations * 100).toFixed(1))
      : null;

    return {
      totalReservations,
      thisMonthReservations,
      lastMonthReservations,
      countTrend,
      totalRevenue: parseFloat((totalRevenue[0]?.total ?? 0).toFixed(2)),
      revenueThisMonth: parseFloat(revThisMonth.toFixed(2)),
      revenueLastMonth: parseFloat(revLastMonth.toFixed(2)),
      revTrend,
      statusBreakdown: statusMap,
      topVehicles,
      recentActivity,
    };
  }

  // ── History for a specific vehicle ────────────────────────────────────────
  async getVehicleHistory(vehicleId: string) {
    return this.reservationModel
      .find({ vehicle: new Types.ObjectId(vehicleId) })
      .populate('user', 'firstName lastName email phone')
      .sort({ createdAt: -1 })
      .exec();
  }

  // ── Private helpers ───────────────────────────────────────────────────────
  private calcAmountPaid(option: PaymentOption, total: number): number {
    const rates = { [PaymentOption.ACOMPTE]: 0.1, [PaymentOption.MOITIE]: 0.5, [PaymentOption.TOTAL]: 1 };
    return parseFloat((total * rates[option]).toFixed(2));
  }
}
