// Stripe Checkout Session Creator
// Creates a Stripe Checkout session for subscription payments

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Subscription tier to Stripe Price mapping
// These will be created in Stripe Dashboard and IDs added here
const TIER_PRICES = {
  starter: {
    monthly: null, // Add Stripe Price ID after creating product
    yearly: null,
    amount: 4900, // $49.00 CAD
  },
  professional: {
    monthly: null, // Add Stripe Price ID after creating product
    yearly: null,
    amount: 14900, // $149.00 CAD
  },
  enterprise: {
    monthly: null, // Add Stripe Price ID after creating product
    yearly: null,
    amount: 39900, // $399.00 CAD
  },
};

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { tierId, customerId, customerEmail, successUrl, cancelUrl, interval = 'month' } = JSON.parse(event.body);

    if (!tierId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'tierId is required' }),
      };
    }

    const tierConfig = TIER_PRICES[tierId];
    if (!tierConfig) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid tier' }),
      };
    }

    // Build session parameters
    const sessionParams = {
      payment_method_types: ['card'],
      mode: 'subscription',
      success_url: successUrl || `${process.env.URL || 'https://instanthpi.ca'}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.URL || 'https://instanthpi.ca'}/pricing`,
      metadata: {
        tierId,
        interval,
      },
      subscription_data: {
        metadata: {
          tierId,
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
    };

    // Use existing customer or create new with email
    if (customerId) {
      sessionParams.customer = customerId;
    } else if (customerEmail) {
      sessionParams.customer_email = customerEmail;
    }

    // Check if we have a Stripe Price ID, otherwise create a price on the fly
    const priceId = tierConfig[interval === 'year' ? 'yearly' : 'monthly'];

    if (priceId) {
      // Use existing price
      sessionParams.line_items = [{
        price: priceId,
        quantity: 1,
      }];
    } else {
      // Create price dynamically (for initial setup before products are created in Dashboard)
      const tierNames = {
        starter: 'InstantHPI Débutant',
        professional: 'InstantHPI Professionnel',
        enterprise: 'InstantHPI Entreprise',
      };

      sessionParams.line_items = [{
        price_data: {
          currency: 'cad',
          product_data: {
            name: tierNames[tierId] || `InstantHPI ${tierId}`,
            description: `Abonnement ${interval === 'year' ? 'annuel' : 'mensuel'} InstantHPI`,
            metadata: {
              tierId,
            },
          },
          unit_amount: tierConfig.amount,
          recurring: {
            interval: interval === 'year' ? 'year' : 'month',
          },
        },
        quantity: 1,
      }];
    }

    // Create the checkout session
    const session = await stripe.checkout.sessions.create(sessionParams);

    console.log(`[Stripe] Created checkout session ${session.id} for tier ${tierId}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        sessionId: session.id,
        url: session.url,
      }),
    };
  } catch (error) {
    console.error('[Stripe] Checkout session error:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message || 'Failed to create checkout session',
      }),
    };
  }
};
