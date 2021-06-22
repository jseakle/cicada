var ZONE_WIDTH = 900
var ZONE_HEIGHT = 700
var UI_HEIGHT = 200
var PANEL_WIDTH = 200
var INVENTORY_WIDTH = ZONE_WIDTH - PANEL_WIDTH
var FONT_SIZE = 75
var STROKE_WEIGHT = 5

var image_names = ["gradient", "mushroom", "arrowR", "arrowL", "arrowD", "arrowU"]

var ASSETS_TO_LOAD = image_names.length

var images = {}


async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

function mod(n, m) {
  return ((n % m) + m) % m;
}

function randrange(min, max) {
    if(max === undefined) {
        max = Math.floor(min)
        min = 0
    } else {
        min = Math.floor(min);
        max = Math.floor(max);
    }
    return Math.floor(Math.random() * (max - min)) + min;
}

function choice(arr) {
    return arr[randrange(arr.length)]
}

async function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(() => { resolve() }, ms);
    });
}

function repeat(array, n){
  var newArray = [];
  for (var i = 0; i < n; i++){
    newArray = newArray.concat(array);
  }
  return newArray;
}

class Sprite {

    constructor(name, x, y) {
        if(typeof name === "string") {
            this.image = images[name]
        } else {
            this.image = name
        }
        this.set_position(x, y)
    }

    set_position(x, y) {
        this.center_x = x
        this.center_y = y
    }

    is_moused() {
        return this.is_interior(mouseX, mouseY)
    }

    is_interior(x, y) {
        return x > this.center_x - this.image.width/2 &&
            x < this.center_x + this.image.width/2 &&
            y > this.center_y - this.image.height/2 &&
            y < this.center_y + this.image.height/2
    }

    make_word() {
    
    }

    draw() {
        if(this.image === undefined) {
            return 'weird'
        }
        push()
        if(this.center_x === undefined) {
            console.log(1)
        }
        translate(this.center_x, this.center_y)
        if(this.scale) {
            scale(this.scale)
        }
        rotate(radians(-this.angle))
        image(this.image, -this.image.width/2, -this.image.height/2)
        pop()
    }
}

class Arrow extends Sprite {

    constructor(x, y, dir, to_zone) {
        super("arrow"+dir, x, y)
        this.to_zone = to_zone
    }

    click() {
        game.zone = game.zones[this.to_zone]
    }

}

class Item extends Sprite {
    click() {
        var word = choice(this.wordlist)
        game.zone.texts.push(new Text(word, this.center_x, this.center_y - this.image.height/2 - 30))
    }
}

class Mushroom extends Item {
    constructor(x, y) {
        super("mushroom", x, y)
        this.wordlist = ['emergence', 'chrysalis', 'unison']
        //this.scale = 4
    }
}

class Zone extends Sprite {
    constructor(name) {
        super(name)
        this.sprites = []
        this.words = []
    }

    draw() {
        this.sprites.forEach((sprite) => {
            sprite.draw()
        })

        this.words.forEach((word) => {
            word.draw()
        })
    }
}

class Forest extends Zone {

    constructor() {
        super("forest")

        this.sprites = [
            new Mushroom(600,500),
            new Arrow(ZONE_WIDTH/2, 100, "U", "oak")
            //new Arrow(ZONE_WIDTH/2, 40),
        ]

        this.texts = [
        ]
    }

    draw() {
        fill('rgba(100,20,20,50)')
        rect(0, 0, ZONE_WIDTH, ZONE_HEIGHT)

        this.sprites.forEach((sprite) => {
            sprite.draw();
        })

        this.texts.forEach((text) => {
            text.draw();
        })
    }
}

class Oak extends Zone {

    constructor() {
        super("oak")

        this.sprites = [
            new Mushroom(200,500),
            new Arrow(ZONE_WIDTH/2, ZONE_HEIGHT-100, "D", "forest")
            //new Arrow(ZONE_WIDTH/2, 40),
        ]

        this.texts = [
        ]
    }

    draw() {

        fill(20,100,20)
        rect(0, 0, ZONE_WIDTH, ZONE_HEIGHT)
    
        this.sprites.forEach((sprite) => {
            sprite.draw();
        })

        this.texts.forEach((text) => {
            text.draw();
        })
    }
}


class Text extends Sprite {

    constructor(word, x, y) {
        let image = txtimg(word)
        super(image)
        this.word = word
        this.dragging = false;
        this.set_position(x, y)
    }

    start_dragging() {
        this.old_x = this.center_x
        this.old_y = this.center_y
        this.dragging = true;
        this.mouse_offset_x = this.center_x - mouseX
        this.mouse_offset_y = this.center_y - mouseY
    }

    stop_dragging() {
        this.dragging = false;
        if( this.overlapping() ) {
            this.set_position(this.old_x, this.old_y)
        }
    }

