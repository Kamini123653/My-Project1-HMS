/* =========================================================
   HMS - City Care Hospital Management System
   01_CreateDatabase.sql
   Run this first in SSMS (connect to your SQL Server instance).
   ========================================================= */
IF DB_ID('HMSDb') IS NULL
BEGIN
    CREATE DATABASE HMSDb;
END
GO

ALTER DATABASE HMSDb SET RECOVERY SIMPLE;
GO

USE HMSDb;
GO
