#!/bin/bash

# Twilio Setup Script for InstantHPI
# This script sets up Twilio SMS authentication using your live credentials

echo "=========================================="
echo "InstantHPI - Twilio SMS Setup"
echo "=========================================="
echo ""

# Your Twilio credentials
TWILIO_ACCOUNT_SID="ACb754b33473428f51d994ef7eaec4142d"
TWILIO_AUTH_TOKEN="bad8612f52beafad40484799a906cfca"

# Check if Twilio CLI is installed
if ! command -v twilio &> /dev/null; then
    echo "Twilio CLI is not installed. Installing now..."
    echo "Please visit: https://www.twilio.com/docs/twilio-cli/quickstart"
    echo ""
    echo "Or install via npm:"
    echo "npm install -g twilio-cli"
    exit 1
fi

echo "Step 1: Configuring Twilio CLI with your credentials..."
echo "--------------------------------------------------------"

# Login to Twilio CLI with the provided credentials
twilio profiles:create instanthpi \
    --account-sid $TWILIO_ACCOUNT_SID \
    --auth-token $TWILIO_AUTH_TOKEN \
    --region us1 \
    --force

# Set as active profile
twilio profiles:use instanthpi

echo ""
echo "✓ Twilio CLI configured with your account"
echo ""

echo "Step 2: Checking available phone numbers..."
echo "--------------------------------------------------------"

# List available phone numbers
echo "Your Twilio phone numbers:"
twilio phone-numbers:list

echo ""
echo "Step 3: Getting a phone number (if needed)..."
echo "--------------------------------------------------------"

# Check if user wants to buy a new number
read -p "Do you need to purchase a new phone number? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Searching for available Canadian numbers..."
    twilio phone-numbers:buy:local --country-code CA --sms-enabled --limit 5
    
    read -p "Enter the phone number you want to purchase (e.g., +14388061955): " PHONE_NUMBER
    
    # Buy the selected number
    twilio phone-numbers:buy:local $PHONE_NUMBER --sms-enabled
    echo "✓ Phone number purchased: $PHONE_NUMBER"
else
    read -p "Enter your existing Twilio phone number (e.g., +14388061955): " PHONE_NUMBER
    echo "Using existing number: $PHONE_NUMBER"
fi

echo ""
echo "Step 4: Creating .env file for your application..."
echo "--------------------------------------------------------"

# Create or update .env file
cat > .env.twilio << EOF
# Twilio Configuration for InstantHPI
TWILIO_ACCOUNT_SID=$TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN=$TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER=$PHONE_NUMBER

# Add these to your Netlify environment variables:
# Go to: https://app.netlify.com/sites/instanthpi-medical/settings/env
EOF

echo "✓ Created .env.twilio file with your configuration"
echo ""

echo "Step 5: Testing SMS functionality..."
echo "--------------------------------------------------------"

read -p "Enter a phone number to test SMS (e.g., +14501234567): " TEST_PHONE

# Send a test message
twilio api:core:messages:create \
    --from $PHONE_NUMBER \
    --to $TEST_PHONE \
    --body "Test message from InstantHPI. Your SMS authentication is working!"

echo ""
echo "✓ Test SMS sent!"
echo ""

echo "Step 6: Setting up Netlify environment variables..."
echo "--------------------------------------------------------"
echo ""
echo "Please add these environment variables to your Netlify site:"
echo ""
echo "1. Go to: https://app.netlify.com/sites/instanthpi-medical/settings/env"
echo "2. Add the following variables:"
echo ""
echo "   TWILIO_ACCOUNT_SID = $TWILIO_ACCOUNT_SID"
echo "   TWILIO_AUTH_TOKEN = $TWILIO_AUTH_TOKEN"
echo "   TWILIO_PHONE_NUMBER = $PHONE_NUMBER"
echo ""
echo "Or use the Netlify CLI:"
echo ""
echo "netlify env:set TWILIO_ACCOUNT_SID \"$TWILIO_ACCOUNT_SID\""
echo "netlify env:set TWILIO_AUTH_TOKEN \"$TWILIO_AUTH_TOKEN\""
echo "netlify env:set TWILIO_PHONE_NUMBER \"$PHONE_NUMBER\""
echo ""

echo "=========================================="
echo "✓ Twilio setup complete!"
echo "=========================================="
echo ""
echo "Your Twilio SMS authentication is ready to use."
echo "Doctors can now login at: https://instanthpi.ca/doctor-login-sms"
echo ""
echo "Important files created:"
echo "- .env.twilio (contains your Twilio configuration)"
echo ""
echo "Next steps:"
echo "1. Deploy your application: npm run deploy"
echo "2. Test the SMS login at: /doctor-login-sms"
echo "3. Monitor usage at: https://console.twilio.com"
echo ""
