# 🌌 Starry Sky Birthday Website

A single-page, cinematic birthday experience: your sister explores a night
sky, discovers memories hidden inside glowing stars, watches them form a
constellation, makes a wish, and sees the sky erupt into fireworks with a
final message from you.

Pure HTML5 + CSS3 + vanilla JavaScript. No build tools, no backend, no
dependencies. Works as a static site and deploys directly to GitHub Pages.

---

## 1. Project structure

```
birthday-website/
├── index.html
├── style.css
├── script.js
├── assets/
│   ├── photos/
│   │   ├── memory1.jpg   ← placeholders, replace with real photos
│   │   ├── memory2.jpg
│   │   └── ... memory10.jpg
│   └── music/
│       └── birthday.mp3  ← optional, add your own song here
└── README.md
```

## 2. Replace your sister's name & your name

Open **`script.js`** and edit the `CONFIG` object near the top:

```js
const CONFIG = {
  sisterName: "Sister's Name",   // → change to her real name
  yourName: "Your Name",         // → change to your name
  musicEnabled: true,            // set false to hide the music player
  musicSrc: "assets/music/birthday.mp3",
  constellationShape: "heart",
};
```

The name is inserted automatically everywhere it appears (opening scene,
final scene, browser tab title) — you only need to change it in this one
place.

## 3. Replace the photos

1. Add your own images to `assets/photos/`.
2. In **`script.js`**, find the `MEMORIES` array and update the `image`
   path for each entry to match your filenames, e.g.:
   ```js
   { title: "Our Childhood 💕", image: "assets/photos/memory1.jpg", message: "…" }
   ```
3. Square-ish or landscape photos (roughly 800×600 or similar) look best —
   the modal frame will crop/scale automatically.
4. Keep file sizes reasonable (under ~500KB each) so the site stays fast
   on mobile data.

## 4. Add or edit memories

Still in `script.js`, each item in `MEMORIES` is:

```js
{
  title: "Short title with an emoji",
  image: "assets/photos/yourphoto.jpg",
  message: "One or two warm, personal sentences."
}
```

- Aim for **8–12 memories** total (the site is tuned for that range).
- The order in the array doesn't need to match anything visual — stars
  are scattered randomly across the sky and only line up into the heart
  shape once every memory has been discovered.
- Keep messages short (1–3 sentences) — the design intentionally avoids
  large blocks of text.

## 5. Add background music (optional)

1. Drop an MP3 into `assets/music/birthday.mp3` (keep that exact filename,
   or update `musicSrc` in `CONFIG` if you'd rather use a different name).
2. Music will **not** autoplay on page load (browsers block that) — it
   starts the moment your sister taps **"Enter the Universe"**, and she
   can pause/adjust volume with the small player in the bottom-right
   corner at any time.
3. If you skip this step entirely, the site works exactly the same —
   the music controls quietly hide themselves and nothing breaks.

## 6. Test it locally

Because the page loads local files (photos, audio) via relative paths,
opening `index.html` directly by double-clicking it can be blocked by
some browsers' security rules. The easiest fix is to serve the folder
with a tiny local server:

**Option A — Python (already installed on most Macs/Linux):**
```bash
cd birthday-website
python3 -m http.server 8000
```
Then open `http://localhost:8000` in your browser.

**Option B — VS Code:**
Install the "Live Server" extension, right-click `index.html`, and choose
"Open with Live Server".

Test on your phone too — resize your browser window down, or visit the
same local URL from your phone if it's on the same Wi-Fi network
(replace `localhost` with your computer's local IP address).

## 7. Publish with GitHub Pages

1. Create a new repository on GitHub (public or private — Pages works
   with either, though private repos need a paid plan for Pages).
2. Push this whole `birthday-website` folder to the repo:
   ```bash
   cd birthday-website
   git init
   git add .
   git commit -m "Starry sky birthday website"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```
3. On GitHub, go to **Settings → Pages**.
4. Under "Build and deployment", set **Source** to "Deploy from a
   branch", branch **main**, folder **/ (root)**. Save.
5. GitHub will give you a URL like:
   `https://YOUR_USERNAME.github.io/YOUR_REPO/`
   It can take a minute or two to go live.
6. Send that link to your sister on her birthday. 🎉

All paths in this project are relative, so it works correctly whether
it's hosted at the root of a domain or inside a repo subfolder like the
GitHub Pages URL above.

## 8. Notes on customization

- **Colors:** all palette colors are CSS custom properties at the top of
  `style.css` (`:root { --c-black, --c-navy, --c-blue, --c-glow,
  --c-purple, --c-white, --c-pink }`) if you want to nudge the mood.
- **Constellation shape:** stars currently animate into a heart shape,
  computed in `buildHeartPositions()` in `script.js`. If you'd rather try
  an initial letter, you can hand-write an array of `{x, y}` percentage
  points (0–100) tracing the letter's outline and swap it in.
- **Accessibility:** all interactive elements (enter button, memory
  stars, candle, modal close, music controls) are real, keyboard-focusable
  `<button>` elements with `aria-label`s, and the site respects
  `prefers-reduced-motion` by toning down animation.
- **Performance:** the ambient starfield, nebula glow, shooting stars,
  and fireworks are all drawn on a single `<canvas>` rather than as
  thousands of DOM elements, and pause their heavier work when the tab
  isn't visible.

Happy birthday to her. ✨
