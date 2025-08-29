# DNS Setup Instructions for instanthpi.ca

## ✅ Status: Domain Added to Netlify

The domain **instanthpi.ca** has been successfully added to your Netlify site. Now you need to configure DNS to point to Netlify.

## 🔧 DNS Configuration Required

### Current Status:

- ✅ Domain added to Netlify
- ⏳ Waiting for DNS configuration
- ⏳ SSL certificate will be provisioned automatically after DNS is configured

### Choose ONE of these options:

## Option 1: Netlify DNS (Recommended - Easiest)

Change your domain's nameservers at your domain registrar to:

```
dns1.p01.nsone.net
dns2.p01.nsone.net
dns3.p01.nsone.net
dns4.p01.nsone.net
```

## Option 2: A Record (For apex domain)

Add this A record at your domain registrar:

```
Type: A
Name: @ (or leave blank)
Value: 75.2.60.5
```

## Option 3: CNAME (For www subdomain)

Add this CNAME record:

```
Type: CNAME
Name: www
Value: instanthpi-medical.netlify.app
```

## 📍 Where to Configure DNS

You need to log into your domain registrar (where you purchased instanthpi.ca) to make these changes. Common registrars include:

- GoDaddy
- Namecheap
- Google Domains
- Cloudflare
- Name.com
- Gandi
- Hover

## ⏱️ Timeline

1. **DNS Propagation**: 1-48 hours (usually 1-2 hours)
2. **SSL Certificate**: Automatic after DNS verification
3. **HTTPS Enabled**: Automatic after SSL provisioning

## 🔍 How to Verify

After configuring DNS, you can verify with:

```bash
# Check DNS resolution
nslookup instanthpi.ca
dig instanthpi.ca

# Test the site (after propagation)
curl -I https://instanthpi.ca
```

## 🌐 Your URLs

- **Current Live Site**: https://instanthpi-medical.netlify.app
- **Custom Domain (after DNS)**: https://instanthpi.ca
- **Netlify Admin**: https://app.netlify.com/projects/instanthpi-medical/domain-management

## ⚠️ Important Notes

1. **DO NOT** delete or modify the Netlify site while DNS is propagating
2. The site is currently accessible at https://instanthpi-medical.netlify.app
3. Once DNS is configured, both URLs will work
4. SSL/HTTPS will be automatically enabled by Netlify

## 📞 Need Help?

1. Check domain status: https://app.netlify.com/projects/instanthpi-medical/domain-management
2. Netlify DNS troubleshooting: https://docs.netlify.com/domains-https/custom-domains/
3. Check DNS propagation: https://www.whatsmydns.net/#A/instanthpi.ca

---

**Next Step**: Log into your domain registrar and configure the DNS settings as shown above.
