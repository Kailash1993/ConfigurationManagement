package database

import (
	"config-manager/internal/models"
	"database/sql"
	"encoding/json"
	"fmt"
	"time"
)

type Repository struct {
	db *DB
}

func NewRepository(db *DB) *Repository {
	return &Repository{db: db}
}

// Node operations
func (r *Repository) CreateNode(req models.CreateNodeRequest) (*models.ConfigNode, error) {
	query := `
		INSERT INTO config_nodes (name, node_type, parent_id, description, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, name, node_type, parent_id, description, created_at, updated_at`
	
	now := time.Now()
	var node models.ConfigNode
	
	err := r.db.QueryRow(query, req.Name, req.NodeType, req.ParentID, req.Description, now, now).Scan(
		&node.ID, &node.Name, &node.NodeType, &node.ParentID, &node.Description, &node.CreatedAt, &node.UpdatedAt,
	)
	
	return &node, err
}

func (r *Repository) GetNodeByID(id int64) (*models.ConfigNode, error) {
	query := `
		SELECT id, name, node_type, parent_id, description, created_at, updated_at
		FROM config_nodes WHERE id = $1`
	
	var node models.ConfigNode
	err := r.db.QueryRow(query, id).Scan(
		&node.ID, &node.Name, &node.NodeType, &node.ParentID, &node.Description, &node.CreatedAt, &node.UpdatedAt,
	)
	
	if err == sql.ErrNoRows {
		return nil, nil
	}
	
	return &node, err
}

