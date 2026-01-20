const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwtdG-9FhmM1bwyPijmZTNHYqnMsDTT1jRGiGJ7SurKGUih7-zTy6LPPPRJJNbSeE9z_Q/exec";

let currentUser = null;
let myNumbers = new Set(); 

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('login-btn').addEventListener('click', login);

    const savedUser = localStorage.getItem('bingo_current_user');
    if (savedUser) {
        document.getElementById('username').value = savedUser;
        login();
    }

    fetchLeaderboard();
});

async function login() {
    const nameInput = document.getElementById('username');
    const name = nameInput.value.trim();
    
    currentUser = name;
    localStorage.setItem('bingo_current_user', currentUser);
    document.getElementById('name').innerText = currentUser;

    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('game-section').classList.remove('hidden');
    
    const localData = localStorage.getItem('bingo_' + currentUser);
    if (localData) {
        myNumbers = new Set(JSON.parse(localData));
        renderGrid();
    }

    try {
        const res = await fetch(GOOGLE_SCRIPT_URL);
        const allData = await res.json();
        const myRemoteData = allData.find(u => u.name === currentUser);
        
        if (myRemoteData && myRemoteData.data) {
            const remoteNumbers = JSON.parse(myRemoteData.data);
            remoteNumbers.forEach(num => myNumbers.add(num));
            
            localStorage.setItem('bingo_' + currentUser, JSON.stringify([...myNumbers]));
            renderGrid();
        }
        
        renderLeaderboard(allData);
    } catch (e) { console.error(e); }
}

function renderGrid() {
    const grid = document.getElementById('bingo-grid');
    grid.innerHTML = "";

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

function toggleNumber(num, btnElement) {
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
    localStorage.setItem('bingo_' + currentUser, JSON.stringify([...myNumbers]));

    try {
        await fetch(GOOGLE_SCRIPT_URL, {
            method: "POST",
            body: JSON.stringify({ 
                name: currentUser, 
                data: [...myNumbers],
                percent: myNumbers.size 
            })
        });
        fetchLeaderboard();
    } catch (e) {
        console.error("Save failed", e);
    }
}

async function fetchLeaderboard() {
    try {
        const res = await fetch(GOOGLE_SCRIPT_URL);
        const data = await res.json();
        renderLeaderboard(data);
    } catch (e) {
        console.error("Fetch failed", e);
    }
}

function renderLeaderboard(data) {
    const list = document.getElementById('leaderboard-list');
    list.innerHTML = "";
    
    data.sort((a, b) => b.percent - a.percent);

    data.forEach(player => {
        const row = `
            <div class="player-row-container">
                <div class="player-info">
                    <span>${player.name}</span>
                    <span>${player.percent}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${player.percent}%;"></div>
                </div>
            </div>
        `;
        list.innerHTML += row;
    });
}