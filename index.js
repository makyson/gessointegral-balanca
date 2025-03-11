const EventEmitter = require('events');
const http         = require('http');
const fs           = require('fs');
const SerialPort   = require('serialport');

const port = process.env.PORT || 3000;

const eventListener = new EventEmitter();
const currentData = {
  timestamp: Date.now(),
  value: 0,
};

eventListener.on('data', data => {
  const newData = decode(data);
  currentData.timestamp = Date.now();
  if (currentData.value !== newData) {
    currentData.value = newData;
    eventListener.emit('change', currentData);
  }
});

const connections = [
  new SerialPort('/dev/ttyS4'),
  new SerialPort('/dev/ttyS5'),
];

connections.forEach((serial, i) => {
  serial.on('open', () => console.info(`OPEN ${serial.path}`));
  serial.on('data', data => {
    connections[(i + 1) % 2].write(data);
    eventListener.emit('data', data);
  });
  serial.on('close', (err) => {
    console.info(`CLOSE ${serial.path}`);
    process.exit(1);
  });
  serial.on('error', (err) => {
    console.info(`ERROR ${serial.path}: `, err);
    process.exit(1);
  });
});

/* Server */
const server = http.createServer((req, res) => {
  try {
    if (req.headers.accept.search('text/html') >= 0) {
      return streamHTML(req, res);
    }

    switch (req.headers.accept) {
      case 'text/event-stream': return getDataSSE(req, res);
      case 'application/octet-stream': return getDataStream(req, res);
      default: return getData(req, res);
    }
  } catch(err) {
    console.error(err);
    res.write('0');
    res.end();
  }
});

server.listen(port, () => console.info(`Server Online on port: ${port}`));

/* Functions */
function streamHTML(req, res) {
  res.writeHead(200, {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'text/html',
    'Cache-Control': `max-age=${6E3*24}`,
  });
  const readStream = fs.createReadStream('./index.html');
  readStream.pipe(res);
}

function getData(req, res) {
  res.writeHead(200, {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'text/plain',
    'Cache-Control': 'no-cache',
  });

  const dataSend = Date.now() - currentData.timestamp > 2E3
    ? 0
    : currentData.value;

  res.write(dataSend.toString());
  res.end();
}

function getDataSSE(req, res) {
  res.writeHead(200, {
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-cache',
    'Content-Type': 'text/event-stream',
    'Connection': 'keep-alive',
  });

  const sender = data => res.write(`data: ${data}\n\n`);

  let oldData = getCurrentData();
  sender(oldData);

  const timer = setInterval(() => {
    const tempData = getCurrentData();
    if (oldData !== tempData) {
      oldData = tempData;
      sender(oldData);
    }
  }, 1E3);

  req.connection.on('close', () => {
    clearInterval(timer);
  });
  // res.end();
}

function getDataStream(req, res) {
  res.writeHead(200, {
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-cache',
    'Content-Type': 'text/plain',
    'Connection': 'keep-alive',
  });

  const sender = data => res.write(data.toString());

  let oldData = getCurrentData();

  sender(oldData);

  const timer = setInterval(() => {
    const tempData = getCurrentData();
    if (oldData !== tempData) {
      oldData = tempData;
      sender(oldData);
    }
  }, 1E3);

  req.connection.on('close', () => {
    clearInterval(timer);
  });
  // res.end();
}

function getCurrentData() {
  return Date.now() - currentData.timestamp > 2E3
    ? 0
    : currentData.value;
}

function decode(buffer) {
  let text = '';
  for (let entry of buffer.entries()) {
    text += String.fromCharCode(entry[1]);
  }
  const value = +text.slice(1,-1 );
  return text[0] === 'E' ? value : value;
}