func (r *Repository) GetRootNodes() ([]models.ConfigNode, error) {
	query := `
		SELECT id, name, node_type, parent_id, description, created_at, updated_at
		FROM config_nodes WHERE parent_id IS NULL
		ORDER BY created_at DESC`
	
	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	
	var nodes []models.ConfigNode
	for rows.Next() {
		var node models.ConfigNode
		err := rows.Scan(
			&node.ID, &node.Name, &node.NodeType, &node.ParentID, &node.Description, &node.CreatedAt, &node.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		nodes = append(nodes, node)
	}
	
	return nodes, nil
}

func (r *Repository) GetChildNodes(parentID int64) ([]models.ConfigNode, error) {
	query := `
		SELECT id, name, node_type, parent_id, description, created_at, updated_at
		FROM config_nodes WHERE parent_id = $1
		ORDER BY created_at DESC`
	
	rows, err := r.db.Query(query, parentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	
	var nodes []models.ConfigNode
	for rows.Next() {
		var node models.ConfigNode
		err := rows.Scan(
			&node.ID, &node.Name, &node.NodeType, &node.ParentID, &node.Description, &node.CreatedAt, &node.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		nodes = append(nodes, node)
	}
	
	return nodes, nil
}

func (r *Repository) UpdateNode(id int64, req models.UpdateNodeRequest) (*models.ConfigNode, error) {
	query := `
		UPDATE config_nodes 
		SET name = COALESCE($1, name), 
		    description = COALESCE($2, description),
		    updated_at = $3
		WHERE id = $4
		RETURNING id, name, node_type, parent_id, description, created_at, updated_at`
	
	now := time.Now()
	var node models.ConfigNode
	
	err := r.db.QueryRow(query, req.Name, req.Description, now, id).Scan(
		&node.ID, &node.Name, &node.NodeType, &node.ParentID, &node.Description, &node.CreatedAt, &node.UpdatedAt,
	)
	
	if err == sql.ErrNoRows {
		return nil, nil
	}
	
	return &node, err
}

func (r *Repository) DeleteNode(id int64) error {
	query := `DELETE FROM config_nodes WHERE id = $1`
	result, err := r.db.Exec(query, id)
	if err != nil {
		return err
	}
	
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	
	if rowsAffected == 0 {
		return fmt.Errorf("node not found")
	}
	
	return nil
}

// Property operations
func (r *Repository) CreateProperty(nodeID int64, req models.CreatePropertyRequest) (*models.ConfigProperty, error) {
	query := `
		INSERT INTO config_properties (node_id, key, value, data_type, default_value, description, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		ON CONFLICT (node_id, key) 
		DO UPDATE SET 
			value = EXCLUDED.value,
			data_type = EXCLUDED.data_type,
			default_value = EXCLUDED.default_value,
			description = EXCLUDED.description,
			updated_at = EXCLUDED.updated_at
		RETURNING id, node_id, key, value, data_type, default_value, description, created_at, updated_at`
	
	now := time.Now()
	var prop models.ConfigProperty
	
	err := r.db.QueryRow(query, nodeID, req.Key, req.Value, req.DataType, req.DefaultValue, req.Description, now, now).Scan(
		&prop.ID, &prop.NodeID, &prop.Key, &prop.Value, &prop.DataType, &prop.DefaultValue, &prop.Description, &prop.CreatedAt, &prop.UpdatedAt,
	)
	
	return &prop, err
}

func (r *Repository) GetPropertiesByNodeID(nodeID int64) ([]models.ConfigProperty, error) {
	query := `
		SELECT id, node_id, key, value, data_type, default_value, description, created_at, updated_at
		FROM config_properties WHERE node_id = $1
		ORDER BY key`
	
	rows, err := r.db.Query(query, nodeID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	
	var properties []models.ConfigProperty
	for rows.Next() {
		var prop models.ConfigProperty
		err := rows.Scan(
			&prop.ID, &prop.NodeID, &prop.Key, &prop.Value, &prop.DataType, &prop.DefaultValue, &prop.Description, &prop.CreatedAt, &prop.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		properties = append(properties, prop)
	}
	
	return properties, nil
}

func (r *Repository) UpdateProperty(id int64, req models.UpdatePropertyRequest) (*models.ConfigProperty, error) {
	query := `
		UPDATE config_properties 
		SET value = COALESCE($1, value),
		    data_type = COALESCE($2, data_type),
		    default_value = COALESCE($3, default_value),
		    description = COALESCE($4, description),
		    updated_at = $5
		WHERE id = $6
		RETURNING id, node_id, key, value, data_type, default_value, description, created_at, updated_at`
	
	now := time.Now()
	var prop models.ConfigProperty
	
	err := r.db.QueryRow(query, req.Value, req.DataType, req.DefaultValue, req.Description, now, id).Scan(
		&prop.ID, &prop.NodeID, &prop.Key, &prop.Value, &prop.DataType, &prop.DefaultValue, &prop.Description, &prop.CreatedAt, &prop.UpdatedAt,
	)
	
	if err == sql.ErrNoRows {
		return nil, nil
	}
	
	return &prop, err
}

func (r *Repository) DeleteProperty(id int64) error {
	query := `DELETE FROM config_properties WHERE id = $1`
	result, err := r.db.Exec(query, id)
	if err != nil {
		return err
	}
	
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	
	if rowsAffected == 0 {
		return fmt.Errorf("property not found")
	}
	
	return nil
}

// Configuration resolution
func (r *Repository) GetNodePath(nodeID int64) ([]models.ConfigNode, error) {
	var path []models.ConfigNode
	currentID := &nodeID
	
	for currentID != nil {
		node, err := r.GetNodeByID(*currentID)
		if err != nil {
			return nil, err
		}
		if node == nil {
			break
		}
		
		path = append([]models.ConfigNode{*node}, path...)
		currentID = node.ParentID
	}
	
	return path, nil
}

func (r *Repository) ResolveConfiguration(nodeID int64) (*models.ResolvedConfiguration, error) {
	path, err := r.GetNodePath(nodeID)
	if err != nil {
		return nil, err
	}
	
	if len(path) == 0 {
		return nil, fmt.Errorf("node not found")
	}
	
	resolved := make(map[string]interface{})
	
	// Apply properties from root to leaf (inheritance)
	for _, node := range path {
		properties, err := r.GetPropertiesByNodeID(node.ID)
		if err != nil {
			return nil, err
		}
		
		for _, prop := range properties {
			var value interface{}
			if err := json.Unmarshal([]byte(prop.Value), &value); err != nil {
				// If unmarshal fails, store as string
				value = prop.Value
			}
			resolved[prop.Key] = value
		}
	}
	
	currentNode := path[len(path)-1]
	
	return &models.ResolvedConfiguration{
		NodeID:     nodeID,
		NodeName:   currentNode.Name,
		Properties: resolved,
		Path:       path,
	}, nil
}