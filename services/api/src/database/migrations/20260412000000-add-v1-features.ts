import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddV1Features20260412000000 implements MigrationInterface {
  name = 'AddV1Features20260412000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // daily_inventories
    await queryRunner.query(`
      CREATE TABLE "daily_inventories" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "storeId" uuid NOT NULL,
        "date" date NOT NULL,
        "items" text NOT NULL,
        "reportedBy" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_daily_inventories_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "daily_inventories"
      ADD CONSTRAINT "FK_daily_inventories_store"
      FOREIGN KEY ("storeId") REFERENCES "store"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // menu_plans
    await queryRunner.query(`
      CREATE TABLE "menu_plans" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "storeId" uuid NOT NULL,
        "date" date NOT NULL,
        "mealType" character varying NOT NULL DEFAULT 'lunch',
        "dishes" text NOT NULL,
        "status" character varying NOT NULL DEFAULT 'draft',
        "createdBy" uuid NOT NULL,
        "reviewedBy" uuid,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_menu_plans_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "menu_plans"
      ADD CONSTRAINT "FK_menu_plans_store"
      FOREIGN KEY ("storeId") REFERENCES "store"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // tasks
    await queryRunner.query(`
      CREATE TABLE "tasks" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "storeId" uuid NOT NULL,
        "date" date NOT NULL,
        "mealType" character varying NOT NULL DEFAULT 'lunch',
        "source" character varying NOT NULL DEFAULT 'manual',
        "title" character varying NOT NULL,
        "items" text NOT NULL,
        "assignedTo" uuid,
        "status" character varying NOT NULL DEFAULT 'pending',
        "completedBy" uuid,
        "completedAt" date,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tasks_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "tasks"
      ADD CONSTRAINT "FK_tasks_store"
      FOREIGN KEY ("storeId") REFERENCES "store"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // operation_logs
    await queryRunner.query(`
      CREATE TABLE "operation_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "storeId" uuid NOT NULL,
        "operatedBy" uuid NOT NULL,
        "operatedByName" character varying NOT NULL,
        "module" character varying NOT NULL,
        "action" character varying NOT NULL,
        "targetId" character varying NOT NULL,
        "targetName" character varying,
        "before" text,
        "after" text,
        "summary" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_operation_logs_id" PRIMARY KEY ("id")
      )
    `);

    // dish extensions
    await queryRunner.query(`ALTER TABLE "dish" ADD COLUMN "recommendWeight" integer NOT NULL DEFAULT 1`);
    await queryRunner.query(`ALTER TABLE "dish" ADD COLUMN "mealType" character varying NOT NULL DEFAULT 'lunch'`);
    await queryRunner.query(`ALTER TABLE "dish" ADD COLUMN "relatedIngredients" character varying`);

    // ingredient extensions
    await queryRunner.query(`ALTER TABLE "ingredient" ADD COLUMN "category" character varying`);
    await queryRunner.query(`ALTER TABLE "ingredient" ADD COLUMN "perishable" boolean NOT NULL DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "ingredient" ADD COLUMN "type" character varying`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "ingredient" DROP COLUMN "type"`);
    await queryRunner.query(`ALTER TABLE "ingredient" DROP COLUMN "perishable"`);
    await queryRunner.query(`ALTER TABLE "ingredient" DROP COLUMN "category"`);
    await queryRunner.query(`ALTER TABLE "dish" DROP COLUMN "relatedIngredients"`);
    await queryRunner.query(`ALTER TABLE "dish" DROP COLUMN "mealType"`);
    await queryRunner.query(`ALTER TABLE "dish" DROP COLUMN "recommendWeight"`);
    await queryRunner.query(`DROP TABLE "operation_logs"`);
    await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_tasks_store"`);
    await queryRunner.query(`DROP TABLE "tasks"`);
    await queryRunner.query(`ALTER TABLE "menu_plans" DROP CONSTRAINT "FK_menu_plans_store"`);
    await queryRunner.query(`DROP TABLE "menu_plans"`);
    await queryRunner.query(`ALTER TABLE "daily_inventories" DROP CONSTRAINT "FK_daily_inventories_store"`);
    await queryRunner.query(`DROP TABLE "daily_inventories"`);
  }
}
