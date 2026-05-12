/* UPDATE BARU: GLOBAL TIMER 10 MINUTES SYSTEM */
let currentRound = 1;
let gridSize = 3;
let maxHeight = 3;
let targetMatrix = [];
let targetProjections = {}; 
let playerMatrix = [];      
let gameTimer;
let globalTimerInterval; 
let totalTime = 600; // 10 Menit dalam detik

let totalScore = 0;
let teamName = "Tim Misterius";

function showPage(pageId) {
    document.querySelectorAll('section').forEach(sec => sec.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
}

function saveNameAndStart() {
    const input = document.getElementById('teamNameInput').value;
    if(input.trim() === "") return alert("Isi nama tim lo dulu bos! 🐈");
    
    teamName = input;
    currentRound = 1;
    totalScore = 0;
    totalTime = 600; 
    
    startGlobalTimer(); 
    startRound();
    showPage('page-game');
}

function startGlobalTimer() {
    clearInterval(globalTimerInterval);
    const display = document.getElementById('globalTimerDisplay');
    
    display.innerText = formatTime(totalTime);
    
    globalTimerInterval = setInterval(() => {
        totalTime--;
        display.innerText = formatTime(totalTime);
        
        if(totalTime <= 0) {
            clearInterval(globalTimerInterval);
            endGame("Waktu Sesi Habis (10 Menit)!");
        }
    }, 1000);
}

function startRound() {
    document.getElementById('lvl-text').innerText = currentRound;
    document.getElementById('feedback-msg').innerText = "";
    
    gridSize = Math.min(3 + Math.floor((currentRound - 1) / 2), 5); 
    maxHeight = gridSize; 
    
    let timeLimit = 120 + ((currentRound - 1) * 30);
    runTimer(timeLimit);

    generateTargetMatrix();
    targetProjections = calculateProjections(targetMatrix);
    playerMatrix = Array(gridSize).fill().map(() => Array(gridSize).fill(0));

    renderBlueprints();
    renderBuilderGrid();
}

function generateTargetMatrix() {
    targetMatrix = Array(gridSize).fill().map(() => Array(gridSize).fill(0));
    let numCubesToPlace = Math.floor((gridSize * gridSize * maxHeight) * 0.4); 
    if(currentRound === 1) numCubesToPlace = 10; 
    
    for(let i=0; i < numCubesToPlace; i++) {
        let x = Math.floor(Math.random() * gridSize);
        let y = Math.floor(Math.random() * gridSize);
        if(targetMatrix[y][x] < maxHeight) targetMatrix[y][x]++;
    }
}

function calculateProjections(matrix) {
    let top = Array(gridSize).fill().map(() => Array(gridSize).fill(0));
    let frontH = Array(gridSize).fill(0);
    let leftH = Array(gridSize).fill(0);

    for(let y=0; y < gridSize; y++) {
        for(let x=0; x < gridSize; x++) {
            let h = matrix[y][x];
            if(h > 0) top[y][x] = 1;
            if(h > frontH[x]) frontH[x] = h;
            if(h > leftH[y]) leftH[y] = h;
        }
    }

    let rightH = [...leftH].reverse();
    let backH = [...frontH].reverse();

    const createSil = (arr, hMax) => {
        let sil = Array(hMax).fill().map(() => Array(gridSize).fill(0));
        for(let x=0; x < gridSize; x++) {
            for(let y = hMax - 1; y >= hMax - arr[x]; y--) sil[y][x] = 1;
        }
        return sil;
    };

    return {
        top: top,
        front: createSil(frontH, maxHeight),
        right: createSil(rightH, maxHeight),
        back: createSil(backH, maxHeight),
        left: createSil(leftH, maxHeight)
    };
}

function renderBlueprints() {
    const area = document.getElementById('blueprint-area');
    area.innerHTML = '';
    const views = [
        { n: "ATAS", d: targetProjections.top, r: gridSize },
        { n: "DEPAN", d: targetProjections.front, r: maxHeight },
        { n: "KANAN", d: targetProjections.right, r: maxHeight },
        { n: "BELAKANG", d: targetProjections.back, r: maxHeight },
        { n: "KIRI", d: targetProjections.left, r: maxHeight }
    ];
    views.forEach(v => {
        let box = document.createElement('div');
        box.className = 'bp-box';
        box.innerHTML = `<p class="bp-title">${v.n}</p>`;
        let grid = document.createElement('div');
        grid.className = 'bp-grid';
        grid.style.gridTemplateColumns = `repeat(${gridSize}, 15px)`;
        for(let y=0; y < v.r; y++) {
            for(let x=0; x < gridSize; x++) {
                let c = document.createElement('div');
                c.className = 'bp-cell' + (v.d[y][x] ? ' filled' : '');
                grid.appendChild(c);
            }
        }
        box.appendChild(grid);
        area.appendChild(box);
    });
}

function renderBuilderGrid() {
    const grid = document.getElementById('builder-grid');
    grid.innerHTML = '';
    grid.style.gridTemplateColumns = `repeat(${gridSize}, 60px)`;
    for(let y=0; y < gridSize; y++) {
        for(let x=0; x < gridSize; x++) {
            let cell = document.createElement('div');
            let h = playerMatrix[y][x];
            cell.className = `build-cell lvl-${h}`;
            cell.innerText = h || '';
            cell.onclick = () => { playerMatrix[y][x] = (playerMatrix[y][x] + 1) % (maxHeight + 1); renderBuilderGrid(); };
            cell.oncontextmenu = (e) => { e.preventDefault(); if(playerMatrix[y][x] > 0) { playerMatrix[y][x]--; renderBuilderGrid(); } };
            grid.appendChild(cell);
        }
    }
}

function clearBuilder() { playerMatrix = Array(gridSize).fill().map(() => Array(gridSize).fill(0)); renderBuilderGrid(); }

function submitBuild() {
    let p = calculateProjections(playerMatrix);
    let match = JSON.stringify(p) === JSON.stringify(targetProjections);
    if(match) {
        clearInterval(gameTimer);
        totalScore += 1500 + (currentRound * 500);
        document.getElementById('score-text').innerText = totalScore;
        document.getElementById('success-modal').classList.remove('hidden');
    } else {
        document.getElementById('feedback-msg').innerText = "❌ STRUKTUR BELUM AKURAT!";
    }
}

function nextRound() { document.getElementById('success-modal').classList.add('hidden'); currentRound++; startRound(); }

function endGame(reason) {
    clearInterval(gameTimer);
    clearInterval(globalTimerInterval); 
    document.getElementById('final-team-name').innerText = teamName;
    document.getElementById('final-level').innerText = currentRound;
    document.getElementById('final-score').innerText = totalScore;
    document.getElementById('gameover-reason').innerText = reason;
    showPage('page-gameover');
}

function runTimer(seconds) {
    clearInterval(gameTimer);
    let t = seconds;
    const disp = document.getElementById('timerDisplay');
    gameTimer = setInterval(() => {
        t--; disp.innerText = formatTime(t);
        if(t <= 0) { clearInterval(gameTimer); endGame("Waktu Ronde Habis!"); }
    }, 1000);
}

function formatTime(s) {
    let min = Math.floor(s/60); let sec = s%60;
    return `${min<10?'0'+min:min}:${sec<10?'0'+sec:sec}`;
}
