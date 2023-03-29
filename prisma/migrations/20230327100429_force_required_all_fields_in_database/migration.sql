/*
  Warnings:

  - Made the column `year` on table `BeneficiaryPdfFile` required. This step will fail if there are existing NULL values in that column.
  - Made the column `month` on table `BeneficiaryPdfFile` required. This step will fail if there are existing NULL values in that column.
  - Made the column `name` on table `BeneficiaryUser` required. This step will fail if there are existing NULL values in that column.
  - Made the column `type_beneficiary` on table `BeneficiaryUser` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "BeneficiaryPdfFile" ALTER COLUMN "year" SET NOT NULL,
ALTER COLUMN "month" SET NOT NULL;

-- AlterTable
ALTER TABLE "BeneficiaryUser" ALTER COLUMN "name" SET NOT NULL,
ALTER COLUMN "type_beneficiary" SET NOT NULL;
