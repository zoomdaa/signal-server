const express = require('express')
const { createServer } = require('http')
const { Server: SocketServer } = require('socket.io')
const app = express()
const httpServer = createServer(app)
const socketServer = new SocketServer(httpServer)
const port = 3000

// 房间最大人数
const ROOMSIZE = 2

// 信令组
const SIGNALS = {
  enter: 'enter',
  entered: 'entered',
  exit: 'exit',
  exited: 'exited',
  full: 'full',
  message: 'message',
  otherEntered: 'other-entered',
  otherExited: 'other-exited'
}

// 根路径返回index.html便于在该文件测试客户端代码
app.get('/', (req, res) => {
  res.sendFile(`${__dirname}/index.html`)
})

// 监听客户端与服务端成功建立WebSocket
socketServer.sockets.on('connection', socket => {
  // 连接后打印本次socket会话id
  console.log(`socket id:${socket.id}`)

  // 客户端加入房间
  socket.on(SIGNALS.enter, (room, user) => {
    let emitSignal = SIGNALS.entered
    const currentRoom = socketServer.sockets.adapter.rooms.get(room)
    if (currentRoom) {
      const roomSize = currentRoom.size
      if (roomSize >= ROOMSIZE) {
        // 房间满员
        emitSignal = SIGNALS.full
      } else {
        socket.join(room)
      }
    } else {
      socket.join(room)
    }

    // 返回加入结果entered/full
    socket.emit(emitSignal, room)

    // 如果成功加入则通知房间其他用户
    if (emitSignal === SIGNALS.entered) {
      socket.to(room).emit(SIGNALS.otherEntered, user)
    }
  })

  // 接收message信令
  socket.on(SIGNALS.message, (room, data) => {
    // 转发给房间内的其他用户，接收对象可根据data进行过滤
    socket.to(room).emit(SIGNALS.message, data)
  })

  // 接收exit信令
  socket.on(SIGNALS.exit, (room, user) => {
    // 离开指定房间
    socket.leave(room)
    // 发送exited信令
    socket.emit(SIGNALS.exited, room)
    // 通知房间其他用户当前用户已退出
    socket.to(room).emit(SIGNALS.otherExited, user)
  })
})

// 监听端口以提供http服务
httpServer.listen(port, () => {
  console.log(`Signal server listening at http://localhost:${port}`)
})