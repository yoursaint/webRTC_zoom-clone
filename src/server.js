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
const ioServer = new Server(httpServer);

ioServer.on("connection", socket => {
    socket.on("join_room", (roomName, done) => {
        socket.join(roomName);
        socket.to(roomName).emit("welcome");
    });

    socket.on("offer", (roomName, offer) => {
        socket.to(roomName).emit("offer", offer);
    });

    socket.on("answer", (roomName, answer) => {
        socket.to(roomName).emit("answer", answer);
    });

    socket.on("ice", (roomName, ice) => {
        socket.to(roomName).emit("ice", ice);
    });
});

httpServer.listen(80, handleListen);