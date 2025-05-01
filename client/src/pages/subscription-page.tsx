import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// Components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Loader2, CheckCircle2, AlertCircle, CreditCard } from 'lucide-react';

// Initialize Stripe
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing Stripe public key');
}

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// Plan selection component
const PlanSelection = ({ onPlanSelect, selectedPlan, plans, isLoading }: any) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[150px] w-full rounded-lg" />
        <Skeleton className="h-[150px] w-full rounded-lg" />
        <Skeleton className="h-[150px] w-full rounded-lg" />
      </div>
    );
  }

  if (!plans || plans.length === 0) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No subscription plans available</h3>
        <p className="text-muted-foreground mt-2">Please contact support for assistance.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {plans.map((plan: any) => (
        <Card 
          key={plan.id} 
          className={`relative overflow-hidden transition-all hover:shadow-md ${
            selectedPlan?.id === plan.id ? 'border-primary ring-2 ring-primary' : ''
          }`}
        >
          {selectedPlan?.id === plan.id && (
            <div className="absolute top-0 right-0 -mt-1 -mr-1">
              <Badge className="bg-primary text-primary-foreground">Selected</Badge>
            </div>
          )}
          <CardHeader>
            <CardTitle>{plan.name}</CardTitle>
            <CardDescription>{plan.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mt-1 mb-4">
              <span className="text-3xl font-bold">${plan.amount}</span>
              <span className="text-muted-foreground">/{plan.interval}</span>
            </div>
            <ul className="space-y-2 text-sm">
              {/* Features would go here based on the plan */}
              <li className="flex items-center">
                <CheckCircle2 className="mr-2 h-4 w-4 text-primary" />
                Full access to InstantHPI platform
              </li>
              <li className="flex items-center">
                <CheckCircle2 className="mr-2 h-4 w-4 text-primary" />
                {plan.interval === 'month' 
                  ? 'Monthly updates and features' 
                  : 'Annual updates and premium features'}
              </li>
              <li className="flex items-center">
                <CheckCircle2 className="mr-2 h-4 w-4 text-primary" />
                Priority customer support
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => onPlanSelect(plan)} 
              variant={selectedPlan?.id === plan.id ? "default" : "outline"}
              className="w-full"
            >
              {selectedPlan?.id === plan.id ? 'Selected' : 'Select Plan'}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

// Payment form component
const PaymentForm = ({ clientSecret, onSuccess, onCancel }: any) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const { error: submitError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/subscription?success=true',
        },
        redirect: 'if_required',
      });

      if (submitError) {
        setError(submitError.message || 'An error occurred with the payment');
        toast({
          variant: "destructive",
          title: "Payment failed",
          description: submitError.message || 'Payment processing failed',
        });
      } else {
        toast({
          title: "Payment successful",
          description: "Your subscription has been activated",
        });
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      toast({
        variant: "destructive",
        title: "Payment error",
        description: err.message || 'An unexpected error occurred',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        <PaymentElement />
        
        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
            {error}
          </div>
        )}
        
        <div className="flex justify-end space-x-2 mt-6">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={!stripe || !elements || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Subscribe Now
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
};

// Main subscription page component
export default function SubscriptionPage() {
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch current user subscription status
  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ['/api/user'],
    retry: false,
  });

  // Fetch available subscription plans
  const { data: plansData, isLoading: isLoadingPlans } = useQuery({
    queryKey: ['/api/stripe/plans'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/stripe/plans');
      const data = await res.json();
      return data.plans;
    },
    enabled: !!user,
  });

  // Create subscription mutation
  const createSubscriptionMutation = useMutation({
    mutationFn: async (priceId: string) => {
      const res = await apiRequest('POST', '/api/stripe/get-or-create-subscription', { 
        priceId,
        email: user?.email
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
        setPaymentModalOpen(true);
      } else {
        toast({
          title: "Subscription active",
          description: "Your subscription is already active",
        });
        queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      }
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Subscription error",
        description: error.message || "Failed to create subscription",
      });
    }
  });

  const handlePlanSelect = (plan: any) => {
    setSelectedPlan(plan);
  };

  const handleSubscribe = () => {
    if (!selectedPlan) {
      toast({
        variant: "destructive",
        title: "No plan selected",
        description: "Please select a subscription plan first",
      });
      return;
    }

    createSubscriptionMutation.mutate(selectedPlan.id);
  };

  const handlePaymentSuccess = () => {
    setPaymentModalOpen(false);
    queryClient.invalidateQueries({ queryKey: ['/api/user'] });
  };

  const handlePaymentCancel = () => {
    setPaymentModalOpen(false);
  };

  // Format date to readable format
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="container max-w-5xl py-8">
      <h1 className="text-3xl font-bold mb-1">Subscriptions</h1>
      <p className="text-muted-foreground mb-8">Manage your InstantHPI subscription</p>

      <Tabs defaultValue="manage">
        <TabsList className="mb-4">
          <TabsTrigger value="manage">Manage Subscription</TabsTrigger>
          <TabsTrigger value="plans">Subscription Plans</TabsTrigger>
        </TabsList>

        <TabsContent value="manage">
          <Card>
            <CardHeader>
              <CardTitle>Current Subscription</CardTitle>
              <CardDescription>
                View and manage your current subscription details
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingUser ? (
                <div className="space-y-4">
                  <Skeleton className="h-5 w-[250px]" />
                  <Skeleton className="h-5 w-[200px]" />
                  <Skeleton className="h-5 w-[300px]" />
                </div>
              ) : user?.isPremium ? (
                <div className="space-y-4">
                  <div className="flex items-center">
                    <CheckCircle2 className="text-primary mr-2 h-5 w-5" />
                    <h3 className="font-semibold">Active Subscription</h3>
                  </div>
                  
                  <div className="grid gap-1">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-muted-foreground">Status:</div>
                      <div>
                        <Badge variant="outline" className="bg-primary/10 text-primary">
                          Active
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-muted-foreground">Renewal Date:</div>
                      <div>{formatDate(user?.premiumUntil)}</div>
                    </div>
                    
                    {user?.stripeSubscriptionId && (
                      <div className="grid grid-cols-2 gap-2">
                        <div className="text-muted-foreground">Subscription ID:</div>
                        <div className="font-mono text-sm">{user.stripeSubscriptionId}</div>
                      </div>
                    )}
                  </div>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="mt-4">
                        Cancel Subscription
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will cancel your subscription at the end of the current billing period. 
                          You'll continue to have access until {formatDate(user?.premiumUntil)}.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Nevermind</AlertDialogCancel>
                        <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Cancel Subscription
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center">
                    <AlertCircle className="text-muted-foreground mr-2 h-5 w-5" />
                    <h3 className="font-semibold">No Active Subscription</h3>
                  </div>
                  <p className="text-muted-foreground">
                    You don't have an active subscription. Subscribe to get full access to all features.
                  </p>
                  <Button onClick={() => document.getElementById('plans-tab')?.click()}>
                    View Subscription Plans
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plans" id="plans-tab">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Subscription Plans</CardTitle>
                <CardDescription>
                  Choose a plan that works for you
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PlanSelection 
                  plans={plansData} 
                  isLoading={isLoadingPlans}
                  selectedPlan={selectedPlan}
                  onPlanSelect={handlePlanSelect}
                />
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button 
                  onClick={handleSubscribe} 
                  disabled={
                    !selectedPlan || 
                    createSubscriptionMutation.isPending || 
                    (user?.isPremium && user?.stripeSubscriptionId)
                  }
                >
                  {createSubscriptionMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Subscribe'
                  )}
                </Button>
              </CardFooter>
            </Card>

            {/* Benefits section */}
            <Card>
              <CardHeader>
                <CardTitle>Subscription Benefits</CardTitle>
                <CardDescription>
                  What you get with an InstantHPI subscription
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <h3 className="font-semibold">Enhanced AI Processing</h3>
                    <p className="text-sm text-muted-foreground">
                      Access to advanced AI models for faster and more accurate medical documentation
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold">Priority Support</h3>
                    <p className="text-sm text-muted-foreground">
                      Get priority customer support for any technical issues or questions
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold">Premium Features</h3>
                    <p className="text-sm text-muted-foreground">
                      Unlock premium features like comprehensive billing optimization and advanced analytics
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Payment modal */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Complete Your Subscription</DialogTitle>
            <DialogDescription>
              Enter your payment details to start your subscription
            </DialogDescription>
          </DialogHeader>
          
          {clientSecret && (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <PaymentForm 
                clientSecret={clientSecret}
                onSuccess={handlePaymentSuccess}
                onCancel={handlePaymentCancel}
              />
            </Elements>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}