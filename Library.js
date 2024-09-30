
function CreateCanvas(width, height){
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
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

function AddMouseMove(htmlElement){
    var mouse = {position:[0,0], lastPosition:[0,0], relativePosition:[0,0]};
    htmlElement.addEventListener('mousemove', e=>{
        mouse.lastPosition = mouse.position;
        var rect = htmlElement.getBoundingClientRect();
        mouse.position = [e.clientX - rect.left, e.clientY - rect.top];
        mouse.relativePosition = [mouse.position[0] - mouse.lastPosition[0], mouse.position[1] - mouse.lastPosition[1]];
    });
    return mouse;
}

function AddKeys(htmlElement){
    var keys = {};

    function KeyDown(e){
        keys[e.key] = true;
    }
    
    function KeyUp(e){
        keys[e.key] = false;
    }
    htmlElement.addEventListener('keydown', KeyDown);
    htmlElement.addEventListener('keyup', KeyUp);
    return keys;
}

function AddMouseDrag(htmlElement, button, startDrag, continueDrag){
    var dragging = false;

    function MouseDown(e){
        if(e.button == button && !dragging){
            dragging = true;
            startDrag();
        }
    }

    function MouseUp(e){
        if(e.button == button){
            dragging = false;
        }
    }

    function MouseMove(){
        if(dragging){
            continueDrag();
        }
    }

    htmlElement.addEventListener('mousedown', MouseDown);
    htmlElement.addEventListener('mouseup', MouseUp);
    htmlElement.addEventListener('mousemove', MouseMove);
}

function OrbitCamera(canvas, origin, distance, rotx, roty){
    var mouse = AddMouseMove(canvas, MouseMove);
    var keys = AddKeys(canvas);
    canvas.addEventListener('mousemove', MouseMove);
    Update();

    function GetPosition(){
        var dx = Math.cos(rotx);
        var dy = Math.sin(rotx);
        var position = [
            origin[0] + Math.cos(roty) * distance * dx,
            origin[1] + distance * dy,
            origin[2] + Math.sin(roty) * distance * dx];
        return position;
    }

    function GetProjection(){
        return PerspectiveMatrix(45 * (Math.PI/180), canvas.width/canvas.height, 0.1, 100);
    }

    function GetView(){
        return LookAtMatrix(GetPosition(), origin, [0,1,0]);
    }

    function MouseMove(){
        if(keys[' ']){
            const sensitivity = 0.004;
            roty += mouse.relativePosition[0] * sensitivity;
            rotx += mouse.relativePosition[1] * sensitivity;
            if(rotx > 0.99){
                rotx = 0.99;
            }
            else if(rotx < 0.1){
                rotx = 0.1;
            }
        }
    }

    function Update(){
        const sensitivity = 0.4;
        var forward = Normalize(Sub(origin, GetPosition()));
        forward[1] = 0;
        var planeFoward = Normalize(forward);
        var right = Normalize(Cross(planeFoward, [0,1,0]));

        if(keys.ArrowUp){
            origin[0] += planeFoward[0] * sensitivity;
            origin[2] += planeFoward[2] * sensitivity;
        }
        if(keys.ArrowDown){
            origin[0] -= planeFoward[0] * sensitivity;
            origin[2] -= planeFoward[2] * sensitivity;
        }
        if(keys.ArrowLeft){
            origin[0] -= right[0] * sensitivity;
            origin[2] -= right[2] * sensitivity;
        }
        if(keys.ArrowRight){
            origin[0] += right[0] * sensitivity;
            origin[2] += right[2] * sensitivity;
        }
        requestAnimationFrame(Update);
    }

    return {GetPosition, GetView, GetProjection, ScreenToWorldMatrix };
}