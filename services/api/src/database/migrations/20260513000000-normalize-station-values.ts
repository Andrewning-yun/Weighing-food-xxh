import { MigrationInterface, QueryRunner } from 'typeorm';

export class NormalizeStationValues20260513000000 implements MigrationInterface {
  name = 'NormalizeStationValues20260513000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Update dish station values
    await queryRunner.query(`
      UPDATE "dish"
      SET "station" = 'wok'
      WHERE "station" IN ('station_1', 'station_2')
    `);

    await queryRunner.query(`
      UPDATE "dish"
      SET "station" = 'grill_fry_steam'
      WHERE "station" IN ('steam', 'griddle', 'fry')
    `);

    await queryRunner.query(`
      UPDATE "dish"
      SET "station" = 'breakfast_wok'
      WHERE "station" = 'breakfast_station'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverse: map back to old values
    await queryRunner.query(`
      UPDATE "dish"
      SET "station" = 'station_1'
      WHERE "station" = 'wok'
    `);

    await queryRunner.query(`
      UPDATE "dish"
      SET "station" = 'station_1'
      WHERE "station" = 'grill_fry_steam'
    `);

    await queryRunner.query(`
      UPDATE "dish"
      SET "station" = 'breakfast_station'
      WHERE "station" IN ('breakfast_wok', 'breakfast_assist')
    `);
  }
}
