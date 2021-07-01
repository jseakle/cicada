var ZONE_WIDTH = 1200
var ZONE_HEIGHT = 560
var UI_HEIGHT = 160
var FONT_SIZE = 75
var STROKE_WEIGHT = 5
var SLIDE_SPEED = 4.3
var FRAMERATE = 60

var image_names = [ "screamingHour2", "gradientpurple", "gradientgreen", "gradientred", "gradientyellow", "gradientbrown", "mushroom", "arrowD", "arrowU", "sky", "birds", "cloud", "sun", "moss", "leaves", "holes", "minnows", "stone", "turtle", "lily", "dogtoy", "chair", "puff", "ivy", "grasses", "owl", "slats", "overlay", "panel", "leave_in", "leave_out", "play_in", "play_out", "pause_in", "pause_out", "download_in", "download_out", "reset_in", "reset_out", "gradient", "gradientblue",   "inventory", "cowboy", "cap", "normal", "tophat", "arrowR", "arrowL", "husk", "screamingHour1"]
var jpg_names = ["barn", "yard", "pond", "tree", "start"]

var ASSETS_TO_LOAD = 13

var images = {}

var wordsounds = {}
var sounds = {}
var starting_words_source
var starting_words

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

    mouse_down() { }
    mouse_out() { }

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
        if(this.depressed && !this.is_moused()) {
            this.mouse_out()
        }
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
        game.zone.sprites.forEach((sprite) => {
            if(sprite instanceof Cicada) {
                sprite.spoken_words.forEach((word) => {
                    game.zone.texts.splice(game.zone.texts.indexOf(word), 1)
                })
                sprite.spoken_words = []
            }
        })

        game.zone.texts.concat(game.inventory_texts).forEach((text) => {
            if(text.target) {
                console.log(1)
                text.set_position(text.target.x, text.target.y)
                text.target = undefined
            } else {
                console.log(text)
            }
        })
                                 
        game.zone = game.zones[this.to_zone]
        
    }

}

class Item extends Sprite {

    constructor(image, x, y, {angle=0, scale=1, yscale=undefined, spawn_y=0, spawn_x=0}={}) {
        super(image, x, y)
        this.spawn_x = this.center_x + spawn_x
        this.spawn_y = spawn_y + this.center_y - Math.floor(this.image.height/2) - 30
        this.angle = angle
        this.scale = scale
        this.yscale = yscale
        if(!(this instanceof Cicada) && !(this instanceof Pressable) && !(this instanceof Button)) {
            loadJSON('words/'+image+'.json', (wordlist)=>{this.wordlist = wordlist})
        }
    }
    
    click() {
        var word = choice(this.wordlist)
        if(this.image == images['turtle']) {
            game.zone.texts.push(new Text(word, game.zone.color, this.spawn_x + word.length*10, this.spawn_y))
        } else {
            game.zone.texts.push(new Text(word, game.zone.color, this.spawn_x, this.spawn_y))
        }
    }
}

class Cicada extends Item {
    constructor(img, x, y, clickable) {
        super(img, x, y)
        this.clickable = clickable
        this.scale = .9
        this.sentence = 0
        this.spoken_words = []
        this.space_width = 10
        this.line_height = 40
        this.word = choice(starting_words)
        starting_words.splice(starting_words.indexOf(this.word), 1)
    }

    click() {
        if(this.clickable && !this.spoken_words.length) {
            var [cursor_x, cursor_y] = [this.spawn_x, this.spawn_y]
            this.sentences[this.sentence].forEach((line) => {
                var txts = []
                var line_length = 0
                line.forEach((token) => {
                    if(token !== " ") {
                        if(token === "WORD") {
                            token = this.word
                            var txt = new Text(token, "blue", 0, 0)
                        } else {
                            var txt = new Text(token, "",  0, 0)
                        }
                        this.spoken_words.push(txt)
                        txts.push(txt)
                        line_length += txt.image.width
                    } else {
                        txts.push(" ")
                        line_length += this.space_width
                    }
                })
                cursor_x -= Math.floor(line_length / 2)
                txts.forEach((txt) => {
                    if(txt !== " ") {
                        txt.set_position(cursor_x + Math.floor(txt.image.width/2), cursor_y)
                        if([".", "..."].includes(txt.word)) {
                            txt.center_y += 9
                        }
                        game.zone.texts.push(txt)
                        cursor_x += txt.image.width - 4
                    } else {
                        cursor_x += this.space_width
                    }
                })
                cursor_y += this.line_height
                cursor_x = this.spawn_x
                
            })
            this.spoken = true
            this.sentence = this.sentence == 1 ? 0 : 1
        }
    }
}

