const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const cors = require("cors");
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173", // Разрешить подключение с клиента
        methods: ["GET", "POST"], // Разрешённые методы
    },
});

// Хранение данных игроков
const players = {};
let waitingPlayer = null;

// Обработка подключений
io.on("connection", (socket) => {
    console.log(`Player connected: ${socket.id}`);

    // Инициализация игрока
    players[socket.id] = { health: 100, attack: null };
    let opponent = null;

    // Проверка, есть ли игрок, ожидающий в очереди
    if (waitingPlayer) {
        opponent = waitingPlayer;
        players[socket.id].opponent = opponent;
        players[opponent].opponent = socket.id;
        waitingPlayer = null;

        // Уведомляем игроков о начале игры
        io.to(socket.id).emit("start", { message: "Opponent found!", health: players[socket.id].health });
        io.to(opponent).emit("start", { message: "Opponent found!", health: players[opponent].health });

        // Отправляем сообщение о начале игры
        io.to(socket.id).emit("waiting", { message: "Opponent found!" });
        io.to(opponent).emit("waiting", { message: "Opponent found!" });
    } else {
        waitingPlayer = socket.id;
        socket.emit("waiting", { message: "Waiting for an opponent..." });
    }

    // Обработка получения атаки
    socket.on("attack", (value) => {
        if (!players[socket.id].opponent) return;

        players[socket.id].attack = value;

        const opponentId = players[socket.id].opponent;
        if (players[opponentId] && players[opponentId].attack !== null) {
            // Вычисление здоровья обоих игроков
            players[socket.id].health -= players[opponentId].attack;
            players[opponentId].health -= players[socket.id].attack;

            // Сбрасываем атаки
            players[socket.id].attack = null;
            players[opponentId].attack = null;

            // Отправляем обновления обоим игрокам
            io.to(socket.id).emit("update", { health: players[socket.id].health });
            io.to(opponentId).emit("update", { health: players[opponentId].health });

            io.to(socket.id).emit("updateEnemyHealth", { health: players[opponentId].health });
            io.to(opponentId).emit("updateEnemyHealth", { health: players[socket.id].health });

            // Проверяем конец игры
            if (players[socket.id].health <= 0 || players[opponentId].health <= 0) {
                io.to(socket.id).emit("gameOver", {
                    message: players[socket.id].health <= 0 ? "You lost!" : "You won!",
                });
                io.to(opponentId).emit("gameOver", {
                    message: players[opponentId].health <= 0 ? "You lost!" : "You won!",
                });

                delete players[socket.id];
                delete players[opponentId];
            }
        }
    });

    // Обработка отключения игрока
    socket.on("disconnect", () => {
        console.log(`Player disconnected: ${socket.id}`);
        const opponentId = players[socket.id]?.opponent;
        if (opponentId && players[opponentId]) {
            io.to(opponentId).emit("gameOver", { message: "Opponent disconnected. You win!" });
            delete players[opponentId];
        }
        delete players[socket.id];
        if (waitingPlayer === socket.id) waitingPlayer = null;
    });
});

// Запуск сервера
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
