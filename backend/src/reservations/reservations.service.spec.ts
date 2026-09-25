import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Types } from 'mongoose';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { PaymentOption } from './schemas/reservation.schema';
import { VehicleStatus } from '../vehicles/schemas/vehicle.schema';

const VEHICLE_ID = '507f1f77bcf86cd799439011';
const USER_ID = '507f191e810c19729de860ea';

function futureDate(daysFromNow: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + daysFromNow);
  return date.toISOString().slice(0, 10);
}

function reservationDto(overrides: Partial<CreateReservationDto> = {}): CreateReservationDto {
  return {
    vehicleId: VEHICLE_ID,
    pickupLocation: 'Aéroport de Tunis-Carthage',
    dropoffLocation: 'Aéroport de Tunis-Carthage',
    pickupDate: futureDate(2),
    dropoffDate: futureDate(5),
    driverAge: 30,
    paymentOption: PaymentOption.ACOMPTE,
    guestContact: {
      fullName: '  Sami Ben Ali  ',
      email: ' SAMI@EXAMPLE.COM ',
      phone: ' +216 20 123 456 ',
    },
    ...overrides,
  };
}

describe('ReservationsService guest reservations', () => {
  let service: ReservationsService;
  let reservationModel: {
    findOne: jest.Mock;
    create: jest.Mock;
    findById: jest.Mock;
  };
  let vehiclesService: { findOne: jest.Mock };
  let holdsService: { hasConflict: jest.Mock; release: jest.Mock };
  let mailService: { sendReservationApproval: jest.Mock };

  beforeEach(() => {
    reservationModel = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation(async data => ({
        _id: new Types.ObjectId(),
        ...data,
        populate: jest.fn().mockResolvedValue(data),
      })),
      findById: jest.fn(),
    };
    vehiclesService = {
      findOne: jest.fn().mockResolvedValue({
        _id: VEHICLE_ID,
        status: VehicleStatus.DISPONIBLE,
        isActive: true,
        pricePerDay: 119,
        depositAmount: 500,
      }),
    };
    holdsService = {
      hasConflict: jest.fn().mockResolvedValue(false),
      release: jest.fn().mockResolvedValue(undefined),
    };
    mailService = { sendReservationApproval: jest.fn() };

    service = new ReservationsService(
      reservationModel as never,
      vehiclesService as never,
      holdsService as never,
      mailService as never,
    );
  });

  it('creates a guest reservation without a user account', async () => {
    const dto = reservationDto({ holdId: '507f1f77bcf86cd799439012' });

    await service.create(dto);

    expect(reservationModel.create).toHaveBeenCalledWith(expect.objectContaining({
      user: null,
      guestContact: {
        fullName: 'Sami Ben Ali',
        email: 'sami@example.com',
        phone: '+216 20 123 456',
      },
      status: 'recu',
      amountPaid: 0,
    }));
    expect(holdsService.release).toHaveBeenCalledWith(dto.holdId);
  });

  it('creates a guest reservation when email is omitted', async () => {
    const dto = reservationDto({
      guestContact: {
        fullName: 'Sami Ben Ali',
        phone: '+216 20 123 456',
      },
    });

    await service.create(dto);

    expect(reservationModel.create).toHaveBeenCalledWith(expect.objectContaining({
      user: null,
      guestContact: {
        fullName: 'Sami Ben Ali',
        phone: '+216 20 123 456',
        email: undefined,
      },
    }));
  });

  it('keeps the existing authenticated reservation flow', async () => {
    const dto = reservationDto({ guestContact: undefined });

    await service.create(dto, USER_ID);

    const saved = reservationModel.create.mock.calls[0][0];
    expect(saved.user.toString()).toBe(USER_ID);
    expect(saved.guestContact).toBeNull();
  });

  it('rejects an anonymous reservation without contact details', async () => {
    await expect(service.create(reservationDto({ guestContact: undefined })))
      .rejects.toBeInstanceOf(BadRequestException);
    expect(reservationModel.create).not.toHaveBeenCalled();
  });

  it('denies customer access to a guest reservation instead of crashing', async () => {
    const query = {
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue({ user: null }),
    };
    reservationModel.findById.mockReturnValue(query);

    await expect(service.findOne(new Types.ObjectId().toString(), USER_ID, 'customer'))
      .rejects.toBeInstanceOf(ForbiddenException);
  });
});
