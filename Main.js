
function CreateGL(){
    var canvas = document.createElement('canvas');
    document.body.appendChild(canvas);
    canvas.width = window.innerWidth + 2;
    canvas.height = window.innerHeight + 2;
    document.body.style.margin = '0px';
    document.body.style.overflow = 'hidden';
    return canvas.getContext('webgl2');
}

function Resize(){
    gl.canvas.width = window.innerWidth + 2;
    gl.canvas.height = window.innerHeight + 2;
}

function download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
  
    element.style.display = 'none';
    document.body.appendChild(element);
  
    element.click();
  
    document.body.removeChild(element);
}

function FileUploader(action){
    var div = document.createElement('div');
    document.body.appendChild(div);
    div.style.position = 'absolute';
    div.style.left = '100px';
    div.style.top = '100px';
    div.style.width = '200px';
    div.style.height = '50px';
    div.style.backgroundColor = 'rgb(180,180,180)';

    var button = document.createElement('button');
    div.appendChild(button);
    button.style.position = 'absolute';
    button.style.left = '180px';
    button.style.top = '0px';
    button.style.width = '20px';
    button.style.height = '20px';
    button.innerHTML = 'X';
    button.onclick = ()=>div.remove();

    var input = document.createElement("input");
    input.type = "file";
    div.appendChild(input);
    var button = document.createElement('button');
    div.appendChild(button);
    button.innerHTML = 'Upload';
    button.onclick = ()=>{
        let reader = new FileReader();
        reader.onload = (e)=>{
            action(e.target.result);
        }
        reader.readAsText(input.files[0]);
        div.remove();
    };
}

function CanvasColor(color){
    return 'rgb('+color[0]*255+','+color[1]*255+','+color[2]*255+')';
}

class LevelDesigner{
    constructor(){
        this.objects = [];
        this.canvas = new Canvas2DMesh();
        this.groundColor = [0.8,1,0.4];
        this.blockColor = [0.1,0.1,0.1];
        this.playerColor = [0,0,1];
    }

    DrawObject(o){
        if(o.type == 'block'){
            var w = o.x2 - o.x;
            var h = o.y2 - o.y;
            var x = o.x;
            var y = o.y;
            if(w<0){
                x = o.x + w;
                w = Math.abs(w);
            }
            if(h<0){
                y = o.y + h;
                h = Math.abs(h);
            }
            this.canvas.FillRect(x,y,w,h,CanvasColor(this.blockColor));
        }
        else if(o.type == 'player'){
            this.canvas.FillCircle(o.x, o.y, 15, CanvasColor(this.playerColor));
        }
    }

    Draw(){
        this.canvas.FillRect(0,0,this.canvas.w, this.canvas.h, CanvasColor(this.groundColor));
        for(var o of this.objects){
            this.DrawObject(o);
        }
    }

    KeyDown(e){
        if(e.key == 'q' && !this.dragging){
            this.dragging = true;
            this.objects.push({type:'block', x:this.mousex, y:this.mousey, x2:this.mousex, y2:this.mousey});
        }
        else if(e.key == 'w'){
            this.objects.push({type:'player', x:this.mousex, y:this.mousey});
        }
        else if(e.key == 'l'){
            FileUploader(f=>this.objects = JSON.parse(f));
        }
        else if(e.key == 's'){
            download('level.json', JSON.stringify(this.objects));
        }
        else if(e.key == 'r'){
            game.Clear();
            var scale = 1/25;
            game.AddPlaneFromTo([0,-0.5,0], [gl.canvas.width*scale, 0.5, gl.canvas.height*scale], this.groundColor);
            for(var o of this.objects){
                if(o.type == 'block'){
                    game.AddCubeFromTo([o.x*scale, 0, o.y*scale], [o.x2*scale, 1, o.y2*scale], this.blockColor);
                }
                else if(o.type == 'player'){
                    game.camera.x = o.x*scale;
                    game.camera.y = o.y*scale;
                }
            }
            game.UpdateData();
            mode = game;
        }
        this.dirty = true;
    }

    KeyUp(){
        this.dragging = false;
    }

