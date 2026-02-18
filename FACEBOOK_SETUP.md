# How to Generate the Correct Facebook/Instagram/Threads Tokens

Your application needs specific permissions to post on your behalf. The error `(#200) The permission(s) pages_manage_posts are not available` means your current token lacks these permissions.

Here is the step-by-step guide to generate a **Page Access Token** with the correct permissions.

### Prerequisites
1. You must be an **Admin** of the Facebook Page (`783310921531708`).
2. Your Facebook App (`931132182934426`) must be connected to this Page.

### Step 1: Go to Graph API Explorer
Open [https://developers.facebook.com/tools/explorer/](https://developers.facebook.com/tools/explorer/)

### Step 2: Select Your App
In the "Meta App" dropdown, select your app: **Simola** (or whatever name corresponds to ID `931132182934426`).

### Step 3: Add Permissions (Permissions Window)
Click on the **"Add a Permission"** dropdown and add the following permissions. You can search for them:

**For Facebook Posting:**
- `pages_manage_posts` (Required to post content)
- `pages_read_engagement` (Required so the app can verify the post)
- `public_profile` (Default)

**For Instagram Posting (if needed):**
- `instagram_basic`
- `instagram_content_publish`
- `pages_show_list`

### Step 4: Generate User Token
Click **"Generate Access Token"** (the big blue button).
Allow the permissions in the popup window. Make sure to select the correct Page(s) you want to manage.

### Step 5: Exchange for Page Token 
1. In the "User or Page" dropdown (top right of the request window), switch from "User Token" to **"Get Page Access Token"**.
2. Select your specific Page (`Simola` or similar name).
3. The "Access Token" field will update with a **Page Access Token**.

### Step 6: Verify and Copy
This new token is the one you need.
1. Click the "Info" (i) icon next to the token to verify it has `pages_manage_posts`.
2. Copy this token.

### Step 7: Update `.env`
Paste the new token into your `server/.env` file:
```env
FACEBOOK_PAGE_ACCESS_TOKEN=YOUR_NEW_LONG_TOKEN_HERE
```
(Do the same for `INSTAGRAM_ACCESS_TOKEN` if you generated one for that as well).

### Step 8: Restart Server
Run `npm run dev` again to reload the environment variables.

Your invalid/missing permissions error should now be resolved!
