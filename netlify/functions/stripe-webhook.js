// Stripe Webhook Handler
// Processes Stripe events for subscription management

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Webhook secret from Stripe Dashboard
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

exports.handler = async (event, context) => {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  let stripeEvent;

  try {
    // Verify webhook signature if secret is configured
    if (endpointSecret) {
      const sig = event.headers['stripe-signature'];
      stripeEvent = stripe.webhooks.constructEvent(event.body, sig, endpointSecret);
    } else {
      // For development/testing without signature verification
      stripeEvent = JSON.parse(event.body);
      console.warn('[Stripe Webhook] No endpoint secret configured - signature not verified');
    }
  } catch (err) {
    console.error('[Stripe Webhook] Signature verification failed:', err.message);
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: `Webhook signature verification failed: ${err.message}` }),
    };
  }

  const eventType = stripeEvent.type;
  const eventData = stripeEvent.data.object;

  console.log(`[Stripe Webhook] Received event: ${eventType}`);

  try {
    switch (eventType) {
      case 'checkout.session.completed': {
        // Payment successful, subscription created
        const session = eventData;
        console.log(`[Stripe] Checkout completed: ${session.id}`);
        console.log(`[Stripe] Customer: ${session.customer}`);
        console.log(`[Stripe] Subscription: ${session.subscription}`);
        console.log(`[Stripe] Metadata:`, session.metadata);

        // TODO: Update user record in Supabase with subscription info
        // await updateUserSubscription(session.customer, session.subscription, session.metadata.tierId);

        break;
      }

      case 'customer.subscription.created': {
        const subscription = eventData;
        console.log(`[Stripe] Subscription created: ${subscription.id}`);
        console.log(`[Stripe] Status: ${subscription.status}`);
        console.log(`[Stripe] Customer: ${subscription.customer}`);

        // TODO: Update user subscription status in database
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = eventData;
        console.log(`[Stripe] Subscription updated: ${subscription.id}`);
        console.log(`[Stripe] Status: ${subscription.status}`);
        console.log(`[Stripe] Cancel at period end: ${subscription.cancel_at_period_end}`);

        // TODO: Update subscription status in database
        // Handle upgrades, downgrades, cancellation scheduling
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = eventData;
        console.log(`[Stripe] Subscription deleted: ${subscription.id}`);
        console.log(`[Stripe] Customer: ${subscription.customer}`);

        // TODO: Revoke access, update user to free tier
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = eventData;
        console.log(`[Stripe] Invoice paid: ${invoice.id}`);
        console.log(`[Stripe] Amount: ${invoice.amount_paid / 100} ${invoice.currency.toUpperCase()}`);

        // TODO: Send receipt email, update billing history
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = eventData;
        console.log(`[Stripe] Invoice payment failed: ${invoice.id}`);
        console.log(`[Stripe] Customer: ${invoice.customer}`);

        // TODO: Notify user, schedule retry, possibly downgrade
        break;
      }

      case 'customer.created': {
        const customer = eventData;
        console.log(`[Stripe] Customer created: ${customer.id}`);
        console.log(`[Stripe] Email: ${customer.email}`);

        // TODO: Link Stripe customer to user in database
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${eventType}`);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ received: true }),
    };
  } catch (error) {
    console.error('[Stripe Webhook] Error processing event:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Webhook handler failed' }),
    };
  }
};
