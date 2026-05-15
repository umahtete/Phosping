-- CreateTable
CREATE TABLE "LtiPlatform" (
    "id" TEXT NOT NULL,
    "issuer" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "deploymentId" TEXT NOT NULL,
    "authEndpoint" TEXT NOT NULL,
    "tokenEndpoint" TEXT,
    "jwksUri" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LtiPlatform_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LtiPlatform_issuer_clientId_deploymentId_key" ON "LtiPlatform"("issuer", "clientId", "deploymentId");
