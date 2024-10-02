
function LevelEditor(){

    function SetShapeOptions(select){
        select.innerHTML = '';
        for(var o of defaultShapeOptions){
            CreateOption(select, o);
        }
        for(var key of Object.keys(prefabs)){
            CreateOption(select, key);
        }
    }

    function IsSelected(obj){
        return obj == objects[selectedID];
    }

    function RenderObjects(model, objects, depth, allSelected){
        for(var o of objects){
            var matrix;
            if(o.positioning == 'ontop'){
                var pointOffset = MulScalar(o.normal, o.sizeY);
                matrix = MultiplyMatrices(model, GetMatrixFromTo(o.min, Add(o.max, pointOffset)));
            }
            else if(o.positioning == 'centered'){
                var pointOffset = MulScalar(o.normal, o.sizeY*0.5);
                matrix = MultiplyMatrices(model, GetMatrixFromTo(Sub(o.min, pointOffset), Add(o.max, pointOffset)));
            }
            
            var renderer = shapeRenderer.lit;
            const selected = (depth == 0 && IsSelected(o)) || allSelected;
            if(selected){
                renderer = shapeRenderer.selected;
            }
            if(o.shape == 'box'){
                renderer.box(matrix, o.color);
            }
            else if(o.shape == 'cylinder'){
                renderer.cylinder(matrix, o.color);
            }
            else if(o.shape == 'cone'){
                renderer.cone(matrix, o.color);
            }
            else if(o.shape == 'sphere'){
                renderer.sphere(matrix, o.color);
            }
            else{
                RenderObjects(TranslateMatrix(o.min[0], o.min[1], o.min[2]), prefabs[o.shape], depth+1, selected);
            }
        }
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
        MouseRay(mouse.position, (p, normal)=>{
            objects.push({shape, min:p, max:p, normal, sizeY, positioning, color});
            selectedID = objects.length-1;
        });
    }

    function ContinueDrag(){
        MouseRay(mouse.position, (p, _)=>{
            var lastObject = objects[objects.length-1];
            lastObject.max = p;
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

        RenderObjects(Identity(), objects, 0, false);
        gridRenderer.Render(GridPlaneMatrix());

        requestAnimationFrame(Render);
    }

    function OpenPrefab(prefabName){
        objects = prefabs[prefabName];
        name = prefabName;
        RefreshValues();
    }

    const canvas = CreateCanvas(1000, 600);
    canvas.tabIndex = 0;
    const gl = canvas.getContext('webgl2');

    const camera = OrbitCamera(gl.canvas, [0,0,0], 40, 0, 0);
    const gridRenderer = GridRenderer(gl, camera, 100);
    const shapeRenderer = ShapeRenderer(gl, camera);

    var name = 'scene';
    const defaultShapeOptions = ['box', 'cylinder', 'cone', 'sphere'];
    prefabs = {};
    var selectedID = 0;
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
    Render();
    var inspector = Div({width:'200px', float:'left'},[
        TextBox('name', ()=>name, v=>name = v),
        Select('axis', ['xy', 'xz', 'yz'], ()=>axis, v=>axis = v),
        Select('shape', defaultShapeOptions, ()=>shape, v=>shape = v),
        Select('positioning', ['ontop', 'centered'], ()=>positioning, v=>positioning = v),
        ColorBox('color', ()=>color, v=>color=v),
        NumberBox('gridY', ()=>gridY, v=>gridY = v),
        NumberBox('sizeY', ()=>sizeY, v=>sizeY = v),
        Button('SelectPrev', ()=>{
            if(selectedID > 0){
                selectedID--;
            }
        }),
        Button('SelectNext', ()=>{
            if(selectedID < objects.length){
                selectedID++;
            }
        }),
        Button('Pick', ()=>{
            var obj = objects[selectedID];
            shape = obj.shape;
            color = obj.color;
            positioning = obj.positioning;
            sizeY = obj.sizeY;
            RefreshValues();
        }),
        Button('Apply', ()=>{
            if(objects.length>0){
                var obj = objects[selectedID];
                obj.shape = shape;
                obj.color = color;
                obj.positioning = positioning;
                obj.sizeY = sizeY;
            }
        }),
        Button('Delete', ()=>{
            if(objects.length>0){
                objects.splice(selectedID, 1);
                if(selectedID > 0){
                    selectedID--;
                }
            }
        }),
        Button('DeleteAll', ()=>{
            objects = [];
        }),
        Button('SavePrefab', ()=>{
            SetShapeOptions(document.getElementById('shape'));
            prefabs[name] = objects;
        }),
        Button('OpenPrefab', ()=>{
            OpenPrefab(shape);
        }),
        Button('Save/Download', ()=>{
            Download('level.json', JSON.stringify(prefabs));
        }),
        Button('load/Upload', ()=>{
            FileUploader(f=>{
                prefabs = JSON.parse(f);
                SetShapeOptions(document.getElementById('shape'));
                OpenPrefab(Object.keys(prefabs)[0]);
            });
        }),
    ]);
    var canvasDiv = Div({marginLeft:'220px'},[canvas]);
    
    return Div({}, [inspector, canvasDiv])
}

document.body.appendChild(LevelEditor());
