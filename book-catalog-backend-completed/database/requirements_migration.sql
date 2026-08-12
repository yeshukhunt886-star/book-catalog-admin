-- Run once against the existing book_catalog database.
CREATE TABLE IF NOT EXISTS import_errors (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    import_job_id BIGINT UNSIGNED NOT NULL,
    record_identifier VARCHAR(255) NULL,
    error_message TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_import_errors_job_id (import_job_id),
    CONSTRAINT fk_import_errors_job FOREIGN KEY (import_job_id)
        REFERENCES import_jobs(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Add these only if the same unique keys do not already exist.
ALTER TABLE books ADD UNIQUE KEY uq_books_open_library_key (open_library_key);
ALTER TABLE authors ADD UNIQUE KEY uq_authors_name (name);
ALTER TABLE subjects ADD UNIQUE KEY uq_subjects_name (name);
ALTER TABLE book_authors ADD UNIQUE KEY uq_book_authors (book_id, author_id);
ALTER TABLE book_subjects ADD UNIQUE KEY uq_book_subjects (book_id, subject_id);

CREATE INDEX idx_books_title ON books(title);
CREATE INDEX idx_books_publish_year ON books(first_publish_year);
CREATE INDEX idx_books_isbn10 ON books(isbn10);
CREATE INDEX idx_books_isbn13 ON books(isbn13);
CREATE INDEX idx_authors_name ON authors(name);
CREATE INDEX idx_subjects_name ON subjects(name);
CREATE INDEX idx_import_jobs_status ON import_jobs(status);
CREATE INDEX idx_import_jobs_created_at ON import_jobs(created_at);
