var simpleLevelPlan = [
  "                      ",
  "                      ",
  "  x              = x  ",
  "  x         o o    x  ",
  "  x @      xxxxx   x  ",
  "  xxxxx            x  ",
  "      x!!!!!!!!!!!!x  ",
  "      xxxxxxxxxxxxxx  ",
  "                      "
];

function Level(plan) {
  this.width = plan[0].length;
  this.height = plan.length;
  this.grid = [];
  this.actors = [];

  for (var y = 0; y < this.height; y++) {
    var line = plan[y], gridLine = [];
    for (var x = 0; x < this.width; x++) {
      var ch = line[x], fieldType = null;
      var Actor = actorChars[ch];
      if (Actor)
        this.actors.push(new Actor(new Vector(x, y), ch));
      else if (ch == "x")
        fieldType = "wall";
	  else if (ch == "!")
        fieldType = "taniwha";
	  else if (ch == "h")
		fieldType = "hole";
	  else if (ch == "#")	// moveable block (iteration2)
	    fieldType = "block";	// moveable block (iteration2)
      gridLine.push(fieldType);
    }
    this.grid.push(gridLine);
  }

  this.player = this.actors.filter(function(actor) {
    return actor.type == "player";
  })[0];
  this.status = this.finishDelay = null;
};

Level.prototype.isFinished = function() {
  return this.status != null && this.finishDelay < 0;
};

function Vector(x, y) {
  this.x = x; this.y = y;
};

Vector.prototype.plus = function(other) {
  return new Vector(this.x + other.x, this.y + other.y);
};
Vector.prototype.times = function(factor) {
  return new Vector(this.x * factor, this.y * factor);
};

var actorChars = {
  "@": Player,
  "o": Fish,
  "=": Taniwha, "|": Taniwha, // (iteration5)
  "^": Fireball, "v": Fireball, "<": Fireball, ">": Fireball,	// (iteration5)
  "#": Block	// moveable block (iteration2)
};

function Player(pos) {
  this.pos = pos.plus(new Vector(0, 0)); // start position
  this.size = new Vector(0.5, 0.9); // alter avatar width and height (iteration3)
  this.speed = new Vector(0, 0);
}
Player.prototype.type = "player";

// block movement (iteration2)
function Block(pos) {
	this.pos = pos;
	this.size = new Vector(1, 1);
    this.speed = new Vector(0, 0);
}
Block.prototype.type = "block";

// (iteration 6) - static lava > hole
function Hole(pos) {
	this.pos = pos;
	this.size = new Vector(1, 1);
}
Hole.prototype.type = "hole";

// (iteration 5)
function Taniwha(pos, ch) {
	this.pos = pos;
	this.size = new Vector(1, 1);
	if (ch == "=") {
		this.speed = new Vector(2, 0);
	} else if (ch == "|") {
		this.speed = new Vector(0, 2);
	}
}
Taniwha.prototype.type = "taniwha";

function Fireball(pos, ch) {
	this.pos = pos;
	this.size = new Vector(0.6, 1);
	this.repeatPos = pos;
	if (ch == "^") {
		this.speed = new Vector(0, -3);
	} else if (ch == "v") {
		this.speed = new Vector(0, 3);
	} else if (ch == "<") {
		this.speed = new Vector(-3, 0);
	} else if (ch == ">") {
		this.speed = new Vector(3, 0);
	}
}
Fireball.prototype.type = "fireball";


function Fish(pos) {
  this.basePos = this.pos = pos.plus(new Vector(0.2, 0.1));
  this.size = new Vector(0.6, 1);
  this.wobble = Math.random() * Math.PI * 2;
}
Fish.prototype.type = "fish";

var simpleLevel = new Level(simpleLevelPlan);

function elt(name, className) {
  var elt = document.createElement(name);
  if (className) elt.className = className;
  return elt;
}

function DOMDisplay(parent, level) {
  this.wrap = parent.appendChild(elt("div", "game"));
  this.level = level;

  this.wrap.appendChild(this.drawBackground());
  this.actorLayer = null;
  this.drawFrame();
}

