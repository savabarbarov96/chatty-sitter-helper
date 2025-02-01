import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Plus, CheckCircle, XCircle, Plus as PlusIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface WebhookParameter {
  name: string;
  value: string;
}

const Dashboard = () => {
  const [newWebhook, setNewWebhook] = useState({ name: '', url: '' });
  const [parameters, setParameters] = useState<WebhookParameter[]>([]);
  const [lastWebhookResponse, setLastWebhookResponse] = useState<string>('');
  const { toast } = useToast();

  const { data: webhooks, isLoading: isLoadingWebhooks, refetch: refetchWebhooks } = useQuery({
    queryKey: ['webhooks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('webhook_configs')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const { data: logs, isLoading: isLoadingLogs } = useQuery({
    queryKey: ['webhook_logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('webhook_logs')
        .select(`
          *,
          webhook_configs (name)
        `)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data;
    },
  });

  const addParameter = () => {
    setParameters([...parameters, { name: '', value: '' }]);
  };

  const updateParameter = (index: number, field: 'name' | 'value', value: string) => {
    const newParameters = [...parameters];
    newParameters[index][field] = value;
    setParameters(newParameters);
  };

  const removeParameter = (index: number) => {
    setParameters(parameters.filter((_, i) => i !== index));
  };

  const testWebhook = async (webhookUrl: string) => {
    try {
      const payload = Object.fromEntries(
        parameters.map(param => [param.name, param.value])
      );

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.text();
      setLastWebhookResponse(data);
      
      toast({
        title: "Success",
        description: "Webhook tested successfully!",
      });

      // Log the webhook test
      await supabase.from('webhook_logs').insert({
        webhook_id: webhooks?.[0]?.id,
        status: 'success',
        request_payload: payload,
        response_payload: { response: data },
      });

      refetchWebhooks();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to test webhook",
        variant: "destructive"
      });

      // Log the error
      await supabase.from('webhook_logs').insert({
        webhook_id: webhooks?.[0]?.id,
        status: 'error',
        request_payload: Object.fromEntries(parameters.map(param => [param.name, param.value])),
        error_message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('webhook_configs')
        .insert([{
          ...newWebhook,
          parameters: parameters
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Webhook configuration added successfully!",
      });
      setNewWebhook({ name: '', url: '' });
      setParameters([]);
      refetchWebhooks();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add webhook configuration.",
        variant: "destructive"
      });
    }
  };

  // Set up real-time listener for webhook events
  useEffect(() => {
    const channel = supabase
      .channel('webhook-events')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'webhook_logs'
        },
        (payload) => {
          toast({
            title: "New Webhook Event",
            description: `Status: ${payload.new.status}`,
            variant: payload.new.status === 'success' ? 'default' : 'destructive'
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  return (
    <div className="container mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      {/* New Webhook Form */}
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-4">Add New Webhook</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Webhook Name</Label>
            <Input
              id="name"
              value={newWebhook.name}
              onChange={(e) => setNewWebhook(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter webhook name"
              required
            />
          </div>
          <div>
            <Label htmlFor="url">Webhook URL</Label>
            <Input
              id="url"
              value={newWebhook.url}
              onChange={(e) => setNewWebhook(prev => ({ ...prev, url: e.target.value }))}
              placeholder="https://your-n8n-instance/webhook/..."
              required
            />
          </div>

          {/* Parameters Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Parameters</Label>
              <Button type="button" variant="outline" size="sm" onClick={addParameter}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Parameter
              </Button>
            </div>
            {parameters.map((param, index) => (
              <div key={index} className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Parameter name"
                    value={param.name}
                    onChange={(e) => updateParameter(index, 'name', e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <Input
                    placeholder="Parameter value"
                    value={param.value}
                    onChange={(e) => updateParameter(index, 'value', e.target.value)}
                  />
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => removeParameter(index)}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <Button type="submit" className="w-full">
            <Plus className="mr-2 h-4 w-4" /> Add Webhook
          </Button>
        </form>
      </Card>

      {/* Webhook Response */}
      {lastWebhookResponse && (
        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4">Last Webhook Response</h2>
          <Alert>
            <AlertDescription>
              <pre className="whitespace-pre-wrap">{lastWebhookResponse}</pre>
            </AlertDescription>
          </Alert>
        </Card>
      )}

      {/* Webhooks List */}
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-4">Configured Webhooks</h2>
        {isLoadingWebhooks ? (
          <div className="flex justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
                <TableHead>Created At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {webhooks?.map((webhook) => (
                <TableRow key={webhook.id}>
                  <TableCell className="font-medium">{webhook.name}</TableCell>
                  <TableCell>{webhook.url}</TableCell>
                  <TableCell>
                    {webhook.is_active ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testWebhook(webhook.url)}
                    >
                      Test Webhook
                    </Button>
                  </TableCell>
                  <TableCell>
                    {new Date(webhook.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Webhook Logs */}
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-4">Webhook Logs</h2>
        {isLoadingLogs ? (
          <div className="flex justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Webhook</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs?.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">
                    {log.webhook_configs?.name}
                  </TableCell>
                  <TableCell>
                    {log.status === 'success' ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(log.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {log.error_message || 'Success'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
};

export default Dashboard;