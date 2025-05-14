const EventEmitter = require("events");
const http = require("http");
const fs = require("fs");
const { SerialPort } = require("serialport");

const port = process.env.PORT || 3000;

const eventListener = new EventEmitter();
const currentData = {
  timestamp: Date.now(),
  value: 0, // Inicializa com zero
};

eventListener.on("data", (data) => {
  const newData = decode(data);
  if (currentData.value !== newData) {
    currentData.timestamp = Date.now();
    currentData.value = newData;
    eventListener.emit("change", currentData);
  }
});

// Configuração da porta serial
const serial = new SerialPort("/dev/ttyS0", { baudRate: 9600 });

serial.on("open", () => console.info(`OPEN ${serial.path}`));
serial.on("data", (data) => {
  let newData = decode(data);

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

/* Servidor HTTP */
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

/* Funções */
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

  const dataSend = getCurrentData();
  res.write(dataSend.toString());
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
  return currentData.value; // Sempre mantém o último valor recebido
}

// 🔥 Correção para manter o último valor e só zerar se o valor recebido for "0"
function decode(buffer) {
  let text = buffer.toString().trim();
  console.log(`Recebido da serial: "${text}"`);

  // Ajusta para remover qualquer prefixo (por exemplo, "E" no início)
  let match = text.match(/\d+/); // Captura apenas os números

  if (!match) {
    console.log("Nenhum número válido recebido, mantendo o último valor.");
    return currentData.value; // Mantém o último valor se não recebeu um número
  }

  let newValue = parseInt(match[0]); // Converte para número

  if (newValue === 0) {
    console.log("Valor zero recebido, zerando o peso.");
    return 0; // Se receber "0", reseta para zero
  }

  console.log(`Atualizando valor para: ${newValue}`);
  return newValue; // Retorna o valor extraído corretamente
}
