# 🎌 Carbone (RealDebrid + Stremio MAL Sync)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![Node.js](https://img.shields.io/badge/node-%3E=18-brightgreen)](https://nodejs.org/) [![Deploy to Railway](https://img.shields.io/badge/Deploy-Railway-4B53BC?logo=railway)](https://railway.app/) [![Deploy to Render](https://img.shields.io/badge/Deploy-Render-46E3B7?logo=render)](https://render.com/)


Easily stream your downloaded anime using **Stremio** with **RealDebrid**, and keep everything in sync with your **MyAnimeList** account thanks to the [MAL Addon](https://mal-stremio.vercel.app/configure).

This setup offers a smooth experience for anime fans who want powerful playback and seamless tracking — all in one place.

## 🚀 Features

- 🔗 Integrates RealDebrid with Stremio for quick access to your downloaded anime  
- 🧠 Auto-sync with MyAnimeList using the MAL Stremio addon  
- 🎬 Supports subtitle fetching via OpenSubtitles  
- ⚡ Fast loading after initial setup  

## 🛠 Requirements

Make sure you have the following before you start:

- [RealDebrid API Key](https://real-debrid.com/)
- [MAL Addon](https://mal-stremio.vercel.app/configure)

> ⏳ *Note: On your first use, it may take a little time to load your anime list. Subsequent loads will be much faster.*

## 🎯 Try It Out

👉 **[Launch the app here](https://carbone.sytes.net/)**

## 🧰 Deploy It Yourself

Want to run Carbone locally or host it on your own server? Here’s how you can set it up in just a few steps.

### 📦 Requirements

Before you begin, make sure you have:

- [RealDebrid API Key](https://real-debrid.com/)
- [OpenSubtitles API Key](https://www.opensubtitles.com/es) *(used for guessit api for extracting metadata from filenames)*
- Node.js 18 or higher
- A hosting option like Render, Railway, or just plain `localhost`

---

### 🛠 Setup Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/kingclutch23/stremio-carbone-addon.git
   cd stremio-carbone-addon
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create a `.env` file** and add your environment variables:
   ```env
   PORT=7000
   IP=0.0.0.0
   OPENSUBTITLES_API_KEY=your_opensubtitles_api_key_here
   ```

4. **Start the server**
   ```bash
   npm start
   ```

5. **Access it locally**
   Visit: [http://localhost:7000](http://localhost:7000)

   You’ll see a landing page with a button to install the addon in Stremio. Stremio will automatically show a configuration screen where users can input their **RealDebrid API Key**.

---

### 🌍 Deploying Online

You can easily deploy Carbone on platforms like:

<table>
    <thead>
        <tr>
            <th>Platform</th>
            <th>Badge</th>
            <th>Notes</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td><a href="https://render.com/" target="_blank" rel="noreferrer">Render</a></td>
            <td><img src="https://img.shields.io/badge/Render-Deploy-46E3B7" alt="Render"></td>
            <td>Easiest option</td>
        </tr>
        <tr>
            <td><a href="https://railway.app/" target="_blank" rel="noreferrer">Railway</a></td>
            <td><img src="https://img.shields.io/badge/Railway-Deploy-4B53BC" alt="Railway"></td>
            <td>Free tier available</td>
        </tr>
        <tr>
            <td><a href="https://vercel.com/" target="_blank" rel="noreferrer">Vercel</a></td>
            <td><img src="https://img.shields.io/badge/Vercel-Deploy-000000" alt="Vercel"></td>
            <td>Needs config tweaks</td>
        </tr>
        <tr>
            <td>Any VPS</td>
            <td><img src="https://img.shields.io/badge/VPS-Ubuntu_20+-yellow" alt="VPS"></td>
            <td>Use PM2/Nginx</td>
        </tr>
    </tbody>
</table>

Just make sure to set the correct environment variables and allow public access to the port you define in `.env`.

> 💡 If using a custom domain, consider setting up HTTPS using Let's Encrypt and a dynamic DNS provider like No-IP for easy access.

---

### 🧪 Testing

After deploying, visit the server URL in your browser. You should see the addon landing page. Click the install button to add it to Stremio and test streaming functionality with RealDebrid.

---

### 🤝 Contributing

Feel free to submit pull requests or open issues! Bug fixes, feature additions, and documentation improvements are welcome.

---

### 📄 License

This project is licensed under the [MIT License](LICENSE).

---

Made with ❤️ by [@kingclutch23](https://github.com/kingclutch23) (and chatGPT ngl)

