import Phaser from "phaser";
import { io } from "socket.io-client";

const socket = io("http://localhost:3000");

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: "GameScene" });
        this.health = 100;
        this.enemyHealth = 100;
        this.inputField = null;
        this.attackButton = null;
        this.healthBar = null;
        this.enemyHealthBar = null;
        this.statusText = null;
    }

    preload() {
        // Загрузим сюда только базовые элементы, если нужно, изображения, шрифты и прочее
    }

    create() {
        // Полоска здоровья игрока
        this.healthBar = this.add.graphics();
        this.healthBar.fillStyle(0x00ff00, 1); // Зеленый цвет для здоровья
        this.healthBar.fillRect(100, 50, 200, 10); // Рисуем прямоугольник для здоровья игрока
        this.add.text(150, 20, "Your Health:", { font: "16px Arial", fill: "#ffffff" });

        // Полоска здоровья противника
        this.enemyHealthBar = this.add.graphics();
        this.enemyHealthBar.fillStyle(0xff0000, 1); // Красный цвет для здоровья противника
        this.enemyHealthBar.fillRect(500, 50, 200, 10); // Рисуем прямоугольник для здоровья противника
        this.add.text(550, 20, "Enemy Health:", { font: "16px Arial", fill: "#ffffff" });

        console.log('healthBar', this.healthBar);
        console.log('enemyHealthBar', this.enemyHealthBar);
        
        // Текст статуса
        this.statusText = this.add.text(300, 100, "Connecting...", { font: "20px Arial", fill: "#ffffff" });

        // Поле ввода
        this.inputField = this.add.dom(400, 300, "input", {
            type: "number",
            min: "0",
            max: "100",
            placeholder: "Enter attack value (0-100)",
            width: "200px",
            height: "30px",
            border: "1px solid #ccc",
            borderRadius: "5px",
        });

        // Кнопка "Ударить"
        this.attackButton = this.add.dom(
            400,
            350,
            "button",
            {
                width: "150px",
                height: "40px",
                backgroundColor: "#4CAF50",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
            },
            "Attack"
        );

        this.attackButton.addListener("click");
        this.attackButton.on("click", () => {
            const attackValue = parseInt(this.inputField.node.value, 10);
            if (!isNaN(attackValue) && attackValue >= 0 && attackValue <= 100) {
                socket.emit("attack", attackValue);
                this.inputField.node.value = ""; // Очистить поле ввода
            } else {
                alert("Enter a valid attack value (0-100)");
            }
        });

        // Обработка начала игры
        socket.on('start', (data) => {
          this.statusText.setText('Opponent found!');
          this.health = data.health;
        
          // Указываем координаты для игрока
          this.updateHealthBar(this.healthBar, this.health);
        });

        // Обработка ожидания
        socket.on("waiting", (data) => {
            this.statusText.setText(data.message);
        });

        // Обновление здоровья игрока
        socket.on("update", (data) => {
            this.health = data.health;
            this.updateHealthBar(this.healthBar, this.health, 100, 50); // Координаты для полоски игрока

            if (this.health <= 0) {
                alert("You lost!");
                socket.disconnect();
            }
        });

        // Обновление здоровья противника
        socket.on("updateEnemyHealth", (data) => {
            this.enemyHealth = data.health;
            this.updateHealthBar(this.enemyHealthBar, this.enemyHealth, 500, 50); // Координаты для полоски противника

            if (this.enemyHealth <= 0) {
                alert("You won!");
                socket.disconnect();
            }
        });

        // Обработка конца игры
        socket.on("gameOver", (data) => {
            alert(data.message);
            socket.disconnect();
            this.attackButton.node.disabled = true;
            this.statusText.setText("Game Over");
        });
    }

    // Метод для обновления полоски здоровья
    updateHealthBar(bar, health, x, y) {
        bar.clear(); // Очищаем предыдущий прямоугольник
        if (bar === this.healthBar) {
            bar.fillStyle(0x00ff00, 1); // Зеленая полоска для игрока
        } else {
            bar.fillStyle(0xff0000, 1); // Красная полоска для противника
        }

        console.log(bar, x, y);
        

        // Перерисовываем прямоугольник с новыми координатами
        bar.fillRect(x, y, (health / 100) * 200, 10); // Пропорционально здоровью
    }
}

const config = {
    type: Phaser.AUTO,
    parent: "game-container", // Указываем ID контейнера
    width: 800,
    height: 600,
    backgroundColor: "#2d2d2d",
    scene: GameScene,
    dom: { createContainer: true }, // Включаем поддержку DOM
};

const game = new Phaser.Game(config);
