/*
 * 24 Game - Full Game Logic
 * Pure vanilla JavaScript, no dependencies
 * All sounds generated via Web Audio API (no audio files needed)
 */

// ============================================================
// Math Expression Parser - Safe alternative to eval()
// ============================================================
class ExpressionParser {
    constructor(numbers) {
        this.allowedNumbers = numbers.slice().sort();
    }

    parse(expr) {
        const tokens = this.tokenize(expr);
        if (!tokens) return { valid: false, error: 'Invalid expression' };

        if (!this.validateTokens(tokens)) return { valid: false, error: 'Invalid characters or numbers' };

        if (!this.validateBrackets(tokens)) return { valid: false, error: 'Unbalanced parentheses' };

        if (!this.validateNumberUsage(tokens)) return { valid: false, error: 'Use each number exactly once' };

        if (!this.validateOperators(tokens)) return { valid: false, error: 'Invalid operator sequence' };

        const postfix = this.shuntingYard(tokens);
        if (!postfix) return { valid: false, error: 'Invalid expression format' };

        const result = this.evaluatePostfix(postfix);
        if (result === null || result === undefined || !isFinite(result)) {
            return { valid: false, error: 'Error in calculation' };
        }

        return { valid: true, result: Math.round(result * 1e10) / 1e10, tokens, postfix };
    }

    tokenize(expr) {
        const tokens = [];
        let i = 0;
        while (i < expr.length) {
            const ch = expr[i];
            if (/\s/.test(ch)) { i++; continue; }

            if (/[0-9]/.test(ch)) {
                let num = '';
                while (i < expr.length && /[0-9]/.test(expr[i])) {
                    num += expr[i++];
                }
                tokens.push({ type: 'num', value: parseInt(num, 10) });
                continue;
            }

            if ('+-*/'.includes(ch)) {
                tokens.push({ type: 'op', value: ch });
                i++;
                continue;
            }

            if (ch === '(' || ch === ')') {
                tokens.push({ type: 'paren', value: ch });
                i++;
                continue;
            }

            return null;
        }
        return tokens;
    }

    validateTokens(tokens) {
        return tokens.every(t => {
            if (t.type === 'num') {
                return Number.isInteger(t.value) && t.value >= 1 && t.value <= 9;
            }
            return true;
        });
    }

    validateBrackets(tokens) {
        let depth = 0;
        for (const t of tokens) {
            if (t.type === 'paren' && t.value === '(') depth++;
            if (t.type === 'paren' && t.value === ')') depth--;
            if (depth < 0) return false;
        }
        return depth === 0;
    }

    validateNumberUsage(tokens) {
        const used = tokens.filter(t => t.type === 'num').map(t => t.value);
        if (used.length !== 4) return false;

        const sorted = used.slice().sort();
        return sorted.every((v, i) => v === this.allowedNumbers[i]);
    }

    validateOperators(tokens) {
        if (tokens.length === 0) return false;

        for (let i = 0; i < tokens.length; i++) {
            if (tokens[i].type === 'op') {
                if (i === 0 && tokens[i].value === '-') continue;
                if (i === 0) return false;
                if (tokens[i-1].type === 'op') return false;
                if (i === tokens.length - 1) return false;
            }
            if (tokens[i].type === 'paren' && tokens[i].value === '(') {
                if (i > 0 && tokens[i-1].type === 'num') return false;
            }
            if (tokens[i].type === 'paren' && tokens[i].value === ')') {
                if (i < tokens.length - 1 && tokens[i+1].type === 'num') return false;
            }
        }
        return true;
    }

    shuntingYard(tokens) {
        const output = [];
        const ops = [];
        const precedence = { '+': 2, '-': 2, '*': 3, '/': 3 };

        for (let i = 0; i < tokens.length; i++) {
            const t = tokens[i];

            if (t.type === 'num') {
                output.push(t);
                continue;
            }

            if (t.type === 'op') {
                if (t.value === '-' && (i === 0 || tokens[i-1].type === 'op' || (tokens[i-1].type === 'paren' && tokens[i-1].value === '('))) {
                    const next = i + 1 < tokens.length ? tokens[i + 1] : null;
                    if (next && next.type === 'num') {
                        output.push({ type: 'num', value: -next.value });
                        i++;
                        continue;
                    }
                    return null;
                }

                while (ops.length > 0 && ops[ops.length - 1].type === 'op' &&
                       precedence[ops[ops.length - 1].value] >= precedence[t.value]) {
                    output.push(ops.pop());
                }
                ops.push(t);
                continue;
            }

            if (t.type === 'paren') {
                if (t.value === '(') {
                    ops.push(t);
                } else {
                    while (ops.length > 0 && !(ops[ops.length - 1].type === 'paren' && ops[ops.length - 1].value === '(')) {
                        output.push(ops.pop());
                    }
                    if (ops.length === 0) return null;
                    ops.pop();
                }
            }
        }

        while (ops.length > 0) {
            if (ops[ops.length - 1].type === 'paren') return null;
            output.push(ops.pop());
        }

        return output;
    }

    evaluatePostfix(postfix) {
        const stack = [];
        for (const t of postfix) {
            if (t.type === 'num') {
                stack.push(t.value);
            } else if (t.type === 'op') {
                if (stack.length < 2) return null;
                const b = stack.pop();
                const a = stack.pop();
                switch (t.value) {
                    case '+': stack.push(a + b); break;
                    case '-': stack.push(a - b); break;
                    case '*': stack.push(a * b); break;
                    case '/':
                        if (b === 0) return null;
                        stack.push(a / b);
                        break;
                }
            }
        }
        return stack.length === 1 ? stack[0] : null;
    }

