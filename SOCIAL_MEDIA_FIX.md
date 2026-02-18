# Social Media Publishing Guide

## Current Status
Your application is correctly configured to communicate with Facebook, Instagram, and Threads APIs. However, your **Access Tokens are missing valid permissions**.

### 1. Facebook Error: `(#200) This endpoint is deprecated... publish_actions is deprecated`
This error is misleading. It is the default error Facebook returns when you try to post using an Access Token that **does not have the `pages_manage_posts` permission**.

**Solution:**
1. Go to [Graph API Explorer](https://developers.facebook.com/tools/explorer/).
2. Select your App.
3. In permissions, add: **`pages_manage_posts`**.
4. Click "Generate Access Token".
5. **Switch the dropdown** from "User Token" to **"Get Page Access Token"**.
6. Select the page **Voice Lok**.
7. Copy the new token and update `FACEBOOK_PAGE_ACCESS_TOKEN` in `.env`.

### 2. Instagram Error: `(#10) Application does not have permission for this action`
This error means your Token (and possibly your App Mode) prevents posting.

**Solution:**
1. In Graph API Explorer, ensure you also add:
   - `instagram_basic`
   - `instagram_content_publish`
   - `pages_show_list`
2. Generate the token again.
3. Update `INSTAGRAM_ACCESS_TOKEN` in `.env`.
   *(Note: Instagram often shares the same token as the Page if the accounts are linked, but verify specifically for Instagram permissions).*

### 3. Threads Error
Threads requires specific beta access or specific scopes.
1. Ensure you have added the **Threads Tester** to your app.
2. Generate a token with:
   - `threads_basic`
   - `threads_content_publish`
3. Update `THREADS_ACCESS_TOKEN` in `.env`.
