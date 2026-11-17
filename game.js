let canvas, ctx;
let frames = 0;
let reqAnimFrame;
let isPlaying = false;
let score = 0;

// De krab is nu volledig in code getekend, dus geen rare afbeeldings-hitboxes meer!
const krab = {
    x: 50, y: 150, width: 32, height: 22,
    gravity: 0.35, jump: 5.8, speed: 0,
    draw: function() {
        ctx.save();
        // Verplaats het middelpunt naar het hart van de hitbox voor de rotatie
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        
        // Roteer de krab: neus omhoog bij springen, omlaag bij vallen
        let rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, (this.speed * 0.1)));
        ctx.rotate(rotation);
        
        // --- GETEKENDE KRABBIA (Vector) ---
        // 1. Pootjes achter
        ctx.strokeStyle = '#d94141';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-10, 5); ctx.lineTo(-15, 14); // Linksachter
        ctx.moveTo(10, 5); ctx.lineTo(15, 14);   // Rechtsachter
        ctx.stroke();

        // 2. Lichaam (Ovaal)
        ctx.fillStyle = '#d94141';
        ctx.beginPath();
        ctx.ellipse(0, 0, 16, 11, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // 3. Pootjes voor
        ctx.beginPath();
        ctx.moveTo(-5, 8); ctx.lineTo(-8, 16);
        ctx.moveTo(5, 8); ctx.lineTo(8, 16);
        ctx.stroke();

        // 4. Scharen
        ctx.beginPath();
        ctx.arc(-12, -8, 6, 0, Math.PI * 2); // Linker schaar
        ctx.arc(12, -8, 6, 0, Math.PI * 2);  // Rechter schaar
        ctx.fill();
        
        // Gaten in de scharen (hapt hapje uit de cirkels)
        ctx.fillStyle = '#f2ebd9'; // Achtergrondkleur
        ctx.beginPath();
        ctx.arc(-14, -10, 3, 0, Math.PI * 2);
        ctx.arc(14, -10, 3, 0, Math.PI * 2);
        ctx.fill();

        // 5. Zonnebril (Krabbia stijl)
        ctx.fillStyle = '#1a2a3a';
        ctx.beginPath();
        ctx.arc(-6, -2, 5, 0, Math.PI, true); // Linker glas
        ctx.arc(6, -2, 5, 0, Math.PI, true);  // Rechter glas
        ctx.fill();
        // Bril montuur (verbindingsstukje)
        ctx.strokeStyle = '#1a2a3a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-11, -2);
        ctx.lineTo(11, -2);
        ctx.stroke();

        ctx.restore();
    },
    update: function() {
        this.speed += this.gravity;
        this.y += this.speed;
        
        // Bodem geraakt (rekening houdend met de zeebodem marge van 30px)
        if (this.y + this.height >= canvas.height - 30) { 
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
    width: 55, // Brede robuuste meerpalen
    gap: 120,  // Ruime opening zodat het spel fair is
    dx: 2.8,   // Iets meer snelheid
    draw: function() {
        for (let i = 0; i < this.posities.length; i++) {
            let p = this.posities[i];
            let topY = p.y;
            let bottomY = p.y + this.gap;
            
            // --- Houten meerpalen styling ---
            ctx.fillStyle = '#a67c52'; // Houtkleur
            ctx.strokeStyle = '#1a2a3a'; // Donkere outline
            ctx.lineWidth = 4;

            // Bovenste paal
            ctx.fillRect(p.x, 0, this.width, topY);
            ctx.strokeRect(p.x, -5, this.width, topY + 5);
            
            // Onderste paal
            ctx.fillRect(p.x, bottomY, this.width, canvas.height - bottomY);
            ctx.strokeRect(p.x, bottomY, this.width, canvas.height - bottomY + 5);

            // Touwtjes detail
            ctx.fillStyle = '#e5d7ba';
            ctx.fillRect(p.x, topY - 15, this.width, 6);
            ctx.fillRect(p.x, topY - 25, this.width, 6);
            ctx.fillRect(p.x, bottomY + 10, this.width, 6);
            ctx.fillRect(p.x, bottomY + 20, this.width, 6);
        }
    },
    update: function() {
        if (frames % 80 === 0) {
            this.posities.push({
                x: canvas.width,
                y: Math.random() * (canvas.height - this.gap - 80) + 30
            });
        }
        
        for (let i = 0; i < this.posities.length; i++) {
            let p = this.posities[i];
            p.x -= this.dx;

            if (p.x + this.width <= 0) {
                this.posities.shift();
                score++;
                i--;
                continue;
            }

            // Strakke Hitbox-detectie (AABB collision) zonder vage marges
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

const zeebodem = {
    x: 0,
    draw: function() {
        ctx.fillStyle = '#e5d7ba'; 
        ctx.beginPath();
        for(let i = -20; i < canvas.width + 40; i += 30) {
            ctx.arc(i + this.x, canvas.height - 5, 20, 0, Math.PI, true);
        }
        ctx.fill();
        this.x = (this.x - 1.5) % 30; // parallax scroll
    }
};

function drawScore() {
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#1a2a3a';
    ctx.lineWidth = 5;
    ctx.font = '900 45px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    
    ctx.strokeText(score, canvas.width / 2, 60); 
    ctx.fillText(score, canvas.width / 2, 60);
}

function draw() {
    ctx.fillStyle = '#f2ebd9'; // Warme zand/zee achtergrond
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
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