    static hint(numbers) {
        const operators = ['+', '-', '*', '/'];
        const permutations = this.getPermutations(numbers);
        const opCombos = this.getOperatorCombos(4);

        for (const nums of permutations) {
            for (const ops of opCombos) {
                const expressions = this.generateExpressions(nums, ops);
                for (const expr of expressions) {
                    const parser = new ExpressionParser(numbers);
                    const result = parser.parse(expr);
                    if (result.valid && Math.abs(result.result - 24) < 0.0001) {
                        return expr;
                    }
                }
            }
        }
        return null;
    }

    static getPermutations(arr) {
        if (arr.length <= 1) return [arr];
        const result = [];
        for (let i = 0; i < arr.length; i++) {
            const rest = arr.slice(0, i).concat(arr.slice(i + 1));
            const perms = this.getPermutations(rest);
            for (const p of perms) {
                result.push([arr[i], ...p]);
            }
        }
        return result;
    }

    static getOperatorCombos(len) {
        const ops = ['+', '-', '*', '/'];
        const result = [];
        const generate = (current) => {
            if (current.length === len - 1) {
                result.push([...current]);
                return;
            }
            for (const op of ops) {
                generate([...current, op]);
            }
        };
        generate([]);
        return result;
    }

    static generateExpressions(nums, ops) {
        const [a, b, c, d] = nums;
        const [o1, o2, o3] = ops;
        return [
            `(${a}${o1}${b})${o2}(${c}${o3}${d})`,
            `((${a}${o1}${b})${o2}${c})${o3}${d}`,
            `(${a}${o1}(${b}${o2}${c}))${o3}${d}`,
            `${a}${o1}((${b}${o2}${c})${o3}${d})`,
            `${a}${o1}(${b}${o2}(${c}${o3}${d}))`,
        ];
    }

    static isSolvable(numbers) {
        return this.hint(numbers) !== null;
    }
}


// ============================================================
// Sound Engine - Web Audio API (no files needed)
// ============================================================
class SoundEngine {
    constructor() {
        this.ctx = null;
        this.enabled = true;
    }