var scale = 20;

DOMDisplay.prototype.drawBackground = function() {
  var table = elt("table", "background");
  table.style.width = this.level.width * scale + "px";
  this.level.grid.forEach(function(row) {
    var rowElt = table.appendChild(elt("tr"));
    rowElt.style.height = scale + "px";
    row.forEach(function(type) {
      rowElt.appendChild(elt("td", type));
    });
  });
  return table;
};

DOMDisplay.prototype.drawActors = function() {
  var wrap = elt("div");
  this.level.actors.forEach(function(actor) {
    var rect = wrap.appendChild(elt("div",
                                    "actor " + actor.type));
    rect.style.width = actor.size.x * scale + "px";
    rect.style.height = actor.size.y * scale + "px";
    rect.style.left = actor.pos.x * scale + "px";
    rect.style.top = actor.pos.y * scale + "px";
  });
  return wrap;
};

DOMDisplay.prototype.drawFrame = function() {
  if (this.actorLayer)
    this.wrap.removeChild(this.actorLayer);
  this.actorLayer = this.wrap.appendChild(this.drawActors());
  this.wrap.className = "game " + (this.level.status || "");
  this.scrollPlayerIntoView();
};

DOMDisplay.prototype.scrollPlayerIntoView = function() {
  var width = this.wrap.clientWidth;
  var height = this.wrap.clientHeight;
  var margin = width / 3;

  // The viewport
  var left = this.wrap.scrollLeft, right = left + width;
  var top = this.wrap.scrollTop, bottom = top + height;

  var player = this.level.player;
  var center = player.pos.plus(player.size.times(0.5))
                 .times(scale);

  if (center.x < left + margin)
    this.wrap.scrollLeft = center.x - margin;
  else if (center.x > right - margin)
    this.wrap.scrollLeft = center.x + margin - width;
  if (center.y < top + margin)
    this.wrap.scrollTop = center.y - margin;
  else if (center.y > bottom - margin)
    this.wrap.scrollTop = center.y + margin - height;
};

DOMDisplay.prototype.clear = function() {
  this.wrap.parentNode.removeChild(this.wrap);
};

Level.prototype.obstacleAt = function(pos, size) {
  var xStart = Math.floor(pos.x);
  var xEnd = Math.ceil(pos.x + size.x);
  var yStart = Math.floor(pos.y);
  var yEnd = Math.ceil(pos.y + size.y);

  if (xStart < 0 || xEnd > this.width || yStart < 0)
    return "wall";
  if (yEnd > this.height)
    return "hole"; // (iteration5)
  for (var y = yStart; y < yEnd; y++) {
    for (var x = xStart; x < xEnd; x++) {
      var fieldType = this.grid[y][x];
      if (fieldType) return fieldType;
    }
  }
};

Level.prototype.actorAt = function(actor) {
  for (var i = 0; i < this.actors.length; i++) {
    var other = this.actors[i];
    if (other != actor &&
        actor.pos.x + actor.size.x > other.pos.x &&
        actor.pos.x < other.pos.x + other.size.x &&
        actor.pos.y + actor.size.y > other.pos.y &&
        actor.pos.y < other.pos.y + other.size.y)
      return other;
  }
};

var maxStep = 0.05;

Level.prototype.animate = function(step, keys) {
  if (this.status != null)
    this.finishDelay -= step;

  while (step > 0) {
    var thisStep = Math.min(step, maxStep);
    this.actors.forEach(function(actor) {
      actor.act(thisStep, this, keys);
    }, this);
    step -= thisStep;
  }
};

Taniwha.prototype.act = function(step, level) {
	var newPos = this.pos.plus(this.speed.times(step));
	if (!level.obstacleAt(newPos, this.size)) {
		this.pos = newPos;
	} else 
		this.speed = this.speed.times(-1);
};

