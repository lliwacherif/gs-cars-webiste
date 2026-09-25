import {
  Controller, Get, Post, Put, Delete, Patch,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiResponse, ApiBearerAuth,
  ApiParam, ApiBody, ApiQuery,
} from '@nestjs/swagger';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { QueryVehicleDto } from './dto/query-vehicle.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Vehicles')
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  /**
   * Public endpoint — returns paginated, filtered and sorted list of active vehicles.
   * Supports filtering by category, transmission, fuel, price range, seats, AC, GPS.
   */
  @Get()
  @ApiOperation({
    summary: 'List vehicles (public)',
    description:
      'Returns a paginated list of **active** vehicles. Supports optional filters:\n\n' +
      '- `category` — Économique | Compacte | Berline | SUV | Luxe | Monospace | Utilitaire\n' +
      '- `transmission` — Manuelle | Automatique\n' +
      '- `fuel` — Essence | Diesel | Hybride | Électrique\n' +
      '- `minPrice` / `maxPrice` — price per day range (TND)\n' +
      '- `seats` — minimum number of seats\n' +
      '- `ac` / `gps` — boolean feature flags\n' +
      '- `page` / `limit` — pagination\n' +
      '- `sortBy` / `sortOrder` — sorting (e.g. pricePerDay asc)',
  })
  @ApiResponse({ status: 200, description: 'Returns { vehicles: [...], pagination: { total, page, limit, totalPages } }' })
  findAll(@Query() query: QueryVehicleDto) {
    return this.vehiclesService.findAll(query);
  }

  /**
   * Admin-only: returns ALL vehicles regardless of isActive flag.
   * Used by the admin dashboard to manage the full fleet.
   */
  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: '[Admin] List all vehicles including inactive',
    description: 'Returns every vehicle in the database regardless of `isActive` status. Admin role required.',
  })
  @ApiResponse({ status: 200, description: 'Array of all vehicle documents' })
  @ApiResponse({ status: 403, description: 'Forbidden — admin role required' })
  findAllAdmin() {
    return this.vehiclesService.findAllAdmin();
  }

  /**
   * Public endpoint — returns a single vehicle by its MongoDB ObjectId.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get vehicle by ID (public)', description: 'Returns the full vehicle document including features and images.' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the vehicle' })
  @ApiResponse({ status: 200, description: 'Vehicle document' })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  findOne(@Param('id') id: string) {
    return this.vehiclesService.findOne(id);
  }

  /**
   * Admin-only: creates a new vehicle in the fleet.
   * Images should be uploaded first via POST /upload/image and their URLs passed here.
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: '[Admin] Create a new vehicle',
    description: 'Creates a new vehicle. Upload images first via `POST /api/upload/image` and include the returned URLs in the `images` array.',
  })
  @ApiBody({ type: CreateVehicleDto })
  @ApiResponse({ status: 201, description: 'Vehicle created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error or duplicate plate' })
  @ApiResponse({ status: 403, description: 'Forbidden — admin role required' })
  create(@Body() dto: CreateVehicleDto) {
    return this.vehiclesService.create(dto);
  }

  /**
   * Admin-only: updates any field of an existing vehicle (partial update via PartialType).
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: '[Admin] Update a vehicle', description: 'Partial update — only provided fields are changed.' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the vehicle to update' })
  @ApiBody({ type: UpdateVehicleDto })
  @ApiResponse({ status: 200, description: 'Updated vehicle document' })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  update(@Param('id') id: string, @Body() dto: UpdateVehicleDto) {
    return this.vehiclesService.update(id, dto);
  }

  /**
   * Admin-only: toggles the `isActive` flag, hiding/showing a vehicle from the public catalogue.
   * Does NOT affect the vehicle's `status` field.
   */
  @Patch(':id/toggle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: '[Admin] Toggle vehicle visibility',
    description: 'Flips the `isActive` boolean. Inactive vehicles are hidden from public search results.',
  })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the vehicle' })
  @ApiResponse({ status: 200, description: 'Vehicle with updated isActive value' })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  toggle(@Param('id') id: string) {
    return this.vehiclesService.toggleActive(id);
  }

  /**
   * Admin-only: permanently deletes a vehicle from the fleet.
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: '[Admin] Delete a vehicle' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the vehicle to delete' })
  remove(@Param('id') id: string) {
    return this.vehiclesService.remove(id);
  }

  /**
   * Admin-only: manually put a vehicle in/out of Maintenance mode.
   * enable=true  → Maintenance  (manual override, not affected by reservations)
   * enable=false → triggers syncVehicleStatus to recompute Disponible/Réservé
   */
  @Patch(':id/maintenance')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: '[Admin] Set or clear Maintenance status' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the vehicle' })
  setMaintenance(
    @Param('id') id: string,
    @Body('enable') enable: boolean,
  ) {
    return this.vehiclesService.setMaintenance(id, enable);
  }

  /**
   * Admin-only: assigns a vehicle to multiple parcs simultaneously.
   * Sets both the `parcs` array and updates the primary `parc` field.
   */
  @Patch(':id/parcs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: '[Admin] Assign vehicle to multiple parcs',
    description: 'Sets the parcs array for a vehicle. The first parc becomes the primary parc.',
  })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the vehicle' })
  @ApiBody({ schema: { properties: { parcIds: { type: 'array', items: { type: 'string' } } } } })
  assignToParcs(
    @Param('id') id: string,
    @Body('parcIds') parcIds: string[],
  ) {
    return this.vehiclesService.assignToMultipleParcs(id, parcIds || []);
  }

  /**
   * Admin-only: recomputes Disponible/Réservé for every vehicle based on its
   * actual reservations.  Call this once to fix stale data in the DB,
   * or after any bulk operation.  Maintenance vehicles are untouched.
   */
  @Post('sync-status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: '[Admin] Resync all vehicle statuses from reservations' })
  async syncAllStatuses() {
    await this.vehiclesService.syncAllVehicleStatuses();
    return { message: 'Vehicle statuses resynced successfully' };
  }
}

