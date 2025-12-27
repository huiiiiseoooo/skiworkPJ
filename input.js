const list = document.getElementById("customerList");
const addBtn = document.getElementById("add");

addBtn.addEventListener("click", () => {
    const skiInput = document.getElementById("skiNum");
    const boardInput = document.getElementById("boardNum");
    const tickettime = document.getElementById("tickettime");
    const ticketNum = document.getElementById("ticketNum");



    const li = document.createElement("li");
    li.textContent = `${skiInput.value} 스키 / ${boardInput.value} 보드/ ${tickettime.value}시간권 / ${ticketNum.value}개`;

    list.appendChild(li);

    skiInput.value = "";
    boardInput.value = "";
    ticketNum.value = "";
});