Fireball.prototype.act = function(step, level) {
	var newPos = this.pos.plus(this.speed.times(step));
	if (!level.obstacleAt(newPos, this.size)) {
		this.pos = newPos;
	} else
		this.pos = this.repeatPos;
};

var wobbleSpeed = 8, wobbleDist = 0.07;

Fish.prototype.act = function(step) {
  this.wobble += step * wobbleSpeed;
  var wobblePos = Math.sin(this.wobble) * wobbleDist;
  this.pos = this.basePos.plus(new Vector(0, wobblePos));
};

var playerXSpeed = 5;

Player.prototype.moveX = function(step, level, keys) {
  this.speed.x = 0;
  if (keys.left) this.speed.x -= playerXSpeed;
  if (keys.right) this.speed.x += playerXSpeed;

  var bump = new Vector(this.speed.x * (step * -2), 0);
  var motion = new Vector(this.speed.x * step, 0);
  var newPos = this.pos.plus(motion);
  var obstacle = level.obstacleAt(newPos, this.size); 	// check for obstacle at new location
  if (obstacle || this.detectBlockObstruction(level, motion)) {		// collision detection
      level.playerTouched(obstacle);
	  if (this.detectBlockObstruction(level, motion))
		this.pos = this.pos.plus(bump);
  }
  else
    this.pos = newPos; 
};

// NEW moveY	(iteration1)
var playerYSpeed = 5;

// (iteration2)
Player.prototype.detectBlockObstruction = function(level, motion) {
	var isBlock = level.actorAt(this);
	var obstacle = false;
    if (isBlock) {
		var newPos = isBlock.pos.plus(motion);
		obstacle = level.obstacleAt(newPos, isBlock.size);
		return obstacle;
	}		
};

// (iteration1)
Player.prototype.moveY = function(step, level, keys) {
  this.speed.y = 0;
  if (keys.up) this.speed.y -= playerYSpeed;
  if (keys.down) this.speed.y += playerYSpeed;

  var bump = new Vector(0, this.speed.y * (step * -2));
  var motion = new Vector(0, this.speed.y * step);
  var newPos = this.pos.plus(motion);
  var obstacle = level.obstacleAt(newPos, this.size);
  if (obstacle || this.detectBlockObstruction(level, motion)) {
    level.playerTouched(obstacle);
	if (this.detectBlockObstruction(level, motion))
		this.pos = this.pos.plus(bump);
  }
  else 
    this.pos = newPos;
};

// (iteration2)
var blockXSpeed = 10;

Block.prototype.moveX = function(step, level, keys) {
  this.speed.x = 0;
  if (keys.left) this.speed.x -= blockXSpeed;
  if (keys.right) this.speed.x += blockXSpeed;

  var motion = new Vector(this.speed.x * step, 0);
  var newPos = this.pos.plus(motion);
  var obstacle = level.obstacleAt(newPos, this.size); 
  if (obstacle) 
    level.blockTouched(obstacle);
  else
    this.pos = newPos;
};

// (iteration2)
var blockYSpeed = 10;

Block.prototype.moveY = function(step, level, keys) {
  this.speed.y = 0;
  if (keys.up) this.speed.y -= blockYSpeed;
  if (keys.down) this.speed.y += blockYSpeed;

  var motion = new Vector(0, this.speed.y * step);
  var newPos = this.pos.plus(motion);
  var obstacle = level.obstacleAt(newPos, this.size); 
  if (obstacle) 
    level.blockTouched(obstacle);
  else
    this.pos = newPos;
};

Player.prototype.act = function(step, level, keys) {
  this.moveX(step, level, keys);
  this.moveY(step, level, keys);
  
  var otherActor = level.actorAt(this);
  if (otherActor) 
    level.playerTouched(otherActor.type, otherActor); // sense other actors 
  
  // Losing animation
  if (level.status == "lost") {
    this.pos.y += step;
    this.size.y -= step;
  }
};

// (iteration2)
Block.prototype.act = function(step, level, keys) {
  var otherActor = level.actorAt(this);
  if (otherActor) {
    level.blockTouched(otherActor.type, otherActor);
    
    this.moveX(step, level, keys);
    this.moveY(step, level, keys);  
  }
};

