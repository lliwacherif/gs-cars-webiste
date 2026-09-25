import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';

/**
 * Runs syncAllVehicleStatuses() on server startup and every 15 minutes.
 *
 * This catches the "time just passed" case: a reservation's dropoffDate
 * passes with no one touching it, so no CRUD event fires. Without a periodic
 * sync the vehicle would stay "Réservé" forever even though the rental ended.
 */
@Injectable()
export class VehicleStatusSyncService implements OnModuleInit {
  private readonly logger = new Logger(VehicleStatusSyncService.name);

  constructor(private readonly vehiclesService: VehiclesService) {}

  /** Runs once when the NestJS app finishes bootstrapping */
  async onModuleInit() {
    this.logger.log('Running startup vehicle status sync…');
    await this.runSync();

    // Re-run every 15 minutes (900 000 ms)
    setInterval(() => this.runSync(), 15 * 60 * 1000);
    this.logger.log('Periodic vehicle status sync scheduled (every 15 min)');
  }

  private async runSync() {
    try {
      await this.vehiclesService.syncAllVehicleStatuses();
      this.logger.debug('Vehicle status sync completed');
    } catch (err) {
      this.logger.error('Vehicle status sync failed', err?.message);
    }
  }
}
