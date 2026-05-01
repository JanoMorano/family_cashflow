CREATE TABLE "BudgetSnapshot" (
    "id"        TEXT     NOT NULL PRIMARY KEY,
    "month"     TEXT     NOT NULL,
    "data"      TEXT     NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE UNIQUE INDEX "BudgetSnapshot_month_key" ON "BudgetSnapshot"("month");

CREATE TABLE "ElectricityReading" (
    "id"        TEXT     NOT NULL PRIMARY KEY,
    "date"      TEXT     NOT NULL,
    "vt"        REAL     NOT NULL,
    "nt"        REAL,
    "notes"     TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE UNIQUE INDEX "ElectricityReading_date_key" ON "ElectricityReading"("date");

CREATE TABLE "TariffConfig" (
    "id"   INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "data" TEXT    NOT NULL
);
