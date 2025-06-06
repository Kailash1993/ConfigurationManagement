import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertConfigNodeSchema, updateConfigNodeSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Configuration node routes
  app.get('/api/config-nodes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const nodes = await storage.getUserConfigNodes(userId);
      res.json(nodes);
    } catch (error) {
      console.error("Error fetching config nodes:", error);
      res.status(500).json({ message: "Failed to fetch config nodes" });
    }
  });

  app.get('/api/config-nodes/roots', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const rootNodes = await storage.getRootConfigNodes(userId);
      res.json(rootNodes);
    } catch (error) {
      console.error("Error fetching root nodes:", error);
      res.status(500).json({ message: "Failed to fetch root nodes" });
    }
  });

  app.get('/api/config-nodes/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const node = await storage.getConfigNodeWithChildren(id);
      
      if (!node) {
        return res.status(404).json({ message: "Config node not found" });
      }

      // Check if user owns this node
      if (node.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(node);
    } catch (error) {
      console.error("Error fetching config node:", error);
      res.status(500).json({ message: "Failed to fetch config node" });
    }
  });

  app.get('/api/config-nodes/:id/resolve', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const node = await storage.getConfigNode(id);
      
      if (!node) {
        return res.status(404).json({ message: "Config node not found" });
      }

      // Check if user owns this node
      if (node.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Access denied" });
      }

      const resolved = await storage.resolveConfiguration(id);
      res.json(resolved);
    } catch (error) {
      console.error("Error resolving configuration:", error);
      res.status(500).json({ message: "Failed to resolve configuration" });
    }
  });

  app.get('/api/config-nodes/:id/path', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const node = await storage.getConfigNode(id);
      
      if (!node) {
        return res.status(404).json({ message: "Config node not found" });
      }

      // Check if user owns this node
      if (node.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Access denied" });
      }

      const path = await storage.getConfigNodePath(id);
      res.json(path);
    } catch (error) {
      console.error("Error fetching config path:", error);
      res.status(500).json({ message: "Failed to fetch config path" });
    }
  });

  app.post('/api/config-nodes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Handle parentId being null for root nodes
      const requestData = {
        ...req.body,
        userId,
        parentId: req.body.parentId === null ? undefined : req.body.parentId,
      };
      
      const nodeData = insertConfigNodeSchema.parse(requestData);

      // If parentId is provided, verify the parent exists and belongs to the user
      if (nodeData.parentId) {
        const parent = await storage.getConfigNode(nodeData.parentId);
        if (!parent || parent.userId !== userId) {
          return res.status(400).json({ message: "Invalid parent node" });
        }
      }

      const node = await storage.createConfigNode(nodeData);
      res.status(201).json(node);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating config node:", error);
      res.status(500).json({ message: "Failed to create config node" });
    }
  });

  app.patch('/api/config-nodes/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      // Check if node exists and belongs to user
      const existingNode = await storage.getConfigNode(id);
      if (!existingNode) {
        return res.status(404).json({ message: "Config node not found" });
      }
      if (existingNode.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updates = updateConfigNodeSchema.parse(req.body);
      const updatedNode = await storage.updateConfigNode(id, updates);
      
      if (!updatedNode) {
        return res.status(404).json({ message: "Config node not found" });
      }

      res.json(updatedNode);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating config node:", error);
      res.status(500).json({ message: "Failed to update config node" });
    }
  });

  app.delete('/api/config-nodes/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      // Check if node exists and belongs to user
      const existingNode = await storage.getConfigNode(id);
      if (!existingNode) {
        return res.status(404).json({ message: "Config node not found" });
      }
      if (existingNode.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const deleted = await storage.deleteConfigNode(id);
      if (!deleted) {
        return res.status(404).json({ message: "Config node not found" });
      }

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting config node:", error);
      res.status(500).json({ message: "Failed to delete config node" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
