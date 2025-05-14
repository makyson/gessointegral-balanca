const EventEmitter = require("events");
const http = require("http");
const fs = require("fs");
const { SerialPort } = require("serialport");

const port = process.env.PORT || 3000;
const eventListener = new EventEmitter();
const currentData = {
  timestamp: Date.now(),
  value: 0,
};
//const PORTS = ["/dev/ttyS0"];
const PORTS = ["/dev/ttyS4", "/dev/ttyS5"];

const connections = PORTS.map(
  (path) => new SerialPort({ path, baudRate: 9600 })
);

connections.forEach((serial) => {
  serial.on("open", () => console.info(`OPEN ${serial.path}`));
  serial.on("data", (data) => {
    const newData = decode(data);
    if (currentData.value !== newData) {
      currentData.timestamp = Date.now();
      currentData.value = newData;
      eventListener.emit("data", currentData);
    }
  });
  serial.on("close", () => {
    console.info(`CLOSE ${serial.path}`);
    process.exit(1);
  });
  serial.on("error", (err) => {
    console.info(`ERROR ${serial.path}:`, err);
    process.exit(1);
  });
});

const server = http.createServer((req, res) => {
  try {
    if (req.headers.accept.includes("text/html")) {
      return streamHTML(req, res);
    }
    switch (req.headers.accept) {
      case "text/event-stream":
        return getDataSSE(req, res);
      default:
        return getData(req, res);
    }
  } catch (err) {
    console.error(err);
    res.write("0");
    res.end();
  }
});

server.listen(port, () => console.info(`Server Online on port: ${port}`));

function streamHTML(req, res) {
  res.writeHead(200, {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "text/html",
    "Cache-Control": `max-age=${6e3 * 24}`,
  });
  const readStream = fs.createReadStream("./index.html");
  readStream.pipe(res);
}

function getData(req, res) {
  res.writeHead(200, {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "text/plain",
    "Cache-Control": "no-cache",
  });
  res.write(getCurrentData().toString());
  res.end();
}

function getDataSSE(req, res) {
  res.writeHead(200, {
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "no-cache",
    "Content-Type": "text/event-stream",
    Connection: "keep-alive",
  });
  const sender = (data) => res.write(`data: ${data}\n\n`);
  let oldData = getCurrentData();
  sender(oldData);
  const timer = setInterval(() => {
    const tempData = getCurrentData();
    if (oldData !== tempData) {
      oldData = tempData;
      sender(oldData);
    }
  }, 1000);
  req.connection.on("close", () => {
    clearInterval(timer);
  });
}

function getCurrentData() {
  return currentData.value;
}

function decode(buffer) {
  let text = buffer.toString().trim();
  console.log(`Recebido da serial: "${text}"`);
  let match = text.match(/\d+/);
  if (!match) {
    console.log("Nenhum número válido recebido, mantendo o último valor.");
    return currentData.value;
  }
  let newValue = parseInt(match[0]);
  if (newValue === 0) {
    console.log("Valor zero recebido, zerando o peso.");
    return 0;
  }
  console.log(`Atualizando valor para: ${newValue}`);
  return newValue;
}
