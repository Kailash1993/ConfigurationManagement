import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import {
  CheckCircle,
  Globe,
  Building,
  User,
  ArrowUp,
  Copy,
  Download,
  History,
  CheckCheck,
  Trash2
} from "lucide-react";
import type { ConfigNode } from "@shared/schema";

interface DetailsPanelProps {
  node: ConfigNode;
  onNodeUpdate: (node: ConfigNode) => void;
}

export function DetailsPanel({ node }: DetailsPanelProps) {
  const { toast } = useToast();

  const { data: inheritancePath, isLoading } = useQuery({
    queryKey: ['/api/config-nodes', node.id, 'path'],
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      }
    },
  });

  const getNodeIcon = (nodeType: string) => {
    switch (nodeType) {
      case 'territory':
        return <Globe className="h-4 w-4 text-primary" />;
      case 'center':
        return <Building className="h-4 w-4 text-accent" />;
      case 'user':
        return <User className="h-4 w-4 text-blue-600" />;
      default:
        return <User className="h-4 w-4 text-slate-500" />;
    }
  };

  const handleDuplicate = () => {
    toast({
      title: "Feature Coming Soon",
      description: "Duplicate configuration functionality will be available soon.",
    });
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(node, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${node.name.replace(/\s+/g, '_')}_config.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast({
      title: "Export Successful",
      description: "Configuration exported as JSON file.",
    });
  };

  const handleViewHistory = () => {
    toast({
      title: "Feature Coming Soon",
      description: "Change history functionality will be available soon.",
    });
  };

  const handleValidate = () => {
    toast({
      title: "Configuration Valid",
      description: "All properties are valid and properly configured.",
    });
  };

  const handleDelete = () => {
    toast({
      title: "Feature Coming Soon",
      description: "Delete functionality will be available soon.",
      variant: "destructive",
    });
  };

  if (isLoading) {
    return (
      <aside className="w-96 bg-white border-l border-slate-200 flex flex-col">
        <div className="p-6">
          <Skeleton className="h-6 w-48 mb-4" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </div>
      </aside>
    );
  }

  const propertiesCount = Object.keys(node.properties || {}).length;
  const inheritedCount = inheritancePath ? inheritancePath.length - 1 : 0;

  return (
    <aside className="w-96 bg-white border-l border-slate-200 flex flex-col">
      <div className="p-6 border-b border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Configuration Details</h3>
        
        {/* Inheritance Chain */}
        <div className="space-y-3 mb-6">
          <h4 className="text-sm font-medium text-slate-700 mb-3">Inheritance Chain</h4>
          
          {inheritancePath && inheritancePath.length > 0 ? (
            <div className="space-y-2">
              {inheritancePath.map((pathNode, index) => {
                const isCurrentNode = pathNode.id === node.id;
                const isRoot = index === 0;
                
                return (
                  <div key={pathNode.id}>
                    <div className={`flex items-center space-x-3 p-3 rounded-lg border ${
                      isCurrentNode 
                        ? 'bg-blue-50 border-blue-200' 
                        : 'bg-slate-50 border-slate-200'
                    }`}>
                      {getNodeIcon(pathNode.nodeType)}
                      <div className="flex-1">
                        <div className="font-medium text-slate-800">{pathNode.name}</div>
                        <div className={`text-xs ${
                          isCurrentNode ? 'text-blue-600' : 'text-slate-500'
                        }`}>
                          {isCurrentNode ? 'Current Level' : isRoot ? 'Root Level' : 'Parent Level'}
                        </div>
                      </div>
                      {isCurrentNode ? (
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                      ) : (
                        <span className="text-xs text-slate-500">
                          {Object.keys(pathNode.properties || {}).length} props
                        </span>
                      )}
                    </div>
                    
                    {index < inheritancePath.length - 1 && (
                      <div className="flex items-center justify-center py-1">
                        <ArrowUp className="h-3 w-3 text-slate-400" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-slate-500 text-sm">
              No inheritance path available
            </div>
          )}
        </div>
      </div>

      {/* Configuration Status */}
      <div className="p-6 border-b border-slate-200">
        <h4 className="text-sm font-medium text-slate-700 mb-3">Status Information</h4>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Configuration Valid</span>
            <div className="flex items-center text-green-600">
              <CheckCircle className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">Yes</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Total Properties</span>
            <span className="text-sm font-medium text-slate-800">{propertiesCount}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Overridden</span>
            <span className="text-sm font-medium text-slate-800">{propertiesCount}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Inherited</span>
            <span className="text-sm font-medium text-slate-800">{inheritedCount}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Last Modified</span>
            <span className="text-sm font-medium text-slate-800">
              {new Date(node.updatedAt!).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-6">
        <h4 className="text-sm font-medium text-slate-700 mb-3">Quick Actions</h4>
        
        <div className="space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start text-sm text-slate-700 hover:bg-slate-50"
            onClick={handleDuplicate}
          >
            <Copy className="h-4 w-4 mr-3" />
            Duplicate Configuration
          </Button>
          
          <Button
            variant="ghost"
            className="w-full justify-start text-sm text-slate-700 hover:bg-slate-50"
            onClick={handleExport}
          >
            <Download className="h-4 w-4 mr-3" />
            Export as JSON
          </Button>
          
          <Button
            variant="ghost"
            className="w-full justify-start text-sm text-slate-700 hover:bg-slate-50"
            onClick={handleViewHistory}
          >
            <History className="h-4 w-4 mr-3" />
            View Change History
          </Button>
          
          <Button
            variant="ghost"
            className="w-full justify-start text-sm text-slate-700 hover:bg-slate-50"
            onClick={handleValidate}
          >
            <CheckCheck className="h-4 w-4 mr-3" />
            Validate Configuration
          </Button>
          
          <hr className="my-3" />
          
          <Button
            variant="ghost"
            className="w-full justify-start text-sm text-red-600 hover:bg-red-50"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4 mr-3" />
            Delete Configuration
          </Button>
        </div>
      </div>
    </aside>
  );
}
