
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

var objMesh = new ObjMesh();
objMesh.LoadObj(monkey);

var gl = CreateGL();
  
var renderMesh = new LitMesh();
renderMesh.SetObjMeshData(objMesh);
var canvas2DMesh = new Canvas2DMesh();

var modelRotX = 0;
var camera = new Camera(0);

function Draw(){
    var model = rotateXMatrix(modelRotX);
    gl.clearColor(0.5, 0.5, 0.5, 0.9);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.viewport(0,0,gl.canvas.width,gl.canvas.height);

    gl.disable(gl.DEPTH_TEST);
    if(canvas2DMesh.SetSize(0,0,gl.canvas.width,gl.canvas.height)){
        canvas2DMesh.SetFont('55px Arial');
        canvas2DMesh.FillRect(0,0,canvas2DMesh.w,canvas2DMesh.h, 'rgb(50,50,50)');
        canvas2DMesh.FillText('Doom is upon you!!!', 20, 75, 'rgb(255,50,150)');
    }
    canvas2DMesh.Render();

    gl.enable(gl.DEPTH_TEST);
    renderMesh.Render(model, camera);


    camera.roty+=0.01;
    modelRotX+=0.005;
    requestAnimationFrame(Draw);
}

addEventListener('resize', Resize);
Draw();


