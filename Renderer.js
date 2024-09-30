class ObjMesh{
    constructor(){
        this.Clear();
    }

    Clear(){
        this.positions = [];
        this.colors = [];
        this.normals = [];
        this.indices = [];
    }

    AddFace(positions, color, normals){
        var vertexID = this.positions.length / 3;
        this.positions.push(...positions.flat());
        this.colors.push(...positions.map(_=>color).flat());

        if(!normals){
            var normal = Normal(positions[0], positions[1], positions[2]);
            this.normals.push(...positions.map(_=>normal).flat());
        }
        else{
            this.normals.push(...normals.flat());
        }

        for(var i=2;i<positions.length;i++){
            this.indices.push(vertexID, vertexID+i-1, vertexID+i);
        }
    }

    AddPlane(matrix, color){
        var a = MultiplyPoint(matrix, [-1,0,-1]);
        var b = MultiplyPoint(matrix, [-1,0,1]);
        var c = MultiplyPoint(matrix, [1,0,1]);
        var d = MultiplyPoint(matrix, [1,0,-1]);
        this.AddFace([a,b,c,d], color);
    }

    AddSphere(matrix, pointCount, color){
        var deltaRadians = 2*Math.PI/pointCount;
        var radiansY = 0;
        for(var ii=0;ii<pointCount;ii++){
            var radians = 0;
            var radius0 = Math.cos(radiansY);
            var radius1 = Math.cos(radiansY + deltaRadians);
            var h0 = Math.sin(radiansY);
            var h1 = Math.sin(radiansY + deltaRadians);
            for(var i=0;i<pointCount;i++){
                var a = MultiplyPoint(matrix, [Math.cos(radians) * radius0, h0, Math.sin(radians) * radius0]);
                var b = MultiplyPoint(matrix, [Math.cos(radians + deltaRadians) * radius0, h0, Math.sin(radians + deltaRadians) * radius0]);
                var c = MultiplyPoint(matrix, [Math.cos(radians + deltaRadians) * radius1, h1, Math.sin(radians + deltaRadians) * radius1]);
                var d = MultiplyPoint(matrix, [Math.cos(radians) * radius1, h1, Math.sin(radians) * radius1]);
                this.AddFace([d,c,b,a], color);
                radians += deltaRadians;
            }
            radiansY += deltaRadians;
        }
    }

    AddCylinder(matrix, pointCount, color){
        var radians = 0;
        var deltaRadians = 2*Math.PI/pointCount;
        var topFace = [];
        var bottomFace = [];
        for(var i=0;i<pointCount;i++){
            var a = MultiplyPoint(matrix, [Math.cos(radians), -1, Math.sin(radians)]);
            var b = MultiplyPoint(matrix, [Math.cos(radians + deltaRadians), -1, Math.sin(radians + deltaRadians)]);
            var c = MultiplyPoint(matrix, [Math.cos(radians + deltaRadians), 1, Math.sin(radians + deltaRadians)]);
            var d = MultiplyPoint(matrix, [Math.cos(radians), 1, Math.sin(radians)]);
            this.AddFace([d,c,b,a], color);
            radians += deltaRadians;
            topFace.push(a);
            bottomFace.push(d);
        }
        this.AddFace(topFace, color);
        this.AddFace(bottomFace.reverse(), color);
    }

    AddBox(matrix, color){
        var a = MultiplyPoint(matrix, [-1,-1,-1]);
        var b = MultiplyPoint(matrix, [-1,1,-1]);
        var c = MultiplyPoint(matrix, [1,1,-1]);
        var d = MultiplyPoint(matrix, [1,-1,-1]);
        var e = MultiplyPoint(matrix, [-1,-1,1]);
        var f = MultiplyPoint(matrix, [-1,1,1]);
        var g = MultiplyPoint(matrix, [1,1,1]);
        var h = MultiplyPoint(matrix, [1,-1,1]);
        this.AddFace([a,b,c,d], color);
        this.AddFace([h,g,f,e], color);
        this.AddFace([e,f,b,a], color);
        this.AddFace([f,g,c,b], color);
        this.AddFace([g,h,d,c], color);
        this.AddFace([h,e,a,d], color);
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
                this.AddFace(vertexIDs.map(v=>positions[v]), [0,0,1], normalIDs.map(n=>normals[n]));
            }
        }
    }
}

function CreateShaderProgram(gl, vertCode, fragCode){
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

function ArrayBuffer(gl, size, type){
    id = gl.createBuffer();

    function SetData(data, dataType = gl.STATIC_DRAW){
        gl.bindBuffer(gl.ARRAY_BUFFER, this.id);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), dataType);
    }

    return {id, size, type, SetData}
}

