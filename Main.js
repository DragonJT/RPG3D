
function CreateGL(){
    var canvas = document.createElement('canvas');
    document.body.appendChild(canvas);
    canvas.width = window.innerWidth + 2;
    canvas.height = window.innerHeight + 2;
    document.body.style.margin = '0px';
    document.body.style.overflow = 'hidden';
    return canvas.getContext('webgl2');
}

function download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
  
    element.style.display = 'none';
    document.body.appendChild(element);
    element.addEventListener('click', e=>e.stopPropagation());
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

class SceneView{

    constructor(){
        this.objMesh = new ObjMesh();
        this.litRenderer = new LitRenderer();
        //this.colliders = [];
    }

    Clear(){
        this.objMesh.Clear();
        //this.colliders = [];
    }

    AddBoxFromTo(from, to, color){
        var center = Center(from, to);
        var size = MulScalar(Abs(Sub(from, to)), 0.5);
        var matrix = MultiplyMatrices(TranslateMatrix(center[0], center[1], center[2]), ScaleMatrix(size[0], size[1], size[2]));
        //this.colliders.push({center, size});
        this.objMesh.AddCube(matrix, color);
    }

    AddPlaneFromTo(from, to, color){
        var center = Center(from, to);
        var size = MulScalar(Abs(Sub(from, to)), 0.5);
        var matrix = MultiplyMatrices(TranslateMatrix(center[0], center[1], center[2]), ScaleMatrix(size[0], size[1], size[2]));
        this.objMesh.AddPlane(matrix, color);
    }

    AddBoxLookingAt(from, to, radius, color){
        var eye = MulScalar(Add(from, to), 0.5);
        var length = Length(Sub(from, to)) * 0.5;
        var matrix = MultiplyMatrices(InvertMatrix(LookAtMatrix(eye, to, [0,1,0])), ScaleMatrix(radius,radius,length));
        this.objMesh.AddCube(matrix, color);
    }

    UpdateData(){
        this.litRenderer.SetObjMeshData(this.objMesh);
    }
/*
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
        if(keys.ArrowUp){
           this.PlayerMove(speed);
        }
        if(keys.ArrowDown){
            this.PlayerMove(-speed);
        }
        if(keys.ArrowLeft){
            this.camera.roty-=rotSpeed;
        }
        if(keys.ArrowRight){
            this.camera.roty+=rotSpeed;
        }
    }
*/
    Render(camera){
        //this.PlayerMovement();
        gl.enable(gl.DEPTH_TEST);
        this.litRenderer.Render(Identity(), camera);
    }
}

class LevelEditor{

    constructor(){
        this.size = [100,100];
        this.objects = [];
        this.canvas = new Canvas2DMesh();
        this.camera = new OrbitCamera([this.size[0]*0.5, 0, this.size[1]*0.5], 35, 0.4*Math.PI, 0);

        this.groundColor = [0.8,1,0.4];
        this.boxColor = [0.1,0.1,0.1];
        this.playerColor = [0,0,1];

        this.mode = 'box';
        this.clicks = 0;
        this.ui = new UI([0,0,200,300]);
        this.ui.AddOptions(['box', 'player'], o=>this.mode = o);
        this.sceneView = new SceneView();
        this.UpdateObjects();
    }

    MouseRay(action){
        var ray = ScreenToWorldMatrixRay(this.camera.ScreenToWorldMatrix(), mouse.position);
        var plane = {center:[0,0,0], normal:[0,1,0]};
        var point = RayPlaneIntersection(ray, plane);
        if(point){
            action(point);
        }
    }

    UpdateObjects(){
        this.sceneView.Clear();
        this.sceneView.AddPlaneFromTo([0,-0.5,0], [this.size[0], 0.5, this.size[1]], this.groundColor);
        for(var o of this.objects){
            if(o.type == 'box'){
                this.sceneView.AddBoxFromTo([o.x, 0, o.y], [o.x2, 1, o.y2], this.boxColor);
            }
            /*else if(o.type == 'player'){
                this.sceneView.camera.x = o.x*scale;
                this.sceneView.camera.y = o.y*scale;
            }*/
        }
        this.sceneView.UpdateData();
    }

    OnEvent(e){
        if(e.type == 'render'){
            e.canvas = this.canvas;
            var r = this.ui.rect;
            this.canvas.SetSize(r[0], r[1], r[2], r[3]);
        }

        this.ui.OnEvent(e);
        this.camera.OnEvent(e);
        if(e.used){
            return;
        }

        if(e.type == 'click'){
            if(e.button == 0){
                if(this.mode == 'box'){
                    if(this.clicks == 0){
                        this.MouseRay(p=>{
                            this.objects.push({type:'box', x:p[0], y:p[2], x2:p[0], y2:p[2]});
                            this.clicks = 1;
                            this.UpdateObjects();
                        })
                    }
                    else if(this.clicks == 1){
                        this.clicks = 0;
                    }
                }
                else if(this.mode == 'player'){
                    this.objects.push({type:'player', x:mouse.position[0], y:mouse.position[1]});
                }
            }
        }
        else if(e.type == 'mousemove'){
            if(this.mode == 'box' && this.clicks == 1){
                this.MouseRay(p=>{
                    var lastObject = this.objects[this.objects.length-1];
                    lastObject.x2 = p[0];
                    lastObject.y2 = p[2];
                    this.UpdateObjects();
                })
            }
        }
        else if(e.type == 'render'){
            this.sceneView.Render(this.camera);
            gl.disable(gl.DEPTH_TEST);
            this.canvas.Render();
        }
    }
}

var gl = CreateGL();
var keys = {};
var mouse = {position:[0,0], lastPosition:[0,0], relativePosition:[0,0], pressed:false};
var style = {fontSize:25, lineSize:30, padding:8};

var levelEditor = new LevelEditor();
var editor = levelEditor;

function Render(){
    gl.clearColor(0.5, 0.5, 0.5, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.viewport(0,0,gl.canvas.width,gl.canvas.height);
    gl.enable(gl.CULL_FACE);
    editor.OnEvent({type:'render'});
    requestAnimationFrame(Render);
}

function Resize(e){
    gl.canvas.width = window.innerWidth + 2;
    gl.canvas.height = window.innerHeight + 2;
    editor.OnEvent(e);
}

function KeyDown(e){
    keys[e.key] = true;
    editor.OnEvent(e);
}

function KeyUp(e){
    keys[e.key] = false;
    editor.OnEvent(e);
}

function Click(e){
    editor.OnEvent(e);
}

function MouseDown(e){
    mouse['button'+e.button] = true;
    editor.OnEvent(e);
}

function MouseUp(e){
    mouse['button'+e.button] = false;
    editor.OnEvent(e);
}

function MouseMove(e){
    mouse.lastPosition = mouse.position;
    mouse.position = [e.clientX, e.clientY];
    mouse.relativePosition = [mouse.position[0] - mouse.lastPosition[0], mouse.position[1] - mouse.lastPosition[1]];
    editor.OnEvent(e);
}

addEventListener('resize', Resize);
addEventListener('click', Click);
addEventListener('mousemove', MouseMove);
addEventListener('mousedown', MouseDown);
addEventListener('mouseup', MouseUp);
addEventListener('keydown', KeyDown);
addEventListener('keyup', KeyUp);
Render();


