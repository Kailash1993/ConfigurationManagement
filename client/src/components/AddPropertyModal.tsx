import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface AddPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProperty: (property: { name: string; type: string; value: any; description?: string }) => void;
}

const propertySchema = z.object({
  name: z.string().min(1, "Property name is required"),
  type: z.enum(["string", "number", "boolean", "select", "textarea"]),
  description: z.string().optional(),
  defaultValue: z.string().optional(),
  options: z.string().optional(), // For select type, comma-separated
});

type PropertyFormData = z.infer<typeof propertySchema>;

export function AddPropertyModal({ isOpen, onClose, onAddProperty }: AddPropertyModalProps) {
  const [selectedType, setSelectedType] = useState<string>("string");

  const form = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      name: "",
      type: "string",
      description: "",
      defaultValue: "",
      options: "",
    },
  });

  const onSubmit = (data: PropertyFormData) => {
    let value: any = data.defaultValue;

    // Convert value based on type
    switch (data.type) {
      case 'number':
        value = data.defaultValue ? Number(data.defaultValue) : 0;
        break;
      case 'boolean':
        value = false; // Default to false for boolean
        break;
      case 'select':
        const options = data.options?.split(',').map(opt => opt.trim()).filter(Boolean) || [];
        value = options[0] || '';
        break;
      default:
        value = data.defaultValue || '';
    }

    const property = {
      name: data.name,
      type: data.type,
      value,
      description: data.description,
      ...(data.type === 'select' && data.options && {
        options: data.options.split(',').map(opt => opt.trim()).filter(Boolean)
      }),
    };

    onAddProperty(property);
    form.reset();
    onClose();
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Custom Property</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Property Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., cacheSettings" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Property Type</FormLabel>
                  <Select onValueChange={(value) => {
                    field.onChange(value);
                    setSelectedType(value);
                  }} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select property type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="string">String</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="boolean">Boolean</SelectItem>
                      <SelectItem value="select">Select</SelectItem>
                      <SelectItem value="textarea">Textarea</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedType === 'select' && (
              <FormField
                control={form.control}
                name="options"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Options (comma-separated)</FormLabel>
                    <FormControl>
                      <Input placeholder="option1, option2, option3" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {selectedType !== 'boolean' && (
              <FormField
                control={form.control}
                name="defaultValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Value</FormLabel>
                    <FormControl>
                      {selectedType === 'textarea' ? (
                        <Textarea placeholder="Enter default value..." {...field} />
                      ) : (
                        <Input 
                          type={selectedType === 'number' ? 'number' : 'text'}
                          placeholder="Enter default value..." 
                          {...field} 
                        />
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe this property..." rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex items-center justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" className="bg-primary hover:bg-blue-700">
                Add Property
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
