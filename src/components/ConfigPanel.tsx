import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

const ConfigPanel = () => {
  const [n8nUrl, setN8nUrl] = useState('');
  const { toast } = useToast();

  const handleSave = async () => {
    try {
      // TODO: Save configuration to Supabase
      toast({
        title: "Success",
        description: "Configuration saved successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save configuration.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <h2 className="text-2xl font-bold mb-4">Configuration</h2>
      
      <div className="space-y-2">
        <Label htmlFor="n8n-url">n8n Webhook URL</Label>
        <Input
          id="n8n-url"
          value={n8nUrl}
          onChange={(e) => setN8nUrl(e.target.value)}
          placeholder="https://your-n8n-instance/webhook/..."
        />
      </div>

      <Button onClick={handleSave} className="w-full">
        Save Configuration
      </Button>
    </Card>
  );
};

export default ConfigPanel;