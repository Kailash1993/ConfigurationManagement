import React, { useState } from 'react';
import { ConfigNode, ResolvedConfiguration } from './types';
import { ConfigNodeTree } from './components/ConfigNodeTree';
import { PropertyEditor } from './components/PropertyEditor';
import { CreateNodeModal } from './components/CreateNodeModal';
import { nodeAPI } from './services/api';

function App() {
  const [selectedNode, setSelectedNode] = useState<ConfigNode | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createModalParent, setCreateModalParent] = useState<ConfigNode | undefined>();
  const [resolvedConfig, setResolvedConfig] = useState<ResolvedConfiguration | null>(null);
  const [showResolved, setShowResolved] = useState(false);

  const handleNodeSelect = async (node: ConfigNode) => {
    setSelectedNode(node);
    setShowResolved(false);
    
    // Optionally load resolved configuration
    try {
      const resolved = await nodeAPI.resolveConfiguration(node.id);
      setResolvedConfig(resolved);
    } catch (error) {
      console.error('Failed to resolve configuration:', error);
    }
  };

  const handleCreateNode = (parentId?: number) => {
    if (parentId) {
      // Find parent node for context
      // For now, we'll set it as undefined and handle in modal
      setCreateModalParent(undefined);
    } else {
      setCreateModalParent(undefined);
    }
    setShowCreateModal(true);
  };

  const handleNodeCreated = (node: ConfigNode) => {
    setSelectedNode(node);
    setShowCreateModal(false);
    // Optionally refresh the tree
  };

  const toggleResolvedView = () => {
    setShowResolved(!showResolved);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                Configuration Manager
              </h1>
              <span className="ml-3 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                Dynamic Config System
              </span>
            </div>
            
            {selectedNode && (
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600">
                  Selected: <span className="font-medium">{selectedNode.name}</span>
                </div>
                <button
                  onClick={toggleResolvedView}
                  className={`px-3 py-1.5 text-sm rounded-md ${
                    showResolved
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {showResolved ? 'Hide' : 'Show'} Resolved Config
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Configuration Tree */}
        <div className="w-80 bg-white shadow-sm border-r flex flex-col">
          <ConfigNodeTree
            onNodeSelect={handleNodeSelect}
            selectedNodeId={selectedNode?.id}
            onCreateNode={handleCreateNode}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedNode ? (
            <>
              {showResolved && resolvedConfig ? (
                /* Resolved Configuration View */
                <div className="h-full flex flex-col">
                  <div className="bg-green-50 border-b border-green-200 p-4">
                    <h2 className="text-lg font-semibold text-green-800 mb-2">
                      Resolved Configuration
                    </h2>
                    <p className="text-sm text-green-700">
                      Effective configuration after inheritance from path: {' '}
                      {resolvedConfig.path.map(node => node.name).join(' → ')}
                    </p>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-6">
                    <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                      <pre>{JSON.stringify(resolvedConfig.properties, null, 2)}</pre>
                    </div>
                    
                    <div className="mt-6">
                      <h3 className="text-lg font-medium text-gray-800 mb-3">Inheritance Path</h3>
                      <div className="space-y-2">
                        {resolvedConfig.path.map((node, index) => (
                          <div 
                            key={node.id}
                            className={`flex items-center p-3 rounded-lg border ${
                              node.id === selectedNode.id
                                ? 'bg-blue-50 border-blue-200'
                                : 'bg-gray-50 border-gray-200'
                            }`}
                          >
                            <span className="text-2xl mr-3">
                              {node.node_type === 'territory' ? '🌍' : '🏢'}
                            </span>
                            <div className="flex-1">
                              <div className="font-medium text-gray-800">{node.name}</div>
                              <div className="text-sm text-gray-600 capitalize">
                                {node.node_type}
                                {node.id === selectedNode.id && ' (current)'}
                              </div>
                            </div>
                            <div className="text-sm text-gray-500">
                              Level {index + 1}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Property Editor View */
                <PropertyEditor
                  node={selectedNode}
                  onPropertyChange={() => {
                    // Refresh resolved config when properties change
                    if (resolvedConfig) {
                      nodeAPI.resolveConfiguration(selectedNode.id)
                        .then(setResolvedConfig)
                        .catch(console.error);
                    }
                  }}
                />
              )}
            </>
          ) : (
            /* Welcome Screen */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md">
                <div className="text-6xl mb-4">⚙️</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Dynamic Configuration Management
                </h2>
                <p className="text-gray-600 mb-6">
                  Create hierarchical configuration nodes with inheritance.
                  Select a node from the tree to view and edit its properties.
                </p>
                <button
                  onClick={() => handleCreateNode()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Create Your First Territory
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Node Modal */}
      <CreateNodeModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        parentNode={createModalParent}
        onNodeCreated={handleNodeCreated}
      />
    </div>
  );
}

export default App;