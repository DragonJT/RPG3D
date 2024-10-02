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

    AddMesh(mesh, position){
        var vertexID = this.positions.length/3;
        var positions = [];
        for(var i=0;i<mesh.positions.length;i+=3){
            positions.push(mesh.positions[i] + position[0]);
            positions.push(mesh.positions[i+1] + position[1]);
            positions.push(mesh.positions[i+2] + position[2]);
        }
        this.positions.push(...positions);
        this.colors.push(...mesh.colors);
        this.normals.push(...mesh.normals);
        this.indices.push(...mesh.indices.map(i=>i+vertexID));
    }

    AddFace(positions, normals){
        var vertexID = this.positions.length / 3;
        this.positions.push(...positions.flat());

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

    AddPlane(matrix){
        var a = MultiplyPoint(matrix, [-1,0,-1]);
        var b = MultiplyPoint(matrix, [-1,0,1]);
        var c = MultiplyPoint(matrix, [1,0,1]);
        var d = MultiplyPoint(matrix, [1,0,-1]);
        this.AddFace([a,b,c,d]);
    }

    AddSphere(matrix, pointCount){
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
                this.AddFace([d,c,b,a]);
                radians += deltaRadians;
            }
            radiansY += deltaRadians;
        }
    }

    AddCylinder(matrix, pointCount){
        var radians = 0;
        var deltaRadians = 2*Math.PI/pointCount;
        var topFace = [];
        var bottomFace = [];
        for(var i=0;i<pointCount;i++){
            var a = MultiplyPoint(matrix, [Math.cos(radians), -1, Math.sin(radians)]);
            var b = MultiplyPoint(matrix, [Math.cos(radians + deltaRadians), -1, Math.sin(radians + deltaRadians)]);
            var c = MultiplyPoint(matrix, [Math.cos(radians + deltaRadians), 1, Math.sin(radians + deltaRadians)]);
            var d = MultiplyPoint(matrix, [Math.cos(radians), 1, Math.sin(radians)]);
            this.AddFace([d,c,b,a]);
            radians += deltaRadians;
            topFace.push(a);
            bottomFace.push(d);
        }
        this.AddFace(topFace);
        this.AddFace(bottomFace.reverse());
    }

    AddCone(matrix, pointCount){
        var radians = 0;
        var deltaRadians = 2*Math.PI/pointCount;
        var bottomFace = [];
        var top = MultiplyPoint(matrix, [0, 1, 0]);
        for(var i=0;i<pointCount;i++){
            var a = top;
            var b = MultiplyPoint(matrix, [Math.cos(radians + deltaRadians), -1, Math.sin(radians + deltaRadians)]);
            var c = MultiplyPoint(matrix, [Math.cos(radians), -1, Math.sin(radians)]);
            this.AddFace([a,b,c]);
            radians += deltaRadians;
            bottomFace.push(c);
        }
        this.AddFace(bottomFace);
    }

    AddBox(matrix){
        var a = MultiplyPoint(matrix, [-1,-1,-1]);
        var b = MultiplyPoint(matrix, [-1,1,-1]);
        var c = MultiplyPoint(matrix, [1,1,-1]);
        var d = MultiplyPoint(matrix, [1,-1,-1]);
        var e = MultiplyPoint(matrix, [-1,-1,1]);
        var f = MultiplyPoint(matrix, [-1,1,1]);
        var g = MultiplyPoint(matrix, [1,1,1]);
        var h = MultiplyPoint(matrix, [1,-1,1]);
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

function Renderer(gl, program){
    var buffers = {};
    var uniforms = {};
    var indexBuffer = gl.createBuffer();
    var indexLength = 0;

    function SetIndexData(data, dataType = gl.STATIC_DRAW){
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(data), dataType);
        indexLength = data.length;
    }

    function Render(mode){
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
            if(uniform == null){
                console.log(name);
            }
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
        gl.drawElements(mode, indexLength, gl.UNSIGNED_SHORT,0);
    }

    return {SetIndexData, buffers, uniforms, Render};
}

