import Phaser from "phaser";
import { io } from "socket.io-client";

const socket = io("http://localhost:3000");

// Массив случайных имен
const randomNames = ["TitanSlayer", "SkyWalker", "IronShield", "DarkHunter", "ThunderFury"];

// Генерация случайного имени
const randomName = randomNames[Math.floor(Math.random() * randomNames.length)];

// Сцена меню
class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: "MenuScene" });
  }

  preload() {
    // Здесь можно загрузить фон или шрифты для меню, если нужно
  }

  create() {
    // Название игры
    this.add.text(250, 150, "БИТКА ТИТАНОВ", { 
      font: "48px Arial", 
      fill: "#ffffff", 
      fontStyle: "bold" 
    });

    // Отображение случайного имени
    this.add.text(300, 220, `Ваше имя: ${randomName}`, { 
      font: "24px Arial", 
      fill: "#ffffff" 
    });

    // Кнопка "Искать соперника"
    const searchButton = this.add.dom(400, 300, "button", {
      width: "200px",
      height: "50px",
      backgroundColor: "#4CAF50",
      color: "white",
      border: "none",
      borderRadius: "5px",
      fontSize: "18px",
      cursor: "pointer",
    }, "Искать соперника");

    searchButton.addListener("click");
    searchButton.on("click", () => {
      searchButton.node.disabled = true; // Блокируем кнопку
      this.add.text(350, 400, "Поиск соперника...", { font: "20px Arial", fill: "#ffffff" });

      // Сообщаем серверу о начале поиска
      socket.emit("findOpponent", { name: randomName });

      // Ждём ответа от сервера
      socket.on("start", (data) => {
        this.scene.start("GameScene", { health: data.health, name: randomName, opponentName: data.opponentName });
      });

      socket.on("waiting", (data) => {
        this.add.text(350, 450, data.message, { font: "16px Arial", fill: "#ffffff" });
      });
    });
  }
}

// Сцена игры (изменения в отображении имени игрока и противника)
class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameScene" });
    this.health = 100;
    this.enemyHealth = 100;
    this.playerName = null;
    this.opponentName = null;
  }

  preload() {}

  create(data) {
    this.playerName = data.name;
    this.opponentName = data.opponentName;

    // Отображение имени игрока
    this.add.text(100, 20, `Игрок: ${this.playerName}`, { font: "16px Arial", fill: "#ffffff" });

    // Отображение имени противника
    this.add.text(500, 20, `Противник: ${this.opponentName}`, { font: "16px Arial", fill: "#ffffff" });

    // Полоска здоровья игрока
    this.healthBar = this.add.graphics();
    this.healthBar.fillStyle(0x00ff00, 1);
    this.healthBar.fillRect(100, 50, 200, 10);
    this.add.text(100, 70, "Your Health", { font: "16px Arial", fill: "#ffffff" });

    // Полоска здоровья противника
    this.enemyHealthBar = this.add.graphics();
    this.enemyHealthBar.fillStyle(0xff0000, 1);
    this.enemyHealthBar.fillRect(500, 50, 200, 10);
    this.add.text(500, 70, "Enemy Health", { font: "16px Arial", fill: "#ffffff" });

    // Остальная логика игры...
  }
}

// Конфигурация Phaser
const config = {
  type: Phaser.AUTO,
  parent: "game-container",
  width: 800,
  height: 600,
  backgroundColor: "#2d2d2d",
  scene: [MenuScene, GameScene],
  dom: { createContainer: true },
};

const game = new Phaser.Game(config);
