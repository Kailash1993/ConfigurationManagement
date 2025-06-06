import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Filter, 
  Globe, 
  Building, 
  CheckCircle,
  MoreHorizontal
} from "lucide-react";
import type { ConfigNode } from "@shared/schema";

interface ConfigurationTreeProps {
  selectedNode: ConfigNode | null;
  onNodeSelect: (node: ConfigNode) => void;
  onCreateRoot: () => void;
  onCreateChild: (parent: ConfigNode) => void;
}

interface TerritoryNodeProps {
  territory: ConfigNode;
  centers: ConfigNode[];
  isSelected: boolean;
  selectedCenter: ConfigNode | null;
  onTerritorySelect: (territory: ConfigNode) => void;
  onCenterSelect: (center: ConfigNode) => void;
  onCreateCenter: (territory: ConfigNode) => void;
}

const TerritoryNode = ({ 
  territory, 
  centers, 
  isSelected, 
  selectedCenter,
  onTerritorySelect, 
  onCenterSelect,
  onCreateCenter 
}: TerritoryNodeProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleTerritoryClick = () => {
    onTerritorySelect(territory);
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="mb-2">
      {/* Territory Row */}
      <div 
        className={`flex items-center p-3 rounded-lg cursor-pointer transition-all ${
          isSelected 
            ? 'bg-blue-50 border-blue-200 border' 
            : 'hover:bg-slate-50 border border-transparent'
        }`}
        onClick={handleTerritoryClick}
      >
        <div className="flex items-center flex-1">
          {centers.length > 0 ? (
            isExpanded ? (
              <ChevronDown className="h-4 w-4 mr-2 text-slate-500" />
            ) : (
              <ChevronRight className="h-4 w-4 mr-2 text-slate-500" />
            )
          ) : (
            <div className="w-6 mr-2" />
          )}
          
          <Globe className="h-5 w-5 mr-3 text-blue-600" />
          
          <div className="flex-1">
            <div className="font-medium text-slate-800">{territory.name}</div>
            <div className="text-xs text-slate-500 capitalize">
              Territory • {centers.length} center{centers.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onCreateCenter(territory);
            }}
            className="h-8 w-8 p-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Centers List */}
      {isExpanded && centers.length > 0 && (
        <div className="ml-8 mt-2 space-y-1">
          {centers.map(center => (
            <div
              key={center.id}
              className={`flex items-center p-2 rounded-md cursor-pointer transition-all ${
                selectedCenter?.id === center.id
                  ? 'bg-green-50 border-green-200 border'
                  : 'hover:bg-slate-50 border border-transparent'
              }`}
              onClick={() => onCenterSelect(center)}
            >
              <Building className="h-4 w-4 mr-3 text-green-600" />
              <div className="flex-1">
                <div className="font-medium text-slate-800">{center.name}</div>
                <div className="text-xs text-slate-500">Center</div>
              </div>
              {selectedCenter?.id === center.id && (
                <CheckCircle className="h-4 w-4 text-green-600" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export function ConfigurationTree({ 
  selectedNode, 
  onNodeSelect, 
  onCreateRoot, 
  onCreateChild 
}: ConfigurationTreeProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  // Get all nodes to build hierarchy
  const { data: allNodes = [], isLoading: allNodesLoading, error } = useQuery({
    queryKey: ['/api/config-nodes'],
    retry: false,
  });

  // Get root nodes (territories)
  const { data: rootNodes = [], isLoading: rootLoading } = useQuery({
    queryKey: ['/api/config-nodes/roots'],
    retry: false,
  });

  const isLoading = allNodesLoading || rootLoading;

  if (error && isUnauthorizedError(error as Error)) {
    toast({
      title: "Unauthorized",
      description: "You are logged out. Logging in again...",
      variant: "destructive",
    });
    setTimeout(() => {
      window.location.href = "/api/login";
    }, 500);
    return null;
  }

  // Build hierarchy: territories with their centers
  const territoriesWithCenters = rootNodes
    .filter(node => node.nodeType === 'territory')
    .map(territory => ({
      territory,
      centers: allNodes.filter(node => 
        node.parentId === territory.id && node.nodeType === 'center'
      )
    }));

  // Filter based on search term
  const filteredTerritories = territoriesWithCenters.filter(({ territory, centers }) => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const territoryMatches = territory.name.toLowerCase().includes(searchLower);
    const centerMatches = centers.some(center => 
      center.name.toLowerCase().includes(searchLower)
    );
    
    return territoryMatches || centerMatches;
  });

  const handleTerritorySelect = (territory: ConfigNode) => {
    onNodeSelect(territory);
  };

  const handleCenterSelect = (center: ConfigNode) => {
    onNodeSelect(center);
  };

  const handleCreateCenter = (territory: ConfigNode) => {
    onCreateChild(territory);
  };

  const getSelectedTerritory = (): ConfigNode | null => {
    if (!selectedNode) return null;
    
    if (selectedNode.nodeType === 'territory') {
      return selectedNode;
    }
    
    if (selectedNode.nodeType === 'center' && selectedNode.parentId) {
      return territoriesWithCenters
        .find(({ territory }) => territory.id === selectedNode.parentId)?.territory || null;
    }
    
    return null;
  };

  const getSelectedCenter = (): ConfigNode | null => {
    return selectedNode?.nodeType === 'center' ? selectedNode : null;
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b">
          <Skeleton className="h-9 w-full" />
        </div>
        <div className="flex-1 p-4 space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-white">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-slate-800">Configuration Tree</h2>
          <Button onClick={onCreateRoot} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Territory
          </Button>
        </div>
        
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search territories and centers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tree Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredTerritories.length === 0 ? (
          <div className="text-center py-12">
            <Globe className="h-12 w-12 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-600 mb-2">
              {searchTerm ? 'No matches found' : 'No territories yet'}
            </h3>
            <p className="text-slate-500 mb-4">
              {searchTerm 
                ? 'Try adjusting your search terms'
                : 'Create your first territory to get started'
              }
            </p>
            {!searchTerm && (
              <Button onClick={onCreateRoot}>
                <Plus className="h-4 w-4 mr-2" />
                Create Territory
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTerritories.map(({ territory, centers }) => (
              <TerritoryNode
                key={territory.id}
                territory={territory}
                centers={centers}
                isSelected={getSelectedTerritory()?.id === territory.id}
                selectedCenter={getSelectedCenter()}
                onTerritorySelect={handleTerritorySelect}
                onCenterSelect={handleCenterSelect}
                onCreateCenter={handleCreateCenter}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="p-4 border-t bg-slate-50 text-sm text-slate-600">
        <div className="flex justify-between">
          <span>{territoriesWithCenters.length} territories</span>
          <span>
            {territoriesWithCenters.reduce((sum, { centers }) => sum + centers.length, 0)} centers
          </span>
        </div>
      </div>
    </div>
  );
}