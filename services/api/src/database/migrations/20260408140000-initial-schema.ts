import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema20260408140000 implements MigrationInterface {
  name = 'InitialSchema20260408140000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    await queryRunner.query(`
      CREATE TABLE "store" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "address" character varying,
        "brandId" character varying NOT NULL,
        "chefCount" integer NOT NULL DEFAULT 4,
        "dailyCustomers" integer NOT NULL DEFAULT 500,
        "isActive" boolean NOT NULL DEFAULT true,
        "contactName" character varying,
        "contactPhone" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_store_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "user" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "username" character varying NOT NULL,
        "passwordHash" character varying NOT NULL,
        "name" character varying NOT NULL,
        "role" character varying NOT NULL DEFAULT 'chef',
        "storeId" uuid,
        "wechatOpenId" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_user_username" UNIQUE ("username"),
        CONSTRAINT "PK_user_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "ingredient" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "unit" character varying NOT NULL,
        "price" numeric(10,2) NOT NULL,
        "costPerUnit" numeric(10,4),
        "supplier" character varying,
        "spec" character varying,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ingredient_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "dish" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "category" character varying NOT NULL,
        "station" character varying NOT NULL,
        "description" character varying,
        "coverImageUrl" character varying,
        "ingredients" text NOT NULL,
        "steps" text NOT NULL,
        "standardCost" numeric(10,2) NOT NULL,
        "suggestedPrice" numeric(10,2) NOT NULL,
        "expectedGrossMargin" numeric(5,2) NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_dish_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "user"
      ADD CONSTRAINT "FK_user_store"
      FOREIGN KEY ("storeId") REFERENCES "store"("id")
      ON DELETE SET NULL
      ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "user" DROP CONSTRAINT "FK_user_store"');
    await queryRunner.query('DROP TABLE "dish"');
    await queryRunner.query('DROP TABLE "ingredient"');
    await queryRunner.query('DROP TABLE "user"');
    await queryRunner.query('DROP TABLE "store"');
  }
}