Level.prototype.playerTouched = function(type, actor) {
  // (iteration5)
  if ((type == "hole" || type == "taniwha" || type == "fireball") && this.status == null) {	
    this.status = "lost";
    this.finishDelay = 1;
  } 
  else if (type == "block") { 
    return actor.type == "block";
  }
};

// (iteration2)
Level.prototype.blockTouched = function(type, actor) {
  if (type == "fish") {
    this.actors = this.actors.filter(function(other) {
      return other != actor;
    });
    if (!this.actors.some(function(actor) {
      return actor.type == "fish";
    })) {
      this.status = "won";
      this.finishDelay = 1;
    }
  }
};

var arrowCodes = {37: "left", 38: "up", 39: "right", 40: "down"};

function trackKeys(codes) {
  var pressed = Object.create(null);
  function handler(event) {
    if (codes.hasOwnProperty(event.keyCode)) {
      var down = event.type == "keydown";
      pressed[codes[event.keyCode]] = down;
      event.preventDefault();
    }
  }
  addEventListener("keydown", handler);
  addEventListener("keyup", handler);
  return pressed;
}

function runAnimation(frameFunc) {
  var lastTime = null;
  function frame(time) {
    var stop = false;
    if (lastTime != null) {
      var timeStep = Math.min(time - lastTime, 100) / 1000;
      stop = frameFunc(timeStep) === false;
    }
    lastTime = time;
    if (!stop)
      requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
};

var arrows = trackKeys(arrowCodes);

function runLevel(level, Display, andThen) {
  var display = new Display(document.body, level);
  runAnimation(function(step) {
    level.animate(step, arrows);
    display.drawFrame(step);
    if (level.isFinished()) {
      display.clear();
      if (andThen)
        andThen(level.status);
      return false;
    }
  });
};

// (iteration6)
var gameOver = document.createElement("img");
gameOver.src = "img/youDied.png";

var gameWin = document.createElement("img");
gameWin.src = "img/congrats.png";

var welcome = document.createElement("img");
welcome.src = "img/welcome.png";

function runGame(plans, Display) {
    var splashScreen = document.createElement("canvas");
    var n = 0;
    var level = new Level(plans[n]);
    var cx = splashScreen.getContext("2d");

    function reset() {
        splashScreen.parentNode.removeChild(splashScreen);
        WelcomeScreen();
    }

    function startLevel(n) {
        runLevel(new Level(plans[n]), Display, function(status) {
            if (status == "lost") {
                splashScreen.width = Math.min(600, level.width * scale);
                splashScreen.height = Math.min(450, level.height * scale);
                document.body.appendChild(splashScreen);
                cx.drawImage(gameOver,
                    0, 0, splashScreen.width, splashScreen.height);
                window.setTimeout(reset, 2000);
            } else if (n < plans.length - 1) {
                startLevel(n + 1);
            } else {
                splashScreen.width = Math.min(600, level.width * scale);
                splashScreen.height = Math.min(450, level.height * scale);
                document.body.appendChild(splashScreen);
                cx.drawImage(gameWin,
                    0, 0, splashScreen.width, splashScreen.height);
                window.setTimeout(reset, 5000);
            }
        });
    }
    startLevel(0);
}

// (iteration6)
var welcomeScreen = document.createElement("canvas");

// (iteration6)
function resetWS() {
    welcomeScreen.parentNode.removeChild(welcomeScreen);
    runGame(GAME_LEVELS, CanvasDisplay);
}

// (iteration6)
function WelcomeScreen() {
    welcomeScreen.width = 580;
    welcomeScreen.height = 320;
    document.body.appendChild(welcomeScreen);
    var cx = welcomeScreen.getContext("2d");
    cx.drawImage(welcome,
        0, 0, welcomeScreen.width, welcomeScreen.height);
    document.addEventListener("keypress", resetWS);
}