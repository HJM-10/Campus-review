# Campus Review

A mobile-first campus preference quiz with an unexpected Halloween ending, made for CS Society. The page title, social preview text, and sharing copy keep the surprise hidden. The hero retains “A little focus. A new rhythm.”

## Run locally

Use Node.js 20 or newer. No packages to install.

```
npm run dev
```

Open http://127.0.0.1:4173. Run `npm run check` to check JavaScript syntax.

## Deploy on Vercel

Import the GitHub repository. Use the **Other** framework preset. Leave the build command empty and use `.` as the output directory. The included `vercel.json` sets these values. No environment variables or backend are needed.

After deployment, make the QR code point to the public production URL. Suggested QR poster: **“What do you love about your campus? Three quick questions.”** Use an innocent project name such as `campus-review`, so the URL doesn’t reveal the prank.

## Add the society logo

The current `assets/society-mark.svg` is a temporary code symbol, not an official logo. Replace it with the supplied logo. For PNG/WebP, update the image source in `index.html` (`id="society-logo"`). The real logo appears only at the reveal.

## Experience

1. Three campus preference questions. The original first question asks where visitors spend time; the second asks when campus feels best; the third asks what they love most about campus.
2. The first two answers advance after a brief selection response. Any answer to the third question reveals the creature immediately in the same click handler, with no loader, result screen or scheduled delay.
3. The creature lunges into the viewport for 1.45 seconds, synchronized with a recorded female scream. A short 450ms dark beat leads to “Trick or Treat” / “by CS Society” / “Computer Science Society.”
4. Replay and native sharing (with clipboard fallback).

Sound can be disabled before starting; browsers unlock it only after a visitor clicks. A high-pitched female scream is preloaded and decoded during play, leading silence is skipped, and playback is faded at the end. A synthesized sting is available if the recording cannot load. Audio is hosted locally, not streamed from a third party. See `assets/AUDIO-CREDITS.md` for the CC0 recording source.

There is no strobing, camera access, microphone access, tracking, or personal information collection. Choices stay in the current tab. Escape reveals the ending immediately during the scare. Leaving the tab during the scare skips to the reveal. Visitors with reduced-motion settings go directly to the ending without the face or scream. The character is preloaded and decoded; if its image is not ready, the ending appears without an empty jump scare. Sound levels remain bounded and respect the phone’s volume setting.

## Files

- `index.html`: page content and reveal
- `style.css`: responsive design and motion
- `experience.css`: creature lunge and overlay
- `quiz.css`: responsive question card refinements
- `app.js`: three questions, immediate scare, recorded audio, fallback sound, replay and share
- `assets/`: character, audio, vector graphics and asset credits
- `server.mjs`: development server only
- `vercel.json`: static hosting configuration

Fonts use Google Fonts with local system fallbacks. The rest of the experience is self-contained; no runtime packages or external audio services.

The original character was made using the built-in image generation tool. See `assets/ART-DIRECTION.md` for its final prompt and `assets/the-quiet-one.webp` for the production image.
