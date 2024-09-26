
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

class LevelDesigner{
    constructor(){
        this.objects = [];
        this.canvas = new Canvas2DMesh();
    }

    Draw(){
        function DrawObject(o){
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
                canvas.FillRect(x,y,w,h,'blue');
            }
            else if(o.type == 'player'){
                canvas.FillCircle(o.x, o.y, 15, 'yellow');
            }
        }

        var canvas = this.canvas;
        canvas.FillRect(0,0,this.canvas.w, this.canvas.h, 'rgb(50,50,50)');
        for(var o of this.objects){
            DrawObject(o);
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
            game.objMesh.Clear();
            var scale = 1/25;
            game.AddPlaneFromTo([0,-0.5,0], [gl.canvas.width*scale, 0.5, gl.canvas.height*scale]);
            for(var o of this.objects){
                if(o.type == 'block'){
                    game.AddCubeFromTo([o.x*scale, 0, o.y*scale], [o.x2*scale, 1, o.y2*scale]);
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
    }

    AddCubeFromTo(from, to){
        var center = centerOfVectors(from, to);
        var size = absVector(subtractVectors(from, to));
        var matrix = multiplyMatrices(translateMatrix(center[0], center[1], center[2]), scaleMatrix(size[0] * 0.5, size[1] * 0.5, size[2] * 0.5));
        this.objMesh.AddCube(matrix);
    }

    AddPlaneFromTo(from, to){
        var center = centerOfVectors(from, to);
        var size = absVector(subtractVectors(from, to));
        var matrix = multiplyMatrices(translateMatrix(center[0], center[1], center[2]), scaleMatrix(size[0] * 0.5, size[1] * 0.5, size[2] * 0.5));
        this.objMesh.AddPlane(matrix);
    }

    UpdateData(){
        this.litRenderer.SetObjMeshData(this.objMesh);
    }

    KeyDown(e){
        if(e.key == 'Escape'){
            mode = levelDesigner;
            console.log(mode);
        }
    }

    Render(){
        this.camera.Update();
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


