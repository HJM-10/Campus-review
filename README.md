# Campus Loop

A mobile-first focus challenge with an unexpected Halloween ending, made for CS Society. The page title, social preview text, and sharing copy keep the surprise hidden.

## Run locally

Use Node.js 20 or newer. No packages to install.

```
npm run dev
```

Open http://127.0.0.1:4173. Run `npm run check` to check JavaScript syntax.

## Deploy on Vercel

Import the GitHub repository. Use the **Other** framework preset. Leave the build command empty and use `.` as the output directory. The included `vercel.json` sets these values. No environment variables or backend are needed.

After deployment, make the QR code point to the public production URL. Suggested QR poster: **“How’s your focus? Take the ten-second challenge.”** Use an innocent project name such as `campus-loop`, so the URL doesn’t reveal the prank.

## Add the society logo

The current `assets/society-mark.svg` is a temporary code symbol, not an official logo. Replace it with the supplied logo. For PNG/WebP, update the image source in `index.html` (`id="society-logo"`). The real logo appears only at the reveal.

## Experience

1. An innocent timing challenge: tap the centre when the moving ring meets the target circle. Three rounds move and slightly speed up the target. Timing feedback uses the actual ring phase; it does not require a particular score to progress.
2. After the third tap, a centre dot shrinks for 1.05 seconds while the instruction says “Stay with the dot.” There is no loader, advance blackout or horror clue.
3. The creature cuts directly into the focused task and lunges into the viewport for 1.45 seconds, synchronized with a recorded horror scream. A short 450ms dark beat leads to “Trick or Treat” / “by CS Society” / “Computer Science Society.”
4. Replay and native sharing (with clipboard fallback).

Sound can be disabled before starting; browsers unlock it only after a visitor clicks. A high-pitched female scream is preloaded and decoded during play, leading silence is skipped, and playback is faded at the end. A synthesized sting is available if the recording cannot load. Audio is hosted locally, not streamed from a third party. See `assets/AUDIO-CREDITS.md` for the CC0 recording source.

There is no strobing, camera access, microphone access, tracking, or personal information collection. Escape reveals the ending immediately. Leaving the tab during the challenge skips to the reveal. Visitors with reduced-motion settings get static target rings and go directly to the ending without the face or scream. The character is preloaded and decoded; if its image is not ready, the ending appears without an empty jump scare. Sound levels remain bounded and respect the phone’s volume setting.

## Files

- `index.html`: page content and reveal
- `style.css`: responsive design and motion
- `experience.css`: creature lunge and overlay
- `focus.css`: focus challenge and target rings
- `app.js`: timing challenge, sequence, recorded audio, fallback sound, replay and share
- `assets/`: character, audio, vector graphics and asset credits
- `server.mjs`: development server only
- `vercel.json`: static hosting configuration

Fonts use Google Fonts with local system fallbacks. The rest of the experience is self-contained; no runtime packages or external audio services.

The original character was made using the built-in image generation tool. See `assets/ART-DIRECTION.md` for its final prompt and `assets/the-quiet-one.webp` for the production image.
