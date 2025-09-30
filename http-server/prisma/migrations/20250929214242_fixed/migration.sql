/*
  Warnings:

  - A unique constraint covering the columns `[owner_id,subdomain]` on the table `Project` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Project_owner_id_subdomain_key" ON "public"."Project"("owner_id", "subdomain");
