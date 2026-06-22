# 24 Game

A modern, production-ready **24 Game** web application built with pure HTML, CSS, and Vanilla JavaScript. No frameworks, no libraries, no build tools — just open `index.html` and play.

## How to Play

- Four random numbers (1–9) are displayed.
- Use **all four numbers exactly once** with the operators `+`, `-`, `*`, `/`, and parentheses.
- Make the expression evaluate to **24**.
- Win points, build streaks, and unlock achievements!

## Features

- **Safe Expression Parser** — Validates and evaluates expressions without `eval()`.
- **Drag & Drop** — Drag number cards into the expression builder.
- **Keyboard Shortcuts** — Numbers, operators, Enter to submit, Backspace to undo, Space to pause.
- **Timer** — Countdown with configurable duration (30s–120s or no timer).
- **Scoring System** — Points based on difficulty, speed, streak, and no-hint bonus.
- **Streak Tracking** — Consecutive wins tracked and persisted.
- **Difficulty Levels** — Easy, Medium, Hard (affects puzzle complexity).
- **Hard Mode** — Unsolvable puzzles may appear.
- **Daily Challenge** — Same puzzle for everyone on a given day.
- **Achievements** — 10 achievements to unlock (First Win, Streaks, Speed Demon, etc.).
- **Statistics** — Track games played, win rate, best score, average time.
- **Themes** — Dark (default), Light, and Neon.
- **Sound Effects** — Generated via Web Audio API (no audio files needed).
- **Confetti Celebration** — Particle burst on solving a puzzle.
- **Particle Background** — Subtle animated particles with connections.
- **PWA Support** — Installable with manifest.json and service worker.
- **LocalStorage** — All stats, settings, and progress saved locally.
- **Responsive** — Mobile-first with full touch support.
- **Accessible** — ARIA labels, focus indicators, reduced motion support.

## Installation

Clone the repository:

```bash
git clone https://github.com/yourusername/24-game.git
cd 24-game
```

Open `index.html` in any modern browser:

```bash
open index.html
```

No build step required. Deployable on GitHub Pages by pushing to `main` branch with GitHub Pages enabled.

## File Structure

```
/
├── index.html          # Main HTML
├── style.css           # All styles
├── script.js           # Game logic
├── manifest.json       # PWA manifest
├── service-worker.js   # Service worker
└── README.md           # This file
```

## Screenshots

*(Screenshots coming soon)*

## License

MIT License — see below for details.

## Tech Stack

- **HTML5** — Semantic, accessible markup
- **CSS3** — Glassmorphism + Neumorphism, CSS Grid, Flexbox, Custom Properties, Animations
- **JavaScript ES6+** — Classes, Modules, Arrow functions, Template literals
- **Web Audio API** — Procedural sound effects
- **Canvas API** — Particle background
- **LocalStorage** — Persistent state
- **Service Worker API** — Offline caching

---

*Made with ❤️ for math puzzle enthusiasts.*
# 24game
