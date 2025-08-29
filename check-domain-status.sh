#!/bin/bash

echo "=========================================="
echo "🔍 Checking instanthpi.ca Domain Status"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "📍 DNS Configuration:"
echo "===================="
echo ""
echo "⚠️  IMPORTANT: Your nameservers should be updated to:"
echo ""
echo "   dns1.p09.nsone.net"
echo "   dns2.p09.nsone.net"
echo "   dns3.p09.nsone.net"
echo "   dns4.p09.nsone.net"
echo ""
echo "(Note: These are p09, not p01 servers)"
echo ""

echo "🔄 Checking DNS Resolution..."
echo "=============================="
echo ""

# Check nameservers
echo "1. Checking nameservers for instanthpi.ca:"
NS_CHECK=$(dig instanthpi.ca NS +short 2>/dev/null)
if [ -z "$NS_CHECK" ]; then
    echo -e "${YELLOW}⏳ Nameservers not yet propagated${NC}"
else
    echo -e "${GREEN}✅ Nameservers found:${NC}"
    echo "$NS_CHECK"
fi
echo ""

# Check A record
echo "2. Checking A record for instanthpi.ca:"
A_CHECK=$(dig instanthpi.ca A +short 2>/dev/null)
if [ -z "$A_CHECK" ]; then
    echo -e "${YELLOW}⏳ A record not yet propagated${NC}"
else
    echo -e "${GREEN}✅ A record found: $A_CHECK${NC}"
fi
echo ""

# Check if site is accessible
echo "3. Checking HTTPS accessibility:"
HTTP_CHECK=$(curl -Is https://instanthpi.ca 2>/dev/null | head -n 1)
if [[ $HTTP_CHECK == *"200"* ]] || [[ $HTTP_CHECK == *"301"* ]] || [[ $HTTP_CHECK == *"302"* ]]; then
    echo -e "${GREEN}✅ Site is accessible via HTTPS!${NC}"
    echo "   Response: $HTTP_CHECK"
else
    echo -e "${YELLOW}⏳ HTTPS not yet accessible${NC}"
    echo "   This is normal during DNS propagation"
fi
echo ""

# Check SSL certificate
echo "4. Checking SSL Certificate:"
SSL_CHECK=$(echo | openssl s_client -servername instanthpi.ca -connect instanthpi.ca:443 2>/dev/null | openssl x509 -noout -subject 2>/dev/null)
if [ -z "$SSL_CHECK" ]; then
    echo -e "${YELLOW}⏳ SSL certificate not yet provisioned${NC}"
    echo "   Netlify will provision it automatically after DNS verification"
else
    echo -e "${GREEN}✅ SSL certificate active${NC}"
    echo "   $SSL_CHECK"
fi
echo ""

echo "=========================================="
echo "📊 Current Status Summary:"
echo "=========================================="
echo ""

# Check overall status
if [ ! -z "$A_CHECK" ] && [[ $HTTP_CHECK == *"200"* ]]; then
    echo -e "${GREEN}🎉 Your site is LIVE at https://instanthpi.ca!${NC}"
    echo ""
    echo "✅ DNS configured correctly"
    echo "✅ Site accessible via HTTPS"
    echo "✅ SSL certificate active"
elif [ ! -z "$NS_CHECK" ]; then
    echo -e "${YELLOW}⏳ DNS is propagating...${NC}"
    echo ""
    echo "✅ Nameservers detected"
    echo "⏳ Waiting for full propagation (usually 1-2 hours)"
    echo "⏳ SSL certificate will be provisioned automatically"
else
    echo -e "${YELLOW}⏳ Waiting for nameserver update...${NC}"
    echo ""
    echo "⏳ DNS propagation can take 1-48 hours"
    echo "⏳ Usually completes within 1-2 hours"
fi
echo ""

echo "=========================================="
echo "🔗 Useful Links:"
echo "=========================================="
echo ""
echo "📱 Current accessible URL: https://instanthpi-medical.netlify.app"
echo "🌐 Target domain: https://instanthpi.ca"
echo "⚙️  Netlify admin: https://app.netlify.com/projects/instanthpi-medical/domain-management"
echo "🔍 DNS checker: https://www.whatsmydns.net/#A/instanthpi.ca"
echo ""
echo "=========================================="
echo "💡 Tip: Run this script again in 10-15 minutes to check progress"
echo "=========================================="