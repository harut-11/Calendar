let displayDate = new Date();
let holidays = {};
let selectedDateKey = "";

// 初期化
fetchHolidays();

async function fetchHolidays() {
    try {
        const res = await fetch('https://holidays-jp.github.io/api/v1/date.json');
        holidays = await res.json();
    } finally { renderCalendar(); }
}

function renderCalendar() {
    const grid = document.getElementById('calendarGrid');
    const monthDisplay = document.getElementById('monthDisplay');
    if(!grid || !monthDisplay) return;

    grid.innerHTML = '';
    const year = displayDate.getFullYear();
    const month = displayDate.getMonth();
    monthDisplay.innerText = `${year}年 ${month + 1}月`;

    ["日", "月", "火", "水", "木", "金", "土"].forEach((d, i) => {
        const el = document.createElement('div');
        el.className = `day-name ${i === 0 ? 'sun' : i === 6 ? 'sat' : ''}`;
        el.innerText = d;
        grid.appendChild(el);
    });

    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    for (let i = 0; i < firstDay; i++) grid.appendChild(document.createElement('div'));

    const todayStr = new Date().toISOString().split('T')[0];
    for (let i = 1; i <= lastDate; i++) {
        const cell = document.createElement('div');
        cell.className = 'date-cell';
        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;

        const dateNum = document.createElement('span');
        dateNum.innerText = i;
        cell.appendChild(dateNum);

        if (new Date(year, month, i).getDay() === 0) cell.classList.add('sun');
        if (new Date(year, month, i).getDay() === 6) cell.classList.add('sat');
        if (holidays[dateKey]) cell.classList.add('is-holiday');
        if (dateKey === todayStr) cell.classList.add('today');

        const memosJson = localStorage.getItem(dateKey);
        if (memosJson) {
            const memos = JSON.parse(memosJson);
            const container = document.createElement('div');
            container.className = 'memo-container';
            memos.slice(0, 3).forEach(m => {
                const memoEl = document.createElement('div');
                memoEl.className = 'memo-text';
                memoEl.innerText = m;
                container.appendChild(memoEl);
            });
            cell.appendChild(container);
        }
        cell.onclick = () => openModal(dateKey);
        grid.appendChild(cell);
    }
}

function moveMonth(diff) {
    displayDate.setMonth(displayDate.getMonth() + diff);
    renderCalendar();
}

function addMemoToDate(key, text) {
    let memos = [];
    const existing = localStorage.getItem(key);
    if (existing) memos = JSON.parse(existing);
    memos.push(text);
    localStorage.setItem(key, JSON.stringify(memos));
}

function handleChat() {
    const input = document.getElementById('chatInput');
    const text = input.value;
    if (!text) return;

    const isDeleteRequest = text.includes("消し") || text.includes("削除") || text.includes("クリア");
    const rangeMatch = text.match(/(\d{1,2})[月/](\d{1,2})日?.*(?:から|〜|~|-)(?:(\d{1,2})[月/])?(\d{1,2})日?(.*)/);
    const singleMatch = text.match(/(\d{1,2})[月/](\d{1,2})日?\s*(.*)/);
    const year = displayDate.getFullYear();

    if (rangeMatch) {
        const month = parseInt(rangeMatch[1]);
        const startDay = parseInt(rangeMatch[2]);
        const endMonth = rangeMatch[3] ? parseInt(rangeMatch[3]) : month;
        const endDay = parseInt(rangeMatch[4]);
        for (let d = startDay; d <= endDay; d++) {
            const key = `${year}-${String(endMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            if (isDeleteRequest) localStorage.removeItem(key);
            else addMemoToDate(key, rangeMatch[5].replace(/[まで|は|を|に|が|予定|入れ|て|ください|です|ます]/g, "").trim() || "予定");
        }
        alert(`${endMonth}/${startDay}〜${endDay} ${isDeleteRequest ? '削除完了' : '追加しました'}`);
    } else if (singleMatch) {
        const month = parseInt(singleMatch[1]);
        const day = parseInt(singleMatch[2]);
        const key = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        if (isDeleteRequest) localStorage.removeItem(key);
        else addMemoToDate(key, singleMatch[3].replace(/[は|を|に|が|予定|入れ|て|ください|です|ます]/g, "").trim() || "予定");
        alert(`${month}/${day} ${isDeleteRequest ? '削除完了' : '追加しました'}`);
    }
    input.value = "";
    renderCalendar();
}

function openModal(key) {
    selectedDateKey = key;
    document.getElementById('dateTitle').innerText = key;
    updateMemoList();
    document.getElementById('modal').style.display = 'flex';
}

function updateMemoList() {
    const listContainer = document.getElementById('memoList');
    listContainer.innerHTML = '';
    const existing = localStorage.getItem(selectedDateKey);
    if (existing) {
        const memos = JSON.parse(existing);
        memos.forEach((memo, index) => {
            const item = document.createElement('div');
            item.className = 'memo-list-item';
            item.innerHTML = `
                <span>${memo}</span>
                <button class="item-delete-btn" onclick="deleteIndividualMemo(${index})">×</button>
            `;
            listContainer.appendChild(item);
        });
    } else {
        listContainer.innerHTML = '<p style="color:#ccc; font-size:0.8rem; text-align:center;">予定はありません</p>';
    }
}

function addNewMemo() {
    const input = document.getElementById('newMemoInput');
    const val = input.value.trim();
    if (val) {
        addMemoToDate(selectedDateKey, val);
        input.value = '';
        updateMemoList();
        renderCalendar();
    }
}

function deleteIndividualMemo(index) {
    let memos = JSON.parse(localStorage.getItem(selectedDateKey));
    memos.splice(index, 1);
    if (memos.length > 0) {
        localStorage.setItem(selectedDateKey, JSON.stringify(memos));
    } else {
        localStorage.removeItem(selectedDateKey);
    }
    updateMemoList();
    renderCalendar();
}

function closeModal() { document.getElementById('modal').style.display = 'none'; }