package models

import (
        "time"
)

// NodeType represents the type of configuration node
type NodeType string

const (
        NodeTypeTerritory NodeType = "territory"
        NodeTypeCenter    NodeType = "center"
)

// DataType represents JSON-supported data types for configuration properties
type DataType string

const (
        DataTypeString  DataType = "string"
        DataTypeNumber  DataType = "number" 
        DataTypeBoolean DataType = "boolean"
        DataTypeObject  DataType = "object"
        DataTypeArray   DataType = "array"
        DataTypeNull    DataType = "null"
)

// ConfigNode represents a hierarchical configuration node
type ConfigNode struct {
        ID          int64     `json:"id" db:"id"`
        Name        string    `json:"name" db:"name"`
        NodeType    NodeType  `json:"node_type" db:"node_type"`
        ParentID    *int64    `json:"parent_id" db:"parent_id"`
        Description string    `json:"description" db:"description"`
        CreatedAt   time.Time `json:"created_at" db:"created_at"`
        UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
}

// ConfigProperty represents a configuration property with metadata
type ConfigProperty struct {
        ID           int64    `json:"id" db:"id"`
        NodeID       int64    `json:"node_id" db:"node_id"`
        Key          string   `json:"key" db:"key"`
        Value        string   `json:"value" db:"value"` // Serialized JSON string
        DataType     DataType `json:"data_type" db:"data_type"`
        DefaultValue *string  `json:"default_value" db:"default_value"` // Optional default value
        Description  string   `json:"description" db:"description"`
        CreatedAt    time.Time `json:"created_at" db:"created_at"`
        UpdatedAt    time.Time `json:"updated_at" db:"updated_at"`
}

// ConfigNodeWithChildren represents a node with its child nodes
type ConfigNodeWithChildren struct {
        ConfigNode
        Children []ConfigNode `json:"children"`
}

// ConfigNodeWithProperties represents a node with its properties
type ConfigNodeWithProperties struct {
        ConfigNode
        Properties []ConfigProperty `json:"properties"`
}

// ResolvedConfiguration represents the effective configuration after inheritance
type ResolvedConfiguration struct {
        NodeID     int64                  `json:"node_id"`
        NodeName   string                 `json:"node_name"`
        Properties map[string]interface{} `json:"properties"`
        Path       []ConfigNode           `json:"path"`
}

// CreateNodeRequest represents the request to create a new node
type CreateNodeRequest struct {
        Name        string   `json:"name" binding:"required"`
        NodeType    NodeType `json:"nodeType" binding:"required"`
        ParentID    *int64   `json:"parentId"`
        Description string   `json:"description"`
}

// UpdateNodeRequest represents the request to update a node
type UpdateNodeRequest struct {
        Name        *string `json:"name"`
        Description *string `json:"description"`
}

// CreatePropertyRequest represents the request to create/update a property
type CreatePropertyRequest struct {
        Key          string   `json:"key" binding:"required"`
        Value        string   `json:"value" binding:"required"` // JSON string
        DataType     DataType `json:"data_type" binding:"required"`
        DefaultValue *string  `json:"default_value"`
        Description  string   `json:"description"`
}

// UpdatePropertyRequest represents the request to update a property
type UpdatePropertyRequest struct {
        Value        *string  `json:"value"`
        DataType     *DataType `json:"data_type"`
        DefaultValue *string  `json:"default_value"`
        Description  *string  `json:"description"`
}