import Phaser from 'phaser';
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

const config = {
	type: Phaser.AUTO,
	width: 800,
	height: 600,
	backgroundColor: '#2d2d2d',
	scene: {
		preload,
		create,
		update,
	},
};

const game = new Phaser.Game(config);

let health = 100;
let enemyHealth = 100;
let inputField;
let attackButton;
let healthBar;
let enemyHealthBar;
let statusText;

function preload() {
	// Загрузим сюда только базовые элементы
}

function create() {
	// Полоска здоровья игрока
	healthBar = this.add.graphics();
	healthBar.fillStyle(0x00ff00, 1); // Зеленый цвет для здоровья
	healthBar.fillRect(150, 50, 400, 30); // Рисуем прямоугольник

	this.add.text(150, 20, 'Your Health:', { font: '16px Arial', fill: '#ffffff' });

	// Полоска здоровья противника
	enemyHealthBar = this.add.graphics();
	enemyHealthBar.fillStyle(0xff0000, 1); // Красный цвет для здоровья противника
	enemyHealthBar.fillRect(150, 100, 400, 30); // Рисуем прямоугольник

	this.add.text(550, 20, 'Enemy Health:', { font: '16px Arial', fill: '#ffffff' });

	// Текст статуса
	statusText = this.add.text(300, 100, 'Connecting...', { font: '20px Arial', fill: '#ffffff' });

	// Поле ввода
	inputField = this.add.dom(400, 300, 'input', {
		type: 'number',
		min: '0',
		max: '100',
		placeholder: 'Enter attack value (0-100)',
	});

	// Кнопка "Ударить"
	attackButton = this.add.dom(400, 350, 'button', null, 'Attack');
	attackButton.addListener('click');
	attackButton.on('click', () => {
		const attackValue = parseInt(inputField.node.value, 10);
		if (!isNaN(attackValue) && attackValue >= 0 && attackValue <= 100) {
			socket.emit('attack', attackValue);
			inputField.node.value = '';
		} else {
			alert('Enter a valid attack value (0-100)');
		}
	});

	// Обработка начала игры
	socket.on('start', (data) => {
		statusText.setText('Opponent found!');
		health = data.health;
		updateHealthBar(healthBar, health);
	});

	// Обработка ожидания
	socket.on('waiting', (data) => {
		statusText.setText(data.message);
	});

	// Обработка обновления здоровья
	socket.on('update', (data) => {
		health = data.health;
		updateHealthBar(healthBar, health);

		// Проверяем проигрыш
		if (health <= 0) {
			alert('You lost!');
			socket.disconnect();
		}
	});

	// Обновление здоровья противника
	socket.on('updateEnemyHealth', (data) => {
		enemyHealth = data.health;
		updateHealthBar(enemyHealthBar, enemyHealth);

		// Проверяем победу
		if (enemyHealth <= 0) {
			alert('You won!');
			socket.disconnect();
		}
	});

	// Обработка конца игры
	socket.on('gameOver', (data) => {
		alert(data.message);
		socket.disconnect();
		attackButton.node.disabled = true;
		statusText.setText('Game Over');
	});
}

function update() {}

// Функция для обновления полоски здоровья
function updateHealthBar(bar, health) {
	bar.clear(); // Очищаем предыдущий прямоугольник
	if (bar === healthBar) {
		// Зеленая полоска для игрока
		bar.fillStyle(0x00ff00, 1);
	} else {
		// Красная полоска для противника
		bar.fillStyle(0xff0000, 1);
	}

	// Перерисовываем прямоугольник с новым размером
	bar.fillRect(150, 50, (health / 100) * 400, 30); // Пропорционально здоровью
}
