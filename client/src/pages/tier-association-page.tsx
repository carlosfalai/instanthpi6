import { useState } from "react";
import {
  LayoutGrid,
  Users,
  UserCog,
  FileText,
  Clipboard,
  ThumbsUp,
  ThumbsDown,
  MoreHorizontal,
  Copy,
  MessageSquare,
  Settings,
  Search,
  Filter,
  Plus,
  SquarePen,
  Hospital,
  Stethoscope,
  Ambulance,
  Home,
  HeartPulse,
} from "lucide-react";
import ModernLayout from "@/components/layout/ModernLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface CommunityPost {
  id: number;
  title: string;
  content: string;
  category: string;
  practiceType: string;
  votes: number;
  comments: number;
  author: {
    name: string;
    avatar: string;
    specialty: string;
  };
  datePosted: string;
  userVote: "up" | "down" | null;
}

const PRACTICE_TYPES = [
  { value: "all", label: "All Settings" },
  { value: "outpatient", label: "Outpatient", icon: <Stethoscope className="h-4 w-4" /> },
  { value: "inpatient", label: "Inpatient", icon: <Hospital className="h-4 w-4" /> },
  { value: "emergency", label: "Emergency Department", icon: <Ambulance className="h-4 w-4" /> },
  { value: "snf", label: "Skilled Nursing", icon: <Home className="h-4 w-4" /> },
  { value: "hospice", label: "Hospice", icon: <HeartPulse className="h-4 w-4" /> },
];

// Sample data
const samplePosts: CommunityPost[] = [
  {
    id: 1,
    title: "Comprehensive SOAP template for routine follow-ups",
    content:
      "Here's a template I've been using for routine follow-ups that has saved me significant time:\n\n**Subjective:**\nPatient reports [symptoms].\nMedication compliance: [Good/Poor].\nSide effects: [None/Specify].\n\n**Objective:**\nVital signs: BP [x/y], HR [z], RR [w], Temp [t], O2 Sat [s]%\nPhysical exam:\n- General: [findings]\n- Cardiac: [findings]\n...",
    category: "Templates",
    practiceType: "outpatient",
    votes: 24,
    comments: 5,
    author: {
      name: "Dr. Sarah Chen",
      avatar: "",
      specialty: "Family Medicine",
    },
    datePosted: "2 days ago",
    userVote: "up",
  },
  {
    id: 2,
    title: "FormSite questionnaire for new chronic pain patients",
    content:
      "This FormSite questionnaire helps me gather comprehensive information before the first visit with chronic pain patients. It includes pain scales, medication history, functional impact assessment, and psychological screening questions. This has improved my first visits significantly.\n\nI've attached the template that you can copy directly to your FormSite account.",
    category: "FormSite",
    practiceType: "outpatient",
    votes: 18,
    comments: 7,
    author: {
      name: "Dr. Michael Rodriguez",
      avatar: "",
      specialty: "Pain Management",
    },
    datePosted: "1 week ago",
    userVote: null,
  },
  {
    id: 3,
    title: "AI prompt for generating discharge instructions",
    content:
      'I\'ve been using this AI prompt with Claude to generate detailed discharge instructions for common conditions. Just fill in the specifics for your patient:\n\n"Generate discharge instructions for a [age] [gender] diagnosed with [condition]. Include medication dosing for [medication], activity restrictions, follow-up timing, and warning signs that require immediate attention. The patient has [comorbidities] and their health literacy is [basic/moderate/advanced]."',
    category: "AI Prompts",
    practiceType: "emergency",
    votes: 32,
    comments: 12,
    author: {
      name: "Dr. James Wilson",
      avatar: "",
      specialty: "Emergency Medicine",
    },
    datePosted: "3 days ago",
    userVote: "up",
  },
  {
    id: 4,
    title: "Nursing home initial assessment template",
    content:
      "This comprehensive template helps standardize initial assessments for new SNF patients. It includes sections for cognitive assessment, fall risk, skin integrity, nutritional status, and advance directives. Our facility has seen improved documentation quality since implementing this.",
    category: "Templates",
    practiceType: "snf",
    votes: 15,
    comments: 3,
    author: {
      name: "Dr. Patricia Johnson",
      avatar: "",
      specialty: "Geriatrics",
    },
    datePosted: "2 weeks ago",
    userVote: "down",
  },
];

