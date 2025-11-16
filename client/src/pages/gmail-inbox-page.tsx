import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Mail, MailOpen, Calendar, User, RefreshCw, AlertCircle } from "lucide-react";
import AppLayoutSpruce from "@/components/layout/AppLayoutSpruce";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface GmailEmail {
  id: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
  body: string;
  threadId: string;
  unread: boolean;
}

export default function GmailInboxPage() {
  const [selectedEmail, setSelectedEmail] = useState<GmailEmail | null>(null);
  const { toast } = useToast();

  // Check Gmail connection status
  const { data: gmailStatus } = useQuery({
    queryKey: ["/api/gmail/status"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/gmail/status");
      return res.json();
    },
  });

  // Fetch emails from Gmail "Instanthpi" folder
  const {
    data: emailsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["/api/gmail/emails"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/gmail/emails");
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to fetch emails");
      }
      return res.json();
    },
    enabled: gmailStatus?.connected === true,
    refetchInterval: 60000, // Refresh every minute
  });

  const emails: GmailEmail[] = emailsData?.emails || [];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const extractEmailAddress = (from: string) => {
    const match = from.match(/<(.+)>/);
    return match ? match[1] : from;
  };

  const extractName = (from: string) => {
    const match = from.match(/^(.+?)\s*</);
    return match ? match[1].replace(/"/g, "") : from;
  };

  if (!gmailStatus?.connected) {
    return (
      <AppLayoutSpruce>
        <div className="p-6">
          <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="text-center">
              <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Gmail Not Connected
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Connect your Gmail account to view emails from the "Instanthpi" folder.
              </p>
              <Button
                onClick={async () => {
                  try {
                    const res = await apiRequest("GET", "/api/gmail/auth/url");
                    const data = await res.json();
                    window.location.href = data.authUrl;
                  } catch (error: any) {
                    toast({
                      title: "Error",
                      description: error.message || "Failed to get Gmail auth URL",
                      variant: "destructive",
                    });
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Connect Gmail Account
              </Button>
            </div>
          </div>
        </div>
      </AppLayoutSpruce>
    );
  }

  return (
    <AppLayoutSpruce>
      <div className="h-screen flex bg-white dark:bg-gray-900">
        {/* Email List */}
        <div className="w-96 border-r border-gray-200 dark:border-gray-700 flex flex-col bg-white dark:bg-gray-800">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Gmail Inbox</h1>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => refetch()}
                disabled={isLoading}
                className="h-8 w-8"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Folder: Instanthpi • {emails.length} emails
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {gmailStatus?.email || "cff@centremedicalfont.ca"}
            </p>
          </div>

          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="p-4 text-center">
                <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
                <p className="text-sm text-destructive mb-2">
                  {(error as Error).message || "Failed to load emails"}
                </p>
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  Retry
                </Button>
              </div>
            ) : emails.length === 0 ? (
              <div className="p-4 text-center">
                <Mail className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No emails in Instanthpi folder</p>
              </div>
            ) : (
              <div className="p-2">
                {emails.map((email) => (
                  <div
                    key={email.id}
                    className={`p-3 mb-2 cursor-pointer rounded-lg border transition-all duration-200 ${
                      selectedEmail?.id === email.id
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg"
                        : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                    onClick={() => setSelectedEmail(email)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {email.unread ? (
                          <Mail className="h-5 w-5 text-blue-600" />
                        ) : (
                          <MailOpen className="h-5 w-5 text-gray-400" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3
                            className={`font-medium truncate ${
                              email.unread
                                ? "text-gray-900 dark:text-white font-semibold"
                                : "text-gray-700 dark:text-gray-300"
                            }`}
                          >
                            {extractName(email.from)}
                          </h3>
                          {email.unread && (
                            <Badge variant="default" className="ml-2 text-xs bg-blue-600">
                              New
                            </Badge>
                          )}
                        </div>

                        <p
                          className={`text-sm truncate mb-1 ${
                            email.unread
                              ? "text-gray-900 dark:text-white font-medium"
                              : "text-gray-600 dark:text-gray-400"
                          }`}
                        >
                          {email.subject || "(No Subject)"}
                        </p>

                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {email.snippet}
                        </p>

                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(email.date)}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {extractEmailAddress(email.from)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Email Detail */}
        <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900">
          {!selectedEmail ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Select an email
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Choose an email from the list to view its contents
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Email Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                      {selectedEmail.subject || "(No Subject)"}
                    </h2>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        <span className="font-medium">{extractName(selectedEmail.from)}</span>
                        <span className="ml-2 text-gray-500">
                          &lt;{extractEmailAddress(selectedEmail.from)}&gt;
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        {new Date(selectedEmail.date).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  {selectedEmail.unread && (
                    <Badge variant="default" className="bg-blue-600">
                      Unread
                    </Badge>
                  )}
                </div>
              </div>

              {/* Email Body */}
              <ScrollArea className="flex-1 p-6">
                <div className="max-w-4xl mx-auto">
                  <div className="prose dark:prose-invert max-w-none">
                    <div
                      className="text-gray-900 dark:text-white whitespace-pre-wrap"
                      dangerouslySetInnerHTML={{
                        __html: selectedEmail.body || selectedEmail.snippet || "No content",
                      }}
                    />
                  </div>
                </div>
              </ScrollArea>
            </>
          )}
        </div>
      </div>
    </AppLayoutSpruce>
  );
}

