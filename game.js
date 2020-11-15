// Game Aspect Ratio
var gameLength = 12;
var gameWidth = 6;

// Game Matrices
var buf_frame = [];
var buf_field = []; //gameLength X gameWidth
var buf_block = []; //gameLength X gameWidth
//var block = []; //2x2
var blockDim = 2;

// Real Object buffers
var objArr=[];
var vertBuffer=[];
var triBuffer = [];

// Bkgd Placeholder Object Buffers.
var bkgdObjArr = [];
var bkgdVertBuffer=[];
var bkgdTriBuffer = [];
var triBufSize =12; // CUbe with 6 faces and 12 traingles.

// Uniform Locations.
var vPosAttribLoc; // where to put position for vertex shader
var mMatrixULoc; // where to put model matrix for vertex shader
var pvmMatrixULoc;        

var selectBkgdULoc;

var defaultEye = vec3.fromValues(0.5,0.5,1.5); // default eye position in world space
var defaultCenter = vec3.fromValues(0.5,0.5,0.5); // default view direction in world space
var defaultUp = vec3.fromValues(0,1,0); // default view up vector
var lightAmbient = vec3.fromValues(1,1,1); // default light ambient emission
var lightDiffuse = vec3.fromValues(1,1,1); // default light diffuse emission
var lightSpecular = vec3.fromValues(1,1,1); // default light specular emission
var lightPosition = vec3.fromValues(-0.5,1.5,-0.5); // default light position
var rotateTheta = Math.PI/50; // how much to rotate models by with each key press

var Eye = vec3.clone(defaultEye); // eye position in world space
var Center = vec3.clone(defaultCenter); // view direction in world space
var Up = vec3.clone(defaultUp); // view up vector in world space

function handleKeyDown(event) {
    // set up needed view params
    var lookAt = vec3.create(), viewRight = vec3.create(), temp = vec3.create(); // lookat, right & temp vectors
    lookAt = vec3.normalize(lookAt,vec3.subtract(temp,Center,Eye)); // get lookat vector
    viewRight = vec3.normalize(viewRight,vec3.cross(temp,lookAt,Up)); // get view right vector
    

    switch (event.code) {
            
        // view change
        case "KeyA": // translate view left, rotate left with shift
            Center = vec3.add(Center,Center,vec3.scale(temp,viewRight,0.05));
            Eye = vec3.add(Eye,Eye,vec3.scale(temp,viewRight,0.05));
            break;
        case "KeyD": // translate view right, rotate right with shift
            Center = vec3.add(Center,Center,vec3.scale(temp,viewRight,-0.05));
            Eye = vec3.add(Eye,Eye,vec3.scale(temp,viewRight,-0.05));
            break;
        case "KeyS": // translate view backward, rotate up with shift
                Eye = vec3.add(Eye,Eye,vec3.scale(temp,lookAt,-0.05));
                Center = vec3.add(Center,Center,vec3.scale(temp,lookAt,-0.05));
            break;
        case "KeyW": // translate view forward, rotate down with shift
                Eye = vec3.add(Eye,Eye,vec3.scale(temp,lookAt,0.05));
                Center = vec3.add(Center,Center,vec3.scale(temp,lookAt,0.05));
            break;
        case "KeyQ": // translate view up, rotate counterclockwise with shift
                Eye = vec3.add(Eye,Eye,vec3.scale(temp,Up,0.05));
                Center = vec3.add(Center,Center,vec3.scale(temp,Up,0.05));
            break;
        case "KeyE": // translate view down, rotate clockwise with shift
                Eye = vec3.add(Eye,Eye,vec3.scale(temp,Up,-0.05));
                Center = vec3.add(Center,Center,vec3.scale(temp,Up,-0.05));
            break;
        case "Escape": // reset view to default
            Eye = vec3.copy(Eye,defaultEye);
            Center = vec3.copy(Center,defaultCenter);
            Up = vec3.copy(Up,defaultUp);
            break;
    } // end switch
} // end handleKeyDown

