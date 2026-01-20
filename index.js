const BIN_ID = "696f8880d0ea881f40785d9b";
const API_KEY = "$2a$10$.0wgUoKx83WASDNVYVIHEOaaEWyRGvHiwBiU0rqN6YyTwSZWK7pky";

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

function login() {
    const nameInput = document.getElementById('username');
    const name = nameInput.value.trim();
    
    if (!name) {
        showMessage("Please enter a name!");
        return;
    }
    
    currentUser = name;
    
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('game-section').classList.remove('hidden');

    localStorage.setItem('bingo_current_user', currentUser);
    document.getElementById('name').innerText = currentUser;
    
    const savedData = localStorage.getItem('bingo_' + currentUser);
    if (savedData) {
        myNumbers = new Set(JSON.parse(savedData));
    }
    
    renderGrid();
    fetchLeaderboard();
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
        const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
            headers: { "X-Access-Key": API_KEY }
        });
        const json = await res.json();
        let allPlayers = json.record;

        const myIndex = allPlayers.findIndex(p => p.name === currentUser);
        if (myIndex >= 0) {
            allPlayers[myIndex].percent = myNumbers.size;
        } else {
            allPlayers.push({ name: currentUser, percent: myNumbers.size });
        }

        await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
            method: "PUT",
            headers: { 
                "Content-Type": "application/json",
                "X-Access-Key": API_KEY
            },
            body: JSON.stringify(allPlayers)
        });

        renderLeaderboard(allPlayers);

    } catch (error) {
        console.error("Sync failed:", error);
    }
}

async function fetchLeaderboard() {
    try {
        const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
            headers: { "X-Access-Key": API_KEY }
        });
        const json = await res.json();
        console.log("Fetched leaderboard:", json.record);
        renderLeaderboard(json.record);
    } catch (error) {
        console.error("Fetch failed:", error);
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