    init() {
        if (!this.ctx) {
            try {
                this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            } catch {
                this.enabled = false;
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggle(on) {
        this.enabled = on;
    }

    play(type) {
        if (!this.enabled || !this.ctx) return;
        this.init();
        try {
            const methods = {
                click: () => this._tone(800, 0.05, 'sine', 0.3),
                success: () => { this._tone(523, 0.1, 'sine', 0.4); setTimeout(() => this._tone(659, 0.1, 'sine', 0.4), 100); setTimeout(() => this._tone(784, 0.15, 'sine', 0.4), 200); },
                error: () => { this._tone(200, 0.15, 'sawtooth', 0.3); setTimeout(() => this._tone(160, 0.2, 'sawtooth', 0.3), 150); },
                win: () => {
                    [523, 587, 659, 784, 880, 1047].forEach((f, i) => {
                        setTimeout(() => this._tone(f, 0.12, 'sine', 0.4), i * 80);
                    });
                },
                hint: () => this._tone(440, 0.08, 'triangle', 0.3),
                tick: () => this._tone(1000, 0.03, 'sine', 0.15),
                achievement: () => {
                    [659, 784, 988, 1175].forEach((f, i) => {
                        setTimeout(() => this._tone(f, 0.15, 'sine', 0.4), i * 120);
                    });
                },
            };
            if (methods[type]) methods[type]();
        } catch { /* ignore audio errors */ }
    }

    _tone(freq, duration, type, volume) {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + duration);
    }
}


// ============================================================
// Particle Background
// ============================================================
class ParticleBackground {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.enabled = true;
        this.animId = null;
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        if (!this.canvas) return;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    toggle(on) {
        this.enabled = on;
        if (on && !this.animId) this.start();
        if (!on && this.animId) {
            cancelAnimationFrame(this.animId);
            this.animId = null;
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    start() {
        if (!this.canvas || !this.enabled) return;
        const count = Math.min(Math.floor(window.innerWidth * 0.05), 40);
        this.particles = Array.from({ length: count }, () => ({
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            r: Math.random() * 2 + 1,
            o: Math.random() * 0.4 + 0.1,
        }));
        this._animate();
    }

    _animate() {
        if (!this.canvas || !this.enabled) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const theme = document.documentElement.getAttribute('data-theme') || 'dark';
        const color = theme === 'light' ? '100, 100, 200' : '255, 255, 255';

        for (const p of this.particles) {
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0) p.x = this.canvas.width;
            if (p.x > this.canvas.width) p.x = 0;
            if (p.y < 0) p.y = this.canvas.height;
            if (p.y > this.canvas.height) p.y = 0;

            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(${color}, ${p.o})`;
            this.ctx.fill();
        }

        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const dx = this.particles[i].x - this.particles[j].x;
                const dy = this.particles[i].y - this.particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 120) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
                    this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
                    this.ctx.strokeStyle = `rgba(${color}, ${0.08 * (1 - dist / 120)})`;
                    this.ctx.stroke();
                }
            }
        }

        this.animId = requestAnimationFrame(() => this._animate());
    }
}


// ============================================================
// Confetti Effect
// ============================================================
class ConfettiEffect {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.enabled = true;
    }

    toggle(on) {
        this.enabled = on;
    }

    burst(count = 60) {
        if (!this.enabled || !this.container) return;
        const colors = ['#6c5ce7', '#00cec9', '#fd79a8', '#fdcb6e', '#00b894', '#e17055', '#ff00ff', '#00ffff'];

        for (let i = 0; i < count; i++) {
            const piece = document.createElement('div');
            piece.className = 'confetti-piece';
            const size = Math.random() * 8 + 4;
            piece.style.width = size + 'px';
            piece.style.height = size * (Math.random() * 0.5 + 0.5) + 'px';
            piece.style.left = Math.random() * 100 + '%';
            piece.style.background = colors[Math.floor(Math.random() * colors.length)];
            piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
            piece.style.animationDuration = (Math.random() * 2 + 1.5) + 's';
            piece.style.animationDelay = (Math.random() * 0.5) + 's';
            piece.style.transform = `rotate(${Math.random() * 360}deg)`;
            this.container.appendChild(piece);

            setTimeout(() => piece.remove(), 3000);
        }
    }
}


// ============================================================
// Achievement System
// ============================================================
class AchievementSystem {
    constructor() {
        this.achievements = {
            firstWin:    { name: 'First Victory',      desc: 'Solve your first puzzle',          icon: '🏆', unlocked: false },
            streak3:     { name: 'On Fire',            desc: 'Win 3 games in a row',              icon: '🔥', unlocked: false },
            streak5:     { name: 'Unstoppable',        desc: 'Win 5 games in a row',              icon: '💪', unlocked: false },
            streak10:    { name: 'Legendary Streak',    desc: 'Win 10 games in a row',             icon: '⭐', unlocked: false },
            speedDemon:  { name: 'Speed Demon',        desc: 'Solve in under 10 seconds',         icon: '⚡', unlocked: false },
            perfect10:   { name: 'Ten Club',           desc: 'Win 10 total games',                icon: '🎯', unlocked: false },
            fiftyGames:  { name: 'Dedicated',          desc: 'Play 50 games',                     icon: '🎮', unlocked: false },
            hardMode:    { name: 'Hard Mode Hero',     desc: 'Win in Hard difficulty',             icon: '🛡️', unlocked: false },
            noHint:      { name: 'Pure Genius',        desc: 'Win 3 games without hints',          icon: '🧠', unlocked: false },
            dailyStreak: { name: 'Daily Grind',        desc: 'Complete 3 daily challenges',        icon: '📅', unlocked: false },
        };
        this.load();
    }

    load() {
        try {
            const data = JSON.parse(localStorage.getItem('game24_achievements'));
            if (data) {
                for (const key of Object.keys(this.achievements)) {
                    if (data[key] !== undefined) {
                        this.achievements[key].unlocked = data[key];
                    }
                }
            }
        } catch { /* ignore */ }
    }

    save() {
        const data = {};
        for (const [key, ach] of Object.entries(this.achievements)) {
            data[key] = ach.unlocked;
        }
        try {
            localStorage.setItem('game24_achievements', JSON.stringify(data));
        } catch { /* ignore */ }
    }

    check(condition, value) {
        const unlocked = [];
        switch (condition) {
            case 'win':
                if (!this.achievements.firstWin.unlocked) {
                    this.achievements.firstWin.unlocked = true;
                    unlocked.push(this.achievements.firstWin);
                }
                break;
            case 'streak':
                if (value >= 3 && !this.achievements.streak3.unlocked) {
                    this.achievements.streak3.unlocked = true;
                    unlocked.push(this.achievements.streak3);
                }
                if (value >= 5 && !this.achievements.streak5.unlocked) {
                    this.achievements.streak5.unlocked = true;
                    unlocked.push(this.achievements.streak5);
                }
                if (value >= 10 && !this.achievements.streak10.unlocked) {
                    this.achievements.streak10.unlocked = true;
                    unlocked.push(this.achievements.streak10);
                }
                break;
            case 'speed':
                if (value <= 10 && !this.achievements.speedDemon.unlocked) {
                    this.achievements.speedDemon.unlocked = true;
                    unlocked.push(this.achievements.speedDemon);
                }
                break;
            case 'totalWins':
                if (value >= 10 && !this.achievements.perfect10.unlocked) {
                    this.achievements.perfect10.unlocked = true;
                    unlocked.push(this.achievements.perfect10);
                }
                break;
            case 'gamesPlayed':
                if (value >= 50 && !this.achievements.fiftyGames.unlocked) {
                    this.achievements.fiftyGames.unlocked = true;
                    unlocked.push(this.achievements.fiftyGames);
                }
                break;
            case 'hardWin':
                if (!this.achievements.hardMode.unlocked) {
                    this.achievements.hardMode.unlocked = true;
                    unlocked.push(this.achievements.hardMode);
                }
                break;
            case 'noHint':
                if (value >= 3 && !this.achievements.noHint.unlocked) {
                    this.achievements.noHint.unlocked = true;
                    unlocked.push(this.achievements.noHint);
                }
                break;
            case 'daily':
                if (value >= 3 && !this.achievements.dailyStreak.unlocked) {
                    this.achievements.dailyStreak.unlocked = true;
                    unlocked.push(this.achievements.dailyStreak);
                }
                break;
        }
        if (unlocked.length > 0) this.save();
        return unlocked;
    }
}


// ============================================================
// Statistics Manager
// ============================================================
class StatisticsManager {
    constructor() {
        this.data = {
            gamesPlayed: 0,
            gamesWon: 0,
            bestScore: 0,
            bestStreak: 0,
            totalTime: 0,
            hintsUsed: 0,
            noHintWins: 0,
            dailyCompletions: 0,
        };
        this.load();
    }

    load() {
        try {
            const saved = JSON.parse(localStorage.getItem('game24_stats'));
            if (saved) Object.assign(this.data, saved);
        } catch { /* ignore */ }
    }

    save() {
        try {
            localStorage.setItem('game24_stats', JSON.stringify(this.data));
        } catch { /* ignore */ }
    }

    recordGame(won, score, time, hints, difficulty) {
        this.data.gamesPlayed++;
        if (won) {
            this.data.gamesWon++;
            this.data.totalTime += time;
            if (score > this.data.bestScore) this.data.bestScore = score;
            if (hints === 0) this.data.noHintWins++;
        }
        this.save();
    }

    recordStreak(streak) {
        if (streak > this.data.bestStreak) {
            this.data.bestStreak = streak;
            this.save();
        }
    }

    recordDaily() {
        this.data.dailyCompletions++;
        this.save();
    }

    getWinRate() {
        if (this.data.gamesPlayed === 0) return 0;
        return Math.round((this.data.gamesWon / this.data.gamesPlayed) * 100);
    }

    getAvgTime() {
        if (this.data.gamesWon === 0) return 0;
        return Math.round(this.data.totalTime / this.data.gamesWon);
    }
}


// ============================================================
// Settings Manager
// ============================================================
class SettingsManager {
    constructor() {
        this.settings = {
            timerDuration: 60,
            theme: 'dark',
            sound: true,
            particles: true,
            confetti: true,
            hardMode: false,
        };
        this.load();
        this.apply();
    }

    load() {
        try {
            const saved = JSON.parse(localStorage.getItem('game24_settings'));
            if (saved) Object.assign(this.settings, saved);
        } catch { /* ignore */ }
    }

    save() {
        try {
            localStorage.setItem('game24_settings', JSON.stringify(this.settings));
        } catch { /* ignore */ }
    }

    get(key) {
        return this.settings[key];
    }

    set(key, value) {
        this.settings[key] = value;
        this.save();
        this.apply();
    }

    apply() {
        document.documentElement.setAttribute('data-theme', this.settings.theme);
    }
}


// ============================================================
// Daily Challenge
// ============================================================
class DailyChallenge {
    constructor() {
        this.seed = this._getSeed();
    }

    _getSeed() {
        const now = new Date();
        return `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
    }

    _seededRandom(seed) {
        let h = 0;
        for (let i = 0; i < seed.length; i++) {
            h = ((h << 5) - h) + seed.charCodeAt(i);
            h |= 0;
        }
        return () => {
            h = (h * 9301 + 49297) % 233280;
            return h / 233280;
        };
    }

    _generateNumbers(seed) {
        const rng = this._seededRandom(seed);
        let nums;
        let attempts = 0;
        do {
            nums = Array.from({ length: 4 }, () => Math.floor(rng() * 9) + 1);
            attempts++;
        } while (!ExpressionParser.isSolvable(nums) && attempts < 100);

        if (!ExpressionParser.isSolvable(nums)) {
            nums = [1, 2, 3, 4];
        }

        return nums;
    }

    getPuzzle() {
        const seed = this._getSeed();
        const nums = this._generateNumbers(seed);
        return { numbers: nums, date: seed };
    }

    isCompleted() {
        try {
            const data = JSON.parse(localStorage.getItem('game24_daily'));
            return data && data.date === this._getSeed();
        } catch {
            return false;
        }
    }

    markCompleted(puzzle, time, score) {
        try {
            localStorage.setItem('game24_daily', JSON.stringify({
                date: this._getSeed(),
                puzzle: puzzle.numbers,
                time,
                score,
            }));
        } catch { /* ignore */ }
    }
}


// ============================================================
// Main Game Application
// ============================================================
class Game24 {
    constructor() {
        this.sound = new SoundEngine();
        this.particles = new ParticleBackground('particle-canvas');
        this.confetti = new ConfettiEffect('confettiContainer');
        this.achievements = new AchievementSystem();
        this.stats = new StatisticsManager();
        this.settings = new SettingsManager();
        this.daily = new DailyChallenge();

        this.numbers = [];
        this.expression = [];
        this.score = 0;
        this.streak = 0;
        this.hintsUsed = 0;
        this.difficulty = 'easy';
        this.timer = 0;
        this.timerInterval = null;
        this.isPaused = false;
        this.isPlaying = false;
        this.solved = false;
        this.currentPuzzle = null;
        this.gameMode = 'normal';
        this.noHintStreak = 0;

        this.dom = {};
        this._cacheDOM();
        this._bindEvents();
        this._initSettings();
        this._startParticles();

        this.newGame();

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('service-worker.js').catch(() => {});
        }
    }

    _cacheDOM() {
        const ids = ['numbersContainer', 'expressionDisplay', 'expressionPreview',
                     'scoreDisplay', 'timerDisplay', 'streakDisplay', 'bestDisplay',
                     'resultDisplay', 'submitBtn', 'hintBtn', 'newGameBtn',
                     'clearBtn', 'backspaceBtn', 'pauseBtn', 'statsBtn', 'settingsBtn',
                     'modalOverlay', 'statsModal', 'settingsModal', 'dailyModal',
                     'statsModalClose', 'settingsModalClose', 'dailyModalClose',
                     'toastContainer', 'achievementToast', 'achievementName',
                     'confettiContainer', 'dailyNumbers', 'dailyStatus',
                     'statGamesPlayed', 'statGamesWon', 'statWinRate',
                     'statBestScore', 'statLongestStreak', 'statAvgTime',
                     'achievementsList', 'timerDuration', 'themeSelect',
                     'soundToggle', 'particleToggle', 'confettiToggle', 'hardMode'];
        for (const id of ids) {
            this.dom[id] = document.getElementById(id);
        }
    }

    _bindEvents() {
        document.querySelectorAll('.op-btn[data-op]').forEach(btn => {
            btn.addEventListener('click', () => {
                this._addToExpression(btn.dataset.op);
                this.sound.play('click');
            });
        });

        this.dom.submitBtn.addEventListener('click', () => this._checkAnswer());
        this.dom.hintBtn.addEventListener('click', () => this._showHint());
        this.dom.newGameBtn.addEventListener('click', () => this.newGame());
        this.dom.clearBtn.addEventListener('click', () => this._clearExpression());
        this.dom.backspaceBtn.addEventListener('click', () => this._backspace());

        this.dom.pauseBtn.addEventListener('click', () => this._togglePause());
        this.dom.statsBtn.addEventListener('click', () => this._showStats());
        this.dom.settingsBtn.addEventListener('click', () => this._showSettings());
        if (this.dom.dailyBtn) this.dom.dailyBtn.addEventListener('click', () => this._showDaily());
        if (this.dom.helpBtn) this.dom.helpBtn.addEventListener('click', () => this._showHelp());

        document.querySelectorAll('.modal-close, .modal-overlay').forEach(el => {
            el.addEventListener('click', (e) => {
                if (e.target === el || el.classList.contains('modal-close')) {
                    this._closeModals();
                }
            });
        });

        document.querySelectorAll('.diff-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.difficulty = btn.dataset.diff;
                this.newGame();
            });
        });

        this.dom.timerDuration.addEventListener('change', () => {
            this.settings.set('timerDuration', parseInt(this.dom.timerDuration.value));
            this.newGame();
        });

        this.dom.themeSelect.addEventListener('change', () => {
            this.settings.set('theme', this.dom.themeSelect.value);
            this._updateThemeUI();
        });

        this.dom.soundToggle.addEventListener('change', () => {
            this.settings.set('sound', this.dom.soundToggle.checked);
            this.sound.toggle(this.dom.soundToggle.checked);
        });

        this.dom.particleToggle.addEventListener('change', () => {
            this.settings.set('particles', this.dom.particleToggle.checked);
            this.particles.toggle(this.dom.particleToggle.checked);
        });

        this.dom.confettiToggle.addEventListener('change', () => {
            this.settings.set('confetti', this.dom.confettiToggle.checked);
            this.confetti.toggle(this.dom.confettiToggle.checked);
        });

        this.dom.hardMode.addEventListener('change', () => {
            this.settings.set('hardMode', this.dom.hardMode.checked);
            this.newGame();
        });

        document.addEventListener('keydown', (e) => this._handleKeyboard(e));

        this.dom.numbersContainer.addEventListener('dragstart', (e) => this._handleDragStart(e));
        this.dom.numbersContainer.addEventListener('dragend', (e) => this._handleDragEnd(e));
        this.dom.numbersContainer.addEventListener('touchstart', (e) => this._handleTouchStart(e), { passive: true });
        this.dom.numbersContainer.addEventListener('touchend', (e) => this._handleTouchEnd(e));
        this.dom.numbersContainer.addEventListener('click', (e) => {
            const card = e.target.closest('.number-card');
            if (card && !card.classList.contains('used')) {
                this._addToExpression(card.dataset.value);
                this.sound.play('click');
            }
        });

        this.dom.expressionDisplay.addEventListener('dragover', (e) => e.preventDefault());
        this.dom.expressionDisplay.addEventListener('drop', (e) => this._handleDrop(e));

        this.dom.expressionDisplay.addEventListener('click', () => {
            if (this.solved) return;
        });
    }