function setupWebGL() {
    
    // Set up keys
    document.onkeydown = handleKeyDown; // call this when key pressed


    var imageCanvas = document.getElementById("myImageCanvas"); // create a 2d canvas
      var cw = imageCanvas.width, ch = imageCanvas.height; 
      imageContext = imageCanvas.getContext("2d"); 
      var bkgdImage = new Image(); 
      bkgdImage.crossorigin = "anonymous";
      bkgdImage.src = "https://ncsucgclass.github.io/prog3/sky.jpg";
      //bkgdImage.src = "https://raw.githubusercontent.com/thepkd/4x4bitFusion/master/564.png";
      bkgdImage.onload = function(){
          var iw = bkgdImage.width, ih = bkgdImage.height;
          imageContext.drawImage(bkgdImage,0,0,iw,ih,0,0,cw,ch);   
     }

     
    // Get the canvas and context
    var canvas = document.getElementById("myWebGLCanvas"); // create a js canvas
    gl = canvas.getContext("webgl"); // get a webgl object from it
    
    try {
      if (gl == null) {
        throw "unable to create gl context -- is your browser gl ready?";
      } else {
        //gl.clearColor(0.0, 0.0, 0.0, 0.7); // use black when we clear the frame buffer
        gl.clearDepth(1.0); // use max when we clear the depth buffer
        gl.enable(gl.DEPTH_TEST); // use hidden surface removal (with zbuffering)
        //gl.enable(gl.BLEND);
      }
    } // end try
    
    catch(e) {
      console.log(e);
    } // end catch
 
} // end setupWebGL


// setup the webGL shaders
function setupShaders() {
    
    // define vertex shader in essl using es6 template strings
    var vShaderCode = `
        attribute vec3 aVertexPosition; // vertex position
        uniform mat4 umMatrix; // the model matrix
        uniform mat4 upvmMatrix; // the project view model matrix
        
        void main(void) {
            
            // vertex position
            //vec4 vWorldPos4 = umMatrix * vec4(aVertexPosition, 1.0);
            gl_Position = upvmMatrix*vec4(aVertexPosition, 1.0);
            //gl_Position = vec4(aVertexPosition, 1.0);

        }
    `;
    
    // define fragment shader in essl using es6 template strings
    var fShaderCode = `
        precision mediump float; // set float to medium precision
        uniform int uSelectBkgd;    
        void main(void) {
        
            // ambient term
            if(uSelectBkgd==1)
            gl_FragColor = vec4(0.0,0.0,0.0,1.0); 
            else
            gl_FragColor = vec4(0.0,1.0,1.0,1.0);
        }
    `;
    
    try {
        var fShader = gl.createShader(gl.FRAGMENT_SHADER); // create frag shader
        gl.shaderSource(fShader,fShaderCode); // attach code to shader
        gl.compileShader(fShader); // compile the code for gpu execution

        var vShader = gl.createShader(gl.VERTEX_SHADER); // create vertex shader
        gl.shaderSource(vShader,vShaderCode); // attach code to shader
        gl.compileShader(vShader); // compile the code for gpu execution
            
        if (!gl.getShaderParameter(fShader, gl.COMPILE_STATUS)) { // bad frag shader compile
            throw "error during fragment shader compile: " + gl.getShaderInfoLog(fShader);  
            gl.deleteShader(fShader);
        } else if (!gl.getShaderParameter(vShader, gl.COMPILE_STATUS)) { // bad vertex shader compile
            throw "error during vertex shader compile: " + gl.getShaderInfoLog(vShader);  
            gl.deleteShader(vShader);
        } else { // no compile errors
            var shaderProgram = gl.createProgram(); // create the single shader program
            gl.attachShader(shaderProgram, fShader); // put frag shader in program
            gl.attachShader(shaderProgram, vShader); // put vertex shader in program
            gl.linkProgram(shaderProgram); // link program into gl context

            if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) { // bad program link
                throw "error during shader program linking: " + gl.getProgramInfoLog(shaderProgram);
            } else { // no shader program link errors
                gl.useProgram(shaderProgram); // activate shader program (frag and vert)
                
                // locate and enable vertex attributes
                vPosAttribLoc = gl.getAttribLocation(shaderProgram, "aVertexPosition"); // ptr to vertex pos attrib
                gl.enableVertexAttribArray(vPosAttribLoc); // connect attrib to array
                
                mMatrixULoc = gl.getUniformLocation(shaderProgram, "umMatrix"); // ptr to mmat
                pvmMatrixULoc = gl.getUniformLocation(shaderProgram, "upvmMatrix"); // ptr to pvmmat

                selectBkgdULoc = gl.getUniformLocation(shaderProgram, "uSelectBkgd");
            } // end if no shader program link errors
        } // end if no compile errors
    } // end try 
    
    catch(e) {
        console.log(e);
    } // end catch
} // end setup shaders

