package main

import (
	"config-manager/internal/database"
	"config-manager/internal/handlers"
	"log"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	// Initialize database
	db, err := database.NewConnection()
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer db.Close()

	// Run migrations
	if err := db.RunMigrations(); err != nil {
		log.Fatal("Failed to run migrations:", err)
	}

	// Initialize repository and handlers
	repo := database.NewRepository(db)
	handler := handlers.NewHandler(repo)

	// Setup Gin router
	r := gin.Default()

	// CORS middleware
	config := cors.DefaultConfig()
	config.AllowOrigins = []string{"http://localhost:3000", "http://localhost:3001"}
	config.AllowCredentials = true
	config.AllowHeaders = []string{"Origin", "Content-Length", "Content-Type", "Authorization"}
	r.Use(cors.New(config))

	// Health check
	r.GET("/health", handler.HealthCheck)

	// API routes
	api := r.Group("/api")
	{
		// Node routes
		nodes := api.Group("/nodes")
		{
			nodes.POST("", handler.CreateNode)
			nodes.GET("", handler.GetRootNodes)
			nodes.GET("/:id", handler.GetNode)
			nodes.GET("/:id/children", handler.GetNodeWithChildren)
			nodes.PUT("/:id", handler.UpdateNode)
			nodes.DELETE("/:id", handler.DeleteNode)
			nodes.GET("/:nodeId/path", handler.GetNodePath)
			nodes.GET("/:nodeId/resolve", handler.ResolveConfiguration)
		}

		// Property routes
		properties := api.Group("/nodes/:nodeId/properties")
		{
			properties.POST("", handler.CreateProperty)
			properties.GET("", handler.GetNodeProperties)
		}

		// Individual property routes
		api.PUT("/properties/:propertyId", handler.UpdateProperty)
		api.DELETE("/properties/:propertyId", handler.DeleteProperty)

		// Node with properties
		api.GET("/nodes/:nodeId/details", handler.GetNodeWithProperties)
	}

	// Get port from environment or default to 8080
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}