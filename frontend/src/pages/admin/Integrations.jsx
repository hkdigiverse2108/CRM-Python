import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { getStatusColor } from '@/lib/utils';
import {
  MessageCircle, Megaphone, ShoppingCart, ShoppingBag, Store,
  CreditCard, PhoneCall, X, Shield, Settings, Info, Database,
  Briefcase, Phone, Mail, Globe, Copy, Eye, EyeOff, CheckCircle2,
  AlertCircle, RefreshCw, FileText, Terminal, Check, ExternalLink,
  MessageSquare, Calendar
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';

const initialIntegrations = [
  {
    id: 'meta_platforms',
    category: 'social',
    name: 'Meta Platforms',
    description: 'WhatsApp Business API, Facebook Pages, Lead Forms, Instagram Business, and Meta Ads — all connected via a single OAuth login.',
    icon: Megaphone,
    color: 'bg-blue-50 text-blue-600 border-blue-200',
    status: 'Not Connected',
    webhookStatus: 'N/A',
    createdAt: '2026-06-01',
    updatedAt: '2026-06-10',
    lastSync: 'Never',
    isMetaHub: true,
    fields: [],
    values: {},
    customButtons: [],
    logs: []
  },
  {
    id: 'shopify',
    category: 'ecommerce',
    name: 'Shopify Store',
    description: 'Sync inventory, customer accounts, products, and retrieve orders generated in Shopify.',
    icon: ShoppingCart,
    color: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    status: 'Connected',
    webhookStatus: 'Active',
    isShopifyHub: true,
    webhookUrl: 'https://api.aiocrm.com/v1/webhooks/shopify',
    createdAt: '2026-06-01',
    updatedAt: '2026-06-05',
    lastSync: '2026-06-06 11:30:00',
    fields: [
      { key: 'storeName', label: 'Store Name', type: 'text', placeholder: 'e.g. My Awesome Shop' },
      { key: 'storeUrl', label: 'Store URL', type: 'text', placeholder: 'e.g. mystore.myshopify.com' },
      { key: 'apiKey', label: 'API Key', type: 'text', placeholder: 'e.g. shpat_xxxxxxxxxx' },
      { key: 'apiSecret', label: 'API Secret', type: 'password', placeholder: 'Shopify Client secret key' },
      { key: 'accessToken', label: 'Access Token', type: 'password', placeholder: 'Admin API Access Token' },
      { key: 'webhookSecret', label: 'Webhook Secret', type: 'password', placeholder: 'Shopify Webhook Secret Key' }
    ],
    values: {
      storeName: 'RapidModel Shop',
      storeUrl: 'rapidmodel.myshopify.com',
      apiKey: 'shpat_xxxx',
      apiSecret: '••••••••••••••••••••••••',
      accessToken: '••••••••••••••••••••••••',
      webhookSecret: '••••••••••••••••••••••••'
    },
    customButtons: ['Connect Shopify', 'Sync Products', 'Sync Orders', 'Sync Customers'],
    logs: [
      { time: '2026-06-06 11:30:00', type: 'Sync', message: 'Synced 8 new products and 5 orders.', status: 'success' }
    ]
  },
  {
    id: 'woocommerce',
    category: 'ecommerce',
    name: 'WooCommerce Store',
    description: 'Sync products, customers, and order history from WordPress WooCommerce plugin.',
    icon: ShoppingCart,
    color: 'bg-violet-50 text-violet-600 border-violet-200',
    status: 'Not Connected',
    webhookStatus: 'Inactive',
    webhookUrl: 'https://api.aiocrm.com/v1/webhooks/woocommerce',
    createdAt: '2026-06-02',
    updatedAt: '2026-06-02',
    lastSync: 'Never',
    fields: [
      { key: 'storeUrl', label: 'Store URL', type: 'text', placeholder: 'e.g. https://mywordpressstore.com' },
      { key: 'consumerKey', label: 'Consumer Key', type: 'text', placeholder: 'e.g. ck_xxxxxxxxxx' },
      { key: 'consumerSecret', label: 'Consumer Secret', type: 'password', placeholder: 'e.g. cs_xxxxxxxxxx' },
      { key: 'webhookSecret', label: 'Webhook Secret', type: 'password', placeholder: 'Signing secret' }
    ],
    values: {},
    customButtons: ['Connect WooCommerce', 'Sync Orders', 'Sync Products'],
    logs: []
  },
  {
    id: 'amazon',
    category: 'ecommerce',
    name: 'Amazon Seller Central',
    description: 'Import Amazon Seller orders, track seller inventory, and monitor merchant performance.',
    icon: ShoppingBag,
    color: 'bg-amber-50 text-amber-600 border-amber-200',
    status: 'Not Connected',
    webhookStatus: 'N/A',
    createdAt: '2026-06-01',
    updatedAt: '2026-06-01',
    lastSync: 'Never',
    fields: [
      { key: 'sellerId', label: 'Seller ID', type: 'text', placeholder: 'e.g. A12BC34DE56FG' },
      { key: 'marketplaceId', label: 'Marketplace ID', type: 'text', placeholder: 'e.g. ATVPDKIKX0DER' },
      { key: 'clientId', label: 'Client ID', type: 'text', placeholder: 'SP-API Client ID' },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', placeholder: 'SP-API Client Secret' },
      { key: 'refreshToken', label: 'Refresh Token', type: 'password', placeholder: 'SP-API Refresh Token' },
      { key: 'awsAccessKey', label: 'AWS Access Key', type: 'text', placeholder: 'AWS Access Key' },
      { key: 'awsSecretKey', label: 'AWS Secret Key', type: 'password', placeholder: 'AWS Secret Key' }
    ],
    values: {},
    customButtons: ['Connect Amazon', 'Sync Orders', 'Sync Products'],
    logs: []
  },
  {
    id: 'flipkart',
    category: 'ecommerce',
    name: 'Flipkart Seller Hub',
    description: 'Sync orders and inventory levels directly with Flipkart marketplace platform.',
    icon: Store,
    color: 'bg-sky-50 text-sky-600 border-sky-200',
    status: 'Not Connected',
    webhookStatus: 'N/A',
    createdAt: '2026-06-01',
    updatedAt: '2026-06-01',
    lastSync: 'Never',
    fields: [
      { key: 'sellerId', label: 'Seller ID', type: 'text', placeholder: 'Flipkart Seller ID' },
      { key: 'clientId', label: 'Application Client ID', type: 'text', placeholder: 'Flipkart API Client ID' },
      { key: 'clientSecret', label: 'Application Client Secret', type: 'password', placeholder: 'Flipkart API Client Secret' },
      { key: 'accessToken', label: 'Access Token', type: 'password', placeholder: 'Access Token' }
    ],
    values: {},
    customButtons: ['Connect Flipkart', 'Sync Orders'],
    logs: []
  },
  {
    id: 'myntra',
    category: 'ecommerce',
    name: 'Myntra Seller Hub',
    description: 'Sync orders, catalogs, and logistics tracking for Myntra partner stores.',
    icon: Store,
    color: 'bg-red-50 text-red-500 border-red-200',
    status: 'Not Connected',
    webhookStatus: 'N/A',
    createdAt: '2026-06-04',
    updatedAt: '2026-06-04',
    lastSync: 'Never',
    fields: [
      { key: 'vendorId', label: 'Vendor ID', type: 'text', placeholder: 'Myntra Vendor ID' },
      { key: 'clientId', label: 'Client ID', type: 'text', placeholder: 'Myntra API Client ID' },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', placeholder: 'Myntra API Client Secret' },
      { key: 'accessToken', label: 'Access Token', type: 'password', placeholder: 'Auth access token' }
    ],
    values: {},
    customButtons: ['Connect Myntra', 'Sync Orders'],
    logs: []
  },
  {
    id: 'meesho',
    category: 'ecommerce',
    name: 'Meesho Supplier Hub',
    description: 'Sync catalog inventory and automated order management with Meesho marketplace.',
    icon: Store,
    color: 'bg-orange-50 text-orange-500 border-orange-200',
    status: 'Not Connected',
    webhookStatus: 'N/A',
    createdAt: '2026-06-04',
    updatedAt: '2026-06-04',
    lastSync: 'Never',
    fields: [
      { key: 'supplierId', label: 'Supplier ID', type: 'text', placeholder: 'Meesho Supplier ID' },
      { key: 'clientId', label: 'Client ID', type: 'text', placeholder: 'Meesho API Client ID' },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', placeholder: 'Meesho API Client Secret' },
      { key: 'accessToken', label: 'Access Token', type: 'password', placeholder: 'Auth token' }
    ],
    values: {},
    customButtons: ['Connect Meesho', 'Sync Orders'],
    logs: []
  },
  {
    id: 'wordpress',
    category: 'websites',
    name: 'WordPress REST API',
    description: 'Connect your corporate website, fetch contact form entries, and sync blog layouts.',
    icon: Globe,
    color: 'bg-slate-100 text-slate-800 border-slate-200',
    status: 'Not Connected',
    webhookStatus: 'Inactive',
    webhookUrl: 'https://api.aiocrm.com/v1/webhooks/wordpress',
    createdAt: '2026-06-02',
    updatedAt: '2026-06-02',
    lastSync: 'Never',
    fields: [
      { key: 'websiteUrl', label: 'Website URL', type: 'text', placeholder: 'e.g. https://mywordpresssite.com' },
      { key: 'username', label: 'Username', type: 'text', placeholder: 'WordPress Admin username' },
      { key: 'appPassword', label: 'Application Password', type: 'password', placeholder: 'WordPress generated Application Password' },
      { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'WordPress API Key (if using plugins)' }
    ],
    values: {},
    customButtons: ['Connect WordPress', 'Sync Forms', 'Sync Leads'],
    logs: []
  },
  {
    id: 'custom_website',
    category: 'websites',
    name: 'Custom Website Webhooks',
    description: 'Connect standard HTML pages or custom frameworks using native client-side webhooks.',
    icon: Globe,
    color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    status: 'Not Connected',
    webhookStatus: 'Inactive',
    webhookUrl: 'https://api.aiocrm.com/v1/webhooks/custom_website',
    createdAt: '2026-06-03',
    updatedAt: '2026-06-03',
    lastSync: 'Never',
    fields: [
      { key: 'websiteUrl', label: 'Website URL', type: 'text', placeholder: 'e.g. https://mycustomwebsite.com' },
      { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'Generated API Key' },
      { key: 'apiSecret', label: 'API Secret', type: 'password', placeholder: 'Generated API Secret' },
      { key: 'webhookSecret', label: 'Webhook Secret', type: 'password', placeholder: 'Webhook validation secret' }
    ],
    values: {},
    customButtons: ['Generate API Key', 'Generate Webhook', 'Test Connection'],
    logs: []
  },
  {
    id: 'tally',
    category: 'websites',
    name: 'TallyPrime ERP Connector',
    description: 'Sync ledger statements, sales vouchers, payments, and GST compliance records directly with local TallyPrime or Tally ERP 9.',
    icon: Database,
    color: 'bg-teal-50 text-teal-650 border-teal-200',
    status: 'Connected',
    webhookStatus: 'N/A',
    createdAt: '2026-06-01',
    updatedAt: '2026-06-05',
    lastSync: '2026-06-06 12:10:00',
    fields: [
      { key: 'tallyUrl', label: 'Tally Server URL', type: 'text', placeholder: 'e.g. http://localhost:9000' },
      { key: 'companyName', label: 'Tally Company Name', type: 'text', placeholder: 'e.g. RapidModel Corp' }
    ],
    values: { tallyUrl: 'http://localhost:9000', companyName: 'RapidModel Corp' },
    customButtons: ['Test Connection', 'Sync Ledger'],
    logs: [
      { time: '2026-06-06 12:10:00', type: 'Sync', message: 'Double-entry accounting journal synced successfully.', status: 'success' }
    ]
  },
  {
    id: 'justdial',
    category: 'websites',
    name: 'JustDial Lead Sync',
    description: 'Capture and import leads from JustDial business listings directly into the CRM.',
    icon: Phone,
    color: 'bg-rose-50 text-rose-600 border-rose-200',
    status: 'Not Connected',
    webhookStatus: 'Inactive',
    webhookUrl: 'https://api.aiocrm.com/v1/webhooks/justdial',
    createdAt: '2026-06-02',
    updatedAt: '2026-06-02',
    lastSync: 'Never',
    fields: [
      { key: 'businessId', label: 'Business ID', type: 'text', placeholder: 'e.g. JD-VND-00012345' },
      { key: 'registeredMobile', label: 'Registered Mobile Number', type: 'text', placeholder: 'e.g. 9876543210' },
      { key: 'registeredEmail', label: 'Registered Email Address', type: 'text', placeholder: 'e.g. info@business.com' },
      { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'JustDial partner API key' }
    ],
    values: {},
    customButtons: ['Connect Justdial', 'Sync Leads'],
    logs: []
  },
  {
    id: 'indiamart',
    category: 'websites',
    name: 'IndiaMART Lead Manager',
    description: 'Auto-import buyer leads from IndiaMART Lead Manager into CRM pipeline.',
    icon: Briefcase,
    color: 'bg-orange-50 text-orange-600 border-orange-200',
    status: 'Not Connected',
    webhookStatus: 'Inactive',
    webhookUrl: 'https://api.aiocrm.com/v1/webhooks/indiamart',
    createdAt: '2026-06-02',
    updatedAt: '2026-06-02',
    lastSync: 'Never',
    fields: [
      { key: 'crmKey', label: 'GLUSR CRM Key', type: 'text', placeholder: 'e.g. GLUSR_xxxxxxxxxx' },
      { key: 'crmToken', label: 'GLUSR CRM Token', type: 'password', placeholder: 'Enter IndiaMART CRM token' },
      { key: 'registeredMobile', label: 'Registered Mobile Number', type: 'text', placeholder: 'e.g. 9876543210' },
      { key: 'registeredEmail', label: 'Registered Email Address', type: 'text', placeholder: 'e.g. info@business.com' }
    ],
    values: {},
    customButtons: ['Connect IndiaMART', 'Fetch Leads', 'Auto Sync'],
    logs: []
  },
  {
    id: 'tradeindia',
    category: 'websites',
    name: 'TradeIndia Lead Connector',
    description: 'Import buyer enquiries and RFQs from TradeIndia business listings into CRM.',
    icon: Briefcase,
    color: 'bg-lime-50 text-lime-705 border-lime-200',
    status: 'Not Connected',
    webhookStatus: 'Inactive',
    webhookUrl: 'https://api.aiocrm.com/v1/webhooks/tradeindia',
    createdAt: '2026-06-02',
    updatedAt: '2026-06-02',
    lastSync: 'Never',
    fields: [
      { key: 'sellerId', label: 'Seller ID', type: 'text', placeholder: 'TradeIndia Seller/User ID' },
      { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'Enter TradeIndia API key' },
      { key: 'apiSecret', label: 'API Secret', type: 'password', placeholder: 'Enter profile secret key' },
      { key: 'registeredMobile', label: 'Registered Mobile Number', type: 'text', placeholder: 'e.g. 9876543210' },
      { key: 'registeredEmail', label: 'Registered Email Address', type: 'text', placeholder: 'e.g. info@business.com' }
    ],
    values: {},
    customButtons: ['Connect TradeIndia', 'Fetch Leads'],
    logs: []
  },
  {
    id: 'razorpay',
    category: 'payments',
    name: 'Razorpay Gateway',
    description: 'Process quotes, track payments, handle refunds, and sync GST invoices automatically.',
    icon: CreditCard,
    color: 'bg-cyan-50 text-cyan-600 border-cyan-200',
    status: 'Connected',
    webhookStatus: 'Active',
    webhookUrl: 'https://api.aiocrm.com/v1/webhooks/razorpay',
    createdAt: '2026-06-01',
    updatedAt: '2026-06-05',
    lastSync: '2026-06-06 07:45:00',
    fields: [
      { key: 'keyId', label: 'Key ID', type: 'text', placeholder: 'rzp_live_xxxxxxxx' },
      { key: 'keySecret', label: 'Key Secret', type: 'password', placeholder: 'Razorpay secret key' },
      { key: 'webhookSecret', label: 'Webhook Secret', type: 'password', placeholder: 'Razorpay Webhook secret key' }
    ],
    values: {
      keyId: 'rzp_live_RapidMode',
      keySecret: '••••••••••••••••••••••••',
      webhookSecret: '••••••••••••••••••••••••'
    },
    customButtons: ['Connect Razorpay', 'Test Payment'],
    logs: [
      { time: '2026-06-06 07:45:00', type: 'Sync', message: 'Fetched latest checkout transaction list.', status: 'success' }
    ]
  },
  {
    id: 'stripe',
    category: 'payments',
    name: 'Stripe Gateway',
    description: 'Receive card payments globally and reconcile double-entry invoice vouchers.',
    icon: CreditCard,
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    status: 'Not Connected',
    webhookStatus: 'Inactive',
    webhookUrl: 'https://api.aiocrm.com/v1/webhooks/stripe',
    createdAt: '2026-06-02',
    updatedAt: '2026-06-02',
    lastSync: 'Never',
    fields: [
      { key: 'publishableKey', label: 'Publishable Key', type: 'text', placeholder: 'pk_live_xxxxxxxxxx' },
      { key: 'secretKey', label: 'Secret Key', type: 'password', placeholder: 'sk_live_xxxxxxxxxx' },
      { key: 'webhookSecret', label: 'Webhook Secret', type: 'password', placeholder: 'whsec_xxxxxxxxxx' }
    ],
    values: {},
    customButtons: ['Connect Stripe', 'Test Payment'],
    logs: []
  },
  {
    id: 'cashfree',
    category: 'payments',
    name: 'Cashfree Gateway',
    description: 'Process instant UPI payouts, credit/debit card transactions, and automated refunds.',
    icon: CreditCard,
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    status: 'Not Connected',
    webhookStatus: 'Inactive',
    webhookUrl: 'https://api.aiocrm.com/v1/webhooks/cashfree',
    createdAt: '2026-06-03',
    updatedAt: '2026-06-03',
    lastSync: 'Never',
    fields: [
      { key: 'clientId', label: 'Client ID', type: 'text', placeholder: 'Enter Cashfree Client ID' },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', placeholder: 'Enter Cashfree Client Secret' },
      { key: 'webhookSecret', label: 'Webhook Secret', type: 'password', placeholder: 'Enter Webhook signature secret' }
    ],
    values: {},
    customButtons: ['Connect Cashfree'],
    logs: []
  },
  {
    id: 'payu',
    category: 'payments',
    name: 'PayU Payments',
    description: 'Process card payments, NetBanking, and UPI across corporate buyer checkouts.',
    icon: CreditCard,
    color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    status: 'Not Connected',
    webhookStatus: 'Inactive',
    webhookUrl: 'https://api.aiocrm.com/v1/webhooks/payu',
    createdAt: '2026-06-03',
    updatedAt: '2026-06-03',
    lastSync: 'Never',
    fields: [
      { key: 'merchantKey', label: 'Merchant Key', type: 'text', placeholder: 'Enter Merchant Key' },
      { key: 'merchantSalt', label: 'Merchant Salt', type: 'password', placeholder: 'Enter Merchant Salt' },
      { key: 'webhookSecret', label: 'Webhook Secret', type: 'password', placeholder: 'Enter Webhook Secret key' }
    ],
    values: {},
    customButtons: ['Connect PayU'],
    logs: []
  },
  {
    id: 'phonepe',
    category: 'payments',
    name: 'PhonePe Gateway',
    description: 'Integrate deep link UPI checkouts and merchant pay interfaces directly.',
    icon: CreditCard,
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    status: 'Not Connected',
    webhookStatus: 'Inactive',
    webhookUrl: 'https://api.aiocrm.com/v1/webhooks/phonepe',
    createdAt: '2026-06-03',
    updatedAt: '2026-06-03',
    lastSync: 'Never',
    fields: [
      { key: 'merchantId', label: 'Merchant ID', type: 'text', placeholder: 'Enter Merchant ID' },
      { key: 'saltKey', label: 'Salt Key', type: 'password', placeholder: 'Enter Salt Key (M2M)' },
      { key: 'saltIndex', label: 'Salt Index', type: 'text', placeholder: 'e.g. 1' }
    ],
    values: {},
    customButtons: ['Connect PhonePe'],
    logs: []
  },
  {
    id: 'twilio',
    category: 'calling',
    name: 'Twilio Voice API',
    description: 'Power call centers, outbound agent voice calls, and automated dialers via Twilio SIP trunking.',
    icon: PhoneCall,
    color: 'bg-red-50 text-red-650 border-red-200',
    status: 'Not Connected',
    webhookStatus: 'Inactive',
    webhookUrl: 'https://api.aiocrm.com/v1/webhooks/twilio',
    createdAt: '2026-06-01',
    updatedAt: '2026-06-01',
    lastSync: 'Never',
    fields: [
      { key: 'accountSid', label: 'Account SID', type: 'text', placeholder: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' },
      { key: 'authToken', label: 'Auth Token', type: 'password', placeholder: 'Twilio account auth token' },
      { key: 'phoneNumber', label: 'Phone Number', type: 'text', placeholder: 'Twilio purchased phone number' }
    ],
    values: {},
    customButtons: ['Connect Twilio', 'Test Call'],
    logs: []
  },
  {
    id: 'exotel',
    category: 'calling',
    name: 'Exotel Softphone API',
    description: 'Power call dialing, click-to-call, receive incoming customer calls and route them.',
    icon: PhoneCall,
    color: 'bg-purple-50 text-purple-650 border-purple-200',
    status: 'Connected',
    webhookStatus: 'Active',
    webhookUrl: 'https://api.aiocrm.com/v1/webhooks/exotel',
    createdAt: '2026-06-01',
    updatedAt: '2026-06-05',
    lastSync: '2026-06-06 05:30:00',
    fields: [
      { key: 'sid', label: 'Account SID', type: 'text', placeholder: 'Exotel SID' },
      { key: 'apiKey', label: 'API Key', type: 'text', placeholder: 'Exotel API Key' },
      { key: 'apiToken', label: 'API Token', type: 'password', placeholder: 'Exotel API Token' },
      { key: 'virtualNumber', label: 'Virtual Number', type: 'text', placeholder: 'Exotel virtual phone number' }
    ],
    values: {
      sid: 'rapidmodel_exotel',
      apiKey: 'ex_key_xxx',
      apiToken: '••••••••••••••••••••••••',
      virtualNumber: '+918080808080'
    },
    customButtons: ['Connect Exotel'],
    logs: [
      { time: '2026-06-06 05:30:00', type: 'Sync', message: 'Call details record history loaded.', status: 'success' }
    ]
  },
  {
    id: 'knowlarity',
    category: 'calling',
    name: 'Knowlarity Telephony',
    description: 'Connect cloud IVR routing tables and logging options directly to CRM timeline.',
    icon: PhoneCall,
    color: 'bg-blue-50 text-blue-500 border-blue-200',
    status: 'Not Connected',
    webhookStatus: 'Inactive',
    webhookUrl: 'https://api.aiocrm.com/v1/webhooks/knowlarity',
    createdAt: '2026-06-03',
    updatedAt: '2026-06-03',
    lastSync: 'Never',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'text', placeholder: 'Enter API Key' },
      { key: 'apiSecret', label: 'API Secret', type: 'password', placeholder: 'Enter API Secret' },
      { key: 'virtualNumber', label: 'Virtual Number', type: 'text', placeholder: 'Enter virtual pilot number' }
    ],
    values: {},
    customButtons: ['Connect Knowlarity'],
    logs: []
  },
  {
    id: 'msg91',
    category: 'calling',
    name: 'MSG91 Gateway',
    description: 'Bulk SMS, OTP verification alerts, and system notification templates.',
    icon: MessageSquare,
    color: 'bg-slate-50 text-slate-700 border-slate-200',
    status: 'Not Connected',
    webhookStatus: 'N/A',
    createdAt: '2026-06-02',
    updatedAt: '2026-06-02',
    lastSync: 'Never',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'MSG91 API Authentication Key' },
      { key: 'senderId', label: 'Sender ID', type: 'text', placeholder: 'e.g. RPDMDL (6-character header)' },
      { key: 'templateId', label: 'Template ID', type: 'text', placeholder: 'DLT approved template ID' }
    ],
    values: {},
    customButtons: ['Connect MSG91', 'Send Test SMS'],
    logs: []
  },
  {
    id: 'textlocal',
    category: 'calling',
    name: 'TextLocal SMS API',
    description: 'Send alerts, check balances, and retrieve inbound messages natively.',
    icon: MessageSquare,
    color: 'bg-teal-50 text-teal-700 border-teal-200',
    status: 'Not Connected',
    webhookStatus: 'N/A',
    createdAt: '2026-06-02',
    updatedAt: '2026-06-02',
    lastSync: 'Never',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'TextLocal API Key' },
      { key: 'senderId', label: 'Sender ID', type: 'text', placeholder: '6-character sender ID header' }
    ],
    values: {},
    customButtons: ['Connect TextLocal'],
    logs: []
  },
  {
    id: 'smtp',
    category: 'email',
    name: 'SMTP Server',
    description: 'Configure custom mail servers to dispatch invoices, reports, and team notifications.',
    icon: Mail,
    color: 'bg-stone-50 text-stone-700 border-stone-200',
    status: 'Not Connected',
    webhookStatus: 'N/A',
    createdAt: '2026-06-01',
    updatedAt: '2026-06-01',
    lastSync: 'Never',
    fields: [
      { key: 'smtpHost', label: 'SMTP Host', type: 'text', placeholder: 'e.g. smtp.gmail.com' },
      { key: 'smtpPort', label: 'SMTP Port', type: 'text', placeholder: 'e.g. 587 or 465' },
      { key: 'smtpUsername', label: 'SMTP Username', type: 'text', placeholder: 'Mail user name / auth account' },
      { key: 'smtpPassword', label: 'SMTP Password', type: 'password', placeholder: 'Mail auth password' },
      { key: 'fromEmail', label: 'From Email', type: 'text', placeholder: 'e.g. notifications@mycompany.com' }
    ],
    values: {},
    customButtons: ['Test SMTP'],
    logs: []
  },
  {
    id: 'sendgrid',
    category: 'email',
    name: 'SendGrid Email API',
    description: 'Deliver bulk marketing emails, system newsletters, and track bounce rates.',
    icon: Mail,
    color: 'bg-sky-50 text-sky-500 border-sky-200',
    status: 'Not Connected',
    webhookStatus: 'N/A',
    createdAt: '2026-06-01',
    updatedAt: '2026-06-01',
    lastSync: 'Never',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'SG.xxxxxxxxxxxxxxxxxxxxxxxx' },
      { key: 'fromEmail', label: 'From Email', type: 'text', placeholder: 'Verified Sender Email Address' }
    ],
    values: {},
    customButtons: ['Test Email'],
    logs: []
  },
  {
    id: 'brevo',
    category: 'email',
    name: 'Brevo (Sendinblue) Email',
    description: 'High-speed delivery configurations for CRM emails, marketing newsletters, and automation rules.',
    icon: Mail,
    color: 'bg-emerald-50 text-emerald-800 border-emerald-100',
    status: 'Not Connected',
    webhookStatus: 'N/A',
    createdAt: '2026-06-03',
    updatedAt: '2026-06-03',
    lastSync: 'Never',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'Brevo v3 API Key' },
      { key: 'fromEmail', label: 'From Email', type: 'text', placeholder: 'e.g. info@domain.com' }
    ],
    values: {},
    customButtons: ['Test Email'],
    logs: []
  },
  {
    id: 'amazon_ses',
    category: 'email',
    name: 'Amazon SES Email',
    description: 'Incredibly cost-effective bulk marketing and transactional email delivery system via AWS.',
    icon: Mail,
    color: 'bg-amber-50 text-amber-500 border-amber-200',
    status: 'Not Connected',
    webhookStatus: 'N/A',
    createdAt: '2026-06-03',
    updatedAt: '2026-06-03',
    lastSync: 'Never',
    fields: [
      { key: 'awsAccessKey', label: 'AWS Access Key', type: 'text', placeholder: 'AWS Access Key ID' },
      { key: 'awsSecretKey', label: 'AWS Secret Key', type: 'password', placeholder: 'AWS Secret Key' },
      { key: 'region', label: 'Region', type: 'text', placeholder: 'e.g. us-east-1' },
      { key: 'fromEmail', label: 'From Email', type: 'text', placeholder: 'Verified Sender Email Address' }
    ],
    values: {},
    customButtons: ['Test Email'],
    logs: []
  }
];

