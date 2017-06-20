require('dotenv').config({ silent: true });

const http = require('http');
const socketio = require('socket.io');
const dgram = require('dgram');
const Particle = require('particle-api-js');

const udpServer = dgram.createSocket('udp4');
const server = http.createServer();
const io = socketio.listen(server, { log: false, origins: '*:*' });
const particle = new Particle();

let accessToken = false;
let tokenInterval;
let socket = false;

udpServer.on('message', (buffer) => {
  if(socket) {
    const data = buffer.toString();
    socket.emit('clickedKey', data);
  }
});

udpServer.on('listening', () => {
  const addr = udpServer.address();
  console.info(`udpServer listening at ${addr.address}:${addr.port}`);
});

particle.login({ username: process.env.PARTICLE_UN, password: process.env.PARTICLE_PW })
  .then(data => accessToken = data.body.access_token);

function getStream() {
  if(!accessToken) {
    return;
  }
  clearInterval(tokenInterval);

  const udpVars = [
    particle.getVariable({ deviceId: process.env.DEVICE_ID, name: 'UDP_PORT', auth: accessToken }),
    particle.getVariable({ deviceId: process.env.DEVICE_ID, name: 'UDP_IP', auth: accessToken }),
  ];

  Promise.all(udpVars)
    .then(([portData, ipData]) => {
      udpServer.bind({
        address: ipData.body.result,
        port: portData.body.result,
      });
    })
    .catch(console.error);
}

tokenInterval = setInterval(getStream, 100);

io.on('connection', (s) => {
  socket = s;
});

server.listen(process.env.PORT || 3000, process.env.IP || '0.0.0.0', () => {
  const addr = server.address();
  console.info(`Http listening at ${addr.address}:${addr.port}`);
});
