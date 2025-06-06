import {
  users,
  configNodes,
  type User,
  type UpsertUser,
  type ConfigNode,
  type InsertConfigNode,
  type UpdateConfigNode,
} from "@shared/schema";
import { db } from "./db";
import { eq, isNull, and } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Configuration node operations
  getConfigNode(id: number): Promise<ConfigNode | undefined>;
  getConfigNodeWithChildren(id: number): Promise<ConfigNode & { children: ConfigNode[] } | undefined>;
  getUserConfigNodes(userId: string): Promise<ConfigNode[]>;
  getRootConfigNodes(userId: string): Promise<ConfigNode[]>;
  createConfigNode(node: InsertConfigNode): Promise<ConfigNode>;
  updateConfigNode(id: number, updates: UpdateConfigNode): Promise<ConfigNode | undefined>;
  deleteConfigNode(id: number): Promise<boolean>;
  getConfigNodePath(id: number): Promise<ConfigNode[]>;
  resolveConfiguration(nodeId: number): Promise<Record<string, any>>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Configuration node operations
  async getConfigNode(id: number): Promise<ConfigNode | undefined> {
    const [node] = await db
      .select()
      .from(configNodes)
      .where(eq(configNodes.id, id));
    return node;
  }

  async getConfigNodeWithChildren(id: number): Promise<ConfigNode & { children: ConfigNode[] } | undefined> {
    const node = await this.getConfigNode(id);
    if (!node) return undefined;

    const children = await db
      .select()
      .from(configNodes)
      .where(eq(configNodes.parentId, id));

    return { ...node, children };
  }

  async getUserConfigNodes(userId: string): Promise<ConfigNode[]> {
    return await db
      .select()
      .from(configNodes)
      .where(eq(configNodes.userId, userId));
  }

  async getRootConfigNodes(userId: string): Promise<ConfigNode[]> {
    return await db
      .select()
      .from(configNodes)
      .where(and(
        eq(configNodes.userId, userId),
        isNull(configNodes.parentId)
      ));
  }

  async createConfigNode(node: InsertConfigNode): Promise<ConfigNode> {
    const [createdNode] = await db
      .insert(configNodes)
      .values(node)
      .returning();
    return createdNode;
  }

  async updateConfigNode(id: number, updates: UpdateConfigNode): Promise<ConfigNode | undefined> {
    const [updatedNode] = await db
      .update(configNodes)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(configNodes.id, id))
      .returning();
    return updatedNode;
  }

  async deleteConfigNode(id: number): Promise<boolean> {
    // First delete all children recursively
    const children = await db
      .select()
      .from(configNodes)
      .where(eq(configNodes.parentId, id));
    
    for (const child of children) {
      await this.deleteConfigNode(child.id);
    }

    // Then delete the node itself
    const result = await db
      .delete(configNodes)
      .where(eq(configNodes.id, id));
    
    return result.rowCount > 0;
  }

  async getConfigNodePath(id: number): Promise<ConfigNode[]> {
    const path: ConfigNode[] = [];
    let currentId: number | null = id;

    while (currentId !== null) {
      const node = await this.getConfigNode(currentId);
      if (!node) break;
      
      path.unshift(node);
      currentId = node.parentId;
    }

    return path;
  }

  async resolveConfiguration(nodeId: number): Promise<Record<string, any>> {
    const path = await this.getConfigNodePath(nodeId);
    const resolved: Record<string, any> = {};

    // Start from root and apply configurations down the path
    for (const node of path) {
      // Apply defaults first
      Object.assign(resolved, node.defaults);
      // Then apply properties (which can override defaults)
      Object.assign(resolved, node.properties);
      // Always include the name
      resolved.$NAME = node.name;
    }

    return resolved;
  }
}

export const storage = new DatabaseStorage();
