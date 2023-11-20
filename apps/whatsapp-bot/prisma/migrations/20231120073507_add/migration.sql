-- CreateTable
CREATE TABLE "Snack" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "snack" TEXT NOT NULL,
    "calories" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Snack_pkey" PRIMARY KEY ("id")
);
