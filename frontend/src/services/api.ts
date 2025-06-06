import axios from 'axios';
import {
  ConfigNode,
  ConfigProperty,
  ConfigNodeWithChildren,
  ConfigNodeWithProperties,
  ResolvedConfiguration,
  CreateNodeRequest,
  UpdateNodeRequest,
  CreatePropertyRequest,
  UpdatePropertyRequest,
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Node API calls
export const nodeAPI = {
  // Get all root nodes
  getRootNodes: (): Promise<ConfigNode[]> =>
    api.get('/api/nodes').then(response => response.data),

  // Get a specific node by ID
  getNode: (id: number): Promise<ConfigNode> =>
    api.get(`/api/nodes/${id}`).then(response => response.data),

  // Get node with its children
  getNodeWithChildren: (id: number): Promise<ConfigNodeWithChildren> =>
    api.get(`/api/nodes/${id}/children`).then(response => response.data),

  // Get node with its properties
  getNodeWithProperties: (id: number): Promise<ConfigNodeWithProperties> =>
    api.get(`/api/nodes/${id}/details`).then(response => response.data),

  // Create a new node
  createNode: (data: CreateNodeRequest): Promise<ConfigNode> =>
    api.post('/api/nodes', data).then(response => response.data),

  // Update an existing node
  updateNode: (id: number, data: UpdateNodeRequest): Promise<ConfigNode> =>
    api.put(`/api/nodes/${id}`, data).then(response => response.data),

  // Delete a node
  deleteNode: (id: number): Promise<void> =>
    api.delete(`/api/nodes/${id}`).then(() => {}),

  // Get node inheritance path
  getNodePath: (id: number): Promise<ConfigNode[]> =>
    api.get(`/api/nodes/${id}/path`).then(response => response.data),

  // Resolve configuration (with inheritance)
  resolveConfiguration: (id: number): Promise<ResolvedConfiguration> =>
    api.get(`/api/nodes/${id}/resolve`).then(response => response.data),
};

// Property API calls
export const propertyAPI = {
  // Get all properties for a node
  getNodeProperties: (nodeId: number): Promise<ConfigProperty[]> =>
    api.get(`/api/nodes/${nodeId}/properties`).then(response => response.data),

  // Create or update a property
  createProperty: (nodeId: number, data: CreatePropertyRequest): Promise<ConfigProperty> =>
    api.post(`/api/nodes/${nodeId}/properties`, data).then(response => response.data),

  // Update a property
  updateProperty: (propertyId: number, data: UpdatePropertyRequest): Promise<ConfigProperty> =>
    api.put(`/api/properties/${propertyId}`, data).then(response => response.data),

  // Delete a property
  deleteProperty: (propertyId: number): Promise<void> =>
    api.delete(`/api/properties/${propertyId}`).then(() => {}),
};

// Utility functions for handling JSON values
export const jsonUtils = {
  // Parse JSON value safely
  parseValue: (value: string): any => {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  },

  // Stringify value for API
  stringifyValue: (value: any): string => {
    if (typeof value === 'string') {
      try {
        // If it's already a JSON string, don't double-encode
        JSON.parse(value);
        return value;
      } catch {
        // It's a regular string, encode it
        return JSON.stringify(value);
      }
    }
    return JSON.stringify(value);
  },

  // Validate JSON string
  isValidJSON: (str: string): boolean => {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  },
};

export default api;