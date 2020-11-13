var gameLength = 10;
var gameWidth = 6;

var objArr=[];
var vertBuffer=[];
var triBuffer = [];

var triBufSize =12; // CUbe with 6 faces and 12 traingles.

var vPosAttribLoc; // where to put position for vertex shader
var mMatrixULoc; // where to put model matrix for vertex shader
var pvmMatrixULoc;        

var defaultEye = vec3.fromValues(0.5,0.5,-0.5); // default eye position in world space
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

function setupWebGL() {
    
    // Set up keys
    ////document.onkeydown = handleKeyDown; // call this when key pressed


    //var imageCanvas = document.getElementById("myImageCanvas"); // create a 2d canvas
    //  var cw = imageCanvas.width, ch = imageCanvas.height; 
    //  imageContext = imageCanvas.getContext("2d"); 
    //  var bkgdImage = new Image(); 
    //  bkgdImage.crossorigin = "anonymous";
    //  bkgdImage.src = "https://ncsucgclass.github.io/prog3/sky.jpg";
    //  //bkgdImage.src = "https://raw.githubusercontent.com/thepkd/4x4bitFusion/master/564.png";
    //  bkgdImage.onload = function(){
    //      var iw = bkgdImage.width, ih = bkgdImage.height;
    //      imageContext.drawImage(bkgdImage,0,0,iw,ih,0,0,cw,ch);   
    // }

     
    // Get the canvas and context
    var canvas = document.getElementById("myWebGLCanvas"); // create a js canvas
    gl = canvas.getContext("webgl"); // get a webgl object from it
    
    try {
      if (gl == null) {
        throw "unable to create gl context -- is your browser gl ready?";
      } else {
        gl.clearColor(0.0, 0.0, 0.0, 1.0); // use black when we clear the frame buffer
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
            
        void main(void) {
        
            // ambient term
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
    var triangles = [[0,1,2],[1,2,3],[1,5,6],[5,6,2],[5,4,7],[4,7,6],[4,0,3],[0,3,7],[3,2,6],[2,6,7],[1,0,4],[0,4,5]];
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
    this.center = vec3.fromValues(0.5,0.5,0.5);
}

function initCubes(l,w) {
    var cubeModel;
    objArr = new Array(l);
    for(i=0;i<l;i++)
    {
        objArr[i] = new Array(w);
    }

    for(i=0;i<l;i++)
    { 
        for(j=0;j<w;j++)
        { 
            objArr[i][j]= new cubeObj();
            objArr[i][j].translation = vec3.fromValues(i*0.5,j*0.5,0);
            cubeModel  = makeSquare();   
            //console.log(cubeModel.vertices);
            //console.log(cubeModel.triangles);

            vertBuffer.push(gl.createBuffer());
            gl.bindBuffer(gl.ARRAY_BUFFER,vertBuffer[vertBuffer.length-1]); // activate that buffer
            gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(cubeModel.vertices),gl.STATIC_DRAW);

            triBuffer.push(gl.createBuffer());
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,triBuffer[triBuffer.length-1]); // activate that buffer
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(cubeModel.triangles),gl.STATIC_DRAW);
        }
    }
    //console.log(objArr);
}

function renderCubes(){
    function makeCubeTransform(model){
        var neg = vec3.create(); var temp = mat4.create();
        mat4.fromTranslation(mMatrix, vec3.negate(neg,model.center)); //move to center

        mat4.multiply(mMatrix,mat4.fromScaling(temp,vec3.fromValues(0.9,0.9,0.9)),mMatrix); //Scaled

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
    mat4.perspective(pMatrix,0.5*Math.PI,1,0.1,10); // create projection matrix
    mat4.lookAt(vMatrix,Eye,Center,Up); // create view matrix
    mat4.multiply(pvMatrix,pvMatrix,pMatrix); // projection
    mat4.multiply(pvMatrix,pvMatrix,vMatrix); // projection * view

    window.requestAnimationFrame(renderCubes); // set up frame render callback
    var currentModel;
    for(var i=0;i<gameLength; i++)
    {
        for(var j=0; j<gameWidth; j++){
                var index= (gameWidth*i)+j;
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
        }
    }
}

function main()
{
    setupWebGL();
    setupShaders();
    initCubes(gameLength,gameWidth);
    renderCubes();
}