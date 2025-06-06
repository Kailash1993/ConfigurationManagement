package handlers

import (
        "config-manager/internal/database"
        "config-manager/internal/models"
        "encoding/json"
        "net/http"
        "strconv"

        "github.com/gin-gonic/gin"
)

type Handler struct {
        repo *database.Repository
}

func NewHandler(repo *database.Repository) *Handler {
        return &Handler{repo: repo}
}

// Node handlers
func (h *Handler) CreateNode(c *gin.Context) {
        var req models.CreateNodeRequest
        if err := c.ShouldBindJSON(&req); err != nil {
                c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
                return
        }

        // Validate node type
        if req.NodeType != models.NodeTypeTerritory && req.NodeType != models.NodeTypeCenter {
                c.JSON(http.StatusBadRequest, gin.H{"error": "nodeType must be 'territory' or 'center'"})
                return
        }

        // If parent_id is provided, validate parent exists
        if req.ParentID != nil {
                parent, err := h.repo.GetNodeByID(*req.ParentID)
                if err != nil {
                        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to validate parent node"})
                        return
                }
                if parent == nil {
                        c.JSON(http.StatusBadRequest, gin.H{"error": "Parent node not found"})
                        return
                }
        }

        node, err := h.repo.CreateNode(req)
        if err != nil {
                c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create node"})
                return
        }

        c.JSON(http.StatusCreated, node)
}

func (h *Handler) GetNode(c *gin.Context) {
        idStr := c.Param("id")
        id, err := strconv.ParseInt(idStr, 10, 64)
        if err != nil {
                c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid node ID"})
                return
        }

        node, err := h.repo.GetNodeByID(id)
        if err != nil {
                c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get node"})
                return
        }

        if node == nil {
                c.JSON(http.StatusNotFound, gin.H{"error": "Node not found"})
                return
        }

        c.JSON(http.StatusOK, node)
}

func (h *Handler) GetNodeWithChildren(c *gin.Context) {
        idStr := c.Param("id")
        id, err := strconv.ParseInt(idStr, 10, 64)
        if err != nil {
                c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid node ID"})
                return
        }

        node, err := h.repo.GetNodeByID(id)
        if err != nil {
                c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get node"})
                return
        }

        if node == nil {
                c.JSON(http.StatusNotFound, gin.H{"error": "Node not found"})
                return
        }

        children, err := h.repo.GetChildNodes(id)
        if err != nil {
                c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get child nodes"})
                return
        }

        result := models.ConfigNodeWithChildren{
                ConfigNode: *node,
                Children:   children,
        }

        c.JSON(http.StatusOK, result)
}

func (h *Handler) GetRootNodes(c *gin.Context) {
        nodes, err := h.repo.GetRootNodes()
        if err != nil {
                c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get root nodes"})
                return
        }

        c.JSON(http.StatusOK, nodes)
}

func (h *Handler) UpdateNode(c *gin.Context) {
        idStr := c.Param("id")
        id, err := strconv.ParseInt(idStr, 10, 64)
        if err != nil {
                c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid node ID"})
                return
        }

        var req models.UpdateNodeRequest
        if err := c.ShouldBindJSON(&req); err != nil {
                c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
                return
        }

        node, err := h.repo.UpdateNode(id, req)
        if err != nil {
                c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update node"})
                return
        }

        if node == nil {
                c.JSON(http.StatusNotFound, gin.H{"error": "Node not found"})
                return
        }

        c.JSON(http.StatusOK, node)
}

func (h *Handler) DeleteNode(c *gin.Context) {
        idStr := c.Param("id")
        id, err := strconv.ParseInt(idStr, 10, 64)
        if err != nil {
                c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid node ID"})
                return
        }

        err = h.repo.DeleteNode(id)
        if err != nil {
                c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete node"})
                return
        }

        c.JSON(http.StatusNoContent, nil)
}

