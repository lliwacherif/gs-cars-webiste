import {
  Body, Controller, Delete, Get, Param, Query,
  Patch, Post, UseGuards,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiResponse, ApiBearerAuth,
  ApiParam, ApiBody,
} from '@nestjs/swagger';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationStatusDto } from './dto/update-reservation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Reservations')
@ApiBearerAuth('JWT')
@Controller('reservations')
@UseGuards(JwtAuthGuard)
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  /**
   * Creates a new reservation for the authenticated user.
   *
   * Server-side logic:
   * - Checks that the vehicle is `Disponible` and `isActive`.
   * - Validates that no confirmed/pending reservation overlaps the requested date range.
   * - Calculates pricing automatically (totalDays × pricePerDay, TVA 19%).
   * - Splits the amount due based on the selected `paymentOption`.
   * - Marks the vehicle status as `Réservé` on success.
   */
  @Post()
  @ApiOperation({
    summary: 'Create a reservation',
    description:
      'Books a vehicle for the authenticated user. Pricing is calculated server-side.\n\n' +
      '**Conflict detection:** will reject if the vehicle is already reserved for the requested dates.\n\n' +
      '**TVA:** 19% is included in `pricePerDay` — totals are broken down into HT + TVA + TTC.',
  })
  @ApiBody({ type: CreateReservationDto })
  @ApiResponse({ status: 201, description: 'Reservation created — vehicle status set to Réservé' })
  @ApiResponse({ status: 400, description: 'Vehicle unavailable, date conflict, or validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized — login required' })
  create(
    @Body() dto: CreateReservationDto,
    @CurrentUser('_id') userId: string,
  ) {
    return this.reservationsService.create(dto, userId);
  }

  /**
   * Returns reservations for the current user.
   * Admins see ALL reservations; customers see only their own.
   */
  @Get()
  @ApiOperation({
    summary: 'List reservations',
    description: '**Admin:** returns all reservations.\n**Customer:** returns only own reservations.',
  })
  @ApiResponse({ status: 200, description: 'Array of populated reservation documents' })
  findAll(
    @CurrentUser('_id') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.reservationsService.findAll(userId, role);
  }

  /**
   * Admin-only: returns the next N upcoming confirmed/pending reservations.
   * Used by the admin dashboard sidebar widget.
   */
  @Get('upcoming')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: '[Admin] Get upcoming reservations' })
  getUpcoming() {
    return this.reservationsService.getUpcoming();
  }

  /**
   * Admin-only: aggregated dashboard KPIs — revenue, counts, top vehicles, recent activity.
   * All numbers come from real DB aggregations, nothing is hardcoded.
   */
  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: '[Admin] Dashboard stats (revenue, counts, top vehicles)' })
  getStats() {
    return this.reservationsService.getStats();
  }

  /**
   * Admin-only: full reservation history for a specific vehicle.
   */
  @Get('vehicle/:vehicleId/history')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: '[Admin] Reservation history for a vehicle' })
  getVehicleHistory(@Param('vehicleId') vehicleId: string) {
    return this.reservationsService.getVehicleHistory(vehicleId);
  }

  /**
   * Admin-only: calendar data for a specific week.
   * Returns all vehicles + only pending/confirmed reservations overlapping the window.
   * Must be declared BEFORE GET :id to avoid route collision.
   */
  @Get('calendar')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: '[Admin] Calendar data for a date range' })
  getCalendar(
    @Query('startDate') startDate: string,
    @Query('endDate')   endDate: string,
  ) {
    return this.reservationsService.getCalendar(startDate, endDate);
  }

  /**
   * Returns a single reservation by ID.
   * Admins can fetch any; customers can only fetch their own.
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get reservation by ID',
    description: 'Returns full reservation detail. Customers can only access their own reservations.',
  })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the reservation' })
  @ApiResponse({ status: 200, description: 'Populated reservation document' })
  @ApiResponse({ status: 403, description: 'Forbidden — not your reservation' })
  @ApiResponse({ status: 404, description: 'Reservation not found' })
  findOne(
    @Param('id') id: string,
    @CurrentUser('_id') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.reservationsService.findOne(id, userId, role);
  }

  /**
   * Admin-only: updates the status of a reservation.
   *
   * Side effects:
   * - Setting status to `cancelled` or `completed` marks the vehicle back as `Disponible`.
   */
  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({
    summary: '[Admin] Update reservation status',
    description:
      'Changes the status of a reservation.\n\n' +
      '**Side effect:** setting `cancelled` or `completed` restores the vehicle availability to `Disponible`.',
  })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the reservation' })
  @ApiBody({ type: UpdateReservationStatusDto })
  @ApiResponse({ status: 200, description: 'Updated reservation document' })
  @ApiResponse({ status: 404, description: 'Reservation not found' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateReservationStatusDto,
  ) {
    return this.reservationsService.updateStatus(id, dto);
  }

  /**
   * Admin-only: permanently deletes a reservation record.
   * Also resyncs the related vehicle status (Disponible / Réservé).
   */
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({
    summary: '[Admin] Delete a reservation',
    description:
      'Permanently removes the reservation from the database and recomputes the vehicle availability.',
  })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the reservation to delete' })
  @ApiResponse({ status: 200, description: '{ message: "Reservation deleted successfully", id }' })
  @ApiResponse({ status: 400, description: 'Invalid reservation ID' })
  @ApiResponse({ status: 403, description: 'Forbidden — admin only' })
  @ApiResponse({ status: 404, description: 'Reservation not found' })
  remove(@Param('id') id: string) {
    return this.reservationsService.remove(id);
  }
}
