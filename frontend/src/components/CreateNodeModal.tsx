import React, { useState } from 'react';
import { ConfigNode, NodeType, CreateNodeRequest } from '../types';
import { nodeAPI } from '../services/api';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface CreateNodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentNode?: ConfigNode;
  onNodeCreated: (node: ConfigNode) => void;
}

export const CreateNodeModal: React.FC<CreateNodeModalProps> = ({
  isOpen,
  onClose,
  parentNode,
  onNodeCreated,
}) => {
  const [formData, setFormData] = useState<CreateNodeRequest>({
    name: '',
    node_type: parentNode ? 'center' : 'territory',
    parent_id: parentNode?.id,
    description: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const newNode = await nodeAPI.createNode(formData);
      onNodeCreated(newNode);
      setFormData({
        name: '',
        node_type: parentNode ? 'center' : 'territory',
        parent_id: parentNode?.id,
        description: '',
      });
      onClose();
    } catch (error) {
      console.error('Failed to create node:', error);
      setError('Failed to create configuration node');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      node_type: parentNode ? 'center' : 'territory',
      parent_id: parentNode?.id,
      description: '',
    });
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-800">
            {parentNode ? `Create Child Node under ${parentNode.name}` : 'Create Root Configuration Node'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="px-6 py-3 bg-red-50 border-l-4 border-red-400">
            <div className="text-red-700 text-sm">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Configuration Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Territory1, Center1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Node Type *
              </label>
              <select
                required
                value={formData.node_type}
                onChange={(e) => setFormData({ ...formData, node_type: e.target.value as NodeType })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!!parentNode} // Disable if we have a parent (should be center)
              >
                <option value="territory">Territory</option>
                <option value="center">Center</option>
              </select>
              {parentNode && (
                <p className="text-xs text-gray-500 mt-1">
                  Child nodes under territories must be centers
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Optional description for this configuration node"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Node'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};