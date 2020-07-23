import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import WebSocket from 'ws'
import url from 'url'
import http from 'http'

const PORT = 3000
const app = express()

app.use(bodyParser.json())
app.use(cors())

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const connections = {} // pair off connections by 2's {0,1}, {2,3}

wss.on('connection', async function connection(ws, req) {
  const id = url.parse(req.url, true).query.id

  connections[id] = {
    sender: id,
    ws
  }

  ws.on('message', async function incoming(message) {
    const parsedMessage = JSON.parse(message)

    const receiver = parsedMessage.sender % 2 === 0 ? parsedMessage.sender + 1 : parsedMessage.sender - 1

    // send new messages to sender
    connections[parsedMessage.sender].ws.send(JSON.stringify({ data: parsedMessage }))

    // find the "Other" perosn in the chat and send messages
    if (parsedMessage.sender % 2 === 0) {
      if (connections[parsedMessage.sender + 1]) {
        connections[parsedMessage.sender + 1].ws.send(JSON.stringify({ data: parsedMessage }))
      }
    } else {
      connections[parsedMessage.sender - 1].ws.send(JSON.stringify({ data: parsedMessage }))
    }
  });

  // can assume if ID is an even number then it's a new channel
  // if (id % 2 === 1) {
  //   connections[id].ws.send(JSON.stringify({ data: 'hi' }))
  // }
});


let id = 0;
app.get('/id', (req, res) => res.status(200).send({ id: id++ }))

app.get('/', (req, res) => res.status(200).send('200 OK'))

server.listen(PORT, function listening() {
  console.log('Listening on %d', server.address().port);
});
