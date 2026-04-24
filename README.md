# SteelEat

A self-hosted, open-source video and audio downloader with a clean web UI. Paste links from YouTube, TikTok, Instagram, Twitter/X, and 1000+ other sites — download as MP4 or MP3.

## Features

- Download videos from 1000+ supported sites (via [yt-dlp](https://github.com/yt-dlp/yt-dlp))
- MP4 video or MP3 audio extraction
- Automatic URL deduplication
- Clean, responsive UI — no frameworks, no build step
- Single Python file backend

## Quick Start

```bash
pip install -r requirements.txt
git clone https://github.com/vlz8/SteelEat.git
cd SteelEat
python app.py
```

Open **http://localhost:8899**.

Or with Docker:

```bash
docker build -t steel-eat .
docker run -p 8899:8899 steel-eat
```

## Usage

1. Paste one or more video URLs into the input box
2. Choose **MP4** (video) or **MP3** (audio)
3. Click **Fetch** to load video info and thumbnail
4. Click **Download**

## Supported Sites

Anything [yt-dlp supports](https://github.com/yt-dlp/yt-dlp/blob/master/supportedsites.md), including: YouTube, TikTok, Instagram, Twitter/X, Reddit, Facebook, Vimeo, Twitch, Dailymotion, SoundCloud, Loom, Streamable, Pinterest, Tumblr, Threads, LinkedIn, and many more.

## Stack

- **Backend:** Python, Flask
- **Frontend:** HTML, CSS, JS
- **Download engine:** [yt-dlp](https://github.com/yt-dlp/yt-dlp) + [ffmpeg](https://ffmpeg.org/)
- **Dependencies:** Flask, yt-dlp, ffmpeg

## Disclaimer

This tool is intended for personal use only. Please respect copyright laws and the terms of service of the platforms you download from. The developer is not responsible for any misuse of this tool.