function makeSquare(){
    var vertexBuf = [];
    var triBuf = [];
    var vertices = [[0,0,0.2],[0.2,0,0.2],[0.2,0.2,0.2],[0,0.2,0.2],[0,0,0],[0.2,0,0],[0.2,0.2,0],[0,0.2,0]];
    var triangles = [[0,1,2],[2,3,0],[1,5,6],[6,2,1],[5,4,7],[7,6,5],[4,0,3],[3,7,4],[3,2,6],[6,7,3],[1,0,4],[4,5,1]];
    //normals = [(0,0,1),(0,0,1),(0,0,1),(0,0,1),()]

    //console.log(vertices.length);
    //console.log(triangles.length);
    //console.log(vertices[1][2]);
    //console.log(triangles[2][2]);

    for(var i=0; i<vertices.length; i++)
    {
        vertexBuf.push(vertices[i][0],vertices[i][1],vertices[i][2]);
    }

    for(var i=0; i<triangles.length; i++)
    {
        triBuf.push(triangles[i][0],triangles[i][1],triangles[i][2]);
    }
    //triBufSize = triangles.length;
return({vertices:vertexBuf, triangles:triBuf});
}


function cubeObj() {
    this.on = false; // initialise as not on
    this.color = vec3.fromValues(0,255,255); // Cyan
    this.translation = vec3.fromValues(0,0,0);
    this.xAxis = vec3.fromValues(1,0,0);
    this.yAxis = vec3.fromValues(0,1,0);
    this.center = vec3.fromValues(0.1,0.1,0.1);
}

function initCubes(l,w, vert, tri, z) {
    var cubeModel;
    arr = new Array(l);
    for(i=0;i<l;i++)
    {
        arr[i] = new Array(w);
    }

    for(i=0;i<l;i++)
    { 
        for(j=0;j<w;j++)
        { 
            arr[i][j]= new cubeObj();
            arr[i][j].translation = vec3.fromValues(j*0.5,i*0.5,z);
            cubeModel  = makeSquare();   
            //console.log(cubeModel.vertices);
            //console.log(cubeModel.triangles);

            vert.push(gl.createBuffer());
            gl.bindBuffer(gl.ARRAY_BUFFER,vert[vert.length-1]); // activate that buffer
            gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(cubeModel.vertices),gl.STATIC_DRAW);

            tri.push(gl.createBuffer());
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,tri[tri.length-1]); // activate that buffer
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(cubeModel.triangles),gl.STATIC_DRAW);
        }
    }
    console.log(arr);
    return arr;
}

