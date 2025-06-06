# Dynamic Configuration Management System

A containerized enterprise configuration management system with hierarchical node structure, inheritance, and flexible schema support using Golang backend and React frontend.

## Architecture

- **Backend**: Golang with Gin framework, PostgreSQL database
- **Frontend**: React with TypeScript, Tailwind CSS
- **Database**: PostgreSQL with automatic migrations
- **Containerization**: Docker Compose for easy deployment

## Features

### Core Functionality
- **Hierarchical Structure**: Create territory and center nodes with parent-child relationships
- **Configuration Inheritance**: Child nodes inherit properties from parents with override capabilities
- **Dynamic Properties**: JSON-supported data types (string, number, boolean, object, array, null)
- **Property Management**: Full CRUD operations for configuration properties
- **Resolved Configuration**: View effective configuration after inheritance resolution

### Data Types Supported
- String values
- Numeric values
- Boolean values
- JSON objects
- JSON arrays
- Null values

### Node Types
- **Territory**: Root-level configuration nodes (can have center children)
- **Center**: Second-level nodes under territories

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Git

### 1. Clone and Start Services

```bash
# Clone the repository
git clone <repository-url>
cd config-manager

# Start all services
docker-compose up -d
```

### 2. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **Health Check**: http://localhost:8080/health

### 3. Database Connection

The PostgreSQL database runs on port 5432 with:
- Database: `config_manager`
- Username: `postgres`
- Password: `postgres`

## Development Setup

### Backend Development (Golang)

```bash
cd backend

# Install dependencies
go mod download

# Set environment variables
export DATABASE_URL="postgres://postgres:postgres@localhost:5432/config_manager?sslmode=disable"
export PORT=8080

# Run the server
go run cmd/server/main.go
```

### Frontend Development (React)

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

## API Documentation

### Node Endpoints

```bash
# Get all root nodes
GET /api/nodes

# Get specific node
GET /api/nodes/:id

# Get node with children
GET /api/nodes/:id/children

# Create new node
POST /api/nodes
{
  "name": "Territory1",
  "node_type": "territory",
  "parent_id": null,
  "description": "Main territory"
}

# Update node
PUT /api/nodes/:id
{
  "name": "Updated Name",
  "description": "Updated description"
}

# Delete node
DELETE /api/nodes/:id

# Get inheritance path
GET /api/nodes/:nodeId/path

# Resolve configuration
GET /api/nodes/:nodeId/resolve
```

### Property Endpoints

```bash
# Get node properties
GET /api/nodes/:nodeId/properties

# Create/update property
POST /api/nodes/:nodeId/properties
{
  "key": "database_url",
  "value": "\"localhost:5432\"",
  "data_type": "string",
  "default_value": "\"default:5432\"",
  "description": "Database connection URL"
}

# Update property
PUT /api/properties/:propertyId
{
  "value": "\"updated-value\"",
  "description": "Updated description"
}

# Delete property
DELETE /api/properties/:propertyId
```

## Configuration Examples

### Creating a Territory with Database Configuration

1. **Create Territory**:
```json
{
  "name": "Production Territory",
  "node_type": "territory",
  "description": "Production environment configuration"
}
```

2. **Add Database Configuration**:
```json
{
  "key": "database",
  "value": "{\"host\": \"prod-db.company.com\", \"port\": 5432, \"ssl\": true}",
  "data_type": "object",
  "description": "Production database configuration"
}
```

3. **Add API Settings**:
```json
{
  "key": "api_timeout",
  "value": "30",
  "data_type": "number",
  "default_value": "10",
  "description": "API timeout in seconds"
}
```

### Creating a Center with Overrides

1. **Create Center under Territory**:
```json
{
  "name": "East Coast Center",
  "node_type": "center",
  "parent_id": 1,
  "description": "East coast data center"
}
```

2. **Override Database Host**:
```json
{
  "key": "database",
  "value": "{\"host\": \"east-db.company.com\", \"port\": 5432, \"ssl\": true}",
  "data_type": "object",
  "description": "East coast database override"
}
```

## Database Schema

### Config Nodes Table
```sql
CREATE TABLE config_nodes (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    node_type VARCHAR(50) NOT NULL CHECK (node_type IN ('territory', 'center')),
    parent_id BIGINT REFERENCES config_nodes(id) ON DELETE CASCADE,
    description TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Config Properties Table
```sql
CREATE TABLE config_properties (
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
);
```

## Configuration Inheritance

The system implements a hierarchical inheritance model:

1. **Root Level**: Territory nodes define base configurations
2. **Child Level**: Center nodes inherit all parent properties
3. **Override**: Child nodes can override specific properties
4. **Resolution**: Final configuration merges all levels from root to leaf

### Example Inheritance Flow

```
Territory: "Production"
├── database: {"host": "prod-db.com", "port": 5432}
├── api_timeout: 30
└── cache_enabled: true

Center: "East Coast" (child of Production)
├── database: {"host": "east-db.com", "port": 5432}  // Overridden
├── api_timeout: 30                                   // Inherited
├── cache_enabled: true                               // Inherited
└── region: "us-east-1"                              // New property

Resolved Configuration for East Coast:
{
  "database": {"host": "east-db.com", "port": 5432},
  "api_timeout": 30,
  "cache_enabled": true,
  "region": "us-east-1"
}
```

## Production Deployment

### Environment Variables

```bash
# Backend
DATABASE_URL=postgres://user:password@host:5432/dbname?sslmode=require
PORT=8080

# Frontend
REACT_APP_API_URL=https://your-api-domain.com
```

### Docker Production Build

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy with production configuration
docker-compose -f docker-compose.prod.yml up -d
```

## Monitoring and Health Checks

- **Backend Health**: `GET /health`
- **Database Status**: Automatic connection health checks
- **Frontend Status**: Standard React development server

## Security Considerations

- All API endpoints use JSON validation
- Database constraints prevent invalid data types
- Foreign key constraints maintain referential integrity
- Input sanitization prevents JSON injection

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.