    _initSettings() {
        this.sound.toggle(this.settings.get('sound'));
        this.sound.init();
        this.dom.soundToggle.checked = this.settings.get('sound');
        this.dom.particleToggle.checked = this.settings.get('particles');
        this.dom.confettiToggle.checked = this.settings.get('confetti');
        this.dom.hardMode.checked = this.settings.get('hardMode');
        this.dom.timerDuration.value = this.settings.get('timerDuration');
        this.dom.themeSelect.value = this.settings.get('theme');
        this._updateThemeUI();
    }

    _updateThemeUI() {
    }

    _startParticles() {
        if (this.settings.get('particles')) {
            this.particles.start();
        }
    }

    newGame() {
        this._stopTimer();
        this.isPlaying = false;
        this.isPaused = false;
        this.solved = false;
        this.expression = [];
        this.hintsUsed = 0;
        this.currentPuzzle = null;

        this._generateNumbers();
        this._renderNumbers();
        this._updateExpression();
        this.dom.resultDisplay.textContent = '';
        this.dom.resultDisplay.className = 'result-display';
        this.dom.submitBtn.disabled = false;
        this.dom.expressionPreview.textContent = '';

        const timerVal = this.settings.get('timerDuration');
        if (timerVal > 0) {
            this.timer = timerVal;
            this._startTimer();
        } else {
            this.timer = 0;
            this.dom.timerDisplay.textContent = '∞';
        }

        this._updateScoreUI();
    }

