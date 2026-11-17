let canvas, ctx;
let frames = 0;
let reqAnimFrame;
let isPlaying = false;
let score = 0;

// Laad de getekende krab afbeelding
const krabImg = new Image();
krabImg.src = 'krabbias.png';

const krab = {
    x: 50, y: 150, width: 34, height: 34,
    gravity: 0.3, jump: 5.5, speed: 0,
    draw: function() {
        if (krabImg.complete) {
            ctx.save();
            // Verplaats het middelpunt naar de krab voor rotatie
            ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
            
            // Roteer de krab: neus omhoog bij springen, omlaag bij vallen
            let rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, (this.speed * 0.1)));
            ctx.rotate(rotation);
            
            // Teken het plaatje iets groter dan de daadwerkelijke hitbox (voelt beter)
            ctx.drawImage(krabImg, -this.width/2 - 15, -this.height/2 - 15, this.width + 30, this.height + 30);
            
            ctx.restore();
        } else {
            // Nood-fallback
            ctx.fillStyle = '#d94141';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    },
    update: function() {
        this.speed += this.gravity;
        this.y += this.speed;
        
        // Bodem geraakt
        if (this.y + this.height >= canvas.height - 30) { // -30 vanwege de zeebodem
            this.y = canvas.height - 30 - this.height;
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
    width: 55, // Iets bredere palen
    gap: 140, // Iets groter gat zodat het eerlijk blijft
    dx: 2.5,
    draw: function() {
        for (let i = 0; i < this.posities.length; i++) {
            let p = this.posities[i];
            let topY = p.y;
            let bottomY = p.y + this.gap;
            
            // --- Houten meerpalen styling ---
            ctx.fillStyle = '#a67c52'; // Houtkleur
            ctx.strokeStyle = '#1a2a3a'; // Donkere maritieme outline
            ctx.lineWidth = 4;

            // Bovenste paal
            ctx.fillRect(p.x, 0, this.width, topY);
            ctx.strokeRect(p.x, -5, this.width, topY + 5);
            
            // Onderste paal
            ctx.fillRect(p.x, bottomY, this.width, canvas.height - bottomY);
            ctx.strokeRect(p.x, bottomY, this.width, canvas.height - bottomY + 5);

            // Touwtjes detail
            ctx.fillStyle = '#f4edd2'; // Zand/Touw kleur
            ctx.fillRect(p.x, topY - 15, this.width, 6);
            ctx.fillRect(p.x, topY - 25, this.width, 6);
            ctx.fillRect(p.x, bottomY + 10, this.width, 6);
            ctx.fillRect(p.x, bottomY + 20, this.width, 6);
        }
    },
    update: function() {
        // Voeg elke 90 frames een nieuwe paal toe
        if (frames % 90 === 0) {
            this.posities.push({
                x: canvas.width,
                y: Math.random() * (canvas.height - this.gap - 80) + 30
            });
        }
        
        for (let i = 0; i < this.posities.length; i++) {
            let p = this.posities[i];
            p.x -= this.dx;

            // Paal is voorbij de krab (score +1)
            if (p.x + this.width <= 0) {
                this.posities.shift();
                score++;
                i--;
                continue;
            }

            // Hitbox (botsing detectie) - met een kleine 'forgiveness' marge van 5px
            if (krab.x + krab.width - 5 > p.x && krab.x + 5 < p.x + this.width) {
                if (krab.y + 5 < p.y || krab.y + krab.height - 5 > p.y + this.gap) {
                    gameOver();
                }
            }
        }
    },
    reset: function() {
        this.posities = [];
    }
};

// Bewegende zand-bodem
const zeebodem = {
    x: 0,
    draw: function() {
        ctx.fillStyle = '#e5d7ba'; // Iets donkerder zand
        ctx.beginPath();
        // Teken golvend zand onderaan het scherm
        for(let i = -20; i < canvas.width + 40; i += 30) {
            ctx.arc(i + this.x, canvas.height - 5, 20, 0, Math.PI, true);
        }
        ctx.fill();
        this.x = (this.x - 1) % 30; // Parallax scroll effect
    }
};

function drawScore() {
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#1a2a3a';
    ctx.lineWidth = 5;
    ctx.font = '900 40px -apple-system, sans-serif';
    
    // Teken in het midden bovenaan
    ctx.strokeText(score, canvas.width / 2 - 12, 50); // Outline
    ctx.fillText(score, canvas.width / 2 - 12, 50);   // Binnenkant
}

function draw() {
    // 1. Achtergrondkleur (exact hetzelfde als je krabbias plaatje)
    ctx.fillStyle = '#f2ebd9'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 2. Teken de rest
    pipes.draw();
    zeebodem.draw();
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
    
    if (typeof slaScoreOp === 'function') {
        slaScoreOp(score);
    }
}