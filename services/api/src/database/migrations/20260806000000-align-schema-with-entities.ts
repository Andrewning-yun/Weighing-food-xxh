import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * 对齐实体与迁移的 schema 漂移（真实 Postgres 验证发现）：
 * 1. dish.ingredientCost 缺失（实体已从 standardCost 改名，旧列遗留）
 * 2. algorithm_config.recommendLimit 缺失
 * 3. ai_suggestions.appliedAt 类型需为 timestamptz
 * 4. daily_metrics.reportedBy / dish_feedback.reportedBy 需为 uuid（实体 ManyToOne User）
 * 5. operation_logs.storeId/operatedBy、tasks.completedBy 实体为 varchar，迁移误建为 uuid
 */
export class AlignSchemaWithEntities20260806000000 implements MigrationInterface {
  name = 'AlignSchemaWithEntities20260806000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "dish" ADD "ingredientCost" numeric(10,2) NOT NULL DEFAULT 0`);
    await queryRunner.query(`UPDATE "dish" SET "ingredientCost" = "standardCost"`);
    await queryRunner.query(`ALTER TABLE "dish" DROP COLUMN "standardCost"`);
    await queryRunner.query(`ALTER TABLE "dish" DROP COLUMN "suggestedPrice"`);
    await queryRunner.query(`ALTER TABLE "dish" DROP COLUMN "expectedGrossMargin"`);

    await queryRunner.query(`ALTER TABLE "algorithm_config" ADD "recommendLimit" integer NOT NULL DEFAULT 20`);

    await queryRunner.query(
      `ALTER TABLE "ai_suggestions" ALTER COLUMN "appliedAt" TYPE TIMESTAMP WITH TIME ZONE`,
    );

    await queryRunner.query(
      `ALTER TABLE "daily_metrics" ALTER COLUMN "reportedBy" TYPE uuid USING "reportedBy"::uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "dish_feedback" ALTER COLUMN "reportedBy" TYPE uuid USING "reportedBy"::uuid`,
    );

    await queryRunner.query(
      `ALTER TABLE "operation_logs" ALTER COLUMN "storeId" TYPE character varying USING "storeId"::text`,
    );
    await queryRunner.query(
      `ALTER TABLE "operation_logs" ALTER COLUMN "operatedBy" TYPE character varying USING "operatedBy"::text`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" ALTER COLUMN "completedBy" TYPE character varying USING "completedBy"::text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tasks" ALTER COLUMN "completedBy" TYPE uuid USING "completedBy"::uuid`);
    await queryRunner.query(
      `ALTER TABLE "operation_logs" ALTER COLUMN "operatedBy" TYPE uuid USING "operatedBy"::uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "operation_logs" ALTER COLUMN "storeId" TYPE uuid USING "storeId"::uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "dish_feedback" ALTER COLUMN "reportedBy" TYPE character varying USING "reportedBy"::text`,
    );
    await queryRunner.query(
      `ALTER TABLE "daily_metrics" ALTER COLUMN "reportedBy" TYPE character varying USING "reportedBy"::text`,
    );
    await queryRunner.query(`ALTER TABLE "ai_suggestions" ALTER COLUMN "appliedAt" TYPE TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "algorithm_config" DROP COLUMN "recommendLimit"`);
    await queryRunner.query(
      `ALTER TABLE "dish" ADD "expectedGrossMargin" numeric(5,2) NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(`ALTER TABLE "dish" ADD "suggestedPrice" numeric(10,2) NOT NULL DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "dish" ADD "standardCost" numeric(10,2) NOT NULL DEFAULT 0`);
    await queryRunner.query(`UPDATE "dish" SET "standardCost" = "ingredientCost"`);
    await queryRunner.query(`ALTER TABLE "dish" DROP COLUMN "ingredientCost"`);
  }
}