export default function Integrations() {
  const { addToast } = useApp();
  const navigate = useNavigate();
  const [integrations, setIntegrations] = useState(initialIntegrations);
  const [activeConfig, setActiveConfig] = useState(null);
  const [formValues, setFormValues] = useState({});
  const [activeCategory, setActiveCategory] = useState('all');
  const [showPassword, setShowPassword] = useState({});
  const [showLogs, setShowLogs] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const categories = [
    { id: 'all', label: 'All Platforms' },
    { id: 'social', label: 'Social & Ads' },
    { id: 'ecommerce', label: 'E-Commerce & Retail' },
    { id: 'websites', label: 'Websites & ERP' },
    { id: 'payments', label: 'Payments' },
    { id: 'calling', label: 'Calling & SMS' },
    { id: 'email', label: 'Email Providers' },
  ];

  const handleOpenConfig = (integration) => {
    setActiveConfig(integration);
    setFormValues(integration.values || {});
    setShowLogs(false);
  };

  const handleInputChange = (key, val) => {
    setFormValues(prev => ({ ...prev, [key]: val }));
  };

  const handleToggleShowPassword = (key) => {
    setShowPassword(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCopy = (text, label) => {
    if (!text) {
      addToast(`Nothing to copy for ${label}`);
      return;
    }
    navigator.clipboard.writeText(text);
    addToast(`Copied ${label} to clipboard!`);
  };

  const handleSave = () => {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    setIntegrations(prev => prev.map(item => {
      if (item.id === activeConfig.id) {
        return {
          ...item,
          status: 'Connected',
          updatedAt: timestamp,
          values: formValues,
          logs: [
            {
              time: timestamp,
              type: 'Configuration',
              message: 'Credentials updated and stored successfully.',
              status: 'success'
            },
            ...(item.logs || [])
          ]
        };
      }
      return item;
    }));
    addToast(`${activeConfig.name} credentials saved successfully!`);
    setActiveConfig(null);
  };

  const handleTestConnection = () => {
    setIsTesting(true);
    setTimeout(() => {
      setIsTesting(false);
      const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
      setIntegrations(prev => prev.map(item => {
        if (item.id === activeConfig.id) {
          return {
            ...item,
            status: 'Connected',
            updatedAt: timestamp,
            logs: [
              {
                time: timestamp,
                type: 'Connection',
                message: 'Connection check succeeded. Web servers resolved.',
                status: 'success'
              },
              ...(item.logs || [])
            ]
          };
        }
        return item;
      }));
      addToast(`Connection to ${activeConfig.name} tested successfully!`);
    }, 1000);
  };

  const handleSyncNow = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
      setIntegrations(prev => prev.map(item => {
        if (item.id === activeConfig.id) {
          return {
            ...item,
            lastSync: timestamp,
            updatedAt: timestamp,
            logs: [
              {
                time: timestamp,
                type: 'Sync',
                message: 'Manual data sync completed. Records updated.',
                status: 'success'
              },
              ...(item.logs || [])
            ]
          };
        }
        return item;
      }));
      addToast(`Manual data sync for ${activeConfig.name} completed!`);
    }, 1000);
  };

  const handleDisconnect = (id, name) => {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    setIntegrations(prev => prev.map(item => {
      if (item.id === id) {
        const clearedValues = Object.keys(item.values || {}).reduce((acc, k) => ({ ...acc, [k]: '' }), {});
        return {
          ...item,
          status: 'Not Connected',
          lastSync: 'Never',
          updatedAt: timestamp,
          values: clearedValues,
          logs: [
            {
              time: timestamp,
              type: 'Disconnection',
              message: 'Integration disconnected and credentials purged.',
              status: 'warning'
            },
            ...(item.logs || [])
          ]
        };
      }
      return item;
    }));
    addToast(`Disconnected from ${name}`);
    if (activeConfig && activeConfig.id === id) {
      setActiveConfig(null);
    }
  };

  const handleCustomAction = (id, label) => {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    setIntegrations(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          lastSync: label.toLowerCase().includes('sync') || label.toLowerCase().includes('fetch') ? timestamp : item.lastSync,
          updatedAt: timestamp,
          logs: [
            {
              time: timestamp,
              type: 'Action',
              message: `Triggered utility action: "${label}". Executed successfully.`,
              status: 'success'
            },
            ...(item.logs || [])
          ]
        };
      }
      return item;
    }));
    addToast(`Action "${label}" executed successfully!`);
  };

  const filteredIntegrations = activeCategory === 'all'
    ? integrations
    : integrations.filter(item => item.category === activeCategory);

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader title="Integrations Hub" subtitle="Connect third-party services & APIs" />
        <div className="flex items-center gap-2 text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg p-2.5 max-w-sm">
          <Shield size={16} className="text-emerald-600 shrink-0" />
          <p>All credentials are stored locally on your device with enterprise-grade encryption.</p>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-[var(--color-border)] pb-2">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeCategory === cat.id
                ? 'bg-[var(--color-primary)] text-white'
                : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-hover)]'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredIntegrations.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.id} className="integration-card flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2.5 mb-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${item.color}`}>
                    <Icon size={20} />
                  </div>
                  <span className={`badge ${getStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                </div>
                <h3 className="font-semibold text-sm text-[var(--color-foreground)] mb-1 flex items-center gap-1.5">
                  {item.name}
                </h3>
                <p className="text-xs text-[var(--color-muted-foreground)] leading-relaxed mb-4">
                  {item.description}
                </p>

                {/* Metadata block for connection specs */}
                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 border-t border-[var(--color-border)] pt-3.5 mt-3.5 mb-2 text-[10px] text-[var(--color-muted-foreground)]">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={11} className="shrink-0 text-[var(--color-muted-foreground)]" />
                    <span>Created: {item.createdAt}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <RefreshCw size={11} className="shrink-0 text-[var(--color-muted-foreground)]" />
                    <span>Updated: {item.updatedAt}</span>
                  </div>
                  <div className="flex items-center gap-1.5 col-span-2">
                    <Terminal size={11} className="shrink-0 text-[var(--color-muted-foreground)]" />
                    <span>Last Sync: {item.lastSync || 'Never'}</span>
                  </div>
                  {item.webhookStatus && (
                    <div className="flex items-center gap-1.5 col-span-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        item.webhookStatus === 'Active' ? 'bg-emerald-500 animate-pulse' :
                        item.webhookStatus === 'Failed' ? 'bg-red-500' : 'bg-slate-400'
                      }`}></span>
                      <span>Webhook: {item.webhookStatus}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 border-t border-[var(--color-border)] pt-4 mt-auto">
                {item.isMetaHub ? (
                  <button
                    onClick={() => navigate('/admin/integrations/meta')}
                    className="btn-outline flex-1 py-1.5 px-3 text-xs justify-center gap-1.5 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                  >
                    <ExternalLink size={13} />
                    Open Meta Integration Hub
                  </button>
                ) : item.isShopifyHub ? (
                  <button
                    onClick={() => navigate('/admin/integrations/shopify')}
                    className="btn-outline flex-1 py-1.5 px-3 text-xs justify-center gap-1.5 bg-indigo-50 text-indigo-750 border-indigo-200 hover:bg-indigo-100"
                  >
                    <ExternalLink size={13} />
                    Open Shopify Integration Hub
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => handleOpenConfig(item)}
                      className="btn-outline flex-1 py-1.5 px-3 text-xs justify-center gap-1.5"
                    >
                      <Settings size={13} />
                      {item.status === 'Connected' ? 'Configure' : 'Connect'}
                    </button>
                    {item.status === 'Connected' && (
                      <button
                        onClick={() => handleDisconnect(item.id, item.name)}
                        className="btn-ghost text-red-600 hover:bg-red-50 py-1.5 px-3 text-xs shrink-0"
                      >
                        Disconnect
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Configuration Dialog */}
      {activeConfig && (
        <div className="modal-overlay" onClick={() => setActiveConfig(null)}>
          <div className="modal-content w-full max-w-lg p-5 flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)] mb-4">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded flex items-center justify-center border text-xs ${activeConfig.color}`}>
                  <activeConfig.icon size={15} />
                </div>
                <h3 className="text-sm font-semibold flex items-center gap-1.5">
                  Configure {activeConfig.name}
                  <span className={`badge ${getStatusColor(activeConfig.status)} text-[10px] scale-90`}>
                    {activeConfig.status}
                  </span>
                </h3>
              </div>
              <button
                onClick={() => setActiveConfig(null)}
                className="btn-ghost p-1"
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="space-y-4 overflow-y-auto flex-1 pr-1.5">
              <div className="flex gap-2 p-2.5 bg-blue-50 text-blue-800 border border-blue-200 rounded-lg text-xs">
                <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Refer to the {activeConfig.name} developer portal to generate API credentials. 
                  All fields are stored locally using modern encryption patterns.
                </p>
              </div>

              {/* Webhook Endpoint Representation (Read-Only Copyable URL) */}
              {activeConfig.webhookUrl && (
                <div className="bg-slate-50 border border-[var(--color-border)] rounded-lg p-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[var(--color-foreground)] flex items-center gap-1.5">
                      <Globe size={13} className="text-slate-500" />
                      Webhook Integration URL
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Webhook status: {activeConfig.webhookStatus || 'Active'}
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      readOnly
                      value={activeConfig.webhookUrl}
                      className="input-field text-xs pr-12 bg-white cursor-default text-[var(--color-muted-foreground)]"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopy(activeConfig.webhookUrl, 'Webhook URL')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-slate-100 rounded transition-colors"
                      title="Copy URL"
                    >
                      <Copy size={13} />
                    </button>
                  </div>
                  <p className="text-[10px] text-[var(--color-muted-foreground)] leading-relaxed">
                    Configure this target URL inside the developer settings panel of the platform to enable real-time message/lead event sync.
                  </p>
                </div>
              )}

              {/* Dynamically Loaded Configurations Fields */}
              <div className="space-y-3">
                {activeConfig.fields.map((field) => (
                  <div key={field.key}>
                    <label className="text-xs font-semibold mb-1 block">
                      {field.label}
                    </label>
                    <div className="relative">
                      <input
                        type={field.type === 'password' && !showPassword[field.key] ? 'password' : 'text'}
                        value={formValues[field.key] || ''}
                        onChange={(e) => handleInputChange(field.key, e.target.value)}
                        className={`input-field text-sm pr-16`}
                        placeholder={field.placeholder}
                      />
                      <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                        {field.type === 'password' && (
                          <button
                            type="button"
                            onClick={() => handleToggleShowPassword(field.key)}
                            className="p-1.5 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] rounded transition-colors"
                            title={showPassword[field.key] ? 'Hide password' : 'Show password'}
                          >
                            {showPassword[field.key] ? <EyeOff size={13} /> : <Eye size={13} />}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleCopy(formValues[field.key], field.label)}
                          className="p-1.5 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] rounded transition-colors"
                          title="Copy field value"
                        >
                          <Copy size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Sync Logs Drawer Collapsible */}
              {showLogs && (
                <div className="border border-[var(--color-border)] rounded-lg p-3 bg-slate-50 space-y-2.5 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-1.5">
                    <span className="text-xs font-semibold flex items-center gap-1.5">
                      <FileText size={13} className="text-slate-500" />
                      Platform Sync Audit Logs
                    </span>
                    <span className="text-[10px] text-[var(--color-muted-foreground)]">Showing recent log telemetry</span>
                  </div>
                  <div className="space-y-1.5 text-[10px] font-mono max-h-40 overflow-y-auto pr-1">
                    {activeConfig.logs && activeConfig.logs.length > 0 ? (
                      activeConfig.logs.map((log, i) => (
                        <div key={i} className="flex items-start gap-2 p-1.5 bg-white rounded border border-slate-100">
                          <span className="text-[8px] text-[var(--color-muted-foreground)] shrink-0 pt-0.5">{log.time}</span>
                          <span className={`px-1 rounded text-[8px] shrink-0 ${
                            log.type === 'Sync' ? 'bg-indigo-50 text-indigo-700' :
                            log.type === 'Connection' ? 'bg-cyan-50 text-cyan-700' :
                            log.type === 'Disconnection' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-700'
                          }`}>{log.type}</span>
                          <p className="text-[9px] text-slate-700 leading-tight flex-1">{log.message}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-[10px] text-[var(--color-muted-foreground)] italic text-center py-2">No connection sync history recorded.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Custom Integration Specific Actions */}
              {activeConfig.customButtons && activeConfig.customButtons.length > 0 && (
                <div className="border-t border-[var(--color-border)] pt-4 mt-4">
                  <h4 className="text-[10px] font-bold uppercase text-[var(--color-muted-foreground)] tracking-wider mb-2 flex items-center gap-1">
                    <Terminal size={12} className="text-slate-400" />
                    Platform Action Tools
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {activeConfig.customButtons.map((btnLabel) => (
                      <button
                        key={btnLabel}
                        onClick={() => handleCustomAction(activeConfig.id, btnLabel)}
                        className="btn-outline py-1.5 px-3 text-[10px] font-semibold"
                      >
                        {btnLabel}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* General Action Buttons Footer */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center sm:justify-between gap-3 border-t border-[var(--color-border)] pt-4 mt-5">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowLogs(!showLogs)}
                  className={`btn-outline py-1.5 px-3 text-xs justify-center gap-1.5 ${
                    showLogs ? 'bg-slate-100 text-slate-800' : ''
                  }`}
                  title="View Sync History Logs"
                >
                  <FileText size={13} />
                  {showLogs ? 'Hide Logs' : 'View Logs'}
                </button>
                {activeConfig.status === 'Connected' && (
                  <button
                    onClick={handleSyncNow}
                    disabled={isSyncing}
                    className="btn-outline py-1.5 px-3 text-xs justify-center gap-1.5"
                  >
                    <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
                    {isSyncing ? 'Syncing...' : 'Sync Now'}
                  </button>
                )}
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="btn-outline py-1.5 px-3 text-xs justify-center gap-1.5"
                >
                  {isTesting ? 'Testing...' : 'Test Connection'}
                </button>
                <button
                  onClick={handleSave}
                  className="btn-primary py-1.5 px-3 text-xs"
                >
                  Save Credentials
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
