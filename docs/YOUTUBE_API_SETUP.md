# YouTube Data API v3 Setup Guide

This guide covers setting up and troubleshooting YouTube API integration for the UNSAID productivity app.

## Architecture Overview

```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│    Frontend         │────▶│    Backend          │────▶│   YouTube API       │
│    (Next.js)        │     │    (Node.js)        │     │   (Google)          │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
                            │
                            ▼
                     YOUTUBE_API_KEY
                    (Server .env only!)
```

**Security:** The API key is stored ONLY on the backend. The frontend calls our backend proxy, which then calls YouTube API. This prevents exposing the API key to users.

---

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Select a project** → **New Project**
3. Name: `unsaid-productivity` (or any name)
4. Click **Create**

## Step 2: Enable YouTube Data API v3

1. In Google Cloud Console, go to **APIs & Services** → **Library**
2. Search for "YouTube Data API v3"
3. Click on it and press **Enable**

## Step 3: Create API Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **+ Create Credentials** → **API Key**
3. Copy the generated key

## Step 4: Configure API Key Restrictions (Important!)

### For Development (Local)
1. Click on your API key
2. Under **Application restrictions**, select **None** (or IP addresses)
3. Under **API restrictions**, select **Restrict key**
4. Choose **YouTube Data API v3**
5. Click **Save**

### For Production (Server)
1. Under **Application restrictions**, select **IP addresses**
2. Add your server's IP address(es)
3. Under **API restrictions**, select **Restrict key**
4. Choose **YouTube Data API v3**
5. Click **Save**

## Step 5: Add to Environment Variables

Add to your `server/.env` file:

```env
YOUTUBE_API_KEY="AIzaSy..."  # Your actual key
```

**Never commit this to version control!**

---

## Common Errors & Solutions

### Error: `YOUTUBE_QUOTA_EXCEEDED`
**Message:** "Daily YouTube search limit reached"

**Cause:** YouTube API has a daily quota of 10,000 units. Each search costs ~100 units.

**Solutions:**
1. Wait until quota resets (midnight Pacific Time)
2. Request quota increase from Google Cloud Console
3. Implement caching to reduce API calls

### Error: `YOUTUBE_PERMISSION_DENIED`
**Message:** "YouTube Data API is not enabled"

**Solutions:**
1. Verify API is enabled in Google Cloud Console
2. Check project billing is set up (even free tier needs billing account)
3. Ensure API key belongs to correct project

### Error: `YOUTUBE_IP_BLOCKED`
**Message:** "API key has IP restrictions blocking this request"

**Solutions:**
1. Go to Google Cloud Console → Credentials
2. Edit your API key
3. Either:
   - Remove IP restrictions (less secure, for development)
   - Add your server's IP to allowed list

### Error: `YOUTUBE_INVALID_KEY`
**Message:** "Invalid YouTube API key"

**Solutions:**
1. Verify the key is copied correctly (no extra spaces)
2. Check the key hasn't been deleted/regenerated
3. Ensure `.env` file is loaded (restart server)

### Error: `YOUTUBE_NETWORK_ERROR`
**Message:** "Network error while connecting"

**Solutions:**
1. Check internet connectivity
2. Verify firewall isn't blocking `googleapis.com`
3. Check server DNS settings

### Error: `YOUTUBE_MISSING_API_KEY`
**Message:** "YouTube API key is not configured"

**Solutions:**
1. Ensure `YOUTUBE_API_KEY` is in `server/.env`
2. Restart the server after adding the key
3. Check `.env` file syntax (no quotes issues)

---

## API Endpoints Reference

### Search Music
```
GET /api/youtube/search?q={query}

Response:
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "videoId123",
        "videoId": "videoId123",
        "title": "Song Title",
        "channelTitle": "Channel Name",
        "thumbnail": "https://...",
        "url": "https://www.youtube.com/watch?v=...",
        "embedUrl": "https://www.youtube.com/embed/..."
      }
    ],
    "count": 10
  }
}
```

### Mood-based Recommendations
```
GET /api/youtube/mood/{mood}

Supported moods:
- CALM
- FOCUS
- ANXIOUS
- SAD
- SLEEP
- HAPPY
- STRESSED
- TIRED
```

### Favorites (Authenticated)
```
POST /api/youtube/favorite
GET  /api/youtube/favorites
DELETE /api/youtube/favorites/:videoId
```

---

## Rate Limiting

The backend implements rate limiting:
- **20 requests per minute** per IP for search endpoints
- This helps conserve YouTube API quota

---

## Testing the Integration

1. **Start the server:**
   ```bash
   cd server
   npm run dev
   ```

2. **Test with curl:**
   ```bash
   curl "http://localhost:5000/api/youtube/search?q=lofi"
   ```

3. **Check for proper response:**
   - Success: `{ "success": true, "data": { "results": [...] } }`
   - Error: `{ "success": false, "error": { "code": "...", "message": "..." } }`

---

## Quota Management Tips

1. **Cache results:** Store popular searches in Redis or memory
2. **Debounce searches:** Wait 500ms after user stops typing
3. **Limit results:** Request only 10 results per search
4. **Use mood presets:** Pre-defined searches for common moods

---

## Best Practices

1. **Never expose the API key in frontend code**
2. **Always use backend proxy for API calls**
3. **Implement proper error handling**
4. **Show user-friendly error messages**
5. **Log errors for debugging (without exposing sensitive data)**
6. **Monitor quota usage regularly**
7. **Have fallback content when API is unavailable**

---

## Need Help?

If you're still having issues:
1. Check server logs for detailed error messages
2. Verify API key in Google Cloud Console
3. Test API directly using Google's API Explorer
4. Check YouTube API status page for outages