class Normal extends Cicada {
    constructor(clickable=true) {
        super("normal", 157, 346, clickable)
        this.angle = 15
        this.spawn_y -= 160
        this.sentences = [
            [
                /*["what", " ", "can"],
                ["i", " ", "yell"],
                ["for", " ", "WORD", "?"],*/
                ["what"],
                ["can"],
                ["i"],
                ["yell"],
                ["for"],
                ["WORD", "?"],
            ]
        ]
    }
}
class Tophat extends Cicada {
    constructor(clickable=true) {
        super("tophat", 450, 220, clickable)
        this.spawn_y -= 40
        this.sentences = [
            [
                ["bring", " ", "me"],
                ["what", " ", "you", " ", "know"],
                [], [], [],
                ["of"],
                ["WORD", "!"],
            ]
        ]
    }
}
class Cap extends Cicada {
    constructor(clickable=true) {
        super("cap", 750, 200, clickable)
        this.spawn_y = 25
        this.spawn_x += 15
        this.sentences = [
            [
                ["can", " ", "i", " ", "really"],
                ["yell", " ", "about"],
                ["WORD", "...", "?"],
                ["help", " ", "me", "!"]
            ]
        ]
    }
}
class Cowboy extends Cicada {
    constructor(clickable=true) {
        super("cowboy", 1050, 100, clickable)
        this.scale = -.9
        this.yscale = .9
        this.angle = 10
        this.spawn_y = this.center_y + 80
        this.sentences = [
            [
                ["words", " ", "about"],
                ["WORD"],
                ["now", " ", "that"],
                ["would", " ", "be", " ", "fine", "!"]
            ]
        ]
            
    }
}

class Button extends Item {

    constructor() {
        super('screamingHour1', 0, 0)
        this.set_position(ZONE_WIDTH-this.image.width/4,
                          ZONE_HEIGHT-this.image.height/4)
        this.scale = .5
    }

    click() {
        game.zone = game.zones['compose']
        sounds['bgm'].setVolume(0, 1)
    }
}

class Pressable extends Item {

    mouse_down() {
        this.depressed = true
        this.image = this.down
    }

    mouse_out() {
        this.image = this.up
        this.depressed = false
    }
}

class Playpause extends Pressable {

    constructor() {
        super('play_out', 0, 0)
        this.set_position(957, 515)
        this.scale = .6
        this.playing = false
    }
    
    click() {
        if(!this.playing) {
            this.image = images['pause_out']
            game.zone.speak(this)
            this.playing = true
            console.log('click not playing')
        } else {
            this.image = images['play_out']
            game.zone.pause()
            this.playing = false
            console.log('click playing')
        }
    }

    mouse_down() {
        this.depressed = true
        if(this.playing) {
            console.log('down playing')
            this.image = images['pause_in']
        } else {
            console.log('down not playing')
            this.image = images['play_in']
        }
    }

    mouse_out() {
        this.depressed = false
        if(this.playing) {
            this.image = images['pause_out']
        } else {
            this.image = images['play_out']
        }
    }
}

class Leave extends Pressable {

    constructor() {
        super('leave_out')
        this.set_position(890, 495)
        this.scale = .6
        this.down = images['leave_in']
        this.up = images['leave_out']
    }

    click() {
        game.zone.pause()
        game.zone.buttons[0].playing = false // :(
        game.zone.buttons[0].image = images['play_out'] // :(
        game.zone = game.zones['forest']
        sounds['bgm'].setVolume(.2, 1)
    }
}

class Reset extends Pressable {

    constructor() {
        super('reset_out')
        this.set_position(1145, 515)
        this.scale = .6
        this.down = images['reset_in']
        this.up = images['reset_out']
    }

    click() {
        if(confirm('Do you want to erase your progress and start an entirely new session?')) {
            game.zone.pause()
            game.zone.buttons[0].playing = false // :(
            game.setup()
        }
    }
}

var envelope = new p5.Envelope(2, .1, 14, .1, 2, 0)
class Zone extends Sprite {
    constructor(name) {
        super(name)
        this.sprites = []
        this.texts = []
    }

