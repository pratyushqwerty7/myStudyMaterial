const API = { user: 'pratyushqwerty7', repo: 'myStudyMaterial' };
let dataStore = [], currentMode = 'list', filterTag = 'all', activeRel = null;
const palette = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

// --- SECRET ADMIN LOGIC ---
let vaultClicks = 0;

function handleVaultClick() {
    vaultClicks++;
    const searchInput = document.getElementById('main-search');
    const searchVal = searchInput ? searchInput.value : "";
    
    // Secret Sequence: Click 3 times, then password in search, then click again.
    if(vaultClicks >= 4 && searchVal === "StudyVault-Pro | ADMIN") {
        window.location.href = 'admin.html';
    }
    
    // Safety reset
    if(vaultClicks > 10) vaultClicks = 0;
}

// --- CORE FUNCTIONS ---
function showLoad() { document.getElementById('loader').style.display = 'flex'; }
function hideLoad() { setTimeout(() => { document.getElementById('loader').style.display = 'none'; }, 600); }

async function init() {
    showLoad();
    try {
        const resp = await fetch(`https://api.github.com/repos/${API.user}/${API.repo}/releases`);
        dataStore = await resp.json();
        renderMain();
    } catch(e) { console.error("API Error"); }
    hideLoad();
}

function renderMain() {
    const stage = document.getElementById('main-stage');
    const sortVal = document.getElementById('main-sort').value;
    if(!stage) return;
    
    stage.className = `stage stage-${currentMode}`;
    stage.innerHTML = '';

    let filtered = dataStore.filter(r => {
        const tag = r.tag_name.toLowerCase();
        if(filterTag === 'all') return !tag.includes('extra');
        if(filterTag === 'extra') return tag.includes('extra');
        return tag.includes(filterTag);
    });

    if(sortVal === 'az') filtered.sort((a,b) => a.name.localeCompare(b.name));
    else filtered.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));

    filtered.forEach(rel => {
        const color = palette[Math.floor(Math.random() * palette.length)];
        const card = document.createElement('div');
        card.className = 'card';
        card.style[currentMode === 'grid' ? 'borderTop' : 'borderLeft'] = `8px solid ${color}`;
        card.onclick = () => openFolder(rel);
        card.innerHTML = `<div class="icon-box" style="color:${color}"><i class="fas fa-folder"></i></div><div class="info"><h3>${rel.name}</h3><small>${rel.assets.length} items in Vault</small></div>`;
        stage.appendChild(card);
    });
    syncIcons();
}

function openFolder(rel) {
    activeRel = rel;
    document.getElementById('folder-title').innerText = rel.name;
    document.getElementById('folder-view').style.display = 'block';
    renderFolder();
}

function renderFolder() {
    if(!activeRel) return;
    const stage = document.getElementById('folder-stage');
    const sortVal = document.getElementById('folder-sort').value;
    stage.className = `stage stage-${currentMode}`;
    stage.innerHTML = '';

    let assets = [...activeRel.assets];
    if(sortVal === 'az') assets.sort((a,b) => a.name.localeCompare(b.name));
    else assets.sort((a,b) => b.size - a.size);

    assets.forEach(asset => {
        const meta = getMeta(asset.name), color = palette[Math.floor(Math.random() * palette.length)];
        const card = document.createElement('div');
        card.className = 'card';
        card.style[currentMode === 'grid' ? 'borderTop' : 'borderLeft'] = `8px solid ${color}`;
        card.innerHTML = `
            <div class="icon-box" style="color:${color}"><i class="fas ${meta.i}"></i></div>
            <div class="info"><h3>${asset.name}</h3><small>${meta.t} • ${(asset.size/1048576).toFixed(2)} MB</small></div>
            <div class="actions">
                ${meta.isZip ? `<a href="${asset.browser_download_url}" class="btn btn-z"><i class="fas fa-download"></i> DOWNLOAD ZIP</a>` : 
                `<button class="btn btn-v" onclick="viewFile('${asset.browser_download_url}', '${meta.t}', event)">VIEW</button>
                <a href="${asset.browser_download_url}" class="btn btn-d"><i class="fas fa-download"></i></a>`}
            </div>`;
        stage.appendChild(card);
    });
    syncIcons();
}

