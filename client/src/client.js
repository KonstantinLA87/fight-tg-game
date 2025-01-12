import { io } from 'socket.io-client';

export const socket = io('http://localhost:3000');

socket.on('connect', () => {
  console.log('Successfully connected to the server!');
});

socket.on('waiting', (data) => {
  console.log('Waiting message:', data.message);
  // Здесь проверяем состояние игрока
  if (data.message === 'Waiting for opponent...') {
    statusText.setText('Waiting for opponent...');
  }
});

socket.on('start', (data) => {
  console.log('Game started with health:', data.health);
  statusText.setText('Opponent found!');
  health = data.health;
  updateHealthBar(healthBar, health);
});

socket.on('update', (data) => {
  console.log('Health updated:', data.health);
  health = data.health;
  updateHealthBar(healthBar, health);

  // Проверяем проигрыш
  if (health <= 0) {
    alert('You lost!');
    socket.disconnect();
  }
});

socket.on('updateEnemyHealth', (data) => {
  console.log('Enemy health updated:', data.health);
  enemyHealth = data.health;
  updateHealthBar(enemyHealthBar, enemyHealth);

  // Проверяем победу
  if (enemyHealth <= 0) {
    alert('You won!');
    socket.disconnect();
  }
});

socket.on('gameOver', (data) => {
  console.log('Game Over:', data.message);
  alert(data.message);
  socket.disconnect();
  attackButton.node.disabled = true;
  statusText.setText('Game Over');
});
