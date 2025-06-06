import React, { useState, useEffect } from 'react';
import { ConfigNode, NodeType } from '../types';
import { nodeAPI } from '../services/api';
import { ChevronRightIcon, ChevronDownIcon, PlusIcon } from '@heroicons/react/24/outline';

interface ConfigNodeTreeProps {
  onNodeSelect: (node: ConfigNode) => void;
  selectedNodeId?: number;
  onCreateNode: (parentId?: number) => void;
}

interface TreeNodeProps {
  node: ConfigNode;
  level: number;
  onSelect: (node: ConfigNode) => void;
  isSelected: boolean;
  onCreateChild: (parentId: number) => void;
}

const TreeNode: React.FC<TreeNodeProps> = ({ 
  node, 
  level, 
  onSelect, 
  isSelected,
  onCreateChild 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [children, setChildren] = useState<ConfigNode[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadChildren = async () => {
    if (isExpanded || isLoading) return;
    
    setIsLoading(true);
    try {
      const nodeWithChildren = await nodeAPI.getNodeWithChildren(node.id);
      setChildren(nodeWithChildren.children);
      setIsExpanded(true);
    } catch (error) {
      console.error('Failed to load children:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpanded = () => {
    if (isExpanded) {
      setIsExpanded(false);
    } else {
      loadChildren();
    }
  };

  const getNodeIcon = (nodeType: NodeType) => {
    switch (nodeType) {
      case 'territory':
        return '🌍';
      case 'center':
        return '🏢';
      default:
        return '📁';
    }
  };

  const canHaveChildren = node.node_type === 'territory';

  return (
    <div className="select-none">
      <div
        className={`flex items-center py-2 px-3 rounded-lg cursor-pointer hover:bg-gray-100 ${
          isSelected ? 'bg-blue-100 border-l-4 border-blue-500' : ''
        }`}
        style={{ paddingLeft: `${level * 20 + 12}px` }}
        onClick={() => onSelect(node)}
      >
        <div className="flex items-center flex-1">
          {canHaveChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded();
              }}
              className="mr-2 p-1 hover:bg-gray-200 rounded"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
              ) : isExpanded ? (
                <ChevronDownIcon className="w-4 h-4" />
              ) : (
                <ChevronRightIcon className="w-4 h-4" />
              )}
            </button>
          )}
          
          <span className="mr-2">{getNodeIcon(node.node_type)}</span>
          <span className="font-medium text-gray-800">{node.name}</span>
          <span className="ml-2 text-xs text-gray-500 capitalize">
            {node.node_type}
          </span>
        </div>

        {canHaveChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCreateChild(node.id);
            }}
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded"
            title="Add child node"
          >
            <PlusIcon className="w-4 h-4 text-gray-600" />
          </button>
        )}
      </div>

      {isExpanded && children.length > 0 && (
        <div className="mt-1">
          {children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              onSelect={onSelect}
              isSelected={child.id === selectedNodeId}
              onCreateChild={onCreateChild}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const ConfigNodeTree: React.FC<ConfigNodeTreeProps> = ({
  onNodeSelect,
  selectedNodeId,
  onCreateNode,
}) => {
  const [rootNodes, setRootNodes] = useState<ConfigNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRootNodes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const nodes = await nodeAPI.getRootNodes();
      setRootNodes(nodes);
    } catch (error) {
      console.error('Failed to load root nodes:', error);
      setError('Failed to load configuration nodes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRootNodes();
  }, []);

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-8 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="text-red-600 text-sm">{error}</div>
        <button
          onClick={loadRootNodes}
          className="mt-2 text-blue-600 text-sm hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold text-gray-800">Configuration Tree</h2>
        <button
          onClick={() => onCreateNode()}
          className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
        >
          <PlusIcon className="w-4 h-4 mr-1" />
          New Territory
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {rootNodes.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-500 mb-4">No configuration nodes yet</div>
            <button
              onClick={() => onCreateNode()}
              className="text-blue-600 hover:underline"
            >
              Create your first territory
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            {rootNodes.map((node) => (
              <TreeNode
                key={node.id}
                node={node}
                level={0}
                onSelect={onNodeSelect}
                isSelected={node.id === selectedNodeId}
                onCreateChild={(parentId) => onCreateNode(parentId)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};