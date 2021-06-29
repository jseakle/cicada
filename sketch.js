var ZONE_WIDTH = 1200
var ZONE_HEIGHT = 560
var UI_HEIGHT = 160
var PANEL_WIDTH = 200
var INVENTORY_WIDTH = ZONE_WIDTH - PANEL_WIDTH
var FONT_SIZE = 75
var STROKE_WEIGHT = 5
var SLIDE_SPEED = 4
var FRAMERATE = 60

var image_names = ["gradient", "mushroom", "arrowR", "arrowL", "arrowD", "arrowU", "sky", "birds", "cloud", "sun", "inventory", "cowboy", "cap", "normal", "tophat", "moss", "leaves", "holes", "husk", "minnows", "stone", "lily", "dogtoy", "chair", "puff", "ivy", "grasses"
                   , "owl"]
var jpg_names = ["barn", "yard", "pond", "tree", "start"]

var ASSETS_TO_LOAD = image_names.length

var images = {}

var wordsounds = {}

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
        var sc = Math.abs(this.scale)
        return x > this.center_x - this.image.width/2 * sc &&
            x < this.center_x + this.image.width/2 * sc &&
            y > this.center_y - this.image.height/2 * sc &&
            y < this.center_y + this.image.height/2 * sc
    }

    make_word() {
    
    }

    draw() {
        if(this.image === undefined) {
            return 'weird'
        }
        push()
        if(this.center_x === undefined) {
            console.log('bad')
        }
        translate(this.center_x, this.center_y)
        if(this.scale) {
            if(this.yscale) {
                scale(this.scale, this.yscale)
            } else {
                scale(this.scale)
            }
        }
        rotate(radians(-this.angle))
        image(this.image, -this.image.width/2, -this.image.height/2)
        pop()
    }
}

class Arrow extends Sprite {

    constructor(x, y, dir, to_zone) {
        super("arrow"+dir, x, y)
        this.scale = .4
        this.to_zone = to_zone
    }

    click() {
        game.zone = game.zones[this.to_zone]
    }

}

class Item extends Sprite {

    constructor(image, x, y, {angle=0, scale=1, yscale=undefined, spawn_y=0}={}) {
        super(image, x, y)
        this.spawn_x = this.center_x
        this.spawn_y = spawn_y + this.center_y - Math.floor(this.image.height/2) - 30
        this.angle = angle
        this.scale = scale
        this.yscale = yscale
        loadJSON('words/'+image+'.json', (wordlist)=>{this.wordlist = wordlist}, (x)=>{})
    }
    
    click() {
        var word = choice(this.wordlist)
        game.zone.texts.push(new Text(word, this.spawn_x, this.spawn_y))
    }
}

class Cicada extends Item {
    constructor(img, x, y) {
        super(img, x, y)
        this.scale = .9
    }
}

class Normal extends Cicada {
    constructor() {
        super("normal", 179, 340)
        this.angle = 15
    }
}
class Tophat extends Cicada {
    constructor() {
        super("tophat", 450, 220)
    }
}
class Cap extends Cicada {
    constructor() {
        super("cap", 750, 200)
    }
}
class Cowboy extends Cicada {
    constructor() {
        super("cowboy", 1050, 100)
        this.scale = -.9
        this.yscale = .9
        this.angle = 10
    }
}


class Zone extends Sprite {
    constructor(name) {
        super(name)
        this.sprites = []
        this.texts = []
    }

    async speak() {
        var loc_map = {}
        this.texts.forEach((text) => {
            loc_map[str(Math.floor(text.center_x))+","+str(Math.floor(text.center_y))] = text
        })
        console.log(loc_map)
        var timer = 0
        this.dots = []
        for(var i=0;i<ZONE_HEIGHT;i+=3) {
            for(var j=0;j<ZONE_WIDTH/4;j++) {
                var played = 0
                for(var c=0;c<4;c++) {
                    var txt = loc_map[str(ZONE_WIDTH/4*c+j)+","+str(i)] || loc_map[str(ZONE_WIDTH/4*c+j)+","+str(i-1)] || loc_map[str(ZONE_WIDTH/4*c+j)+","+str(i-2)]
                    this.dots.push(createVector(ZONE_WIDTH/4*c+j, i))
                    if(txt) {
                        wordsounds[txt.word].play()
                        played += 1
                        console.log(i, j, c)
                    }
                }
                if(played) {
                    await(sleep(200))
                    console.log(played)
                }
                timer += 1
                if(timer == 20) {
                    await sleep(1)
                    timer = 0
                }
                this.dots = []

            }
        }
    }

