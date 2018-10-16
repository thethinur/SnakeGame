/* Copyright (c) 2018 AARHUS TECH

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE. */
// Author: Thinur Geir Torsson
// Snake game snake.js
// Documentation status: Partial, low (~20%)

// Regular global named objects
sprites = new Image();
partnames = ['Head','Body','Tail1','Tail2'];
// test vars

// The graphical area
var GameArea = {
  canvas : document.createElement("canvas"),
  tiles : {
    size : 16,
    height : 16,
    width : 24
  },
  preload : function() {
    sprites.onload = function() {
      ui.startscreen.image.onload = function() {
        GameArea.create();
        var g = setInterval(function() {
          GameArea.updateGraphics();
        }, (1000/30));
        setInterval(function() {
          if (snake.won()) { return; }
          snake.move();
          snake.checkCollisions();
        }, snake.movementspeed);
      }
      ui.startscreen.image.src = "assets/gamedata/startscreen.png";
    }
    sprites.src = "assets/gamedata/sprites/Sprites.png";
  },
  create : function() {
    this.canvas.width = this.tiles.size * this.tiles.width * 2;
    this.canvas.height = this.tiles.size * this.tiles.height * 2 + 50;
    this.context = this.canvas.getContext("2d");
    this.context.imageSmoothingEnabled = false;
    this.context.font = "50px Times New Roman";
    document.body.insertBefore(this.canvas, document.body.childNodes[0]);
    background.create();
    background.generate();
    ui.startscreen.location = { x : (this.canvas.width / 2 - 100) / 2, y : ((this.canvas.height - 100) / 2 - 50) / 2};
    ui.startscreen.active = true;
    ui.scorecounter.location.y = this.canvas.height - 50;
    score.reset();
    snake.create([{x : 1, y : 4},{x : 1, y : 1},{x : 4, y : 1}]);
  },
  start : function() {

  },
  newMap : function() {

  },
  updateGraphics : function() {
    this.context.setTransform(2,0,0,2,0,0);
    background.draw();
    snake.draw();
    food.draw();
    ui.draw();
  },
  drawSprite : function(sid, posx, posy) {
    GameArea.context.drawImage(sprites, (sid * 16) % 128, 16 * Math.floor(sid / 8), 16, 16, posx * 16, posy * 16, 16, 16);
  }
}
var background = {
  canvas : document.createElement("canvas"),
  create : function() {
    this.canvas.width = GameArea.tiles.size * GameArea.tiles.width;
    this.canvas.height = GameArea.tiles.size * GameArea.tiles.height;
    this.context = this.canvas.getContext("2d");
  },
  generate : function() {
    for(let x = 0; x < GameArea.tiles.height; x++){
      for(let y = 0; y < GameArea.tiles.width; y++){
        let sid = Math.floor(Math.random() * 3);
        let xid = (sid * 16) % 128;
        let yid = 16 * Math.floor((sid * 16) / 128);
        this.context.drawImage(sprites, xid, yid, 16, 16, y * 16, x * 16, 16, 16);
      }
    }
  },
  draw : function() {
    GameArea.context.drawImage(background.canvas, 0, 0);
  }
};
var ui = {
  startscreen : {
    active : true,
    location : { x : 142 * 2, y : 64 * 2}, // placeholder values
    image : new Image(),
    draw : function() {
      if (!this.active) { return; }
      GameArea.context.setTransform(2,0,0,2,0,0);
      GameArea.context.drawImage(this.image, this.location.x, this.location.y);
    }
  },
  scorecounter : {
    location : { x : 0, y : 0 }, // placeholder values
    draw : function() {
      GameArea.context.fillStyle = "#CC6622";
      GameArea.context.setTransform(1,0,0,1,0,0);
      GameArea.context.fillRect(this.location.x, this.location.y, GameArea.canvas.width, 50);
      GameArea.context.fillStyle = "#000000";
      GameArea.context.textAlign="start";
      GameArea.context.fillText("Score: " + score.current , this.location.x, this.location.y + 40, );
      GameArea.context.textAlign="end";
      GameArea.context.fillText("Best: " + score.best , this.location.x + GameArea.canvas.width, this.location.y + 40, );
    }

  },
  draw : function() {
    this.startscreen.draw();
    this.scorecounter.draw();
  }
}
function checktype(name) {
  for(let x = 0, l = partnames.length; 0 < l; x++){
    if (name === partnames[x]){
      return x;
    }
  }
  return;
}
// Class defining the nodes for the linked list, which will hold the data for each part of the snake.
class bodypart {
  constructor(xcoord, ycoord, type, nextpart, prevpart, direction = 0){
    if (typeof type === "string"){
      let id = checktype(type);
      if (id === undefined){
        console.log('Error: '+ type +' is not an acceptable name for var "type"');
        return;
      }
      this.type = { part : type, id : id, sid : 8 };
    }
    else if (typeof type === "number"){
      this.type = { part : partnames[type], id : type, sid : 8 };
    }
    else {
      console.log('Error: A(n) '+ typeof type +' is not an acceptable type for var "type"');
      return;
    }
    this.coords = { x : xcoord, y : ycoord };
    this.direction = direction; // 0 north 1 east 2 south 3 west
    this.nextpart = nextpart;
    this.prevpart = prevpart;
    this.apple = false;
  }
}
var snake = {
  // All ralevant snake data
  length : 0, // Length of the snake
  nodes : 0, // Amount of nodes in the snake
  head : undefined, // The head/first entry/node in the linked list
  tail : undefined, // The tail/last entry/node in the linked list
  movementspeed : 160, // ms between each move.
  direction : [0, 0], // Active direction vector
  newdirection : [0, 0], // Next direction vector
  // Function to build the snake
  create : function(coords) {
    //ensure that an array of objects is what comes through
    if (Array.isArray(coords)){
      if (coords.length < 2){
        console.log("Error, you need at least two coordinates to make a snake.");
        return;
      }
      else if (typeof coords[0] !== "object") {
        console.log("Error, coordinates for snake is not in an array.");
        return;
      }
    }
    else {
      console.log("Error, coordinates for snake is not in an array.");
      return;
    }
    //Reset values
    this.newdirection = [0, 0];
    this.length = 1;
    this.nodes = 1;
    // Building Snake start
    // construct head and update variables
    this.head = new bodypart(coords[0].x,coords[0].y,0);
    let node = this.head;
    let tempcoords = {x : coords[0].x, y : coords[0].y};
    if (tempcoords.x < coords[1].x){
      node.direction = 3;
      this.direction = [-1,0];
      tempcoords.x++;
    }
    else if (tempcoords.x > coords[1].x){
      this.direction = [1,0];
      node.direction = 1;
      tempcoords.x--;
    }
    else if (tempcoords.y < coords[1].y){
      this.direction = [0,-1];
      node.direction = 0;
      tempcoords.y++;
    }
    else if (tempcoords.y > coords[1].y){
      this.direction = [0,1];
      node.direction = 2;
      tempcoords.y--;
    }
    // construct body until very last position and update data
    for (let i = 1, l = coords.length; i < l; i++) {
      while (tempcoords.x < coords[i].x){
        node.nextpart = new bodypart(tempcoords.x,tempcoords.y, 1, undefined, node, 3);
        node = node.nextpart;
        tempcoords.x++;
        this.length++;
        this.nodes++;
      }
      while (tempcoords.x > coords[i].x){
        node.nextpart = new bodypart(tempcoords.x,tempcoords.y, 1, undefined, node, 1);
        node = node.nextpart;
        tempcoords.x--;
        this.length++;
        this.nodes++;
      }
      while (tempcoords.y < coords[i].y){
        node.nextpart = new bodypart(tempcoords.x,tempcoords.y, 1, undefined, node, 0);
        node = node.nextpart;
        tempcoords.y++;
        this.length++;
        this.nodes++;
      }
      while (tempcoords.y > coords[i].y){
        node.nextpart = new bodypart(tempcoords.x,tempcoords.y, 1, undefined, node, 2);
        node = node.nextpart;
        tempcoords.y--;
        this.length++;
        this.nodes++;
      }
    }
    // update last part id to tail1 (second to last tail part)
    node.type.id = 2;
    // contruct the tail end aka tail2
    this.tail = new bodypart(tempcoords.x,tempcoords.y, 3, undefined, node);
    this.length++;
    this.nodes++;
    node.nextpart = this.tail;
    node = this.tail;
    if (coords[coords.length - 2].x < coords[coords.length - 1].x){
      node.direction = 3;
    }
    else if (coords[coords.length - 2].x > coords[coords.length - 1].x){
      node.direction = 1;
    }
    else if (coords[coords.length - 2].y < coords[coords.length - 1].y){
      node.direction = 0;
    }
    else if (coords[coords.length - 2].y > coords[coords.length - 1].y){
      node.direction = 2;
    }
    // Building snake end
    // Updata all sprite data to the correct one
    while (node.prevpart !== undefined){
      node.type.sid = this.pickpart(node.type.id, node.direction, node.prevpart.direction);
      node = node.prevpart;
    }
    node.type.sid = this.pickpart(node.type.id, node.direction);

  },
  pickpart : function(option1, parm1, parm2) {
    let x;
    switch (option1){
      case 0:
        return 8 + parm1;
        break;
      case 1:
        if (parm1 === 0 && parm2 === 3){
          return 32 + parm1;
        }
        else if ((parm1 < parm2 ) || (parm1 === 3 && parm2 === 0)){
          return 24 + parm1;
        }
        else if ((parm1 > parm2 )){
          return 32 + parm1;
        }
        return 16 + parm1;
        break;
      case 2:
        if (parm1 === 0 && parm2 === 3){
          return 36 + parm1;
        }
        else if ((parm1 < parm2 ) || (parm1 === 3 && parm2 === 0)){
          return 28 + parm1;
        }
        else if ((parm1 > parm2 )){
          return 36 + parm1;
        }
        return 20 + parm1;
        break;
      case 3:
        return 40 + parm2;
        break;
    }
  },
  draw : function() {
    node = this.tail;
    while(node.prevpart !== undefined){
      GameArea.drawSprite(node.type.sid, node.coords.x , node.coords.y);
      node = node.prevpart;
    }
    GameArea.drawSprite(node.type.sid, node.coords.x, node.coords.y);
  },
  move : function(){
    // check for movement
    if (!(this.newdirection[0] === 0 && this.newdirection[1] === 0)){
      this.direction = this.newdirection;
      let node;
      if (this.length > this.nodes){
        this.nodes++;
        // Create and attach new part
        node = this.head.nextpart;
        node.prevpart = new bodypart(this.head.coords.x, this.head.coords.y, 1, node, this.head, this.head.direction);
        this.head.nextpart = node.prevpart;
        // Update the head
        node = this.head;
        node.coords = { x : (node.coords.x + this.direction[0]) % GameArea.tiles.width, y : (node.coords.y + this.direction[1]) % GameArea.tiles.height};
        if (node.coords.x < 0){
          node.coords.x = GameArea.tiles.width - 1;
        }
        else if(node.coords.y < 0){
          node.coords.y = GameArea.tiles.height - 1;
        }
        if (this.direction[0] < 0){
          node.direction = 3;
        }
        else if (this.direction[0] > 0){
          node.direction = 1;
        }
        else if (this.direction[1] < 0){
          node.direction = 0;
        }
        else if (this.direction[1] > 0){
          node.direction = 2;
        }
        // update head's sprite id
        node.type.sid = this.pickpart(node.type.id, node.direction);

        // update new part's sprite id
        node = this.head.nextpart;
        node.type.sid = this.pickpart(node.type.id, node.direction, node.prevpart.direction);
        if (this.nodes > (GameArea.tiles.width * GameArea.tiles.height)){
          // victory();
        }
        return;
      }
      // Pass coordinate data
      node = this.tail;
      while (node.prevpart !== undefined){
        node.coords = node.prevpart.coords;
        node.direction = node.prevpart.direction;
        node = node.prevpart;
      }
      // Give the head the new data
      node.coords = { x : (node.coords.x + this.direction[0]) % GameArea.tiles.width, y : (node.coords.y + this.direction[1]) % GameArea.tiles.height};
      if (node.coords.x < 0){
        node.coords.x = GameArea.tiles.width - 1;
      }
      else if(node.coords.y < 0){
        node.coords.y = GameArea.tiles.height - 1;
      }
      if (this.direction[0] < 0){
        node.direction = 3;
      }
      else if (this.direction[0] > 0){
        node.direction = 1;
      }
      else if (this.direction[1] < 0){
        node.direction = 0;
      }
      else if (this.direction[1] > 0){
        node.direction = 2;
      }
      // Update sprite data for all nodes
      node = this.tail;
      while (node.prevpart !== undefined){
        node.type.sid = this.pickpart(node.type.id, node.direction, node.prevpart.direction);
        node = node.prevpart;
      }
      node.type.sid = this.pickpart(node.type.id, node.direction);
    }
  },
  trydirection : function(v) {

  },
  checkCollisions : function() {
    let node = this.head;
    while (node.nextpart !== undefined){
      node = node.nextpart;
      if (this.head.coords.x === node.coords.x && this.head.coords.y === node.coords.y){
        this.newdirection = [0, 0];
        GameArea.create();
      }
    }
    if (snake.head.coords.x === food.pos.x && snake.head.coords.y === food.pos.y){
      food.effect();
    }
  },
  won : function() {
    if (this.length > GameArea.tiles.width * GameArea.tiles.height - 1) { return true; }
    return false;
  }
};
var score = {
  best : 0,
  current : 0,
  add : function(n) {
    this.current += n;
    if (this.current > this.best) {
      this.best = this.current;
    }
  },
  reset : function() {
    this.current = 0;
  },
  check : function() {
    this.total += this.current;
    this.current = 0;
  }
};

