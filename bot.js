const { Telegraf } = require('telegraf');
const path = require('path');

// Замените на свой токен от BotFather
const bot = new Telegraf('1459208606:AAEF34o1GplKICQhd4Ap3UdX1mpwUESQSVs');

// Стартовое сообщение
bot.start((ctx) => {
  ctx.reply('Добро пожаловать в Битку Титанов! Нажмите на кнопку, чтобы начать игру.', {
    reply_markup: {
      keyboard: [
        [{ text: 'Искать соперника' }]
      ],
      resize_keyboard: true,
      one_time_keyboard: true
    }
  });
});

// Обработка кнопки "Искать соперника"
bot.hears('Искать соперника', (ctx) => {
  // Отправляем сообщение о поиске соперника
  ctx.reply('Поиск соперника...');
  
  // Имитация поиска соперника
  setTimeout(() => {
    // Отправляем ссылку на клиентскую часть игры
    ctx.reply('Противник найден! Перейдите по ссылке, чтобы начать игру:', {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Играть', url: 'http://localhost:3000' }]
        ]
      }
    });
  }, 2000);
});

// Запуск бота
bot.launch();

console.log('Telegram bot is running!');
