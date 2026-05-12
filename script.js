let currentRound = 1;
let gridSize = 3;
let maxHeight = 3;
let targetMatrix = [];
let targetProjections = {}; 
let playerMatrix = [];      
let gameTimer;
let globalTimerInterval; // Timer 10 menit
let totalTime = 600; // 10 menit dalam detik

let totalScore = 0;
let teamName = "Tim Misterius";

// Navigasi
function showPage(pageId) {
    document.querySelectorAll('section').forEach(sec => sec.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
}

// 1. SETUP GAME
function saveNameAndStart() {
    const input = document.getElementById('teamNameInput').value;
    if(input.trim() === "") return alert("Isi nama tim lo dulu bos! 🐈");
    
    teamName = input;
    currentRound = 1;
    totalScore = 0;
    totalTime = 600; // Reset ke 10 menit
    
    startGlobalTimer(); // Mulai timer 10 menit
    startRound();
    showPage('page-game');
}

// --- GLOBAL TIMER 10 MENIT ---
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

// 2. GENERATE LEVEL & MATRIKS
function startRound() {
    document.getElementById('lvl-text').innerText = currentRound;
    document.getElementById('feedback-msg').innerText = "";
    
    // Tingkat Kesulitan (Grid makin gede, kubus makin banyak)
    gridSize = Math.min(3 + Math.floor((currentRound - 1) / 2), 5); 
    maxHeight = gridSize; 
    
    // Timer Ronde gue sesuain biar masuk akal sama Total 10 Menit
    // Mulai dari 2 menit (120s), nambah 30s tiap ronde
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
    
    if(currentRound === 1) numCubesToPlace = 15; 
    
    for(let i=0; i < numCubesToPlace; i++) {
        let x = Math.floor(Math.random() * gridSize);
        let y = Math.floor(Math.random() * gridSize);
        if(targetMatrix[y][x] < maxHeight) {
            targetMatrix[y][x]++;
        }
    }
}

// 3. ENGINE PROYEKSI
function calculateProjections(matrix) {
    let top = Array(gridSize).fill().map(() => Array(gridSize).fill(0));
    let frontHeights = Array(gridSize).fill(0);
    let leftHeights = Array(gridSize).fill(0);

    for(let y=0; y < gridSize; y++) {
        for(let x=0; x < gridSize; x++) {
            let h = matrix[y][x];
            if(h > 0) top[y][x] = 1;
            if(h > frontHeights[x]) frontHeights[x] = h;
            if(h > leftHeights[y]) leftHeights[y] = h;
        }
    }

    let rightHeights = [...leftHeights].reverse();
    let backHeights = [...frontHeights].reverse();

    function createSilhouette(heightsArray) {
        let sil = Array(maxHeight).fill().map(() => Array(gridSize).fill(0));
        for(let x=0; x < gridSize; x++) {
            let h = heightsArray[x];
            for(let y = maxHeight - 1; y >= maxHeight - h; y--) {
                sil[y][x] = 1;
            }
        }
        return sil;
    }

    return {
        top: top,
        front: createSilhouette(frontHeights),
        right: createSilhouette(rightHeights),
        back: createSilhouette(backHeights),
        left: createSilhouette(leftHeights)
    };
}

// 4. RENDER BLUEPRINT
function renderBlueprints() {
    const area = document.getElementById('blueprint-area');
    area.innerHTML = '';

    const views = [
        { name: "ATAS", data: targetProjections.top, rows: gridSize },
        { name: "DEPAN", data: targetProjections.front, rows: maxHeight },
        { name: "KANAN", data: targetProjections.right, rows: maxHeight },
        { name: "BELAKANG", data: targetProjections.back, rows: maxHeight },
        { name: "KIRI", data: targetProjections.left, rows: maxHeight }
    ];

    views.forEach(v => {
        let box = document.createElement('div');
        box.className = 'bp-box';
        box.innerHTML = `<p class="bp-title">${v.name}</p>`;
        
        let grid = document.createElement('div');
        grid.className = 'bp-grid';
        grid.style.gridTemplateColumns = `repeat(${gridSize}, 15px)`;
        grid.style.gridTemplateRows = `repeat(${v.rows}, 15px)`;

        for(let y=0; y < v.rows; y++) {
            for(let x=0; x < gridSize; x++) {
                let cell = document.createElement('div');
                cell.className = 'bp-cell' + (v.data[y][x] ? ' filled' : '');
                grid.appendChild(cell);
            }
        }
        box.appendChild(grid);
        area.appendChild(box);
    });
}

// 5. RENDER MEJA RAKIT
function renderBuilderGrid() {
    const grid = document.getElementById('builder-grid');
    grid.innerHTML = '';
    grid.style.gridTemplateColumns = `repeat(${gridSize}, 60px)`;
    grid.style.gridTemplateRows = `repeat(${gridSize}, 60px)`;

    for(let y=0; y < gridSize; y++) {
        for(let x=0; x < gridSize; x++) {
            let cell = document.createElement('div');
            let h = playerMatrix[y][x];
            
            cell.className = `build-cell lvl-${h}`;
            cell.innerText = h === 0 ? '' : h;
            
            cell.onclick = () => {
                playerMatrix[y][x] = (playerMatrix[y][x] + 1) % (maxHeight + 1);
                renderBuilderGrid(); 
            };

            cell.oncontextmenu = (e) => {
                e.preventDefault();
                if(playerMatrix[y][x] > 0) {
                    playerMatrix[y][x]--;
                    renderBuilderGrid();
                }
            };
            
            grid.appendChild(cell);
        }
    }
}

function clearBuilder() {
    playerMatrix = Array(gridSize).fill().map(() => Array(gridSize).fill(0));
    renderBuilderGrid();
    document.getElementById('feedback-msg').innerText = "";
}

// 6. VALIDASI HASIL
function submitBuild() {
    const feedback = document.getElementById('feedback-msg');
    let playerProjections = calculateProjections(playerMatrix);
    
    let isTopMatch = JSON.stringify(playerProjections.top) === JSON.stringify(targetProjections.top);
    let isFrontMatch = JSON.stringify(playerProjections.front) === JSON.stringify(targetProjections.front);
    let isRightMatch = JSON.stringify(playerProjections.right) === JSON.stringify(targetProjections.right);
    let isBackMatch = JSON.stringify(playerProjections.back) === JSON.stringify(targetProjections.back);
    let isLeftMatch = JSON.stringify(playerProjections.left) === JSON.stringify(targetProjections.left);

    if(isTopMatch && isFrontMatch && isRightMatch && isBackMatch && isLeftMatch) {
        clearInterval(gameTimer); // Cuma berhentiin timer ronde
        let roundScore = 1500 + (currentRound * 500); 
        totalScore += roundScore;
        document.getElementById('score-text').innerText = totalScore;
        
        document.getElementById('success-modal').classList.remove('hidden');
    } else {
        feedback.innerText = `❌ SALAH! Cek lagi proyeksi lo. Ada sisi yang belum pas!`;
    }
}

// 7. SISTEM NEXT ROUND & GAME OVER
function nextRound() {
    document.getElementById('success-modal').classList.add('hidden');
    currentRound++;
    startRound();
}

function endGame(reason) {
    clearInterval(gameTimer);
    clearInterval(globalTimerInterval); // Pastiin timer 10 menitnya mati juga
    
    document.getElementById('final-team-name').innerText = teamName;
    document.getElementById('final-level').innerText = currentRound;
    document.getElementById('final-score').innerText = totalScore;
    document.getElementById('gameover-reason').innerText = reason;
    showPage('page-gameover');
}

// 8. TIMER
function runTimer(seconds) {
    clearInterval(gameTimer);
    let time = seconds;
    const display = document.getElementById('timerDisplay');
    display.innerText = formatTime(time);
    
    gameTimer = setInterval(() => {
        time--;
        display.innerText = formatTime(time);
        
        if(time <= 0) {
            endGame("Waktu Ronde Habis (Konstruksi Gagal!)");
        }
    }, 1000);
}

function formatTime(secs) {
    let m = Math.floor(secs/60); let s = secs % 60;
    return `${m < 10 ? '0'+m : m}:${s < 10 ? '0'+s : s}`;
}
