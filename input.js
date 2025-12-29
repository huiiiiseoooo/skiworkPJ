const list = document.getElementById("customerList");
const addBtn = document.getElementById("add");

addBtn.addEventListener("click", () => {
    const skiInput = document.getElementById("skiNum");
    const boardInput = document.getElementById("boardNum");
    const tickettime = document.getElementById("tickettime");
    const ticketNum = document.getElementById("ticketNum");

    // 1. 새로운 리스트 아이템(li) 생성 및 클래스 부여
    const li = document.createElement("li");
    li.className = "customer-item";

    // 2. 텍스트 정보 생성
    const text = document.createElement("span");
    text.className = "item-text";
    text.textContent = `🎿 스키 ${skiInput.value} / 🏂 보드 ${boardInput.value} / 🕒 ${tickettime.value}시간권 / 🎟️ ${ticketNum.value}개`;

    // 3. 체크박스 생성
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "return-checkbox";

    // 체크 시 부모 요소(li)의 스타일도 함께 변경되도록 수정
    checkbox.addEventListener("change", () => {
        if (checkbox.checked) {
            li.classList.add("completed");
        } else {
            li.classList.remove("completed");
        }
    });

    // 4. 라벨 생성
    const label = document.createElement("label");
    label.className = "return-label";
    label.textContent = "반납";
    label.prepend(checkbox);

    // 5. 합치기
    li.appendChild(text);
    li.appendChild(label);
    list.appendChild(li);

    // 입력창 초기화
    skiInput.value = "";
    boardInput.value = "";
    ticketNum.value = "";
    // tickettime은 보통 select인 경우가 많아 필요시 초기화 코드 추가
});s
