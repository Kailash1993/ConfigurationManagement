import React, { useState, useEffect } from 'react';
import { ConfigProperty, ConfigNode, DataType, CreatePropertyRequest } from '../types';
import { propertyAPI, jsonUtils } from '../services/api';
import { PlusIcon, TrashIcon, PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface PropertyEditorProps {
  node: ConfigNode;
  onPropertyChange?: () => void;
}

interface PropertyFormData {
  key: string;
  value: string;
  data_type: DataType;
  default_value: string;
  description: string;
}

const dataTypeOptions: { value: DataType; label: string }[] = [
  { value: 'string', label: 'String' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'object', label: 'Object' },
  { value: 'array', label: 'Array' },
  { value: 'null', label: 'Null' },
];

export const PropertyEditor: React.FC<PropertyEditorProps> = ({ node, onPropertyChange }) => {
  const [properties, setProperties] = useState<ConfigProperty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProperty, setEditingProperty] = useState<number | null>(null);
  const [formData, setFormData] = useState<PropertyFormData>({
    key: '',
    value: '',
    data_type: 'string',
    default_value: '',
    description: '',
  });

  const loadProperties = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const nodeProperties = await propertyAPI.getNodeProperties(node.id);
      setProperties(nodeProperties);
    } catch (error) {
      console.error('Failed to load properties:', error);
      setError('Failed to load properties');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProperties();
  }, [node.id]);

  const resetForm = () => {
    setFormData({
      key: '',
      value: '',
      data_type: 'string',
      default_value: '',
      description: '',
    });
    setShowAddForm(false);
    setEditingProperty(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate JSON if required
      if (!jsonUtils.isValidJSON(formData.value)) {
        setError('Value must be valid JSON');
        return;
      }

      const propertyRequest: CreatePropertyRequest = {
        key: formData.key,
        value: formData.value,
        data_type: formData.data_type,
        default_value: formData.default_value || undefined,
        description: formData.description,
      };

      if (editingProperty) {
        await propertyAPI.updateProperty(editingProperty, propertyRequest);
      } else {
        await propertyAPI.createProperty(node.id, propertyRequest);
      }

      await loadProperties();
      resetForm();
      onPropertyChange?.();
    } catch (error) {
      console.error('Failed to save property:', error);
      setError('Failed to save property');
    }
  };

  const handleEdit = (property: ConfigProperty) => {
    setFormData({
      key: property.key,
      value: property.value,
      data_type: property.data_type,
      default_value: property.default_value || '',
      description: property.description,
    });
    setEditingProperty(property.id);
    setShowAddForm(true);
  };

  const handleDelete = async (propertyId: number) => {
    if (!window.confirm('Are you sure you want to delete this property?')) {
      return;
    }

    try {
      await propertyAPI.deleteProperty(propertyId);
      await loadProperties();
      onPropertyChange?.();
    } catch (error) {
      console.error('Failed to delete property:', error);
      setError('Failed to delete property');
    }
  };

  const renderValuePreview = (property: ConfigProperty) => {
    try {
      const parsed = jsonUtils.parseValue(property.value);
      if (typeof parsed === 'object') {
        return JSON.stringify(parsed, null, 2);
      }
      return String(parsed);
    } catch {
      return property.value;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Configuration Properties</h2>
          <p className="text-sm text-gray-600">Node: {node.name}</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Add Property
        </button>
      </div>

      {error && (
        <div className="px-6 py-3 bg-red-50 border-l-4 border-red-400">
          <div className="text-red-700 text-sm">{error}</div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6">
        {showAddForm && (
          <form onSubmit={handleSubmit} className="mb-6 p-4 border rounded-lg bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-800">
                {editingProperty ? 'Edit Property' : 'Add New Property'}
              </h3>
              <button
                type="button"
                onClick={resetForm}
                className="text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Key *
                </label>
                <input
                  type="text"
                  required
                  value={formData.key}
                  onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., database_url"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Type *
                </label>
                <select
                  required
                  value={formData.data_type}
                  onChange={(e) => setFormData({ ...formData, data_type: e.target.value as DataType })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {dataTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Value (JSON) *
                </label>
                <textarea
                  required
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder={`e.g., "localhost:5432" or {"host": "localhost", "port": 5432}`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Default Value (JSON)
                </label>
                <input
                  type="text"
                  value={formData.default_value}
                  onChange={(e) => setFormData({ ...formData, default_value: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional default value"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Description of this property"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-4">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                <CheckIcon className="w-4 h-4 mr-2" />
                {editingProperty ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        )}

        {properties.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-500 mb-4">No properties configured yet</div>
            <button
              onClick={() => setShowAddForm(true)}
              className="text-blue-600 hover:underline"
            >
              Add your first property
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {properties.map((property) => (
              <div key={property.id} className="border rounded-lg p-4 hover:shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-medium text-gray-800">{property.key}</h4>
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                        {property.data_type}
                      </span>
                    </div>
                    
                    <div className="mb-2">
                      <div className="text-sm text-gray-600 mb-1">Value:</div>
                      <div className="bg-gray-100 p-2 rounded text-sm font-mono">
                        {renderValuePreview(property)}
                      </div>
                    </div>

                    {property.default_value && (
                      <div className="mb-2">
                        <div className="text-sm text-gray-600 mb-1">Default:</div>
                        <div className="bg-yellow-50 p-2 rounded text-sm font-mono">
                          {property.default_value}
                        </div>
                      </div>
                    )}

                    {property.description && (
                      <div className="text-sm text-gray-600">{property.description}</div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleEdit(property)}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                      title="Edit property"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(property.id)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                      title="Delete property"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};