    _generateNumbers() {
        let nums;
        let attempts = 0;
        const hardMode = this.settings.get('hardMode');

        do {
            nums = Array.from({ length: 4 }, () => Math.floor(Math.random() * 9) + 1);
            attempts++;

            if (this.difficulty === 'easy' && attempts < 50) {
                if (!ExpressionParser.isSolvable(nums)) continue;
            }
            if (this.difficulty === 'medium' && attempts < 100) {
                if (!ExpressionParser.isSolvable(nums)) continue;
            }
            if (this.difficulty === 'hard' && attempts < 200) {
                if (!ExpressionParser.isSolvable(nums)) continue;
            }

            if (hardMode && ExpressionParser.isSolvable(nums)) continue;
            if (!hardMode && !ExpressionParser.isSolvable(nums)) continue;

        } while (false);

        if (hardMode && ExpressionParser.isSolvable(nums)) {
            nums = this._findUnsolvable();
        }

        if (!ExpressionParser.isSolvable(nums)) {
            if (!hardMode) {
                nums = this._findSolvable();
            }
        }

        this.numbers = nums;
        this._storeOriginalNumbers = [...nums];
    }

    _findSolvable() {
        for (let a = 1; a <= 9; a++) {
            for (let b = 1; b <= 9; b++) {
                for (let c = 1; c <= 9; c++) {
                    for (let d = 1; d <= 9; d++) {
                        const test = [a, b, c, d];
                        if (ExpressionParser.isSolvable(test)) return test;
                    }
                }
            }
        }
        return [1, 2, 3, 4];
    }

