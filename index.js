const http = require('http');
const socketio = require('socket.io');
const express = require('express');
const path = require('path');


const app = express();


const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;

// Lista de salas
const rooms = {};

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/www/index.html'));
});

app.get('/room/:roomId', (req, res) => {
  const roomId = req.params.roomId;
  console.log(`Served room: ${roomId}`);
  res.sendFile(path.join(__dirname, '/www/room.html'));
});

app.use(express.static('www'));

// Evento de conexão
io.on('connection', (socket) => {
  console.log(`Usuário conectado: ${socket.id}`);

  // Evento para criar uma sala
  socket.on('createRoom', (data) => {
    const roomId = Math.random().toString(36).substr(2, 5);
    const roomPassword = data.password;
    const roomName = data.name;
    const hostId = socket.id;

    // Adiciona a sala na lista de salas
    rooms[roomId] = {
      name: roomName,
      host: hostId,
      password: roomPassword,
      users: {},
      scores: {},
      isOpen: false
    };

    // Adiciona o usuário que criou a sala como host
    rooms[roomId].users[hostId] = {
      name: data.username,
      isHost: true
    };

    // Envia a resposta com o ID da sala e a senha
    socket.emit('roomCreated', {
      roomId: roomId,
      password: roomPassword
    });
    console.log(`Sala de Id: ${roomId} criada`);
  });

  // Evento para entrar em uma sala
  socket.on('joinRoom', (data) => {
    const roomId = data.roomId;
    const roomPassword = data.password;
    const userName = data.username;

    if (rooms[roomId] && rooms[roomId].password === roomPassword) {
      // Adiciona o usuário na sala
      rooms[roomId].users[socket.id] = {
        name: userName,
        isHost: false
      };

      // Envia a resposta com o nome da sala e a lista de usuários
      socket.emit('roomJoined', {
        roomName: rooms[roomId].name,
        users: rooms[roomId].users
      });

      // Envia uma mensagem para todos na sala informando que um novo usuário entrou
      socket.to(roomId).emit('userJoined', {
        userId: socket.id,
        userName: userName
      });
    } else {
      // Envia uma mensagem de erro caso a sala não exista ou a senha esteja incorreta
      socket.emit('roomJoinError', {
        message: 'Sala não encontrada ou senha incorreta'
      });
    }
  });

  // Evento para iniciar a pontuação
  socket.on('startScore', (data) => {
    const roomId = data.roomId;
    const hostId = rooms[roomId].host;
    const userId = socket.id;

    if (userId === hostId) {
      // Inicia a pontuação
      rooms[roomId].isOpen = true;

      // Envia uma mensagem para todos na sala informando que a pontuação foi iniciada
      io.in(roomId).emit('scoreStarted');
    }
  });

  // Evento para enviar a pontuação
  socket.on('sendScore', (data) => {
    const roomId = data.roomId;
    const userId = socket.id;
    const score = data.score;

    if (rooms[roomId].isOpen) {
      // Adiciona a pontuação do usuário na lista de pontuações da sala
      rooms[roomId].scores[userId] = score;

      // Envia a pontuação apenas para o usuário que a enviou
      socket.emit('scoreSent', {
        score: score
      });

      // Envia uma mensagem para todos na sala informando que um usuário enviou a pontuação
      socket.to(roomId).emit('scoreReceived', {
        userId: userId,
        score: score
      });
    }
  });

  // Evento para finalizar a pontuação
  socket.on('endScore', (data) => {
    const roomId = data.roomId;
    const hostId = rooms[roomId].host;
    const userId = socket.id;

    if (userId === hostId) {
      // Calcula a média das pontuações
      const scores = Object.values(rooms[roomId].scores);
      const sum = scores.reduce((acc, curr) => acc + curr, 0);
      const average = sum / scores.length;

      // Salva a média no storage do navegador
      socket.emit('saveAverage', {
        average: average
      });

      // Envia uma mensagem para todos na sala informando que a pontuação foi encerrada
      io.in(roomId).emit('scoreEnded', {
        average: average
      });

      // Limpa a lista de pontuações da sala
      rooms[roomId].scores = {};

      // Fecha a pontuação
      rooms[roomId].isOpen = false;
    }
  });

  // Evento de desconexão
  socket.on('disconnect', () => {
    console.log(`Usuário desconectado: ${socket.id}`);

    // Remove o usuário da sala
    for (const roomId in rooms) {
      if (rooms[roomId].users[socket.id]) {
        delete rooms[roomId].users[socket.id];

        // Envia uma mensagem para todos na sala informando que um usuário saiu
        socket.to(roomId).emit('userLeft', {
          userId: socket.id
        });

        break;
      }
    }
  });
});

// Inicia o servidor
server.listen(port, () => {
  console.log(`Servidor rodando na porta no link http://localhost:${port}`);
});
