# Job Autofiller Browser Extension 🚀

A powerful Chrome extension that automatically fills job application forms with your saved profile data. Works seamlessly with LinkedIn, Indeed, Workday, Greenhouse, Lever, and other job platforms.

## ✨ Features

- **Smart Form Detection**: Automatically detects job application forms on any website
- **Intelligent Field Mapping**: Uses advanced heuristics to identify and fill form fields correctly
- **Dashboard Integration**: Syncs with your Next.js dashboard for easy profile management
- **Beautiful UI**: Modern dark theme with glassmorphism effects
- **Keyboard Shortcut**: Quick autofill with `Ctrl+Shift+F` (or `Cmd+Shift+F` on Mac)
- **Platform Support**: Works on LinkedIn, Indeed, Workday, Greenhouse, Lever, and generic forms
- **Visual Feedback**: Smooth animations and notifications during autofill

## 📦 Installation

### 1. Load the Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Select the `extension` folder: `D:\Job Applications\job-autofiller\extension`
5. The extension should now appear in your extensions list

### 2. Set Up Your Profile

1. Make sure your dashboard is running:
   ```bash
   cd "D:\Job Applications\job-autofiller\dashboard"
   npm run dev
   ```

2. Open the dashboard at `http://localhost:3000`

3. Fill out your profile information:
   - Personal Info (name, email, phone, etc.)
   - Experience
   - Education
   - Skills
   - Q&A Bank (for cover letters and common questions)

4. Click **Save Profile**

### 3. Sync Extension with Dashboard

1. Click the **Job Autofiller** extension icon in Chrome toolbar
2. Click **Sync from Dashboard** button
3. Your profile data will be synced to the extension

## 🎯 Usage

### Method 1: Extension Popup

1. Navigate to any job application page
2. Click the **Job Autofiller** extension icon
3. Click **Autofill Current Page**
4. Watch as your form fields are automatically filled!

### Method 2: Floating Button

1. On job application pages, a floating **Autofill** button will appear in the bottom-right corner
2. Click it to instantly fill the form

### Method 3: Keyboard Shortcut

1. Press `Ctrl+Shift+F` (Windows/Linux) or `Cmd+Shift+F` (Mac)
2. Form fields will be filled automatically

## 🔧 How It Works

1. **Form Detection**: The extension scans the page for input fields, textareas, and select elements
2. **Field Analysis**: Uses multiple heuristics (name, id, placeholder, label, aria-label) to identify field types
3. **Data Mapping**: Maps your profile data to the detected fields
4. **Smart Filling**: Fills fields and triggers appropriate events for React/Vue compatibility
5. **Visual Feedback**: Shows animations and notifications to confirm successful autofill

## 📁 Extension Structure

```
extension/
├── manifest.json              # Extension configuration
├── background.js              # Service worker for lifecycle management
├── icons/                     # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── popup/                     # Extension popup UI
│   ├── popup.html
│   ├── popup.js
│   └── popup.css
├── content/                   # Content scripts (run on web pages)
│   ├── content.js            # Main content script
│   ├── content.css           # Content script styles
│   ├── fieldDetector.js      # Form field detection logic
│   └── autofiller.js         # Autofill logic
└── utils/                     # Utility modules
    ├── constants.js          # Field patterns and selectors
    ├── storage.js            # Chrome storage wrapper
    └── types.js              # Type definitions
```

## 🎨 Supported Platforms

- **LinkedIn** - Easy Apply and standard application forms
- **Indeed** - Application forms
- **Workday** - Job application portals
- **Greenhouse** - ATS application forms
- **Lever** - Job application forms
- **Generic Forms** - Any job application form with standard fields

## 🔑 Supported Fields

The extension can automatically fill:

- **Personal Information**: First name, last name, full name, email, phone, location
- **Professional Links**: LinkedIn, portfolio, GitHub
- **Experience**: Company, position, years of experience
- **Education**: School/university, degree, major/field of study, GPA
- **Additional**: Cover letters (from Q&A bank)

## 🛠️ Troubleshooting

### Extension Not Detecting Forms

- Make sure you're on a job application page
- Refresh the page after installing the extension
- Check that the page has at least 3 common job application fields

### Autofill Not Working

- Verify your profile is loaded (check extension popup)
- Try syncing from dashboard again
- Make sure the dashboard is running at `http://localhost:3000`

### Fields Not Filling Correctly

- Some fields may have custom validation that prevents autofill
- Check that your profile data is complete
- Some platforms use non-standard field names (report these for future updates)

### Sync Not Working

- Ensure the dashboard is running at `http://localhost:3000`
- Make sure you've saved your profile in the dashboard
- Check browser console for error messages

## 🔄 Updating Your Profile

1. Open the dashboard at `http://localhost:3000`
2. Make changes to your profile
3. Click **Save Profile**
4. Open the extension popup
5. Click **Sync from Dashboard**

## 🚀 Tips for Best Results

1. **Keep Profile Complete**: Fill out all sections in the dashboard for maximum autofill coverage
2. **Use Q&A Bank**: Add common questions and answers for automatic cover letter generation
3. **Test Before Applying**: Always review filled fields before submitting applications
4. **Update Regularly**: Keep your profile current with latest experience and skills

## 🔐 Privacy & Security

- All data is stored locally in your browser
- No data is sent to external servers
- Profile data is only accessible to you
- Extension only runs on pages you visit

## 📝 Notes

- The extension requires the dashboard to be running for initial sync
- After syncing, the extension works offline
- Profile data persists in Chrome storage
- Compatible with Chrome and Chromium-based browsers (Edge, Brave, etc.)

## 🎉 Enjoy!

Your job application process just got a whole lot easier! Focus on finding the right opportunities while the extension handles the repetitive form filling.

---

**Need Help?** Check the browser console for detailed error messages or review the implementation plan for technical details.
