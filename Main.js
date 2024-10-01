
function LevelEditor(){

    function UpdateObjects(){
        objMesh.Clear();
        for(var o of objects){
            var matrix;
            if(o.positioning == 'ontop'){
                var pointOffset = MulScalar(o.normal, o.sizeY);
                matrix = GetMatrixFromTo(o.min, Add(o.max, pointOffset));
            }
            if(o.positioning == 'centered'){
                var pointOffset = MulScalar(o.normal, o.sizeY*0.5);
                matrix = GetMatrixFromTo(Sub(o.min, pointOffset), Add(o.max, pointOffset));
            }
            if(o.shape == 'box'){
                objMesh.AddBox(matrix, o.color);
            }
            else if(o.shape == 'cylinder'){
                objMesh.AddCylinder(matrix, 32, o.color);
            }
            else if(o.shape == 'cone'){
                objMesh.AddCone(matrix, 32, o.color);
            }
            else if(o.shape == 'sphere'){
                objMesh.AddSphere(matrix, 32, o.color);
            }
        }
        litRenderer.SetObjMeshData(objMesh);
    }

    function AxisMatrix(){
        if(axis == 'xy'){
            return LookAtMatrix([0,0,0], [1,0,0], [0,0,1]);
        }
        if(axis == 'xz'){
            return LookAtMatrix([0,0,0], [1,0,0], [0,1,0]);
        }
        if(axis == 'yz'){
            return LookAtMatrix([0,0,0], [0,1,0], [1,0,0]);
        }
    }

    function GridPlaneMatrix(){
        return MultiplyMatrices(AxisMatrix(), TranslateMatrix(0,gridY,0));
    }

    function StartDrag(){
        MouseRay(mouse.position, (p, normal)=>objects.push({shape, min:p, max:p, normal, sizeY, positioning, color}));
    }

    function ContinueDrag(){
        MouseRay(mouse.position, (p, _)=>{
            var lastObject = objects[objects.length-1];
            lastObject.max = p;
            UpdateObjects();
        });
    }

    function MouseRay(position, action){
        var matrix = ScreenToWorldMatrix(gl.canvas, camera.GetProjection(), camera.GetView());
        var ray = ScreenToWorldMatrixRay(matrix, position);
        var planeMatrix = AxisMatrix();
        var normal = MultiplyPoint(planeMatrix, [0,1,0]);
        var plane = {center:MultiplyPoint(planeMatrix, [0,gridY,0]), normal};
        var point = RayPlaneIntersection(ray, plane);
        if(point){
            action(point, normal);
        }
    }

    function Render(){
        gl.clearColor(0.5, 0.5, 0.5, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.viewport(0,0,gl.canvas.width,gl.canvas.height);
        gl.enable(gl.CULL_FACE);
        gl.enable(gl.DEPTH_TEST);
        litRenderer.Render();

        gridRenderer.Render(GridPlaneMatrix());
        requestAnimationFrame(Render);
    }

    var canvas = CreateCanvas(1000, 600);
    canvas.tabIndex = 0;
    var gl = canvas.getContext('webgl2');

    var objMesh = new ObjMesh();
    var camera = OrbitCamera(gl.canvas, [0,0,0], 40, 0, 0);
    var litRenderer = LitRenderer(gl, camera);
    var gridRenderer = GridRenderer(gl, camera, 100);

    var axis = 'xz';
    var mouse = AddMouseMove(canvas);
    var gridY = 0;
    var sizeY = 1;
    var shape = 'box';
    var positioning = 'ontop';
    var color = [1,0.5,0];
    requestAnimationFrame(()=>canvas.focus());

    AddMouseDrag(gl.canvas, 0, StartDrag, ContinueDrag)
    var objects = [];
    UpdateObjects();
    Render();
    var inspector = Div({width:'200px', float:'left'},[
        Select('axis', ['xy', 'xz', 'yz'], axis, v=>axis = v),
        Select('shape', ['box', 'cylinder', 'cone', 'sphere'], shape, v=>shape = v),
        Select('positioning', ['ontop', 'centered'], positioning, v=>positioning = v),
        ColorBox('color', color, v=>color=v),
        FloatBox('gridY', gridY, v=>gridY = v),
        FloatBox('sizeY', sizeY, v=>sizeY = v),
        Button('ApplyToLast', ()=>{
            if(objects.length>0){
                var last = objects[objects.length-1];
                last.shape = shape;
                last.color = color;
                last.positioning = positioning;
                last.sizeY = sizeY;
                UpdateObjects();
            }
        }),
        Button('DeleteLast', ()=>{
            if(objects.length>0){
                objects.pop();
                UpdateObjects();
            }
        }),
    ]);
    var canvasDiv = Div({marginLeft:'220px'},[canvas]);
    
    return Div({}, [inspector, canvasDiv])
}

document.body.appendChild(LevelEditor());
