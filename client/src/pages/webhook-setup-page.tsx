import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Webhook, CheckCircle, XCircle, Settings } from 'lucide-react';
import AppLayoutSpruce from '@/components/layout/AppLayoutSpruce';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

export default function WebhookSetupPage() {
  const [webhookUrl, setWebhookUrl] = useState('https://instanthpi-cff3.replit.app/api/spruce/webhook');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch existing webhooks
  const { data: webhooks, isLoading, refetch } = useQuery({
    queryKey: ['/api/spruce/webhooks'],
    queryFn: async () => {
      const response = await fetch('/api/spruce/webhooks');
      if (!response.ok) {
        throw new Error('Failed to fetch webhooks');
      }
      return response.json();
    },
  });

  // Setup webhook mutation
  const setupWebhookMutation = useMutation({
    mutationFn: async (url: string) => {
      const response = await fetch('/api/spruce/webhooks/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ webhookUrl: url }),
      });
      if (!response.ok) {
        throw new Error('Failed to setup webhook');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Webhook setup successful",
        description: "Your webhook has been registered with Spruce Health.",
      });
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Webhook setup failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete webhook mutation
  const deleteWebhookMutation = useMutation({
    mutationFn: async (webhookId: string) => {
      const response = await fetch(`/api/spruce/webhooks/${webhookId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete webhook');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Webhook deleted",
        description: "The webhook has been removed successfully.",
      });
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete webhook",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSetupWebhook = () => {
    if (!webhookUrl.trim()) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid webhook URL.",
        variant: "destructive",
      });
      return;
    }
    setupWebhookMutation.mutate(webhookUrl.trim());
  };

  const handleDeleteWebhook = (webhookId: string) => {
    deleteWebhookMutation.mutate(webhookId);
  };

  return (
    <AppLayoutSpruce>
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">Webhook Configuration</h1>
          <p className="text-muted-foreground">
            Configure webhooks to receive real-time notifications from Spruce Health when new messages arrive.
          </p>
        </div>

        {/* Setup New Webhook */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Setup New Webhook
            </CardTitle>
            <CardDescription>
              Register a webhook endpoint to receive real-time notifications for messages and conversations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Webhook URL</label>
                <Input
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://yourdomain.com/api/spruce/webhook"
                  disabled={setupWebhookMutation.isPending}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This URL will receive webhook notifications from Spruce Health.
                </p>
              </div>
              
              <Button
                onClick={handleSetupWebhook}
                disabled={setupWebhookMutation.isPending || !webhookUrl.trim()}
                className="w-full"
              >
                {setupWebhookMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up webhook...
                  </>
                ) : (
                  <>
                    <Webhook className="mr-2 h-4 w-4" />
                    Setup Webhook
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Existing Webhooks */}
        <Card>
          <CardHeader>
            <CardTitle>Active Webhooks</CardTitle>
            <CardDescription>
              Manage your existing webhook subscriptions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : webhooks?.webhooks?.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Webhook className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No webhooks configured yet</p>
                <p className="text-sm">Set up your first webhook above to start receiving real-time notifications.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {webhooks?.webhooks?.map((webhook: any) => (
                  <div
                    key={webhook.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={webhook.active ? "default" : "secondary"}>
                          {webhook.active ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Active
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3 mr-1" />
                              Inactive
                            </>
                          )}
                        </Badge>
                      </div>
                      <p className="font-medium text-sm">{webhook.url}</p>
                      <p className="text-xs text-muted-foreground">
                        Events: {webhook.events?.join(', ') || 'No events configured'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Created: {new Date(webhook.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteWebhook(webhook.id)}
                      disabled={deleteWebhookMutation.isPending}
                    >
                      {deleteWebhookMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Delete'
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Webhook Events Information */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Supported Events</CardTitle>
            <CardDescription>
              Your webhook will receive notifications for these Spruce Health events.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 border border-border rounded-lg">
                <h4 className="font-medium text-sm mb-1">message.created</h4>
                <p className="text-xs text-muted-foreground">
                  Triggered when a new message is received in any conversation
                </p>
              </div>
              <div className="p-3 border border-border rounded-lg">
                <h4 className="font-medium text-sm mb-1">conversation.created</h4>
                <p className="text-xs text-muted-foreground">
                  Triggered when a new conversation is started with a patient
                </p>
              </div>
              <div className="p-3 border border-border rounded-lg">
                <h4 className="font-medium text-sm mb-1">conversation.updated</h4>
                <p className="text-xs text-muted-foreground">
                  Triggered when conversation metadata or status changes
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayoutSpruce>
  );
}