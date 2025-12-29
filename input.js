const list = document.getElementById("customerList");
const addBtn = document.getElementById("add");
const totalTicketsDisplay = document.getElementById("totalTickets");
const dateDisplay = document.getElementById("currentDateDisplay");
const prevDateBtn = document.getElementById("prevDate");
const nextDateBtn = document.getElementById("nextDate");

// 1. 상태 관리: 현재 선택된 날짜 (기본값: 오늘)
let viewDate = new Date();

// 날짜 포맷 함수 (YYYY-MM-DD) - 로컬스토리지 키 및 화면 표시용
const formatDateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// 시간 포맷 함수 (HH:mm)
const formatTime = (date) => {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

// 2. 남은 시간 계산 함수
function getRemainingTime(returnDateISO) {
    const now = new Date();
    const returnTime = new Date(returnDateISO);
    const diff = returnTime - now;

    if (diff <= 0) return "시간 종료";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return hours > 0 ? `남은 시간: ${hours}시간 ${mins}분` : `남은 시간: ${mins}분`;
}

// 3. 데이터 저장 및 불러오기 (LocalStorage)
function saveToStorage() {
    const items = [];
    document.querySelectorAll(".customer-item").forEach(li => {
        items.push({
            ski: li.dataset.ski,
            board: li.dataset.board,
            tNum: li.dataset.ticketCount,
            duration: li.dataset.duration,
            memo: li.dataset.memo,
            boardingTime: li.querySelector("small").dataset.currentBoarding,
            isCompleted: li.classList.contains("completed")
        });
    });
    localStorage.setItem(formatDateKey(viewDate), JSON.stringify(items));
}

function loadFromStorage() {
    list.innerHTML = "";
    const data = JSON.parse(localStorage.getItem(formatDateKey(viewDate)) || "[]");
    data.forEach(item => {
        createListItem(item.ski, item.board, item.tNum, item.duration, item.memo || "", new Date(item.boardingTime), item.isCompleted);
    });
    updateTotalCount();
}

// 4. 총 리프트권 개수 업데이트
function updateTotalCount() {
    let total = 0;
    document.querySelectorAll(".customer-item").forEach(li => {
        total += parseInt(li.dataset.ticketCount || 0);
    });
    if (totalTicketsDisplay) totalTicketsDisplay.textContent = total;
}

// 5. 시간 계산 및 화면 업데이트 (브레이크 타임 16:30~18:30 로직 포함)
function updateItemTimes(timeDisplay, remainingDisplay, boardingDate, durationHours) {
    let returnTime = new Date(boardingDate.getTime() + durationHours * 3600000);

    // 브레이크 타임 설정
    const breakStart = new Date(boardingDate);
    breakStart.setHours(16, 30, 0);
    const breakEnd = new Date(boardingDate);
    breakEnd.setHours(18, 30, 0);

    // 탑승 시각이 브레이크 종료 전이고, 반납 시각이 브레이크 시작 후면 2시간 연장
    if (boardingDate < breakEnd && returnTime > breakStart) {
        returnTime = new Date(returnTime.getTime() + 2 * 3600000);
    }

    timeDisplay.innerHTML = `[리프트: ${formatTime(boardingDate)}] → [반납: ${formatTime(returnTime)}]`;
    timeDisplay.dataset.currentBoarding = boardingDate.toISOString();
    timeDisplay.dataset.returnTime = returnTime.toISOString();

    remainingDisplay.textContent = getRemainingTime(returnTime.toISOString());
}

// 6. 리스트 아이템 생성 함수
function createListItem(ski, board, tNum, duration, memo, boardingDate, isCompleted = false) {
    const li = document.createElement("li");
    li.className = "customer-item";
    if (isCompleted) li.classList.add("completed");

    li.dataset.ski = ski;
    li.dataset.board = board;
    li.dataset.ticketCount = tNum;
    li.dataset.duration = duration;
    li.dataset.memo = memo;

    const contentDiv = document.createElement("div");

    // 상단 정보 (스키/보드/티켓)
    const infoText = document.createElement("div");
    infoText.className = "item-text";
    infoText.textContent = `🎿${ski} / 🏂${board} / 🎟️${tNum}개 (${duration}h)`;

    // 메모 표시
    const memoDisplay = document.createElement("div");
    memoDisplay.className = "memo-text";
    if (memo) memoDisplay.textContent = `📝 ${memo}`;

    // 시간 표시
    const timeDisplay = document.createElement("small");
    timeDisplay.style.display = "block";
    timeDisplay.style.color = "#666";

    // 남은 시간 표시
    const remainingDisplay = document.createElement("div");
    remainingDisplay.className = "remaining-time";
    remainingDisplay.style.fontSize = "13px";
    remainingDisplay.style.fontWeight = "bold";
    remainingDisplay.style.color = "#e74c3c";

    updateItemTimes(timeDisplay, remainingDisplay, boardingDate, parseInt(duration));

    contentDiv.append(infoText, memoDisplay, timeDisplay, remainingDisplay);

    // 버튼 영역
    const actionDiv = document.createElement("div");
    actionDiv.style.display = "flex";
    actionDiv.style.gap = "8px";
    actionDiv.style.alignItems = "center";

    // 수정 버튼
    const editBtn = document.createElement("button");
    editBtn.textContent = "수정";
    editBtn.className = "edit-btn";
    editBtn.onclick = () => {
        const current = new Date(timeDisplay.dataset.currentBoarding);
        const newTimeStr = prompt("탑승 시간을 수정하세요 (HH:mm)", formatTime(current));
        if (newTimeStr && /^([01]\d|2[0-3]):?([0-5]\d)$/.test(newTimeStr)) {
            const [hrs, mins] = newTimeStr.split(':');
            const newDate = new Date(boardingDate);
            newDate.setHours(parseInt(hrs), parseInt(mins), 0);
            updateItemTimes(timeDisplay, remainingDisplay, newDate, parseInt(duration));
            saveToStorage();
        }
    };

    // 삭제 버튼
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "삭제";
    deleteBtn.className = "delete-btn";
    deleteBtn.onclick = () => {
        if (confirm("정말 삭제하시겠습니까?")) {
            li.remove();
            updateTotalCount();
            saveToStorage();
        }
    };

    // 반납 체크박스
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "return-checkbox";
    checkbox.checked = isCompleted;
    checkbox.addEventListener("change", () => {
        li.classList.toggle("completed", checkbox.checked);
        saveToStorage();
    });

    const label = document.createElement("label");
    label.className = "return-label";
    label.textContent = "반납";
    label.prepend(checkbox);

    actionDiv.append(editBtn, deleteBtn, label);
    li.append(contentDiv, actionDiv);
    list.appendChild(li);
}

// 7. 추가 버튼 클릭 이벤트
addBtn.addEventListener("click", () => {
    const skiInput = document.getElementById("skiNum");
    const boardInput = document.getElementById("boardNum");
    const tickettime = document.getElementById("tickettime");
    const ticketNum = document.getElementById("ticketNum");
    const memoInput = document.getElementById("memoInput");

    const ski = skiInput.value || "0";
    const board = boardInput.value || "0";
    const duration = tickettime.value;
    const tNum = ticketNum.value || "0";
    const memo = memoInput.value || "";

    // 오늘 날짜인 경우 현재 시각 기준, 다른 날짜인 경우 해당 날짜의 기본 시각 기준
    const boardingDate = new Date(viewDate);
    const now = new Date();
    boardingDate.setHours(now.getHours(), now.getMinutes() + 20, 0);

    createListItem(ski, board, tNum, duration, memo, boardingDate);
    updateTotalCount();
    saveToStorage();

    // 입력창 초기화
    skiInput.value = "";
    boardInput.value = "";
    ticketNum.value = "";
    memoInput.value = "";
});

// 8. 날짜 네비게이션 이벤트
prevDateBtn.onclick = () => {
    viewDate.setDate(viewDate.getDate() - 1);
    updateDateView();
};

nextDateBtn.onclick = () => {
    viewDate.setDate(viewDate.getDate() + 1);
    updateDateView();
};

function updateDateView() {
    dateDisplay.textContent = formatDateKey(viewDate);
    loadFromStorage();
}

// 9. 초기화 및 타이머 설정
updateDateView();

// 1분마다 남은 시간 갱신
setInterval(() => {
    document.querySelectorAll(".customer-item").forEach(item => {
        const timeDisplay = item.querySelector("small");
        const remainingDisplay = item.querySelector(".remaining-time");
        if (timeDisplay && remainingDisplay) {
            remainingDisplay.textContent = getRemainingTime(timeDisplay.dataset.returnTime);
        }
    });
}, 60000);