    overlapping() {
        var left = this.center_x - this.image.width/2
        var right = this.center_x + this.image.width/2
        var top = this.center_y - this.image.height/2
        var bot = this.center_y + this.image.height/2

        if(left < -10 || right > ZONE_WIDTH + 10 || top < -10 || bot > ZONE_HEIGHT + UI_HEIGHT || bot > ZONE_HEIGHT && top < ZONE_HEIGHT) {
            return true
        }

        return game.zone.texts.some((text) => {
            if(text === this) {
                return false
            }
            if(left > text.center_x + text.image.width/2 ||
               right < text.center_x - text.image.width/2) {
                return false
            }

            if(top > text.center_y + text.image.height/2 ||
               bot < text.center_y - text.image.height/2) {
                return false
            }

            console.log(text.word)
            return true
        })
    }

    draw() {
        if(this.dragging) {
            this.set_position(mouseX + this.mouse_offset_x, mouseY + this.mouse_offset_y)
        }
        super.draw()
    }
}

async function mousePressed() {
    if(mouseButton === LEFT) {
        game.check_drag()
    } else {
        game.undrag();
    }
    return false;
}

async function mouseReleased() {
    game.undrag();
    return false;
}

async function mouseClicked() {
    if(mouseButton === LEFT) {
        game.check_click()
    }
    return false
}



class Game {

    constructor() {
        this.inventory_texts = []
        this.setup()
    }

    setup() {
        this.zones = {
            "forest": new Forest(),
            "oak": new Oak(),
            //new Oak(),
        /*    new Pond(),
            new Yard(),p
            new Barn(),
            new Sky(),*/
        }
        this.zone = this.zones["forest"]
    }

    check_drag() {
        this.zone.texts.concat(this.inventory_texts).some((text) => {
            if(text.is_moused()) {
                text.start_dragging();
                return true;
            }
        })
    }

    undrag() {
        for(var i=0; i<this.zone.texts.length;i++) {
            text = this.zone.texts[i]
            if(text.dragging) {
                text.stop_dragging();
                if(this.in_inventory(text)) {
                    console.log(1)
                    this.zone.texts.splice(i, 1)
                    this.inventory_texts.push(text)
                }
                break;
            }
        }
        
        for(var i=0; i<this.inventory_texts.length;i++) {
            text = this.inventory_texts[i]
            if(text.dragging) {
                text.stop_dragging();
                if(!this.in_inventory(text)) {
                    this.inventory_texts.splice(i, 1)
                    this.zone.texts.push(text)
                }
                break;
            }
        }
    }

    check_click() {
        this.zone.sprites.some((sprite) => {
            if(sprite.is_moused()) {
                sprite.click()
                return true
            }
        })
    }

    in_inventory(sprite) {
        return sprite.center_y > ZONE_HEIGHT && sprite.center_x < INVENTORY_WIDTH
    }


    draw() {
        this.zone.draw()
        this.inventory_texts.forEach((text) => {
            text.draw()
        })
        fill(0)
        line(0, ZONE_HEIGHT, ZONE_WIDTH, ZONE_HEIGHT)
    }
}

let poem;
async function preload() {
    //poem = loadFont('Great Pro.ttf')
    //poem = loadFont('Myope.ttf')
    //poem = loadFont('Irony.ttf')
    poem = loadFont('Rank Gold.ttf')
    await asyncForEach(image_names, (name) => {
        images[name] = loadImage("images/"+name+".png", img => {
            console.log(images[name])
            loaded += 1
        })
    })

}

function txtimg(txt) {
    bounds = poem.textBounds(txt, 0, 0, FONT_SIZE)
    if(bounds.w - int(bounds.w) > 0) {
        bounds.w = int(bounds.w + 1)
    }
    if(bounds.h - int(bounds.h) > 0) {
        bounds.h = int(bounds.h + 1)
    }
    bounds.w += 2*STROKE_WEIGHT
    bounds.h += 2*STROKE_WEIGHT
    g = createGraphics(bounds.w, bounds.h);
    g.textFont(poem);
    g.textSize(FONT_SIZE);
    g.background('rgba(0, 0, 0, 0)');
    g.fill('rgba(255, 255, 255, 1)');
    g.text(txt, STROKE_WEIGHT, bounds.h - STROKE_WEIGHT);
    mask = g.get();
    gr = createImage(bounds.w, bounds.h);
    gr.copy(images['gradient'], 0, 0, bounds.w, bounds.h, 0, 0, bounds.w, bounds.h);
    gr.mask(mask);
    strk = createGraphics(bounds.w, bounds.h);
    strk.textFont(poem);
    strk.textSize(FONT_SIZE);
    strk.background('rgba(0, 0, 0, 0)');
    strk.fill('rgba(0,0,0,0)');
    strk.stroke('rgba(0,0,0,1)')
    strk.strokeWeight(STROKE_WEIGHT)
    strk.text(txt, STROKE_WEIGHT, bounds.h - STROKE_WEIGHT);
    strk_img = strk.get();
    strk.copy(gr, 0, 0, bounds.w, bounds.h, 0, 0, bounds.w, bounds.h)
    
    return strk
}

var game;
var loaded = 0;
function setup() {
    createCanvas(ZONE_WIDTH, ZONE_HEIGHT + UI_HEIGHT);
}

function draw() {
    background(220)
    color(0,0,0);

    if(loaded < ASSETS_TO_LOAD) {
        return;
    }

    if(!game) {
        game = new Game()
    }
    
    game.draw()
}
