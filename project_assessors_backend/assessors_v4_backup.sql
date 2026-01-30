-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Dec 03, 2025 at 08:07 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `assessors_v4`
--

-- --------------------------------------------------------

--
-- Table structure for table `actualuse`
--

CREATE TABLE `actualuse` (
  `au_id` int(11) NOT NULL,
  `ry_id` int(11) NOT NULL,
  `pc_id` int(11) NOT NULL,
  `code` varchar(20) NOT NULL,
  `use_name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `taxable` tinyint(1) DEFAULT 1,
  `exempt_percentage` decimal(5,2) DEFAULT 0.00,
  `assessment_level` decimal(5,2) NOT NULL,
  `active` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `actualuse`
--

INSERT INTO `actualuse` (`au_id`, `ry_id`, `pc_id`, `code`, `use_name`, `description`, `taxable`, `exempt_percentage`, `assessment_level`, `active`) VALUES
(1, 1, 1, 'RES-DWELL', 'Residential Dwelling', NULL, 1, 0.00, 21.00, 1),
(2, 1, 2, 'COM-RETAIL', 'Commercial Retail', NULL, 0, 0.00, 50.00, 1),
(3, 1, 3, 'AGR-FARM', 'Agricultural Farm', NULL, 1, 0.00, 10.00, 1),
(4, 2, 1, 'RES-DWELL', 'Residential Dwelling', NULL, 1, 0.00, 25.00, 1),
(5, 2, 2, 'COM-RETAIL', 'Commercial Retail', NULL, 1, 0.00, 50.00, 1),
(6, 2, 3, 'AGR-FARM', 'Agricultural Farm', NULL, 1, 0.00, 10.00, 1);

-- --------------------------------------------------------

--
-- Stand-in structure for view `assessmentrollview`
-- (See below for the actual view)
--
CREATE TABLE `assessmentrollview` (
);

-- --------------------------------------------------------

--
-- Table structure for table `barangay`
--

CREATE TABLE `barangay` (
  `barangay_id` int(11) NOT NULL,
  `lg_id` int(11) NOT NULL,
  `barangay_name` varchar(150) NOT NULL,
  `short_name` varchar(50) DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` varchar(100) DEFAULT NULL,
  `created_date` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `barangay`
--

INSERT INTO `barangay` (`barangay_id`, `lg_id`, `barangay_name`, `short_name`, `status`, `created_by`, `created_date`) VALUES
(1, 1, 'Barangay 1', 'TEST 1', 1, NULL, '2025-10-23 01:47:24'),
(2, 1, 'Barangay 2', 'TEST 2', 1, NULL, '2025-10-23 01:47:39'),
(3, 1, 'Barangay 3', '1', 1, NULL, '2025-10-23 01:47:46'),
(4, 1, 'Barangay 4', 'Test', 1, NULL, '2025-10-23 01:47:56'),
(6, 2, 'Barangay 12', 'TEST 2', 1, NULL, '2025-10-23 01:48:25'),
(7, 3, 'Barangay 122', '', 1, NULL, '2025-10-23 01:48:29'),
(9, 1, 'Barangay 12', '', 1, NULL, '2025-10-27 06:26:10'),
(10, 2, 'Barangay 12', '', 0, NULL, '2025-10-27 06:26:15');

-- --------------------------------------------------------

--
-- Table structure for table `buildingactualuse`
--

CREATE TABLE `buildingactualuse` (
  `bau_id` int(11) NOT NULL,
  `ry_id` int(11) NOT NULL,
  `pc_id` int(11) NOT NULL,
  `use_name` varchar(255) NOT NULL,
  `use_code` varchar(15) NOT NULL,
  `assessment_level` decimal(5,2) NOT NULL,
  `taxable` tinyint(1) NOT NULL DEFAULT 1,
  `effective_date` date NOT NULL,
  `ordinance_no` varchar(50) DEFAULT NULL,
  `remarks` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `buildingactualuse`
--

INSERT INTO `buildingactualuse` (`bau_id`, `ry_id`, `pc_id`, `use_name`, `use_code`, `assessment_level`, `taxable`, `effective_date`, `ordinance_no`, `remarks`) VALUES
(1, 1, 1, 'Residential Dwelling', 'RES1', 20.00, 1, '2024-01-01', 'Ord-2024-01', 'Standard residential rate'),
(2, 1, 1, 'Apartment/Condominium', 'RES2', 25.00, 1, '2024-01-01', 'Ord-2024-01', 'Multi-dwelling structures'),
(3, 1, 2, 'Office Building', 'COM1', 40.00, 1, '2024-01-01', 'Ord-2024-02', 'General business use'),
(4, 1, 2, 'Shopping Mall', 'COM2', 50.00, 1, '2024-01-01', 'Ord-2024-02', 'Large-scale retail establishment'),
(5, 1, 3, 'Manufacturing Plant', 'IND1', 50.00, 1, '2024-01-01', 'Ord-2024-03', 'Heavy industrial use'),
(6, 1, 3, 'Warehouse', 'IND2', 40.00, 1, '2024-01-01', 'Ord-2024-03', 'Storage and logistics facilities');

-- --------------------------------------------------------

--
-- Table structure for table `buildingadditionalitems`
--

CREATE TABLE `buildingadditionalitems` (
  `bai_id` int(11) NOT NULL,
  `building_id` int(11) NOT NULL,
  `item_name` varchar(255) NOT NULL,
  `quantity` int(11) DEFAULT 1,
  `unit_cost` decimal(12,2) DEFAULT 0.00,
  `total_cost` decimal(12,2) GENERATED ALWAYS AS (`quantity` * `unit_cost`) STORED
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `buildingfloorareas`
--

CREATE TABLE `buildingfloorareas` (
  `bfa_id` int(11) NOT NULL,
  `building_id` int(11) NOT NULL,
  `floor_no` int(11) NOT NULL,
  `floor_area` decimal(12,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `buildingfloorareas`
--

INSERT INTO `buildingfloorareas` (`bfa_id`, `building_id`, `floor_no`, `floor_area`) VALUES
(19, 9, 1, 220.00),
(20, 9, 2, 130.00);

-- --------------------------------------------------------

--
-- Table structure for table `buildingkind`
--

CREATE TABLE `buildingkind` (
  `bk_id` int(11) NOT NULL,
  `pc_id` int(11) NOT NULL,
  `code` varchar(20) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `buildingkind`
--

INSERT INTO `buildingkind` (`bk_id`, `pc_id`, `code`, `name`, `description`) VALUES
(1, 1, 'RES', 'Residential Building', 'Single-detached or apartment-type house'),
(2, 2, 'COM', 'Commercial Building', 'Office, store, or mixed-use structure'),
(17, 1, 'RES-SF', 'Single Family', 'Detached house intended for a single family'),
(18, 1, 'RES-APT', 'Apartment/Duplex', 'Building containing multiple residential units'),
(19, 1, 'RES-CON', 'Condominium', 'Individual residential unit within a larger building'),
(20, 2, 'COM-OFF', 'Office Building', 'Building used primarily for business/office spaces'),
(21, 2, 'COM-RET', 'Retail/Mall', 'Shopping centers, malls, or standalone retail shops'),
(22, 2, 'COM-HTL', 'Hotel/Motel', 'Establishments providing lodging and accommodation'),
(23, 2, 'COM-BNK', 'Bank', 'Financial institution buildings'),
(24, 4, 'IND-FCT', 'Factory/Plant', 'Building used for manufacturing or assembly'),
(25, 4, 'IND-WHS', 'Warehouse', 'Building used for storage of goods'),
(26, 3, 'AGR-BRN', 'Barn/Poultry House', 'Structures for livestock or farming equipment storage'),
(27, 3, 'AGR-GRN', 'Granary', 'Structure for storing threshed grain'),
(28, 5, 'INS-SCH', 'School/University', 'Educational institution buildings'),
(29, 5, 'INS-HOS', 'Hospital/Clinic', 'Medical and healthcare facilities'),
(30, 5, 'INS-REL', 'Religious/Church', 'Places of worship');

-- --------------------------------------------------------

--
-- Table structure for table `buildingstructuralmaterials`
--

CREATE TABLE `buildingstructuralmaterials` (
  `bsm_id` int(11) NOT NULL,
  `building_id` int(11) NOT NULL,
  `part` enum('ROOF','FLOORING','WALLS_PARTITIONS') NOT NULL,
  `floor_no` int(11) DEFAULT NULL,
  `material` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `buildingstructuralmaterials`
--

INSERT INTO `buildingstructuralmaterials` (`bsm_id`, `building_id`, `part`, `floor_no`, `material`) VALUES
(11, 9, 'ROOF', 1, 'Wood'),
(12, 9, 'ROOF', 2, 'Wood');

-- --------------------------------------------------------

--
-- Table structure for table `faas`
--

CREATE TABLE `faas` (
  `faas_id` int(11) NOT NULL,
  `property_id` int(11) NOT NULL,
  `ry_id` int(11) NOT NULL,
  `faas_no` varchar(50) NOT NULL,
  `arp_no` varchar(50) DEFAULT NULL,
  `pin` varchar(50) DEFAULT NULL,
  `owner_name` varchar(255) NOT NULL,
  `owner_address` text NOT NULL,
  `lg_code` varchar(50) NOT NULL,
  `barangay` varchar(50) NOT NULL,
  `lot_no` varchar(50) NOT NULL,
  `block_no` varchar(50) NOT NULL,
  `faas_type` enum('ORIGINAL','REVISION','TRANSFER','CANCELLATION','IMPROVEMENT','SUBDIVISION','CONSOLIDATION') DEFAULT 'ORIGINAL',
  `effectivity_date` date NOT NULL,
  `previous_faas_id` int(11) DEFAULT NULL,
  `status` enum('ACTIVE','CANCELLED') DEFAULT 'ACTIVE',
  `taxable` tinyint(1) DEFAULT NULL,
  `property_kind` varchar(50) NOT NULL,
  `created_by` varchar(100) DEFAULT NULL,
  `created_date` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `faas`
--

INSERT INTO `faas` (`faas_id`, `property_id`, `ry_id`, `faas_no`, `arp_no`, `pin`, `owner_name`, `owner_address`, `lg_code`, `barangay`, `lot_no`, `block_no`, `faas_type`, `effectivity_date`, `previous_faas_id`, `status`, `taxable`, `property_kind`, `created_by`, `created_date`) VALUES
(138, 177, 1, 'FAAS-00138', 'ARP-1', 'PIN-1', 'Robert Conchas', 'Makati City', 'PRIME-01', 'Barangay 1', '13', '12', 'ORIGINAL', '2025-11-27', NULL, 'CANCELLED', 1, 'Land', NULL, '2025-11-27 07:00:07'),
(139, 180, 1, 'FAAS-00139', 'ARP-4', 'PIN-4', 'CHas', 'Makati', 'STD-01', 'Barangay 12', '21', '31', 'ORIGINAL', '2025-11-27', NULL, 'ACTIVE', 1, 'Land', NULL, '2025-11-27 07:37:36'),
(140, 177, 1, 'FAAS-00140', 'ARP-1', 'PIN-1', 'New Buyer', 'Address of new buyer', 'PRIME-01', 'Barangay 1', '13', '12', 'TRANSFER', '2025-11-27', 138, 'CANCELLED', 1, 'Land', NULL, '2025-11-27 07:38:59'),
(141, 181, 1, 'FAAS-00141', 'PIN-SUB-1', '101', 'New Buyer 1', 'Address of new buyer 1', 'APR-SUB-1', 'Lot 1', '123', 'PRIME-01', 'SUBDIVISION', '2025-11-27', 140, 'ACTIVE', NULL, 'Land', NULL, '2025-11-27 07:47:03'),
(142, 182, 1, 'FAAS-00142', 'PIN-SUB-2', '32', 'New Buyer 2', 'Address of new buyer 2 ', 'ARP-SUB-2', 'Lot 2', '412', 'PRIME-01', 'SUBDIVISION', '2025-11-27', 140, 'ACTIVE', NULL, 'Land', NULL, '2025-11-27 07:47:03'),
(143, 178, 1, 'FAAS-00143', 'ARP-2', 'PIN-2', 'Robert Conchas', 'Makati', 'STD-01', 'Barangay 12', '12', '41', 'ORIGINAL', '2025-11-27', NULL, 'CANCELLED', 1, 'Building', NULL, '2025-11-27 07:51:14'),
(144, 184, 1, 'FAAS-00144', 'APR-6', 'PIN-6', 'New', 'New', 'PRIME-01', 'Barangay 12', 'New', 'New', 'ORIGINAL', '2025-11-27', NULL, 'CANCELLED', 1, 'Land', NULL, '2025-11-27 07:57:46'),
(145, 184, 1, 'FAAS-00145', 'APR-6', 'PIN-6', 'New', 'New', 'PRIME-01', 'Barangay 12', 'New', 'New', 'REVISION', '2025-11-27', 144, 'ACTIVE', 1, 'Land', NULL, '2025-11-27 07:58:53'),
(146, 185, 1, 'FAAS-00146', 'APR-7', 'PIN-7', 'New', 'new', 'PRIME-01', 'Barangay 12', '123', '32', 'ORIGINAL', '2025-11-27', NULL, 'ACTIVE', 1, 'Land', NULL, '2025-11-27 08:02:14');

-- --------------------------------------------------------

--
-- Table structure for table `faasadjustments`
--

CREATE TABLE `faasadjustments` (
  `adjustment_id` int(11) NOT NULL,
  `faas_id` int(11) NOT NULL,
  `factor` varchar(50) DEFAULT NULL,
  `adjustment` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `faasadjustments`
--

INSERT INTO `faasadjustments` (`adjustment_id`, `faas_id`, `factor`, `adjustment`) VALUES
(75, 138, 'Shape', 2.00),
(76, 139, 'shape', 10.00),
(77, 140, 'Shape', 2.00),
(78, 146, 'Adjustment  1', 10.00),
(79, 146, 'Adjustment  2', 3.00);

-- --------------------------------------------------------

--
-- Table structure for table `faasappraisal`
--

CREATE TABLE `faasappraisal` (
  `appraisal_id` int(11) NOT NULL,
  `faas_id` int(11) NOT NULL,
  `classification` varchar(50) DEFAULT NULL,
  `subclassification` varchar(50) DEFAULT NULL,
  `area` decimal(10,2) DEFAULT NULL,
  `unit_value` decimal(10,2) DEFAULT NULL,
  `base_market_value` decimal(20,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `faasappraisal`
--

INSERT INTO `faasappraisal` (`appraisal_id`, `faas_id`, `classification`, `subclassification`, `area`, `unit_value`, `base_market_value`) VALUES
(95, 138, 'Residential (R)', 'Residential 1 (Subdivision) (R1)', 12000.00, 521.20, 6254400.00),
(96, 139, 'Commercial (C)', 'Commercial 2 (C2)', 12000.00, 5000.00, 60000000.00),
(97, 140, 'Residential (R)', 'Residential 1 (Subdivision) (R1)', 12000.00, 521.20, 6254400.00),
(98, 141, 'Residential (R)', 'Residential 1 (Subdivision) (R1)', 6000.00, 521.20, 3127200.00),
(99, 142, 'Residential (R)', 'Residential 1 (Subdivision) (R1)', 6000.00, 521.20, 3127200.00),
(100, 144, 'Commercial (C)', 'Commercial 1 (Retail) (C1)', 12000.00, 40000.00, 480000000.00),
(101, 145, 'Commercial (C)', 'Commercial 2 (C2)', 12000.00, 50001.00, 600012000.00),
(102, 146, 'Residential (R)', 'Residential 1 (Subdivision) (R1)', 2000.00, 521.20, 1042400.00);

-- --------------------------------------------------------

--
-- Table structure for table `faasassessment`
--

CREATE TABLE `faasassessment` (
  `assessment_id` int(11) NOT NULL,
  `faas_id` int(11) NOT NULL,
  `actual_use` varchar(50) DEFAULT NULL,
  `market_value` decimal(20,2) DEFAULT NULL,
  `assessment_level` decimal(10,2) DEFAULT NULL,
  `assessed_value` decimal(12,2) GENERATED ALWAYS AS (`market_value` * (`assessment_level` / 100)) STORED
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `faasassessment`
--

INSERT INTO `faasassessment` (`assessment_id`, `faas_id`, `actual_use`, `market_value`, `assessment_level`) VALUES
(92, 138, 'Residential Dwelling (RES-DWELL)', 6397488.00, 21.00),
(93, 139, 'Commercial Retail (COM-RETAIL)', 66003100.00, 50.00),
(94, 140, 'Residential Dwelling (RES-DWELL)', 6397488.00, 21.00),
(95, 141, 'Residential Dwelling (RES-DWELL)', 3127200.00, 21.00),
(96, 142, 'Residential Dwelling (RES-DWELL)', 3127200.00, 21.00),
(97, 144, 'Commercial Retail (COM-RETAIL)', 480000000.00, 50.00),
(98, 145, 'Commercial Retail (COM-RETAIL)', 600012000.00, 50.00),
(99, 146, 'Residential Dwelling (RES-DWELL)', 1177962.00, 21.00);

-- --------------------------------------------------------

--
-- Table structure for table `faasbldgadditionalitems`
--

CREATE TABLE `faasbldgadditionalitems` (
  `fbai_id` int(11) NOT NULL,
  `faas_id` int(11) NOT NULL,
  `item_name` varchar(255) NOT NULL,
  `quantity` int(11) DEFAULT 1,
  `unit_cost` decimal(12,2) DEFAULT 0.00,
  `total_cost` decimal(12,2) GENERATED ALWAYS AS (`quantity` * `unit_cost`) STORED
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `faasbldgappraisal`
--

CREATE TABLE `faasbldgappraisal` (
  `fba_id` int(11) NOT NULL,
  `faas_id` int(11) NOT NULL,
  `unit_cost` decimal(10,2) DEFAULT NULL,
  `base_market_value` decimal(10,2) DEFAULT NULL,
  `additional_total` decimal(10,2) DEFAULT NULL,
  `additional_market_value` decimal(10,2) DEFAULT NULL,
  `deprication_rate` decimal(5,2) DEFAULT NULL,
  `depreciation_cost` decimal(10,2) DEFAULT NULL,
  `final_market_value` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `faasbldgappraisal`
--

INSERT INTO `faasbldgappraisal` (`fba_id`, `faas_id`, `unit_cost`, `base_market_value`, `additional_total`, `additional_market_value`, `deprication_rate`, `depreciation_cost`, `final_market_value`) VALUES
(17, 143, 10000.00, 3500000.00, 0.00, 3500000.00, 0.00, 0.00, 3500000.00);

-- --------------------------------------------------------

--
-- Table structure for table `faasbldgassessment`
--

CREATE TABLE `faasbldgassessment` (
  `fba_id` int(11) NOT NULL,
  `faas_id` int(11) NOT NULL,
  `actual_use` varchar(50) DEFAULT NULL,
  `market_value` decimal(10,2) DEFAULT NULL,
  `assessment_level` decimal(4,2) DEFAULT NULL,
  `assessed_value` decimal(10,2) DEFAULT NULL,
  `taxable` int(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `faasbldgassessment`
--

INSERT INTO `faasbldgassessment` (`fba_id`, `faas_id`, `actual_use`, `market_value`, `assessment_level`, `assessed_value`, `taxable`) VALUES
(17, 143, 'Residential Dwelling (RES1)', 3500000.00, 20.00, 700000.00, 1);

-- --------------------------------------------------------

--
-- Table structure for table `faasbldgfloorsarea`
--

CREATE TABLE `faasbldgfloorsarea` (
  `fbf_id` int(11) NOT NULL,
  `faas_id` int(11) NOT NULL,
  `floor_no` int(11) NOT NULL,
  `floor_area` decimal(12,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `faasbldgfloorsarea`
--

INSERT INTO `faasbldgfloorsarea` (`fbf_id`, `faas_id`, `floor_no`, `floor_area`) VALUES
(33, 143, 1, 220.00),
(34, 143, 2, 130.00);

-- --------------------------------------------------------

--
-- Table structure for table `faasbldggeneral`
--

CREATE TABLE `faasbldggeneral` (
  `fbg_id` int(11) NOT NULL,
  `faas_id` int(11) NOT NULL,
  `buildingKind` varchar(50) DEFAULT NULL,
  `structuralType` varchar(50) DEFAULT NULL,
  `buildingAge` int(11) DEFAULT NULL,
  `storeys` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `faasbldggeneral`
--

INSERT INTO `faasbldggeneral` (`fbg_id`, `faas_id`, `buildingKind`, `structuralType`, `buildingAge`, `storeys`) VALUES
(17, 143, 'Residential Building (RES)', 'Reinforced Concrete (RC)', 2010, 2);

-- --------------------------------------------------------

--
-- Table structure for table `faasbldgstruturalmaterials`
--

CREATE TABLE `faasbldgstruturalmaterials` (
  `fbsm_id` int(11) NOT NULL,
  `faas_id` int(11) NOT NULL,
  `part` enum('ROOF','FLOORING','WALLS_PARTITIONS') NOT NULL,
  `floor_no` int(11) DEFAULT NULL,
  `material` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `faasbldgstruturalmaterials`
--

INSERT INTO `faasbldgstruturalmaterials` (`fbsm_id`, `faas_id`, `part`, `floor_no`, `material`) VALUES
(30, 143, 'ROOF', 1, 'Wood'),
(31, 143, 'ROOF', 2, 'Wood');

-- --------------------------------------------------------

--
-- Table structure for table `faasimprovements`
--

CREATE TABLE `faasimprovements` (
  `improvement_id` int(11) NOT NULL,
  `faas_id` int(11) NOT NULL,
  `improvement_name` varchar(100) DEFAULT NULL,
  `qty` int(11) DEFAULT NULL,
  `unit_value` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `faasimprovements`
--

INSERT INTO `faasimprovements` (`improvement_id`, `faas_id`, `improvement_name`, `qty`, `unit_value`) VALUES
(103, 138, 'Trees', 12, 1500.00),
(104, 139, 'Trees', 2, 1550.00),
(105, 140, 'Trees', 12, 1500.00),
(106, 146, 'Improvement 1', 1, 20.00),
(107, 146, 'Improvement 2', 1, 30.00);

-- --------------------------------------------------------

--
-- Table structure for table `faasmachineryappraisal`
--

CREATE TABLE `faasmachineryappraisal` (
  `fma_id` int(11) NOT NULL,
  `faas_id` int(11) NOT NULL,
  `machinery_type` varchar(100) DEFAULT NULL,
  `brand_model` varchar(100) DEFAULT NULL,
  `capacity_hp` varchar(100) DEFAULT NULL,
  `date_acquired` date DEFAULT NULL,
  `machinery_condition` varchar(50) DEFAULT NULL,
  `estimated_life` int(11) DEFAULT NULL,
  `remaining_life` int(11) DEFAULT NULL,
  `year_installed` int(11) DEFAULT NULL,
  `initial_operation` int(11) DEFAULT NULL,
  `original_cost` decimal(10,2) DEFAULT NULL,
  `conversion_factor` decimal(5,2) DEFAULT NULL,
  `rcn` decimal(10,2) DEFAULT NULL,
  `years_used` decimal(4,2) DEFAULT NULL,
  `depreciation_rate` decimal(4,2) DEFAULT NULL,
  `depreciation_value` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `faasmachineryassessment`
--

CREATE TABLE `faasmachineryassessment` (
  `fma_id` int(11) NOT NULL,
  `faas_id` int(11) NOT NULL,
  `actual_use` varchar(50) DEFAULT NULL,
  `market_value` decimal(10,2) DEFAULT NULL,
  `assessment_level` decimal(4,2) DEFAULT NULL,
  `assessed_value` decimal(10,2) DEFAULT NULL,
  `taxable` int(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `faas_transactionhistory`
--

CREATE TABLE `faas_transactionhistory` (
  `history_id` int(11) NOT NULL,
  `property_id` int(11) NOT NULL,
  `transaction_type` enum('ORIGINAL','REVISION','TRANSFER','CANCELLATION','DESTROYED','IMPROVEMENT','SUBDIVISION_RESULT','SUBDIVISION_SOURCE','CONSOLIDATION','CONSOLIDATION_SOURCE','CONSOLIDATION_RESULT','RECLASSIFY') CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `transfer_type` varchar(100) DEFAULT NULL,
  `changed_field` varchar(100) DEFAULT NULL,
  `old_value` text DEFAULT NULL,
  `new_value` text DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `created_by` varchar(100) DEFAULT NULL,
  `created_date` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `faas_transactionhistory`
--

INSERT INTO `faas_transactionhistory` (`history_id`, `property_id`, `transaction_type`, `transfer_type`, `changed_field`, `old_value`, `new_value`, `remarks`, `created_by`, `created_date`) VALUES
(100, 177, 'TRANSFER', 'SALE', 'OWNER', '{\"owner_name\":\"Robert Conchas\",\"owner_address\":\"Makati City\"}', '{\"owner_name\":\"New Buyer\",\"owner_address\":\"Address of new buyer\",\"tin\":\"\"}', '', NULL, '2025-11-27 07:38:59'),
(101, 177, 'TRANSFER', 'SALE', 'FAAS', '{\"faas_no\":\"FAAS-00138\"}', '{\"faas_no\":\"FAAS-00140\"}', '', NULL, '2025-11-27 07:38:59'),
(102, 181, 'SUBDIVISION_RESULT', NULL, 'PROPERTY_ID', '{\"origin_property_id\":177,\"origin_faas_id\":140}', '{\"current_faas_id\":141,\"lot_no\":\"Lot 1\",\"faas_no\":\"FAAS-00141\"}', NULL, NULL, '2025-11-27 07:47:03'),
(103, 182, 'SUBDIVISION_RESULT', NULL, 'PROPERTY_ID', '{\"origin_property_id\":177,\"origin_faas_id\":140}', '{\"current_faas_id\":142,\"lot_no\":\"Lot 2\",\"faas_no\":\"FAAS-00142\"}', NULL, NULL, '2025-11-27 07:47:03'),
(104, 177, 'SUBDIVISION_SOURCE', NULL, 'STATUS', '{\"status\":\"ACTIVE\"}', '{\"status\":\"SUBDIVIDED\",\"subdivided_into\":[{\"property_id\":181,\"land_id\":45,\"faas_id\":141,\"faas_no\":\"FAAS-00141\"},{\"property_id\":182,\"land_id\":46,\"faas_id\":142,\"faas_no\":\"FAAS-00142\"}]}', NULL, NULL, '2025-11-27 07:47:03'),
(105, 178, 'DESTROYED', NULL, 'STATUS', '{\"status\":\"ACTIVE\",\"property_status\":null}', '{\"status\":\"CANCELLED\",\"property_status\":\"DESTROYED\",\"reason\":\"LGU Order / Condemned\",\"destruction_date\":\"2025-11-27\"}', '', NULL, '2025-11-27 07:52:01'),
(106, 184, 'RECLASSIFY', NULL, 'CLASSIFICATION', '{\"classification\":\"Commercial (C)\",\"subclassification\":\"Commercial 1 (Retail) (C1)\",\"unit_value\":\"40000.00\",\"base_market_value\":\"480000000.00\"}', '{\"classification\":\"Commercial (C)\",\"subclassification\":\"Commercial 2 (C2)\",\"unit_value\":50001,\"base_market_value\":600012000}', '', NULL, '2025-11-27 07:58:53'),
(107, 184, 'RECLASSIFY', NULL, 'ASSESSMENT', '{\"actual_use\":\"Commercial Retail (COM-RETAIL)\",\"market_value\":\"480000000.00\",\"assessment_level\":\"50.00\"}', '{\"actual_use\":\"Commercial Retail (COM-RETAIL)\",\"market_value\":600012000,\"assessment_level\":50}', '', NULL, '2025-11-27 07:58:53');

-- --------------------------------------------------------

--
-- Table structure for table `landotherimprovements`
--

CREATE TABLE `landotherimprovements` (
  `improvement_id` int(11) NOT NULL,
  `land_id` int(11) NOT NULL,
  `improvement_name` varchar(100) NOT NULL,
  `quantity` int(11) DEFAULT 1,
  `unit_value` decimal(12,2) NOT NULL,
  `base_market_value` decimal(12,2) GENERATED ALWAYS AS (`quantity` * `unit_value`) STORED,
  `remarks` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `landotherimprovements`
--

INSERT INTO `landotherimprovements` (`improvement_id`, `land_id`, `improvement_name`, `quantity`, `unit_value`, `remarks`) VALUES
(35, 43, 'Trees', 12, 1500.00, NULL),
(36, 44, 'Trees', 2, 1550.00, NULL),
(37, 45, 'Trees', 12, 1500.00, NULL),
(38, 48, 'Improvement 1', 1, 20.00, NULL),
(39, 48, 'Improvement 2', 1, 30.00, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `locationalgroup`
--

CREATE TABLE `locationalgroup` (
  `lg_id` int(11) NOT NULL,
  `ry_id` int(11) NOT NULL,
  `code` varchar(20) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `zone_type` enum('PRIME','STANDARD','SUBURBAN','RURAL') DEFAULT 'STANDARD',
  `active` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `locationalgroup`
--

INSERT INTO `locationalgroup` (`lg_id`, `ry_id`, `code`, `name`, `description`, `zone_type`, `active`) VALUES
(1, 1, 'PRIME-01', 'Central Business District', NULL, 'PRIME', 1),
(2, 1, 'STD-01', 'City Proper', NULL, 'STANDARD', 1),
(3, 1, 'SUB-01', 'Outskirts', NULL, 'SUBURBAN', 1),
(4, 2, 'PRIME-01', 'Central Business District', NULL, 'PRIME', 1),
(5, 2, 'STD-01', 'City Proper', NULL, 'STANDARD', 1),
(6, 2, 'SUB-01', 'Outskirts', NULL, 'SUBURBAN', 1);

-- --------------------------------------------------------

--
-- Table structure for table `machineryactualuse`
--

CREATE TABLE `machineryactualuse` (
  `mau_id` int(11) NOT NULL,
  `ry_id` int(11) NOT NULL,
  `pc_id` int(11) NOT NULL,
  `use_name` varchar(255) NOT NULL,
  `use_code` varchar(15) NOT NULL,
  `assessment_level` decimal(5,2) NOT NULL,
  `taxable` tinyint(1) NOT NULL DEFAULT 1,
  `effective_date` date NOT NULL,
  `ordinance_no` varchar(50) DEFAULT NULL,
  `remarks` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `machineryactualuse`
--

INSERT INTO `machineryactualuse` (`mau_id`, `ry_id`, `pc_id`, `use_name`, `use_code`, `assessment_level`, `taxable`, `effective_date`, `ordinance_no`, `remarks`) VALUES
(1, 1, 3, 'TEST-1', 'T1', 25.00, 1, '0000-00-00', 'a', 'a'),
(2, 1, 3, 'TEST-2', 'T2', 30.00, 1, '2025-11-04', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `machineryassessmentlevel`
--

CREATE TABLE `machineryassessmentlevel` (
  `mal_id` int(11) NOT NULL,
  `ry_id` int(11) NOT NULL,
  `pc_id` int(11) NOT NULL,
  `assessment_level` decimal(5,2) NOT NULL,
  `effective_date` date NOT NULL,
  `ordinance_no` varchar(50) DEFAULT NULL,
  `remarks` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `machineryassessmentlevel`
--

INSERT INTO `machineryassessmentlevel` (`mal_id`, `ry_id`, `pc_id`, `assessment_level`, `effective_date`, `ordinance_no`, `remarks`) VALUES
(1, 1, 2, 50.00, '0000-00-00', NULL, NULL),
(2, 1, 3, 40.00, '0000-00-00', NULL, NULL),
(3, 1, 1, 20.00, '0000-00-00', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `machinerytype`
--

CREATE TABLE `machinerytype` (
  `mt_id` int(11) NOT NULL,
  `code` varchar(20) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `machinerytype`
--

INSERT INTO `machinerytype` (`mt_id`, `code`, `name`, `description`) VALUES
(1, 'GENSET', 'Generator Set', 'ads'),
(2, 'PUMP', 'Water Pump', NULL),
(9, 'PWR-GEN', 'Power Generation Set', 'Generator sets used for standby or primary power'),
(10, 'PWR-TRN', 'Transformer', 'Power distribution transformers'),
(11, 'TEL-TWR', 'Telecom Tower', 'Telecommunication antenna towers and masts'),
(12, 'TEL-EQP', 'Switching Equipment', 'Telecommunication switching and transmission equipment'),
(13, 'MFG-PRO', 'Production Line', 'General manufacturing or processing production lines'),
(14, 'MFG-PMP', 'Industrial Pump', 'Heavy duty water or chemical pumps'),
(15, 'COM-ATM', 'ATM Machine', 'Automated Teller Machines situated off-site or on-site'),
(16, 'COM-ELV', 'Elevator system', 'Passenger or freight elevators'),
(17, 'COM-ESC', 'Escalator', 'Moving stairways for commercial establishments'),
(18, 'COM-ACU', 'Centralized Aircon', 'Centralized air conditioning systems and cooling towers'),
(19, 'STO-TNK', 'Storage Tank', 'Large storage tanks for fuel, water, or chemicals'),
(20, 'AGR-MIL', 'Rice/Corn Mill', 'Milling machinery for agricultural products');

-- --------------------------------------------------------

--
-- Table structure for table `propertybuilding`
--

CREATE TABLE `propertybuilding` (
  `building_id` int(11) NOT NULL,
  `property_id` int(11) NOT NULL,
  `bk_id` int(11) NOT NULL,
  `st_id` int(11) NOT NULL,
  `bau_id` int(11) NOT NULL,
  `floor_area` decimal(12,2) NOT NULL DEFAULT 0.00,
  `no_of_storeys` int(11) DEFAULT 1,
  `year_constructed` year(4) DEFAULT NULL,
  `depreciation_rate` decimal(5,2) DEFAULT 0.00,
  `additional_adj_factor` decimal(6,4) DEFAULT 1.0000,
  `property_status` varchar(255) DEFAULT NULL,
  `remarks` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `propertybuilding`
--

INSERT INTO `propertybuilding` (`building_id`, `property_id`, `bk_id`, `st_id`, `bau_id`, `floor_area`, `no_of_storeys`, `year_constructed`, `depreciation_rate`, `additional_adj_factor`, `property_status`, `remarks`) VALUES
(9, 178, 1, 1, 1, 0.00, 2, '2010', 0.00, 1.0000, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `propertychangelog`
--

CREATE TABLE `propertychangelog` (
  `log_id` int(11) NOT NULL,
  `property_id` int(11) NOT NULL,
  `field_name` varchar(100) NOT NULL,
  `old_value` text DEFAULT NULL,
  `new_value` text DEFAULT NULL,
  `changed_at` datetime DEFAULT current_timestamp(),
  `changed_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `propertychanges`
--

CREATE TABLE `propertychanges` (
  `change_id` int(11) NOT NULL,
  `property_id` int(11) NOT NULL,
  `field_name` varchar(100) NOT NULL,
  `old_value` text DEFAULT NULL,
  `new_value` text DEFAULT NULL,
  `changed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `changed_by` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `propertyclassification`
--

CREATE TABLE `propertyclassification` (
  `pc_id` int(11) NOT NULL,
  `code` varchar(10) NOT NULL,
  `classname` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `active` tinyint(1) DEFAULT 1,
  `created_date` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `propertyclassification`
--

INSERT INTO `propertyclassification` (`pc_id`, `code`, `classname`, `description`, `active`, `created_date`) VALUES
(1, 'R', 'Residential', 'For dwelling purposes', 1, '2025-10-06 01:23:24'),
(2, 'C', 'Commercial', 'For business/trade', 1, '2025-10-06 01:23:24'),
(3, 'A', 'Agricultural', 'For farming/cultivation', 1, '2025-10-06 01:23:24'),
(4, 'I', 'Industrial', 'For industrial Work', 1, '2025-10-24 00:58:23'),
(5, 'INS', 'Institutional', 'Etc.\n', 1, '2025-11-27 06:40:27');

-- --------------------------------------------------------

--
-- Table structure for table `propertyhistory`
--

CREATE TABLE `propertyhistory` (
  `history_id` int(11) NOT NULL,
  `property_id` int(11) NOT NULL,
  `action_type` enum('CREATE','UPDATE','DELETE') NOT NULL,
  `snapshot` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`snapshot`)),
  `changed_by` int(11) DEFAULT NULL,
  `changed_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `propertyland`
--

CREATE TABLE `propertyland` (
  `land_id` int(11) NOT NULL,
  `property_id` int(11) NOT NULL,
  `au_code` varchar(100) NOT NULL,
  `psc_code` varchar(100) NOT NULL,
  `lot_area` decimal(12,2) NOT NULL,
  `shape` enum('REGULAR','IRREGULAR') DEFAULT 'REGULAR',
  `topography` enum('LEVEL','SLOPING','ROLLING','HILLY') DEFAULT 'LEVEL',
  `corner_lot` tinyint(1) DEFAULT 0,
  `road_access` enum('PAVED','GRAVEL','EARTH','NONE') DEFAULT 'PAVED',
  `additional_adj_factor` decimal(6,4) DEFAULT 1.0000,
  `remarks` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `propertyland`
--

INSERT INTO `propertyland` (`land_id`, `property_id`, `au_code`, `psc_code`, `lot_area`, `shape`, `topography`, `corner_lot`, `road_access`, `additional_adj_factor`, `remarks`) VALUES
(43, 177, 'RES-DWELL', 'R1', 12000.00, NULL, NULL, NULL, NULL, NULL, NULL),
(44, 180, 'COM-RETAIL', 'C2', 12000.00, NULL, NULL, NULL, NULL, NULL, NULL),
(45, 181, 'RES-DWELL', 'R1', 6000.00, 'REGULAR', 'LEVEL', 0, 'PAVED', 1.0000, NULL),
(46, 182, 'RES-DWELL', 'R1', 6000.00, 'REGULAR', 'LEVEL', 0, 'PAVED', 1.0000, NULL),
(47, 184, 'COM-RETAIL', 'C1', 12000.00, NULL, NULL, NULL, NULL, NULL, NULL),
(48, 185, 'RES-DWELL', 'R1', 2000.00, NULL, NULL, NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `propertymachinery`
--

CREATE TABLE `propertymachinery` (
  `machinery_id` int(11) NOT NULL,
  `property_id` int(11) NOT NULL,
  `mt_id` int(11) NOT NULL,
  `mau_id` int(11) NOT NULL,
  `brand_model` varchar(255) DEFAULT NULL,
  `capacity_hp` varchar(100) DEFAULT NULL,
  `date_acquired` date DEFAULT NULL,
  `condition` enum('NEW','SECOND_HAND') DEFAULT 'NEW',
  `economic_life` int(11) DEFAULT 10,
  `remaining_life` int(11) DEFAULT 10,
  `year_installed` year(4) DEFAULT NULL,
  `year_initial_operation` year(4) DEFAULT NULL,
  `original_cost` decimal(12,2) DEFAULT 0.00,
  `conversion_factor` decimal(6,2) DEFAULT 1.00,
  `rcn` decimal(12,2) DEFAULT 0.00,
  `years_used` int(11) DEFAULT 0,
  `depreciation_rate` decimal(5,2) DEFAULT 0.00,
  `total_depreciation_value` decimal(12,2) DEFAULT 0.00,
  `depreciated_value` decimal(12,2) DEFAULT 0.00,
  `property_status` varchar(255) DEFAULT NULL,
  `remarks` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `propertymachinery`
--

INSERT INTO `propertymachinery` (`machinery_id`, `property_id`, `mt_id`, `mau_id`, `brand_model`, `capacity_hp`, `date_acquired`, `condition`, `economic_life`, `remaining_life`, `year_installed`, `year_initial_operation`, `original_cost`, `conversion_factor`, `rcn`, `years_used`, `depreciation_rate`, `total_depreciation_value`, `depreciated_value`, `property_status`, `remarks`) VALUES
(4, 179, 2, 1, 'Company', '3', '2010-01-06', 'NEW', 10, 10, '2010', '2011', 0.00, 1.00, 0.00, 14, 0.00, 0.00, 0.00, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `propertymasterlist`
--

CREATE TABLE `propertymasterlist` (
  `property_id` int(11) NOT NULL,
  `arp_no` varchar(50) NOT NULL,
  `pin` varchar(50) DEFAULT NULL,
  `owner_name` varchar(150) NOT NULL,
  `owner_address` text DEFAULT NULL,
  `owner_id` int(11) DEFAULT NULL,
  `lg_code` varchar(100) NOT NULL,
  `barangay` varchar(100) DEFAULT NULL,
  `lot_no` varchar(50) DEFAULT NULL,
  `block_no` varchar(50) DEFAULT NULL,
  `property_kind` enum('Land','Building','Machinery') DEFAULT 'Land',
  `description` text DEFAULT NULL,
  `status` enum('ACTIVE','INACTIVE','TRANSFERRED','CANCELLED','SUBDIVIDED','CONSOLIDATED') DEFAULT 'ACTIVE',
  `current_faas` int(11) DEFAULT NULL,
  `created_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_date` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `barangay_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `propertymasterlist`
--

INSERT INTO `propertymasterlist` (`property_id`, `arp_no`, `pin`, `owner_name`, `owner_address`, `owner_id`, `lg_code`, `barangay`, `lot_no`, `block_no`, `property_kind`, `description`, `status`, `current_faas`, `created_date`, `updated_date`, `barangay_id`) VALUES
(177, 'ARP-1', 'PIN-1', 'New Buyer', 'Address of new buyer', NULL, 'PRIME-01', 'Barangay 1', '13', '12', 'Land', '', 'SUBDIVIDED', NULL, '2025-11-27 06:53:29', '2025-11-27 07:47:03', NULL),
(178, 'ARP-2', 'PIN-2', 'Robert Conchas', 'Makati', NULL, 'STD-01', 'Barangay 12', '12', '41', 'Building', '', 'ACTIVE', NULL, '2025-11-27 06:56:39', '2025-11-27 06:56:39', NULL),
(179, 'ARP-3', 'PIN-3', 'Conchas Robert', 'Makati', NULL, 'STD-01', 'Barangay 12', '42', '12', 'Machinery', '41', 'ACTIVE', NULL, '2025-11-27 06:58:20', '2025-11-27 06:58:20', NULL),
(180, 'ARP-4', 'PIN-4', 'CHas', 'Makati', NULL, 'STD-01', 'Barangay 12', '21', '31', 'Land', '', 'ACTIVE', NULL, '2025-11-27 07:32:22', '2025-11-27 07:32:22', NULL),
(181, 'APR-SUB-1', 'PIN-SUB-1', 'New Buyer 1', 'Address of new buyer 1', NULL, 'PRIME-01', '101', 'Lot 1', '123', 'Land', NULL, 'ACTIVE', NULL, '2025-11-27 07:47:03', '2025-11-27 07:47:03', NULL),
(182, 'ARP-SUB-2', 'PIN-SUB-2', 'New Buyer 2', 'Address of new buyer 2 ', NULL, 'PRIME-01', '32', 'Lot 2', '412', 'Land', NULL, 'ACTIVE', NULL, '2025-11-27 07:47:03', '2025-11-27 07:47:03', NULL),
(184, 'APR-6', 'PIN-6', 'New', 'New', NULL, 'PRIME-01', 'Barangay 12', 'New', 'New', 'Land', 'New', 'ACTIVE', NULL, '2025-11-27 07:57:37', '2025-11-27 07:57:37', NULL),
(185, 'APR-7', 'PIN-7', 'New', 'new', NULL, 'PRIME-01', 'Barangay 12', '123', '32', 'Land', '32', 'ACTIVE', NULL, '2025-11-27 08:01:36', '2025-11-27 08:01:36', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `propertysubclassification`
--

CREATE TABLE `propertysubclassification` (
  `psc_id` int(11) NOT NULL,
  `ry_id` int(11) NOT NULL,
  `pc_id` int(11) NOT NULL,
  `code` varchar(10) NOT NULL,
  `subclass_name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `valuation_factor` decimal(8,4) DEFAULT 1.0000,
  `active` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `propertysubclassification`
--

INSERT INTO `propertysubclassification` (`psc_id`, `ry_id`, `pc_id`, `code`, `subclass_name`, `description`, `valuation_factor`, `active`) VALUES
(1, 1, 1, 'R1', 'Residential 1 (Subdivision)', NULL, 1.0000, 1),
(2, 1, 2, 'C1', 'Commercial 1 (Retail)', NULL, 1.0000, 1),
(3, 1, 3, 'A1', 'Agricultural 1 (Irrigated)', NULL, 1.0000, 1),
(4, 2, 1, 'R1', 'Residential 1 (Subdivision)', NULL, 1.0000, 1),
(5, 2, 2, 'C1', 'Commercial 1 (Retail)', NULL, 1.0000, 1),
(6, 2, 3, 'A1', 'Agricultural 1 (Irrigated)', NULL, 1.0000, 1),
(7, 1, 1, 'R2', 'Residential 2', 'Ah', 1.0000, 1),
(8, 1, 2, 'C2', 'Commercial 2', '1', 1.0000, 1),
(9, 1, 3, 'A2', 'Agriculture 2', '1', 1.0000, 1);

-- --------------------------------------------------------

--
-- Table structure for table `revisionyear`
--

CREATE TABLE `revisionyear` (
  `ry_id` int(11) NOT NULL,
  `revision_code` varchar(20) NOT NULL,
  `year` int(11) NOT NULL,
  `td_prefix` varchar(20) NOT NULL,
  `description` text DEFAULT NULL,
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `active` tinyint(1) DEFAULT 0,
  `created_date` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `revisionyear`
--

INSERT INTO `revisionyear` (`ry_id`, `revision_code`, `year`, `td_prefix`, `description`, `start_date`, `end_date`, `active`, `created_date`) VALUES
(1, 'RY2023', 2023, '', '2023 General Revision', '2023-01-01', '2024-12-31', 1, '2025-10-06 01:23:24'),
(2, 'RY2025', 2025, '', '2025 General Revision', '2025-01-01', NULL, 0, '2025-10-06 01:23:24');

-- --------------------------------------------------------

--
-- Table structure for table `smv_building`
--

CREATE TABLE `smv_building` (
  `smv_building_id` int(11) NOT NULL,
  `ry_id` int(11) NOT NULL,
  `bk_id` int(11) NOT NULL,
  `st_id` int(11) NOT NULL,
  `unit_value` decimal(12,2) NOT NULL,
  `effective_date` date NOT NULL,
  `ordinance_no` varchar(50) DEFAULT NULL,
  `approved_by` varchar(100) DEFAULT NULL,
  `remarks` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `smv_building`
--

INSERT INTO `smv_building` (`smv_building_id`, `ry_id`, `bk_id`, `st_id`, `unit_value`, `effective_date`, `ordinance_no`, `approved_by`, `remarks`) VALUES
(1, 1, 1, 1, 10000.00, '2025-01-01', 'ORD-2025-01', NULL, NULL),
(2, 1, 1, 2, 6000.00, '2025-01-01', 'ORD-2025-01', NULL, NULL),
(3, 1, 2, 1, 12000.00, '2025-01-01', 'ORD-2025-01', NULL, NULL),
(9, 1, 2, 2, 2134.00, '2025-11-04', 'asdsa', 'asdasd', 'asdasd');

-- --------------------------------------------------------

--
-- Table structure for table `smv_land`
--

CREATE TABLE `smv_land` (
  `smv_land_id` int(11) NOT NULL,
  `ry_id` int(11) NOT NULL,
  `lg_id` int(11) NOT NULL,
  `psc_id` int(11) NOT NULL,
  `unit_value` decimal(12,2) NOT NULL,
  `effective_date` date NOT NULL,
  `ordinance_no` varchar(50) DEFAULT NULL,
  `approved_by` varchar(100) DEFAULT NULL,
  `remarks` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `smv_land`
--

INSERT INTO `smv_land` (`smv_land_id`, `ry_id`, `lg_id`, `psc_id`, `unit_value`, `effective_date`, `ordinance_no`, `approved_by`, `remarks`) VALUES
(3, 1, 3, 1, 6000.00, '2022-12-31', 'Ord-2023-0011', NULL, NULL),
(4, 1, 1, 2, 40000.00, '2022-12-30', 'Ord-2023-001', NULL, NULL),
(5, 1, 1, 3, 3000.00, '2023-01-02', 'Ord-2023-001', NULL, NULL),
(10, 2, 4, 6, 3600.00, '2025-01-01', 'Ord-2025-001', NULL, NULL),
(17, 1, 2, 3, 11111111.00, '2025-10-04', NULL, NULL, NULL),
(18, 1, 2, 2, 123123.00, '2025-10-06', '123', '123', '123'),
(23, 1, 1, 1, 521.20, '2025-10-17', NULL, NULL, NULL),
(24, 1, 1, 8, 50001.00, '2025-10-22', NULL, NULL, NULL),
(25, 1, 1, 7, 541.00, '2025-10-22', NULL, NULL, NULL),
(26, 1, 2, 1, 4512.00, '2025-10-23', NULL, NULL, NULL),
(27, 1, 2, 9, 45.00, '2025-10-24', NULL, NULL, NULL),
(29, 1, 2, 8, 5000.00, '2025-11-27', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `smv_machinery`
--

CREATE TABLE `smv_machinery` (
  `smv_machinery_id` int(11) NOT NULL,
  `ry_id` int(11) NOT NULL,
  `mt_id` int(11) NOT NULL,
  `unit_value` decimal(12,2) NOT NULL,
  `effective_date` date NOT NULL,
  `ordinance_no` varchar(50) DEFAULT NULL,
  `approved_by` varchar(100) DEFAULT NULL,
  `remarks` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `smv_machinery`
--

INSERT INTO `smv_machinery` (`smv_machinery_id`, `ry_id`, `mt_id`, `unit_value`, `effective_date`, `ordinance_no`, `approved_by`, `remarks`) VALUES
(1, 1, 1, 123.00, '2025-11-05', 'ad', 'asd', 'asd');

-- --------------------------------------------------------

--
-- Table structure for table `structuraltype`
--

CREATE TABLE `structuraltype` (
  `st_id` int(11) NOT NULL,
  `code` varchar(20) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `structuraltype`
--

INSERT INTO `structuraltype` (`st_id`, `code`, `name`, `description`) VALUES
(1, 'RC', 'Reinforced Concrete', 'Full concrete structure'),
(2, 'LM', 'Light Materials', 'Wood, bamboo, or GI sheets'),
(10, 'MC', 'Mixed Concrete', 'Concrete first floor, timber/wood second floor (Type II)'),
(11, 'ST', 'Strong Timber', 'First class wooden materials, G.I. roofing (Type III)'),
(12, 'SC', 'Semi-Concrete', 'Concrete hollow blocks wall, wooden framing'),
(13, 'STL', 'Steel Structure', 'Structural steel framing (common in warehouses/factories)'),
(14, 'PF', 'Pre-Fabricated', 'Modular or pre-cast materials');

-- --------------------------------------------------------

--
-- Table structure for table `systemparameter`
--

CREATE TABLE `systemparameter` (
  `param_id` int(11) NOT NULL,
  `ry_id` int(11) NOT NULL,
  `created_date` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `taxdeclaration`
--

CREATE TABLE `taxdeclaration` (
  `td_id` int(11) NOT NULL,
  `faas_id` int(11) NOT NULL,
  `td_no` varchar(100) NOT NULL,
  `property_identification_no` varchar(100) DEFAULT NULL,
  `issue_date` date NOT NULL,
  `owner_name` varchar(255) NOT NULL,
  `owner_address` text DEFAULT NULL,
  `owner_tin` varchar(100) DEFAULT NULL,
  `owner_tel` varchar(100) DEFAULT NULL,
  `admin_name` varchar(255) DEFAULT NULL,
  `admin_address` text DEFAULT NULL,
  `admin_tin` varchar(100) DEFAULT NULL,
  `admin_tel` varchar(100) DEFAULT NULL,
  `location_street` text DEFAULT NULL,
  `location_barangay` varchar(255) DEFAULT NULL,
  `location_municipality` varchar(255) DEFAULT NULL,
  `location_province` varchar(255) DEFAULT NULL,
  `survey_no` varchar(100) DEFAULT NULL,
  `lot_no` varchar(100) DEFAULT NULL,
  `block_no` varchar(100) DEFAULT NULL,
  `cct_no` varchar(100) DEFAULT NULL,
  `boundary_north` text DEFAULT NULL,
  `boundary_south` text DEFAULT NULL,
  `boundary_east` text DEFAULT NULL,
  `boundary_west` text DEFAULT NULL,
  `property_kind` enum('LAND','BUILDING','MACHINERY','OTHERS') NOT NULL,
  `taxable` tinyint(1) DEFAULT 1,
  `market_value` decimal(18,2) DEFAULT 0.00,
  `assessment_level` decimal(5,2) DEFAULT 0.00,
  `assessed_value` decimal(18,2) DEFAULT 0.00,
  `effectivity_qtr` varchar(5) DEFAULT NULL,
  `effectivity_year` year(4) DEFAULT NULL,
  `approved_by` varchar(255) DEFAULT NULL,
  `approved_date` date DEFAULT NULL,
  `previous_td_no` varchar(100) DEFAULT NULL,
  `created_by` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `transactionalcodes`
--

CREATE TABLE `transactionalcodes` (
  `tc_id` int(11) NOT NULL,
  `transaction_name` varchar(100) NOT NULL,
  `transaction_code` varchar(50) NOT NULL,
  `transaction_description` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `transactionalcodes`
--

INSERT INTO `transactionalcodes` (`tc_id`, `transaction_name`, `transaction_code`, `transaction_description`) VALUES
(3, 'ORIGINAL', 'OG', 'First issuance for a newly discovered or newly declared property.'),
(4, 'TRANSFER', 'TF', 'Ownership of property changes (via sale, donation, etc.).'),
(5, 'SUBDIVISION', 'SD', 'A property is divided into two or more parcels.'),
(6, 'CONSOLIDATION', 'CON', 'Two or more parcels are merged into one property.'),
(7, 'RECLASSIFICATION', 'REF', 'Land use changes (e.g., from Agricultural → Residential).'),
(8, 'REVISION / GENERAL REVISION', 'RV', 'During general revision (every 3 years or when new SMVs are approved).'),
(9, 'IMPROVEMENT / NEW BUILDING', 'IMP', 'New improvement added or building constructed.'),
(10, 'DEMOLITION / DESTROYED', 'DEM', 'When an improvement is demolished or destroyed.'),
(11, 'CANCELLATION', 'CAN', 'Administrative or legal cancellation (e.g., duplicate entry, error).');

-- --------------------------------------------------------

--
-- Structure for view `assessmentrollview`
--
DROP TABLE IF EXISTS `assessmentrollview`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `assessmentrollview`  AS SELECT `r`.`year` AS `revision_year`, `pm`.`barangay` AS `barangay`, `td`.`td_no` AS `td_no`, `td`.`owner_name` AS `owner_name`, `td`.`property_kind` AS `property_kind`, `td`.`market_value` AS `market_value`, `td`.`assessed_value` AS `assessed_value`, `td`.`effectivity_date` AS `effectivity_date`, `td`.`status` AS `status` FROM (((`taxdeclaration` `td` join `faas` `f` on(`td`.`faas_id` = `f`.`faas_id`)) join `revisionyear` `r` on(`f`.`ry_id` = `r`.`ry_id`)) join `propertymasterlist` `pm` on(`f`.`property_id` = `pm`.`property_id`)) WHERE `td`.`status` = 'ACTIVE' ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `actualuse`
--
ALTER TABLE `actualuse`
  ADD PRIMARY KEY (`au_id`),
  ADD UNIQUE KEY `unique_use_per_revision` (`ry_id`,`code`),
  ADD KEY `idx_actualuse_lookup` (`ry_id`,`code`,`active`),
  ADD KEY `pc_id` (`pc_id`);

--
-- Indexes for table `barangay`
--
ALTER TABLE `barangay`
  ADD PRIMARY KEY (`barangay_id`),
  ADD KEY `lg_id` (`lg_id`);

--
-- Indexes for table `buildingactualuse`
--
ALTER TABLE `buildingactualuse`
  ADD PRIMARY KEY (`bau_id`),
  ADD UNIQUE KEY `unique_building_use` (`ry_id`,`pc_id`,`use_code`),
  ADD KEY `pc_id` (`pc_id`);

--
-- Indexes for table `buildingadditionalitems`
--
ALTER TABLE `buildingadditionalitems`
  ADD PRIMARY KEY (`bai_id`),
  ADD KEY `building_id` (`building_id`);

--
-- Indexes for table `buildingfloorareas`
--
ALTER TABLE `buildingfloorareas`
  ADD PRIMARY KEY (`bfa_id`),
  ADD KEY `building_id` (`building_id`);

--
-- Indexes for table `buildingkind`
--
ALTER TABLE `buildingkind`
  ADD PRIMARY KEY (`bk_id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD KEY `pc_id` (`pc_id`);

--
-- Indexes for table `buildingstructuralmaterials`
--
ALTER TABLE `buildingstructuralmaterials`
  ADD PRIMARY KEY (`bsm_id`),
  ADD KEY `building_id` (`building_id`);

--
-- Indexes for table `faas`
--
ALTER TABLE `faas`
  ADD PRIMARY KEY (`faas_id`),
  ADD UNIQUE KEY `faas_no` (`faas_no`),
  ADD KEY `property_id` (`property_id`),
  ADD KEY `ry_id` (`ry_id`),
  ADD KEY `faas_ibfk_3` (`previous_faas_id`);

--
-- Indexes for table `faasadjustments`
--
ALTER TABLE `faasadjustments`
  ADD PRIMARY KEY (`adjustment_id`),
  ADD KEY `faas_id` (`faas_id`);

--
-- Indexes for table `faasappraisal`
--
ALTER TABLE `faasappraisal`
  ADD PRIMARY KEY (`appraisal_id`),
  ADD KEY `faas_id` (`faas_id`);

--
-- Indexes for table `faasassessment`
--
ALTER TABLE `faasassessment`
  ADD PRIMARY KEY (`assessment_id`),
  ADD KEY `faas_id` (`faas_id`);

--
-- Indexes for table `faasbldgadditionalitems`
--
ALTER TABLE `faasbldgadditionalitems`
  ADD PRIMARY KEY (`fbai_id`),
  ADD KEY `faas_id` (`faas_id`);

--
-- Indexes for table `faasbldgappraisal`
--
ALTER TABLE `faasbldgappraisal`
  ADD PRIMARY KEY (`fba_id`),
  ADD KEY `faas_id` (`faas_id`);

--
-- Indexes for table `faasbldgassessment`
--
ALTER TABLE `faasbldgassessment`
  ADD PRIMARY KEY (`fba_id`),
  ADD KEY `faas_id` (`faas_id`);

--
-- Indexes for table `faasbldgfloorsarea`
--
ALTER TABLE `faasbldgfloorsarea`
  ADD PRIMARY KEY (`fbf_id`),
  ADD KEY `faas_id` (`faas_id`);

--
-- Indexes for table `faasbldggeneral`
--
ALTER TABLE `faasbldggeneral`
  ADD PRIMARY KEY (`fbg_id`),
  ADD KEY `faas_id` (`faas_id`);

--
-- Indexes for table `faasbldgstruturalmaterials`
--
ALTER TABLE `faasbldgstruturalmaterials`
  ADD PRIMARY KEY (`fbsm_id`),
  ADD KEY `faas_id` (`faas_id`);

--
-- Indexes for table `faasimprovements`
--
ALTER TABLE `faasimprovements`
  ADD PRIMARY KEY (`improvement_id`),
  ADD KEY `faas_id` (`faas_id`);

--
-- Indexes for table `faasmachineryappraisal`
--
ALTER TABLE `faasmachineryappraisal`
  ADD PRIMARY KEY (`fma_id`),
  ADD KEY `faas_id` (`faas_id`);

--
-- Indexes for table `faasmachineryassessment`
--
ALTER TABLE `faasmachineryassessment`
  ADD PRIMARY KEY (`fma_id`),
  ADD KEY `faas_id` (`faas_id`);

--
-- Indexes for table `faas_transactionhistory`
--
ALTER TABLE `faas_transactionhistory`
  ADD PRIMARY KEY (`history_id`),
  ADD KEY `faas_transactionhistory_ibfk_2` (`property_id`);

--
-- Indexes for table `landotherimprovements`
--
ALTER TABLE `landotherimprovements`
  ADD PRIMARY KEY (`improvement_id`),
  ADD KEY `land_id` (`land_id`);

--
-- Indexes for table `locationalgroup`
--
ALTER TABLE `locationalgroup`
  ADD PRIMARY KEY (`lg_id`),
  ADD UNIQUE KEY `unique_code_per_revision` (`ry_id`,`code`),
  ADD UNIQUE KEY `unique_name_per_revision` (`ry_id`,`name`),
  ADD KEY `idx_location_lookup` (`ry_id`,`code`,`active`);

--
-- Indexes for table `machineryactualuse`
--
ALTER TABLE `machineryactualuse`
  ADD PRIMARY KEY (`mau_id`),
  ADD UNIQUE KEY `unique_machinery_use` (`ry_id`,`pc_id`,`use_code`),
  ADD KEY `pc_id` (`pc_id`);

--
-- Indexes for table `machineryassessmentlevel`
--
ALTER TABLE `machineryassessmentlevel`
  ADD PRIMARY KEY (`mal_id`),
  ADD UNIQUE KEY `unique_machinery_assessment` (`ry_id`,`pc_id`),
  ADD KEY `pc_id` (`pc_id`);

--
-- Indexes for table `machinerytype`
--
ALTER TABLE `machinerytype`
  ADD PRIMARY KEY (`mt_id`),
  ADD UNIQUE KEY `code` (`code`);

--
-- Indexes for table `propertybuilding`
--
ALTER TABLE `propertybuilding`
  ADD PRIMARY KEY (`building_id`),
  ADD UNIQUE KEY `unique_building_per_property` (`property_id`),
  ADD KEY `bk_id` (`bk_id`),
  ADD KEY `st_id` (`st_id`),
  ADD KEY `bau_id` (`bau_id`);

--
-- Indexes for table `propertychangelog`
--
ALTER TABLE `propertychangelog`
  ADD PRIMARY KEY (`log_id`),
  ADD KEY `property_id` (`property_id`);

--
-- Indexes for table `propertychanges`
--
ALTER TABLE `propertychanges`
  ADD PRIMARY KEY (`change_id`),
  ADD KEY `propertychanges_ibfk_1` (`property_id`);

--
-- Indexes for table `propertyclassification`
--
ALTER TABLE `propertyclassification`
  ADD PRIMARY KEY (`pc_id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD KEY `idx_classification_lookup` (`code`,`active`);

--
-- Indexes for table `propertyhistory`
--
ALTER TABLE `propertyhistory`
  ADD PRIMARY KEY (`history_id`),
  ADD KEY `property_id` (`property_id`);

--
-- Indexes for table `propertyland`
--
ALTER TABLE `propertyland`
  ADD PRIMARY KEY (`land_id`),
  ADD UNIQUE KEY `unique_land_per_property` (`property_id`);

--
-- Indexes for table `propertymachinery`
--
ALTER TABLE `propertymachinery`
  ADD PRIMARY KEY (`machinery_id`),
  ADD KEY `mau_id` (`mau_id`),
  ADD KEY `property_id` (`property_id`),
  ADD KEY `mt_id` (`mt_id`);

--
-- Indexes for table `propertymasterlist`
--
ALTER TABLE `propertymasterlist`
  ADD PRIMARY KEY (`property_id`),
  ADD UNIQUE KEY `arp_no` (`arp_no`),
  ADD KEY `idx_property_lookup` (`arp_no`,`pin`,`lg_code`),
  ADD KEY `barangay_id` (`barangay_id`),
  ADD KEY `propertymasterlist_ibfk_2` (`current_faas`);

--
-- Indexes for table `propertysubclassification`
--
ALTER TABLE `propertysubclassification`
  ADD PRIMARY KEY (`psc_id`),
  ADD UNIQUE KEY `unique_subclass_per_revision` (`ry_id`,`pc_id`,`code`),
  ADD KEY `pc_id` (`pc_id`),
  ADD KEY `idx_subclass_lookup` (`ry_id`,`pc_id`,`code`,`active`);

--
-- Indexes for table `revisionyear`
--
ALTER TABLE `revisionyear`
  ADD PRIMARY KEY (`ry_id`),
  ADD UNIQUE KEY `revision_code` (`revision_code`);

--
-- Indexes for table `smv_building`
--
ALTER TABLE `smv_building`
  ADD PRIMARY KEY (`smv_building_id`),
  ADD UNIQUE KEY `unique_building_smv` (`ry_id`,`st_id`,`bk_id`),
  ADD KEY `st_id` (`st_id`),
  ADD KEY `bk_id` (`bk_id`);

--
-- Indexes for table `smv_land`
--
ALTER TABLE `smv_land`
  ADD PRIMARY KEY (`smv_land_id`),
  ADD UNIQUE KEY `unique_land_smv` (`ry_id`,`lg_id`,`psc_id`),
  ADD KEY `psc_id` (`psc_id`),
  ADD KEY `lg_id` (`lg_id`);

--
-- Indexes for table `smv_machinery`
--
ALTER TABLE `smv_machinery`
  ADD PRIMARY KEY (`smv_machinery_id`),
  ADD UNIQUE KEY `unique_machinery_smv` (`ry_id`,`mt_id`),
  ADD KEY `mt_id` (`mt_id`);

--
-- Indexes for table `structuraltype`
--
ALTER TABLE `structuraltype`
  ADD PRIMARY KEY (`st_id`),
  ADD UNIQUE KEY `code` (`code`);

--
-- Indexes for table `systemparameter`
--
ALTER TABLE `systemparameter`
  ADD PRIMARY KEY (`param_id`),
  ADD KEY `ry_id` (`ry_id`);

--
-- Indexes for table `taxdeclaration`
--
ALTER TABLE `taxdeclaration`
  ADD PRIMARY KEY (`td_id`),
  ADD UNIQUE KEY `td_no` (`td_no`),
  ADD KEY `faas_id` (`faas_id`);

--
-- Indexes for table `transactionalcodes`
--
ALTER TABLE `transactionalcodes`
  ADD PRIMARY KEY (`tc_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `actualuse`
--
ALTER TABLE `actualuse`
  MODIFY `au_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `barangay`
--
ALTER TABLE `barangay`
  MODIFY `barangay_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `buildingactualuse`
--
ALTER TABLE `buildingactualuse`
  MODIFY `bau_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `buildingadditionalitems`
--
ALTER TABLE `buildingadditionalitems`
  MODIFY `bai_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `buildingfloorareas`
--
ALTER TABLE `buildingfloorareas`
  MODIFY `bfa_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `buildingkind`
--
ALTER TABLE `buildingkind`
  MODIFY `bk_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT for table `buildingstructuralmaterials`
--
ALTER TABLE `buildingstructuralmaterials`
  MODIFY `bsm_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `faas`
--
ALTER TABLE `faas`
  MODIFY `faas_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=147;

--
-- AUTO_INCREMENT for table `faasadjustments`
--
ALTER TABLE `faasadjustments`
  MODIFY `adjustment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=80;

--
-- AUTO_INCREMENT for table `faasappraisal`
--
ALTER TABLE `faasappraisal`
  MODIFY `appraisal_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=103;

--
-- AUTO_INCREMENT for table `faasassessment`
--
ALTER TABLE `faasassessment`
  MODIFY `assessment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=100;

--
-- AUTO_INCREMENT for table `faasbldgadditionalitems`
--
ALTER TABLE `faasbldgadditionalitems`
  MODIFY `fbai_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `faasbldgappraisal`
--
ALTER TABLE `faasbldgappraisal`
  MODIFY `fba_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `faasbldgassessment`
--
ALTER TABLE `faasbldgassessment`
  MODIFY `fba_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `faasbldgfloorsarea`
--
ALTER TABLE `faasbldgfloorsarea`
  MODIFY `fbf_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=35;

--
-- AUTO_INCREMENT for table `faasbldggeneral`
--
ALTER TABLE `faasbldggeneral`
  MODIFY `fbg_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `faasbldgstruturalmaterials`
--
ALTER TABLE `faasbldgstruturalmaterials`
  MODIFY `fbsm_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- AUTO_INCREMENT for table `faasimprovements`
--
ALTER TABLE `faasimprovements`
  MODIFY `improvement_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=108;

--
-- AUTO_INCREMENT for table `faasmachineryappraisal`
--
ALTER TABLE `faasmachineryappraisal`
  MODIFY `fma_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `faasmachineryassessment`
--
ALTER TABLE `faasmachineryassessment`
  MODIFY `fma_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `faas_transactionhistory`
--
ALTER TABLE `faas_transactionhistory`
  MODIFY `history_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=108;

--
-- AUTO_INCREMENT for table `landotherimprovements`
--
ALTER TABLE `landotherimprovements`
  MODIFY `improvement_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=40;

--
-- AUTO_INCREMENT for table `locationalgroup`
--
ALTER TABLE `locationalgroup`
  MODIFY `lg_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `machineryactualuse`
--
ALTER TABLE `machineryactualuse`
  MODIFY `mau_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `machineryassessmentlevel`
--
ALTER TABLE `machineryassessmentlevel`
  MODIFY `mal_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `machinerytype`
--
ALTER TABLE `machinerytype`
  MODIFY `mt_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `propertybuilding`
--
ALTER TABLE `propertybuilding`
  MODIFY `building_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `propertychangelog`
--
ALTER TABLE `propertychangelog`
  MODIFY `log_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `propertychanges`
--
ALTER TABLE `propertychanges`
  MODIFY `change_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `propertyclassification`
--
ALTER TABLE `propertyclassification`
  MODIFY `pc_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `propertyhistory`
--
ALTER TABLE `propertyhistory`
  MODIFY `history_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `propertyland`
--
ALTER TABLE `propertyland`
  MODIFY `land_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=49;

--
-- AUTO_INCREMENT for table `propertymachinery`
--
ALTER TABLE `propertymachinery`
  MODIFY `machinery_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `propertymasterlist`
--
ALTER TABLE `propertymasterlist`
  MODIFY `property_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=186;

--
-- AUTO_INCREMENT for table `propertysubclassification`
--
ALTER TABLE `propertysubclassification`
  MODIFY `psc_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `revisionyear`
--
ALTER TABLE `revisionyear`
  MODIFY `ry_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `smv_building`
--
ALTER TABLE `smv_building`
  MODIFY `smv_building_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `smv_land`
--
ALTER TABLE `smv_land`
  MODIFY `smv_land_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- AUTO_INCREMENT for table `smv_machinery`
--
ALTER TABLE `smv_machinery`
  MODIFY `smv_machinery_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `structuraltype`
--
ALTER TABLE `structuraltype`
  MODIFY `st_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `systemparameter`
--
ALTER TABLE `systemparameter`
  MODIFY `param_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `taxdeclaration`
--
ALTER TABLE `taxdeclaration`
  MODIFY `td_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `transactionalcodes`
--
ALTER TABLE `transactionalcodes`
  MODIFY `tc_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `actualuse`
--
ALTER TABLE `actualuse`
  ADD CONSTRAINT `actualuse_ibfk_1` FOREIGN KEY (`ry_id`) REFERENCES `revisionyear` (`ry_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `actualuse_ibfk_2` FOREIGN KEY (`pc_id`) REFERENCES `propertyclassification` (`pc_id`);

--
-- Constraints for table `barangay`
--
ALTER TABLE `barangay`
  ADD CONSTRAINT `barangay_ibfk_1` FOREIGN KEY (`lg_id`) REFERENCES `locationalgroup` (`lg_id`) ON DELETE CASCADE;

--
-- Constraints for table `buildingactualuse`
--
ALTER TABLE `buildingactualuse`
  ADD CONSTRAINT `buildingactualuse_ibfk_1` FOREIGN KEY (`ry_id`) REFERENCES `revisionyear` (`ry_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `buildingactualuse_ibfk_2` FOREIGN KEY (`pc_id`) REFERENCES `propertyclassification` (`pc_id`) ON DELETE CASCADE;

--
-- Constraints for table `buildingadditionalitems`
--
ALTER TABLE `buildingadditionalitems`
  ADD CONSTRAINT `buildingadditionalitems_ibfk_1` FOREIGN KEY (`building_id`) REFERENCES `propertybuilding` (`building_id`) ON DELETE CASCADE;

--
-- Constraints for table `buildingfloorareas`
--
ALTER TABLE `buildingfloorareas`
  ADD CONSTRAINT `buildingfloorareas_ibfk_1` FOREIGN KEY (`building_id`) REFERENCES `propertybuilding` (`building_id`) ON DELETE CASCADE;

--
-- Constraints for table `buildingkind`
--
ALTER TABLE `buildingkind`
  ADD CONSTRAINT `buildingkind_ibfk_1` FOREIGN KEY (`pc_id`) REFERENCES `propertyclassification` (`pc_id`) ON DELETE CASCADE;

--
-- Constraints for table `buildingstructuralmaterials`
--
ALTER TABLE `buildingstructuralmaterials`
  ADD CONSTRAINT `buildingstructuralmaterials_ibfk_1` FOREIGN KEY (`building_id`) REFERENCES `propertybuilding` (`building_id`) ON DELETE CASCADE;

--
-- Constraints for table `faas`
--
ALTER TABLE `faas`
  ADD CONSTRAINT `faas_ibfk_1` FOREIGN KEY (`property_id`) REFERENCES `propertymasterlist` (`property_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `faas_ibfk_2` FOREIGN KEY (`ry_id`) REFERENCES `revisionyear` (`ry_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `faas_ibfk_3` FOREIGN KEY (`previous_faas_id`) REFERENCES `faas` (`faas_id`) ON DELETE CASCADE;

--
-- Constraints for table `faasadjustments`
--
ALTER TABLE `faasadjustments`
  ADD CONSTRAINT `faasadjustments_ibfk_1` FOREIGN KEY (`faas_id`) REFERENCES `faas` (`faas_id`) ON DELETE CASCADE;

--
-- Constraints for table `faasappraisal`
--
ALTER TABLE `faasappraisal`
  ADD CONSTRAINT `faasappraisal_ibfk_1` FOREIGN KEY (`faas_id`) REFERENCES `faas` (`faas_id`) ON DELETE CASCADE;

--
-- Constraints for table `faasassessment`
--
ALTER TABLE `faasassessment`
  ADD CONSTRAINT `faasassessment_ibfk_1` FOREIGN KEY (`faas_id`) REFERENCES `faas` (`faas_id`) ON DELETE CASCADE;

--
-- Constraints for table `faasbldgadditionalitems`
--
ALTER TABLE `faasbldgadditionalitems`
  ADD CONSTRAINT `faasbldgadditionalitems_ibfk_1` FOREIGN KEY (`faas_id`) REFERENCES `faas` (`faas_id`) ON DELETE CASCADE;

--
-- Constraints for table `faasbldgappraisal`
--
ALTER TABLE `faasbldgappraisal`
  ADD CONSTRAINT `faasbldgappraisal_ibfk_1` FOREIGN KEY (`faas_id`) REFERENCES `faas` (`faas_id`) ON DELETE CASCADE;

--
-- Constraints for table `faasbldgassessment`
--
ALTER TABLE `faasbldgassessment`
  ADD CONSTRAINT `faasbldgassessment_ibfk_1` FOREIGN KEY (`faas_id`) REFERENCES `faas` (`faas_id`) ON DELETE CASCADE;

--
-- Constraints for table `faasbldgfloorsarea`
--
ALTER TABLE `faasbldgfloorsarea`
  ADD CONSTRAINT `faasbldgfloorsarea_ibfk_1` FOREIGN KEY (`faas_id`) REFERENCES `faas` (`faas_id`) ON DELETE CASCADE;

--
-- Constraints for table `faasbldggeneral`
--
ALTER TABLE `faasbldggeneral`
  ADD CONSTRAINT `faasbldggeneral_ibfk_1` FOREIGN KEY (`faas_id`) REFERENCES `faas` (`faas_id`) ON DELETE CASCADE;

--
-- Constraints for table `faasbldgstruturalmaterials`
--
ALTER TABLE `faasbldgstruturalmaterials`
  ADD CONSTRAINT `faasbldgstruturalmaterials_ibfk_1` FOREIGN KEY (`faas_id`) REFERENCES `faas` (`faas_id`) ON DELETE CASCADE;

--
-- Constraints for table `faasimprovements`
--
ALTER TABLE `faasimprovements`
  ADD CONSTRAINT `faasimprovements_ibfk_1` FOREIGN KEY (`faas_id`) REFERENCES `faas` (`faas_id`) ON DELETE CASCADE;

--
-- Constraints for table `faasmachineryappraisal`
--
ALTER TABLE `faasmachineryappraisal`
  ADD CONSTRAINT `faasmachineryappraisal_ibfk_1` FOREIGN KEY (`faas_id`) REFERENCES `faas` (`faas_id`) ON DELETE CASCADE;

--
-- Constraints for table `faasmachineryassessment`
--
ALTER TABLE `faasmachineryassessment`
  ADD CONSTRAINT `faasmachineryassessment_ibfk_1` FOREIGN KEY (`faas_id`) REFERENCES `faas` (`faas_id`) ON DELETE CASCADE;

--
-- Constraints for table `faas_transactionhistory`
--
ALTER TABLE `faas_transactionhistory`
  ADD CONSTRAINT `faas_transactionhistory_ibfk_2` FOREIGN KEY (`property_id`) REFERENCES `propertymasterlist` (`property_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `landotherimprovements`
--
ALTER TABLE `landotherimprovements`
  ADD CONSTRAINT `landotherimprovements_ibfk_1` FOREIGN KEY (`land_id`) REFERENCES `propertyland` (`land_id`) ON DELETE CASCADE;

--
-- Constraints for table `locationalgroup`
--
ALTER TABLE `locationalgroup`
  ADD CONSTRAINT `locationalgroup_ibfk_1` FOREIGN KEY (`ry_id`) REFERENCES `revisionyear` (`ry_id`) ON DELETE CASCADE;

--
-- Constraints for table `machineryactualuse`
--
ALTER TABLE `machineryactualuse`
  ADD CONSTRAINT `machineryactualuse_ibfk_1` FOREIGN KEY (`ry_id`) REFERENCES `revisionyear` (`ry_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `machineryactualuse_ibfk_2` FOREIGN KEY (`pc_id`) REFERENCES `propertyclassification` (`pc_id`) ON DELETE CASCADE;

--
-- Constraints for table `machineryassessmentlevel`
--
ALTER TABLE `machineryassessmentlevel`
  ADD CONSTRAINT `machineryassessmentlevel_ibfk_1` FOREIGN KEY (`ry_id`) REFERENCES `revisionyear` (`ry_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `machineryassessmentlevel_ibfk_2` FOREIGN KEY (`pc_id`) REFERENCES `propertyclassification` (`pc_id`) ON DELETE CASCADE;

--
-- Constraints for table `propertybuilding`
--
ALTER TABLE `propertybuilding`
  ADD CONSTRAINT `propertybuilding_ibfk_1` FOREIGN KEY (`property_id`) REFERENCES `propertymasterlist` (`property_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `propertybuilding_ibfk_2` FOREIGN KEY (`bk_id`) REFERENCES `buildingkind` (`bk_id`),
  ADD CONSTRAINT `propertybuilding_ibfk_3` FOREIGN KEY (`st_id`) REFERENCES `structuraltype` (`st_id`),
  ADD CONSTRAINT `propertybuilding_ibfk_4` FOREIGN KEY (`bau_id`) REFERENCES `buildingactualuse` (`bau_id`);

--
-- Constraints for table `propertychangelog`
--
ALTER TABLE `propertychangelog`
  ADD CONSTRAINT `propertychangelog_ibfk_1` FOREIGN KEY (`property_id`) REFERENCES `propertymasterlist` (`property_id`);

--
-- Constraints for table `propertychanges`
--
ALTER TABLE `propertychanges`
  ADD CONSTRAINT `propertychanges_ibfk_1` FOREIGN KEY (`property_id`) REFERENCES `propertymasterlist` (`property_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `propertyhistory`
--
ALTER TABLE `propertyhistory`
  ADD CONSTRAINT `propertyhistory_ibfk_1` FOREIGN KEY (`property_id`) REFERENCES `propertymasterlist` (`property_id`);

--
-- Constraints for table `propertyland`
--
ALTER TABLE `propertyland`
  ADD CONSTRAINT `propertyland_ibfk_1` FOREIGN KEY (`property_id`) REFERENCES `propertymasterlist` (`property_id`) ON DELETE CASCADE;

--
-- Constraints for table `propertymachinery`
--
ALTER TABLE `propertymachinery`
  ADD CONSTRAINT `propertymachinery_ibfk_1` FOREIGN KEY (`mau_id`) REFERENCES `machineryactualuse` (`mau_id`),
  ADD CONSTRAINT `propertymachinery_ibfk_2` FOREIGN KEY (`property_id`) REFERENCES `propertymasterlist` (`property_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `propertymachinery_ibfk_3` FOREIGN KEY (`mt_id`) REFERENCES `machinerytype` (`mt_id`);

--
-- Constraints for table `propertymasterlist`
--
ALTER TABLE `propertymasterlist`
  ADD CONSTRAINT `propertymasterlist_ibfk_1` FOREIGN KEY (`barangay_id`) REFERENCES `barangay` (`barangay_id`),
  ADD CONSTRAINT `propertymasterlist_ibfk_2` FOREIGN KEY (`current_faas`) REFERENCES `faas` (`faas_id`);

--
-- Constraints for table `propertysubclassification`
--
ALTER TABLE `propertysubclassification`
  ADD CONSTRAINT `propertysubclassification_ibfk_1` FOREIGN KEY (`ry_id`) REFERENCES `revisionyear` (`ry_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `propertysubclassification_ibfk_2` FOREIGN KEY (`pc_id`) REFERENCES `propertyclassification` (`pc_id`) ON DELETE CASCADE;

--
-- Constraints for table `smv_building`
--
ALTER TABLE `smv_building`
  ADD CONSTRAINT `smv_building_ibfk_1` FOREIGN KEY (`ry_id`) REFERENCES `revisionyear` (`ry_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `smv_building_ibfk_2` FOREIGN KEY (`st_id`) REFERENCES `structuraltype` (`st_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `smv_building_ibfk_3` FOREIGN KEY (`bk_id`) REFERENCES `buildingkind` (`bk_id`) ON DELETE CASCADE;

--
-- Constraints for table `smv_land`
--
ALTER TABLE `smv_land`
  ADD CONSTRAINT `smv_land_ibfk_1` FOREIGN KEY (`ry_id`) REFERENCES `revisionyear` (`ry_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `smv_land_ibfk_2` FOREIGN KEY (`psc_id`) REFERENCES `propertysubclassification` (`psc_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `smv_land_ibfk_3` FOREIGN KEY (`lg_id`) REFERENCES `locationalgroup` (`lg_id`) ON DELETE CASCADE;

--
-- Constraints for table `smv_machinery`
--
ALTER TABLE `smv_machinery`
  ADD CONSTRAINT `smv_machinery_ibfk_1` FOREIGN KEY (`ry_id`) REFERENCES `revisionyear` (`ry_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `smv_machinery_ibfk_2` FOREIGN KEY (`mt_id`) REFERENCES `machinerytype` (`mt_id`) ON DELETE CASCADE;

--
-- Constraints for table `systemparameter`
--
ALTER TABLE `systemparameter`
  ADD CONSTRAINT `systemparameter_ibfk_1` FOREIGN KEY (`ry_id`) REFERENCES `revisionyear` (`ry_id`) ON DELETE CASCADE;

--
-- Constraints for table `taxdeclaration`
--
ALTER TABLE `taxdeclaration`
  ADD CONSTRAINT `taxdeclaration_ibfk_1` FOREIGN KEY (`faas_id`) REFERENCES `faas` (`faas_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