function renderCubes(){
    function makeCubeTransform(model){
        var neg = vec3.create(); var temp = mat4.create();
        mat4.fromTranslation(mMatrix, vec3.negate(neg,model.center)); //move to center

        mat4.multiply(mMatrix,mat4.fromScaling(temp,vec3.fromValues(1.5,1.5,1.5)),mMatrix); //Scaled

        mat4.multiply(mMatrix, mat4.fromTranslation(temp,model.center),mMatrix); //Back to center
        mat4.multiply(mMatrix, mat4.fromTranslation(temp,model.translation),mMatrix); // Back to translation
    }
    var pMatrix = mat4.create(); // projection matrix
    var vMatrix = mat4.create(); // view matrix
    var mMatrix = mat4.create(); // model matrix
    var pvMatrix = mat4.create(); // hand * proj * view matrices
    var pvmMatrix = mat4.create(); // proj * view * model matrices

    gl.clear(gl.COLOR_BUFFER_BIT ); // clear frame/depth buffers
    // set up projection and view
    // mat4.fromScaling(hMatrix,vec3.fromValues(-1,1,1)); // create handedness matrix
    mat4.perspective(pMatrix,0.25*Math.PI,1,0.1,10); // create projection matrix
    mat4.lookAt(vMatrix,Eye,Center,Up); // create view matrix
    mat4.multiply(pvMatrix,pvMatrix,pMatrix); // projection
    mat4.multiply(pvMatrix,pvMatrix,vMatrix); // projection * view

    window.requestAnimationFrame(renderCubes); // set up frame render callback
    var currentModel;
    for(var i=0;i<gameLength; i++)
    {
        for(var j=0; j<gameWidth; j++){
                var index= (gameWidth*i)+j;
                gl.uniform1i(selectBkgdULoc, 0);
                if(buf_frame[i][j]==true)
                {
                makeCubeTransform(objArr[i][j]);
                mat4.multiply(pvmMatrix,pvMatrix,mMatrix); // project * view * model
                gl.uniformMatrix4fv(mMatrixULoc, false, mMatrix); // pass in the m matrix
                gl.uniformMatrix4fv(pvmMatrixULoc, false, pvmMatrix); // pass in the hpvm matrix
        
                // vertex buffer: activate and feed into vertex shader
                gl.bindBuffer(gl.ARRAY_BUFFER,vertBuffer[index]); // activate
                gl.vertexAttribPointer(vPosAttribLoc,3,gl.FLOAT,false,0,0); // feed
                //console.log(index); console.log(triBuffer[index]);
                // triangle buffer: activate and render
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,triBuffer[index]); // activate
                gl.drawElements(gl.TRIANGLES,3*triBufSize,gl.UNSIGNED_SHORT,0); // render
                //gl.drawElements(gl.LINES,3*triBufSize,gl.UNSIGNED_SHORT,0); // render
                }
        }
    }
    for(var i=0;i<gameLength; i++)
    {
        for(var j=0; j<gameWidth; j++){
                var index= (gameWidth*i)+j;
                gl.uniform1i(selectBkgdULoc, 1);

                makeCubeTransform(bkgdObjArr[i][j]);
                mat4.multiply(pvmMatrix,pvMatrix,mMatrix); // project * view * model
                gl.uniformMatrix4fv(mMatrixULoc, false, mMatrix); // pass in the m matrix
                gl.uniformMatrix4fv(pvmMatrixULoc, false, pvmMatrix); // pass in the hpvm matrix
        
                // vertex buffer: activate and feed into vertex shader
                gl.bindBuffer(gl.ARRAY_BUFFER,bkgdVertBuffer[index]); // activate
                gl.vertexAttribPointer(vPosAttribLoc,3,gl.FLOAT,false,0,0); // feed

                //console.log(index); console.log(triBuffer[index]);
                // triangle buffer: activate and render
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,bkgdTriBuffer[index]); // activate
                //gl.drawElements(gl.TRIANGLES,3*triBufSize,gl.UNSIGNED_SHORT,0); // render
                gl.drawElements(gl.LINES,3*triBufSize,gl.UNSIGNED_SHORT,0); // render
        }
    }

}