// Property handlers
func (h *Handler) CreateProperty(c *gin.Context) {
        nodeIDStr := c.Param("nodeId")
        nodeID, err := strconv.ParseInt(nodeIDStr, 10, 64)
        if err != nil {
                c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid node ID"})
                return
        }

        var req models.CreatePropertyRequest
        if err := c.ShouldBindJSON(&req); err != nil {
                c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
                return
        }

        // Validate JSON value
        var jsonValue interface{}
        if err := json.Unmarshal([]byte(req.Value), &jsonValue); err != nil {
                c.JSON(http.StatusBadRequest, gin.H{"error": "Value must be valid JSON"})
                return
        }

        // Validate data type
        validTypes := map[models.DataType]bool{
                models.DataTypeString:  true,
                models.DataTypeNumber:  true,
                models.DataTypeBoolean: true,
                models.DataTypeObject:  true,
                models.DataTypeArray:   true,
                models.DataTypeNull:    true,
        }

        if !validTypes[req.DataType] {
                c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid data type"})
                return
        }

        // Verify node exists
        node, err := h.repo.GetNodeByID(nodeID)
        if err != nil {
                c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to validate node"})
                return
        }
        if node == nil {
                c.JSON(http.StatusNotFound, gin.H{"error": "Node not found"})
                return
        }

        property, err := h.repo.CreateProperty(nodeID, req)
        if err != nil {
                c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create property"})
                return
        }

        c.JSON(http.StatusCreated, property)
}

func (h *Handler) GetNodeProperties(c *gin.Context) {
        nodeIDStr := c.Param("nodeId")
        nodeID, err := strconv.ParseInt(nodeIDStr, 10, 64)
        if err != nil {
                c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid node ID"})
                return
        }

        properties, err := h.repo.GetPropertiesByNodeID(nodeID)
        if err != nil {
                c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get properties"})
                return
        }

        c.JSON(http.StatusOK, properties)
}

func (h *Handler) GetNodeWithProperties(c *gin.Context) {
        nodeIDStr := c.Param("nodeId")
        nodeID, err := strconv.ParseInt(nodeIDStr, 10, 64)
        if err != nil {
                c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid node ID"})
                return
        }

        node, err := h.repo.GetNodeByID(nodeID)
        if err != nil {
                c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get node"})
                return
        }

        if node == nil {
                c.JSON(http.StatusNotFound, gin.H{"error": "Node not found"})
                return
        }

        properties, err := h.repo.GetPropertiesByNodeID(nodeID)
        if err != nil {
                c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get properties"})
                return
        }

        result := models.ConfigNodeWithProperties{
                ConfigNode: *node,
                Properties: properties,
        }

        c.JSON(http.StatusOK, result)
}

func (h *Handler) UpdateProperty(c *gin.Context) {
        propertyIDStr := c.Param("propertyId")
        propertyID, err := strconv.ParseInt(propertyIDStr, 10, 64)
        if err != nil {
                c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid property ID"})
                return
        }

        var req models.UpdatePropertyRequest
        if err := c.ShouldBindJSON(&req); err != nil {
                c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
                return
        }

        // Validate JSON value if provided
        if req.Value != nil {
                var jsonValue interface{}
                if err := json.Unmarshal([]byte(*req.Value), &jsonValue); err != nil {
                        c.JSON(http.StatusBadRequest, gin.H{"error": "Value must be valid JSON"})
                        return
                }
        }

        property, err := h.repo.UpdateProperty(propertyID, req)
        if err != nil {
                c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update property"})
                return
        }

        if property == nil {
                c.JSON(http.StatusNotFound, gin.H{"error": "Property not found"})
                return
        }

        c.JSON(http.StatusOK, property)
}

func (h *Handler) DeleteProperty(c *gin.Context) {
        propertyIDStr := c.Param("propertyId")
        propertyID, err := strconv.ParseInt(propertyIDStr, 10, 64)
        if err != nil {
                c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid property ID"})
                return
        }

        err = h.repo.DeleteProperty(propertyID)
        if err != nil {
                c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete property"})
                return
        }

        c.JSON(http.StatusNoContent, nil)
}

// Configuration resolution handlers
func (h *Handler) GetNodePath(c *gin.Context) {
        nodeIDStr := c.Param("nodeId")
        nodeID, err := strconv.ParseInt(nodeIDStr, 10, 64)
        if err != nil {
                c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid node ID"})
                return
        }

        path, err := h.repo.GetNodePath(nodeID)
        if err != nil {
                c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get node path"})
                return
        }

        c.JSON(http.StatusOK, path)
}

func (h *Handler) ResolveConfiguration(c *gin.Context) {
        nodeIDStr := c.Param("nodeId")
        nodeID, err := strconv.ParseInt(nodeIDStr, 10, 64)
        if err != nil {
                c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid node ID"})
                return
        }

        resolved, err := h.repo.ResolveConfiguration(nodeID)
        if err != nil {
                c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to resolve configuration"})
                return
        }

        c.JSON(http.StatusOK, resolved)
}

// Health check
func (h *Handler) HealthCheck(c *gin.Context) {
        c.JSON(http.StatusOK, gin.H{
                "status":    "healthy",
                "timestamp": "2024-12-06T09:14:00Z",
        })
}