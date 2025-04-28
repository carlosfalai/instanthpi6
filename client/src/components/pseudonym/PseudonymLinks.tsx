import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Link, useLocation } from 'wouter';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Loader2, 
  Search, 
  Plus, 
  LinkIcon, 
  MessageSquare,
  Trash2,
  UserRound,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  PseudonymLink,
  pseudonymMappingService
} from '@/services/pseudonymMapping';
import { format } from 'date-fns';

interface PseudonymLinksProps {
  pseudonym?: string;
  onSelectLink?: (link: PseudonymLink) => void;
}

export function PseudonymLinks({ pseudonym, onSelectLink }: PseudonymLinksProps) {
  const [searchQuery, setSearchQuery] = useState(pseudonym || '');
  const { toast } = useToast();
  
  // Get all pseudonym links or filter by pseudonym if provided
  const {
    data: pseudonymLinks = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['/api/pseudonym-links', searchQuery],
    queryFn: async () => {
      if (searchQuery) {
        return await pseudonymMappingService.findLinksByPseudonym(searchQuery);
      } else {
        return await pseudonymMappingService.getPseudonymLinks();
      }
    }
  });

  // Delete a pseudonym link
  const deleteLinkMutation = useMutation({
    mutationFn: async (linkId: number) => {
      return await pseudonymMappingService.deletePseudonymLink(linkId);
    },
    onSuccess: () => {
      toast({
        title: 'Link Deleted',
        description: 'The pseudonym link was successfully deleted.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/pseudonym-links'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Delete Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Handle search
  const handleSearch = () => {
    refetch();
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch (error) {
      return dateString;
    }
  };

  // Handle delete link
  const handleDeleteLink = (id: number, pseudonym: string) => {
    if (confirm(`Are you sure you want to delete the link for "${pseudonym}"?`)) {
      deleteLinkMutation.mutate(id);
    }
  };

  useEffect(() => {
    // Update search query if pseudonym prop changes
    if (pseudonym && pseudonym !== searchQuery) {
      setSearchQuery(pseudonym);
    }
  }, [pseudonym]);

  return (
    <div className="flex flex-col gap-4">
      {/* Search Bar */}
      <Card className="bg-[#1A1A1A] border-[#333]">
        <CardHeader className="pb-2">
          <CardTitle className="text-white flex items-center">
            <LinkIcon className="h-5 w-5 mr-2 text-blue-500" />
            Patient Pseudonym Links
          </CardTitle>
          <CardDescription className="text-gray-400">
            View and manage links between patient pseudonyms and their chat conversations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex w-full items-center space-x-2">
            <Input
              placeholder="Search by pseudonym (e.g., '847 Ancient Meadows')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={isLoading}
              className="bg-[#252525] border-[#444] text-white"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button 
              onClick={handleSearch} 
              disabled={isLoading}
              variant="outline"
              className="border-[#444] hover:bg-[#333]"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
            <Button 
              onClick={() => refetch()} 
              disabled={isLoading}
              variant="outline"
              className="border-[#444] hover:bg-[#333]"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Links List */}
      <Card className="bg-[#1A1A1A] border-[#333] flex-grow">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-white text-lg">
              {searchQuery 
                ? `Links for "${searchQuery}"`
                : 'All Pseudonym Links'
              }
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              disabled={deleteLinkMutation.isPending}
              className="border-[#444] hover:bg-[#333] text-blue-400 hover:text-blue-300"
              onClick={() => {
                // Clear search to show all links
                setSearchQuery('');
                refetch();
              }}
            >
              {deleteLinkMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <UserRound className="h-4 w-4 mr-2" />
              )}
              Show All Links
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[300px] w-full">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            ) : error ? (
              <div className="p-6 text-center">
                <p className="text-red-400">Error loading pseudonym links</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => refetch()}
                  className="mt-2 border-[#444] hover:bg-[#333]"
                >
                  Try Again
                </Button>
              </div>
            ) : pseudonymLinks.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-gray-400">
                  {searchQuery 
                    ? `No links found for "${searchQuery}"`
                    : 'No pseudonym links found'
                  }
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#333]">
                {pseudonymLinks.map((link) => (
                  <div 
                    key={link.id}
                    className="p-4 hover:bg-[#252525] transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-grow">
                        <h3 className="text-blue-400 text-lg font-medium">{link.pseudonym}</h3>
                        <div className="flex items-center text-gray-400 text-sm mt-1">
                          <UserRound className="h-4 w-4 mr-1" />
                          <span>Patient: {link.patientName}</span>
                        </div>
                        <div className="text-gray-500 text-xs mt-1">
                          Linked on {formatDate(link.timestamp)}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost" 
                          size="sm"
                          className="h-8 w-8 p-0 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                          asChild
                        >
                          <Link to={`/chat/${link.patientId}`}>
                            <MessageSquare className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost" 
                          size="sm"
                          className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                          onClick={() => handleDeleteLink(link.id, link.pseudonym)}
                          disabled={deleteLinkMutation.isPending}
                        >
                          {deleteLinkMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

export default PseudonymLinks;