class ObjMesh{
    constructor(){
        this.Clear();
    }

    Clear(){
        this.positions = [];
        this.normals = [];
        this.indices = [];
    }

    AddFace(positions, normals){
        var vertexID = this.positions.length / 3;
        this.positions.push(...positions.flat());

        if(!normals){
            var normal = normalVector(positions[0], positions[1], positions[2]);
            this.normals.push(...positions.map(_=>normal).flat());
        }
        else{
            this.normals.push(...normals.flat());
        }

        for(var i=2;i<positions.length;i++){
            this.indices.push(vertexID, vertexID+i-1, vertexID+i);
        }
    }

    AddPlane(matrix){
        var a = multiplyPoint(matrix, [-1,0,-1]);
        var b = multiplyPoint(matrix, [-1,0,1]);
        var c = multiplyPoint(matrix, [1,0,1]);
        var d = multiplyPoint(matrix, [1,0,-1]);
        this.AddFace([a,b,c,d]);
    }

    AddCube(matrix){
        var a = multiplyPoint(matrix, [-1,-1,-1]);
        var b = multiplyPoint(matrix, [-1,1,-1]);
        var c = multiplyPoint(matrix, [1,1,-1]);
        var d = multiplyPoint(matrix, [1,-1,-1]);
        var e = multiplyPoint(matrix, [-1,-1,1]);
        var f = multiplyPoint(matrix, [-1,1,1]);
        var g = multiplyPoint(matrix, [1,1,1]);
        var h = multiplyPoint(matrix, [1,-1,1]);
        this.AddFace([a,b,c,d]);
        this.AddFace([h,g,f,e]);
        this.AddFace([e,f,b,a]);
        this.AddFace([f,g,c,b]);
        this.AddFace([g,h,d,c]);
        this.AddFace([h,e,a,d]);
    }

    LoadObj(data){
        var lines = data.split('\n');
        var positions = [];
        var normals = [];

        for(var line of lines){
            var split = line.split(' ');
            if(split[0] == 'v'){
                var x = parseFloat(split[1]);
                var y = parseFloat(split[2]);
                var z = parseFloat(split[3]);
                positions.push([x,y,z]);
            }
            else if(split[0] == 'vn'){
                var x = parseFloat(split[1]);
                var y = parseFloat(split[2]);
                var z = parseFloat(split[3]);
                normals.push([x,y,z]);
            }
            else if(split[0] == 'f'){
                var vertexIDs = [];
                var normalIDs = [];
                for(var i=1;i<split.length;i++){
                    var split2 = split[i].split('/');
                    vertexIDs.push(parseFloat(split2[0])-1);
                    normalIDs.push(parseFloat(split2[2])-1);
                }
                this.AddFace(vertexIDs.map(v=>positions[v]), normalIDs.map(n=>normals[n]));
            }
        }
    }
}

function CreateShaderProgram(vertCode, fragCode){
    function CreateShader(source, type){
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        const message = gl.getShaderInfoLog(shader);
        if (message.length > 0) {
            throw message;
        }
        return shader;
    }
    const vertShader = CreateShader(vertCode, gl.VERTEX_SHADER);
    const fragShader = CreateShader(fragCode, gl.FRAGMENT_SHADER);

    var shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertShader);
    gl.attachShader(shaderProgram, fragShader);
    gl.linkProgram(shaderProgram);
    return shaderProgram;
}

class Canvas2DTexture{
    constructor(){
        var canvas = document.createElement('canvas');
        this.ctx = canvas.getContext('2d');
        this.id = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.id);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    }

    SetSize(w, h){
        this.ctx.canvas.width = w;
        this.ctx.canvas.height = h;
    }

    UpdateData(){
        gl.bindTexture(gl.TEXTURE_2D, this.id);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.ctx.canvas.width, this.ctx.canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, this.ctx.canvas);
    }
}

class ArrayBuffer{
    constructor(size, type = gl.FLOAT){
        this.size = size;
        this.type = type;
        this.id = gl.createBuffer();
    }

    SetData(data, dataType = gl.STATIC_DRAW){
        gl.bindBuffer(gl.ARRAY_BUFFER, this.id);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), dataType);
    }
}

