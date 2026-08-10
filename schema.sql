-- =====================================================
-- BOOK CATALOG DATA IMPORT ADMIN PORTAL
-- DATABASE SCHEMA
-- =====================================================

CREATE DATABASE IF NOT EXISTS book_catalog
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE book_catalog;


-- =====================================================
-- 1. ADMINS
-- =====================================================

CREATE TABLE IF NOT EXISTS admins (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(100) NOT NULL,

    email VARCHAR(150) NOT NULL UNIQUE,

    password VARCHAR(255) NOT NULL,

    role ENUM('admin') NOT NULL DEFAULT 'admin',

    status ENUM(
        'active',
        'inactive'
    ) NOT NULL DEFAULT 'active',

    last_login_at DATETIME NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_admin_email (email),

    INDEX idx_admin_status (status)
);


-- =====================================================
-- 2. AUTHORS
-- =====================================================

CREATE TABLE IF NOT EXISTS authors (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(255) NOT NULL,

    open_library_key VARCHAR(255) NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uq_author_open_library_key (
        open_library_key
    ),

    INDEX idx_author_name (name)
);


-- =====================================================
-- 3. SUBJECTS
-- =====================================================

CREATE TABLE IF NOT EXISTS subjects (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(255) NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uq_subject_name (name),

    INDEX idx_subject_name (name)
);


-- =====================================================
-- 4. BOOKS
-- =====================================================

CREATE TABLE IF NOT EXISTS books (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    open_library_key VARCHAR(255) NULL,

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

    data_source VARCHAR(100)
        DEFAULT 'Open Library',

    data_quality_score DECIMAL(5,2)
        DEFAULT 0.00,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uq_book_open_library_key (
        open_library_key
    ),

    UNIQUE KEY uq_book_isbn10 (
        isbn10
    ),

    UNIQUE KEY uq_book_isbn13 (
        isbn13
    ),

    INDEX idx_book_title (title),

    INDEX idx_book_publisher (publisher),

    INDEX idx_book_publish_year (
        first_publish_year
    ),

    INDEX idx_book_data_source (
        data_source
    ),

    INDEX idx_book_quality (
        data_quality_score
    )
);


-- =====================================================
-- 5. BOOK AUTHORS
-- MANY-TO-MANY
-- =====================================================

CREATE TABLE IF NOT EXISTS book_authors (
    book_id INT UNSIGNED NOT NULL,

    author_id INT UNSIGNED NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (
        book_id,
        author_id
    ),

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
-- 6. BOOK SUBJECTS
-- MANY-TO-MANY
-- =====================================================

CREATE TABLE IF NOT EXISTS book_subjects (
    book_id INT UNSIGNED NOT NULL,

    subject_id INT UNSIGNED NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (
        book_id,
        subject_id
    ),

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
-- 7. IMPORT JOBS
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

    updated_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_import_jobs_admin
        FOREIGN KEY (admin_id)
        REFERENCES admins(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    INDEX idx_import_status (
        status
    ),

    INDEX idx_import_admin (
        admin_id
    ),

    INDEX idx_import_created (
        created_at
    )
);


-- =====================================================
-- 8. IMPORT JOB LOGS
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

    CONSTRAINT fk_import_logs_job
        FOREIGN KEY (import_job_id)
        REFERENCES import_jobs(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    INDEX idx_import_logs_job (
        import_job_id
    ),

    INDEX idx_import_logs_level (
        level
    ),

    INDEX idx_import_logs_created (
        created_at
    )
);


-- =====================================================
-- 9. AUDIT LOGS
-- =====================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    admin_id INT UNSIGNED NULL,

    action VARCHAR(100) NOT NULL,

    entity_type VARCHAR(100) NULL,

    entity_id INT UNSIGNED NULL,

    description TEXT NULL,

    ip_address VARCHAR(45) NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_audit_logs_admin
        FOREIGN KEY (admin_id)
        REFERENCES admins(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    INDEX idx_audit_admin (
        admin_id
    ),

    INDEX idx_audit_action (
        action
    ),

    INDEX idx_audit_entity (
        entity_type,
        entity_id
    ),

    INDEX idx_audit_created (
        created_at
    )
);