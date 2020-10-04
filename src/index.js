const express = require("express");
const path = require("path")
const http = require("http")
const {genarateMessage,locationMessage} =  require("./utils/messages.js")
const {addUser,removeUser,getUser,getUserInRoom} = require("./utils/users")
const socketio = require("socket.io");
const Filter = require("bad-words")

const app = express()
const port = process.env.PORT || 3000;
const server =http.createServer(app)
const io = socketio(server)
const publicDirectory = path.join(__dirname,"../public")

app.use(express.json())
app.use("/",express.static(publicDirectory))

// io.on help us to run some command when user is connected
io.on("connection",(socket)=>{
    console.log("New WebSocket Connect")

    //room join
    socket.on("join",({username,room},callback)=>{
       const {error,user} =  addUser({id:socket.id,username,room})
       if(error){
          return callback(error)
       }

        socket.join(user.room)

        socket.emit("message",genarateMessage( "Welcome!"))// a welcome message when you first connect to chat server
        socket.broadcast.to(user.room).emit("message",genarateMessage(`${user.username} has joined!`)) 
        //  this send messagge to every used but not this perticular socket(and .to() for particular room)
        io.to(user.room).emit("roomData",{
            room:user.room,
            users:getUserInRoom(user.room)
        })
        callback()
    })

    // send chat to all user 
    // callback function send acknowledgement after accepting the message
    // server(emit) -> client(recive) ->acknowledgement -> server
    socket.on("sendMessage",(message, callback)=>{
        const user = getUser(socket.id)
        const filter = new Filter()
        if (filter.isProfane(message)){
            return callback("Profanity not allowed!")
        }
        io.to(user.room).emit("message",genarateMessage( user.username,message))
        callback()
    })
      
        // share user location to every one else
     socket.on("sendLocation",(coors,callback)=>{
         const user  = getUser(socket.id)
         io.to(user.room).emit("locationMessage",locationMessage(user.username,`https://google.com/maps?q=${coors.latitude},${coors.longitude}`)) 
         callback("location is shared")
     }) 
    //  disconnect is a built in listener so you can't use another name
    socket.on("disconnect",()=>{
        const user =  removeUser(socket.id)
        if(user){
        io.to(user.room).emit("message",genarateMessage(`${user.username} has left`))
        io.to(user.room).emit("roomData",{
            room:user.room,
            users:getUserInRoom(user.room)
        })
       }
    })
})





server.listen(port,()=>{
    console.log(`server is up and running on port ${port}`)
})