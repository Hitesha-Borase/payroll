-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3307
-- Generation Time: Sep 23, 2026 at 06:49 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `pop_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `admins`
--

CREATE TABLE `admins` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `department` varchar(100) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `admins`
--

INSERT INTO `admins` (`id`, `user_id`, `department`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 51, NULL, 1, '2026-01-07 10:36:06', '2026-01-07 10:36:06'),
(2, 59, NULL, NULL, '2026-01-12 12:16:47', '2026-01-12 12:16:47'),
(4, 76, NULL, 1, '2026-09-22 17:22:07', '2026-09-22 17:22:07');

-- --------------------------------------------------------

--
-- Table structure for table `attendance`
--

CREATE TABLE `attendance` (
  `id` int(11) NOT NULL,
  `employer_id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `date` date NOT NULL,
  `check_in` datetime DEFAULT NULL,
  `check_out` datetime DEFAULT NULL,
  `total_hours` decimal(5,2) DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `working_hours` decimal(5,2) DEFAULT NULL,
  `location` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `attendance`
--

INSERT INTO `attendance` (`id`, `employer_id`, `employee_id`, `user_id`, `date`, `check_in`, `check_out`, `total_hours`, `status`, `notes`, `created_at`, `updated_at`, `working_hours`, `location`) VALUES
(1, 1, 1, 54, '2026-01-07', '2026-01-07 12:07:33', '2026-01-07 12:09:45', 0.04, 'late', NULL, '2026-01-07 06:37:33', '2026-01-07 06:39:45', 0.04, 'Office');

-- --------------------------------------------------------

--
-- Table structure for table `attendances`
--

CREATE TABLE `attendances` (
  `id` int(11) NOT NULL,
  `employee_id` int(11) DEFAULT NULL,
  `date` date NOT NULL,
  `status` varchar(20) DEFAULT NULL,
  `check_in` time DEFAULT NULL,
  `check_out` time DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `action` varchar(255) NOT NULL,
  `details` text DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `audit_logs`
--

INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `details`, `ip_address`, `created_at`) VALUES
(11, 1, 'RESET_ADMIN_PASSWORD', 'SuperAdmin reset password for Admin ID: 76', '127.0.0.1', '2026-09-22 11:56:25'),
(10, 1, 'CREATE_ADMIN', 'Created new Admin account: XYZ (xyz@gmail.com) for company: Kiaan', '127.0.0.1', '2026-09-22 11:52:07'),
(9, 1, 'DELETE_ADMIN', 'Deleted Admin: ABC (abc@gmail.com)', '127.0.0.1', '2026-09-22 11:51:32');

-- --------------------------------------------------------

--
-- Table structure for table `bank_details`
--

