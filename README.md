# Campus Loop

A mobile-first campus personality quiz with an unexpected Halloween ending, made for CS Society. The page title, social preview text, and sharing copy keep the surprise hidden.

## Run locally

Use Node.js 20 or newer. No packages to install.

```
npm run dev
```

Open http://127.0.0.1:4173. Run `npm run check` to check JavaScript syntax.

## Deploy on Vercel

Import the GitHub repository. Use the **Other** framework preset. Leave the build command empty and use `.` as the output directory. The included `vercel.json` sets these values. No environment variables or backend are needed.

After deployment, make the QR code point to the public production URL. Suggested QR poster: **“What’s your campus energy? Scan to find out.”** Use an innocent repository/project name such as `campus-loop`, so the URL doesn’t reveal the prank.

## Add the society logo

The current `assets/society-mark.svg` is a temporary code symbol, not an official logo. Replace it with the supplied logo. For PNG/WebP, update the image source in `index.html` (`id="society-logo"`). The real logo appears only at the reveal.

## Experience

1. Three campus-themed multiple-choice questions. No answers leave the page.
2. A normal personality result based on the visitor’s first choice. No loading countdown or horror clues. The result waits for the visitor to open their campus card.
3. On that tap: a 360ms button response, a 140ms cut to black, then an original photorealistic creature lunges into the viewport for 1.45 seconds, synchronized with filtered noise and descending tones. A short 450ms dark beat leads to “Trick or Treat” / “by CS Society” / “Computer Science Society.”
4. Replay and native sharing (with clipboard fallback).

Sound can be disabled before starting; browsers unlock it only after a visitor clicks. There is no strobing, camera access, microphone access, tracking, or personal information collection. Escape reveals the ending immediately. Leaving the tab during the sequence skips to the reveal. Visitors with reduced-motion settings go directly from the campus card button to the ending without the face or sting. The character is preloaded and decoded; if its image is not ready, the ending appears without an empty jump scare. Sound levels remain bounded and respect the phone’s volume setting.

## Files

- `index.html`: page content and reveal
- `style.css`: responsive design and motion
- `experience.css`: personality result and creature lunge
- `app.js`: questions, sequence, optional synthesized sound, replay and share
- `assets/`: local vector graphics
- `server.mjs`: development server only
- `vercel.json`: static hosting configuration

Fonts use Google Fonts with local system fallbacks. The rest of the experience is self-contained; no runtime dependencies or audio downloads.

The original character was made using the built-in image generation tool. See `assets/ART-DIRECTION.md` for its final prompt and `assets/the-quiet-one.webp` for the production image.
