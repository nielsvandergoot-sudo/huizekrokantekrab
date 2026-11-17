let canvas, ctx;
let frames = 0;
let reqAnimFrame;
let isPlaying = false;
let score = 0;

const krab = {
    x: 50, y: 150, width: 30, height: 20,
    gravity: 0.3, jump: 5.5, speed: 0,
    draw: function() {
        ctx.fillStyle = '#d94141'; // Krab-rood
        ctx.fillRect(this.x, this.y, this.width, this.height);
    },
    update: function() {
        this.speed += this.gravity;
        this.y += this.speed;
        
        // Bodem geraakt
        if (this.y + this.height >= canvas.height) {
            this.y = canvas.height - this.height;
            gameOver();
        }
        // Plafond geraakt
        if (this.y <= 0) {
            this.y = 0;
            this.speed = 0;
        }
    },
    flap: function() {
        this.speed = -this.jump;
    }
};

const pipes = {
    posities: [],
    width: 45,
    gap: 130, // De ruimte tussen de buizen
    dx: 2.5,  // Snelheid van de buizen
    draw: function() {
        ctx.fillStyle = '#2a9d8f'; // Zeewier-groen
        for (let i = 0; i < this.posities.length; i++) {
            let p = this.posities[i];
            let topY = p.y;
            let bottomY = p.y + this.gap;
            
            // Bovenste buis
            ctx.fillRect(p.x, 0, this.width, topY);
            // Onderste buis
            ctx.fillRect(p.x, bottomY, this.width, canvas.height - bottomY);
        }
    },
    update: function() {
        // Voeg elke 90 frames een nieuwe buis toe
        if (frames % 90 === 0) {
            this.posities.push({
                x: canvas.width,
                y: Math.random() * (canvas.height - this.gap - 40) + 20
            });
        }
        
        for (let i = 0; i < this.posities.length; i++) {
            let p = this.posities[i];
            p.x -= this.dx;

            // Buis voorbij de krab (score +1)
            if (p.x + this.width <= 0) {
                this.posities.shift();
                score++;
                i--;
                continue;
            }

            // Hitbox (Botsing detectie)
            if (krab.x + krab.width > p.x && krab.x < p.x + this.width) {
                if (krab.y < p.y || krab.y + krab.height > p.y + this.gap) {
                    gameOver();
                }
            }
        }
    },
    reset: function() {
        this.posities = [];
    }
};

function drawScore() {
    ctx.fillStyle = '#1a2a3a';
    ctx.font = 'bold 28px -apple-system, sans-serif';
    ctx.fillText(score, canvas.width / 2 - 10, 40);
}

function draw() {
    ctx.fillStyle = '#8bd7d9'; // Water-blauw
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    pipes.draw();
    krab.draw();
    drawScore();
}

function update() {
    krab.update();
    pipes.update();
}

function loop() {
    if (!isPlaying) return;
    update();
    draw();
    frames++;
    reqAnimFrame = requestAnimationFrame(loop);
}

function initGame() {
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');
    
    // Tap / Klik besturing
    canvas.addEventListener('mousedown', () => { if (isPlaying) krab.flap(); });
    canvas.addEventListener('touchstart', (e) => { e.preventDefault(); if (isPlaying) krab.flap(); }, {passive: false});
    window.addEventListener('keydown', (e) => { if (e.code === 'Space' && isPlaying) krab.flap(); });
}

function startGame() {
    if(!canvas) initGame();
    document.getElementById('game-over-scherm').style.display = 'none';
    krab.y = 150;
    krab.speed = 0;
    pipes.reset();
    score = 0;
    frames = 0;
    isPlaying = true;
    loop();
}

function stopGame() {
    isPlaying = false;
    cancelAnimationFrame(reqAnimFrame);
}

function gameOver() {
    isPlaying = false;
    cancelAnimationFrame(reqAnimFrame);
    document.getElementById('game-over-scherm').style.display = 'block';
    document.getElementById('eind-score').textContent = score;
    
    // Deze functie zit in app.js en gooit de score naar Firebase!
    if (typeof slaScoreOp === 'function') {
        slaScoreOp(score);
    }
}