# City Care HMS — Hospital Management System

A 3-tier implementation of the Hospital Management System prototype:

- **Database**: SQL Server (run in SSMS) — [`Database/`](Database)
- **Middleware**: ASP.NET Core (.NET 9) Web API with JWT auth — [`Backend/HMS.API`](Backend/HMS.API)
- **Frontend**: Angular 17 (standalone components) — [`Frontend/hms-web`](Frontend/hms-web)

## What's implemented

Real, DB-backed logic for the end-to-end golden path across all 7 roles:

- **Auth**: JWT login, change password, forgot/reset password, role-based route guards.
- **Admin**: manage users & roles, departments, doctors (fees/hours/weekly availability), wards & beds, dashboard KPIs. Reports & Settings screens are present but show read-only/simplified data (no BI/report engine).
- **Receptionist**: patient registration (auto UHID), OPD appointment booking with live slot availability, IPD admission with bed allocation, discharge desk gated on billing, OPD bill collection.
- **Doctor**: OPD queue, consultation screen (vitals, diagnosis, prescription builder, order test), IPD rounds with discharge advice, patient history timeline, lab report review.
- **Nurse**: vitals entry for OPD/IPD patients, IPD patient list.
- **Pharmacist**: prescription queue, FEFO (first-expiry-first-out) dispensing with real stock deduction, inventory, purchase/stock entry, low-stock alerts.
- **Lab/Radiology**: test order queue, sample collection, result entry, report view.
- **Accountant**: consolidated OPD/IPD billing (auto-aggregated from consultation, pharmacy, lab, room charges), payment collection, insurance/TPA claim tracking.

The **discharge-gated-by-billing** rule from the prototype is real here: `IPDAdmission.BillCleared` is set automatically when an invoice tied to that admission is fully paid — there's no "simulate" button.

## Prerequisites

- SQL Server (Express/Developer/full) reachable from your machine, with SSMS or `sqlcmd`
- .NET 9 SDK
- Node.js 18+ and npm

## 1. Database setup

Run these in order (SSMS or `sqlcmd`) — see [`Database/README.md`](Database/README.md) for details:

```bash
sqlcmd -S <server> -E -i Database/01_CreateDatabase.sql
sqlcmd -S <server> -E -i Database/02_Schema.sql
sqlcmd -S <server> -E -i Database/03_SeedData.sql
```

This creates `HMSDb` with all tables and seeds demo accounts (see that README for the login list, e.g. `admin` / `Admin@123`).

## 2. Backend (ASP.NET Core Web API)

Edit `Backend/HMS.API/appsettings.json`:
- `ConnectionStrings:HMSDb` — point at your SQL Server instance.
- `Jwt:Key` — replace with a real random secret (32+ chars) before any non-local use.

Then run:

```bash
cd Backend/HMS.API
dotnet run
```

API listens on `http://localhost:5280` (Swagger UI at `/swagger`).

## 3. Frontend (Angular)

```bash
cd Frontend/hms-web
npm install
npm start
```

Opens on `http://localhost:4200`. The API base URL is set in `src/app/core/api-config.ts` (defaults to `http://localhost:5280/api`).

## Notes on scope

This build prioritizes a fully working core flow over exhaustive coverage of every screen in the original prototype:
- Reports/Analytics and System Settings are simplified (real KPI numbers where available, no drill-down report engine or configurable master-data UI).
- Insurance claim adjudication is a manual status update by Accounts/Admin, not an automated TPA integration.