    async speak(button) {
        this.paused = false
        var start = randrange(0,131)
        var scr = sounds['screaminghour']
        scr.play()
        scr.jump(start)
        
        envelope.triggerAttack(scr)

        var loc_map = {}
        this.texts.forEach((text) => {
            loc_map[str(Math.floor(text.center_x))+","+str(Math.floor(text.center_y))] = text
        })
        var timer = 0
        this.dots = []
        var start_i = this.saved_i || 0
        var start_j = this.saved_j || 0
        var abort = false
        for(var i=start_i;i<ZONE_HEIGHT&&!abort;i+=3) {
            for(var j=start_j;j<ZONE_WIDTH/4&&!abort;j++) {
                if(this.paused) {
                    console.log('paused_inside')
                    this.saved_i = i
                    this.saved_j = j
                    abort = true
                }
                var played = 0
                for(var c=0;c<4;c++) {
                    var txt = loc_map[str(ZONE_WIDTH/4*c+j)+","+str(i)] || loc_map[str(ZONE_WIDTH/4*c+j)+","+str(i-1)] || loc_map[str(ZONE_WIDTH/4*c+j)+","+str(i-2)]
                    this.dots.push(createVector(ZONE_WIDTH/4*c+j, i))
                    if(txt && txt.audio) {
                        wordsounds[txt.word].play()
                        played += 1
                    }
                }
                if(played) {
                    await(sleep(200))
                }
                timer += 1
                if(timer == 20) {
                    await sleep(1)
                    timer = 0
                } 
                this.dots = []

            }
        }
        if(!abort) {
            [this.saved_i, this.saved_j] = [0,0]
            envelope.triggerRelease(scr)
            button.playing = false
            button.image = images['play_out']
            button.depressed = false
        }
    }

