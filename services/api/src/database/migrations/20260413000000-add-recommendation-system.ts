import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRecommendationSystem20260413000000 implements MigrationInterface {
  name = 'AddRecommendationSystem20260413000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "store" ADD COLUMN "targetTicketPriceBreakfast" numeric(10,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "store" ADD COLUMN "targetTicketPriceLunch" numeric(10,2)`,
    );
    await queryRunner.query(`ALTER TABLE "store" ADD COLUMN "pricePerLiang" numeric(10,2)`);
    await queryRunner.query(
      `ALTER TABLE "store" ADD COLUMN "memberPricePerLiang" numeric(10,2)`,
    );
    await queryRunner.query(`ALTER TABLE "store" ADD COLUMN "ricePrice" numeric(10,2)`);
    await queryRunner.query(`ALTER TABLE "dish" ADD COLUMN "dishTypeTag" character varying`);
    await queryRunner.query(
      `ALTER TABLE "dish" ADD COLUMN "dishTypeTagManualOverride" boolean NOT NULL DEFAULT false`,
    );

    await queryRunner.query(`
      CREATE TABLE "daily_metrics" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "storeId" uuid NOT NULL,
        "date" date NOT NULL,
        "mealType" character varying NOT NULL DEFAULT 'lunch',
        "ticketPrice" numeric(10,2) NOT NULL,
        "guestCount" integer NOT NULL,
        "weather" character varying,
        "reportedBy" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_daily_metrics_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "daily_metrics"
      ADD CONSTRAINT "FK_daily_metrics_store"
      FOREIGN KEY ("storeId") REFERENCES "store"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE TABLE "dish_feedback" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "storeId" uuid NOT NULL,
        "date" date NOT NULL,
        "mealType" character varying NOT NULL DEFAULT 'lunch',
        "dishId" uuid NOT NULL,
        "dishName" character varying NOT NULL,
        "feedbackLevel" character varying NOT NULL DEFAULT 'medium',
        "remainingQty" integer,
        "remark" text,
        "reportedBy" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_dish_feedback_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "dish_feedback"
      ADD CONSTRAINT "FK_dish_feedback_store"
      FOREIGN KEY ("storeId") REFERENCES "store"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "dish_feedback"
      ADD CONSTRAINT "FK_dish_feedback_dish"
      FOREIGN KEY ("dishId") REFERENCES "dish"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE TABLE "menu_standards" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "storeId" uuid NOT NULL,
        "mealType" character varying NOT NULL DEFAULT 'lunch',
        "category" character varying NOT NULL,
        "targetCount" integer NOT NULL,
        "remark" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_menu_standards_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "menu_standards"
      ADD CONSTRAINT "FK_menu_standards_store"
      FOREIGN KEY ("storeId") REFERENCES "store"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE TABLE "default_dishes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "storeId" uuid NOT NULL,
        "mealType" character varying NOT NULL DEFAULT 'lunch',
        "dayOfWeek" integer NOT NULL,
        "dishId" uuid NOT NULL,
        "dishName" character varying NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "remark" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_default_dishes_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "default_dishes"
      ADD CONSTRAINT "FK_default_dishes_store"
      FOREIGN KEY ("storeId") REFERENCES "store"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "default_dishes"
      ADD CONSTRAINT "FK_default_dishes_dish"
      FOREIGN KEY ("dishId") REFERENCES "dish"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE TABLE "algorithm_config" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "storeId" uuid NOT NULL,
        "ticketPriceBonusWeight" numeric(10,2) NOT NULL DEFAULT 1,
        "pairingBonusWeight" numeric(10,2) NOT NULL DEFAULT 1,
        "feedbackBonusWeight" numeric(10,2) NOT NULL DEFAULT 1,
        "diversityBonusWeight" numeric(10,2) NOT NULL DEFAULT 1,
        "categoryBonusWeight" numeric(10,2) NOT NULL DEFAULT 1,
        "menuCompletenessWeight" numeric(10,2) NOT NULL DEFAULT 1,
        "menuFreshnessWeight" numeric(10,2) NOT NULL DEFAULT 1,
        "menuGrossMarginWeight" numeric(10,2) NOT NULL DEFAULT 1,
        "defaultDishPenalty" numeric(10,2) NOT NULL DEFAULT 1,
        "ticketPriceThreshold" numeric(10,2) NOT NULL DEFAULT 0.1,
        "ticketPriceCapMultiplier" numeric(10,2) NOT NULL DEFAULT 3,
        "recentDaysWindow" integer NOT NULL DEFAULT 7,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_algorithm_config_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "algorithm_config"
      ADD CONSTRAINT "UQ_algorithm_config_store"
      UNIQUE ("storeId")
    `);
    await queryRunner.query(`
      ALTER TABLE "algorithm_config"
      ADD CONSTRAINT "FK_algorithm_config_store"
      FOREIGN KEY ("storeId") REFERENCES "store"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE TABLE "dish_type_tags" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "code" character varying NOT NULL,
        "name" character varying NOT NULL,
        "description" text,
        "keywords" text NOT NULL DEFAULT '[]',
        "categoryHints" text NOT NULL DEFAULT '[]',
        "mealTypeHints" text NOT NULL DEFAULT '[]',
        "priority" integer NOT NULL DEFAULT 0,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_dish_type_tags_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "dish_type_tags"
      ADD CONSTRAINT "UQ_dish_type_tags_code"
      UNIQUE ("code")
    `);

    await queryRunner.query(`
      CREATE TABLE "menu_pairing_rules" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "storeId" uuid NOT NULL,
        "mealType" character varying NOT NULL DEFAULT 'lunch',
        "tagCode" character varying NOT NULL,
        "minCount" integer NOT NULL DEFAULT 0,
        "maxCount" integer NOT NULL DEFAULT 0,
        "description" text,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_menu_pairing_rules_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "menu_pairing_rules"
      ADD CONSTRAINT "FK_menu_pairing_rules_store"
      FOREIGN KEY ("storeId") REFERENCES "store"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE TABLE "ai_suggestions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "storeId" uuid NOT NULL,
        "mealType" character varying NOT NULL DEFAULT 'lunch',
        "date" date NOT NULL,
        "title" character varying NOT NULL,
        "content" text NOT NULL,
        "source" character varying NOT NULL DEFAULT 'manual',
        "status" character varying NOT NULL DEFAULT 'draft',
        "appliedAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ai_suggestions_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "ai_suggestions"
      ADD CONSTRAINT "FK_ai_suggestions_store"
      FOREIGN KEY ("storeId") REFERENCES "store"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "ai_suggestions" DROP CONSTRAINT "FK_ai_suggestions_store"`);
    await queryRunner.query(`DROP TABLE "ai_suggestions"`);

    await queryRunner.query(`ALTER TABLE "menu_pairing_rules" DROP CONSTRAINT "FK_menu_pairing_rules_store"`);
    await queryRunner.query(`DROP TABLE "menu_pairing_rules"`);

    await queryRunner.query(`ALTER TABLE "dish_type_tags" DROP CONSTRAINT "UQ_dish_type_tags_code"`);
    await queryRunner.query(`DROP TABLE "dish_type_tags"`);

    await queryRunner.query(`ALTER TABLE "algorithm_config" DROP CONSTRAINT "FK_algorithm_config_store"`);
    await queryRunner.query(`ALTER TABLE "algorithm_config" DROP CONSTRAINT "UQ_algorithm_config_store"`);
    await queryRunner.query(`DROP TABLE "algorithm_config"`);

    await queryRunner.query(`ALTER TABLE "default_dishes" DROP CONSTRAINT "FK_default_dishes_dish"`);
    await queryRunner.query(`ALTER TABLE "default_dishes" DROP CONSTRAINT "FK_default_dishes_store"`);
    await queryRunner.query(`DROP TABLE "default_dishes"`);

    await queryRunner.query(`ALTER TABLE "menu_standards" DROP CONSTRAINT "FK_menu_standards_store"`);
    await queryRunner.query(`DROP TABLE "menu_standards"`);

    await queryRunner.query(`ALTER TABLE "dish_feedback" DROP CONSTRAINT "FK_dish_feedback_dish"`);
    await queryRunner.query(`ALTER TABLE "dish_feedback" DROP CONSTRAINT "FK_dish_feedback_store"`);
    await queryRunner.query(`DROP TABLE "dish_feedback"`);

    await queryRunner.query(`ALTER TABLE "daily_metrics" DROP CONSTRAINT "FK_daily_metrics_store"`);
    await queryRunner.query(`DROP TABLE "daily_metrics"`);

    await queryRunner.query(`ALTER TABLE "dish" DROP COLUMN "dishTypeTagManualOverride"`);
    await queryRunner.query(`ALTER TABLE "dish" DROP COLUMN "dishTypeTag"`);
    await queryRunner.query(`ALTER TABLE "store" DROP COLUMN "ricePrice"`);
    await queryRunner.query(`ALTER TABLE "store" DROP COLUMN "memberPricePerLiang"`);
    await queryRunner.query(`ALTER TABLE "store" DROP COLUMN "pricePerLiang"`);
    await queryRunner.query(`ALTER TABLE "store" DROP COLUMN "targetTicketPriceLunch"`);
    await queryRunner.query(`ALTER TABLE "store" DROP COLUMN "targetTicketPriceBreakfast"`);
  }
}
