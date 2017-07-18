var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var colors = ["#424242","#E53935","#8E24AA","#D81B60","#00897B","#FDD835","#039BE5","#E91E63","#2196F3","#3F51B5","#4CAF50","#FFC107","#FF9800","#FFEB3B","#A282B5","#81E7F9","#E0EF53"];
var peoples = new Array();
var roomName = new String();

//ExpressJS
app.use(express.static('public'));


app.get('/', function(req, res){
  res.sendFile('/index.html');
});


//Socket.io


http.listen(3000, function(){
  console.log('listening on *:3000');
});

io.on('connection', function(socket){
    // Attributes the color, joins the room
	socket.on("joinRoom",function(data){
		var id = socket.id;
		var color = colors[Math.floor(Math.random()*17)];
		var roomName = data.room;
		var thisUser = {
		"id" : id,
        "color" : color,
		"room": roomName
		};
	    console.log(thisUser);
	    for(var i = 0, len = peoples.length; i < len; i++) {
			if (thisUser === peoples[i]) {
				var IsJoined = true;
				io.in(roomName).emit("ifJoined", IsJoined);
			} else {
				socket.join(roomName);
				var l = arrayObjectIndexOf(peoples, id, "id");
				peoples[l].color = color;
				peoples[l].room = roomName;
				console.log(id + ' user is in room '+roomName);
				console.log (peoples);
			}  
		}
		 
        io.in(roomName).emit("me", thisUser);
	   
        io.emit("userList", peoples);	
	})
	// Leave room
	socket.on ("leave", function(){
		var id = socket.id; 
		var l = arrayObjectIndexOf(peoples, id, "id");
		var roomName = peoples[l].room;
		socket.leave(roomName);
		console.log ('User ' + id + ' left the room ' + roomName);
	})

    //Log in
    socket.on("login", function(){
      var id = socket.id;
      peoples.push({ "id" : id, "color" : null, "room" : null });
	  console.log(peoples);  
	  if (peoples.length===1) {
        console.log(peoples.length + ' user connected');
	  } else {
		  console.log(peoples.length + ' users connected');
	  }
	  	  
    })

    socket.on('clear', function(){
      io.emit("clear");
    })

    //Transfer coordinates
    socket.on('drawing', function(coordinates){

      var objectToSend = {
       "coordinates" : coordinates,
       "drawer" : socket.id
    };
    //console.log(objectToSend);
      socket.broadcast.emit("receiveDrawing", objectToSend);
    });
	//Change the color, check if it the background color, send the msg "You are Eraser"
	socket.on('colorChanging', function(backgrouncolor){
      	  var newColor = colors[Math.floor(Math.random()*17)];
	  var msg = false;
	  if (newColor === backgrouncolor.color) {
		  var l = arrayObjectIndexOf(peoples, newColor, "color");
		  if (l == -1) { 
		     msg =  true;
		  } else {
			// Check if there is Eraser in the room, if yes - attribute new color
			while (0<=l<peoples.length) {
			  newColor = colors[Math.floor(Math.random()*17)];
			  l = arrayObjectIndexOf(peoples, newColor, "color");
			}
		  }
	  } 
	  var newColorObject = {
		  "color" : newColor,
		  "eraser" : msg
		  };
	  console.log(newColorObject);
      socket.emit("newColor", newColorObject);
    });
	// 
	

    socket.on("disconnect", function(){
        console.log("bye bye "+socket.id);
        peoples.splice(arrayObjectIndexOf(peoples, socket.id, "id"), 1)
    })
});

function arrayObjectIndexOf(myArray, searchTerm, property) {
    for(var i = 0, len = myArray.length; i < len; i++) {
    	//console.log(myArray[i]);
    	//console.log(myArray[i]);
        if (myArray[i][property] === searchTerm) return i;
    }
    return -1;
}
