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
    this.searchButton = null; // Ссылка на кнопку
    this.loader = null; // Ссылка на лоадер
  }

  preload() {
    // Загрузка элементов, если нужно
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
    this.searchButton = this.add.dom(400, 300, "button", {
      width: "200px",
      height: "50px",
      backgroundColor: "#4CAF50",
      color: "white",
      border: "none",
      borderRadius: "5px",
      fontSize: "18px",
      cursor: "pointer",
    }, "Искать соперника");

    this.searchButton.addListener("click");
    this.searchButton.on("click", () => {
      // Блокируем кнопку и показываем лоадер
      this.showLoader();

      // Сообщаем серверу о начале поиска
      socket.emit("findOpponent", { name: randomName });

      // Ждем ответа от сервера
      socket.on("start", (data) => {
        this.scene.start("GameScene", { health: data.health, name: randomName, opponentName: data.opponentName });
      });

      socket.on("waiting", (data) => {
        this.add.text(350, 450, data.message, { font: "16px Arial", fill: "#ffffff" });
      });
    });
  }

  // Метод для показа лоадера
  showLoader() {
    // Удаляем кнопку
    this.searchButton.destroy();

    // Создаем DOM-элемент для лоадера
    this.loader = this.add.dom(400, 300, 'div', {
      width: '50px',
      height: '50px',
      border: '5px solid #f3f3f3',
      borderTop: '5px solid #4CAF50',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
    });

    // Добавляем стили для анимации
    const style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.getElementsByTagName('head')[0].appendChild(style);
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
    this.inputField = null;
    this.attackButton = null;
    this.healthBar = null;
    this.enemyHealthBar = null;
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

    // Поле ввода для атаки
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
