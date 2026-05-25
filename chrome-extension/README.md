# theQuickResume Chrome Extension

Auto-fills LinkedIn Easy Apply forms using your profile from theQuickResume.

## Install (Developer Mode)

1. Open Chrome → go to `chrome://extensions`
2. Toggle **Developer mode** ON (top right)
3. Click **Load unpacked**
4. Select this `chrome-extension/` folder
5. The ⚡ icon will appear in your toolbar

## Connect your account

1. Click the extension icon
2. In theQuickResume dashboard → **Profile** → scroll to bottom → click **Generate API Key**
3. Copy the key → paste it into the extension popup → click **Connect**

> For local dev, set Server URL to `http://localhost:3000`

## How to use

1. Go to any LinkedIn job page
2. If the job has Easy Apply, a **⚡ Quick Apply** button appears next to it
3. Click it — the panel opens, AI generates answers to screening questions
4. Click **⚡ Fill this step** to auto-fill the current form step
5. Review the filled fields, click **Next** yourself
6. The application is automatically tracked in your dashboard → **Applications**
