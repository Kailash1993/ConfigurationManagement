export type NodeType = 'territory' | 'center';

export type DataType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null';

export interface ConfigNode {
  id: number;
  name: string;
  node_type: NodeType;
  parent_id?: number;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface ConfigProperty {
  id: number;
  node_id: number;
  key: string;
  value: string; // JSON string
  data_type: DataType;
  default_value?: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface ConfigNodeWithChildren extends ConfigNode {
  children: ConfigNode[];
}

export interface ConfigNodeWithProperties extends ConfigNode {
  properties: ConfigProperty[];
}

export interface ResolvedConfiguration {
  node_id: number;
  node_name: string;
  properties: Record<string, any>;
  path: ConfigNode[];
}

export interface CreateNodeRequest {
  name: string;
  node_type: NodeType;
  parent_id?: number;
  description?: string;
}

export interface UpdateNodeRequest {
  name?: string;
  description?: string;
}

export interface CreatePropertyRequest {
  key: string;
  value: string; // JSON string
  data_type: DataType;
  default_value?: string;
  description?: string;
}

export interface UpdatePropertyRequest {
  value?: string;
  data_type?: DataType;
  default_value?: string;
  description?: string;
}