class Renderer{
    constructor(program){
        this.program = program;
        this.buffers = {};
        this.uniforms = {};
        this.textures = {};
        this.indexBuffer = gl.createBuffer();
        this.indexLength = 0;
    }

    SetIndexData(data, dataType = gl.STATIC_DRAW){
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(data), dataType);
        this.indexLength = data.length;
    }

    Render(){
        gl.useProgram(this.program);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

        var bufferNames = Object.getOwnPropertyNames(this.buffers);
        for(var name of bufferNames){
            var buffer = this.buffers[name];
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer.id);
            var coord = gl.getAttribLocation(this.program, name);
            gl.vertexAttribPointer(coord, buffer.size, buffer.type, false, 0, 0); 
            gl.enableVertexAttribArray(coord);
        }

        var uniformNames = Object.getOwnPropertyNames(this.uniforms);
        for(var name of uniformNames){
            var uniform = this.uniforms[name];
            if(uniform.constructor.name == 'Array'){
                if(uniform.length == 16){
                    const location = gl.getUniformLocation(this.program, name);
                    gl.uniformMatrix4fv(location, false, uniform);
                }
                else if(uniform.length == 9){
                    const location = gl.getUniformLocation(this.program, name);
                    gl.uniformMatrix3fv(location, false, uniform);
                }
                else if(uniform.length == 3){
                    const location = gl.getUniformLocation(this.program, name);
                    gl.uniform3fv(location, uniform);
                }
            }
        }

        var textureNames = Object.getOwnPropertyNames(this.textures);
        var i = 0;
        for(var name of textureNames){
            gl.activeTexture(gl['TEXTURE'+i]);
            gl.bindTexture(gl.TEXTURE_2D, this.textures[name].id);
            const location = gl.getUniformLocation(this.program, name);
            gl.uniform1i(location, i);
            i++;
        }

        gl.drawElements(gl.TRIANGLES, this.indexLength, gl.UNSIGNED_SHORT,0);
    }
}

class Canvas2DMesh{
    constructor(){
        var vertCode = `
    attribute vec2 positions;
    attribute vec2 texCoords;

    uniform mat4 matrix;

    varying vec2 texCoord;

    void main(void) {
      gl_Position = matrix * vec4(positions, 0, 1);
      texCoord = texCoords;
    }`;
        var fragCode = `
    precision highp float;
    varying vec2 texCoord;

    uniform sampler2D canvas;

    void main(void) {
        gl_FragColor = texture2D(canvas, texCoord);
    }`;
        this.renderer = new Renderer(CreateShaderProgram(vertCode, fragCode));
        this.renderer.textures.canvas = new Canvas2DTexture();
        this.renderer.buffers.positions = new ArrayBuffer(2);
        this.renderer.buffers.texCoords = new ArrayBuffer(2);
        this.renderer.buffers.texCoords.SetData([0,0,1,0,1,1,0,1]);
        this.renderer.SetIndexData([0,2,1,0,3,2]);
    }

    SetFont(font){
        this.renderer.textures.canvas.ctx.font = font;
    }

    FillText(text, x, y, fillStyle){
        const ctx = this.renderer.textures.canvas.ctx;
        ctx.fillStyle = fillStyle;
        ctx.fillText(text,x,y);
        this.dirty = true;
    }

    FillRect(x, y, w, h, fillStyle){
        const ctx = this.renderer.textures.canvas.ctx;
        ctx.fillStyle = fillStyle;
        ctx.fillRect(x,y,w,h);
        this.dirty = true;
    }

    FillCircle(x, y, radius, fillStyle){
        const ctx = this.renderer.textures.canvas.ctx;
        ctx.fillStyle = fillStyle;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fill(); 
        this.dirty = true;
    }

    SetSize(x, y, w, h){
        if(x!=this.x || y!=this.y || w!=this.w || h!=this.h){
            this.renderer.textures.canvas.SetSize(w,h);
            this.renderer.buffers.positions.SetData([x,y,x+w,y,x+w,y+h,x,y+h]);
            this.x = x;
            this.y = y;
            this.w = w;
            this.h = h;
            this.dirty = true;
            return true;
        }
        return false;
    }

