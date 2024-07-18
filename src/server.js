import http from "http"
import WebSocket from "ws";
import express from "express";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname+"/public"));
app.get("/", (req, res) => res.render("home"));
app.get("/*", (req, res) => res.redirect("/"));

const handleListen = () => console.log(`Listening on http://localhost:3000`);

// run on same port
const server = http.createServer(app);
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

server.listen(4000, handleListen);