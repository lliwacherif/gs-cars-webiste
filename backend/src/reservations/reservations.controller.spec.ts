import { GUARDS_METADATA } from '@nestjs/common/constants';
import { ReservationsController } from './reservations.controller';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

function guardsFor(method: keyof ReservationsController): unknown[] {
  return Reflect.getMetadata(
    GUARDS_METADATA,
    ReservationsController.prototype[method],
  ) ?? [];
}

describe('ReservationsController guards', () => {
  it('allows create with optional authentication', () => {
    expect(guardsFor('create')).toEqual([OptionalJwtAuthGuard]);
  });

  it.each(['findAll', 'findOne'] as const)('keeps %s authenticated', method => {
    expect(guardsFor(method)).toContain(JwtAuthGuard);
  });

  it.each([
    'getUpcoming',
    'getStats',
    'getVehicleHistory',
    'getCalendar',
    'updateStatus',
    'remove',
  ] as const)('keeps %s admin-only', method => {
    expect(guardsFor(method)).toEqual([JwtAuthGuard, RolesGuard]);
  });
});
