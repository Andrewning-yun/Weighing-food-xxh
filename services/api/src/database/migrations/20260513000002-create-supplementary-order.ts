import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSupplementaryOrderTable20260513000000 implements MigrationInterface {
  name = 'CreateSupplementaryOrderTable20260513000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "supplementary_order" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "storeId" character varying NOT NULL,
        "date" date NOT NULL,
        "mealType" character varying NOT NULL DEFAULT 'lunch',
        "menuPlanId" character varying NOT NULL,
        "dishId" character varying NOT NULL,
        "dishName" character varying NOT NULL,
        "station" character varying NOT NULL,
        "userId" character varying NOT NULL,
        "userName" character varying NOT NULL,
        "reason" text,
        "estimatedQuantity" decimal,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_supplementary_order_id" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "supplementary_order"');
  }
}
