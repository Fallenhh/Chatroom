/**
 * Created by HouRuidong on 2016/8/26.
 */
function CheckUserName(username) {
    var checkdata = {username: username};
    $.ajax({
        type: 'POST',
        dataType: 'json',
        url: "/products/checkusername/",
        data: JSON.stringify(checkdata),
        contentType: 'application/json; charset=utf-8',
        success: function(data, status, xhr){
            if (data == "1"){
                $("input[name=username]")[0].value = "";
                $("input[name=username]")[0].placeholder = "用户名被占用";
                $("input[name=username]")[1].placeholder = "用户名";
            }
            else{
                $("input[name=username]")[0].placeholder = "用户名";
                $("input[name=username]")[1].value = "";
                $("input[name=username]")[1].placeholder = "用户不存在";
            }
        }
    });
}
function CheckEmail() {
    var checkdata = {email: $("input[name=email]")[0].value};
    $.ajax({
        type: 'POST',
        dataType: 'json',
        url: "/products/checkemail/",
        data: JSON.stringify(checkdata),
        contentType: 'application/json; charset=utf-8',
        success: function(data, status, xhr) {
            if (data == "0")
                $("input[name=email]")[0].placeholder = "邮箱";
            else {
                $("input[name=email]")[0].value = "";
                $("input[name=email]")[0].placeholder = "邮箱已存在";
            }
        }
    });
}
function CheckPasswd() {
    var checkdata = {username: $("input[name=username]")[1].value, passwd: $("input[name=passwd]")[1].value};
    $.ajax({
        type: 'POST',
        dataType: 'json',
        url: "/products/checkpasswd/",
        data: JSON.stringify(checkdata),
        contentType: 'application/json; charset=utf-8',
        success: function(data, status, xhr) {
            if (data == "1")
                $("input[name=passwd]")[1].placeholder = "密码";
            else {
                $("input[name=passwd]")[1].value = "";
                $("input[name=passwd]")[1].placeholder = "密码错误";
            }
        }
    });
}


var canvas,
    ctx,
    width,
    height,
    size,
    lines,
    tick;

function line() {
    this.path = [];
    this.speed = rand(10, 20);
    this.count = randInt(10, 30);
    this.x = width / 2, +1;
    this.y = height / 2 + 1;
    this.target = {
        x: width / 2,
        y: height / 2
    };
    this.dist = 0;
    this.angle = 0;
    this.hue = tick / 5;
    this.life = 1;
    this.updateAngle();
    this.updateDist();
}

line.prototype.step = function(i) {
    this.x += Math.cos(this.angle) * this.speed;
    this.y += Math.sin(this.angle) * this.speed;

    this.updateDist();

    if (this.dist < this.speed) {
        this.x = this.target.x;
        this.y = this.target.y;
        this.changeTarget();
    }

    this.path.push({
        x: this.x,
        y: this.y
    });
    if (this.path.length > this.count) {
        this.path.shift();
    }

    this.life -= 0.001;

    if (this.life <= 0) {
        this.path = null;
        lines.splice(i, 1);
    }
};

line.prototype.updateDist = function() {
    var dx = this.target.x - this.x,
        dy = this.target.y - this.y;
    this.dist = Math.sqrt(dx * dx + dy * dy);
}

line.prototype.updateAngle = function() {
    var dx = this.target.x - this.x,
        dy = this.target.y - this.y;
    this.angle = Math.atan2(dy, dx);
}

line.prototype.changeTarget = function() {
    var randStart = randInt(0, 3);
    switch (randStart) {
        case 0: // up
            this.target.y = this.y - size;
            break;
        case 1: // right
            this.target.x = this.x + size;
            break;
        case 2: // down
            this.target.y = this.y + size;
            break;
        case 3: // left
            this.target.x = this.x - size;
    }
    this.updateAngle();
};

line.prototype.draw = function(i) {
    ctx.beginPath();
    var rando = rand(0, 10);
    for (var j = 0, length = this.path.length; j < length; j++) {
        ctx[(j === 0) ? 'moveTo' : 'lineTo'](this.path[j].x + rand(-rando, rando), this.path[j].y + rand(-rando, rando));
    }
    ctx.strokeStyle = 'hsla(' + rand(this.hue, this.hue + 30) + ', 80%, 55%, ' + (this.life / 3) + ')';
    ctx.lineWidth = rand(0.1, 2);
    ctx.stroke();
};

function rand(min, max) {
    return Math.random() * (max - min) + min;
}

function randInt(min, max) {
    return Math.floor(min + Math.random() * (max - min + 1));
}

function init() {
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
    size = 30;
    lines = [];
    reset();
    loop();
}

function reset() {
    width = Math.ceil(window.innerWidth / 2) * 2;
    height = Math.ceil(window.innerHeight / 2) * 2;
    tick = 0;

    lines.length = 0;
    canvas.width = width;
    canvas.height = height;
}

function create() {
    if (tick % 10 === 0) {
        lines.push(new line());
    }
}

function step() {
    var i = lines.length;
    while (i--) {
        lines[i].step(i);
    }
}

function clear() {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'hsla(0, 0%, 0%, 0.1';
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'lighter';
}

function draw() {
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.rotate(tick * 0.001);
    var scale = 0.8 + Math.cos(tick * 0.02) * 0.2;
    ctx.scale(scale, scale);
    ctx.translate(-width / 2, -height / 2);
    var i = lines.length;
    while (i--) {
        lines[i].draw(i);
    }
    ctx.restore();
}

function loop() {
    requestAnimationFrame(loop);
    create();
    step();
    clear();
    draw();
    tick++;
}

$(document).ready(function(){
    var pageState = "login";
    $("button#chooseSignup").click(function (){
        $("div.signupframe").css("display", "block");
        $("div.loginframe").css("display", "none");
        pageState = "signup";
    });
    $("button#chooseLogin").click(function () {
        $("div.signupframe").css("display", "none");
        $("div.loginframe").css("display", "block");
        pageState = "login";
    });
    $("input[name=username]").blur(function () {
        CheckUserName($(this)[0].value);
    });
    $("input[name=email]").blur(function () {
        CheckEmail();
    });
    $("input[name=passwd]").blur(function () {
        if (pageState == 'login') {
            CheckPasswd();
        }
    });
    $("input[name=rpasswd]").change(function () {
        if ($("input[name=passwd]")[0].value != $("input[name=rpasswd]")[0].value){
            $(this)[0].value = "";
            $(this)[0].placeholder = "密码不一致，请重新输入";
        }
        else{
            $(this)[0].placeholder = "确认密码";
        }
    });
    init();
    $(window).resize(reset);
});