    _findUnsolvable() {
        for (let a = 1; a <= 9; a++) {
            for (let b = 1; b <= 9; b++) {
                for (let c = 1; c <= 9; c++) {
                    for (let d = 1; d <= 9; d++) {
                        const test = [a, b, c, d];
                        if (!ExpressionParser.isSolvable(test)) return test;
                    }
                }
            }
        }
        return [1, 1, 1, 1];
    }

    _renderNumbers() {
        this.dom.numbersContainer.innerHTML = '';
        this.numbers.forEach((num, i) => {
            const card = document.createElement('div');
            card.className = 'number-card';
            card.draggable = true;
            card.dataset.value = num;
            card.dataset.index = i;
            card.textContent = num;
            const idx = document.createElement('span');
            idx.className = 'card-index';
            idx.textContent = i + 1;
            card.appendChild(idx);
            this.dom.numbersContainer.appendChild(card);
        });
    }

    _addToExpression(token) {
        if (this.solved || this.isPaused) return;

        if (/^[0-9]$/.test(token)) {
            const num = parseInt(token);
            const cards = this.dom.numbersContainer.querySelectorAll('.number-card');
            let available = -1;
            for (const card of cards) {
                if (!card.classList.contains('used') && parseInt(card.dataset.value) === num) {
                    available = parseInt(card.dataset.index);
                    break;
                }
            }
            if (available === -1) return;
            cards[available].classList.add('used');
            this.expression.push({ type: 'num', value: num, index: available });
        } else {
            this.expression.push({ type: token });
        }

        this._updateExpression();
        this.sound.play('click');
    }

    _updateExpression() {
        if (this.expression.length === 0) {
            this.dom.expressionDisplay.innerHTML = '<span class="placeholder">Click or drag numbers to build expression</span>';
            return;
        }

        let html = '';
        for (const t of this.expression) {
            let cls = 'expr-token';
            if (t.type === 'num') cls += ' num';
            else if (t.type === '+' || t.type === '-' || t.type === '*' || t.type === '/') cls += ' op';
            else cls += ' paren';
            const display = t.type === 'num' ? t.value : t.type;
            html += `<span class="${cls}">${display}</span>`;
        }
        this.dom.expressionDisplay.innerHTML = html;
        this._updatePreview();
    }

    _updatePreview() {
        const expr = this.expression.map(t => t.type === 'num' ? t.value : t.type).join(' ');
        if (expr.length === 0) {
            this.dom.expressionPreview.textContent = '';
            return;
        }

        const parser = new ExpressionParser(this.numbers);
        const result = parser.parse(expr);
        if (result.valid) {
            this.dom.expressionPreview.textContent = `= ${result.result}`;
            this.dom.expressionPreview.style.color = 'var(--accent-2)';
        } else {
            this.dom.expressionPreview.textContent = '';
        }
    }

    _clearExpression() {
        this._restoreNumbers();
        this.expression = [];
        this._updateExpression();
        this.sound.play('click');
    }

    _backspace() {
        if (this.expression.length === 0) return;
        const last = this.expression.pop();
        if (last.type === 'num') {
            const cards = this.dom.numbersContainer.querySelectorAll('.number-card');
            for (const card of cards) {
                if (parseInt(card.dataset.index) === last.index) {
                    card.classList.remove('used');
                    break;
                }
            }
        }
        this._updateExpression();
        this.sound.play('click');
    }

    _restoreNumbers() {
        this.dom.numbersContainer.querySelectorAll('.number-card').forEach(c => c.classList.remove('used'));
    }

    _checkAnswer() {
        if (this.solved || this.isPaused) return;

        const exprStr = this.expression.map(t => t.type === 'num' ? t.value : t.type).join('');
        if (exprStr.length === 0) {
            this._showResult('Build an expression first!', 'info');
            return;
        }

        const parser = new ExpressionParser(this.numbers);
        const result = parser.parse(exprStr);

        if (!result.valid) {
            this._showResult(result.error, 'error');
            this.sound.play('error');
            this._shake();
            return;
        }

        if (Math.abs(result.result - 24) < 0.0001) {
            this._onWin(result);
        } else {
            this._showResult(`Result is ${result.result}, not 24. Try again!`, 'error');
            this.sound.play('error');
            this._shake();
        }
    }