// 2x2 Block Matrix
// 2x gameLengthXgameWidth Field matrices. One of them is to Union the 2x2 into the Main Field matrix dimension. Second is to remember previous settles blocks.
function initBufBool(l,w, buf)
{
 for(let i=0;i<l;i++)
 {
     buf[i] = new Array(w);
     for(let j=0; j<w; j++)
     {            
        buf[i][j] = false;
     }
 }   
}

function generateNewBlock() //Clears Block Buffer and adds new Block. This should be called after Union check is done and decision to make new block is made after freezing buf_field to buf_frame.
{
    function clearAddBuf(buf, block){
        for(let i=0; i<gameLength; i++)
        {
            for(let j=0; j<gameWidth; j++)
            {
                buf[i][j] = false;
                if(i>=gameLength-blockDim && (j>=(gameWidth/2)||(j<((gameWidth/2)+blockDim))) )
                {
                    buf[i][j] = block[i-(gameLength-blockDim)][j-(gameWidth/2)];
                }
            }
        }
    }
    // Block configs;
    var types =  [[[true,false],[true,true]],[[true,true],[true,true]]];
    //2x2 Block.
    let i = getRandomInt(types.length);
    let block = types[i]; //2x2 block
    clearAddBuf(buf_block, block);
}

function gameEngine()
{
    //Every time interval bring the 
    generateNewBlock();
    setInterval(gameQuantum, 1500);
}

function gameQuantum()
{
    //Call downshift on buffer_block->Run Check Union(which sees if downshift gives a positive union->If yes, save old, geenarate new buf_bblock)
    function downShift(buf)
    {
        var down = new Array(gameLength);
        for(let i=0;i<gameLength-1; i++)
        {
            down[i] = new Array(gameWidth);
            down[i] = buf[i+1];
        }
        down[gameLength-1] = new Array(gameWidth);
        for(let j=0; j<gameWidth; j++)
        down[gameLength-1][j] = false; 
        return down;
    }
    function checkUnion(buf1,buf2)
    {
        var unionflag = false;
        var hit_floor_flag = false;
        var unionBlock = new Array(gameLength);
        for(let i=0; i<gameLength; i++)
        {
            unionBlock[i] = new Array(gameWidth);
            for(let j=0; j<gameWidth; j++)
            {
                if(buf1[i][j]== true && buf2[i][j]==true)
                    unionflag = true;
                else if(i==0 && buf1[i][j]==true)
                    hit_floor_flag = true;

                if(buf1[i][j]==true || buf2[i][j]==true)
                    unionBlock[i][j] = true;
                else
                    unionBlock[i][j] = false;
            }
        }
    return ({flag:unionflag, buf:unionBlock, floor:hit_floor_flag});
    }
    console.log(buf_block);
    console.log(buf_field);
    //Case where there is no memory to the foeld buffer.
    let temp = downShift(buf_block);
    let union_result = checkUnion(temp, buf_field);
    console.log(union_result);
    if(union_result.flag==false)
    {
        if(union_result.floor == true)
        {
            buf_field = union_result.buf;
            buf_frame = union_result.buf;
            generateNewBlock();
        }
        else
        {
            buf_block = temp;
            //buf_field = union_result.buf;
            buf_frame = union_result.buf;
        }
    }
    else
    {
        let collision_prevention = checkUnion(buf_block, buf_field);
        buf_field = collision_prevention.buf; // Explicitly modifying field buffer.
        buf_frame = collision_prevention.buf;
        generateNewBlock(); // Implicitly modifies buf_block
    }


}

function main()
{
    setupWebGL();
    setupShaders();
    initBufBool(gameLength, gameWidth, buf_frame);
    initBufBool(gameLength, gameWidth, buf_field);
    initBufBool(gameLength, gameWidth, buf_block);
    objArr = initCubes(gameLength,gameWidth, vertBuffer, triBuffer, 0);
    bkgdObjArr = initCubes(gameLength, gameWidth, bkgdVertBuffer, bkgdTriBuffer, -0.2)
//    console.log(vertBuffer);
    gameEngine();
    renderCubes();
}