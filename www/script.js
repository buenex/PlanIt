const socket = io();

// Evento de criação de sala
$('#create-room-form').submit((e) => {
  e.preventDefault();

  const name = $('#room-name').val();
  const passwordC = $('#room-password-c').val();
  const usernameC = $('#username-c').val();

  socket.emit('createRoom', {
    name: name,
    password: passwordC,
    username: usernameC
  });
});

// Resposta de criação de sala
socket.on('roomCreated', (data) => {
  const roomId = data.roomId;
  const password = data.password;

  // Redireciona para a página da sala
  window.location.href = `/room/${roomId}?password=${password}`;
});

// Evento de entrada na sala
$('#join-room-form').submit((e) => {
  e.preventDefault();

  const roomId = $('#room-id').val();
  const password = $('#room-password').val();
  const username = $('#username').val();

  socket.emit('joinRoom', {
    roomId: roomId,
    password: password,
    username: username
  });
});

// Resposta de entrada na sala
socket.on('roomJoined', (data) => {
  const roomName = data.roomName;
  const users = data.users;

  // Mostra o nome da sala e a lista de usuários
  $('#room-name').text(roomName);
  $('#users-list').empty();

  for (const userId in users) {
    const userName = users[userId].name;
    const isHost = users[userId].isHost;

    const $user = $('<li>').attr('id', userId).text(userName);

    if (isHost) {
      $user.append($('<span>').addClass('badge badge-primary ml-2').text('Host'));
    }

    $('#users-list').append($user);
  }

  // Mostra o formulário de pontuação
  $('#score-form').show();
});

// Erro de entrada na sala
socket.on('roomJoinError', (data) => {
  const message = data.message;

  // Mostra uma mensagem de erro
  alert(message);
});

// Evento de início da pontuação
$('#start-score-button').click(() => {
  const roomId = window.location.pathname.split('/')[2];

  socket.emit('startScore', {
    roomId: roomId
  });
});

// Resposta de início da pontuação
socket.on('scoreStarted', () => {
  // Mostra as cartas de pontuação
  $('#score-cards').show();
});

// Evento de envio da pontuação
$('#score-cards').on('click', '.card', function() {
  const roomId = window.location.pathname.split('/')[2];
  const score = $(this).text();

  socket.emit('sendScore', {
    roomId: roomId,
    score: score
  });

  // Desabilita todas as cartas
  $('.card').prop('disabled', true);

  // Mostra a pontuação enviada
  $(this).addClass('active');
});

// Resposta de envio da pontuação
socket.on('scoreSent', (data) => {
  const score = data.score;

  // Mostra a pontuação enviada
  $('.card.active').text(score);
});

// Mensagem de recebimento da pontuação
socket.on('scoreReceived', (data) => {
  const userId = data.userId;
  const score = data.score;

  // Mostra a pontuação recebida
  $(`#${userId}`).append($('<span>').addClass('badge badge-secondary ml-2').text(score));
});

// Evento de encerramento da pontuação
$('#end-score-button').click(() => {
  const roomId = window.location.pathname.split('/')[2];

  socket.emit('endScore', {
    roomId: roomId
  });
});

// Resposta de encerramento da pontuação
socket.on('scoreEnded', (data) => {
  const average = data.average;

  // Mostra a média das pontuações
  $('#average').text(`Média: ${average}`);
});

// Salva a média no storage do navegador
socket.on('saveAverage', (data) => {
  const average = data.average;

  localStorage.setItem('average', average);
});

// Evento de carregamento da página da sala
$(document).ready(() => {
  const password = new URLSearchParams(window.location.search).get('password');

  // Mostra o formulário de entrada na sala
  $('#join-room-form').show();

  if (password) {
    // Esconde o formulário de criação de sala
    $('#create-room-form').hide();

    // Preenche o campo de senha
    $('#room-password').val(password);
  }

  // Esconde o formulário de pontuação e as cartas
  $('#score-form').hide();
  $('#score-cards').hide();
});