    _onWin(result) {
        this.solved = true;
        this.isPlaying = false;
        this._stopTimer();
        this.sound.play('win');
        this._showResult('Correct! You made 24! 🎉', 'success');

        this.dom.submitBtn.disabled = true;

        const timeTaken = this.settings.get('timerDuration') > 0
            ? this.settings.get('timerDuration') - this.timer
            : 0;

        const points = this._calculateScore(timeTaken);
        this.score += points;

        if (this.hintsUsed === 0) {
            this.noHintStreak++;
        } else {
            this.noHintStreak = 0;
        }

        this.streak++;
        if (this.streak > parseInt(localStorage.getItem('game24_bestStreak') || '0')) {
            localStorage.setItem('game24_bestStreak', this.streak.toString());
        }

        if (this.score > parseInt(localStorage.getItem('game24_bestScore') || '0')) {
            localStorage.setItem('game24_bestScore', this.score.toString());
        }

        this.stats.recordGame(true, this.score, timeTaken, this.hintsUsed, this.difficulty);
        this.stats.recordStreak(this.streak);
        this._updateScoreUI();

        this.confetti.burst(80);
        document.querySelector('.game-area').classList.add('celebrate');
        setTimeout(() => document.querySelector('.game-area').classList.remove('celebrate'), 600);

        const newAchievements = this.achievements.check('win');
        newAchievements.push(...this.achievements.check('streak', this.streak));
        newAchievements.push(...this.achievements.check('speed', timeTaken));
        newAchievements.push(...this.achievements.check('totalWins', this.stats.data.gamesWon));
        newAchievements.push(...this.achievements.check('noHint', this.noHintStreak));
        if (this.difficulty === 'hard') {
            newAchievements.push(...this.achievements.check('hardWin'));
        }

        if (this.gameMode === 'daily') {
            this.daily.markCompleted(this.currentPuzzle, timeTaken, this.score);
            this.stats.recordDaily();
            newAchievements.push(...this.achievements.check('daily', this.stats.data.dailyCompletions));
        }

        newAchievements.forEach(ach => this._showAchievement(ach));

        const bonus = this.hintsUsed === 0 ? ` +${Math.round(points * 0.3)} no-hint bonus!` : '';
        this._toast(`+${points} points${bonus}`, 'success');
    }

    _calculateScore(timeTaken) {
        const base = { easy: 100, medium: 200, hard: 400 }[this.difficulty] || 100;
        const timeBonus = Math.max(0, Math.floor((60 - timeTaken) * 2));
        const streakBonus = Math.min(this.streak * 20, 200);
        const noHintBonus = this.hintsUsed === 0 ? Math.round(base * 0.3) : 0;
        return base + timeBonus + streakBonus + noHintBonus;
    }

    _showHint() {
        if (this.solved || this.isPaused) return;
        this.hintsUsed++;

        const hintExpr = ExpressionParser.hint(this.numbers);
        if (hintExpr) {
            this._showResult(`Hint: Try something like ${hintExpr}`, 'info');
            this.sound.play('hint');
        } else {
            if (this.settings.get('hardMode')) {
                this._showResult('This puzzle may be unsolvable! That is Hard Mode!', 'info');
            } else {
                this._showResult('No hint available for this puzzle', 'info');
            }
        }
    }

