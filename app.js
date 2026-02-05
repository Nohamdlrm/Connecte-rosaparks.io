const ADMIN_ID = "ce.0227235a@campus-rosaparks.fr";

let state = {
    services: JSON.parse(localStorage.getItem('RP_SRV')) || [
        { ico: '🦋', name: 'Pronote', url: 'https://pronote.campus-rosaparks.fr/' },
        { ico: '✉️', name: 'Gmail', url: 'https://mail.google.com' }
    ],
    logs: JSON.parse(localStorage.getItem('RP_LOGS')) || [],
    cas: JSON.parse(localStorage.getItem('RP_CAS')) || {}
};

function handleAuth(response) {
    const user = JSON.parse(atob(response.credential.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (!user.email.endsWith("@campus-rosaparks.fr")) return alert("ACCÈS REFUSÉ");

    saveLog(user.email, "LOGIN");
    document.getElementById('view-login').style.display = 'none';
    document.getElementById('view-dash').classList.add('active');
    document.getElementById('logout-btn').style.display = 'inline-block';
    document.getElementById('status-display').innerText = user.email;
    document.getElementById('welcome-txt').innerText = "Session: " + user.given_name;

    if (user.email === ADMIN_ID) {
        document.getElementById('admin-panel').style.display = 'block';
        renderAdminList();
        renderLogs();
    }
    renderServices(user.email);
}

function renderServices(email) {
    const grid = document.getElementById('srv-grid');
    grid.innerHTML = '';
    state.services.forEach(s => {
        const card = document.createElement('a');
        card.className = 'cyber-card';
        let finalUrl = s.url;
        
        if (s.name.toLowerCase() === 'pronote' && state.cas[email.toLowerCase()]) {
            finalUrl += `?ticket=${state.cas[email.toLowerCase()]}&user=${btoa(email)}`;
        }

        card.href = finalUrl;
        card.target = "_blank";
        card.innerHTML = `<span style="font-size:40px; display:block; margin-bottom:15px">${s.ico}</span><b>${s.name.toUpperCase()}</b>`;
        grid.appendChild(card);
    });
}

// ADMIN : AJOUTER
function addService() {
    const ico = document.getElementById('new-ico').value || '💠';
    const name = document.getElementById('new-name').value;
    const url = document.getElementById('new-url').value;
    if (name && url) {
        state.services.push({ ico, name, url });
        sync();
        renderAdminList();
        renderServices(ADMIN_ID);
    }
}

// ADMIN : SUPPRIMER
function deleteService(index) {
    if(confirm("Supprimer ce service pour TOUT LE MONDE ?")) {
        state.services.splice(index, 1);
        sync();
        renderAdminList();
        renderServices(ADMIN_ID);
    }
}

function renderAdminList() {
    const list = document.getElementById('manage-services-list');
    list.innerHTML = '<p style="font-size:10px; margin-bottom:10px; opacity:0.5">GESTION DES SERVICES ACTIFS :</p>';
    state.services.forEach((s, index) => {
        list.innerHTML += `
            <div style="display:flex; justify-content:space-between; background:rgba(255,255,255,0.05); padding:10px; border-radius:10px; margin-bottom:5px; font-size:12px">
                <span>${s.ico} ${s.name}</span>
                <button class="btn-delete" onclick="deleteService(${index})">SUPPRIMER</button>
            </div>
        `;
    });
}

// CAS & LOGS
function createCAS() {
    const email = document.getElementById('cas-target').value.toLowerCase();
    state.cas[email] = "ST-" + Date.now();
    sync();
    alert("Bypass activé pour " + email);
}

function logout() {
    location.reload();
}

function sync() {
    localStorage.setItem('RP_SRV', JSON.stringify(state.services));
    localStorage.setItem('RP_CAS', JSON.stringify(state.cas));
}

function saveLog(user, action) {
    state.logs.unshift({ user, action, time: new Date().toLocaleTimeString() });
    localStorage.setItem('RP_LOGS', JSON.stringify(state.logs));
}

function renderLogs() {
    document.getElementById('log-table').innerHTML = state.logs.slice(0, 5).map(l => 
        `<tr><td>${l.user}</td><td>${l.action}</td><td>${l.time}</td></tr>`
    ).join('');
}