    draw() {
        image(this.image,0,0)
        
        this.sprites.forEach((sprite) => {
            sprite.draw()
        })

        this.texts.forEach((text) => {
            text.draw()
        })
    }
}

class Forest extends Zone {

    constructor() {
        super("start")

        this.sprites = [
            new Arrow(ZONE_WIDTH-60, ZONE_HEIGHT/2 + 70, "R", "tree"),
            new Arrow(60, ZONE_HEIGHT/2 + 180, "L", "pond"),
            new Normal(),
            new Tophat(),
            new Cap(),
            new Cowboy(),
            new Item('husk', 300, ZONE_HEIGHT - 50)
        ]

        this.texts = [
        ]
    }

    draw() {
        super.draw()
        this.sprites.forEach((sprite) => {
            sprite.draw();
        })

        this.texts.forEach((text) => {
            text.draw();
        })
        fill(0)
        line(ZONE_WIDTH/4, 0, ZONE_WIDTH/4, ZONE_HEIGHT)
        line(ZONE_WIDTH/4 * 2, 0, ZONE_WIDTH/4 * 2, ZONE_HEIGHT)
        line(ZONE_WIDTH/4 * 3, 0, ZONE_WIDTH/4 * 3, ZONE_HEIGHT)

        if(this.dots) {
            this.dots.forEach((dot) => {
                ellipse(dot.x, dot.y, 3)
            })
        }

    }
}

class Sky extends Zone {

    constructor() {
        super("sky")

        this.sprites = [
            new Item('sun', ZONE_WIDTH/2, 120, {'spawn_y': 240}),
            new Item('cloud', ZONE_WIDTH*.82, 120, {'spawn_y': 115}),
            new Item('birds', ZONE_HEIGHT/4, 200),
            new Arrow(ZONE_WIDTH/3, ZONE_HEIGHT-65, "D", "barn"),
            new Arrow(2*(ZONE_WIDTH/3), ZONE_HEIGHT-65, "D", "yard")
        ]
    }
}
        
            
class Tree extends Zone {

    constructor() {
        super("tree")

        this.sprites = [
            new Item('mushroom', 640, 470, {'angle':270, 'spawn_y':-40}),
            new Item('moss', 1080, 210, {'angle':0, 'scale':-1, 'yscale':1}),
            new Item('holes', 440, 305, {'angle':10,'scale':.8}),
            new Item('leaves', 200, 510),
            new Arrow(70, ZONE_HEIGHT/2 + 50, "L", "forest"),
            new Arrow(ZONE_WIDTH-70, ZONE_HEIGHT/2 + 100, "R", "barn")
        ]
    }
}

class Pond extends Zone {

    constructor() {
        super("pond")

        this.sprites = [
            new Item('lily', 980, 360, {'scale':.6, 'angle': 0,'spawn_y':35}),
            new Item('minnows', 400, 300, {'scale':.5,'spawn_y':60}),
            new Item('stone', 750, 250, {'scale': .7, 'angle': 180, 'spawn_y':20}),
            //new Item('turtle', 
            new Arrow(70, ZONE_HEIGHT/2, "L", "yard"),
            new Arrow(ZONE_WIDTH-70, ZONE_HEIGHT/2 + 180, "R", "forest")
        ]
    }
}

class Yard extends Zone {

    constructor() {
        super("yard")

        this.sprites = [
            new Item('dogtoy', 930, 480, {'scale': .9, 'spawn_y':16}),
            new Item('chair', 200, 280, {'scale':-1, 'yscale': 1}),
            new Item('puff', 600, 320, {'scale': .7, 'spawn_y':30}),
            new Arrow(70, ZONE_HEIGHT/2 + 100, "L", "barn"),
            new Arrow(ZONE_WIDTH-70, ZONE_HEIGHT/2, "R", "pond"),
            new Arrow(ZONE_WIDTH/3 - 10, 100, "U", "sky")
        ]
    }
}

class Barn extends Zone {

