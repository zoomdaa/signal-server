const express = require('express')
const { createServer } = require('http')
const { Server: SocketServer } = require('socket.io')
const app = express()
const httpServer = createServer(app)
const socketServer = new SocketServer(httpServer)
const port = 3000

// 根路径返回index.html便于在该文件测试客户端代码
app.get('/', (req, res) => {
  res.sendFile(`${__dirname}/index.html`)
})

// 监听客户端与服务端成功建立WebSocket
socketServer.sockets.on('connection', socket => {
  // 连接后打印本次socket会话id
  console.log(`socket id:${socket.id}`)
  // 监听从客户端发来的信令为message的消息
  socket.on('message', message => {
    console.log(message)
  })
  // 向客户端发送信令为message的消息
  socket.emit('message', 'message from signal server')
})

// 监听端口以提供http服务
httpServer.listen(port, () => {
  console.log(`Signal server listening at http://localhost:${port}`)
})