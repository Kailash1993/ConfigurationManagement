package database

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/lib/pq"
)

type DB struct {
	*sql.DB
}

// NewConnection creates a new database connection
func NewConnection() (*DB, error) {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		return nil, fmt.Errorf("DATABASE_URL environment variable is required")
	}

	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	log.Println("Database connection established")
	return &DB{db}, nil
}

// Close closes the database connection
func (db *DB) Close() error {
	return db.DB.Close()
}

// RunMigrations executes database migrations
func (db *DB) RunMigrations() error {
	migrations := []string{
		`CREATE TABLE IF NOT EXISTS config_nodes (
			id BIGSERIAL PRIMARY KEY,
			name VARCHAR(255) NOT NULL,
			node_type VARCHAR(50) NOT NULL CHECK (node_type IN ('territory', 'center')),
			parent_id BIGINT REFERENCES config_nodes(id) ON DELETE CASCADE,
			description TEXT DEFAULT '',
			created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS config_properties (
			id BIGSERIAL PRIMARY KEY,
			node_id BIGINT NOT NULL REFERENCES config_nodes(id) ON DELETE CASCADE,
			key VARCHAR(255) NOT NULL,
			value TEXT NOT NULL,
			data_type VARCHAR(50) NOT NULL CHECK (data_type IN ('string', 'number', 'boolean', 'object', 'array', 'null')),
			default_value TEXT,
			description TEXT DEFAULT '',
			created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
			UNIQUE(node_id, key)
		)`,
		`CREATE INDEX IF NOT EXISTS idx_config_nodes_parent_id ON config_nodes(parent_id)`,
		`CREATE INDEX IF NOT EXISTS idx_config_nodes_node_type ON config_nodes(node_type)`,
		`CREATE INDEX IF NOT EXISTS idx_config_properties_node_id ON config_properties(node_id)`,
		`CREATE INDEX IF NOT EXISTS idx_config_properties_key ON config_properties(key)`,
	}

	for _, migration := range migrations {
		if _, err := db.Exec(migration); err != nil {
			return fmt.Errorf("failed to execute migration: %w", err)
		}
	}

	log.Println("Database migrations completed successfully")
	return nil
}