    Render(){
        if(this.dirty){
            this.renderer.textures.canvas.UpdateData();
            this.dirty = false;
        }
        this.renderer.uniforms.matrix = createOrthographicMatrix(0,gl.canvas.width, gl.canvas.height, 0, -1, 1);
        this.renderer.Render();
    }
}

class LitRenderer{
    constructor(){
        var vertCode =
        `attribute vec3 positions;
        attribute vec3 normals;

        uniform mat4 view;
        uniform mat4 projection;
        uniform mat4 model;
        uniform mat3 normalMatrix;

        varying vec3 normal;
        varying vec3 fragPos;

        void main(void) {
            fragPos = vec3(model * vec4(positions, 1.0));
            normal = normalMatrix * normals;  
            
            gl_Position = projection * view * vec4(fragPos, 1.0);
        }`;
                
        var fragCode =
        `
        precision highp float;

        uniform vec3 viewPos;

        varying vec3 normal;
        varying vec3 fragPos;

        void main(void) {
            vec3 lightColor = vec3(1,1,1);
            vec3 objectColor = vec3(0,0,1);
            vec3 lightPos = vec3(5,5,5);

            float ambientStrength = 0.1;
            vec3 ambient = ambientStrength * lightColor;
            
            vec3 norm = normalize(normal);
            vec3 lightDir = normalize(lightPos - fragPos);
            float diff = max(dot(norm, lightDir), 0.0);
            vec3 diffuse = diff * lightColor;
            
            float specularStrength = 0.5;
            vec3 viewDir = normalize(viewPos - fragPos);
            vec3 reflectDir = reflect(-lightDir, norm);  
            float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
            vec3 specular = specularStrength * spec * lightColor;  
                
            vec3 result = (ambient + diffuse + specular) * objectColor;
            gl_FragColor = vec4(result, 1.0);
        }`;
        this.renderer = new Renderer(CreateShaderProgram(vertCode, fragCode));
        this.renderer.buffers.positions = new ArrayBuffer(3);
        this.renderer.buffers.normals = new ArrayBuffer(3);
    }

    SetData(positions, normals, indices){
        this.renderer.buffers.positions.SetData(positions);
        this.renderer.buffers.normals.SetData(normals);
        this.renderer.SetIndexData(indices);
    }

    SetObjMeshData(objMesh){
        this.SetData(objMesh.positions, objMesh.normals, objMesh.indices);
    }

    Render(model, camera){
        const u = this.renderer.uniforms;
        u.model = model;
        u.view = camera.GetView();
        u.projection = camera.GetProjection();
        u.viewPos = camera.GetPosition();
        u.normalMatrix = normalMatrix(model);
        this.renderer.Render();
    }    
}

class Camera{
    constructor(roty = 0){
        this.roty = roty;
        this.origin = [0,0,0];
    }

    GetPosition(){
        return [this.origin[0] + Math.cos(this.roty)*5,this.origin[1] + 1.5,this.origin[2] + Math.sin(this.roty)*5];
    }

    GetProjection(){
        return createPerspectiveMatrix(45 * (Math.PI/180), gl.canvas.width/gl.canvas.height, 0.1, 100);
    }

    GetView(){
        return createLookAtMatrix(this.GetPosition(), this.origin, [0,1,0]);
    }
}

class FPSCamera{
    constructor(x,y){
        this.x = x;
        this.y = y;
        this.roty = 0;
    }

    GetPosition(){
        return [this.x, 1, this.y];
    }

    MoveX(speed){
        this.x += Math.cos(this.roty) * speed;
    }

    MoveY(speed){
        this.y += Math.sin(this.roty) * speed;
    }

    GetLookAt(){
        return [this.x + Math.cos(this.roty), 1, this.y + Math.sin(this.roty)];
    }

    GetProjection(){
        return createPerspectiveMatrix(45 * (Math.PI/180), gl.canvas.width/gl.canvas.height, 0.1, 100);
    }

    GetView(){
        return createLookAtMatrix(this.GetPosition(), this.GetLookAt(), [0,1,0]);
    }
}