
function LevelEditor(){
    function UpdateObjects(){
        objMesh.Clear();
        objMesh.AddPlane(GetMatrixFromTo([0,0,0], [100,0,100]), [0.4,1,0.4]);
        for(var o of objects){
            objMesh.AddCube(GetMatrixFromTo(o.min, o.max), [0.1,0.1,0.1]);
        }
        litRenderer.SetObjMeshData(objMesh);
    }

    function StartDrag(){
        MouseRay(mouse.position, p=>objects.push({min:[p[0], 0, p[2]], max:[p[0], 1, p[2]]}));
    }

    function ContinueDrag(){
        MouseRay(mouse.position, p=>{
            var lastObject = objects[objects.length-1];
            lastObject.max = [p[0], 1, p[2]];
            UpdateObjects();
        });
    }

    function MouseRay(position, action){
        var matrix = ScreenToWorldMatrix(gl.canvas, camera.GetProjection(), camera.GetView());
        var ray = ScreenToWorldMatrixRay(matrix, position);
        var plane = {center:[0,0,0], normal:[0,1,0]};
        var point = RayPlaneIntersection(ray, plane);
        if(point){
            action(point);
        }
    }

    function Render(){
        gl.clearColor(0.5, 0.5, 0.5, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.viewport(0,0,gl.canvas.width,gl.canvas.height);
        gl.enable(gl.CULL_FACE);
        gl.enable(gl.DEPTH_TEST);
        litRenderer.Render();
        requestAnimationFrame(Render);
    }

    var canvas = CreateCanvas(1000, 600);
    canvas.tabIndex = 0;
    var gl = canvas.getContext('webgl2');

    var objMesh = new ObjMesh();
    var camera = OrbitCamera(gl.canvas, [50,0,50], 40, 0.4 * Math.PI, 0);
    var litRenderer = LitRenderer(gl, camera);

    var mouse = AddMouseMove(canvas);
    AddMouseDrag(gl.canvas, 0, StartDrag, ContinueDrag)
    var objects = [];
    UpdateObjects();
    Render();
    return canvas;
}

var inspector = Div({width:'200px', float:'left'},[Button('HELLO WORLD')]);
var levelEditor = LevelEditor();
var levelEditorDiv = Div({marginLeft:'220px'},[levelEditor]);
document.body.appendChild(Div({}, [inspector, levelEditorDiv]));
levelEditor.focus();