    _togglePause() {
        if (!this.isPlaying && !this.isPaused) return;
        if (this.solved) return;

        this.isPaused = !this.isPaused;
        if (this.isPaused) {
            this._stopTimer();
            this._showResult('PAUSED', 'info');
            this.dom.pauseBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
        } else {
            if (this.settings.get('timerDuration') > 0) {
                this._startTimer();
            }
            this.dom.resultDisplay.textContent = '';
            this.dom.resultDisplay.className = 'result-display';
            this.dom.pauseBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`;
        }
    }

    _startTimer() {
        this.isPlaying = true;
        this.isPaused = false;
        this._updateTimerDisplay();
        this.timerInterval = setInterval(() => {
            if (this.isPaused) return;
            this.timer--;
            this._updateTimerDisplay();
            if (this.timer <= 5 && this.timer > 0) {
                this.sound.play('tick');
            }
            if (this.timer <= 0) {
                this._timeUp();
            }
        }, 1000);
    }

    _stopTimer() {
        this.isPlaying = false;
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    _updateTimerDisplay() {
        this.dom.timerDisplay.textContent = this.timer;
        this.dom.timerDisplay.className = 'score-value timer-value';
        if (this.timer <= 5) {
            this.dom.timerDisplay.classList.add('danger');
        } else if (this.timer <= 15) {
            this.dom.timerDisplay.classList.add('warning');
        }
    }

    _timeUp() {
        this._stopTimer();
        this.isPlaying = false;
        this._showResult('Time is up!', 'error');
        this.sound.play('error');
        this.dom.submitBtn.disabled = true;

        this.stats.recordGame(false, 0, this.settings.get('timerDuration'), this.hintsUsed, this.difficulty);
        this.streak = 0;
        this._updateScoreUI();

        const gp = this.stats.data.gamesPlayed;
        this.achievements.check('gamesPlayed', gp);

        setTimeout(() => this.newGame(), 2000);
    }

    _showResult(msg, type) {
        this.dom.resultDisplay.textContent = msg;
        this.dom.resultDisplay.className = `result-display ${type}`;
    }

    _shake() {
        const area = document.querySelector('.game-area');
        area.classList.remove('shake');
        void area.offsetWidth;
        area.classList.add('shake');
        setTimeout(() => area.classList.remove('shake'), 500);
    }

    _updateScoreUI() {
        this.dom.scoreDisplay.textContent = this.score;
        this.dom.streakDisplay.textContent = this.streak;
        this.dom.bestDisplay.textContent = localStorage.getItem('game24_bestScore') || '0';
    }

    _showAchievement(ach) {
        this.dom.achievementName.textContent = `${ach.icon} ${ach.name} - ${ach.desc}`;
        this.dom.achievementToast.classList.add('show');
        this.sound.play('achievement');
        setTimeout(() => {
            this.dom.achievementToast.classList.remove('show');
        }, 4000);
    }

    _toast(msg, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = msg;
        this.dom.toastContainer.appendChild(toast);
        setTimeout(() => {
            toast.style.animation = 'toastOut 0.3s ease-in forwards';
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }

    _handleKeyboard(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
            e.preventDefault();
            this._backspace();
            return;
        }

        if (e.key === 'Enter') {
            e.preventDefault();
            this._checkAnswer();
            return;
        }

        if (e.key === 'n' || e.key === 'N') {
            this.newGame();
            return;
        }

        if (e.key === 'h' || e.key === 'H') {
            this._showHint();
            return;
        }

        if (e.key === '?') {
            this._showHelp();
            return;
        }

        if (e.key === 'd' || e.key === 'D') {
            this._showDaily();
            return;
        }

        if (e.key === 'Escape') {
            this._closeModals();
            return;
        }

        if (e.key === ' ') {
            e.preventDefault();
            this._togglePause();
            return;
        }

        if (e.key === 'Backspace') {
            this._backspace();
            return;
        }

        if ('123456789'.includes(e.key)) {
            this._addToExpression(e.key);
            return;
        }

        if ('+-*/'.includes(e.key)) {
            this._addToExpression(e.key);
            return;
        }

        if (e.key === '(' || e.key === ')') {
            this._addToExpression(e.key);
            return;
        }
    }

    _handleDragStart(e) {
        const card = e.target.closest('.number-card');
        if (!card || card.classList.contains('used')) return;
        e.dataTransfer.setData('text/plain', `${card.dataset.value}:${card.dataset.index}`);
        card.classList.add('dragging');
    }

    _handleDragEnd(e) {
        document.querySelectorAll('.number-card').forEach(c => c.classList.remove('dragging'));
        this.dom.expressionDisplay.closest('.expression-area').classList.remove('drag-over');
    }

    _handleDrop(e) {
        e.preventDefault();
        this.dom.expressionDisplay.closest('.expression-area').classList.remove('drag-over');
        const data = e.dataTransfer.getData('text/plain');
        if (!data) return;
        const [value, index] = data.split(':');
        if (value !== undefined && index !== undefined) {
            const cards = this.dom.numbersContainer.querySelectorAll('.number-card');
            if (cards[parseInt(index)] && !cards[parseInt(index)].classList.contains('used')) {
                this._addToExpression(value);
            }
        }
    }

    _handleTouchStart(e) {
        const card = e.target.closest('.number-card');
        if (!card || card.classList.contains('used')) return;
        this._touchCard = card;
        card.style.opacity = '0.8';
    }

    _handleTouchEnd(e) {
        if (!this._touchCard) return;
        this._touchCard.style.opacity = '1';
        const touch = e.changedTouches[0];
        const target = document.elementFromPoint(touch.clientX, touch.clientY);
        if (target && (target.closest('.expression-area') || target.closest('.expression-display'))) {
            this._addToExpression(this._touchCard.dataset.value);
        }
        this._touchCard = null;
    }

    _showStats() {
        this.dom.statGamesPlayed.textContent = this.stats.data.gamesPlayed;
        this.dom.statGamesWon.textContent = this.stats.data.gamesWon;
        this.dom.statWinRate.textContent = this.stats.getWinRate() + '%';
        this.dom.statBestScore.textContent = this.stats.data.bestScore;
        this.dom.statLongestStreak.textContent = this.stats.data.bestStreak;
        this.dom.statAvgTime.textContent = this.stats.getAvgTime() + 's';

        this.dom.achievementsList.innerHTML = '';
        for (const [, ach] of Object.entries(this.achievements.achievements)) {
            const item = document.createElement('div');
            item.className = `achievement-item ${ach.unlocked ? '' : 'locked'}`;
            item.innerHTML = `
                <div class="ach-icon">${ach.icon}</div>
                <div class="ach-info">
                    <div class="ach-name">${ach.name}</div>
                    <div class="ach-desc">${ach.desc}</div>
                </div>
            `;
            this.dom.achievementsList.appendChild(item);
        }

        this._closeModals();
        this.dom.statsModal.style.display = 'block';
        this.dom.modalOverlay.classList.add('active');
        this.dom.modalOverlay.setAttribute('aria-hidden', 'false');
    }

    _showSettings() {
        this._closeModals();
        this.dom.settingsModal.style.display = 'block';
        this.dom.modalOverlay.classList.add('active');
        this.dom.modalOverlay.setAttribute('aria-hidden', 'false');
    }

    _showDaily() {
        if (!this.dom.dailyModal) return;
        this._closeModals();
        const puzzle = this.daily.getPuzzle();
        this.currentPuzzle = puzzle;
        this.dom.dailyNumbers.innerHTML = '';
        puzzle.numbers.forEach(n => {
            const el = document.createElement('div');
            el.className = 'daily-num';
            el.textContent = n;
            this.dom.dailyNumbers.appendChild(el);
        });
        this.dom.dailyStatus.textContent = this.daily.isCompleted()
            ? '✓ Already completed today. Come back tomorrow!'
            : 'Tap Play to start today\'s puzzle.';
        this.dom.dailyModal.style.display = 'block';
        this.dom.modalOverlay.classList.add('active');
        this.dom.modalOverlay.setAttribute('aria-hidden', 'false');
    }

    _showHelp() {
        if (!this.dom.helpModal) return;
        this._closeModals();
        this.dom.helpModal.style.display = 'block';
        this.dom.modalOverlay.classList.add('active');
        this.dom.modalOverlay.setAttribute('aria-hidden', 'false');
    }

    _closeModals() {
        this.dom.modalOverlay.classList.remove('active');
        this.dom.modalOverlay.setAttribute('aria-hidden', 'true');
        document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
    }
}


// ============================================================
// Initialize
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    window.game = new Game24();
});