    MouseMove(e){
        this.mousex = e.clientX;
        this.mousey = e.clientY;
        if(this.dragging){
            this.objects[this.objects.length-1].x2 = this.mousex;
            this.objects[this.objects.length-1].y2 = this.mousey;
            this.dirty = true;
        }
    }

    Render(){
        gl.disable(gl.DEPTH_TEST);
        if(this.canvas.SetSize(0,0,gl.canvas.width,gl.canvas.height) || this.dirty){
            this.Draw();
        }
        this.canvas.Render();
    }
}

class Game{

    constructor(){
        this.objMesh = new ObjMesh();
        this.camera = new FPSCamera(0,0);
        this.litRenderer = new LitRenderer();
        this.colliders = [];
    }

    Clear(){
        this.objMesh.Clear();
        this.colliders = [];
    }

    AddCubeFromTo(from, to, color){
        var center = centerOfVec3s(from, to);
        var size = multiplyVec3ByScalar(absVec3(subtractVec3s(from, to)), 0.5);
        var matrix = multiplyMatrices(translateMatrix(center[0], center[1], center[2]), scaleMatrix(size[0], size[1], size[2]));
        this.colliders.push({center, size});
        this.objMesh.AddCube(matrix, color);
    }

    AddPlaneFromTo(from, to, color){
        var center = centerOfVec3s(from, to);
        var size = multiplyVec3ByScalar(absVec3(subtractVec3s(from, to)), 0.5);
        var matrix = multiplyMatrices(translateMatrix(center[0], center[1], center[2]), scaleMatrix(size[0], size[1], size[2]));
        this.objMesh.AddPlane(matrix, color);
    }

    UpdateData(){
        this.litRenderer.SetObjMeshData(this.objMesh);
    }

    KeyDown(e){
        if(e.key == 'Escape'){
            mode = levelDesigner;
        }
    }

    Collision(x,y){
        function CollisionWithCollider(x,y,cx,cy,sx,sy){
            return Math.abs(x-cx) < sx+0.5 && Math.abs(y-cy) < sy+0.5;
        }

        for(var c of this.colliders){
            if(CollisionWithCollider(x,y,c.center[0],c.center[2],c.size[0],c.size[2])){
                return true;
            }
        }
        return false;
    }

    PlayerMove(speed){
        var x = this.camera.x;
        this.camera.MoveX(speed);
        if(this.Collision(this.camera.x, this.camera.y)){
            this.camera.x = x;
        }
        var y = this.camera.y;
        this.camera.MoveY(speed);
        if(this.Collision(this.camera.x, this.camera.y)){
            this.camera.y = y;
        }
    }

    PlayerMovement(){
        var speed = 0.04;
        var rotSpeed = 0.015;
        if(inputKeys.ArrowUp){
           this.PlayerMove(speed);
        }
        if(inputKeys.ArrowDown){
            this.PlayerMove(-speed);
        }
        if(inputKeys.ArrowLeft){
            this.camera.roty-=rotSpeed;
        }
        if(inputKeys.ArrowRight){
            this.camera.roty+=rotSpeed;
        }
    }

    Render(){
        this.PlayerMovement();
        gl.enable(gl.DEPTH_TEST);
        this.litRenderer.Render(createIdentityMatrix4(), this.camera);
    }


}

var gl = CreateGL();
var levelDesigner = new LevelDesigner();
var game = new Game();
var mode = levelDesigner;
var inputKeys = {};

function Draw(){
    gl.clearColor(0.5, 0.5, 0.5, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.viewport(0,0,gl.canvas.width,gl.canvas.height);
    gl.enable(gl.CULL_FACE);

    if(mode.Render){
        mode.Render();
    }
    requestAnimationFrame(Draw);
}

function KeyDown(e){
    inputKeys[e.key] = true;
    if(mode.KeyDown){
        mode.KeyDown(e);
    }
}

function KeyUp(e){
    inputKeys[e.key] = false;
    if(mode.KeyUp){
        mode.KeyUp(e);
    }
}

function MouseMove(e){
    if(mode.MouseMove){
        mode.MouseMove(e);
    }
}

addEventListener('resize', Resize);
addEventListener('mousemove', MouseMove);
addEventListener('keydown', KeyDown);
addEventListener('keyup', KeyUp);
Draw();