var food = {
  pos : { x : Math.floor(Math.random() * GameArea.tiles.width), y : Math.floor(Math.random() * GameArea.tiles.height)},
  effect : function() {
    score.add(5);
    snake.length++;
    food.pos = { x : Math.floor(Math.random() * GameArea.tiles.width), y : Math.floor(Math.random() * GameArea.tiles.height)};
    let node = snake.head;
    while(node !== undefined){
      if (node.coords.x === food.pos.x && node.coords.y === food.pos.y){
        food.pos = { x : Math.floor(Math.random() * GameArea.tiles.width), y : Math.floor(Math.random() * GameArea.tiles.height)};
        node = snake.head;
      }
      else {
        node = node.nextpart;
      }
    }
  },
  draw : function() {
    GameArea.drawSprite( 4, food.pos.x, food.pos.y);
  },
};

$(document).ready(function() {
  var decodedcookie = decodeURIComponent(document.cookie) + ";";
  if (decodedcookie.indexOf("score=") > -1) {
    var varindex = decodedcookie.indexOf("score=") + 6;
    var end = decodedcookie.indexOf(';', varindex);
    score.best = parseInt(decodedcookie.substring(varindex, end));
  }
  $( window ).on("unload", function() {
    // Build the expiration date string:
    var expiration_date = new Date();
    var cookie_string = '';
    expiration_date.setFullYear(expiration_date.getFullYear() + 1);
    // Build the set-cookie string:
    cookie_string = "score=" + score.best + "; path=/; expires=" + expiration_date.toUTCString();
    // Create or update the cookie:
    document.cookie = cookie_string;
  });
  GameArea.preload();
  //document.body.insertBefore(sprites, document.body.childNodes[0]);
  //document.body.insertBefore(ui.startscreen.image, document.body.childNodes[0])
  var keyhandler = $( document ).keydown(function( e ) {
    key = e.which;
    switch (key) {
    case 87:
      if (snake.direction[1] !== 1) {
        snake.newdirection = [0, -1];
        ui.startscreen.active = false;
      }
      break;
    case 65:
      if (snake.direction[0] !== 1) {
        snake.newdirection = [-1, 0];
        ui.startscreen.active = false;
      }
      break;
    case 83:
      if (snake.direction[1] !== -1) {
        snake.newdirection = [0, 1];
        ui.startscreen.active = false;
      }
      break;
    case 68:
      if (snake.direction[0] !== -1) {
        snake.newdirection = [1, 0];
        ui.startscreen.active = false;
      }
      break;
    };
  });

});
