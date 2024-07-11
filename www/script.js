var socket = io();
var names = ["George","Robot","Rabbit","Hero","Ant","Pencil","Crystal","Cat","Rock","Chamber"]

var n = Math.random();
var myName = names[Math.floor(n*names.length)];

  var form = document.getElementById('form');
  var nameInput = document.getElementById('name');
  var input = document.getElementById('input');
  var messages = document.getElementById('messages');

  nameInput.innerHTML += myName;

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    if (input.value) {
      socket.emit('chat message', input.value,myName);
      input.value = '';
    }
  });

  socket.on('draw message', (msg,name)=>{
    let message = name == myName ? `Me: ${msg}` : `${name}: ${msg}`;
    messages.innerHTML +=`${message} <br>`;
  });
