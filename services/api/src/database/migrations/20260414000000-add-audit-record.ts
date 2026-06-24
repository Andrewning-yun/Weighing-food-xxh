import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAuditRecordTable20260414000000 implements MigrationInterface {
  name = 'AddAuditRecordTable20260414000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "audit_record" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "storeId" character varying NOT NULL,
        "module" character varying NOT NULL,
        "action" character varying NOT NULL,
        "targetId" character varying NOT NULL,
        "targetName" character varying,
        "operatedBy" character varying NOT NULL,
        "operatedByName" character varying NOT NULL,
        "before" text,
        "after" text,
        "status" character varying NOT NULL DEFAULT 'pending',
        "reviewedBy" character varying,
        "reviewedByName" character varying,
        "reviewedAt" TIMESTAMP,
        "rejectReason" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_audit_record_id" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "audit_record"');
  }
}
