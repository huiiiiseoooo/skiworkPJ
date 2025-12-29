const list = document.getElementById("customerList");
const addBtn = document.getElementById("add");
const totalTicketsDisplay = document.getElementById("totalTickets");
const dateDisplay = document.getElementById("currentDateDisplay");
const prevDateBtn = document.getElementById("prevDate");
const nextDateBtn = document.getElementById("nextDate");

let viewDate = new Date(); // 접속한 시점의 오늘 날짜

const formatDateKey = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const formatTime = (date) => `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

function getRemainingTime(returnDateISO) {
    const diff = new Date(returnDateISO) - new Date();
    if (diff <= 0) return "시간 종료";
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return h > 0 ? `남은 시간: ${h}시간 ${m}분` : `남은 시간: ${m}분`;
}

function saveToStorage() {
    const items = [];
    document.querySelectorAll(".customer-item").forEach(li => {
        items.push({
            ski: li.dataset.ski, board: li.dataset.board, tNum: li.dataset.ticketCount,
            duration: li.dataset.duration, memo: li.dataset.memo,
            boardingTime: li.querySelector("small").dataset.currentBoarding,
            isCompleted: li.classList.contains("completed")
        });
    });
    localStorage.setItem(formatDateKey(viewDate), JSON.stringify(items));
}

function loadFromStorage() {
    list.innerHTML = "";
    const data = JSON.parse(localStorage.getItem(formatDateKey(viewDate)) || "[]");
    data.forEach(item => createListItem(item.ski, item.board, item.tNum, item.duration, item.memo || "", new Date(item.boardingTime), item.isCompleted));
    updateTotalCount();
}

function updateTotalCount() {
    let total = 0;
    document.querySelectorAll(".customer-item").forEach(li => total += parseInt(li.dataset.ticketCount || 0));
    if (totalTicketsDisplay) totalTicketsDisplay.textContent = total;
}

function updateItemTimes(timeDisplay, remainingDisplay, boardingDate, durationHours) {
    let returnTime = new Date(boardingDate.getTime() + durationHours * 3600000);
    const bStart = new Date(boardingDate); bStart.setHours(16, 30, 0);
    const bEnd = new Date(boardingDate); bEnd.setHours(18, 30, 0);

    if (boardingDate < bEnd && returnTime > bStart) returnTime = new Date(returnTime.getTime() + 2 * 3600000);

    timeDisplay.innerHTML = `[리프트: ${formatTime(boardingDate)}] → [반납: ${formatTime(returnTime)}]`;
    timeDisplay.dataset.currentBoarding = boardingDate.toISOString();
    timeDisplay.dataset.returnTime = returnTime.toISOString();
    remainingDisplay.textContent = getRemainingTime(returnTime.toISOString());
}

function createListItem(ski, board, tNum, duration, memo, boardingDate, isCompleted = false) {
    const li = document.createElement("li");
    li.className = "customer-item";
    if (isCompleted) li.classList.add("completed");

    li.dataset.ski = ski; li.dataset.board = board; li.dataset.ticketCount = tNum;
    li.dataset.duration = duration; li.dataset.memo = memo;

    const contentDiv = document.createElement("div");
    contentDiv.innerHTML = `
        <div class="item-text">🎿${ski} / 🏂${board} / 🎟️${tNum}개 (${duration}h)</div>
        ${memo ? `<div class="memo-text">📝 ${memo}</div>` : ''}
    `;

    const timeDisplay = document.createElement("small");
    const remainingDisplay = document.createElement("div");
    remainingDisplay.className = "remaining-time";
    updateItemTimes(timeDisplay, remainingDisplay, boardingDate, parseInt(duration));

    contentDiv.append(timeDisplay, remainingDisplay);

    const actionArea = document.createElement("div");
    actionArea.className = "action-area";

    const editBtn = document.createElement("button");
    editBtn.textContent = "수정";
    editBtn.className = "edit-btn";
    editBtn.onclick = () => {
        const current = new Date(timeDisplay.dataset.currentBoarding);
        const newTime = prompt("탑승 시간 수정 (HH:mm)", formatTime(current));
        if (newTime && /^([01]\d|2[0-3]):?([0-5]\d)$/.test(newTime)) {
            const [h, m] = newTime.split(':');
            const newDate = new Date(boardingDate); newDate.setHours(h, m, 0);
            updateItemTimes(timeDisplay, remainingDisplay, newDate, parseInt(duration));
            saveToStorage();
        }
    };

    const delBtn = document.createElement("button");
    delBtn.textContent = "삭제";
    delBtn.className = "delete-btn";
    delBtn.onclick = () => { if(confirm("삭제하시겠습니까?")) { li.remove(); updateTotalCount(); saveToStorage(); } };

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "return-checkbox";
    checkbox.checked = isCompleted;
    checkbox.onchange = () => { li.classList.toggle("completed", checkbox.checked); saveToStorage(); };

    const label = document.createElement("label");
    label.className = "return-label";
    label.innerHTML = "반납";
    label.prepend(checkbox);

    actionArea.append(editBtn, delBtn, label);
    li.append(contentDiv, actionArea);
    list.appendChild(li);
}

addBtn.onclick = () => {
    const s = document.getElementById("skiNum").value || "0";
    const b = document.getElementById("boardNum").value || "0";
    const d = document.getElementById("tickettime").value;
    const t = document.getElementById("ticketNum").value || "0";
    const m = document.getElementById("memoInput").value;

    const boardDate = new Date();
    boardDate.setMinutes(boardDate.getMinutes() + 20); // 현재+20분

    createListItem(s, b, t, d, m, boardDate);
    updateTotalCount();
    saveToStorage();

    // 초기화
    document.getElementById("skiNum").value = "";
    document.getElementById("boardNum").value = "";
    document.getElementById("ticketNum").value = "";
    document.getElementById("memoInput").value = "";
};

prevDateBtn.onclick = () => { viewDate.setDate(viewDate.getDate() - 1); updateDateView(); };
nextDateBtn.onclick = () => { viewDate.setDate(viewDate.getDate() + 1); updateDateView(); };

function updateDateView() {
    dateDisplay.textContent = formatDateKey(viewDate);
    loadFromStorage();
}

updateDateView();
setInterval(() => {
    document.querySelectorAll(".customer-item").forEach(item => {
        const timeDisp = item.querySelector("small");
        const remainDisp = item.querySelector(".remaining-time");
        if (timeDisp && remainDisp) remainDisp.textContent = getRemainingTime(timeDisp.dataset.returnTime);
    });
}, 60000);