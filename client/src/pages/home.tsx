import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { ConfigurationTree } from "@/components/ConfigurationTree";
import { ConfigurationForm } from "@/components/ConfigurationForm";
import { DetailsPanel } from "@/components/DetailsPanel";
import { CreateNodeModal } from "@/components/CreateNodeModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Settings, Search } from "lucide-react";
import type { ConfigNode } from "@shared/schema";

export default function Home() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [selectedNode, setSelectedNode] = useState<ConfigNode | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createModalParent, setCreateModalParent] = useState<ConfigNode | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const handleCreateRoot = () => {
    setCreateModalParent(null);
    setShowCreateModal(true);
  };

  const handleCreateChild = (parent: ConfigNode) => {
    setCreateModalParent(parent);
    setShowCreateModal(true);
  };

  const handleNodeCreated = (node: ConfigNode) => {
    setSelectedNode(node);
    setShowCreateModal(false);
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <Settings className="text-primary text-xl" />
              <h1 className="text-xl font-semibold text-slate-800">Configuration Manager</h1>
            </div>
            
            {/* Breadcrumb - will be updated based on selected node */}
            {selectedNode && (
              <nav className="flex items-center text-sm text-slate-500">
                <span>Configuration</span>
                <span className="mx-2">›</span>
                <span className="text-slate-800 font-medium">{selectedNode.name}</span>
              </nav>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Search Bar */}
            <div className="relative">
              <Input 
                type="text" 
                placeholder="Search configurations..." 
                className="pl-10 pr-4 py-2 w-64"
              />
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            </div>
            
            {/* User Profile */}
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <div className="text-sm font-medium text-slate-800">
                  {user.firstName && user.lastName 
                    ? `${user.firstName} ${user.lastName}` 
                    : user.email || 'User'}
                </div>
                <div className="text-xs text-slate-500">Administrator</div>
              </div>
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.profileImageUrl || undefined} />
                <AvatarFallback>
                  {user.firstName ? user.firstName[0] : user.email?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Tree Sidebar */}
        <ConfigurationTree 
          selectedNode={selectedNode}
          onNodeSelect={setSelectedNode}
          onCreateRoot={handleCreateRoot}
          onCreateChild={handleCreateChild}
        />

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {selectedNode ? (
            <ConfigurationForm 
              node={selectedNode}
              onNodeUpdate={setSelectedNode}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Settings className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-800 mb-2">
                  No Configuration Selected
                </h3>
                <p className="text-slate-600 mb-4">
                  Select a configuration node from the tree or create a new one to get started.
                </p>
                <Button onClick={handleCreateRoot} className="bg-primary hover:bg-blue-700">
                  Create Root Configuration
                </Button>
              </div>
            </div>
          )}
        </main>

        {/* Details Panel */}
        {selectedNode && (
          <DetailsPanel 
            node={selectedNode}
            onNodeUpdate={setSelectedNode}
          />
        )}
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
