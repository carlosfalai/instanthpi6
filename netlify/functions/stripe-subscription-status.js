// Stripe Subscription Status Checker
// Returns the current subscription status for a customer

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Content-Type": "application/json",
  };

  // Handle preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const { customerId } = event.queryStringParameters || {};

    if (!customerId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "customerId is required" }),
      };
    }

    // Get customer's subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 1,
      expand: ["data.default_payment_method"],
    });

    if (subscriptions.data.length === 0) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          isActive: false,
          tier: null,
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
        }),
      };
    }

    const subscription = subscriptions.data[0];
    const isActive = ["active", "trialing"].includes(subscription.status);
    const tier = subscription.metadata?.tierId || null;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        isActive,
        tier,
        status: subscription.status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        subscriptionId: subscription.id,
      }),
    };
  } catch (error) {
    console.error("[Stripe] Subscription status error:", error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message || "Failed to get subscription status",
      }),
    };
  }
};
