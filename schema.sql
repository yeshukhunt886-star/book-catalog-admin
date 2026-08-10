CREATE DATABASE IF NOT EXISTS book_catalog
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE book_catalog;

-- =====================================================
-- ADMINS
-- =====================================================

CREATE TABLE IF NOT EXISTS admins (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin') NOT NULL DEFAULT 'admin',
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);

-- =====================================================
-- AUTHORS
-- =====================================================

CREATE TABLE IF NOT EXISTS authors (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    open_library_key VARCHAR(255) NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_authors_name (name)
);

-- =====================================================
-- SUBJECTS
-- =====================================================

CREATE TABLE IF NOT EXISTS subjects (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY unique_subject_name (name),
    INDEX idx_subjects_name (name)
);

-- =====================================================
-- BOOKS
-- =====================================================

CREATE TABLE IF NOT EXISTS books (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    open_library_key VARCHAR(255) NULL UNIQUE,

    title VARCHAR(500) NOT NULL,

    subtitle VARCHAR(500) NULL,

    isbn10 VARCHAR(20) NULL,
    isbn13 VARCHAR(20) NULL,

    publisher VARCHAR(500) NULL,

    publish_date VARCHAR(100) NULL,

    first_publish_year INT NULL,

    language VARCHAR(100) NULL,

    description TEXT NULL,

    cover_url VARCHAR(1000) NULL,

    page_count INT NULL,

    data_source VARCHAR(100) DEFAULT 'Open Library',

    data_quality_score DECIMAL(5,2) DEFAULT 0.00,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY unique_isbn10 (isbn10),

    UNIQUE KEY unique_isbn13 (isbn13),

    INDEX idx_books_title (title),

    INDEX idx_books_publisher (publisher),

    INDEX idx_books_publish_year (first_publish_year)
);

-- =====================================================
-- BOOK AUTHORS
-- =====================================================

CREATE TABLE IF NOT EXISTS book_authors (
    book_id INT UNSIGNED NOT NULL,
    author_id INT UNSIGNED NOT NULL,

    PRIMARY KEY (book_id, author_id),

    CONSTRAINT fk_book_authors_book
        FOREIGN KEY (book_id)
        REFERENCES books(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_book_authors_author
        FOREIGN KEY (author_id)
        REFERENCES authors(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- =====================================================
-- BOOK SUBJECTS
-- =====================================================

CREATE TABLE IF NOT EXISTS book_subjects (
    book_id INT UNSIGNED NOT NULL,
    subject_id INT UNSIGNED NOT NULL,

    PRIMARY KEY (book_id, subject_id),

    CONSTRAINT fk_book_subjects_book
        FOREIGN KEY (book_id)
        REFERENCES books(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_book_subjects_subject
        FOREIGN KEY (subject_id)
        REFERENCES subjects(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- =====================================================
-- IMPORT JOBS
-- =====================================================

CREATE TABLE IF NOT EXISTS import_jobs (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    admin_id INT UNSIGNED NULL,

    requested_count INT NOT NULL DEFAULT 0,

    processed_count INT NOT NULL DEFAULT 0,

    imported_count INT NOT NULL DEFAULT 0,

    updated_count INT NOT NULL DEFAULT 0,

    skipped_count INT NOT NULL DEFAULT 0,

    failed_count INT NOT NULL DEFAULT 0,

    status ENUM(
        'pending',
        'running',
        'completed',
        'failed',
        'cancelled'
    ) NOT NULL DEFAULT 'pending',

    error_message TEXT NULL,

    started_at DATETIME NULL,

    completed_at DATETIME NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_import_jobs_admin
        FOREIGN KEY (admin_id)
        REFERENCES admins(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    INDEX idx_import_jobs_status (status),

    INDEX idx_import_jobs_created (created_at)
);

-- =====================================================
-- IMPORT JOB LOGS
-- =====================================================

CREATE TABLE IF NOT EXISTS import_job_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    import_job_id INT UNSIGNED NOT NULL,

    level ENUM(
        'info',
        'success',
        'warning',
        'error'
    ) NOT NULL DEFAULT 'info',

    message TEXT NOT NULL,

    processed_count INT DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_import_job_logs_job
        FOREIGN KEY (import_job_id)
        REFERENCES import_jobs(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    INDEX idx_import_job_logs_job (import_job_id),

    INDEX idx_import_job_logs_created (created_at)
);