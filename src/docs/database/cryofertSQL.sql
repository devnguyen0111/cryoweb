-- --------------------------------------------------------
-- Host:                         mysql-cryofert-phongaccclone-a075.d.aivencloud.com
-- Server version:               8.0.35 - Source distribution
-- Server OS:                    Linux
-- HeidiSQL Version:             12.12.0.7122
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Dumping database structure for cryofertdb
CREATE DATABASE IF NOT EXISTS `cryofertdb` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `cryofertdb`;

-- Dumping structure for table cryofertdb.Accounts
CREATE TABLE IF NOT EXISTS `Accounts` (
  `Id` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  `FirstName` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `LastName` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `BirthDate` datetime(6) DEFAULT NULL,
  `Gender` tinyint(1) DEFAULT NULL,
  `Phone` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Address` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Username` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Email` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `PasswordHash` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `RefreshToken` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `ExpiredRefreshToken` datetime(6) DEFAULT NULL,
  `LastLogin` datetime(6) DEFAULT NULL,
  `IpAddress` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `AvatarId` char(36) CHARACTER SET ascii COLLATE ascii_general_ci DEFAULT NULL,
  `IsActive` tinyint(1) NOT NULL,
  `IsVerified` tinyint(1) NOT NULL,
  `RoleId` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) DEFAULT NULL,
  `IsDeleted` tinyint(1) NOT NULL,
  `DeletedAt` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  KEY `IX_Accounts_RoleId` (`RoleId`),
  CONSTRAINT `FK_Accounts_Roles_RoleId` FOREIGN KEY (`RoleId`) REFERENCES `Roles` (`Id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table cryofertdb.Accounts: ~10 rows (approximately)
INSERT INTO `Accounts` (`Id`, `FirstName`, `LastName`, `BirthDate`, `Gender`, `Phone`, `Address`, `Username`, `Email`, `PasswordHash`, `RefreshToken`, `ExpiredRefreshToken`, `LastLogin`, `IpAddress`, `AvatarId`, `IsActive`, `IsVerified`, `RoleId`, `CreatedAt`, `UpdatedAt`, `IsDeleted`, `DeletedAt`) VALUES
	('00000000-0000-0000-0000-000000010001', 'System', 'Admin', NULL, NULL, '+84900000001', NULL, 'admin', 'admin@cryo.com', '$2a$11$.JgDmowGQmD2u2cMhrPnZO4VExs1s7hQIPdTJKcPfPRxKnoFRUO6S', '9UChlkVvnqp6XbdP82IpT/myogqSA++9NB5HyUDN5qA=', NULL, NULL, NULL, NULL, 1, 1, '00000000-0000-0000-0000-000000000001', '2025-11-12 19:39:55.000000', NULL, 0, NULL),
	('00000000-0000-0000-0000-000000010002', 'Lab', 'Technician', NULL, NULL, '+84900000002', NULL, 'lab', 'lab@cryo.com', '$2a$11$.JgDmowGQmD2u2cMhrPnZO4VExs1s7hQIPdTJKcPfPRxKnoFRUO6S', NULL, NULL, NULL, NULL, NULL, 1, 1, '00000000-0000-0000-0000-000000000003', '2025-11-12 19:39:55.000000', NULL, 0, NULL),
	('00000000-0000-0000-0000-000000010003', 'Front', 'Receptionist', NULL, NULL, '+84900000003', NULL, 'receptionist', 'receptionist@cryo.com', '$2a$11$.JgDmowGQmD2u2cMhrPnZO4VExs1s7hQIPdTJKcPfPRxKnoFRUO6S', NULL, NULL, NULL, NULL, NULL, 1, 1, '00000000-0000-0000-0000-000000000004', '2025-11-12 19:39:55.000000', NULL, 0, NULL),
	('00000000-0000-0000-0000-000000010004', 'Nguyen', 'Van A', '1980-05-15 00:00:00.000000', 1, '+84900000004', NULL, 'doctor1', 'doctor1@cryo.com', '$2a$11$.JgDmowGQmD2u2cMhrPnZO4VExs1s7hQIPdTJKcPfPRxKnoFRUO6S', 'LMlm7Bet2jAQwjqDTPX4QBL8/O5k9//jQsbu3AJhVAw=', NULL, NULL, NULL, NULL, 1, 1, '00000000-0000-0000-0000-000000000002', '2025-11-12 19:39:55.000000', NULL, 0, NULL),
	('00000000-0000-0000-0000-000000010005', 'Tran', 'Thi B', '1985-08-20 00:00:00.000000', 0, '+84900000005', NULL, 'doctor2', 'doctor2@cryo.com', '$2a$11$.JgDmowGQmD2u2cMhrPnZO4VExs1s7hQIPdTJKcPfPRxKnoFRUO6S', NULL, NULL, NULL, NULL, NULL, 1, 1, '00000000-0000-0000-0000-000000000002', '2025-11-12 19:39:55.000000', NULL, 0, NULL),
	('00000000-0000-0000-0000-000000010006', 'Le', 'Van C', '1990-03-10 00:00:00.000000', 1, '+84900000006', NULL, 'patient1', 'patient1@cryo.com', '$2a$11$.JgDmowGQmD2u2cMhrPnZO4VExs1s7hQIPdTJKcPfPRxKnoFRUO6S', '73xn3xuo8mQDBbJ8XLB7O2gBSatWKfn3kiEK/IU7CPI=', NULL, NULL, NULL, NULL, 1, 1, '00000000-0000-0000-0000-000000000005', '2025-11-12 19:39:55.000000', NULL, 0, NULL),
	('00000000-0000-0000-0000-000000010007', 'Pham', 'Thi D', '1992-07-25 00:00:00.000000', 0, '+84900000007', NULL, 'patient2', 'patient2@cryo.com', '$2a$11$.JgDmowGQmD2u2cMhrPnZO4VExs1s7hQIPdTJKcPfPRxKnoFRUO6S', NULL, NULL, NULL, NULL, NULL, 1, 1, '00000000-0000-0000-0000-000000000005', '2025-11-12 19:39:55.000000', NULL, 0, NULL),
	('00000000-0000-0000-0000-000000010008', 'Hoang', 'Van E', '1988-11-05 00:00:00.000000', 1, '+84900000008', NULL, 'patient3', 'patient3@cryo.com', '$2a$11$.JgDmowGQmD2u2cMhrPnZO4VExs1s7hQIPdTJKcPfPRxKnoFRUO6S', NULL, NULL, NULL, NULL, NULL, 1, 1, '00000000-0000-0000-0000-000000000005', '2025-11-12 19:39:55.000000', NULL, 0, NULL),
	('08de21eb-11c6-4c8c-8087-3bcd942fff8f', '', '', NULL, NULL, '', NULL, '', 'bakace4847@gusronk.com', '$2a$11$.vHX1FUULz7R0ghjI9v3Eufio7dvgnqe.yLICHfVvluHkeOhFHwmm', 'UTjwORqvg24f5+aDde/gQEjwI7NL/YtkOJjsagH/Uzc=', NULL, NULL, NULL, NULL, 1, 1, '00000000-0000-0000-0000-000000000005', '2025-11-12 19:57:42.981754', NULL, 0, NULL),
	('08de226d-96e8-4557-8909-d743f0409ff2', '', '', NULL, NULL, '', NULL, '', 'kigibok869@gyknife.com', '$2a$11$dDLu.FKoIVqypMJ48G3BeOyhLV1/ed7b3jmndRoQtSMuAMEbZTRsK', 'aIZSZnz7hq1eJsanQWMNo96cONC+ynM6tyg/lxPx1aY=', NULL, NULL, NULL, NULL, 1, 1, '00000000-0000-0000-0000-000000000005', '2025-11-13 11:32:00.937010', NULL, 0, NULL);

-- Dumping structure for table cryofertdb.Agreements
CREATE TABLE IF NOT EXISTS `Agreements` (
  `Id` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  `AgreementCode` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `TreatmentId` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  `PatientId` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  `StartDate` datetime(6) NOT NULL,
  `EndDate` datetime(6) DEFAULT NULL,
  `TotalAmount` decimal(65,30) NOT NULL,
  `Status` int NOT NULL,
  `SignedByPatient` tinyint(1) NOT NULL,
  `SignedByDoctor` tinyint(1) NOT NULL,
  `FileUrl` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) DEFAULT NULL,
  `IsDeleted` tinyint(1) NOT NULL,
  `DeletedAt` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  KEY `IX_Agreements_PatientId` (`PatientId`),
  KEY `IX_Agreements_TreatmentId` (`TreatmentId`),
  CONSTRAINT `FK_Agreements_Patients_PatientId` FOREIGN KEY (`PatientId`) REFERENCES `Patients` (`Id`) ON DELETE CASCADE,
  CONSTRAINT `FK_Agreements_Treatments_TreatmentId` FOREIGN KEY (`TreatmentId`) REFERENCES `Treatments` (`Id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table cryofertdb.Agreements: ~0 rows (approximately)

-- Dumping structure for table cryofertdb.AppointmentDoctors
CREATE TABLE IF NOT EXISTS `AppointmentDoctors` (
  `Id` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  `AppointmentId` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  `DoctorId` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  `Role` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Notes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) DEFAULT NULL,
  `IsDeleted` tinyint(1) NOT NULL,
  `DeletedAt` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  UNIQUE KEY `IX_AppointmentDoctors_AppointmentId_DoctorId` (`AppointmentId`,`DoctorId`),
  KEY `IX_AppointmentDoctors_DoctorId` (`DoctorId`),
  CONSTRAINT `FK_AppointmentDoctors_Appointments_AppointmentId` FOREIGN KEY (`AppointmentId`) REFERENCES `Appointments` (`Id`) ON DELETE CASCADE,
  CONSTRAINT `FK_AppointmentDoctors_Doctors_DoctorId` FOREIGN KEY (`DoctorId`) REFERENCES `Doctors` (`Id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table cryofertdb.AppointmentDoctors: ~0 rows (approximately)

-- Dumping structure for table cryofertdb.Appointments
CREATE TABLE IF NOT EXISTS `Appointments` (
  `Id` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  `TreatmentCycleId` char(36) CHARACTER SET ascii COLLATE ascii_general_ci DEFAULT NULL,
  `SlotId` char(36) CHARACTER SET ascii COLLATE ascii_general_ci DEFAULT NULL,
  `Type` int NOT NULL,
  `Status` int NOT NULL,
  `AppointmentDate` datetime(6) NOT NULL,
  `Reason` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Instructions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Notes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `CheckInTime` datetime(6) DEFAULT NULL,
  `CheckOutTime` datetime(6) DEFAULT NULL,
  `IsReminderSent` tinyint(1) NOT NULL,
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) DEFAULT NULL,
  `IsDeleted` tinyint(1) NOT NULL,
  `DeletedAt` datetime(6) DEFAULT NULL,
  `PatientId` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  PRIMARY KEY (`Id`),
  UNIQUE KEY `IX_Appointments_SlotId` (`SlotId`),
  KEY `IX_Appointments_TreatmentCycleId` (`TreatmentCycleId`),
  KEY `IX_Appointments_PatientId` (`PatientId`),
  CONSTRAINT `FK_Appointments_Patients_PatientId` FOREIGN KEY (`PatientId`) REFERENCES `Patients` (`Id`) ON DELETE CASCADE,
  CONSTRAINT `FK_Appointments_Slots_SlotId` FOREIGN KEY (`SlotId`) REFERENCES `Slots` (`Id`) ON DELETE SET NULL,
  CONSTRAINT `FK_Appointments_TreatmentCycles_TreatmentCycleId` FOREIGN KEY (`TreatmentCycleId`) REFERENCES `TreatmentCycles` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table cryofertdb.Appointments: ~0 rows (approximately)

-- Dumping structure for table cryofertdb.CPSDetails
CREATE TABLE IF NOT EXISTS `CPSDetails` (
  `Id` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  `CryoStorageContractId` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  `LabSampleId` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  `StorageStartDate` datetime(6) NOT NULL,
  `StorageEndDate` datetime(6) DEFAULT NULL,
  `Status` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `MonthlyFee` decimal(65,30) DEFAULT NULL,
  `Notes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) DEFAULT NULL,
  `IsDeleted` tinyint(1) NOT NULL,
  `DeletedAt` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  KEY `IX_CPSDetails_CryoStorageContractId` (`CryoStorageContractId`),
  KEY `IX_CPSDetails_LabSampleId` (`LabSampleId`),
  CONSTRAINT `FK_CPSDetails_CryoStorageContracts_CryoStorageContractId` FOREIGN KEY (`CryoStorageContractId`) REFERENCES `CryoStorageContracts` (`Id`) ON DELETE CASCADE,
  CONSTRAINT `FK_CPSDetails_LabSamples_LabSampleId` FOREIGN KEY (`LabSampleId`) REFERENCES `LabSamples` (`Id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table cryofertdb.CPSDetails: ~0 rows (approximately)

-- Dumping structure for table cryofertdb.CryoExports
CREATE TABLE IF NOT EXISTS `CryoExports` (
  `Id` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  `LabSampleId` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  `CryoLocationId` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  `ExportDate` datetime(6) NOT NULL,
  `ExportedBy` char(36) CHARACTER SET ascii COLLATE ascii_general_ci DEFAULT NULL,
  `WitnessedBy` char(36) CHARACTER SET ascii COLLATE ascii_general_ci DEFAULT NULL,
  `Reason` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Destination` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Notes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `IsThawed` tinyint(1) NOT NULL,
  `ThawingDate` datetime(6) DEFAULT NULL,
  `ThawingResult` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) DEFAULT NULL,
  `IsDeleted` tinyint(1) NOT NULL,
  `DeletedAt` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  KEY `IX_CryoExports_CryoLocationId` (`CryoLocationId`),
  KEY `IX_CryoExports_LabSampleId` (`LabSampleId`),
  CONSTRAINT `FK_CryoExports_CryoLocations_CryoLocationId` FOREIGN KEY (`CryoLocationId`) REFERENCES `CryoLocations` (`Id`) ON DELETE RESTRICT,
  CONSTRAINT `FK_CryoExports_LabSamples_LabSampleId` FOREIGN KEY (`LabSampleId`) REFERENCES `LabSamples` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table cryofertdb.CryoExports: ~0 rows (approximately)

-- Dumping structure for table cryofertdb.CryoImports
CREATE TABLE IF NOT EXISTS `CryoImports` (
  `Id` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  `LabSampleId` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  `CryoLocationId` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  `ImportDate` datetime(6) NOT NULL,
  `ImportedBy` char(36) CHARACTER SET ascii COLLATE ascii_general_ci DEFAULT NULL,
  `WitnessedBy` char(36) CHARACTER SET ascii COLLATE ascii_general_ci DEFAULT NULL,
  `Temperature` decimal(65,30) DEFAULT NULL,
  `Reason` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Notes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) DEFAULT NULL,
  `IsDeleted` tinyint(1) NOT NULL,
  `DeletedAt` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  KEY `IX_CryoImports_CryoLocationId` (`CryoLocationId`),
  KEY `IX_CryoImports_LabSampleId` (`LabSampleId`),
  CONSTRAINT `FK_CryoImports_CryoLocations_CryoLocationId` FOREIGN KEY (`CryoLocationId`) REFERENCES `CryoLocations` (`Id`) ON DELETE RESTRICT,
  CONSTRAINT `FK_CryoImports_LabSamples_LabSampleId` FOREIGN KEY (`LabSampleId`) REFERENCES `LabSamples` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table cryofertdb.CryoImports: ~0 rows (approximately)

-- Dumping structure for table cryofertdb.CryoLocations
CREATE TABLE IF NOT EXISTS `CryoLocations` (
  `Id` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  `Name` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Type` int NOT NULL,
  `SampleType` int NOT NULL,
  `ParentId` char(36) CHARACTER SET ascii COLLATE ascii_general_ci DEFAULT NULL,
  `Capacity` int DEFAULT NULL,
  `IsActive` tinyint(1) NOT NULL,
  `Temperature` decimal(65,30) DEFAULT NULL,
  `Notes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) DEFAULT NULL,
  `IsDeleted` tinyint(1) NOT NULL,
  `DeletedAt` datetime(6) DEFAULT NULL,
  `Code` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `SampleCount` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`Id`),
  KEY `IX_CryoLocations_ParentId` (`ParentId`),
  CONSTRAINT `FK_CryoLocations_CryoLocations_ParentId` FOREIGN KEY (`ParentId`) REFERENCES `CryoLocations` (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table cryofertdb.CryoLocations: ~0 rows (approximately)

-- Dumping structure for table cryofertdb.CryoPackages
CREATE TABLE IF NOT EXISTS `CryoPackages` (
  `Id` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  `PackageName` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Description` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Price` decimal(65,30) NOT NULL,
  `DurationMonths` int NOT NULL,
  `MaxSamples` int NOT NULL,
  `SampleType` int NOT NULL,
  `IncludesInsurance` tinyint(1) NOT NULL,
  `InsuranceAmount` decimal(65,30) DEFAULT NULL,
  `IsActive` tinyint(1) NOT NULL,
  `Benefits` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Notes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) DEFAULT NULL,
  `IsDeleted` tinyint(1) NOT NULL,
  `DeletedAt` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table cryofertdb.CryoPackages: ~0 rows (approximately)

-- Dumping structure for table cryofertdb.CryoStorageContracts
CREATE TABLE IF NOT EXISTS `CryoStorageContracts` (
  `Id` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  `ContractNumber` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `StartDate` datetime(6) NOT NULL,
  `EndDate` datetime(6) NOT NULL,
  `Status` int NOT NULL,
  `TotalAmount` decimal(65,30) NOT NULL,
  `PaidAmount` decimal(65,30) DEFAULT NULL,
  `IsAutoRenew` tinyint(1) NOT NULL,
  `SignedDate` datetime(6) DEFAULT NULL,
  `SignedBy` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Notes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `PatientId` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  `CryoPackageId` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) DEFAULT NULL,
  `IsDeleted` tinyint(1) NOT NULL,
  `DeletedAt` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  KEY `IX_CryoStorageContracts_CryoPackageId` (`CryoPackageId`),
  KEY `IX_CryoStorageContracts_PatientId` (`PatientId`),
  CONSTRAINT `FK_CryoStorageContracts_CryoPackages_CryoPackageId` FOREIGN KEY (`CryoPackageId`) REFERENCES `CryoPackages` (`Id`) ON DELETE RESTRICT,
  CONSTRAINT `FK_CryoStorageContracts_Patients_PatientId` FOREIGN KEY (`PatientId`) REFERENCES `Patients` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table cryofertdb.CryoStorageContracts: ~0 rows (approximately)

-- Dumping structure for table cryofertdb.Doctors
CREATE TABLE IF NOT EXISTS `Doctors` (
  `Id` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  `BadgeId` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Specialty` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Certificates` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `LicenseNumber` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `YearsOfExperience` int NOT NULL,
  `IsActive` tinyint(1) NOT NULL,
  `Biography` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `JoinDate` datetime(6) NOT NULL,
  `LeaveDate` datetime(6) DEFAULT NULL,
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) DEFAULT NULL,
  `IsDeleted` tinyint(1) NOT NULL,
  `DeletedAt` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  CONSTRAINT `FK_Doctors_Accounts_Id` FOREIGN KEY (`Id`) REFERENCES `Accounts` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table cryofertdb.Doctors: ~2 rows (approximately)
INSERT INTO `Doctors` (`Id`, `BadgeId`, `Specialty`, `Certificates`, `LicenseNumber`, `YearsOfExperience`, `IsActive`, `Biography`, `JoinDate`, `LeaveDate`, `CreatedAt`, `UpdatedAt`, `IsDeleted`, `DeletedAt`) VALUES
	('00000000-0000-0000-0000-000000010004', 'DOC001', 'Reproductive Endocrinology', 'Board Certified in Reproductive Medicine', 'LIC-DOC-001', 15, 1, NULL, '2010-01-01 00:00:00.000000', NULL, '2025-11-12 19:39:55.000000', NULL, 0, NULL),
	('00000000-0000-0000-0000-000000010005', 'DOC002', 'Obstetrics and Gynecology', 'Specialist in IVF Procedures', 'LIC-DOC-002', 10, 1, NULL, '2015-06-01 00:00:00.000000', NULL, '2025-11-12 19:39:55.000000', NULL, 0, NULL);

-- Dumping structure for table cryofertdb.DoctorSchedules
CREATE TABLE IF NOT EXISTS `DoctorSchedules` (
  `Id` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  `DoctorId` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  `WorkDate` date NOT NULL,
  `IsAvailable` tinyint(1) NOT NULL,
  `Location` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Notes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) DEFAULT NULL,
  `IsDeleted` tinyint(1) NOT NULL,
  `DeletedAt` datetime(6) DEFAULT NULL,
  `SlotId` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  PRIMARY KEY (`Id`),
  KEY `IX_DoctorSchedules_DoctorId` (`DoctorId`),
  KEY `IX_DoctorSchedules_SlotId` (`SlotId`),
  CONSTRAINT `FK_DoctorSchedules_Doctors_DoctorId` FOREIGN KEY (`DoctorId`) REFERENCES `Doctors` (`Id`) ON DELETE CASCADE,
  CONSTRAINT `FK_DoctorSchedules_Slots_SlotId` FOREIGN KEY (`SlotId`) REFERENCES `Slots` (`Id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table cryofertdb.DoctorSchedules: ~0 rows (approximately)
INSERT INTO `DoctorSchedules` (`Id`, `DoctorId`, `WorkDate`, `IsAvailable`, `Location`, `Notes`, `CreatedAt`, `UpdatedAt`, `IsDeleted`, `DeletedAt`, `SlotId`) VALUES
	('0fc97dd2-e4a5-477b-9807-b3a763704ee4', '00000000-0000-0000-0000-000000010004', '2025-11-21', 1, 'Hồ Chí Minh', NULL, '2025-11-12 22:06:18.819203', NULL, 0, NULL, '00000000-0000-0000-0000-000000000001');

-- Dumping structure for table cryofertdb.LabSampleEmbryos
CREATE TABLE IF NOT EXISTS `LabSampleEmbryos` (
  `Id` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  `LabSampleId` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  `DayOfDevelopment` int NOT NULL,
  `Grade` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `CellCount` int DEFAULT NULL,
  `Morphology` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `IsBiopsied` tinyint(1) NOT NULL,
  `IsPGTTested` tinyint(1) NOT NULL,
  `PGTResult` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `FertilizationMethod` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Notes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) DEFAULT NULL,
  `IsDeleted` tinyint(1) NOT NULL,
  `DeletedAt` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  UNIQUE KEY `IX_LabSampleEmbryos_LabSampleId` (`LabSampleId`),
  CONSTRAINT `FK_LabSampleEmbryos_LabSamples_LabSampleId` FOREIGN KEY (`LabSampleId`) REFERENCES `LabSamples` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table cryofertdb.LabSampleEmbryos: ~0 rows (approximately)

-- Dumping structure for table cryofertdb.LabSampleOocytes
CREATE TABLE IF NOT EXISTS `LabSampleOocytes` (
  `Id` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  `LabSampleId` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  `MaturityStage` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Quality` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `IsMature` tinyint(1) NOT NULL,
  `RetrievalDate` datetime(6) DEFAULT NULL,
  `CumulusCells` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `CytoplasmAppearance` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `IsVitrified` tinyint(1) NOT NULL,
  `VitrificationDate` datetime(6) DEFAULT NULL,
  `Notes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) DEFAULT NULL,
  `IsDeleted` tinyint(1) NOT NULL,
  `DeletedAt` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  UNIQUE KEY `IX_LabSampleOocytes_LabSampleId` (`LabSampleId`),
  CONSTRAINT `FK_LabSampleOocytes_LabSamples_LabSampleId` FOREIGN KEY (`LabSampleId`) REFERENCES `LabSamples` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table cryofertdb.LabSampleOocytes: ~0 rows (approximately)

-- Dumping structure for table cryofertdb.LabSamples
CREATE TABLE IF NOT EXISTS `LabSamples` (
  `Id` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  `PatientId` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  `CryoLocationId` char(36) CHARACTER SET ascii COLLATE ascii_general_ci DEFAULT NULL,
  `SampleCode` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `SampleType` int NOT NULL,
  `Status` int NOT NULL,
  `CollectionDate` datetime(6) NOT NULL,
  `StorageDate` datetime(6) DEFAULT NULL,
  `ExpiryDate` datetime(6) DEFAULT NULL,
  `Quality` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Notes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `IsAvailable` tinyint(1) NOT NULL,
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) DEFAULT NULL,
  `IsDeleted` tinyint(1) NOT NULL,
  `DeletedAt` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  KEY `IX_LabSamples_CryoLocationId` (`CryoLocationId`),
  KEY `IX_LabSamples_PatientId` (`PatientId`),
  CONSTRAINT `FK_LabSamples_CryoLocations_CryoLocationId` FOREIGN KEY (`CryoLocationId`) REFERENCES `CryoLocations` (`Id`) ON DELETE SET NULL,
  CONSTRAINT `FK_LabSamples_Patients_PatientId` FOREIGN KEY (`PatientId`) REFERENCES `Patients` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table cryofertdb.LabSamples: ~0 rows (approximately)
INSERT INTO `LabSamples` (`Id`, `PatientId`, `CryoLocationId`, `SampleCode`, `SampleType`, `Status`, `CollectionDate`, `StorageDate`, `ExpiryDate`, `Quality`, `Notes`, `IsAvailable`, `CreatedAt`, `UpdatedAt`, `IsDeleted`, `DeletedAt`) VALUES
	('08de2282-59d2-4301-8af3-13d4b1f8f2e7', '00000000-0000-0000-0000-000000010006', NULL, 'SP-20251113070038', 2, 6, '0001-01-01 00:00:00.000000', NULL, NULL, NULL, 'N', 1, '2025-11-13 07:00:38.075186', NULL, 0, NULL);

-- Dumping structure for table cryofertdb.LabSampleSperms
CREATE TABLE IF NOT EXISTS `LabSampleSperms` (
  `Id` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  `LabSampleId` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  `Volume` decimal(65,30) DEFAULT NULL,
  `Concentration` decimal(65,30) DEFAULT NULL,
  `Motility` decimal(65,30) DEFAULT NULL,
  `ProgressiveMotility` decimal(65,30) DEFAULT NULL,
  `Morphology` decimal(65,30) DEFAULT NULL,
  `PH` decimal(65,30) DEFAULT NULL,
  `Viscosity` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Liquefaction` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Color` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `TotalSpermCount` int DEFAULT NULL,
  `Notes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) DEFAULT NULL,
  `IsDeleted` tinyint(1) NOT NULL,
  `DeletedAt` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  UNIQUE KEY `IX_LabSampleSperms_LabSampleId` (`LabSampleId`),
  CONSTRAINT `FK_LabSampleSperms_LabSamples_LabSampleId` FOREIGN KEY (`LabSampleId`) REFERENCES `LabSamples` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table cryofertdb.LabSampleSperms: ~0 rows (approximately)
INSERT INTO `LabSampleSperms` (`Id`, `LabSampleId`, `Volume`, `Concentration`, `Motility`, `ProgressiveMotility`, `Morphology`, `PH`, `Viscosity`, `Liquefaction`, `Color`, `TotalSpermCount`, `Notes`, `CreatedAt`, `UpdatedAt`, `IsDeleted`, `DeletedAt`) VALUES
	('08de2282-59d9-4d3f-8b69-f7e58520c1e6', '08de2282-59d2-4301-8af3-13d4b1f8f2e7', 9.000000000000000000000000000000, 10.000000000000000000000000000000, 10.000000000000000000000000000000, 10.000000000000000000000000000000, 10.000000000000000000000000000000, 8.000000000000000000000000000000, 'V', 'L', 'White', 10000, 'N', '2025-11-13 14:00:38.093406', NULL, 0, NULL);

-- Dumping structure for table cryofertdb.Medias
CREATE TABLE IF NOT EXISTS `Medias` (
  `Id` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  `FileName` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `OriginalFileName` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `FilePath` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `FileType` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `FileSize` bigint NOT NULL,
  `FileExtension` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `MimeType` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `RelatedEntityId` char(36) CHARACTER SET ascii COLLATE ascii_general_ci DEFAULT NULL,
  `RelatedEntityType` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Title` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Description` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Category` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Tags` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `UploadDate` datetime(6) DEFAULT NULL,
  `UploadedBy` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `UploadedByUserId` char(36) CHARACTER SET ascii COLLATE ascii_general_ci DEFAULT NULL,
  `IsPublic` tinyint(1) NOT NULL,
  `ThumbnailPath` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `StorageLocation` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `CloudUrl` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Notes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) DEFAULT NULL,
  `IsDeleted` tinyint(1) NOT NULL,
  `DeletedAt` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table cryofertdb.Medias: ~0 rows (approximately)

-- Dumping structure for table cryofertdb.MedicalRecords
CREATE TABLE IF NOT EXISTS `MedicalRecords` (
  `Id` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  `AppointmentId` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  `ChiefComplaint` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `History` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `PhysicalExamination` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Diagnosis` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `TreatmentPlan` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `FollowUpInstructions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `VitalSigns` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `LabResults` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `ImagingResults` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Notes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) DEFAULT NULL,
  `IsDeleted` tinyint(1) NOT NULL,
  `DeletedAt` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  UNIQUE KEY `IX_MedicalRecords_AppointmentId` (`AppointmentId`),
  CONSTRAINT `FK_MedicalRecords_Appointments_AppointmentId` FOREIGN KEY (`AppointmentId`) REFERENCES `Appointments` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table cryofertdb.MedicalRecords: ~0 rows (approximately)

-- Dumping structure for table cryofertdb.Medicines
CREATE TABLE IF NOT EXISTS `Medicines` (
  `Id` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  `Name` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `GenericName` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Dosage` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Form` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Indication` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Contraindication` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `SideEffects` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `IsActive` tinyint(1) NOT NULL,
  `Notes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) DEFAULT NULL,
  `IsDeleted` tinyint(1) NOT NULL,
  `DeletedAt` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table cryofertdb.Medicines: ~6 rows (approximately)
INSERT INTO `Medicines` (`Id`, `Name`, `GenericName`, `Dosage`, `Form`, `Indication`, `Contraindication`, `SideEffects`, `IsActive`, `Notes`, `CreatedAt`, `UpdatedAt`, `IsDeleted`, `DeletedAt`) VALUES
	('40000000-0000-0000-0000-000000000001', 'Follitropin alfa', 'Recombinant FSH', '300 IU', 'Injection', 'Ovarian stimulation', NULL, 'Headache, abdominal pain', 1, 'Pen device', '2025-11-12 19:39:55.000000', NULL, 0, NULL),
	('40000000-0000-0000-0000-000000000002', 'Chorionic gonadotropin (hCG)', 'hCG', '5,000 IU', 'Injection', 'Ovulation trigger', NULL, 'Injection site pain', 1, 'Store refrigerated', '2025-11-12 19:39:55.000000', NULL, 0, NULL),
	('40000000-0000-0000-0000-000000000003', 'Progesterone', 'Progesterone', '200 mg', 'Capsule', 'Luteal phase support', NULL, 'Drowsiness', 1, 'Taken at bedtime', '2025-11-12 19:39:55.000000', NULL, 0, NULL),
	('40000000-0000-0000-0000-000000000004', 'Letrozole', 'Letrozole', '2.5 mg', 'Tablet', 'Ovulation induction', NULL, 'Fatigue, dizziness', 1, NULL, '2025-11-12 19:39:55.000000', NULL, 0, NULL),
	('40000000-0000-0000-0000-000000000005', 'Doxycycline', 'Doxycycline hyclate', '100 mg', 'Tablet', 'Infection prophylaxis', 'Pregnancy', NULL, 1, NULL, '2025-11-12 19:39:55.000000', NULL, 0, NULL),
	('40000000-0000-0000-0000-000000000006', 'Estradiol valerate', 'Estradiol', '2 mg', 'Tablet', 'Endometrial preparation', NULL, NULL, 1, NULL, '2025-11-12 19:39:55.000000', NULL, 0, NULL);

-- Dumping structure for table cryofertdb.Patients
CREATE TABLE IF NOT EXISTS `Patients` (
  `Id` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  `PatientCode` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `NationalID` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `EmergencyContact` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `EmergencyPhone` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Insurance` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Occupation` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `MedicalHistory` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Allergies` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `BloodType` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Height` decimal(65,30) DEFAULT NULL,
  `Weight` decimal(65,30) DEFAULT NULL,
  `IsActive` tinyint(1) NOT NULL,
  `Notes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) DEFAULT NULL,
  `IsDeleted` tinyint(1) NOT NULL,
  `DeletedAt` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  CONSTRAINT `FK_Patients_Accounts_Id` FOREIGN KEY (`Id`) REFERENCES `Accounts` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table cryofertdb.Patients: ~3 rows (approximately)
INSERT INTO `Patients` (`Id`, `PatientCode`, `NationalID`, `EmergencyContact`, `EmergencyPhone`, `Insurance`, `Occupation`, `MedicalHistory`, `Allergies`, `BloodType`, `Height`, `Weight`, `IsActive`, `Notes`, `CreatedAt`, `UpdatedAt`, `IsDeleted`, `DeletedAt`) VALUES
	('00000000-0000-0000-0000-000000010006', 'PAT001', '001234567890', 'Le Van F', '+84900000009', NULL, NULL, NULL, NULL, 'A+', NULL, NULL, 1, NULL, '2025-11-12 19:39:55.000000', NULL, 0, NULL),
	('00000000-0000-0000-0000-000000010007', 'PAT002', '001234567891', 'Pham Thi G', '+84900000010', NULL, NULL, NULL, NULL, 'B+', NULL, NULL, 1, NULL, '2025-11-12 19:39:55.000000', NULL, 0, NULL),
	('00000000-0000-0000-0000-000000010008', 'PAT003', '001234567892', 'Hoang Van H', '+84900000011', NULL, NULL, NULL, NULL, 'O+', NULL, NULL, 1, NULL, '2025-11-12 19:39:55.000000', NULL, 0, NULL);

-- Dumping structure for table cryofertdb.PrescriptionDetails
CREATE TABLE IF NOT EXISTS `PrescriptionDetails` (
  `Id` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  `PrescriptionId` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  `MedicineId` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  `Quantity` int NOT NULL,
  `Dosage` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Frequency` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `DurationDays` int NOT NULL,
  `Instructions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Notes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) DEFAULT NULL,
  `IsDeleted` tinyint(1) NOT NULL,
  `DeletedAt` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  KEY `IX_PrescriptionDetails_MedicineId` (`MedicineId`),
  KEY `IX_PrescriptionDetails_PrescriptionId` (`PrescriptionId`),
  CONSTRAINT `FK_PrescriptionDetails_Medicines_MedicineId` FOREIGN KEY (`MedicineId`) REFERENCES `Medicines` (`Id`) ON DELETE RESTRICT,
  CONSTRAINT `FK_PrescriptionDetails_Prescriptions_PrescriptionId` FOREIGN KEY (`PrescriptionId`) REFERENCES `Prescriptions` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table cryofertdb.PrescriptionDetails: ~0 rows (approximately)

-- Dumping structure for table cryofertdb.Prescriptions
CREATE TABLE IF NOT EXISTS `Prescriptions` (
  `Id` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  `MedicalRecordId` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  `PrescriptionDate` datetime(6) NOT NULL,
  `Diagnosis` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Instructions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Notes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `IsFilled` tinyint(1) NOT NULL,
  `FilledDate` datetime(6) DEFAULT NULL,
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) DEFAULT NULL,
  `IsDeleted` tinyint(1) NOT NULL,
  `DeletedAt` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  KEY `IX_Prescriptions_MedicalRecordId` (`MedicalRecordId`),
  CONSTRAINT `FK_Prescriptions_MedicalRecords_MedicalRecordId` FOREIGN KEY (`MedicalRecordId`) REFERENCES `MedicalRecords` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table cryofertdb.Prescriptions: ~0 rows (approximately)

-- Dumping structure for table cryofertdb.Relationships
CREATE TABLE IF NOT EXISTS `Relationships` (
  `Id` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  `Patient1Id` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  `Patient2Id` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  `RelationshipType` int NOT NULL,
  `EstablishedDate` datetime(6) DEFAULT NULL,
  `Notes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `IsActive` tinyint(1) NOT NULL,
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) DEFAULT NULL,
  `IsDeleted` tinyint(1) NOT NULL,
  `DeletedAt` datetime(6) DEFAULT NULL,
  `ExpiresAt` datetime(6) DEFAULT NULL,
  `RejectionReason` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `RequestedBy` char(36) CHARACTER SET ascii COLLATE ascii_general_ci DEFAULT NULL,
  `RespondedAt` datetime(6) DEFAULT NULL,
  `RespondedBy` char(36) CHARACTER SET ascii COLLATE ascii_general_ci DEFAULT NULL,
  `Status` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`Id`),
  KEY `IX_Relationships_Patient1Id` (`Patient1Id`),
  KEY `IX_Relationships_Patient2Id` (`Patient2Id`),
  CONSTRAINT `FK_Relationships_Patients_Patient1Id` FOREIGN KEY (`Patient1Id`) REFERENCES `Patients` (`Id`) ON DELETE RESTRICT,
  CONSTRAINT `FK_Relationships_Patients_Patient2Id` FOREIGN KEY (`Patient2Id`) REFERENCES `Patients` (`Id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table cryofertdb.Relationships: ~0 rows (approximately)

-- Dumping structure for table cryofertdb.Roles
CREATE TABLE IF NOT EXISTS `Roles` (
  `Id` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  `RoleName` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `RoleCode` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Description` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) DEFAULT NULL,
  `IsDeleted` tinyint(1) NOT NULL,
  `DeletedAt` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table cryofertdb.Roles: ~6 rows (approximately)
INSERT INTO `Roles` (`Id`, `RoleName`, `RoleCode`, `Description`, `CreatedAt`, `UpdatedAt`, `IsDeleted`, `DeletedAt`) VALUES
	('00000000-0000-0000-0000-000000000001', 'Admin', 'ADMIN', 'System administrator', '2025-11-12 19:39:55.000000', NULL, 0, NULL),
	('00000000-0000-0000-0000-000000000002', 'Doctor', 'DOCTOR', 'Medical doctor', '2025-11-12 19:39:55.000000', NULL, 0, NULL),
	('00000000-0000-0000-0000-000000000003', 'Laboratory Technician', 'LAB_TECH', 'Lab technician', '2025-11-12 19:39:55.000000', NULL, 0, NULL),
	('00000000-0000-0000-0000-000000000004', 'Receptionist', 'RECEPTIONIST', 'Front desk staff', '2025-11-12 19:39:55.000000', NULL, 0, NULL),
	('00000000-0000-0000-0000-000000000005', 'Patient', 'PATIENT', 'Patient user', '2025-11-12 19:39:55.000000', NULL, 0, NULL),
	('00000000-0000-0000-0000-000000000006', 'User', 'USER', 'General user', '2025-11-12 19:39:55.000000', NULL, 0, NULL);

-- Dumping structure for table cryofertdb.ServiceCategories
CREATE TABLE IF NOT EXISTS `ServiceCategories` (
  `Id` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  `Name` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Description` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Code` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `IsActive` tinyint(1) NOT NULL,
  `DisplayOrder` int NOT NULL,
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) DEFAULT NULL,
  `IsDeleted` tinyint(1) NOT NULL,
  `DeletedAt` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table cryofertdb.ServiceCategories: ~7 rows (approximately)
INSERT INTO `ServiceCategories` (`Id`, `Name`, `Description`, `Code`, `IsActive`, `DisplayOrder`, `CreatedAt`, `UpdatedAt`, `IsDeleted`, `DeletedAt`) VALUES
	('10000000-0000-0000-0000-000000000001', 'Consultation', 'Clinical consultations', 'CONS', 1, 1, '2025-11-12 19:39:55.000000', NULL, 0, NULL),
	('10000000-0000-0000-0000-000000000002', 'Diagnostics & Imaging', 'Diagnostic tests and imaging', 'DIAG', 1, 2, '2025-11-12 19:39:55.000000', NULL, 0, NULL),
	('10000000-0000-0000-0000-000000000003', 'Laboratory Procedures', 'Embryology and andrology procedures', 'LAB', 1, 3, '2025-11-12 19:39:55.000000', NULL, 0, NULL),
	('10000000-0000-0000-0000-000000000004', 'Cryostorage & Logistics', 'Cryopreservation and storage services', 'CRYO', 1, 4, '2025-11-12 19:39:55.000000', NULL, 0, NULL),
	('10000000-0000-0000-0000-000000000005', 'Treatment Procedures', 'IUI/IVF related procedures', 'TRMT', 1, 5, '2025-11-12 19:39:55.000000', NULL, 0, NULL),
	('10000000-0000-0000-0000-000000000006', 'Medications', 'Medications and injections', 'MED', 1, 6, '2025-11-12 19:39:55.000000', NULL, 0, NULL),
	('10000000-0000-0000-0000-000000000007', 'Administrative & Others', 'Administrative fees', 'ADMIN', 1, 7, '2025-11-12 19:39:55.000000', NULL, 0, NULL);

-- Dumping structure for table cryofertdb.ServiceRequestDetails
CREATE TABLE IF NOT EXISTS `ServiceRequestDetails` (
  `Id` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  `ServiceRequestId` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  `ServiceId` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  `Quantity` int NOT NULL,
  `UnitPrice` decimal(65,30) NOT NULL,
  `Discount` decimal(65,30) DEFAULT NULL,
  `TotalPrice` decimal(65,30) NOT NULL,
  `Notes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) DEFAULT NULL,
  `IsDeleted` tinyint(1) NOT NULL,
  `DeletedAt` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  KEY `IX_ServiceRequestDetails_ServiceId` (`ServiceId`),
  KEY `IX_ServiceRequestDetails_ServiceRequestId` (`ServiceRequestId`),
  CONSTRAINT `FK_ServiceRequestDetails_ServiceRequests_ServiceRequestId` FOREIGN KEY (`ServiceRequestId`) REFERENCES `ServiceRequests` (`Id`) ON DELETE CASCADE,
  CONSTRAINT `FK_ServiceRequestDetails_Services_ServiceId` FOREIGN KEY (`ServiceId`) REFERENCES `Services` (`Id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table cryofertdb.ServiceRequestDetails: ~0 rows (approximately)

-- Dumping structure for table cryofertdb.ServiceRequests
CREATE TABLE IF NOT EXISTS `ServiceRequests` (
  `Id` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  `AppointmentId` char(36) CHARACTER SET ascii COLLATE ascii_general_ci DEFAULT NULL,
  `RequestDate` datetime(6) NOT NULL,
  `Status` int NOT NULL,
  `TotalAmount` decimal(65,30) DEFAULT NULL,
  `Notes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `ApprovedDate` datetime(6) DEFAULT NULL,
  `ApprovedBy` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) DEFAULT NULL,
  `IsDeleted` tinyint(1) NOT NULL,
  `DeletedAt` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  KEY `IX_ServiceRequests_AppointmentId` (`AppointmentId`),
  CONSTRAINT `FK_ServiceRequests_Appointments_AppointmentId` FOREIGN KEY (`AppointmentId`) REFERENCES `Appointments` (`Id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table cryofertdb.ServiceRequests: ~0 rows (approximately)

-- Dumping structure for table cryofertdb.Services
CREATE TABLE IF NOT EXISTS `Services` (
  `Id` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  `Name` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Description` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Price` decimal(65,30) NOT NULL,
  `Code` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Unit` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Duration` int DEFAULT NULL,
  `IsActive` tinyint(1) NOT NULL,
  `Notes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `ServiceCategoryId` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) DEFAULT NULL,
  `IsDeleted` tinyint(1) NOT NULL,
  `DeletedAt` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  KEY `IX_Services_ServiceCategoryId` (`ServiceCategoryId`),
  CONSTRAINT `FK_Services_ServiceCategories_ServiceCategoryId` FOREIGN KEY (`ServiceCategoryId`) REFERENCES `ServiceCategories` (`Id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table cryofertdb.Services: ~22 rows (approximately)
INSERT INTO `Services` (`Id`, `Name`, `Description`, `Price`, `Code`, `Unit`, `Duration`, `IsActive`, `Notes`, `ServiceCategoryId`, `CreatedAt`, `UpdatedAt`, `IsDeleted`, `DeletedAt`) VALUES
	('20000000-0000-0000-0000-000000000001', 'Initial fertility consultation', 'First-time visit and clinical assessment', 120.000000000000000000000000000000, 'CONS-INIT', 'session', 30, 1, NULL, '10000000-0000-0000-0000-000000000001', '2025-11-12 19:39:55.000000', NULL, 0, NULL),
	('20000000-0000-0000-0000-000000000002', 'Follow-up consultation', 'Follow-up review and plan', 80.000000000000000000000000000000, 'CONS-FUP', 'session', 20, 1, NULL, '10000000-0000-0000-0000-000000000001', '2025-11-12 19:39:55.000000', NULL, 0, NULL),
	('20000000-0000-0000-0000-000000000010', 'Transvaginal ultrasound', NULL, 60.000000000000000000000000000000, 'US-TVS', 'scan', 15, 1, NULL, '10000000-0000-0000-0000-000000000002', '2025-11-12 19:39:55.000000', NULL, 0, NULL),
	('20000000-0000-0000-0000-000000000011', 'Baseline hormone panel (AMH/FSH/LH/E2/PRL)', NULL, 150.000000000000000000000000000000, 'LAB-HORM', 'panel', NULL, 1, NULL, '10000000-0000-0000-0000-000000000002', '2025-11-12 19:39:55.000000', NULL, 0, NULL),
	('20000000-0000-0000-0000-000000000012', 'Semen analysis', NULL, 40.000000000000000000000000000000, 'SA', 'test', NULL, 1, NULL, '10000000-0000-0000-0000-000000000002', '2025-11-12 19:39:55.000000', NULL, 0, NULL),
	('20000000-0000-0000-0000-000000000020', 'Oocyte retrieval (OPU)', NULL, 1500.000000000000000000000000000000, 'OPU', 'procedure', NULL, 1, NULL, '10000000-0000-0000-0000-000000000003', '2025-11-12 19:39:55.000000', NULL, 0, NULL),
	('20000000-0000-0000-0000-000000000021', 'Sperm preparation (IUI/IVF)', NULL, 90.000000000000000000000000000000, 'SP-PREP', 'prep', NULL, 1, NULL, '10000000-0000-0000-0000-000000000003', '2025-11-12 19:39:55.000000', NULL, 0, NULL),
	('20000000-0000-0000-0000-000000000022', 'Embryo culture (day 1-5)', NULL, 1500.000000000000000000000000000000, 'EMB-CULT', 'cycle', NULL, 1, NULL, '10000000-0000-0000-0000-000000000003', '2025-11-12 19:39:55.000000', NULL, 0, NULL),
	('20000000-0000-0000-0000-000000000023', 'ICSI', NULL, 1200.000000000000000000000000000000, 'ICSI', 'procedure', NULL, 1, NULL, '10000000-0000-0000-0000-000000000003', '2025-11-12 19:39:55.000000', NULL, 0, NULL),
	('20000000-0000-0000-0000-000000000024', 'Embryo transfer (ET)', NULL, 800.000000000000000000000000000000, 'ET', 'procedure', NULL, 1, NULL, '10000000-0000-0000-0000-000000000003', '2025-11-12 19:39:55.000000', NULL, 0, NULL),
	('20000000-0000-0000-0000-000000000030', 'Oocyte vitrification', NULL, 600.000000000000000000000000000000, 'VIT-OOC', 'procedure', NULL, 1, NULL, '10000000-0000-0000-0000-000000000004', '2025-11-12 19:39:55.000000', NULL, 0, NULL),
	('20000000-0000-0000-0000-000000000031', 'Sperm cryopreservation', NULL, 120.000000000000000000000000000000, 'CRYO-SP', 'procedure', NULL, 1, NULL, '10000000-0000-0000-0000-000000000004', '2025-11-12 19:39:55.000000', NULL, 0, NULL),
	('20000000-0000-0000-0000-000000000032', 'Embryo vitrification', NULL, 700.000000000000000000000000000000, 'VIT-EMB', 'procedure', NULL, 1, NULL, '10000000-0000-0000-0000-000000000004', '2025-11-12 19:39:55.000000', NULL, 0, NULL),
	('20000000-0000-0000-0000-000000000033', 'Annual storage fee (per specimen)', NULL, 150.000000000000000000000000000000, 'STORE-ANNUAL', 'year', NULL, 1, NULL, '10000000-0000-0000-0000-000000000004', '2025-11-12 19:39:55.000000', NULL, 0, NULL),
	('20000000-0000-0000-0000-000000000034', 'Specimen thawing', NULL, 200.000000000000000000000000000000, 'THAW', 'procedure', NULL, 1, NULL, '10000000-0000-0000-0000-000000000004', '2025-11-12 19:39:55.000000', NULL, 0, NULL),
	('20000000-0000-0000-0000-000000000040', 'Intrauterine insemination (IUI)', NULL, 250.000000000000000000000000000000, 'IUI', 'cycle', NULL, 1, NULL, '10000000-0000-0000-0000-000000000005', '2025-11-12 19:39:55.000000', NULL, 0, NULL),
	('20000000-0000-0000-0000-000000000041', 'In vitro fertilization (IVF) cycle', NULL, 12000.000000000000000000000000000000, 'IVF', 'cycle', NULL, 1, NULL, '10000000-0000-0000-0000-000000000005', '2025-11-12 19:39:55.000000', NULL, 0, NULL),
	('20000000-0000-0000-0000-000000000042', 'Frozen embryo transfer (FET)', NULL, 3500.000000000000000000000000000000, 'FET', 'cycle', NULL, 1, NULL, '10000000-0000-0000-0000-000000000005', '2025-11-12 19:39:55.000000', NULL, 0, NULL),
	('20000000-0000-0000-0000-000000000050', 'Gonadotropin stimulation (per pen)', NULL, 90.000000000000000000000000000000, 'GONA-PEN', 'pen', NULL, 1, NULL, '10000000-0000-0000-0000-000000000006', '2025-11-12 19:39:55.000000', NULL, 0, NULL),
	('20000000-0000-0000-0000-000000000051', 'Trigger injection (hCG)', NULL, 20.000000000000000000000000000000, 'HCG', 'dose', NULL, 1, NULL, '10000000-0000-0000-0000-000000000006', '2025-11-12 19:39:55.000000', NULL, 0, NULL),
	('20000000-0000-0000-0000-000000000060', 'Medical record creation fee', NULL, 10.000000000000000000000000000000, 'ADMIN-MR', 'case', NULL, 1, NULL, '10000000-0000-0000-0000-000000000007', '2025-11-12 19:39:55.000000', NULL, 0, NULL),
	('20000000-0000-0000-0000-000000000061', 'Certificate/Report issuance', NULL, 15.000000000000000000000000000000, 'ADMIN-CERT', 'doc', NULL, 1, NULL, '10000000-0000-0000-0000-000000000007', '2025-11-12 19:39:55.000000', NULL, 0, NULL);

-- Dumping structure for table cryofertdb.Slots
CREATE TABLE IF NOT EXISTS `Slots` (
  `Id` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  `StartTime` time(6) NOT NULL,
  `EndTime` time(6) NOT NULL,
  `Notes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) DEFAULT NULL,
  `IsDeleted` tinyint(1) NOT NULL,
  `DeletedAt` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table cryofertdb.Slots: ~4 rows (approximately)
INSERT INTO `Slots` (`Id`, `StartTime`, `EndTime`, `Notes`, `CreatedAt`, `UpdatedAt`, `IsDeleted`, `DeletedAt`) VALUES
	('00000000-0000-0000-0000-000000000001', '08:00:00.000000', '10:00:00.000000', 'Morning Slot 1', '2025-11-12 19:39:55.000000', NULL, 0, NULL),
	('00000000-0000-0000-0000-000000000002', '10:00:00.000000', '12:00:00.000000', 'Morning Slot 2', '2025-11-12 19:39:55.000000', NULL, 0, NULL),
	('00000000-0000-0000-0000-000000000003', '13:00:00.000000', '15:00:00.000000', 'Afternoon Slot 1', '2025-11-12 19:39:55.000000', NULL, 0, NULL),
	('00000000-0000-0000-0000-000000000004', '15:00:00.000000', '17:00:00.000000', 'Afternoon Slot 2', '2025-11-12 19:39:55.000000', NULL, 0, NULL);

-- Dumping structure for table cryofertdb.Transactions
CREATE TABLE IF NOT EXISTS `Transactions` (
  `Id` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  `TransactionCode` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `TransactionType` int NOT NULL,
  `Amount` decimal(65,30) NOT NULL,
  `Currency` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `TransactionDate` datetime(6) NOT NULL,
  `Status` int NOT NULL,
  `PaymentMethod` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `PaymentGateway` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `ReferenceNumber` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `RelatedEntityId` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  `RelatedEntityType` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `PatientId` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  `PatientName` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Description` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Notes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `CardNumber` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `CardType` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `BankName` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `ProcessedDate` datetime(6) DEFAULT NULL,
  `ProcessedBy` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) DEFAULT NULL,
  `IsDeleted` tinyint(1) NOT NULL,
  `DeletedAt` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table cryofertdb.Transactions: ~0 rows (approximately)

-- Dumping structure for table cryofertdb.TreatmentCycles
CREATE TABLE IF NOT EXISTS `TreatmentCycles` (
  `Id` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  `TreatmentId` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  `CycleName` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `CycleNumber` int NOT NULL,
  `StartDate` datetime(6) NOT NULL,
  `EndDate` datetime(6) DEFAULT NULL,
  `Status` int NOT NULL,
  `Protocol` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Notes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Cost` decimal(65,30) DEFAULT NULL,
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) DEFAULT NULL,
  `IsDeleted` tinyint(1) NOT NULL,
  `DeletedAt` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  KEY `IX_TreatmentCycles_TreatmentId` (`TreatmentId`),
  CONSTRAINT `FK_TreatmentCycles_Treatments_TreatmentId` FOREIGN KEY (`TreatmentId`) REFERENCES `Treatments` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table cryofertdb.TreatmentCycles: ~0 rows (approximately)

-- Dumping structure for table cryofertdb.TreatmentIUIs
CREATE TABLE IF NOT EXISTS `TreatmentIUIs` (
  `Id` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  `Protocol` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Medications` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Monitoring` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `OvulationTriggerDate` datetime(6) DEFAULT NULL,
  `InseminationDate` datetime(6) DEFAULT NULL,
  `MotileSpermCount` int DEFAULT NULL,
  `NumberOfAttempts` int DEFAULT NULL,
  `Outcome` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Notes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Status` int NOT NULL,
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) DEFAULT NULL,
  `IsDeleted` tinyint(1) NOT NULL,
  `DeletedAt` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  CONSTRAINT `FK_TreatmentIUIs_Treatments_Id` FOREIGN KEY (`Id`) REFERENCES `Treatments` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table cryofertdb.TreatmentIUIs: ~0 rows (approximately)

-- Dumping structure for table cryofertdb.TreatmentIVFs
CREATE TABLE IF NOT EXISTS `TreatmentIVFs` (
  `Id` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  `Protocol` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `StimulationStartDate` datetime(6) DEFAULT NULL,
  `OocyteRetrievalDate` datetime(6) DEFAULT NULL,
  `FertilizationDate` datetime(6) DEFAULT NULL,
  `TransferDate` datetime(6) DEFAULT NULL,
  `OocytesRetrieved` int DEFAULT NULL,
  `OocytesMature` int DEFAULT NULL,
  `OocytesFertilized` int DEFAULT NULL,
  `EmbryosCultured` int DEFAULT NULL,
  `EmbryosTransferred` int DEFAULT NULL,
  `EmbryosCryopreserved` int DEFAULT NULL,
  `EmbryosFrozen` int DEFAULT NULL,
  `Notes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Outcome` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `UsedICSI` tinyint(1) DEFAULT NULL,
  `Complications` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Status` int NOT NULL,
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) DEFAULT NULL,
  `IsDeleted` tinyint(1) NOT NULL,
  `DeletedAt` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  CONSTRAINT `FK_TreatmentIVFs_Treatments_Id` FOREIGN KEY (`Id`) REFERENCES `Treatments` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table cryofertdb.TreatmentIVFs: ~0 rows (approximately)

-- Dumping structure for table cryofertdb.Treatments
CREATE TABLE IF NOT EXISTS `Treatments` (
  `Id` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  `PatientId` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  `DoctorId` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  `TreatmentName` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `TreatmentType` int NOT NULL,
  `StartDate` datetime(6) NOT NULL,
  `EndDate` datetime(6) DEFAULT NULL,
  `Status` int NOT NULL,
  `Diagnosis` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Goals` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Notes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `EstimatedCost` decimal(65,30) DEFAULT NULL,
  `ActualCost` decimal(65,30) DEFAULT NULL,
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) DEFAULT NULL,
  `IsDeleted` tinyint(1) NOT NULL,
  `DeletedAt` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  KEY `IX_Treatments_DoctorId` (`DoctorId`),
  KEY `IX_Treatments_PatientId` (`PatientId`),
  CONSTRAINT `FK_Treatments_Doctors_DoctorId` FOREIGN KEY (`DoctorId`) REFERENCES `Doctors` (`Id`) ON DELETE RESTRICT,
  CONSTRAINT `FK_Treatments_Patients_PatientId` FOREIGN KEY (`PatientId`) REFERENCES `Patients` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table cryofertdb.Treatments: ~0 rows (approximately)

-- Dumping structure for table cryofertdb.__EFMigrationsHistory
CREATE TABLE IF NOT EXISTS `__EFMigrationsHistory` (
  `MigrationId` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `ProductVersion` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  PRIMARY KEY (`MigrationId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table cryofertdb.__EFMigrationsHistory: ~15 rows (approximately)
INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`) VALUES
	('20251028060403_InitialEntities', '8.0.12'),
	('20251028073914_SeedDataRole-Service', '8.0.12'),
	('20251028181537_SeedAccountsData', '8.0.12'),
	('20251029172847_UpdateSeedPasswordHash', '8.0.12'),
	('20251031055212_UpdateSeedAccount', '8.0.12'),
	('20251101172323_AddAppointmentDoctorRelation', '8.0.12'),
	('20251103034850_UpdateRelationshipProperty', '8.0.12'),
	('20251103172253_CreateAgreements', '8.0.12'),
	('20251105073304_UpdateCryoExportandImport', '8.0.12'),
	('20251105142319_UpdateScheduleRealtionship', '8.0.12'),
	('20251106043715_UpdateScheduleProperty', '8.0.12'),
	('20251106175324_Transaction', '8.0.12'),
	('20251107134234_UpdateTreatmentIUI', '8.0.12'),
	('20251107143844_MakeTreatmentCycleIdNullable', '8.0.12'),
	('20251107152546_UpdateAppointmentProperty', '8.0.12'),
	('20251107170533_SeedDataMedicine', '8.0.12'),
	('20251109081419_UpdateSlotProperty', '8.0.12'),
	('20251110161550_UpdateAppointmentType', '8.0.12'),
	('20251112123958_UpdateRelationShipSharePk', '8.0.12');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