    constructor() {
        super("barn")

        this.sprites = [
            new Item('owl', 1000, 490),
            //new Item('slats',
            new Item('ivy', 450, 395, {'scale': .6, 'spawn_y': 65}),
            new Item('grasses', 280, 495),
            new Arrow(70, ZONE_HEIGHT/2 + 90, "L", "tree"),
            new Arrow(ZONE_WIDTH-70, ZONE_HEIGHT/2, "R", "yard"),
            new Arrow(2*(ZONE_WIDTH/3) + 130, 55, "U", "sky")
        ]
    }
}


class Text extends Sprite {

    constructor(word, x, y) {
        let image = txtimg(word)
        super(image)
        this.word = word
        this.dragging = false;
        this.set_position(x, y)
        this.scale = 1
        var to_delete = this.overlapping()
        while(to_delete) {
            game.zone.texts.splice(game.zone.texts.indexOf(to_delete), 1)
            to_delete = this.overlapping()
        }
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
            this.target = createVector(this.old_x, this.old_y)
        } else {
            this.target = undefined
        }
    }

    overlapping() {
        var left = this.center_x - this.image.width/2
        var right = this.center_x + this.image.width/2
        var top = this.center_y - this.image.height/2
        var bot = this.center_y + this.image.height/2

        if(left < -(this.image.width/2) || right > ZONE_WIDTH + this.image.width/2 || top < -10 || bot > ZONE_HEIGHT + UI_HEIGHT || bot > ZONE_HEIGHT && top < ZONE_HEIGHT) {
            return true
        }

        return game.zone.texts.concat(game.inventory_texts).find((text) => {
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

            return true
        })
    }

    draw() {
        if(this.dragging) {
            this.set_position(mouseX + this.mouse_offset_x, mouseY + this.mouse_offset_y)
        }
        if(this.target) {
            var cur_vec = createVector(this.center_x, this.center_y)
            var mov_vec = p5.Vector.sub(this.target, cur_vec)
            if(SLIDE_SPEED >= cur_vec.dist(this.target)) {
                mov_vec.setMag(cur_vec.dist(this.target))
            } else {
                mov_vec.setMag(SLIDE_SPEED)
            }
            var result_vec = p5.Vector.add(cur_vec, mov_vec)
            this.set_position(result_vec.x, result_vec.y)
        }
        super.draw()
    }
}

async function mousePressed() {
    if(mouseButton === LEFT) {
        if(!game.check_drag()) {
            game.check_click()
        }
    } else {
        game.undrag();
    }
    return false;
}

async function mouseReleased() {
    game.undrag();
    game.finish_click();
    return false;
}



class Game {

    constructor() {
        this.inventory_texts = []
        this.setup()
    }

    setup() {
        this.zones = {
            "forest": new Forest(),
            "tree": new Tree(),
            "sky": new Sky(),
            "pond": new Pond(),
            "yard": new Yard(),
            "barn": new Barn(),
        }
        this.zone = this.zones["forest"]
    }

    check_drag() {
        return this.zone.texts.concat(this.inventory_texts).some((text) => {
            if(text.is_moused()) {
                text.start_dragging();
                console.log(1)
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
                this.possibly_clicked = sprite
                return true
            }
        })
    }

    finish_click() {
        if(this.possibly_clicked && this.possibly_clicked.is_moused()) {
            this.possibly_clicked.click()
            this.possibly_clicked = undefined
        }
    }
            

    in_inventory(sprite) {
        return sprite.center_y > ZONE_HEIGHT && sprite.center_x + sprite.image.width/2 < INVENTORY_WIDTH
    }


    draw() {
        image(images["inventory"], 0, ZONE_HEIGHT)
        this.zone.draw()
        this.inventory_texts.forEach((text) => {
            text.draw()
        })
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
            loaded += 1
        })
    })
    await asyncForEach(jpg_names, (name) => {
        images[name] = loadImage("images/"+name+".jpg", img => {
            loaded += 1
        })
    })

}

function txtimg(txt) {
    if(typeof wordsounds[txt] === 'undefined') {
        loadSound('sounds/'+txt+'.mp3', (snd) => {
            wordsounds[txt] = snd
            snd.playMode('sustain')
        })
    }
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
    frameRate(FRAMERATE)
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
