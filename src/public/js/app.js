const socket = io();

const welcome = document.getElementById("welcome");
const form = welcome.querySelector("form");
const room = document.getElementById("room")

let roomName = "";

room.hidden = true;

function addMessage(message) {
    const ul = room.querySelector("ul");
    const li = document.createElement("li");
    li.innerText = message;
    ul.appendChild(li);
}

function handleMessageSubmit(event) {
    event.preventDefault();
    
    const msg = room.querySelector("#msg");
    const input = msg.querySelector("input");
    
    socket.emit("new_message", input.value, roomName, () => {
        addMessage(`You: ${input.value}`);
        input.value = "";
    });
}

function handleNameSubmit(event) {
    event.preventDefault();

    const name = room.querySelector("#name");
    const input = name.querySelector("input");

    socket.emit("set_name", input.value, () => {
        addMessage(`Changed my name to ${input.value}`);
        input.value = "";
    });
}

function showRoom() {
    welcome.hidden = true;
    room.hidden = false;

    const h3 = room.querySelector("h3");
    h3.innerText = `Room ${roomName}`;

    const msgForm = room.querySelector("#msg");
    const nameForm = room.querySelector("#name");

    h3.innerText = `Room ${roomName}`;

    msgForm.addEventListener("submit", handleMessageSubmit);
    nameForm.addEventListener("submit", handleNameSubmit);
}

function handleRoomSubmit(event) {
    event.preventDefault();
    const input = form.querySelector("input");
    socket.emit("enter_room", { payload: input.value}, showRoom);
    roomName = input.value
    input.value = "";
}

form.addEventListener("submit", handleRoomSubmit);

socket.on("welcome", (name, newCount) => {
    const h3 = room.querySelector("h3");
    h3.innerText = `Room ${roomName} (${newCount})`;
    addMessage(`${name} joined!`);
});

socket.on("bye", (name, newCount) => {
    const h3 = room.querySelector("h3");
    h3.innerText = `Room ${roomName} (${newCount})`;
    addMessage(`${name} left!`);
});

socket.on("new_message", (name, message) => {
    addMessage(`${name}: ${message}`);
})

socket.on("public_room", (room_num) => {
    const h3 = welcome.querySelector("h3");
    h3.innerText = `Current rooms : ${room_num}`;
})

socket.on("room_change", (rooms) => {
    const roomList = welcome.querySelector("ul");
    
    roomList.innerHTML = "";

    /* 
    const lis = roomList.querySelectorAll("li");

    삭제하는 방식
    lis.forEach((li) => {
        li.parentNode.removeChild(li);
    });
    */

    rooms.forEach((room) => {
        const li = document.createElement("li");
        li.innerText = room;
        roomList.append(li);
    });
});