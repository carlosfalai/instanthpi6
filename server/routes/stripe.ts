import { Router } from 'express';
import Stripe from 'stripe';
import { db } from '../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { parseError } from '../utils/errorParser';

// Initialize Stripe with secret key
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is missing');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

const router = Router();

// Create a payment intent (for one-time payments)
router.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount, metadata = {} } = req.body;
    
    if (!amount || isNaN(parseFloat(amount))) {
      return res.status(400).json({ 
        message: 'Invalid amount provided. Please provide a valid amount.' 
      });
    }
    
    // Convert amount to cents (Stripe uses smallest currency unit)
    const amountInCents = Math.round(parseFloat(amount) * 100);
    
    // Create a payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd', // Change to your preferred currency
      metadata: metadata,
      // Optionally, add receipt_email if available
      ...(req.body.email ? { receipt_email: req.body.email } : {})
    });
    
    // Send the client secret back to the client
    res.json({
      clientSecret: paymentIntent.client_secret
    });
    
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ 
      message: 'Failed to create payment intent', 
      error: parseError(error) 
    });
  }
});

// Create or get a subscription for a user
router.post('/get-or-create-subscription', async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Get the user
    const user = req.user as any;
    
    // If user already has a subscription, return it
    if (user.stripeSubscriptionId) {
      try {
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        
        return res.json({
          subscriptionId: subscription.id,
          clientSecret: subscription.latest_invoice?.payment_intent?.client_secret || null,
          status: subscription.status
        });
      } catch (subscriptionError) {
        // If there's an error retrieving the subscription (e.g., it was deleted on Stripe),
        // continue to create a new one
        console.warn('Error retrieving subscription, creating new one:', subscriptionError);
      }
    }
    
    // Get required details from request
    const { priceId, email = user.email } = req.body;
    
    if (!priceId) {
      return res.status(400).json({ message: 'Price ID is required' });
    }
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    // Create or get customer
    let customerId = user.stripeCustomerId;
    
    if (!customerId) {
      // Create new customer
      const customer = await stripe.customers.create({
        email: email,
        name: user.name || user.username || undefined,
        metadata: {
          userId: user.id
        }
      });
      
      customerId = customer.id;
      
      // Update user with customer ID
      await db.update(users)
        .set({ stripeCustomerId: customerId })
        .where(eq(users.id, user.id));
    }
    
    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    });
    
    // Update user record with subscription ID
    await db.update(users)
      .set({ 
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: customerId
      })
      .where(eq(users.id, user.id));
    
    // Return details needed for the client to complete payment
    res.json({
      subscriptionId: subscription.id,
      clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret || null,
      status: subscription.status
    });
    
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ 
      message: 'Failed to create subscription', 
      error: parseError(error) 
    });
  }
});

// Webhook handler for Stripe events
router.post('/webhook', async (req, res) => {
  const signature = req.headers['stripe-signature'];
  
  // Make sure we have what we need
  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(400).json({ message: 'Missing signature or webhook secret' });
  }
  
  let event;
  
  try {
    const body = req.body;
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return res.status(400).json({ message: 'Invalid signature' });
  }
  
  // Handle specific events
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        // Payment was successful
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Payment succeeded:', paymentIntent.id);
        // Add your business logic here: update orders, notify users, etc.
        break;
        
      case 'subscription_schedule.created':
      case 'customer.subscription.created':
        const subscription = event.data.object as Stripe.Subscription;
        console.log('New subscription created:', subscription.id);
        // Add your business logic here
        break;
        
      case 'customer.subscription.updated':
        const updatedSubscription = event.data.object as Stripe.Subscription;
        console.log('Subscription updated:', updatedSubscription.id, 'Status:', updatedSubscription.status);
        
        // If subscription became active (payment succeeded)
        if (updatedSubscription.status === 'active') {
          // Find user with this subscription ID and update their status
          const [user] = await db.select()
            .from(users)
            .where(eq(users.stripeSubscriptionId, updatedSubscription.id));
            
          if (user) {
            // Update user to premium status, update subscription end date, etc.
            await db.update(users)
              .set({ 
                premiumUntil: new Date(updatedSubscription.current_period_end * 1000),
                isPremium: true
              })
              .where(eq(users.id, user.id));
          }
        }
        break;
        
      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object as Stripe.Subscription;
        console.log('Subscription cancelled:', deletedSubscription.id);
        
        // Find user with this subscription ID and update their status
        const [cancelledUser] = await db.select()
          .from(users)
          .where(eq(users.stripeSubscriptionId, deletedSubscription.id));
          
        if (cancelledUser) {
          // Update user to non-premium status
          await db.update(users)
            .set({ 
              premiumUntil: null,
              isPremium: false,
              // Don't remove stripeSubscriptionId to keep payment history
            })
            .where(eq(users.id, cancelledUser.id));
        }
        break;
    }
    
    res.json({ received: true });
  } catch (error) {
    console.error('Error handling webhook event:', error);
    res.status(500).json({ message: 'Error handling webhook event' });
  }
});

// Get available subscription plans
router.get('/plans', async (req, res) => {
  try {
    const prices = await stripe.prices.list({
      active: true,
      expand: ['data.product'],
      type: 'recurring'
    });
    
    // Format the prices to include product details
    const plans = prices.data.map(price => {
      const product = price.product as Stripe.Product;
      return {
        id: price.id,
        productId: product.id,
        name: product.name,
        description: product.description,
        image: product.images?.length ? product.images[0] : null,
        amount: price.unit_amount / 100, // Convert cents to dollars
        currency: price.currency,
        interval: price.recurring?.interval,
        intervalCount: price.recurring?.interval_count,
        active: price.active
      };
    });
    
    res.json({ plans });
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    res.status(500).json({ 
      message: 'Failed to fetch subscription plans', 
      error: parseError(error) 
    });
  }
});

export default router;