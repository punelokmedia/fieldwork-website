# REQUIRED TOKENS & PERMISSIONS LIST

Appko **3 alag-alag tokens** ki zaroorat hai agar aap teeno platforms par post karna chahte hain.

## 1. Facebook Page Access Token 📘
**Yeh sabse zaroori hai.** Isse aap Facebook Page par post kar sakte hain.

*   **Type:** Page Access Token (User Token nahi!)
*   **Required Permissions (Scopes):**
    1.  `pages_manage_posts` (Post karne ke liye)
    2.  `pages_read_engagement` (Post verify karne ke liye)
    3.  `public_profile` (Default)

** kaise milega?**
Graph API Explorer me permissions add karein -> "Generate Access Token" -> Dropdown se **"Get Page Access Token"** select karein -> Apna Page select karein.

---

## 2. Instagram Access Token 📸
Agar aap Instagram par bhi post karna chahte hain.

*   **Type:** User/Page Token (Linked Account)
*   **Required Permissions (Scopes):**
    1.  `instagram_basic`
    2.  `instagram_content_publish` (Photo/Video upload karne ke liye)
    3.  `pages_show_list`
    4.  `business_management` (Kabhi kabhi zaroorat padti hai)

---

## 3. Threads Access Token 🧵
Threads par post karne ke liye.

*   **Type:** Threads User Token
*   **Required Permissions (Scopes):**
    1.  `threads_basic`
    2.  `threads_content_publish` (Post karne ke liye)

---

### ⚠️ Common Mistake (Ye mat karna)
*   User Token mat use karein Facebook ke liye. Hamesha **Page Access Token** select karein.
*   Agar aapne `pages_manage_posts` tick nahi kiya, to "Permission Error" aayega.

### .env File Format
```env
# Facebook
FACEBOOK_PAGE_ID=122124278451020901
FACEBOOK_PAGE_ACCESS_TOKEN= (Token with pages_manage_posts)

# Instagram
INSTAGRAM_BUSINESS_ID=17841476167588828
INSTAGRAM_ACCESS_TOKEN= (Token with instagram_content_publish)

# Threads
THREADS_ACCESS_TOKEN= (Token with threads_content_publish)
```
