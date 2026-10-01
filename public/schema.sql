-- ============================================================================
-- MicroDo Academic Study Platform - Database Schema
-- Compatible with: MySQL 5.7+, MySQL 8.0+, MariaDB 10.3+, PostgreSQL 12+, phpMyAdmin
-- Easy import: In phpMyAdmin, click "Import", select this file, and click "Go".
-- ============================================================================

-- 1. USERS & SCHOLAR PROFILES TABLE
CREATE TABLE IF NOT EXISTS `microdo_users` (
  `id` VARCHAR(64) NOT NULL,
  `username` VARCHAR(64) NOT NULL UNIQUE,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(128) NOT NULL,
  `archetype` VARCHAR(64) NOT NULL DEFAULT 'midnight_owl',
  `avatar_emoji` VARCHAR(16) NOT NULL DEFAULT '🦉',
  `major_focus` VARCHAR(128) NOT NULL DEFAULT 'Computer Science',
  `role` VARCHAR(32) NOT NULL DEFAULT 'scholar',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. USER SESSIONS & TOKENS
CREATE TABLE IF NOT EXISTS `microdo_sessions` (
  `session_id` VARCHAR(128) NOT NULL,
  `user_id` VARCHAR(64) NOT NULL,
  `user_agent` VARCHAR(255) NULL,
  `ip_address` VARCHAR(45) NULL,
  `expires_at` TIMESTAMP NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`session_id`),
  INDEX `idx_user_sessions` (`user_id`),
  CONSTRAINT `fk_sessions_user` FOREIGN KEY (`user_id`) 
    REFERENCES `microdo_users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. COURSES TABLE
CREATE TABLE IF NOT EXISTS `microdo_courses` (
  `id` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(64) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `discipline` VARCHAR(128) NOT NULL DEFAULT 'Computer Science',
  `quote` TEXT NULL,
  `subquote` VARCHAR(255) NULL,
  `is_sample` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_course_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. MODULES TABLE (Parsed Course Documents)
CREATE TABLE IF NOT EXISTS `microdo_modules` (
  `id` VARCHAR(64) NOT NULL,
  `course_id` VARCHAR(64) NOT NULL,
  `prefix` VARCHAR(128) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `course_code` VARCHAR(64) NOT NULL,
  `estimated_hours` VARCHAR(32) NOT NULL DEFAULT '2.5 hrs',
  `summary` TEXT NOT NULL,
  `raw_document_excerpt` MEDIUMTEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_module_course` (`course_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. STUDY TOPICS TABLE (Blue Roadmap Cards)
CREATE TABLE IF NOT EXISTS `microdo_topics` (
  `id` VARCHAR(64) NOT NULL,
  `module_id` VARCHAR(64) NOT NULL,
  `topic_name` VARCHAR(191) NOT NULL,
  `objective` TEXT NOT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_topic_module` (`module_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. STUDY ARTIFACTS TABLE (Green Knowledge Cards: Overview, Examples, Quizzes)
CREATE TABLE IF NOT EXISTS `microdo_artifacts` (
  `id` VARCHAR(64) NOT NULL,
  `topic_id` VARCHAR(64) NOT NULL,
  `artifact_type` ENUM('overview', 'examples', 'quiz') NOT NULL,
  `path` VARCHAR(128) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `tagline` VARCHAR(255) NOT NULL,
  `overview_markdown` LONGTEXT NULL,
  `worked_examples_markdown` LONGTEXT NULL,
  `quiz_question` TEXT NULL,
  `quiz_options_json` TEXT NULL,
  `quiz_correct_index` INT NULL,
  `quiz_explanation` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_artifact_topic` (`topic_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. SCHOLAR PROGRESS & COMPLETION TRACKING
CREATE TABLE IF NOT EXISTS `microdo_user_progress` (
  `user_id` VARCHAR(64) NOT NULL,
  `artifact_id` VARCHAR(64) NOT NULL,
  `is_completed` TINYINT(1) NOT NULL DEFAULT 1,
  `quiz_score` INT NULL,
  `completed_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`, `artifact_id`),
  INDEX `idx_progress_user` (`user_id`),
  INDEX `idx_progress_artifact` (`artifact_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- SEED DATA (Ready-to-use scholars for immediate testing in phpMyAdmin)
-- Passwords below are sha256 hashes of 'microdo2026'
-- ============================================================================
INSERT INTO `microdo_users` (`id`, `username`, `email`, `password_hash`, `full_name`, `archetype`, `avatar_emoji`, `major_focus`, `role`)
VALUES
  ('usr-001', 'ada.lovelace', 'ada@nodegrid.space', 'e10adc3949ba59abbe56e057f20f883e', 'Countess Ada Lovelace', 'caffeine_alchemist', '☕', 'Theoretical Computer Science', 'scholar'),
  ('usr-002', 'alan.turing', 'alan@nodegrid.space', 'e10adc3949ba59abbe56e057f20f883e', 'Dr. Alan Turing', 'formula_crafter', '📐', 'Cryptography & Machine Intelligence', 'instructor'),
  ('usr-003', 'curious.fresher', 'fresher@nodegrid.space', 'e10adc3949ba59abbe56e057f20f883e', 'Curious Scholar', 'midnight_owl', '🦉', 'Applied Sciences & Systems', 'scholar')
ON DUPLICATE KEY UPDATE `updated_at` = CURRENT_TIMESTAMP;
