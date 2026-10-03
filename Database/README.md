# HMS Database (SQL Server / SSMS)

Run these three scripts **in order** against your SQL Server instance using SSMS (or `sqlcmd`):

1. `01_CreateDatabase.sql` — creates the `HMSDb` database.
2. `02_Schema.sql` — creates all tables, keys and constraints.
3. `03_SeedData.sql` — inserts roles, departments, demo users, doctors, wards/beds, patients, medicines, and a few sample OPD/IPD records so the app has data to show on first run.

## Running from SSMS
Open each file (in order) in SSMS while connected to your target server, and click **Execute** (F5).

## Running from sqlcmd
```bash
sqlcmd -S <server> -E -i 01_CreateDatabase.sql
sqlcmd -S <server> -E -i 02_Schema.sql
sqlcmd -S <server> -E -i 03_SeedData.sql
```
Replace `-E` (Windows auth) with `-U <user> -P <password>` for SQL auth.

## Default login accounts (seeded)
| Username     | Password        | Role          |
|--------------|-----------------|---------------|
| admin        | Admin@123       | Admin         |
| r.iyer       | Doctor@123      | Doctor (Cardiology) |
| s.patel      | Doctor@123      | Doctor (Orthopedics) |
| m.fernandes  | Nurse@123       | Nurse         |
| s.kulkarni   | Reception@123   | Receptionist  |
| v.naik       | Pharma@123      | Pharmacist    |
| p.rao        | Lab@123         | Lab/Radiology |
| n.joshi      | Accounts@123    | Accountant    |

Passwords are stored as BCrypt hashes — the API validates them with `BCrypt.Net-Next`.

## Connection string
Point the API's `appsettings.json` (`ConnectionStrings:HMSDb`) at this database, e.g.:
```
Server=localhost;Database=HMSDb;Trusted_Connection=True;TrustServerCertificate=True;
```
