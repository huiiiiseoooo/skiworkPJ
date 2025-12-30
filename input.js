// ==========================================
// 1. 설정 (본인의 정보로 반드시 수정하세요)
// ==========================================
const GEMINI_API_KEY = "AIzaSyBRhJZ56ev9lRFzVjPubA8uopFtwcpeNkg";
const firebaseConfig = {
    databaseURL: "https://skiwork-default-rtdb.firebaseio.com/"
};

// Firebase 초기화
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// DOM 요소 참조
const list = document.getElementById("customerList");
const addBtn = document.getElementById("add");
const totalTicketsDisplay = document.getElementById("totalTickets");
const dateDisplay = document.getElementById("currentDateDisplay");
const prevDateBtn = document.getElementById("prevDate");
const nextDateBtn = document.getElementById("nextDate");

let viewDate = new Date();

// ==========================================
// 2. 유틸리티 함수
// ==========================================
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

function updateTotalCount() {
    let total = 0;
    document.querySelectorAll(".customer-item").forEach(li => {
        total += parseInt(li.dataset.ticketCount || 0);
    });
    if (totalTicketsDisplay) totalTicketsDisplay.textContent = total;
}

// ==========================================
// 3. AI 분석 및 데이터 처리
// ==========================================

// Gemini AI에게 메시지 분석 요청
async function analyzeWithAI(rawText) {
    const prompt = `
    다음은 스키장 예약 카톡 내용이야. 여기서 [스키 대수, 보드 대수, 시간권(숫자만), 리프트권 총 개수, 메모]를 추출해서 JSON 형식으로만 응답해줘. 
    오탈자가 있어도 문맥상 이해해서 숫자를 뽑아줘. 리프트권은 대인/소인 합계를 구해줘.
    형식: {"ski": 숫자, "board": 숫자, "duration": 숫자, "tNum": 숫자, "memo": "분석된 요약 내용"}
    내용: "${rawText}"
    `;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await response.json();
        const resultText = data.candidates[0].content.parts[0].text;
        return JSON.parse(resultText.replace(/```json|```/g, ""));
    } catch (e) {
        console.error("AI 분석 실패:", e);
        return null;
    }
}

// Firebase 리스너: 맥북 봇이 보낸 원문 메시지 감시
db.ref('raw_messages').on('child_added', async (snapshot) => {
    const rawData = snapshot.val();
    const parsedData = await analyzeWithAI(rawData.content);

    if (parsedData) {
        const boardDate = new Date();
        boardDate.setMinutes(boardDate.getMinutes() + 20);

        // 분석된 데이터를 Firebase 확정 목록에 저장
        const finalData = {
            ...parsedData,
            boardingTime: boardDate.toISOString(),
            regDate: formatDateKey(new Date()),
            isCompleted: false
        };
        db.ref('rentals').push(finalData);

        // 처리된 원문은 삭제
        db.ref('raw_messages').child(snapshot.key).remove();
    }
});

// Firebase 리스너: 확정된 렌탈 목록 감시 (화면 업데이트)
db.ref('rentals').on('child_added', (snapshot) => {
    const item = snapshot.val();
    if (item.regDate === formatDateKey(viewDate)) {
        createListItem(item.ski, item.board, item.tNum, item.duration, item.memo, new Date(item.boardingTime), item.isCompleted, snapshot.key);
    }
});

// ==========================================
// 4. UI 생성 및 관리
// ==========================================

function updateItemTimes(timeDisplay, remainingDisplay, boardingDate, durationHours) {
    let returnTime = new Date(boardingDate.getTime() + durationHours * 3600000);
    const bStart = new Date(boardingDate); bStart.setHours(16, 30, 0);
    const bEnd = new Date(boardingDate); bEnd.setHours(18, 30, 0);

    // 브레이크 타임 연장 로직
    if (boardingDate < bEnd && returnTime > bStart) {
        returnTime = new Date(returnTime.getTime() + 2 * 3600000);
    }

    timeDisplay.innerHTML = `[리프트: ${formatTime(boardingDate)}] → [반납: ${formatTime(returnTime)}]`;
    timeDisplay.dataset.returnTime = returnTime.toISOString();
    remainingDisplay.textContent = getRemainingTime(returnTime.toISOString());
}

function createListItem(ski, board, tNum, duration, memo, boardingDate, isCompleted, dbKey) {
    const li = document.createElement("li");
    li.className = "customer-item";
    if (isCompleted) li.classList.add("completed");
    li.dataset.ticketCount = tNum;

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

    // 삭제 버튼
    const delBtn = document.createElement("button");
    delBtn.textContent = "삭제";
    delBtn.className = "delete-btn";
    delBtn.onclick = () => {
        if(confirm("삭제하시겠습니까?")) {
            db.ref('rentals').child(dbKey).remove();
            li.remove();
            updateTotalCount();
        }
    };

    // 반납 체크박스
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "return-checkbox";
    checkbox.checked = isCompleted;
    checkbox.onchange = () => {
        li.classList.toggle("completed", checkbox.checked);
        db.ref('rentals').child(dbKey).update({ isCompleted: checkbox.checked });
    };

    const label = document.createElement("label");
    label.className = "return-label";
    label.innerHTML = "반납";
    label.prepend(checkbox);

    actionArea.append(delBtn, label);
    li.append(contentDiv, actionArea);
    list.appendChild(li);
    updateTotalCount();
}

// 수동 추가 버튼
addBtn.onclick = () => {
    const s = document.getElementById("skiNum").value || "0";
    const b = document.getElementById("boardNum").value || "0";
    const d = document.getElementById("tickettime").value;
    const t = document.getElementById("ticketNum").value || "0";
    const m = document.getElementById("memoInput").value || "";

    const boardDate = new Date();
    boardDate.setMinutes(boardDate.getMinutes() + 20);

    const newData = {
        ski: s, board: b, tNum: t, duration: d, memo: m,
        boardingTime: boardDate.toISOString(),
        regDate: formatDateKey(viewDate),
        isCompleted: false
    };

    db.ref('rentals').push(newData);

    // 입력창 초기화
    document.getElementById("skiNum").value = "";
    document.getElementById("boardNum").value = "";
    document.getElementById("ticketNum").value = "";
    document.getElementById("memoInput").value = "";
};

// 날짜 이동
prevDateBtn.onclick = () => { viewDate.setDate(viewDate.getDate() - 1); updateDateView(); };
nextDateBtn.onclick = () => { viewDate.setDate(viewDate.getDate() + 1); updateDateView(); };

function updateDateView() {
    dateDisplay.textContent = formatDateKey(viewDate);
    list.innerHTML = "";
    // 해당 날짜 데이터만 다시 불러오기
    db.ref('rentals').orderByChild('regDate').equalTo(formatDateKey(viewDate)).once('value', (snapshot) => {
        snapshot.forEach((child) => {
            const item = child.val();
            createListItem(item.ski, item.board, item.tNum, item.duration, item.memo, new Date(item.boardingTime), item.isCompleted, child.key);
        });
    });
}

// 초기 실행
updateDateView();
setInterval(() => {
    document.querySelectorAll(".customer-item").forEach(item => {
        const timeDisp = item.querySelector("small");
        const remainDisp = item.querySelector(".remaining-time");
        if (timeDisp && remainDisp) remainDisp.textContent = getRemainingTime(timeDisp.dataset.returnTime);
    });
}, 60000);