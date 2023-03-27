-- DropForeignKey
ALTER TABLE "BeneficiaryPdfFile" DROP CONSTRAINT "BeneficiaryPdfFile_cpf_fkey";

-- AddForeignKey
ALTER TABLE "BeneficiaryPdfFile" ADD CONSTRAINT "BeneficiaryPdfFile_cpf_fkey" FOREIGN KEY ("cpf") REFERENCES "BeneficiaryUser"("cpf") ON DELETE CASCADE ON UPDATE CASCADE;