export default function TierAssociationPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("community");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPracticeType, setSelectedPracticeType] = useState("all");
  const [showNewPostDialog, setShowNewPostDialog] = useState(false);
  const [newPost, setNewPost] = useState({
    title: "",
    content: "",
    category: "Templates",
    practiceType: "outpatient",
  });
  const [posts, setPosts] = useState<CommunityPost[]>(samplePosts);

  // Doctor messaging state
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [messageText, setMessageText] = useState("");
  const [doctorMessages, setDoctorMessages] = useState<any[]>([]);

  // Sample doctors in association
  const associationDoctors = [
    { id: "1", name: "Dr. Sarah Chen", specialty: "Cardiology", online: true, avatar: "SC" },
    { id: "2", name: "Dr. Marcus Rodriguez", specialty: "Pediatrics", online: false, avatar: "MR" },
    {
      id: "3",
      name: "Dr. Aisha Patel",
      specialty: "Internal Medicine",
      online: true,
      avatar: "AP",
    },
    {
      id: "4",
      name: "Dr. James Wilson",
      specialty: "Emergency Medicine",
      online: true,
      avatar: "JW",
    },
    { id: "5", name: "Dr. Emily Zhang", specialty: "Family Medicine", online: true, avatar: "EZ" },
  ];

  const handleVote = (postId: number, voteType: "up" | "down") => {
    setPosts(
      posts.map((post) => {
        if (post.id === postId) {
          const currentVote = post.userVote;
          let voteChange = 0;

          if (currentVote === voteType) {
            // Cancel vote if clicking the same button
            voteChange = voteType === "up" ? -1 : 1;
            return { ...post, votes: post.votes + voteChange, userVote: null };
          } else if (currentVote === null) {
            // New vote
            voteChange = voteType === "up" ? 1 : -1;
            return { ...post, votes: post.votes + voteChange, userVote: voteType };
          } else {
            // Change vote (from up to down or vice versa)
            voteChange = voteType === "up" ? 2 : -2;
            return { ...post, votes: post.votes + voteChange, userVote: voteType };
          }
        }
        return post;
      })
    );
  };

  const handleCopyContent = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Content copied",
      description: "The content has been copied to your clipboard.",
    });
  };

  const handleCreatePost = () => {
    if (!newPost.title || !newPost.content) {
      toast({
        title: "Missing information",
        description: "Please provide both a title and content for your post.",
        variant: "destructive",
      });
      return;
    }

    const newPostObject: CommunityPost = {
      id: Date.now(),
      title: newPost.title,
      content: newPost.content,
      category: newPost.category,
      practiceType: newPost.practiceType,
      votes: 0,
      comments: 0,
      author: {
        name: "Dr. Carlos Font",
        avatar: "",
        specialty: "Family Medicine",
      },
      datePosted: "Just now",
      userVote: null,
    };

    setPosts([newPostObject, ...posts]);
    setShowNewPostDialog(false);
    setNewPost({
      title: "",
      content: "",
      category: "Templates",
      practiceType: "outpatient",
    });

    toast({
      title: "Post created",
      description: "Your contribution has been shared with the community.",
    });
  };

  // Filter posts based on search, category, and practice type
  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      searchQuery === "" ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === "all" || post.category === selectedCategory;
    const matchesPracticeType =
      selectedPracticeType === "all" || post.practiceType === selectedPracticeType;

    return matchesSearch && matchesCategory && matchesPracticeType;
  });

  return (
    <ModernLayout title="Tier Association" description="Manage tier associations">
      <div className="px-6 py-4">
        <header className="mb-6">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Tier 3.5 (The Association)
          </h1>
          <p className="text-gray-400 max-w-3xl mb-4">
            A collaborative community platform for healthcare professionals to share resources,
            templates, and best practices.
          </p>
        </header>

        <Tabs defaultValue="community" className="w-full" onValueChange={setActiveTab}>
          <div className="flex justify-between items-center mb-4">
            <TabsList className="bg-slate-900 border border-slate-800">
              <TabsTrigger value="community" className="data-[state=active]:bg-slate-800">
                <LayoutGrid className="h-4 w-4 mr-2" />
                Forum
              </TabsTrigger>
              <TabsTrigger value="messages" className="data-[state=active]:bg-slate-800">
                <MessageSquare className="h-4 w-4 mr-2" />
                Doctor Messages
              </TabsTrigger>
              <TabsTrigger value="my-resources" className="data-[state=active]:bg-slate-800">
                <FileText className="h-4 w-4 mr-2" />
                My Resources
              </TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-slate-800">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </TabsTrigger>
            </TabsList>
            <Button onClick={() => setShowNewPostDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Resource
            </Button>
          </div>

          <TabsContent value="community" className="space-y-6">
            <div className="flex flex-col space-y-4">
              <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search resources..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex space-x-2">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="min-w-[120px]">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="Templates">Templates</SelectItem>
                      <SelectItem value="FormSite">FormSite</SelectItem>
                      <SelectItem value="AI Prompts">AI Prompts</SelectItem>
                      <SelectItem value="Protocols">Clinical Protocols</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={selectedPracticeType} onValueChange={setSelectedPracticeType}>
                    <SelectTrigger className="min-w-[150px]">
                      <SelectValue placeholder="Practice Setting" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRACTICE_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center">
                            {type.icon && <span className="mr-2">{type.icon}</span>}
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                {filteredPosts.length === 0 ? (
                  <Card className="bg-[#1A1A1A] border-[#333]">
                    <CardContent className="pt-6 text-center">
                      <p className="text-gray-400">No resources found matching your criteria.</p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredPosts.map((post) => (
                    <Card key={post.id} className="bg-[#1A1A1A] border-[#333]">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="bg-blue-800 text-xs">
                                  {post.author.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium text-gray-300">
                                {post.author.name}
                              </span>
                              <span className="text-xs text-gray-500">• {post.datePosted}</span>
                            </div>
                            <CardTitle className="text-lg mb-1">{post.title}</CardTitle>
                          </div>
                          <div className="flex space-x-1">
                            <Badge
                              variant="secondary"
                              className="text-xs font-normal bg-blue-900/30 text-blue-400 hover:bg-blue-900/40"
                            >
                              {post.category}
                            </Badge>
                            {post.practiceType !== "all" && (
                              <Badge
                                variant="outline"
                                className="text-xs font-normal border-gray-700 text-gray-400"
                              >
                                {PRACTICE_TYPES.find((t) => t.value === post.practiceType)?.label}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <div className="text-sm text-gray-300 whitespace-pre-line mb-2 line-clamp-6">
                          {post.content}
                        </div>
                        {post.content.length > 300 && (
                          <Button variant="link" size="sm" className="text-xs p-0 h-auto">
                            Show more
                          </Button>
                        )}
                      </CardContent>
                      <CardFooter className="flex justify-between pt-2">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className={`h-8 w-8 rounded-full ${post.userVote === "up" ? "text-green-500" : "text-gray-400"}`}
                              onClick={() => handleVote(post.id, "up")}
                            >
                              <ThumbsUp className="h-4 w-4" />
                            </Button>
                            <span
                              className={`text-sm ${post.votes > 0 ? "text-green-500" : post.votes < 0 ? "text-red-500" : "text-gray-500"}`}
                            >
                              {post.votes}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className={`h-8 w-8 rounded-full ${post.userVote === "down" ? "text-red-500" : "text-gray-400"}`}
                              onClick={() => handleVote(post.id, "down")}
                            >
                              <ThumbsDown className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Button variant="ghost" size="sm" className="h-8 text-gray-400">
                              <MessageSquare className="h-4 w-4 mr-1" />
                              <span className="text-xs">{post.comments}</span>
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-gray-400"
                            onClick={() => handleCopyContent(post.content)}
                          >
                            <Copy className="h-4 w-4 mr-1" />
                            <span className="text-xs">Copy</span>
                          </Button>
                        </div>
                      </CardFooter>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          {/* Doctor Messages Tab */}
          <TabsContent value="messages" className="space-y-4">
            <div className="grid grid-cols-3 gap-4 h-[600px]">
              {/* Doctor List */}
              <Card className="bg-slate-900 border-slate-800 col-span-1">
                <CardHeader className="pb-3">
                  <CardTitle className="text-slate-100 text-base">Association Members</CardTitle>
                  <CardDescription className="text-slate-400 text-sm">
                    {associationDoctors.filter((d) => d.online).length} online
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="space-y-1 p-4">
                    {associationDoctors.map((doctor) => (
                      <button
                        key={doctor.id}
                        onClick={() => setSelectedDoctor(doctor)}
                        className={`w-full p-3 rounded-md text-left transition-all ${
                          selectedDoctor?.id === doctor.id
                            ? "bg-slate-800 border border-slate-700"
                            : "hover:bg-slate-800/50 border border-transparent"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700">
                              <span className="text-sm font-medium text-slate-300">
                                {doctor.avatar}
                              </span>
                            </div>
                            {doctor.online && (
                              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-900"></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-200 truncate">
                              {doctor.name}
                            </p>
                            <p className="text-xs text-slate-500">{doctor.specialty}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Message Area */}
              <Card className="bg-slate-900 border-slate-800 col-span-2 flex flex-col">
                {selectedDoctor ? (
                  <>
                    <CardHeader className="border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700">
                          <span className="text-sm font-medium text-slate-300">
                            {selectedDoctor.avatar}
                          </span>
                        </div>
                        <div>
                          <CardTitle className="text-slate-100 text-base">
                            {selectedDoctor.name}
                          </CardTitle>
                          <CardDescription className="text-slate-400 text-xs">
                            {selectedDoctor.specialty} •{" "}
                            {selectedDoctor.online ? "Online" : "Offline"}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>

                    {/* Messages */}
                    <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
                      {doctorMessages.filter(
                        (m) => m.to === selectedDoctor.id || m.from === selectedDoctor.id
                      ).length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                          <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p>No messages yet</p>
                          <p className="text-xs mt-1">
                            Start a conversation with {selectedDoctor.name}
                          </p>
                        </div>
                      ) : (
                        doctorMessages
                          .filter((m) => m.to === selectedDoctor.id || m.from === selectedDoctor.id)
                          .map((msg) => (
                            <div
                              key={msg.id}
                              className={`flex ${msg.from === "me" ? "justify-end" : "justify-start"}`}
                            >
                              <div
                                className={`max-w-[70%] rounded-lg p-3 ${
                                  msg.from === "me"
                                    ? "bg-slate-800 border border-slate-700"
                                    : "bg-slate-850 border border-slate-750"
                                }`}
                              >
                                <p className="text-sm text-slate-200">{msg.text}</p>
                                <p className="text-xs text-slate-500 mt-1">
                                  {new Date(msg.timestamp).toLocaleTimeString()}
                                </p>
                              </div>
                            </div>
                          ))
                      )}
                    </CardContent>

                    {/* Message Input */}
                    <CardFooter className="border-t border-slate-800 p-4">
                      <div className="flex gap-2 w-full">
                        <Textarea
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                          placeholder={`Message ${selectedDoctor.name}...`}
                          className="bg-slate-800 border-slate-700 text-slate-200 resize-none"
                          rows={2}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              if (messageText.trim()) {
                                setDoctorMessages((prev) => [
                                  ...prev,
                                  {
                                    id: Date.now(),
                                    from: "me",
                                    to: selectedDoctor.id,
                                    text: messageText,
                                    timestamp: new Date().toISOString(),
                                  },
                                ]);
                                setMessageText("");
                                toast({ title: "Message sent" });
                              }
                            }
                          }}
                        />
                        <Button
                          onClick={() => {
                            if (messageText.trim()) {
                              setDoctorMessages((prev) => [
                                ...prev,
                                {
                                  id: Date.now(),
                                  from: "me",
                                  to: selectedDoctor.id,
                                  text: messageText,
                                  timestamp: new Date().toISOString(),
                                },
                              ]);
                              setMessageText("");
                              toast({ title: "Message sent" });
                            }
                          }}
                          className="bg-slate-800 hover:bg-slate-750 border border-slate-700"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardFooter>
                  </>
                ) : (
                  <CardContent className="flex-1 flex items-center justify-center">
                    <div className="text-center text-slate-500">
                      <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p>Select a doctor to start messaging</p>
                      <p className="text-xs mt-1">Collaborate with association members</p>
                    </div>
                  </CardContent>
                )}
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="my-resources" className="space-y-4">
            <div className="bg-[#1A1A1A] border border-[#333] rounded-lg p-6 text-center">
              <SquarePen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">Share Your Knowledge</h3>
              <p className="text-gray-400 mb-4">
                Create and share templates, FormSite questionnaires, or AI prompts with the
                community.
              </p>
              <Button onClick={() => setShowNewPostDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create New Resource
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card className="bg-[#1A1A1A] border-[#333]">
              <CardHeader>
                <CardTitle>Community Settings</CardTitle>
                <CardDescription>
                  Configure your preferences for the community platform
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Notification Preferences</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">
                      Email notifications for comments on your posts
                    </span>
                    <Button variant="outline" size="sm">
                      Enable
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">
                      Email digest of top resources (weekly)
                    </span>
                    <Button variant="outline" size="sm">
                      Enable
                    </Button>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Privacy Settings</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Show my specialty with posts</span>
                    <Button variant="outline" size="sm">
                      Enabled
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">
                      Allow others to contact me directly
                    </span>
                    <Button variant="outline" size="sm">
                      Disable
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* New Post Dialog */}
        <Dialog open={showNewPostDialog} onOpenChange={setShowNewPostDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Share a Resource with the Community</DialogTitle>
              <DialogDescription>
                Templates, FormSite questions, AI prompts and other tools you want to share with
                other doctors.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input
                  placeholder="Title of your resource"
                  value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Select
                    value={newPost.category}
                    onValueChange={(value) => setNewPost({ ...newPost, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Templates">Templates</SelectItem>
                      <SelectItem value="FormSite">FormSite</SelectItem>
                      <SelectItem value="AI Prompts">AI Prompts</SelectItem>
                      <SelectItem value="Protocols">Clinical Protocols</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Practice Setting</label>
                  <Select
                    value={newPost.practiceType}
                    onValueChange={(value) => setNewPost({ ...newPost, practiceType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select setting" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRACTICE_TYPES.filter((t) => t.value !== "all").map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center">
                            {type.icon && <span className="mr-2">{type.icon}</span>}
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Content</label>
                <Textarea
                  placeholder="Share your template, FormSite questions, or other resources here..."
                  className="min-h-[200px]"
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewPostDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreatePost}>Share with Community</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ModernLayout>
  );
}