    pause() {
        console.log('zone pause')
        this.paused = true
        var amp = new p5.Amplitude()
        amp.setInput(envelope)
        envelope.dLevel = amp.getLevel()
        envelope.rTime = 1
        envelope.triggerRelease(sounds['screaminghour'])
        envelope.rTime = 2
        envelope.dLevel = .3
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

class Compose extends Zone {
    constructor() {
        super("start")
        this.color = ""
        this.sprites = [
            new Normal(false),
            new Tophat(false),
            new Cap(false),
            new Cowboy(false),
        ]
        this.buttons = [
            new Playpause(),
            new Leave(),
//            new Save(),
            new Reset()
        ]        
    }

    draw() {
        super.draw()
        image(images['overlay'],0,0)
        var panel = images['panel']
        image(panel, ZONE_WIDTH - panel.width*.6, ZONE_HEIGHT - panel.height*.6, panel.width*.6, panel.height*.6)
        this.buttons.forEach((button) => button.draw())
    }
}

class Forest extends Zone {

    constructor() {
        super("start")
        this.color = ""
        this.sprites = [
            new Arrow(ZONE_WIDTH-60, ZONE_HEIGHT/2 + 80, "R", "tree"),
            new Arrow(60, ZONE_HEIGHT/2 + 180, "L", "pond"),
            new Normal(),
            new Tophat(),
            new Cap(),
            new Cowboy(),
            new Item('husk', 700, ZONE_HEIGHT - 60, {"angle": -23}),
            new Button(),
        ]

        this.texts = [
        ]
    }

    draw() {
        super.draw()
        
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
        this.color = "red"
        this.sprites = [
            new Item('sun', ZONE_WIDTH/2, 120, {'spawn_y': 240, 'spawn_x': 5}),
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
        this.color = "brown"
        this.sprites = [
            new Item('mushroom', 640, 470, {'angle':270, 'spawn_y':-40}),
            new Item('moss', 1080, 210, {'angle':0, 'scale':-1, 'yscale':1}),
            new Item('holes', 440, 305, {'angle':10,'scale':.8}),
            new Item('leaves', 200, 510),
            new Arrow(70, ZONE_HEIGHT/2 + 50, "L", "forest"),
            new Arrow(ZONE_WIDTH-70, ZONE_HEIGHT/2 + 75, "R", "barn")
        ]
    }
}

class Pond extends Zone {

    constructor() {
        super("pond")
        this.color = "purple"
        this.sprites = [
            new Item('lily', 980, 360, {'scale':.6, 'angle': 0,'spawn_y':35}),
            new Item('minnows', 390, 390, {'scale':.4,'spawn_y':60}),
            new Item('stone', 750, 250, {'scale': .7, 'angle': 180, 'spawn_y':20}),
            new Item('turtle', 250, 140, {'spawn_x': 30, 'spawn_y': 45}),
            new Arrow(70, ZONE_HEIGHT/2, "L", "yard"),
            new Arrow(ZONE_WIDTH-70, ZONE_HEIGHT/2 + 180, "R", "forest")
        ]
    }
}

class Yard extends Zone {

    constructor() {
        super("yard")
        this.color = "green"
        this.sprites = [
            new Item('dogtoy', 930, 480, {'scale': .8, 'spawn_y':16}),
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
        this.color = "yellow"
        this.sprites = [
            new Item('owl', 1000, 490),
            //new Item('slats',
            new Item('ivy', 450, 395, {'scale': .6, 'spawn_y': 61}),
            new Item('grasses', 280, 495, {'spawn_x': -7}),
            new Item('slats', 603, 245, {'scale': .57, 'angle': -8, 'spawn_y': 47, 'spawn_x': 5}),
            new Arrow(70, ZONE_HEIGHT/2 + 100, "L", "tree"),
            new Arrow(ZONE_WIDTH-70, ZONE_HEIGHT/2, "R", "yard"),
            new Arrow(2*(ZONE_WIDTH/3) + 130, 55, "U", "sky")
        ]
    }
}


class Text extends Sprite {

    constructor(word, color, x, y) {
        var audio = !["!", ",", ".", "?", "-", "..."].includes(word)
        if(audio && typeof wordsounds[word] === 'undefined') {
            loadSound('sounds/'+word+'.mp3', (snd) => {
            wordsounds[word] = snd
            snd.playMode('sustain')
            })
        }
        var graphical_word = word
        if(word[0] === '_') {
            graphical_word = word.substring(1)
        }
        let image = txtimg(graphical_word, color, audio)
        super(image)
        this.word = word
        this.audio = audio
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
        game.zone.sprites.forEach((sprite) => {
            if(sprite instanceof Cicada) {
                var idx = sprite.spoken_words.indexOf(this)
                if(idx >= 0) {
                    sprite.spoken_words.splice(idx, 1)
                }
            }
        })
    }

    stop_dragging() {
        this.dragging = false;
        if( this.overlapping() ) {
            this.target = createVector(this.old_x, this.old_y)
            return true
        } else {
            this.target = undefined
            if(game.zone.paused) {
                game.zone.paused = false
                game.zone.saved_i = 0
                game.zone.saved_j = 0
                game.zone.buttons[0].playing = false
            }
        }
    }

    overlapping() {
        var left = this.center_x - this.image.width/2 + 7
        var right = this.center_x + this.image.width/2 - 7
        var top = this.center_y - this.image.height/2 + 7
        var bot = this.center_y + this.image.height/2 - 7

        if(left < -(this.image.width/2) || right > ZONE_WIDTH + this.image.width/2 || top < -10 || bot > ZONE_HEIGHT + UI_HEIGHT || bot > ZONE_HEIGHT && top < ZONE_HEIGHT) {
            return true
        }

        return game.zone.texts.concat(game.inventory_texts).concat(game.zone.buttons||[]).find((text) => {
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
            console.log(this.target)
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

async function keyPressed() {
    if(key == 'm') {
        game.handle_mute()
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
            "compose": new Compose(),
        }
        Object.values(this.zones).forEach(zone => zone.texts=[])
        starting_words = starting_words_source
        this.inventory_texts = []
        this.zone = this.zones["forest"]
        this.muted = false
        sounds['bgm'].play()
        sounds['bgm'].jump(0)
        sounds['bgm'].setVolume(.16)
    }

    handle_mute() {
        this.muted = !this.muted
        if(this.muted) {
            masterVolume(0, .2)
        } else {
            masterVolume(1, .2)
        }
    }

    check_drag() {
        return this.zone.texts.concat(this.inventory_texts).some((text) => {
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
                if(text.stop_dragging()) {
                    break;
                }
                    
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
        this.zone.sprites.concat(game.zone.buttons||[]).some((sprite) => {
            if(sprite.is_moused()) {
                this.possibly_clicked = sprite
                sprite.mouse_down()
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
        return sprite.center_y > ZONE_HEIGHT && sprite.center_x + sprite.image.width/2 < ZONE_WIDTH
    }


    draw() {
        image(images["inventory"], 0, ZONE_HEIGHT)
        this.zone.draw()
        this.inventory_texts.forEach((text) => {
            text.draw()
        })
    }
}

async function load_chain() {
    if(image_names.length == 0) {
        return
    }
    
    loadImage("images/"+image_names[image_names.length-1]+".png", img => {
        loaded += 1
        images[image_names[image_names.length-1]] = img
        image_names.splice(image_names.length-1, 1)
        load_chain()
    })
}
    
    

let poem;
async function preload() {
    //poem = loadFont('Great Pro.ttf')
    //poem = loadFont('Myope.ttf')
    //poem = loadFont('Irony.ttf')
    poem = loadFont('Rank Gold.ttf')

    load_chain()
    
    await asyncForEach(jpg_names, (name) => {
        images[name] = loadImage("images/"+name+".jpg", img => {
            loaded += 1
        })
    })
    loadSound('sounds/screaminghour.mp3', (snd) => { sounds['screaminghour'] = snd; snd.setLoop(true)})
    await loadSound('sounds/bgm.mp3', (snd) => { sounds['bgm'] = snd; snd.setLoop(true)})
    await loadJSON('words/starting.json', (wordlist) => {
        starting_words = wordlist
        starting_words_source = wordlist
    })
}

function txtimg(txt, color) {
   
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
    var gradient = images['gradient' + color]
    gr.copy(gradient, 0, 0, bounds.w, bounds.h, 0, 0, bounds.w, bounds.h);
    
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
