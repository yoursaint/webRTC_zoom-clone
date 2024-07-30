import http from "http"
import { Server } from "socket.io"
import express from "express";

import { instrument } from "@socket.io/admin-ui";

import { Socket } from "dgram";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname+"/public"));
app.get("/", (req, res) => res.render("home"));
//app.get("/*", (req, res) => res.redirect("/"));

const handleListen = () => console.log(`Listening on http://localhost`);

// run on same port
const httpServer = http.createServer(app);
const ioServer = new Server(httpServer, {
    cors: {
      origin: ["https://admin.socket.io"],
      credentials: true
    }
  });

  instrument(ioServer, {
    auth: false,
    mode: "development",
  });
  

function publicRooms() {
    const {
        sockets: {
            adapter: {sids, rooms},
        },
    } = ioServer;

    const publicRooms = [];
    rooms.forEach((_,key) => {
        if (sids.get(key) === undefined) {
            publicRooms.push(key);
        }
    });

    return publicRooms;
}

function countRoom(roomName) {
    return ioServer.sockets.adapter.rooms.get(roomName)?.size;
}

ioServer.on("connection", socket => {
    socket["name"] = "Anonymous"
    socket.emit("public_room", publicRooms().length);
    socket.emit("room_change", publicRooms());

    socket.onAny((event) => {
        console.log(`Socket Event: ${event}`); 
    });
    socket.on("enter_room", (roomName, done) => {
        socket.join(roomName.payload);
        done();
        socket.to(roomName.payload).emit("welcome", socket.name, countRoom(roomName.payload));
        ioServer.sockets.emit("room_change", publicRooms());
    });
    socket.on("disconnecting", () => {
        socket.rooms.forEach(room => 
            socket.to(room).emit("bye", socket.name, countRoom(room) - 1)
        );
        ioServer.sockets.emit("room_change", publicRooms());
        ioServer.sockets.emit("public_room", publicRooms().length);
    });
    socket.on("new_message", (message, roomName, done) => {
        socket.to(roomName).emit("new_message", socket.name, message);
        done();
    });
    socket.on("set_name", (name, done) => {
        socket["name"] = name;
        done();
    });
});

/*
const wss = new WebSocket.Server({ server });
const sockets = [];

wss.on("connection", (socket) => {
    socket["nickname"] = "anonymous"
    sockets.push(socket);
    console.log("Connected to Browser ✅");
    socket.on("close", () => {console.log("Disconnected from Browser ❎")});
    socket.on("message", msg => {
        const message = JSON.parse(msg);
        
        switch(message.type) {
            case "message":
                for (const aSocket_num in sockets) {
                    if (!(sockets[aSocket_num].nickname === socket.nickname))
                        sockets[aSocket_num].send(`${socket.nickname}: ${message.payload}`);
                }

            case "nickname":
                socket["nickname"] = message.payload;
        }
    })
})
*/

httpServer.listen(80, handleListen);