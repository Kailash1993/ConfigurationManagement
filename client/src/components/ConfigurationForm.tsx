import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddPropertyModal } from "./AddPropertyModal";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { 
  Save, 
  Undo, 
  Clock, 
  Link, 
  Layers,
  Plus,
  Trash2,
  Info,
  ArrowUp
} from "lucide-react";
import type { ConfigNode } from "@shared/schema";

interface ConfigurationFormProps {
  node: ConfigNode;
  onNodeUpdate: (node: ConfigNode) => void;
}

const basicConfigSchema = z.object({
  name: z.string().min(1, "Configuration name is required"),
  environment: z.string().optional(),
  region: z.string().optional(),
});

type BasicConfigData = z.infer<typeof basicConfigSchema>;

export function ConfigurationForm({ node, onNodeUpdate }: ConfigurationFormProps) {
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [customProperties, setCustomProperties] = useState(node.properties || {});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<BasicConfigData>({
    resolver: zodResolver(basicConfigSchema),
    defaultValues: {
      name: node.name,
      environment: (node.properties as any)?.environment || "",
      region: (node.properties as any)?.region || "",
    },
  });

  const { data: resolvedConfig } = useQuery({
    queryKey: ['/api/config-nodes', node.id, 'resolve'],
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

  const { data: inheritancePath } = useQuery({
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

  const updateNodeMutation = useMutation({
    mutationFn: async (data: { name?: string; properties?: any }) => {
      return await apiRequest('PATCH', `/api/config-nodes/${node.id}`, data);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['/api/config-nodes'] });
      const updatedNode = await queryClient.fetchQuery({
        queryKey: ['/api/config-nodes', node.id],
      });
      if (updatedNode) {
        onNodeUpdate(updatedNode);
      }
      toast({
        title: "Success",
        description: "Configuration saved successfully",
      });
    },
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
        return;
      }
      toast({
        title: "Error",
        description: "Failed to save configuration",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: BasicConfigData) => {
    const updatedProperties = {
      ...customProperties,
      environment: data.environment,
      region: data.region,
    };

    updateNodeMutation.mutate({
      name: data.name,
      properties: updatedProperties,
    });
  };

  const handleAddProperty = (property: { name: string; type: string; value: any; description?: string }) => {
    setCustomProperties(prev => ({
      ...prev,
      [property.name]: {
        type: property.type,
        value: property.value,
        description: property.description,
      },
    }));
  };

  const handleRemoveProperty = (propertyName: string) => {
    setCustomProperties(prev => {
      const newProps = { ...prev };
      delete newProps[propertyName];
      return newProps;
    });
  };

  const handlePropertyValueChange = (propertyName: string, value: any) => {
    setCustomProperties(prev => ({
      ...prev,
      [propertyName]: {
        ...prev[propertyName],
        value,
      },
    }));
  };

  const handleReset = () => {
    form.reset({
      name: node.name,
      environment: (node.properties as any)?.environment || "",
      region: (node.properties as any)?.region || "",
    });
    setCustomProperties(node.properties || {});
  };

  const renderPropertyInput = (propertyName: string, property: any) => {
    switch (property.type) {
      case 'boolean':
        return (
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <span className="text-sm font-medium text-slate-700">{propertyName}</span>
            <Switch
              checked={property.value}
              onCheckedChange={(checked) => handlePropertyValueChange(propertyName, checked)}
            />
          </div>
        );
      case 'number':
        return (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {propertyName}
            </label>
            <Input
              type="number"
              value={property.value}
              onChange={(e) => handlePropertyValueChange(propertyName, Number(e.target.value))}
            />
            {property.description && (
              <p className="text-xs text-slate-500 mt-1">{property.description}</p>
            )}
          </div>
        );
      case 'select':
        return (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {propertyName}
            </label>
            <Select
              value={property.value}
              onValueChange={(value) => handlePropertyValueChange(propertyName, value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {property.options?.map((option: string) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {property.description && (
              <p className="text-xs text-slate-500 mt-1">{property.description}</p>
            )}
          </div>
        );
      case 'textarea':
        return (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {propertyName}
            </label>
            <Textarea
              value={property.value}
              onChange={(e) => handlePropertyValueChange(propertyName, e.target.value)}
              rows={3}
            />
            {property.description && (
              <p className="text-xs text-slate-500 mt-1">{property.description}</p>
            )}
          </div>
        );
      default:
        return (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {propertyName}
            </label>
            <Input
              type="text"
              value={property.value}
              onChange={(e) => handlePropertyValueChange(propertyName, e.target.value)}
            />
            {property.description && (
              <p className="text-xs text-slate-500 mt-1">{property.description}</p>
            )}
          </div>
        );
    }
  };

  return (
    <>
      {/* Content Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-800 mb-2">{node.name}</h2>
            <div className="flex items-center space-x-4 text-sm text-slate-500">
              <span><Layers className="h-4 w-4 mr-2 inline" />Level: {node.nodeType}</span>
              {inheritancePath && inheritancePath.length > 1 && (
                <span><Link className="h-4 w-4 mr-2 inline" />Parent: {inheritancePath[inheritancePath.length - 2].name}</span>
              )}
              <span><Clock className="h-4 w-4 mr-2 inline" />Modified: {new Date(node.updatedAt!).toLocaleDateString()}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={handleReset}>
              <Undo className="h-4 w-4 mr-2" />
              Reset to Parent
            </Button>
            <Button 
              onClick={() => onSubmit(form.getValues())}
              disabled={updateNodeMutation.isPending}
              className="bg-accent text-white hover:bg-emerald-600"
            >
              <Save className="h-4 w-4 mr-2" />
              {updateNodeMutation.isPending ? "Saving..." : "Save Configuration"}
            </Button>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Configuration</TabsTrigger>
              <TabsTrigger value="custom">Custom Properties</TabsTrigger>
              <TabsTrigger value="resolved">Effective Configuration</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Configuration</CardTitle>
                  <p className="text-sm text-slate-600">
                    Core settings inherited from parent with local overrides
                  </p>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Configuration Name <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <p className="text-xs text-slate-500">
                              This name will be used to identify this configuration node
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="environment"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Environment</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select environment" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="production">Production</SelectItem>
                                  <SelectItem value="staging">Staging</SelectItem>
                                  <SelectItem value="development">Development</SelectItem>
                                </SelectContent>
                              </Select>
                              {inheritancePath && inheritancePath.length > 1 && (
                                <div className="flex items-center mt-1">
                                  <Info className="h-3 w-3 text-blue-500 mr-1" />
                                  <span className="text-xs text-slate-500">
                                    Inherited from {inheritancePath[inheritancePath.length - 2].name}
                                  </span>
                                </div>
                              )}
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="region"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Region</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <div className="flex items-center mt-1">
                                <ArrowUp className="h-3 w-3 text-green-500 mr-1" />
                                <span className="text-xs text-green-600">Override from default</span>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="custom" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Custom Properties
                    <Button onClick={() => setShowAddProperty(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Property
                    </Button>
                  </CardTitle>
                  <p className="text-sm text-slate-600">
                    User-defined configuration properties
                  </p>
                </CardHeader>
                <CardContent>
                  {Object.keys(customProperties).length > 0 ? (
                    <div className="space-y-6">
                      {Object.entries(customProperties)
                        .filter(([key]) => !['environment', 'region'].includes(key))
                        .map(([propertyName, property]) => (
                          <div key={propertyName} className="border border-slate-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center space-x-3">
                                <h4 className="font-medium text-slate-800">{propertyName}</h4>
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                  {(property as any).type}
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveProperty(propertyName)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            {renderPropertyInput(propertyName, property)}
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-slate-600 mb-4">No custom properties defined</p>
                      <Button onClick={() => setShowAddProperty(true)} variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Property
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="resolved" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Effective Configuration</CardTitle>
                  <p className="text-sm text-slate-600">
                    Final resolved configuration with inheritance chain
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-green-400 text-sm font-mono">
                      {JSON.stringify(resolvedConfig || {}, null, 2)}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <AddPropertyModal
        isOpen={showAddProperty}
        onClose={() => setShowAddProperty(false)}
        onAddProperty={handleAddProperty}
      />
    </>
  );
}