function ShapeRenderer(gl, camera){
    function LitProgram(){
        var vertCode =
        `
        attribute vec3 positions;
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
        uniform vec3 color;

        varying vec3 normal;
        varying vec3 fragPos;

        void main(void) {
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
                
            vec3 result = (ambient + diffuse + specular) * color;
            gl_FragColor = vec4(result, 1.0);
        }`;

        return CreateShaderProgram(gl, vertCode, fragCode);
    }

    function SelectedProgram(){
        var vertCode =
        `
        attribute vec3 positions;
        attribute vec3 normals;
        attribute vec3 colors;
    
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
        uniform vec3 color;

        varying vec3 normal;
        varying vec3 fragPos;
    
        void main(void) {
            float f = fract((fragPos.x + fragPos.y + fragPos.z) * 0.5);
    
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
                
            vec3 result = (ambient + diffuse + specular) * color;
            if(f>0.8){
                result = 1.0-result;
            }
            gl_FragColor = vec4(result, 1.0);
        }`;
        return CreateShaderProgram(gl, vertCode, fragCode);
    }
    const litProgram = LitProgram();
    const selectedProgram = SelectedProgram();

    function InitRenderer(gl, program, objMesh){
        var renderer = Renderer(gl, program);
        renderer.buffers.positions = ArrayBuffer(gl, 3, gl.FLOAT);
        renderer.buffers.normals = ArrayBuffer(gl, 3, gl.FLOAT);
        renderer.buffers.positions.SetData(objMesh.positions);
        renderer.buffers.normals.SetData(objMesh.normals);
        renderer.SetIndexData(objMesh.indices);

        function Render(model, color){
            var normalMatrix = NormalMatrix(model);
            if(normalMatrix == null){
                return;
            }
            const u = renderer.uniforms;
            u.model = model;
            u.view = camera.GetView();
            u.projection = camera.GetProjection();
            u.viewPos = camera.GetPosition();
            u.normalMatrix = normalMatrix;
            u.color = color;
            renderer.Render(gl.TRIANGLES);
        }    
        return Render;
    }

    const boxMesh = new ObjMesh();
    boxMesh.AddBox(Identity());
    const cylinderMesh = new ObjMesh();
    cylinderMesh.AddCylinder(Identity(), 32);
    const sphereMesh = new ObjMesh();
    sphereMesh.AddSphere(Identity(), 32);
    const coneMesh = new ObjMesh();
    coneMesh.AddCone(Identity(), 32);

    const lit = {};
    const selected = {};

    function AddShapeToRenderer(mesh, name){
        lit[name] = InitRenderer(gl, litProgram, mesh);
        selected[name] = InitRenderer(gl, selectedProgram, mesh);
    }
    
    AddShapeToRenderer(boxMesh, 'box');
    AddShapeToRenderer(cylinderMesh, 'cylinder');
    AddShapeToRenderer(sphereMesh, 'sphere');
    AddShapeToRenderer(coneMesh, 'cone');
    return {lit, selected};
}

function GridRenderer(gl, camera, radiusCount){
    var vertCode =
    `
    attribute vec3 positions;
    attribute vec3 colors;

    uniform mat4 view;
    uniform mat4 projection;
    uniform mat4 model;
    uniform vec3 viewPos;

    varying vec3 color;

    void main(void) {
        color = colors;
        vec3 dir = normalize(viewPos - positions) * 0.01;
        gl_Position = projection * view * model * vec4(positions + dir, 1.0);
    }`;
            
    var fragCode =
    `
    precision highp float;
    varying vec3 color;

    void main(void) {
        gl_FragColor = vec4(color, 1);
    }`;

    var positions = [];
    var colors = [];
    var indices = [];
    var vertexID = 0;

    for(var x=-radiusCount;x<radiusCount;x++){
        positions.push(x,0,-radiusCount);
        positions.push(x,0,radiusCount);
        if(x==0){
            colors.push(1,1,1,1,1,1);
        }
        else{
            colors.push(0,1,0,0,1,0);
        }
        indices.push(vertexID, vertexID+1);
        vertexID+=2;
    }
    for(var y=-radiusCount;y<radiusCount;y++){
        positions.push(-radiusCount,0,y);
        positions.push(radiusCount,0,y);
        if(y==0){
            colors.push(1,1,1,1,1,1);
        }
        else{
            colors.push(0,1,0,0,1,0);
        }
        indices.push(vertexID, vertexID+1);
        vertexID+=2;
    }
    
    var renderer = Renderer(gl, CreateShaderProgram(gl, vertCode, fragCode));
    renderer.buffers.positions = ArrayBuffer(gl, 3, gl.FLOAT);
    renderer.buffers.colors = ArrayBuffer(gl, 3, gl.FLOAT);
    renderer.buffers.positions.SetData(positions);
    renderer.buffers.colors.SetData(colors);
    renderer.SetIndexData(indices);

    function Render(model){
        const u = renderer.uniforms;
        u.model = model;
        u.view = camera.GetView();
        u.projection = camera.GetProjection();
        u.viewPos = camera.GetPosition();
        renderer.Render(gl.LINES);
    }  

    return {Render};
}