import express from "express";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const router = express.Router();

// Initialize Stripe with your LIVE keys
const stripe = new Stripe(
  "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",
  {
    apiVersion: "2025-03-31.basil" as any,
  }
);

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_KEY || ""
);

// Subscription Plans
const PLANS = {
  PHYSICIAN_BASIC: {
    name: "Médecin - Basique",
    priceId: "price_physician_basic", // Create in Stripe Dashboard
    price: 4900, // $49/month in cents
    features: ["50 consultations/mois", "Rapports cliniques AI", "Export PDF", "Support email"],
  },
  PHYSICIAN_PRO: {
    name: "Médecin - Professionnel",
    priceId: "price_physician_pro", // Create in Stripe Dashboard
    price: 9900, // $99/month
    features: [
      "Consultations illimitées",
      "Rapports AI avancés",
      "Intégration clinique",
      "API access",
      "Support prioritaire",
    ],
  },
  CLINIC_TEAM: {
    name: "Clinique - Équipe",
    priceId: "price_clinic_team", // Create in Stripe Dashboard
    price: 29900, // $299/month
    features: [
      "Jusqu'à 10 médecins",
      "Tableau de bord clinique",
      "Analytics avancés",
      "Formation incluse",
      "Support dédié",
    ],
  },
};

// Create checkout session
router.post("/create-checkout-session", async (req, res) => {
  try {
    const { planType, physicianEmail, clinicId } = req.body;
    const plan = PLANS[planType as keyof typeof PLANS];

    if (!plan) {
      return res.status(400).json({ error: "Invalid plan type" });
    }

    // Create or get Stripe customer
    let customer;
    const existingCustomers = await stripe.customers.list({
      email: physicianEmail,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
    } else {
      customer = await stripe.customers.create({
        email: physicianEmail,
        metadata: {
          clinicId: clinicId || "",
          planType,
        },
      });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "cad",
            product_data: {
              name: plan.name,
              description: plan.features.join(" • "),
            },
            unit_amount: plan.price,
            recurring: {
              interval: "month",
            },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.CLIENT_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/subscription/cancel`,
      metadata: {
        physicianEmail,
        clinicId: clinicId || "",
        planType,
      },
    });

    res.json({
      checkoutUrl: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error("Stripe error:", error);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

// Webhook handler for Stripe events
router.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutComplete(session);
      break;
    }

    case "customer.subscription.created": {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionCreated(subscription);
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionUpdated(subscription);
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionCancelled(subscription);
      break;
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      await handlePaymentSucceeded(invoice);
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      await handlePaymentFailed(invoice);
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});

// Handle successful checkout
async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const { physicianEmail, clinicId, planType } = session.metadata || {};

  // Store subscription in database
  await supabase.from("physician_subscriptions").insert({
    email: physicianEmail,
    clinic_id: clinicId,
    stripe_customer_id: session.customer,
    stripe_subscription_id: session.subscription,
    plan_type: planType,
    status: "active",
    current_period_start: new Date(),
    current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  });

  // Send welcome email
  console.log(`Subscription created for ${physicianEmail}`);
}

// Handle subscription created
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  await supabase
    .from("physician_subscriptions")
    .update({
      status: "active",
      current_period_start: new Date(subscription.current_period_start * 1000),
      current_period_end: new Date(subscription.current_period_end * 1000),
    })
    .eq("stripe_subscription_id", subscription.id);
}

// Handle subscription updated
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  await supabase
    .from("physician_subscriptions")
    .update({
      status: subscription.status,
      current_period_end: new Date(subscription.current_period_end * 1000),
    })
    .eq("stripe_subscription_id", subscription.id);
}

// Handle subscription cancelled
async function handleSubscriptionCancelled(subscription: Stripe.Subscription) {
  await supabase
    .from("physician_subscriptions")
    .update({
      status: "cancelled",
      cancelled_at: new Date(),
    })
    .eq("stripe_subscription_id", subscription.id);
}

// Handle successful payment
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  await supabase.from("payment_history").insert({
    stripe_invoice_id: invoice.id,
    stripe_customer_id: invoice.customer,
    amount: invoice.amount_paid,
    currency: invoice.currency,
    status: "succeeded",
    paid_at: new Date(),
  });
}

// Handle failed payment
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  await supabase.from("payment_history").insert({
    stripe_invoice_id: invoice.id,
    stripe_customer_id: invoice.customer,
    amount: invoice.amount_due,
    currency: invoice.currency,
    status: "failed",
    failed_at: new Date(),
  });

  // Send payment failed email
  console.log(`Payment failed for customer ${invoice.customer}`);
}

// Get subscription status
router.get("/subscription-status/:email", async (req, res) => {
  try {
    const { email } = req.params;

    const { data, error } = await supabase
      .from("physician_subscriptions")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !data) {
      return res.json({
        hasSubscription: false,
        status: "none",
      });
    }

    res.json({
      hasSubscription: true,
      status: data.status,
      planType: data.plan_type,
      currentPeriodEnd: data.current_period_end,
    });
  } catch (error) {
    console.error("Error checking subscription:", error);
    res.status(500).json({ error: "Failed to check subscription" });
  }
});

// Create customer portal session
router.post("/create-portal-session", async (req, res) => {
  try {
    const { customerId } = req.body;

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.CLIENT_URL}/subscription/manage`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("Portal session error:", error);
    res.status(500).json({ error: "Failed to create portal session" });
  }
});

export default router;