function getMeta(name) {
    const n = name.toLowerCase();
    if (n.match(/\.(mp4|mkv|webm)$/)) return { t: 'Video', i: 'fa-play-circle' };
    if (n.endsWith('.pdf')) return { t: 'PDF', i: 'fa-file-pdf' };
    if (n.match(/\.(png|jpg|jpeg|webp|gif)$/)) return { t: 'Image', i: 'fa-image' };
    if (n.match(/\.(mp3|wav|ogg)$/)) return { t: 'Audio', i: 'fa-headphones' };
    if (n.match(/\.(docx|doc)$/)) return { t: 'Word', i: 'fa-file-word' };
    if (n.match(/\.(xlsx|xls|csv)$/)) return { t: 'Excel', i: 'fa-file-excel' };
    if (n.endsWith('.accdb')) return { t: 'Access', i: 'fa-database' };
    if (n.endsWith('.txt')) return { t: 'Text', i: 'fa-file-alt' };
    if (n.match(/\.(zip|7z|rar|tar|gz)$/)) return { t: 'Archive', i: 'fa-file-archive', isZip: true };
    return { t: 'File', i: 'fa-file' };
}

function viewFile(url, type, e) {
    e.stopPropagation();
    const box = document.getElementById('viewer-content'); 
    box.innerHTML = '';
    if (type === 'Video') box.innerHTML = `<video src="${url}" controls autoplay style="width:100%; height:100%"></video>`;
    else if (['PDF', 'Word', 'Excel'].includes(type)) box.innerHTML = `<iframe src="https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true" style="width:100%; height:100%; border:none;"></iframe>`;
    else if (type === 'Audio') box.innerHTML = `<div style="height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; color:white; gap:20px;"><i class="fas fa-music" style="font-size:5rem"></i><audio src="${url}" controls autoplay style="width:80%"></audio></div>`;
    else if (type === 'Image') box.innerHTML = `<div style="height:100%; display:flex; align-items:center; justify-content:center;"><img src="${url}" style="max-width:95%; max-height:95%; object-fit:contain;"></div>`;
    else box.innerHTML = `<iframe src="${url}" style="width:100%; height:100%; background:white;"></iframe>`;
    document.getElementById('viewer').style.display = 'flex';
}

function toggleSide(f) {
    const s = document.getElementById('sidebar'), o = document.getElementById('overlay');
    const exp = f !== undefined ? f : !s.classList.contains('expanded');
    s.classList.toggle('expanded', exp); o.classList.toggle('active', exp);
}

function setFilter(tag, el) {
    filterTag = tag;
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    el.classList.add('active'); 
    renderMain();
    if(window.innerWidth < 1000) toggleSide(false);
}

function updateMode(m) {
    currentMode = m;
    activeRel ? renderFolder() : renderMain();
}

function syncIcons() {
    const isGrid = currentMode === 'grid';
    ['mode-list-main', 'mode-list-folder'].forEach(id => { if(document.getElementById(id)) document.getElementById(id).classList.toggle('active', !isGrid); });
    ['mode-grid-main', 'mode-grid-folder'].forEach(id => { if(document.getElementById(id)) document.getElementById(id).classList.toggle('active', isGrid); });
}

function doSearch(s, i) {
    const q = document.getElementById(i).value.toLowerCase();
    document.getElementById(s).querySelectorAll('.card').forEach(c => c.style.display = c.innerText.toLowerCase().includes(q) ? '' : 'none');
}

function closeFolder() { document.getElementById('folder-view').style.display = 'none'; activeRel = null; }
function closeMedia() { document.getElementById('viewer').style.display = 'none'; document.getElementById('viewer-content').innerHTML = ''; }

// Initialize
init();
