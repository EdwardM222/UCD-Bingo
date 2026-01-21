const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzbaJZwKLtfqboepVjv3S-nBi7od0On4l08lSlZcju913f_51RaWcE9AdiGN-oYM1lsZw/exec"; 

let currentUser = null;
let myNumbers = new Set();
let allData = [];
let savedUser = null;
let isSaving = false;

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('login-btn').addEventListener('click', login);

    document.getElementById('username').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') login();
    });

    savedUser = localStorage.getItem('bingo_current_user');
    if (savedUser) {
        document.getElementById('username').value = savedUser;
        login();
    }

    fetchData();
});

async function login() {
    const nameInput = document.getElementById('username');
    const name = nameInput.value.trim();
    
    if (!name) {
        alert("Please enter a name!");
        return;
    }
    
    currentUser = name;
    localStorage.setItem('bingo_current_user', currentUser);
    
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('game-section').classList.remove('hidden');
    
    document.getElementById('name').innerText = currentUser;

    if (!savedUser) {
        updateMyNumbers();
        renderGrid();
    }
}

async function fetchData() {
    try {
        const res = await fetch(GOOGLE_SCRIPT_URL);
        const data = await res.json();
        
        for (const player of data) {
            player.numbers = new Set(JSON.parse(player.numbers));
        }

        allData = data;

        updateMyNumbers();
        renderGrid();
        renderLeaderboard();
    } catch (e) {
        console.error("Fetch failed", e);
    } finally {
        isSaving = false;
        document.getElementById('delay-msg').classList.add('hidden');
    }
}

function updateMyNumbers() {
    const me = allData.find(player => player.name === currentUser);
    if (me) {
        myNumbers = me.numbers;
    } else {
        myNumbers = new Set();
    }
}

function renderGrid() {
    const grid = document.getElementById('bingo-grid');
    grid.innerHTML = "";
    grid.style.gridTemplateColumns = `repeat(10, 1fr)`;

    for (let i = 0; i < 100; i++) {
        const btn = document.createElement('button');
        btn.classList.add('grid-btn');
        btn.innerText = i.toString().padStart(2, '0');
        
        if (myNumbers.has(i)) {
            btn.classList.add('collected');
        }

        btn.onclick = () => toggleNumber(i, btn);
        grid.appendChild(btn);
    }
}

function renderLeaderboard() {
    const list = document.getElementById('leaderboard-list');
    list.innerHTML = "";
    
    allData.sort((a, b) => b.numbers.size - a.numbers.size);
    allData.forEach(player => {
        const row = document.createElement('div');
        row.className = 'player-row-container';
        row.style.marginBottom = '8px';
        
        row.innerHTML = `
            <div style="display:flex; justify-content:space-between; font-size: 0.9rem;">
                <span>${player.name}</span>
                <span>${player.numbers.size}%</span>
            </div>
            <div class="progress-bar"">
                <div class="progress-fill" style="width:${player.numbers.size}%;"></div>
            </div>
        `;
        list.appendChild(row);
    });
}

function toggleNumber(num, btnElement) {
    if (isSaving) {
        document.getElementById('delay-msg').classList.remove('hidden');
        return;
    }

    isSaving = true;
    if (myNumbers.has(num)) {
        myNumbers.delete(num);
        btnElement.classList.remove('collected');
    } else {
        myNumbers.add(num);
        btnElement.classList.add('collected');
    }
    
    saveProgress();
}

async function saveProgress() {
    try {
        await fetch(GOOGLE_SCRIPT_URL, {
            method: "POST",
            body: JSON.stringify({ 
                name: currentUser, 
                numbers: [...myNumbers],
                secret: "bingo_secret_key_123674"
            })
        });
        fetchData();
    } catch (e) {
        console.error("Cloud save failed", e);
    }
}