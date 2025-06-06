import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import type { ConfigNode } from "@shared/schema";

interface CreateNodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentNode: ConfigNode | null;
  onNodeCreated: (node: ConfigNode) => void;
}

const createNodeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  nodeType: z.enum(["territory", "center"]),
  description: z.string().optional(),
});

type CreateNodeFormData = z.infer<typeof createNodeSchema>;

export function CreateNodeModal({ isOpen, onClose, parentNode, onNodeCreated }: CreateNodeModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CreateNodeFormData>({
    resolver: zodResolver(createNodeSchema),
    defaultValues: {
      name: "",
      nodeType: parentNode ? "center" : "territory",
      description: "",
    },
  });

  function getDefaultChildType(parentType: string): "territory" | "center" {
    switch (parentType) {
      case "territory":
        return "center";
      case "center":
        return "user";
      default:
        return "user";
    }
  }

  const createNodeMutation = useMutation({
    mutationFn: async (data: CreateNodeFormData) => {
      const payload = {
        name: data.name,
        nodeType: data.nodeType,
        parentId: parentNode?.id || null,
        properties: {
          description: data.description,
        },
        defaults: {},
      };
      
      const response = await apiRequest('POST', '/api/config-nodes', payload);
      return await response.json();
    },
    onSuccess: (newNode) => {
      queryClient.invalidateQueries({ queryKey: ['/api/config-nodes'] });
      onNodeCreated(newNode);
      form.reset();
      toast({
        title: "Success",
        description: "Configuration node created successfully",
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
        description: "Failed to create configuration node",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateNodeFormData) => {
    createNodeMutation.mutate(data);
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {parentNode ? `Create Child Node under ${parentNode.name}` : 'Create Root Configuration Node'}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Configuration Name <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Territory1, Center1, User Config" {...field} />
                  </FormControl>
                  <p className="text-xs text-slate-500">
                    This name will be used to identify this configuration node
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="nodeType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Node Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select node type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="territory">Territory</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500">
                    Defines the level in the hierarchy and available features
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe this configuration node..." 
                      rows={3} 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex items-center justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-primary hover:bg-blue-700"
                disabled={createNodeMutation.isPending}
              >
                {createNodeMutation.isPending ? "Creating..." : "Create Node"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
