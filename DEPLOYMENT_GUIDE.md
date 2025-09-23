# 🌍 Africa Research Base - Deployment Guide

## 🚀 Quick Deploy to Vercel

### Option 1: Vercel Web Interface (Recommended)

1. **Go to [vercel.com](https://vercel.com) and log in**
2. **Click "New Project"**
3. **Import your GitHub repository** (make sure it's public or Vercel can access it)
4. **Configure Project Settings:**
   - **Framework Preset**: Next.js
   - **Root Directory**: `./app` (important!)
   - **Build Command**: `yarn build`
   - **Output Directory**: `.next`
   - **Install Command**: `yarn install`

### Option 2: Vercel CLI (if installed)

```bash
cd /home/eaa/solana_dev/arb/africa_research_base/app
vercel --prod
```

---

## ⚙️ Environment Variables Setup

In your Vercel dashboard, go to **Project Settings > Environment Variables** and add:

### Required Variables:
```bash
# Solana Configuration
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_RPC_ENDPOINT=https://api.devnet.solana.com
PROGRAM_ID=EAo3vy4cYj9ezXbkZRwWkhUnNCjiBcF2qp8vwXNsPPD

# AI Analysis (Groq)
GROQ_API_KEY=your_groq_api_key_here

# Google Drive Integration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REFRESH_TOKEN=your_refresh_token

# Supabase (for search/indexing)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### How to Get API Keys:

#### 1. **Groq API Key:**
- Go to [console.groq.com](https://console.groq.com)
- Sign up and create an API key
- Copy the key to `GROQ_API_KEY`

#### 2. **Google Drive API:**
- Go to [Google Cloud Console](https://console.cloud.google.com)
- Create a new project or select existing
- Enable "Google Drive API"
- Create OAuth 2.0 credentials
- Set authorized redirect URI to your Vercel domain
- Use [OAuth Playground](https://developers.google.com/oauthplayground) to get refresh token

#### 3. **Supabase:**
- Go to [supabase.com](https://supabase.com)
- Create a new project
- Copy URL and anon key from Settings > API

---

## 🧪 Testing Your Deployment

After deployment, test these key features:

1. **Homepage loads** - Should show the Africa Research Base interface
2. **File Upload** - Try uploading a CSV file (will work with mock data if APIs aren't configured)
3. **Dataset Search** - Test the search functionality
4. **Wallet Connection** - Connect Phantom wallet
5. **Responsive Design** - Test on mobile and desktop

---

## 🔧 Production Checklist

- [ ] Environment variables configured in Vercel
- [ ] Google Drive API credentials set up
- [ ] Groq API key configured
- [ ] Supabase project created (optional)
- [ ] Domain configured (optional)
- [ ] Smart contracts deployed to Solana mainnet (when ready)

---

## 📱 Your Deployed App

Once deployed, your app will be available at:
`https://your-project-name.vercel.app`

**Current Status:**
✅ Local development server running on http://localhost:3000
✅ Build process working
✅ Tests passing
✅ Deployment configuration ready

**Next Steps:**
1. Set up environment variables in Vercel
2. Deploy via Vercel web interface
3. Test all functionality
4. Configure custom domain (optional)

---

## 🆘 Troubleshooting

**Build Fails:**
- Check environment variables are set correctly
- Verify all dependencies are installed
- Check for TypeScript errors

**API Calls Fail:**
- Verify API keys are correct
- Check network configuration
- Test API endpoints individually

**Wallet Connection Issues:**
- Ensure Phantom wallet is installed
- Check Solana network configuration
- Verify smart contract addresses

---

## 📞 Need Help?

If you encounter any issues:
1. Check the Vercel deployment logs
2. Verify all environment variables are set
3. Test API keys individually
4. Check browser console for errors

Would you like me to help you with any specific part of the deployment process?
