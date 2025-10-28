# Deploy DCA Protocol Front-end to Vercel

Complete guide to deploy your DCA Protocol web interface to Vercel using the Vercel UI.

## 📋 Prerequisites

- ✅ GitHub repository: https://github.com/brolab-dev/dca-btc-mezo
- ✅ Vercel account (free tier works perfectly)
- ✅ Front-end code in `front-end/` directory

---

## 🚀 Step-by-Step Deployment Guide

### Step 1: Create Vercel Account (if needed)

1. Go to **https://vercel.com**
2. Click **"Sign Up"**
3. Choose **"Continue with GitHub"** (recommended for easy integration)
4. Authorize Vercel to access your GitHub account

---

### Step 2: Import Your Project

1. After logging in, click **"Add New..."** button (top right)
2. Select **"Project"**
3. You'll see the "Import Git Repository" page

#### Option A: If Repository is Already Connected
- Find `dca-btc-mezo` in the list
- Click **"Import"**

#### Option B: If Repository is Not Listed
- Click **"Adjust GitHub App Permissions"** or **"Add GitHub Account"**
- Select your GitHub account (`brolab-dev`)
- Choose **"Only select repositories"**
- Select `dca-btc-mezo`
- Click **"Install"**
- Return to Vercel and click **"Import"** next to your repository

---

### Step 3: Configure Project Settings

On the "Configure Project" page, set the following:

#### 1. Project Name
```
dca-protocol
```
Or any name you prefer (this will be your subdomain: `dca-protocol.vercel.app`)

#### 2. Framework Preset
- Vercel should auto-detect **"Vite"**
- If not, select **"Vite"** from the dropdown

#### 3. Root Directory
**IMPORTANT**: Click **"Edit"** next to Root Directory
```
front-end
```
This tells Vercel your app is in the `front-end/` folder, not the root.

#### 4. Build and Output Settings

Click **"Override"** to customize build settings:

**Build Command:**
```bash
npm run build
```

**Output Directory:**
```
dist
```

**Install Command:**
```bash
npm install
```

#### 5. Environment Variables

Click **"Add Environment Variables"** (optional for now, can add later)

You don't need any environment variables for the front-end to work initially. The contract addresses are already hardcoded in the code.

---

### Step 4: Deploy

1. Review all settings:
   - ✅ Root Directory: `front-end`
   - ✅ Build Command: `npm run build`
   - ✅ Output Directory: `dist`
   - ✅ Framework: Vite

2. Click **"Deploy"** button

3. Wait for deployment (usually 1-3 minutes)
   - You'll see a build log showing:
     - Installing dependencies
     - Building the project
     - Deploying to Vercel's CDN

---

### Step 5: Verify Deployment

1. Once complete, you'll see a **"Congratulations"** screen with confetti 🎉

2. Click **"Visit"** or go to your deployment URL:
   ```
   https://dca-protocol.vercel.app
   ```
   (or whatever project name you chose)

3. Test the application:
   - ✅ Page loads with futuristic UI
   - ✅ "Connect Wallet" button works
   - ✅ Can connect MetaMask or other wallets
   - ✅ Can view dashboard and create plans

---

## 🔧 Post-Deployment Configuration

### Add Custom Domain (Optional)

1. Go to your project dashboard on Vercel
2. Click **"Settings"** tab
3. Click **"Domains"** in the sidebar
4. Click **"Add"**
5. Enter your custom domain (e.g., `dca.yourdomain.com`)
6. Follow DNS configuration instructions

### Configure Environment Variables (If Needed)

If you want to make contract addresses configurable:

1. Go to **"Settings"** → **"Environment Variables"**
2. Add variables:
   ```
   VITE_DCA_CONTRACT_ADDRESS=0x29C17CD908EF3087812760C099735AA7f1cDacA4
   VITE_MUSD_TOKEN_ADDRESS=0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503
   VITE_BTC_TOKEN_ADDRESS=0x7b7C000000000000000000000000000000000000
   ```
3. Click **"Save"**
4. Redeploy the project

### Enable Automatic Deployments

Vercel automatically deploys when you push to GitHub:

- **Production**: Pushes to `main` branch → deploys to `dca-protocol.vercel.app`
- **Preview**: Pushes to other branches → creates preview URLs

---

## 📊 Vercel Dashboard Features

### Deployments Tab
- View all deployments (production + previews)
- See build logs
- Rollback to previous versions

### Analytics Tab
- View visitor statistics
- Monitor performance
- Track Web Vitals

### Settings Tab
- Configure domains
- Set environment variables
- Adjust build settings
- Configure Git integration

---

## 🐛 Troubleshooting

### Build Fails with "Cannot find module"

**Solution**: Make sure Root Directory is set to `front-end`

1. Go to **Settings** → **General**
2. Scroll to **Root Directory**
3. Set to `front-end`
4. Click **Save**
5. Redeploy from **Deployments** tab

### Build Fails with "Command not found"

**Solution**: Check Build Command

1. Go to **Settings** → **General**
2. Scroll to **Build & Development Settings**
3. Set Build Command to: `npm run build`
4. Set Output Directory to: `dist`
5. Click **Save**
6. Redeploy

### Page Shows 404 on Refresh

**Solution**: The `vercel.json` file should handle this, but if not:

1. Go to **Settings** → **General**
2. Scroll to **Build & Development Settings**
3. Make sure `vercel.json` exists in `front-end/` directory
4. Redeploy

### Wallet Connection Issues

This is normal - make sure:
- You're using a browser with MetaMask or WalletConnect
- You're on the correct network (Mezo Testnet)
- The contract addresses in the code are correct

---

## 🎯 Quick Checklist

Before deploying, ensure:

- [ ] Code is pushed to GitHub
- [ ] `front-end/` directory contains all necessary files
- [ ] `package.json` has correct build scripts
- [ ] `vercel.json` is in `front-end/` directory
- [ ] No `.env` files are committed (use Vercel environment variables)

---

## 🔗 Useful Links

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Vercel Documentation**: https://vercel.com/docs
- **Your GitHub Repo**: https://github.com/brolab-dev/dca-btc-mezo
- **Vite Documentation**: https://vitejs.dev/guide/

---

## 📱 Mobile Testing

After deployment, test on mobile:

1. Open deployment URL on your phone
2. Test wallet connection (MetaMask mobile app)
3. Verify responsive design works
4. Test all features (create plan, view history, etc.)

---

## 🚀 Next Steps After Deployment

1. **Share Your App**: Share the Vercel URL with users
2. **Monitor Performance**: Check Vercel Analytics
3. **Set Up Custom Domain**: Add your own domain
4. **Enable Web3 Features**: Test wallet connections
5. **Update README**: Add deployment URL to your GitHub README

---

## 💡 Pro Tips

1. **Preview Deployments**: Every PR gets a unique preview URL
2. **Instant Rollbacks**: Rollback to any previous deployment in one click
3. **Edge Network**: Your app is deployed globally on Vercel's edge network
4. **Automatic HTTPS**: SSL certificates are automatically provisioned
5. **Zero Config**: Vercel auto-detects Vite and configures everything

---

## 🎉 Success!

Once deployed, your DCA Protocol will be live at:
```
https://your-project-name.vercel.app
```

Users can:
- ✅ Connect their wallets
- ✅ Create DCA plans
- ✅ Monitor executions
- ✅ Link Telegram for notifications
- ✅ View execution history

**Enjoy your deployed DCA Protocol!** 🚀

