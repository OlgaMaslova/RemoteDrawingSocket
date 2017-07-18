var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var colors = ["#424242","#E53935","#8E24AA","#D81B60","#00897B","#FDD835","#039BE5","#E91E63","#2196F3","#3F51B5","#4CAF50","#FFC107","#FF9800","#FFEB3B","#A282B5","#81E7F9","#E0EF53"];
var peoples = new Array();
var roomName = new String();
var numberOfUsers = 0;
var numberOfRooms = 0;

//ExpressJS
//app.use(express.static('public'));


app.get('/', function(req, res){
   res.sendFile('/home/olga/Documents/dev/java_android/LearningProject/RemoteSocket/webinterface.html');
});



//Socket.io


http.listen(3000, function(){
  console.log('listening on *:3000');
});

io.on('connection', function(socket){
	console.log('A user '+socket.id+' is connected');
	numberOfUsers++;
	console.log(numberOfUsers);
	io.emit("dataUsers", numberOfUsers);
  io.emit("dataRooms", numberOfRooms);
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
	    numberOfRooms++;
	    console.log("Number of Rooms " + numberOfRooms);
	    for(var i = 0, len = peoples.length; i < len; i++) {
			     if (thisUser === peoples[i]) {
				         var IsJoined = true;
				             io.in(roomName).emit("ifJoined", IsJoined);
			     } else {
				   socket.join(roomName);
				   var l = arrayObjectIndexOf(peoples, id, "id");
				   peoples[l].color = color;
				   peoples[l].room = roomName;
				   }
	    }

      io.in(roomName).emit("me", thisUser);
      io.emit("userList", peoples);
	    io.emit("dataRooms", numberOfRooms);
	})


	// Leave room
	socket.on ("leave", function(){
		var l = arrayObjectIndexOf(peoples, socket.id, "id");
		var roomName = peoples[l].room;
    socket.leave(roomName);
    peoples[l].room = null;
		var n = arrayObjectIndexOf(peoples, roomName, "room");
    console.log ('User ' + socket.id + ' left the room ' + roomName);
		if (n == -1) {
		    numberOfRooms--;
		}
		console.log("Number of Rooms " + numberOfRooms);
		io.emit("dataRooms", numberOfRooms);

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
        var l = arrayObjectIndexOf(peoples, socket.id, "id");
	      var room = peoples[l].room;
	      var n = arrayObjectIndexOf(peoples, room, "room");
	      if (n == -1) {
	           numberOfRooms--;
	           console.log(numberOfRooms);
	      }
        numberOfUsers--;
	       io.emit("dataUsers", numberOfUsers);
         io.emit("dataRooms", numberOfRooms);
	       peoples.splice(arrayObjectIndexOf(peoples, socket.id, "id"), 1);
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
