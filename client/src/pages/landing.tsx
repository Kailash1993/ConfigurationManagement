import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, TreePine, Users, Database } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-3">
            <Settings className="text-primary text-xl" />
            <h1 className="text-xl font-semibold text-slate-800">Configuration Manager</h1>
          </div>
          <Button 
            onClick={() => window.location.href = "/api/login"}
            className="bg-primary hover:bg-blue-700"
          >
            Sign In
          </Button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-800 mb-4">
              Dynamic Configuration Management System
            </h2>
            <p className="text-xl text-slate-600 mb-8">
              Centralized, hierarchical configuration management with inheritance and flexible schema support
            </p>
            <Button 
              size="lg"
              onClick={() => window.location.href = "/api/login"}
              className="bg-primary hover:bg-blue-700"
            >
              Get Started
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TreePine className="text-primary" />
                  <span>Hierarchical Structure</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Create parent-child relationships with automatic inheritance. 
                  Override specific configurations at any level in the hierarchy.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="text-accent" />
                  <span>Flexible Schema</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Define custom properties dynamically. Support for strings, numbers, 
                  booleans, objects, and arrays with automatic form generation.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="text-purple-600" />
                  <span>Multi-User Support</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Secure authentication and user isolation. Each user manages 
                  their own configuration trees with full CRUD capabilities.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