function Renderer(gl, vertCode, fragCode){
    var program = CreateShaderProgram(gl, vertCode, fragCode)
    var buffers = {};
    var uniforms = {};
    var indexBuffer = gl.createBuffer();
    var indexLength = 0;

    function SetIndexData(data, dataType = gl.STATIC_DRAW){
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(data), dataType);
        indexLength = data.length;
    }

    function Render(){
        gl.useProgram(program);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

        var bufferNames = Object.getOwnPropertyNames(buffers);
        for(var name of bufferNames){
            var buffer = buffers[name];
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer.id);
            var coord = gl.getAttribLocation(program, name);
            gl.vertexAttribPointer(coord, buffer.size, buffer.type, false, 0, 0); 
            gl.enableVertexAttribArray(coord);
        }

        var uniformNames = Object.getOwnPropertyNames(uniforms);
        for(var name of uniformNames){
            var uniform = uniforms[name];
            if(uniform.constructor.name == 'Array'){
                if(uniform.length == 16){
                    const location = gl.getUniformLocation(program, name);
                    gl.uniformMatrix4fv(location, false, uniform);
                }
                else if(uniform.length == 9){
                    const location = gl.getUniformLocation(program, name);
                    gl.uniformMatrix3fv(location, false, uniform);
                }
                else if(uniform.length == 3){
                    const location = gl.getUniformLocation(program, name);
                    gl.uniform3fv(location, uniform);
                }
            }
        }
        gl.drawElements(gl.TRIANGLES, indexLength, gl.UNSIGNED_SHORT,0);
    }

    return {SetIndexData, buffers, uniforms, Render};
}

function LitRenderer(gl, camera){
    var model = Identity();
    var vertCode =
    `
    attribute vec3 positions;
    attribute vec3 normals;
    attribute vec3 colors;

    uniform mat4 view;
    uniform mat4 projection;
    uniform mat4 model;
    uniform mat3 normalMatrix;

    varying vec3 color;
    varying vec3 normal;
    varying vec3 fragPos;

    void main(void) {
        fragPos = vec3(model * vec4(positions, 1.0));
        normal = normalMatrix * normals;  
        color = colors;

        gl_Position = projection * view * vec4(fragPos, 1.0);
    }`;
            
    var fragCode =
    `
    precision highp float;

    uniform vec3 viewPos;

    varying vec3 color;
    varying vec3 normal;
    varying vec3 fragPos;

    void main(void) {
        vec3 objColor = color;
        float fx = fract(fragPos.x);
        float fz = fract(fragPos.z);
        float fdot = dot(normal, vec3(0,1,0));
        if((fdot < -0.95 || fdot > 0.95) && (fx < 0.05 || fz < 0.05)){
            objColor = vec3(1,1,1);
        }

        vec3 lightColor = vec3(1,1,1);
        vec3 lightDir = normalize(vec3(1,1,1));

        float ambientStrength = 0.1;
        vec3 ambient = ambientStrength * lightColor;
        
        vec3 norm = normalize(normal);
        float diff = max(dot(norm, lightDir), 0.0);
        vec3 diffuse = diff * lightColor;
        
        float specularStrength = 0.5;
        vec3 viewDir = normalize(viewPos - fragPos);
        vec3 reflectDir = reflect(-lightDir, norm);  
        float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
        vec3 specular = specularStrength * spec * lightColor;  
            
        vec3 result = (ambient + diffuse + specular) * objColor;
        gl_FragColor = vec4(result, 1.0);
    }`;
    var renderer = Renderer(gl, vertCode, fragCode);
    renderer.buffers.positions = ArrayBuffer(gl, 3, gl.FLOAT);
    renderer.buffers.normals = ArrayBuffer(gl, 3, gl.FLOAT);
    renderer.buffers.colors = ArrayBuffer(gl, 3, gl.FLOAT);

    function SetData(positions, normals, colors, indices){
        renderer.buffers.positions.SetData(positions);
        renderer.buffers.normals.SetData(normals);
        renderer.buffers.colors.SetData(colors);
        renderer.SetIndexData(indices);
    }

    function SetObjMeshData(objMesh){
        SetData(objMesh.positions, objMesh.normals, objMesh.colors, objMesh.indices);
    }

    function Render(){
        const u = renderer.uniforms;
        u.model = model;
        u.view = camera.GetView();
        u.projection = camera.GetProjection();
        u.viewPos = camera.GetPosition();
        u.normalMatrix = NormalMatrix(model);
        renderer.Render();
    }    

    return {SetObjMeshData, Render};
}