CREATE TABLE `bank_details` (
  `id` int(11) NOT NULL,
  `employee_id` int(11) DEFAULT NULL,
  `employer_id` int(11) DEFAULT NULL,
  `bank_name` varchar(100) DEFAULT NULL,
  `account_number` varchar(50) DEFAULT NULL,
  `ifsc_code` varchar(20) DEFAULT NULL,
  `branch` varchar(100) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `account_holder_name` varchar(100) DEFAULT NULL,
  `branch_name` varchar(100) DEFAULT NULL,
  `account_type` varchar(50) DEFAULT NULL,
  `is_primary` tinyint(1) DEFAULT 0,
  `balance` decimal(15,2) DEFAULT 0.00,
  `status` varchar(20) DEFAULT 'active',
  `verification_status` varchar(20) DEFAULT 'pending'
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `beneficiaries`
--

CREATE TABLE `beneficiaries` (
  `id` int(11) NOT NULL,
  `employer_id` int(11) DEFAULT NULL,
  `name` varchar(100) DEFAULT NULL,
  `relationship` varchar(50) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `billing_companies`
--

CREATE TABLE `billing_companies` (
  `id` int(11) NOT NULL,
  `company_id` int(11) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `category` varchar(100) DEFAULT NULL,
  `billing_code` varchar(50) DEFAULT NULL,
  `level` varchar(50) DEFAULT NULL,
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `billing_companies`
--

INSERT INTO `billing_companies` (`id`, `company_id`, `name`, `category`, `billing_code`, `level`, `status`, `created_at`, `updated_at`) VALUES
(1, 1, 'John Anderson', 'Mortgage', '45635', 'International', 'Active', '2026-01-07 05:18:17', '2026-01-07 10:44:48'),
(2, 1, 'lkjhg', 'EMI', 'sdfghnm,', 'National', 'Active', '2026-01-07 10:44:34', '2026-01-07 10:44:34');

-- --------------------------------------------------------

--
-- Table structure for table `bills`
--

CREATE TABLE `bills` (
  `id` int(11) NOT NULL,
  `employer_id` int(11) DEFAULT NULL,
  `employee_id` int(11) DEFAULT NULL,
  `name` varchar(200) DEFAULT NULL,
  `bill_number` varchar(50) DEFAULT NULL,
  `amount` decimal(10,2) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `status` varchar(20) DEFAULT 'pending',
  `due_date` date DEFAULT NULL,
  `paid_date` datetime DEFAULT NULL,
  `category` varchar(50) DEFAULT 'Utilities',
  `auto_deduction` tinyint(1) DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `bills`
--

INSERT INTO `bills` (`id`, `employer_id`, `employee_id`, `name`, `bill_number`, `amount`, `description`, `status`, `due_date`, `paid_date`, `category`, `auto_deduction`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 'vishal_tech', NULL, 96.00, 'Bill Number: 558555545', 'pending', NULL, NULL, 'Utilities', 0, '2026-01-07 12:07:17', '2026-01-07 12:07:17');

-- --------------------------------------------------------

--
-- Table structure for table `companies`
--

CREATE TABLE `companies` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `admin_id` int(11) DEFAULT NULL,
  `company_name` varchar(200) NOT NULL,
  `company_logo` varchar(255) DEFAULT NULL,
  `company_address` text DEFAULT NULL,
  `website` varchar(200) DEFAULT NULL,
  `gst_number` varchar(50) DEFAULT NULL,
  `pan_number` varchar(50) DEFAULT NULL,
  `subscription_plan` varchar(50) DEFAULT 'basic',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `status` varchar(20) DEFAULT 'active'
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `companies`
--

INSERT INTO `companies` (`id`, `user_id`, `admin_id`, `company_name`, `company_logo`, `company_address`, `website`, `gst_number`, `pan_number`, `subscription_plan`, `created_at`, `updated_at`, `status`) VALUES
(1, 51, 1, 'Admin', NULL, 'Indore', NULL, '12345WER345', 'GSFG1324GG45', 'Professional', '2026-01-07 10:36:06', '2026-01-07 10:37:34', 'active'),
(2, 75, 3, 'Kiaan ', NULL, NULL, NULL, NULL, NULL, 'basic', '2026-09-22 17:10:03', '2026-09-22 17:10:03', 'active'),
(3, 76, 4, 'Kiaan', NULL, NULL, NULL, NULL, NULL, 'basic', '2026-09-22 17:22:07', '2026-09-22 17:22:07', 'active');

-- --------------------------------------------------------

--
-- Table structure for table `company_bank_accounts`
--

CREATE TABLE `company_bank_accounts` (
  `id` int(11) NOT NULL,
  `company_id` int(11) DEFAULT NULL,
  `bank_name` varchar(255) NOT NULL,
  `account_holder` varchar(255) DEFAULT NULL,
  `account_number` varchar(255) DEFAULT NULL,
  `ifsc_code` varchar(50) DEFAULT NULL,
  `branch` varchar(255) DEFAULT NULL,
  `transaction_limit` varchar(100) DEFAULT NULL,
  `processing_time` varchar(100) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'Pending Verification',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `company_requests`
--

CREATE TABLE `company_requests` (
  `id` int(11) NOT NULL,
  `company_name` varchar(200) NOT NULL,
  `contact_name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `plan_id` int(11) NOT NULL,
  `payment_status` varchar(20) NOT NULL DEFAULT 'pending',
  `request_status` varchar(20) NOT NULL DEFAULT 'pending',
  `company_address` text DEFAULT NULL,
  `gst_number` varchar(50) DEFAULT NULL,
  `pan_number` varchar(50) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `processed_by` int(11) DEFAULT NULL,
  `processed_at` datetime DEFAULT NULL,
  `created_company_id` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `company_requests`
--

INSERT INTO `company_requests` (`id`, `company_name`, `contact_name`, `email`, `phone`, `plan_id`, `payment_status`, `request_status`, `company_address`, `gst_number`, `pan_number`, `notes`, `processed_by`, `processed_at`, `created_company_id`, `created_at`, `updated_at`) VALUES
(1, 'Admin', 'admin', 'admin@gmail.com', '8777453626', 2, 'paid', 'accepted', 'Indore', '12345WER345', 'GSFG1324GG45', 'i am admin', 1, '2026-01-07 10:36:06', 1, '2026-01-07 10:32:31', '2026-01-07 10:37:34'),
(4, 'Kiaan', 'kiaaa', 'kiaan@demo.com', '2222222222', 2, 'pending', 'pending', 'indore', 'ASDFG12345', 'S123SDF432', 'test', NULL, NULL, NULL, '2026-03-19 07:47:05', '2026-03-19 07:47:05');

-- --------------------------------------------------------

--
-- Table structure for table `course_assignments`
--

CREATE TABLE `course_assignments` (
  `id` int(11) NOT NULL,
  `training_id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `status` varchar(50) DEFAULT 'Assigned',
  `score` decimal(5,2) DEFAULT 0.00,
  `completion_date` datetime DEFAULT NULL,
  `certificate_status` varchar(50) DEFAULT 'Pending',
  `assigned_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `course_assignments`
--

INSERT INTO `course_assignments` (`id`, `training_id`, `employee_id`, `status`, `score`, `completion_date`, `certificate_status`, `assigned_at`) VALUES
(1, 1, 1, 'Completed', 50.00, '2026-01-07 15:58:21', 'Generated', '2026-01-07 10:24:55');

-- --------------------------------------------------------

--
-- Table structure for table `course_materials`
--

CREATE TABLE `course_materials` (
  `id` int(11) NOT NULL,
  `training_id` int(11) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_url` varchar(500) NOT NULL,
  `file_type` varchar(50) DEFAULT NULL,
  `file_size` varchar(50) DEFAULT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `credits`
--

CREATE TABLE `credits` (
  `id` int(11) NOT NULL,
  `employer_id` int(11) DEFAULT NULL,
  `balance` decimal(10,2) DEFAULT 0.00,
  `total_added` decimal(10,2) DEFAULT 0.00,
  `total_used` decimal(10,2) DEFAULT 0.00,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `credits`
--

INSERT INTO `credits` (`id`, `employer_id`, `balance`, `total_added`, `total_used`, `created_at`, `updated_at`) VALUES
(1, 1, 4000.00, 5000.00, 1000.00, '2026-01-07 10:41:57', '2026-01-07 12:35:44'),
(2, 2, 500000.00, 500000.00, 0.00, '2026-01-07 16:12:49', '2026-01-07 16:12:49'),
(3, 3, 0.00, 0.00, 0.00, '2026-03-10 14:44:58', '2026-03-10 14:44:58'),
(4, 4, 0.00, 0.00, 0.00, '2026-03-16 18:45:35', '2026-03-16 18:45:35');

-- --------------------------------------------------------

--
-- Table structure for table `credit_transactions`
--

CREATE TABLE `credit_transactions` (
  `id` int(11) NOT NULL,
  `employer_id` int(11) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `amount` decimal(10,2) DEFAULT NULL,
  `transaction_type` varchar(20) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_deleted` tinyint(1) DEFAULT 0,
  `transaction_id` varchar(255) DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `employees`
--

CREATE TABLE `employees` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `employer_id` int(11) DEFAULT NULL,
  `company_id` int(11) DEFAULT NULL,
  `designation` varchar(100) DEFAULT NULL,
  `salary` decimal(10,2) DEFAULT NULL,
  `credit_balance` decimal(10,2) DEFAULT 0.00,
  `department` varchar(100) DEFAULT NULL,
  `joining_date` date DEFAULT NULL,
  `status` enum('active','inactive','terminated') DEFAULT 'active',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `emergency_contact` varchar(100) DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `employees`
--

INSERT INTO `employees` (`id`, `user_id`, `employer_id`, `company_id`, `designation`, `salary`, `credit_balance`, `department`, `joining_date`, `status`, `created_at`, `updated_at`, `emergency_contact`) VALUES
(1, 54, 1, 1, 'frontend developer', 12000.00, 500.00, NULL, '2026-01-07', 'active', '2026-01-07 11:23:21', '2026-01-07 12:35:16', NULL),
(2, 62, NULL, 0, NULL, NULL, 0.00, NULL, NULL, 'active', '2026-03-12 11:28:06', '2026-03-12 11:28:06', NULL),
(3, 63, NULL, 0, NULL, NULL, 0.00, NULL, NULL, 'active', '2026-03-12 13:26:54', '2026-03-12 13:26:54', NULL),
(4, 64, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, 'active', '2026-03-16 13:30:39', '2026-03-16 13:30:39', NULL),
(5, 65, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, 'active', '2026-03-16 13:34:04', '2026-03-16 13:34:04', NULL),
(6, 68, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, 'active', '2026-03-16 18:38:50', '2026-03-16 18:38:50', NULL),
(7, 71, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, 'active', '2026-03-16 18:44:15', '2026-03-16 18:44:15', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `employers`
--

CREATE TABLE `employers` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `company_id` int(11) DEFAULT NULL,
  `designation` varchar(100) DEFAULT 'Manager',
  `status` enum('active','inactive','suspended') DEFAULT 'active',
  `created_by` int(11) DEFAULT NULL,
  `company_name` varchar(100) DEFAULT NULL,
  `company_logo` varchar(255) DEFAULT NULL,
  `company_address` text DEFAULT NULL,
  `gst_number` varchar(50) DEFAULT NULL,
  `pan_number` varchar(50) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `subscription_plan` varchar(50) DEFAULT 'Basic'
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `employers`
--

INSERT INTO `employers` (`id`, `user_id`, `company_id`, `designation`, `status`, `created_by`, `company_name`, `company_logo`, `company_address`, `gst_number`, `pan_number`, `created_at`, `updated_at`, `subscription_plan`) VALUES
(1, 52, 1, 'Manager', 'active', 51, 'Employer', NULL, 'indore', '3456HY746JH', '6473SD3648Y', '2026-01-07 10:41:57', '2026-01-07 10:41:57', 'Bronze'),
(2, 57, 1, 'Manager', 'active', 51, 'Yash', NULL, 'Electronic Complex', 'kjhg7654', 'jhgf765', '2026-01-07 16:12:49', '2026-01-07 16:12:49', 'Basic'),
(3, 61, NULL, 'Manager', 'active', NULL, 'test1\'s Company', NULL, NULL, NULL, NULL, '2026-03-10 14:44:58', '2026-03-10 14:44:58', 'Basic'),
(4, 72, NULL, 'Manager', 'active', NULL, 'Good\'s Company', NULL, NULL, NULL, NULL, '2026-03-16 18:45:35', '2026-03-16 18:45:35', 'Basic');

-- --------------------------------------------------------

--
-- Table structure for table `employer_wallets`
--

CREATE TABLE `employer_wallets` (
  `id` int(11) NOT NULL,
  `employer_id` int(11) NOT NULL,
  `balance` decimal(10,2) DEFAULT 0.00,
  `currency` varchar(10) DEFAULT 'INR',
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `invoices`
--

CREATE TABLE `invoices` (
  `id` int(11) NOT NULL,
  `employer_id` int(11) DEFAULT NULL,
  `subscription_id` int(11) DEFAULT NULL,
  `invoice_number` varchar(50) DEFAULT NULL,
  `plan_id` int(11) DEFAULT NULL,
  `amount` decimal(10,2) DEFAULT NULL,
  `tax_amount` decimal(10,2) DEFAULT 0.00,
  `total_amount` decimal(10,2) DEFAULT 0.00,
  `status` varchar(20) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `due_date` date DEFAULT NULL,
  `paid_date` datetime DEFAULT NULL,
  `notes` text DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `invoices`
--

INSERT INTO `invoices` (`id`, `employer_id`, `subscription_id`, `invoice_number`, `plan_id`, `amount`, `tax_amount`, `total_amount`, `status`, `created_at`, `updated_at`, `due_date`, `paid_date`, `notes`) VALUES
(1, 1, 1, 'INV-1767762366068-1', 2, 2999.00, 0.00, 2999.00, 'paid', '2026-01-07 10:36:06', '2026-01-07 10:37:34', '2026-01-07', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `jobs`
--

CREATE TABLE `jobs` (
  `id` int(11) NOT NULL,
  `employer_id` int(11) DEFAULT NULL,
  `title` varchar(200) DEFAULT NULL,
  `location` varchar(100) DEFAULT NULL,
  `employer_type` varchar(50) DEFAULT 'Company',
  `department` varchar(100) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `status` varchar(20) DEFAULT NULL,
  `job_type` varchar(50) DEFAULT 'Full-time',
  `experience_required` varchar(50) DEFAULT '0-1 years',
  `level` varchar(50) DEFAULT 'Entry',
  `skills` text DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `views_count` int(11) DEFAULT 0,
  `applicants_count` int(11) DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `salary_min` decimal(10,2) DEFAULT NULL,
  `salary_max` decimal(10,2) DEFAULT NULL,
  `requirements` text DEFAULT NULL,
  `benefits` text DEFAULT NULL,
  `experience` varchar(50) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `posted_date` datetime DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `jobs`
--

INSERT INTO `jobs` (`id`, `employer_id`, `title`, `location`, `employer_type`, `department`, `description`, `status`, `job_type`, `experience_required`, `level`, `skills`, `expiry_date`, `views_count`, `applicants_count`, `created_at`, `updated_at`, `salary_min`, `salary_max`, `requirements`, `benefits`, `experience`, `is_active`, `posted_date`) VALUES
(1, 1, 'backend', 'Bangalore, Karnataka', 'Company', 'Engineering', 'dsa', 'Active', 'Full-time', '0-1 years', 'Entry', 'dsz', '2026-01-10', 6, 1, '2026-01-07 11:53:03', '2026-01-07 16:53:59', 50000.00, NULL, NULL, NULL, '2', 1, '2026-01-07 11:53:03');

-- --------------------------------------------------------

--
-- Table structure for table `job_applications`
--

CREATE TABLE `job_applications` (
  `id` int(11) NOT NULL,
  `jobseeker_id` int(11) DEFAULT NULL,
  `job_id` int(11) DEFAULT NULL,
  `applicant_name` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `status` enum('Under Review','Shortlisted','Interview Scheduled','Rejected','Accepted','pending') DEFAULT 'Under Review',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `applied_at` datetime DEFAULT current_timestamp(),
  `resume` varchar(255) DEFAULT NULL,
  `cover_letter` text DEFAULT NULL,
  `experience` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `education` text DEFAULT NULL,
  `skills` text DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `job_applications`
--

INSERT INTO `job_applications` (`id`, `jobseeker_id`, `job_id`, `applicant_name`, `email`, `status`, `created_at`, `updated_at`, `applied_at`, `resume`, `cover_letter`, `experience`, `phone`, `education`, `skills`) VALUES
(1, 54, 1, 'Employee', 'employee@gmail.com', 'Under Review', '2026-01-07 12:29:11', '2026-01-07 12:29:11', '2026-01-07 12:29:11', 'uploads/file-1767769151268-50530237.pdf', 'dkjhkj', NULL, '5467364567', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `job_seekers`
--

CREATE TABLE `job_seekers` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `skills` text DEFAULT NULL,
  `experience` varchar(255) DEFAULT NULL,
  `education` varchar(255) DEFAULT NULL,
  `current_company` varchar(255) DEFAULT NULL,
  `level` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `user_id` int(11) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `job_seekers`
--

INSERT INTO `job_seekers` (`id`, `name`, `email`, `phone`, `skills`, `experience`, `education`, `current_company`, `level`, `created_at`, `user_id`, `location`) VALUES
(1, 'jobseeker', 'job@gmail.com', '123456789', 'sdfgh', '3', 'wert', 'sdfgh', 'Senior', '2026-01-04 16:36:17', 34, NULL),
(2, 'Yash sonwane', 'admin@gmail.com', '07415454810', 'fghj', '1', 'fghj', 'PIEMR', 'Mid-level', '2026-01-04 16:36:55', 29, NULL),
(3, 'ven', 'ven@gmail.com', '23456432342', 'safsa', '3', 'sfaf', 'asdas', 'Senior', '2026-01-05 09:37:30', NULL, NULL),
(4, 'job', 'job@gmail.com', '5467865467', 'React,NodeJS,MySQL', '[object Object]', '[object Object]', NULL, 'Job Seeker', '2026-01-06 05:48:02', 36, 'Remote');

-- --------------------------------------------------------

--
-- Table structure for table `job_seeker_education`
--

CREATE TABLE `job_seeker_education` (
  `id` int(11) NOT NULL,
  `job_seeker_id` int(11) NOT NULL,
  `degree` varchar(100) DEFAULT NULL,
  `school_name` varchar(200) DEFAULT NULL,
  `institution` varchar(200) DEFAULT NULL,
  `field_of_study` varchar(100) DEFAULT NULL,
  `start_year` int(11) DEFAULT NULL,
  `passing_year` int(11) DEFAULT NULL,
  `duration` varchar(100) DEFAULT NULL,
  `grade` varchar(50) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `job_seeker_education`
--

INSERT INTO `job_seeker_education` (`id`, `job_seeker_id`, `degree`, `school_name`, `institution`, `field_of_study`, `start_year`, `passing_year`, `duration`, `grade`, `created_at`) VALUES
(1, 4, 'MS CS', NULL, 'MIT', NULL, NULL, NULL, '2016-2018', NULL, '2026-01-07 13:33:35');

-- --------------------------------------------------------

--
-- Table structure for table `job_seeker_experience`
--

CREATE TABLE `job_seeker_experience` (
  `id` int(11) NOT NULL,
  `job_seeker_id` int(11) NOT NULL,
  `job_title` varchar(100) DEFAULT NULL,
  `company_name` varchar(100) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `duration` varchar(100) DEFAULT NULL,
  `is_current` tinyint(1) DEFAULT 0,
  `description` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `job_seeker_experience`
--

INSERT INTO `job_seeker_experience` (`id`, `job_seeker_id`, `job_title`, `company_name`, `start_date`, `end_date`, `duration`, `is_current`, `description`, `created_at`) VALUES
(1, 4, 'Senior Dev', 'Tech Inc', NULL, NULL, '2020-2023', 0, 'Lead team', '2026-01-07 13:33:35'),
(2, 4, 'Junior Dev', 'StartUp', NULL, NULL, '2018-2020', 0, 'Coded stuff', '2026-01-07 13:33:35');

-- --------------------------------------------------------

--
-- Table structure for table `job_seeker_profiles`
--

CREATE TABLE `job_seeker_profiles` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `professional_summary` text DEFAULT NULL,
  `job_industry` varchar(100) DEFAULT NULL,
  `preferred_location` varchar(100) DEFAULT NULL,
  `visibility` enum('visible','hidden') DEFAULT 'visible',
  `salary_expectation` varchar(100) DEFAULT NULL,
  `skills` text DEFAULT NULL,
  `experience` varchar(100) DEFAULT NULL,
  `education` varchar(200) DEFAULT NULL,
  `current_company` varchar(150) DEFAULT NULL,
  `level` varchar(50) DEFAULT NULL,
  `resume_url` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `job_seeker_profiles`
--

INSERT INTO `job_seeker_profiles` (`id`, `user_id`, `professional_summary`, `job_industry`, `preferred_location`, `visibility`, `salary_expectation`, `skills`, `experience`, `education`, `current_company`, `level`, `resume_url`) VALUES
(1, 36, 'Experienced developer with focus on React.', 'IT', 'Remote', 'visible', '150000', 'React, Node.js', '2 Years', 'B.Tech', 'Tech Corp', 'Mid-level', NULL),
(2, 53, NULL, NULL, NULL, 'visible', NULL, 'react,pyhton,html,css', '2', 'btech', 'Pta_nhi', 'Senior', NULL),
(3, 56, NULL, NULL, NULL, 'visible', NULL, 'lkkjlhj', '1', 'gfgf', 'guy', 'Mid-level', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `job_seeker_skills`
--

CREATE TABLE `job_seeker_skills` (
  `id` int(11) NOT NULL,
  `job_seeker_id` int(11) NOT NULL,
  `skill_name` varchar(100) NOT NULL,
  `proficiency` enum('beginner','intermediate','expert') DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `job_vacancies`
--

CREATE TABLE `job_vacancies` (
  `id` int(11) NOT NULL,
  `company_id` int(11) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `department` varchar(255) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `salary_min` decimal(10,2) DEFAULT NULL,
  `salary_max` decimal(10,2) DEFAULT NULL,
  `employer_name` varchar(255) DEFAULT 'Internal',
  `job_type` varchar(100) DEFAULT NULL,
  `experience_required` varchar(100) DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `skills` text DEFAULT NULL,
  `level` varchar(100) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'Active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `job_vacancies`
--

INSERT INTO `job_vacancies` (`id`, `company_id`, `title`, `department`, `location`, `description`, `salary_min`, `salary_max`, `employer_name`, `job_type`, `experience_required`, `expiry_date`, `skills`, `level`, `status`, `created_at`) VALUES
(1, 1, 'Senior frontend', 'Engineering', 'Mumbai, Maharashtra', 'hjhgh', 80000.00, NULL, 'Employer', 'Full-time', '2', '2026-02-07', 'jhgjsdhg', 'Mid-level', 'Active', '2026-01-07 05:16:09');

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` int(11) NOT NULL,
  `invoice_id` int(11) DEFAULT NULL,
  `employer_id` int(11) DEFAULT NULL,
  `amount` decimal(10,2) DEFAULT NULL,
  `payment_method` varchar(50) DEFAULT NULL,
  `payment_reference` varchar(100) DEFAULT NULL,
  `transaction_id` varchar(100) DEFAULT NULL,
  `payment_date` date DEFAULT NULL,
  `status` varchar(20) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `notes` text DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `payments`
--

INSERT INTO `payments` (`id`, `invoice_id`, `employer_id`, `amount`, `payment_method`, `payment_reference`, `transaction_id`, `payment_date`, `status`, `created_at`, `updated_at`, `notes`) VALUES
(1, 1, 1, 2999.00, 'Manual Approval', NULL, NULL, '2026-01-07', 'success', '2026-01-07 10:37:34', '2026-01-07 10:37:34', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `payment_gateways`
--

CREATE TABLE `payment_gateways` (
  `id` int(11) NOT NULL,
  `company_id` int(11) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `api_key` varchar(255) DEFAULT NULL,
  `webhook_url` varchar(255) DEFAULT NULL,
  `transaction_fee` varchar(50) DEFAULT NULL,
  `supported_methods` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `status` varchar(50) DEFAULT 'Active',
  `logo` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payment_setups`
--

CREATE TABLE `payment_setups` (
  `id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `provider` varchar(50) NOT NULL COMMENT 'bank_transfer, stripe, razorpay',
  `config` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `active` tinyint(1) DEFAULT 1,
  `created_by` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `payment_setups`
--

INSERT INTO `payment_setups` (`id`, `company_id`, `provider`, `config`, `active`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 1, 'bank_transfer', '{\"bank_name\":\"SBI\",\"account_number\":\"2546478759876\",\"ifsc_code\":\"SBI876564\",\"branch\":\"indore\"}', 1, 51, '2026-01-07 10:41:57', '2026-03-14 11:28:18'),
(2, 2, 'bank_transfer', '{\"bank_name\":\"vbnm,\",\"account_number\":\"23456789\",\"ifsc_code\":\"456789\",\"branch\":\"87654\"}', 1, 51, '2026-01-07 16:12:49', '2026-03-14 11:27:39');

-- --------------------------------------------------------

--
-- Table structure for table `plans`
--

CREATE TABLE `plans` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `duration_months` int(11) NOT NULL DEFAULT 1,
  `description` text DEFAULT NULL,
  `features` text DEFAULT NULL,
  `max_employees` int(11) DEFAULT NULL,
  `max_jobs` int(11) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `plans`
--

INSERT INTO `plans` (`id`, `name`, `price`, `duration_months`, `description`, `features`, `max_employees`, `max_jobs`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Basic', 8.99, 1, 'Perfect for small businesses', '[\"employee\"]', 20, NULL, 1, '2026-01-02 18:04:03', '2026-01-08 13:04:48'),
(2, 'Professional', 24.99, 1, 'For growing companies', '[\"employee\",\"jobPortal\"]', 40, NULL, 1, '2026-01-02 18:04:03', '2026-01-08 13:05:14'),
(3, 'Enterprise', 87.99, 1, 'For large organizations', '[\"employee\",\"jobPortal\"]', 50, NULL, 1, '2026-01-02 18:04:03', '2026-01-08 13:05:31'),
(4, 'Other', 124.99, 1, '', '[\"employee\",\"jobPortal\",\"vendor\"]', NULL, NULL, 1, '2026-01-08 13:06:16', '2026-01-08 13:06:16');

-- --------------------------------------------------------

--
-- Table structure for table `posts`
--

CREATE TABLE `posts` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `author_id` int(11) NOT NULL,
  `status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
  `image_url` varchar(500) DEFAULT NULL,
  `tags` varchar(500) DEFAULT NULL,
  `views` int(11) DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `posts`
--

INSERT INTO `posts` (`id`, `title`, `content`, `author_id`, `status`, `image_url`, `tags`, `views`, `created_at`, `updated_at`) VALUES
(1, 'Welcome to Our Platform', 'This is a sample post to demonstrate the posts functionality. You can create, read, update, and delete posts using our API.', 1, 'published', NULL, 'welcome,introduction,platform', 0, '2026-01-03 14:24:40', '2026-01-03 14:24:40'),
(2, 'Getting Started Guide', 'Learn how to use our platform effectively. This guide will walk you through all the essential features and help you get started quickly.', 1, 'published', NULL, 'guide,tutorial,getting-started', 0, '2026-01-03 14:24:40', '2026-01-03 14:24:40'),
(3, 'Draft Post Example', 'This is a draft post that is not yet published. Only the author can see this post.', 1, 'draft', NULL, 'draft,example', 0, '2026-01-03 14:24:40', '2026-01-03 14:24:40');

-- --------------------------------------------------------

--
-- Table structure for table `resumes`
--

CREATE TABLE `resumes` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `file_path` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `title` varchar(200) DEFAULT 'My Resume',
  `is_default` tinyint(1) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `resume_data` longtext DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `resumes`
--

INSERT INTO `resumes` (`id`, `user_id`, `file_path`, `created_at`, `updated_at`, `title`, `is_default`, `is_active`, `resume_data`) VALUES
(1, 36, 'uploads/file-1767678886202-761400050.pdf', '2026-01-06 11:24:46', '2026-01-07 13:30:42', 'job - Resume', 0, 1, '{\"name\":\"job\",\"email\":\"job@gmail.com\",\"phone\":\"1234554321\",\"skills\":\"react,pyhton,html,css\",\"experience\":\"jhgdshh hjdshajf hjjhjhdfsa jhkljhljhfdsakjhkjh dfshkhsd  h jhdj  jhjosdah jhjsadhoh hjhjsdf\"}'),
(2, 54, 'uploads/file-1767769151268-50530237.pdf', '2026-01-07 12:29:11', '2026-01-07 12:29:11', 'CRM.pdf', 1, 1, NULL),
(3, 36, 'uploads/file-1767772842150-882405298.pdf', '2026-01-07 13:30:42', '2026-01-07 13:30:42', 'job - Resume', 1, 1, '{\"name\":\"job\",\"email\":\"job@gmail.com\",\"phone\":\"5467865467\",\"skills\":\"ertyuioyg uusd u us uh\",\"experience\":\"gfjhg jhgjgs uouhs iuou souh us houhs jhuhs\"}');

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id` int(11) NOT NULL,
  `name` varchar(50) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `salary_records`
--

CREATE TABLE `salary_records` (
  `id` int(11) NOT NULL,
  `employee_id` int(11) DEFAULT NULL,
  `amount` decimal(10,2) DEFAULT NULL,
  `basic_salary` decimal(10,2) DEFAULT NULL,
  `hra` decimal(10,2) DEFAULT NULL,
  `pf` decimal(10,2) DEFAULT NULL,
  `gross_salary` decimal(10,2) DEFAULT NULL,
  `net_salary` decimal(10,2) DEFAULT NULL,
  `month` varchar(20) DEFAULT NULL,
  `year` int(11) DEFAULT NULL,
  `status` varchar(20) DEFAULT NULL,
  `payment_date` datetime DEFAULT NULL,
  `payment_method` varchar(50) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `special_allowance` decimal(10,2) DEFAULT NULL,
  `lta` decimal(10,2) DEFAULT NULL,
  `professional_tax` decimal(10,2) DEFAULT NULL,
  `tds` decimal(10,2) DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `salary_records`
--

INSERT INTO `salary_records` (`id`, `employee_id`, `amount`, `basic_salary`, `hra`, `pf`, `gross_salary`, `net_salary`, `month`, `year`, `status`, `payment_date`, `payment_method`, `notes`, `created_at`, `updated_at`, `special_allowance`, `lta`, `professional_tax`, `tds`) VALUES
(1, 1, 500.00, NULL, NULL, NULL, NULL, NULL, 'January', 2026, 'paid', '2026-01-07 12:35:16', 'bank_transfer', 'Salary payment', '2026-01-07 12:35:16', '2026-01-07 12:35:16', NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `subscriptions`
--

CREATE TABLE `subscriptions` (
  `id` int(11) NOT NULL,
  `employer_id` int(11) NOT NULL,
  `plan_id` int(11) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'pending',
  `auto_renew` tinyint(1) DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `last_reminder_type` varchar(50) DEFAULT NULL,
  `last_reminder_sent_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `subscriptions`
--

INSERT INTO `subscriptions` (`id`, `employer_id`, `plan_id`, `start_date`, `end_date`, `status`, `auto_renew`, `created_at`, `updated_at`, `last_reminder_type`, `last_reminder_sent_at`) VALUES
(1, 1, 2, '2026-01-07', '2026-02-07', 'expired', 1, '2026-01-07 10:36:06', '2026-03-17 00:00:00', NULL, NULL),
(2, 1, 1, '2026-01-07', '2026-02-07', 'expired', 1, '2026-01-07 10:36:38', '2026-01-07 10:37:12', NULL, NULL),
(3, 1, 2, '2026-01-07', '2026-02-07', 'expired', 1, '2026-01-07 10:37:12', '2026-01-07 10:37:34', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `training_courses`
--

CREATE TABLE `training_courses` (
  `id` int(11) NOT NULL,
  `employer_id` int(11) DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `trainer_name` varchar(255) DEFAULT NULL,
  `start_date` datetime DEFAULT NULL,
  `end_date` datetime DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `max_participants` int(11) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'scheduled',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `due_date` datetime DEFAULT NULL,
  `duration` varchar(50) DEFAULT NULL,
  `category` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `training_courses`
--

INSERT INTO `training_courses` (`id`, `employer_id`, `title`, `description`, `trainer_name`, `start_date`, `end_date`, `location`, `max_participants`, `status`, `created_at`, `updated_at`, `due_date`, `duration`, `category`) VALUES
(1, 1, 'Frontend', 'hdgh', 'shri', '2026-01-07 00:00:00', '2026-04-07 00:00:00', NULL, NULL, 'scheduled', '2026-01-07 10:43:21', '2026-01-07 10:44:53', NULL, '3 months', 'Technical');

-- --------------------------------------------------------

--
-- Table structure for table `training_enrollments`
--

CREATE TABLE `training_enrollments` (
  `id` int(11) NOT NULL,
  `training_id` int(11) DEFAULT NULL,
  `employee_id` int(11) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'assigned',
  `check_in_time` datetime DEFAULT NULL,
  `check_out_time` datetime DEFAULT NULL,
  `feedback` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `test_score` int(11) DEFAULT NULL,
  `test_status` varchar(50) DEFAULT 'pending',
  `certificate_url` varchar(255) DEFAULT NULL,
  `certificate_id` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `training_enrollments`
--

INSERT INTO `training_enrollments` (`id`, `training_id`, `employee_id`, `status`, `check_in_time`, `check_out_time`, `feedback`, `created_at`, `updated_at`, `test_score`, `test_status`, `certificate_url`, `certificate_id`) VALUES
(1, 1, 1, 'assigned', NULL, NULL, NULL, '2026-01-07 11:24:58', '2026-01-07 11:24:58', NULL, 'pending', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `transactions`
--

CREATE TABLE `transactions` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `employer_id` int(11) DEFAULT NULL,
  `amount` decimal(10,2) DEFAULT 0.00,
  `type` varchar(50) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `beneficiary` varchar(100) DEFAULT NULL,
  `reference` varchar(100) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'success',
  `account_number` varchar(50) DEFAULT NULL,
  `payment_method` varchar(50) DEFAULT NULL,
  `date` datetime DEFAULT current_timestamp(),
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `transaction_id` varchar(100) DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `transactions`
--

INSERT INTO `transactions` (`id`, `user_id`, `employer_id`, `amount`, `type`, `description`, `beneficiary`, `reference`, `status`, `account_number`, `payment_method`, `date`, `created_at`, `updated_at`, `transaction_id`) VALUES
(1, 51, 1, 5000.00, 'credit', 'Initial Balance', NULL, NULL, 'success', NULL, 'Admin', '2026-01-07 10:41:57', '2026-01-07 10:41:57', '2026-01-07 10:41:57', NULL),
(2, 52, 1, 500.00, 'credit', 'KLKSK', NULL, NULL, 'pending', NULL, NULL, '2026-01-07 11:06:48', '2026-01-07 11:06:48', '2026-01-07 11:06:48', NULL),
(3, 54, 1, 500.00, 'salary', 'Salary payment for Employee', 'Employee', 'SAL - 1 ', 'success', '763546576532', 'bank_transfer', '2026-01-07 12:35:16', '2026-01-07 12:35:16', '2026-01-07 12:35:16', NULL),
(4, 54, 1, 500.00, 'salary_credit', 'Salary received from Employer ', NULL, NULL, 'success', NULL, NULL, '2026-01-07 12:35:16', '2026-01-07 12:35:16', '2026-01-07 12:35:16', NULL),
(5, 55, 1, 500.00, 'vendor_payment', 'fgfgf', 'Vendor', 'VENDOR - 1 -1767769544253 ', 'success', '123456789', 'bank_transfer', '2026-01-07 12:35:44', '2026-01-07 12:35:44', '2026-01-07 12:35:44', NULL),
(6, 51, 2, 500000.00, 'credit', 'Initial Balance', NULL, NULL, 'success', NULL, 'Admin', '2026-01-07 16:12:49', '2026-01-07 16:12:49', '2026-01-07 16:12:49', NULL),
(7, 72, 4, 10000.00, 'credit', 'Salaries payments for 10,000 employees ', NULL, NULL, 'pending', NULL, NULL, '2026-03-16 18:47:52', '2026-03-16 18:47:52', '2026-03-16 18:47:52', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `role` varchar(20) NOT NULL DEFAULT 'jobseeker',
  `company_id` int(11) DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'active',
  `last_login` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `address` text DEFAULT NULL,
  `profile_image` varchar(255) DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `phone`, `password`, `role`, `company_id`, `status`, `last_login`, `created_at`, `updated_at`, `address`, `profile_image`) VALUES
(1, 'Super Admin', 'superadmin@gmail.com', '1111111111', '$2b$10$RuVvkuwUo8ncpVP/yNne8uAokU9O.cS9oRzM0AVoglmFFpgZAx.E.', 'superadmin', NULL, 'active', '2026-09-22 17:30:32', '2026-01-02 18:04:03', '2026-09-22 17:30:32', NULL, NULL),
(36, 'job', 'job@gmail.com', '5467865467', '$2a$12$yq0TSrfx5vg3uI2aPhw.8ORklFkGhPy7sT9d546Y6fNoMND.AJh.2', 'jobseeker', NULL, 'active', '2026-09-11 17:34:18', '2026-01-06 11:17:31', '2026-09-11 17:34:18', NULL, NULL),
(54, 'Employee', 'employee@gmail.com', '5467364567', '$2b$10$tjGEp8TGWHcf67RGJxDD4OKt0HekR2q5PLch3KZgV/qV8rRvVOr7K', 'employee', 1, 'active', '2026-09-11 17:34:10', '2026-01-07 11:23:21', '2026-09-11 17:34:10', NULL, NULL),
(55, 'Vendor', 'vendor@gmail.com', '8978675897', '$2b$10$3TwOhgmc0Wur5yMwfs7DB.KdY10tmCF5U5NNzNGCB/.8FpcD4IobO', 'vendor', 1, 'active', '2026-09-11 17:34:14', '2026-01-07 11:24:21', '2026-09-11 17:34:14', NULL, NULL),
(56, 'fytfyt', 'fhgf@gmail.com', '1234567892', '$2b$10$KjudxnhWkJmazP3dTdzSfOBWEMeYDvVCJFHuCMIi.n3TwawbcVq8u', 'jobseeker', NULL, 'active', NULL, '2026-01-07 16:09:24', '2026-01-07 16:09:24', NULL, NULL),
(57, 'Yash', 'yy@gmail.com', '000000000', '$2b$10$yjcmUTU735YiC/ENUpbQYuWbqX.E9C6/0eylGswfDWKuR0LqEzSIa', 'employer', 1, 'active', NULL, '2026-01-07 16:12:49', '2026-03-14 11:27:39', NULL, NULL),
(58, 'dffdgd', 'fhf@gmail.com', '12345678', '$2b$10$3BtVR1dC4bb9syB7prDuvOIVZQIzYCDJ7TyA3r8yV3lPwlbpx4idC', 'vendor', 1, 'active', NULL, '2026-01-07 16:32:04', '2026-01-07 16:32:45', NULL, NULL),
(59, 'Super Admin', 'superadmin@example.com', NULL, '$2b$10$SN04DpdmtE08vAvRCjosAOPKqXSkLqMAC06QrrRmUOdiI8IX7k7.q', 'superadmin', NULL, 'active', '2026-01-12 12:48:59', '2026-01-12 12:15:34', '2026-01-12 12:48:59', NULL, NULL),
(52, 'Employer', 'employer@gmail.com', '0', '$2b$10$XjjtpaDFhEZnGg9r5EFLzu5mJEXtGsqliecWpBcE1gArMGBanwyJG', 'employer', 1, 'active', '2026-09-11 17:33:56', '2026-01-07 10:41:57', '2026-09-11 17:33:56', NULL, NULL),
(53, 'jobseeker', 'jobseeker@gmail.com', '5463587678', '$2b$10$99F8/RJcrXEPl3BwzbGEbekLtPIkYF2IO7HowkTb3RaPu26Zmq7TK', 'jobseeker', NULL, 'active', NULL, '2026-01-07 10:47:39', '2026-01-07 10:47:39', NULL, NULL),
(51, 'admin', 'admin@gmail.com', '8777453626', '$2b$10$2szGDwiyz6R5bX9Y6xiIj.OpHJfVkTVyaBeteBCetO8nIJC94GOyG', 'admin', 1, 'active', '2026-09-22 17:28:12', '2026-01-07 10:36:06', '2026-09-22 17:28:12', NULL, NULL),
(60, 'test1', 'test@gmail.com', NULL, '$2b$10$iMc.8J5jqb9kSXKnj0E4yuJUgIXmrSXQn.RXxv3XKNP9f9A721AtG', 'employee', NULL, 'active', '2026-03-10 14:42:59', '2026-03-10 14:35:20', '2026-03-10 14:42:59', NULL, NULL),
(61, 'test1', 'test1@gmail.com', NULL, '$2b$10$HWcxbBuZOjtRgc2Lh0caROvyBWSJaLMWIoAdgDGPEcPLkxqW6hzz.', 'employer', NULL, 'active', NULL, '2026-03-10 14:44:58', '2026-03-10 14:44:58', NULL, NULL),
(62, 't1', 't1@gmail.com', NULL, '$2b$10$GNhhoG54ofBBloczICd68eo7.9Sc3yWNtxMste99kgMFAQnRciUBm', 'employee', NULL, 'active', NULL, '2026-03-12 11:28:06', '2026-03-12 11:28:06', NULL, NULL),
(63, 't23', 't23@gmail.com', NULL, '$2b$10$BdTWNhgQ6kQEpAT7QxQBa.3Qni2OBUHQAKB6FX5NnH.7tWAhfpYUW', 'employee', NULL, 'active', NULL, '2026-03-12 13:26:54', '2026-03-12 13:26:54', NULL, NULL),
(64, 'k_employee', 'k@gmail.com', NULL, '$2b$10$2Fuw5LlabszKbz4agIsXUeAWajZnOK1bozfc37R19/5KPMBDgPIZW', 'employee', NULL, 'active', NULL, '2026-03-16 13:30:39', '2026-03-16 13:30:39', NULL, NULL),
(65, 'kk112', 'kk1@gmail.com', NULL, '$2b$10$HLTTIDB1rsDJe9UnP2nW7uZuTBcLYwhoMxoqWpqEoscCRCPl8R0SS', 'employee', NULL, 'active', '2026-03-16 13:34:32', '2026-03-16 13:34:04', '2026-03-16 13:34:32', NULL, NULL),
(66, 'Jay jay', 'jayhay@gmaim.com', NULL, '$2b$10$SnUIlzxTHMGECqsZyxVLnuJvJDZo8RW2FbrAlZUW8sLAXHpqT.o5m', 'jobseeker', NULL, 'active', NULL, '2026-03-16 18:37:57', '2026-03-16 18:37:57', NULL, NULL),
(67, 'Jay jay', 'jayhay@gmail.com', NULL, '$2b$10$w3AnS3duuaf0ebTM8ERwbOVTCxonTmw4Y/3jVddHKEPIhfNG9jdtK', 'jobseeker', NULL, 'active', NULL, '2026-03-16 18:38:26', '2026-03-16 18:38:26', NULL, NULL),
(68, 'Jay jay', 'jayay@gmail.com', NULL, '$2b$10$sq0t35iqwG0uqR.SaYZhv.emqeFhUuYnK3GHNwcHgXCQa7iPxaXlG', 'employee', NULL, 'active', NULL, '2026-03-16 18:38:50', '2026-03-16 18:38:50', NULL, NULL),
(69, 'Joy joy', 'joy101@gmail.com', NULL, '$2b$10$hBmRlQlJ0XKbriRrBe4Vr.nUaj8752bzrdnziMuvNnuwy/PqQpPDa', 'jobseeker', NULL, 'active', NULL, '2026-03-16 18:42:06', '2026-03-16 18:42:06', NULL, NULL),
(70, 'Joy joy', 'joy1012@gmail.com', NULL, '$2b$10$I6D1eM/thQfEkeFwbeyTmu55OurSFtjZuit4BiNU7XQOV4UmACnTa', 'vendor', NULL, 'active', NULL, '2026-03-16 18:42:27', '2026-03-16 18:42:27', NULL, NULL),
(71, 'You', 'you3@gmail.com', NULL, '$2b$10$pKohnHehfgt9YdlkZNJ0.eIyfOcdICmnoRVUuLOw5XBs7oeaodn/O', 'employee', NULL, 'active', NULL, '2026-03-16 18:44:15', '2026-03-16 18:44:15', NULL, NULL),
(72, 'Good', 'good5@gmail.com', NULL, '$2b$10$yHYysbfteFTgn5gc0H6oeOAkzM/LZ.15pOr1KBD0isCuNtB0ttqDG', 'employer', NULL, 'active', NULL, '2026-03-16 18:45:35', '2026-03-16 18:45:35', NULL, NULL),
(73, 'Frie', 'frie@gmail.com', NULL, '$2b$10$bq5prmwOBxbD6.CyXfFNquqWMUYeLvdj3XUhJa6e2kAPw77B5BcEa', 'jobseeker', NULL, 'active', NULL, '2026-03-16 18:52:04', '2026-03-16 18:52:04', NULL, NULL),
(74, 'Frie', 'frire@gmail.com', NULL, '$2b$10$gBze.Ti3y7FYHF7aeJXqm.r2xdTvKGgbxkxiBJp7RSoV861mDakxm', 'jobseeker', NULL, 'active', NULL, '2026-03-16 18:52:27', '2026-03-16 18:52:27', NULL, NULL),
(76, 'XYZ', 'xyz@gmail.com', '3214567654', '$2b$10$bxif0abAAA9L24./xcYHZe5ak9tXysF2U3zDBkFyIrRpo1HvW930q', 'admin', 3, 'active', NULL, '2026-09-22 17:22:07', '2026-09-22 17:26:25', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `user_requests`
--

CREATE TABLE `user_requests` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `address` text NOT NULL,
  `city` varchar(100) NOT NULL,
  `state` varchar(100) NOT NULL,
  `country` varchar(100) NOT NULL,
  `mobile` varchar(20) NOT NULL,
  `request_type` varchar(50) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_requests`
--

INSERT INTO `user_requests` (`id`, `name`, `address`, `city`, `state`, `country`, `mobile`, `request_type`, `created_at`) VALUES
(2, 'Yash sonwane', 'Itwara saliwada', 'Burhanpur', 'Madhya Pradesh', 'India', '123456787', 'jobseekers', '2026-01-12 06:56:09');

-- --------------------------------------------------------

--
-- Table structure for table `vendors`
--

CREATE TABLE `vendors` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `company_id` int(11) DEFAULT NULL,
  `employer_id` int(11) DEFAULT NULL,
  `company_name` varchar(100) DEFAULT NULL,
  `contact_person` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `service_type` varchar(100) DEFAULT NULL,
  `salary` decimal(10,2) DEFAULT 0.00,
  `joining_date` date DEFAULT NULL,
  `payment_status` enum('pending','paid','overdue') DEFAULT 'pending',
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `vendors`
--

INSERT INTO `vendors` (`id`, `user_id`, `company_id`, `employer_id`, `company_name`, `contact_person`, `phone`, `email`, `address`, `service_type`, `salary`, `joining_date`, `payment_status`, `status`, `created_at`, `updated_at`) VALUES
(1, 55, 1, NULL, 'Vendor', 'Vendor', '8978675897', 'vendor@gmail.com', NULL, 'rdyt', 10000.00, '2026-01-07', 'paid', 'active', '2026-01-07 11:24:21', '2026-01-07 12:35:44'),
(2, 58, 1, 1, 'vkjghj', 'vkjghj', '12345678', 'fhf@gmail.com', NULL, 'frontend developer', 5000.00, '2026-01-07', 'pending', 'active', '2026-01-07 16:32:04', '2026-01-07 16:32:04'),
(3, 70, NULL, NULL, 'Joy joy\'s Vendor Company', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, 'pending', 'active', '2026-03-16 18:42:27', '2026-03-16 18:42:27');

-- --------------------------------------------------------

--
-- Table structure for table `vendor_employers`
--

CREATE TABLE `vendor_employers` (
  `id` int(11) NOT NULL,
  `vendor_id` int(11) DEFAULT NULL,
  `employer_id` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admins`
--
ALTER TABLE `admins`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `attendance`
--
ALTER TABLE `attendance`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_attendance` (`user_id`,`date`);

--
-- Indexes for table `attendances`
--
ALTER TABLE `attendances`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `bank_details`
--
ALTER TABLE `bank_details`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `beneficiaries`
--
ALTER TABLE `beneficiaries`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `billing_companies`
--
ALTER TABLE `billing_companies`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `bills`
--
ALTER TABLE `bills`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_employer` (`employer_id`),
  ADD KEY `idx_employee` (`employee_id`);

--
-- Indexes for table `companies`
--
ALTER TABLE `companies`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_companies_admin_id` (`admin_id`);

--
-- Indexes for table `company_bank_accounts`
--
ALTER TABLE `company_bank_accounts`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `company_requests`
--
ALTER TABLE `company_requests`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `course_assignments`
--
ALTER TABLE `course_assignments`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `course_materials`
--
ALTER TABLE `course_materials`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `credits`
--
ALTER TABLE `credits`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `employer_id` (`employer_id`);

--
-- Indexes for table `credit_transactions`
--
ALTER TABLE `credit_transactions`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `employees`
--
ALTER TABLE `employees`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user` (`user_id`),
  ADD KEY `idx_company` (`company_id`);

--
-- Indexes for table `employers`
--
ALTER TABLE `employers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user` (`user_id`),
  ADD KEY `idx_company` (`company_id`);

--
-- Indexes for table `employer_wallets`
--
ALTER TABLE `employer_wallets`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_employer` (`employer_id`);

--
-- Indexes for table `invoices`
--
ALTER TABLE `invoices`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `jobs`
--
ALTER TABLE `jobs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `job_applications`
--
ALTER TABLE `job_applications`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `job_seekers`
--
ALTER TABLE `job_seekers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`),
  ADD UNIQUE KEY `uq_user_id` (`user_id`);

--
-- Indexes for table `job_seeker_education`
--
ALTER TABLE `job_seeker_education`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_js_edu` (`job_seeker_id`);

--
-- Indexes for table `job_seeker_experience`
--
ALTER TABLE `job_seeker_experience`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_js_exp` (`job_seeker_id`);

--
-- Indexes for table `job_seeker_profiles`
--
ALTER TABLE `job_seeker_profiles`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `job_seeker_skills`
--
ALTER TABLE `job_seeker_skills`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_js_skill` (`job_seeker_id`);

--
-- Indexes for table `job_vacancies`
--
ALTER TABLE `job_vacancies`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `payment_gateways`
--
ALTER TABLE `payment_gateways`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `payment_setups`
--
ALTER TABLE `payment_setups`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_company` (`company_id`);

--
-- Indexes for table `plans`
--
ALTER TABLE `plans`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `posts`
--
ALTER TABLE `posts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_author` (`author_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_created` (`created_at`);

--
-- Indexes for table `resumes`
--
ALTER TABLE `resumes`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `salary_records`
--
ALTER TABLE `salary_records`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `subscriptions`
--
ALTER TABLE `subscriptions`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `training_courses`
--
ALTER TABLE `training_courses`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `training_enrollments`
--
ALTER TABLE `training_enrollments`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `transactions`
--
ALTER TABLE `transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_employer` (`employer_id`),
  ADD KEY `idx_user` (`user_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_email` (`email`);

--
-- Indexes for table `user_requests`
--
ALTER TABLE `user_requests`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `vendors`
--
ALTER TABLE `vendors`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user` (`user_id`),
  ADD KEY `idx_company` (`company_id`);

--
-- Indexes for table `vendor_employers`
--
ALTER TABLE `vendor_employers`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admins`
--
ALTER TABLE `admins`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `attendance`
--
ALTER TABLE `attendance`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `attendances`
--
ALTER TABLE `attendances`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `bank_details`
--
ALTER TABLE `bank_details`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `beneficiaries`
--
ALTER TABLE `beneficiaries`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `billing_companies`
--
ALTER TABLE `billing_companies`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `bills`
--
ALTER TABLE `bills`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `companies`
--
ALTER TABLE `companies`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `company_bank_accounts`
--
ALTER TABLE `company_bank_accounts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `company_requests`
--
ALTER TABLE `company_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `course_assignments`
--
ALTER TABLE `course_assignments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `course_materials`
--
ALTER TABLE `course_materials`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `credits`
--
ALTER TABLE `credits`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `credit_transactions`
--
ALTER TABLE `credit_transactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `employees`
--
ALTER TABLE `employees`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `employers`
--
ALTER TABLE `employers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `employer_wallets`
--
ALTER TABLE `employer_wallets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `invoices`
--
ALTER TABLE `invoices`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `jobs`
--
ALTER TABLE `jobs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `job_applications`
--
ALTER TABLE `job_applications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `job_seekers`
--
ALTER TABLE `job_seekers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `job_seeker_education`
--
ALTER TABLE `job_seeker_education`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `job_seeker_experience`
--
ALTER TABLE `job_seeker_experience`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `job_seeker_profiles`
--
ALTER TABLE `job_seeker_profiles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `job_seeker_skills`
--
ALTER TABLE `job_seeker_skills`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `job_vacancies`
--
ALTER TABLE `job_vacancies`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `payment_gateways`
--
ALTER TABLE `payment_gateways`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `payment_setups`
--
ALTER TABLE `payment_setups`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `plans`
--
ALTER TABLE `plans`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `posts`
--
ALTER TABLE `posts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `resumes`
--
ALTER TABLE `resumes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `salary_records`
--
ALTER TABLE `salary_records`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `subscriptions`
--
ALTER TABLE `subscriptions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `training_courses`
--
ALTER TABLE `training_courses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `training_enrollments`
--
ALTER TABLE `training_enrollments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `transactions`
--
ALTER TABLE `transactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=77;

--
-- AUTO_INCREMENT for table `user_requests`
--
ALTER TABLE `user_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `vendors`
--
ALTER TABLE `vendors`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `vendor_employers`
--
ALTER TABLE `vendor_employers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `job_seeker_education`
--
ALTER TABLE `job_seeker_education`
  ADD CONSTRAINT `fk_edu_js` FOREIGN KEY (`job_seeker_id`) REFERENCES `job_seekers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `job_seeker_experience`
--
ALTER TABLE `job_seeker_experience`
  ADD CONSTRAINT `fk_exp_js` FOREIGN KEY (`job_seeker_id`) REFERENCES `job_seekers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `job_seeker_skills`
--
ALTER TABLE `job_seeker_skills`
  ADD CONSTRAINT `fk_skill_js` FOREIGN KEY (`job_seeker_id`) REFERENCES `job_seekers` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
