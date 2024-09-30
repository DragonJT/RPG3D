

function Hex2RGB(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [ r/255, g/255, b/255 ];
}

function Component2Hex(c) {
    var hex = Math.round(c).toString(16);
    return hex.length == 1 ? "0" + hex : hex;
  }
  
function RGB2Hex(color) {
    return "#" + Component2Hex(color[0] * 255) + Component2Hex(color[1] * 255) + Component2Hex(color[2] * 255);
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
    var mouse = {position:[0,0], lastPosition:[0,0], deltaPosition:[0,0]};
    htmlElement.addEventListener('mousemove', e=>{
        mouse.lastPosition = mouse.position;
        var rect = htmlElement.getBoundingClientRect();
        mouse.position = [e.clientX - rect.left, e.clientY - rect.top];
        mouse.deltaPosition = [mouse.position[0] - mouse.lastPosition[0], mouse.position[1] - mouse.lastPosition[1]];
    });
    return mouse;
}

function AddKeys(htmlElement, validKeys){
    var keys = {};
    var entered = false;

    function KeyDown(e){
        if(validKeys.includes(e.key)){
            keys[e.key] = true;
            e.preventDefault();
            if(entered && htmlElement!=document.activeElement){
                htmlElement.focus();
            }
        }
    }
    
    function KeyUp(e){
        if(validKeys.includes(e.key)){
            keys[e.key] = false;
            e.preventDefault();
        }
    }

    function MouseEnter(e){
        entered = true;
    }

    function MouseLeave(e){
        entered = false;
    }

    htmlElement.addEventListener('mouseenter', MouseEnter);
    htmlElement.addEventListener('mouseleave', MouseLeave);
    addEventListener('keydown', KeyDown);
    addEventListener('keyup', KeyUp);
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
    var keys = AddKeys(canvas, ['=', '-', 'Alt', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']);
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
        if(keys.Alt){
            const sensitivity = 0.004;
            roty += mouse.deltaPosition[0] * sensitivity;
            rotx += mouse.deltaPosition[1] * sensitivity;
            if(rotx > 0.99){
                rotx = 0.99;
            }
            else if(rotx < 0.1){
                rotx = 0.1;
            }
        }
    }

    function Update(){
        const sensitivity = 0.01;
        var forward = Normalize(Sub(origin, GetPosition()));
        forward[1] = 0;
        var planeFoward = Normalize(forward);
        var right = Normalize(Cross(planeFoward, [0,1,0]));

        const zoomSensitivity = 0.98;
        if(keys['=']){
            distance *= zoomSensitivity;
            if(distance < 1){
                distance = 1;
            }
        }
        if(keys['-']){
            distance /= zoomSensitivity;
        }
        const moveSensitivity = sensitivity * distance;
        if(keys.ArrowUp){
            origin[0] += planeFoward[0] * moveSensitivity;
            origin[2] += planeFoward[2] * moveSensitivity;
        }
        if(keys.ArrowDown){
            origin[0] -= planeFoward[0] * moveSensitivity;
            origin[2] -= planeFoward[2] * moveSensitivity;
        }
        if(keys.ArrowLeft){
            origin[0] -= right[0] * moveSensitivity;
            origin[2] -= right[2] * moveSensitivity;
        }
        if(keys.ArrowRight){
            origin[0] += right[0] * moveSensitivity;
            origin[2] += right[2] * moveSensitivity;
        }
        requestAnimationFrame(Update);
        
    }

    return {GetPosition, GetView, GetProjection, ScreenToWorldMatrix };
}