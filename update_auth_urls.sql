-- Update Auth Settings for Production
UPDATE auth.config 
SET site_url = 'https://instanthpi.ca'
WHERE key = 'site_url';

-- Update redirect URLs
UPDATE auth.config 
SET redirect_urls = '["https://instanthpi.ca","https://instanthpi.ca/doctor-dashboard","https://instanthpi.ca/login"]'
WHERE key = 'redirect_urls';
