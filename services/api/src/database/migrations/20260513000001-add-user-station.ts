import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserStation20260513000000 implements MigrationInterface {
  name = 'AddUserStation20260513000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user"
      ADD COLUMN "station" character varying
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user"
      DROP COLUMN "station"
    `);
  }
}
