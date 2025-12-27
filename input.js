const list = document.getElementById("customerList");
const addBtn = document.getElementById("add");

addBtn.addEventListener("click", () => {
    const skiInput = document.getElementById("skiNum");
    const boardInput = document.getElementById("boardNum");
    const tickettime = document.getElementById("tickettime");
    const ticketNum = document.getElementById("ticketNum");


    const list = document.getElementById("customerList");
    const li = document.createElement("li");

    const text = document.createElement("span");
    text.textContent = `${skiInput.value} 스키 / ${boardInput.value} 보드/ ${tickettime.value}시간권 / ${ticketNum.value}개`;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";

    li.appendChild(text);
    li.appendChild(checkbox);

    list.appendChild(li);


    skiInput.value = "";
    boardInput.value = "";
    ticketNum.value = "";
});

