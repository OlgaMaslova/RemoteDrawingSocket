var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var colors = ["#424242","#E53935","#8E24AA","#D81B60","#00897B","#FDD835","#039BE5","#E91E63","#2196F3","#3F51B5","#4CAF50","#FFC107","#FF9800","#FFEB3B","#A282B5","#81E7F9","#E0EF53"];
var peoples = new Array();
var roomName = new String();
var numberOfUsers = 0;
var numberOfRooms = 0;

var MongoClient = require('mongodb').MongoClient
  , assert = require('assert');

// Connection URL
var url = 'mongodb://localhost:27017/data';
var myDb;

//Connect to Mongo database
MongoClient.connect(url, function(err, db) {
      assert.equal(null, err);
      console.log("Connected successfully to database server");
      myDb = db;

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
    var pseudo = data.name;
		var thisUser = {
		"id" : id,
    "pseudo" : pseudo,
    "color" : color,
		"room": roomName
		};
	    console.log(thisUser);
      socket.join(roomName);
      var l = arrayObjectIndexOf(peoples, id, "id");
      peoples[l].color = color;

      for(var i = 0, len = peoples.length; i < len ; i++) {
			     if (roomName === peoples[i].room) {
				       console.log("Room exists already");
           } else {
               numberOfRooms++;
           }
           peoples[l].room = roomName;
      }
      console.log("Number of Rooms " + numberOfRooms);
      socket.emit("me", thisUser);
      io.emit("dataRooms", numberOfRooms);

    myDb.collection('Users').drop (function(err, result) {
          console.log("Collection removed");
      });
      return peoples;
	});

	// Leave room
	socket.on ("leave", function(){
    console.log(peoples);
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
    return peoples;
	});

  //Log in
    socket.on("login", function(data){
      var id = socket.id;
      var pseudo = data.pseudo;
      peoples.push({ "id" : id, "pseudo" : pseudo, "color" : null, "room" : null });
	    console.log(peoples);
	    if (peoples.length === 1) {
        console.log(peoples.length + ' user connected');
	    } else {
		  console.log(peoples.length + ' users connected');
	    }
      return peoples;
    });

  //Clear all drawings in particular room
    socket.on ("clearRoom", function(data){
      var roomName = data.room;
      io.in(roomName).emit("clear");
    });


   //Clear all drawings
    socket.on("clear", function(){
      io.emit("clear");
    })


  //Transfer coordinates
    socket.on('drawing', function(coordinates){

       var n = arrayObjectIndexOf(peoples, socket.id, "id");
       var pseudo = peoples[n].pseudo;
       var room = peoples[n].room;
       var color = peoples[n].color;
       var objectToSend = {
       "coordinates" : coordinates,
       "drawer" : pseudo,
       "color" : color
       };
       io.in(room).emit("receiveDrawing", objectToSend);
       console.log(objectToSend);
         //Send the drawing to the database

       myDb.collection('Users').insert(
           { userId : peoples[n].id, pseudo : peoples[n].pseudo, color: peoples[n].color, room: peoples[n].room,
           coordinates_old : coordinates.old, coordinates_new : coordinates.new}, function(err, result) {
           assert.equal(err, null);
           //console.log("Inserted coordinates information for " + peoples[n].id);
       });

    });

    //Change the color, check if it the background color, send the msg "You are Eraser"
    socket.on('colorChanging', function(backgrouncolor){
      	 var newColor = colors[Math.floor(Math.random()*17)];
	       var msg = false;
         var n = arrayObjectIndexOf(peoples, socket.id, "id");
         console.log(newColor);
	       if (newColor === backgrouncolor.color) {
         // Check if there is Eraser in the room, if yes - attribute new color
               var l = arrayObjectIndexOf(peoples, newColor, "color");
               console.log(l);
               msg =  true;
               while (l>=0 && newColor === backgrouncolor.color) {
                    newColor = colors[Math.floor(Math.random()*17)];
                    l = arrayObjectIndexOf(peoples, newColor, "color");
                    msg = false;
               }
	       }
	       var newColorObject = {
		         "color" : newColor,
		         "eraser" : msg
		     };
         peoples[n].color = newColor;
	       console.log(newColorObject);
         socket.emit("newColor", newColorObject);
         return peoples;
    });

    // Change the background color
    socket.on('backgroundChange', function(backgrouncolor){
      var newColor = colors[Math.floor(Math.random()*17)];
      while (newColor === backgrouncolor.color) {
           newColor = colors[Math.floor(Math.random()*17)];
      }
      var newColorObject = {
          "color" : newColor,
      };
      io.emit("newBackground", newColorObject);
    });


   // Disconnect
    socket.on("disconnect", function(){
      console.log("bye bye "+socket.id);
      var l = arrayObjectIndexOf(peoples, socket.id, "id");
	    var room = peoples[l].room;
      peoples.splice(l, 1);
      var n = arrayObjectIndexOf(peoples, room, "room");
      if (n == -1) {
        numberOfRooms--;
        console.log("number Of Rooms " + numberOfRooms);
	    }
      numberOfUsers--;
	    io.emit("dataUsers", numberOfUsers);
      io.emit("dataRooms", numberOfRooms);

      myDb.collection('Users').find({}).toArray(function(err, docs) {
           assert.equal(err, null);
           console.log("Found the following records");
           console.log(docs);

       });
	    return peoples;
    })

  });

});


function arrayObjectIndexOf(myArray, searchTerm, property) {
    for(var i = 0, len = myArray.length; i < len; i++) {
    	//console.log(myArray[i]);
    	//console.log(myArray[i]);
        if (myArray[i][property] === searchTerm) return i;
    }
    return -1;
}
