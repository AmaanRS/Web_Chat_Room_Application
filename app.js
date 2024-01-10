const express = require('express')
const app = express();
const server = require("http").Server(app)
const io = require("socket.io")(server,{maxHttpBufferSize:1e10})
const { writeFile, mkdirSync,existsSync, writeFileSync } = require("fs");
const { v4: uuidv4 } = require("uuid");

app.set("view engine", "ejs")

io.on("connection",(socket)=>{
    socket.on("new_user",(data)=>{
        socket.username = data.username
        socket.room_id = data.room_id
        socket.join(socket.room_id)
        socket.to(socket.room_id).emit("user_joined",{"username":socket.username})

        socket.on("message_sent",(data)=>{
            socket.to(socket.room_id).emit("left_message_sent",{'message':data.message})
            socket.emit("right_message_sent",{'message':data.message})
        })

        socket.on("upload",(data,type)=>{
            // Create a name for folder which is for a room
            let to_create_dir = __dirname + "/HDD/" +socket.room_id

            // If folder does not exist then create it
            if(!existsSync(to_create_dir)){
                mkdirSync(to_create_dir)
            }
            // Create a file name and then write the file in the folder
            let current_time_in_milli = new Date().getTime();
            let file_name = to_create_dir+ "/" + current_time_in_milli.toString() + "." + type.split("/")[1]
            writeFileSync(file_name,data,(err)=>{
                console.log("There is an error while writing the file")
                console.log(err)
            })
            

            // if(data){
            //     writeFile("temp/b.png",data,(err)=>{
            //         console.log(err)
            //     })
            // }
        })
        

        
    })
    socket.on("disconnect",(reason)=>{
        socket.leave(socket.room_id)
        socket.to(socket.room_id).emit("user_left",{"username":socket.username})
        //Checks if the room is empty
        // Checks if everyone has left the room
        const isroomEmpty = io.sockets.adapter.rooms.get(socket.room_id) === undefined

        // How to get the name of the folder here
        console.log(to_create_dir)
        if(isroomEmpty){
        }
        
    })
})

app.get("/",(req,res)=>{
    res.render("home")
})

app.get("/:room_id/:username/:room_name",(req,res)=>{
        res.render("index",{"room_id":req.params.room_id,'username':req.params.username})
})

app.get("/:room_id/:username",(req,res)=>{
    if(io.sockets.adapter.rooms.has(req.params.room_id)){
        res.render("index",{"room_id":req.params.room_id,'username':req.params.username})
    }
    else{
        return res.render("home")
    }
})


server.listen(8000)