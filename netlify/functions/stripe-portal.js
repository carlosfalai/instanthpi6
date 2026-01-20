// Stripe Customer Portal Session Creator
// Allows customers to manage their subscription

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  // Handle preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const { customerId, returnUrl } = JSON.parse(event.body);

    if (!customerId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "customerId is required" }),
      };
    }

    // Create a portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl || `${process.env.URL || "https://instanthpi.ca"}/doctor-dashboard`,
    });

    console.log(`[Stripe] Created portal session for customer ${customerId}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        url: session.url,
      }),
    };
  } catch (error) {
    console.error("[Stripe] Portal session error:", error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message || "Failed to create portal session",
      }),
    };
  }
};
