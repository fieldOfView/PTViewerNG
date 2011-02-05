/*
 * PTViewerNG - WebGL based interactive panorama viewer
 * Original author: Helmut Dersch   der@fh-furtwangen.de 2010
 * with contributions by Aldo Hoeben
 
   This program is free software; you can redistribute it and/or modify
   it under the terms of the GNU General Public License as published by
   the Free Software Foundation; either version 2, or (at your option)
   any later version.

   This program is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU General Public License for more details.

   You should have received a copy of the GNU General Public License
   along with this program; if not, write to the Free Software
   Foundation, Inc., 675 Mass Ave, Cambridge, MA 02139, USA.  
*/

function PTViewerNG( pt_canvas, panorama ) {
	var canvas 	= pt_canvas;
	var gl 		= initGL(canvas);
	var shader 	= initShaders( gl );
	
	/* create the cube */
	var cubeVertexPositionBuffer 		= initVertexPositions( gl );
	var cubeVertexTextureCoordBuffer	= initVertexTexture( gl );
	var cubeIndexBuffer					= initIndex( gl );

	var cubeTexture						= initTexture( gl );	
	this.loadImage = loadImage;
	
	
	loadImage( panorama );


	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.clearDepth(1.0);
	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);

	document.onkeydown = handleKeyDown;
	document.onkeyup   = handleKeyUp;
	
	canvas.onmousedown = handleMouseDown;
	document.onmouseup = handleMouseUp;
	canvas.onmousemove = handleMouseMove;

	setInterval(tick, 15);

  
	function initGL(canvas) {
  		var gl;
    	try {
      		gl = canvas.getContext("experimental-webgl");
    	} catch(e) {
    	}
    	if (!gl) {
      		alert("Could not initialise WebGL, sorry :-(");
    	}
    	return gl;
  	}


	function getShader(gl, id) {
    	var shaderScript = document.getElementById(id);
    	if (!shaderScript) {
      		return null;
		}

    	var str = "";
    	var k = shaderScript.firstChild;
   	 	while (k) {
      	if (k.nodeType == 3) {
        	str += k.textContent;
		}
      	k = k.nextSibling;
		}

    	var shader;
    	if (shaderScript.type == "x-shader/x-fragment") {
      		shader = gl.createShader(gl.FRAGMENT_SHADER);
    	} else if (shaderScript.type == "x-shader/x-vertex") {
     		shader = gl.createShader(gl.VERTEX_SHADER);
    	} else {
      		return null;
    	}

    	gl.shaderSource(shader, str);
    	gl.compileShader(shader);

    	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			alert(gl.getShaderInfoLog(shader));
			return null;
		}
		return shader;
	}


  
	function initShaders( gl ) {
		var fragmentShader = getShader(gl, "shader-fs");
		var vertexShader = getShader(gl, "shader-vs");

		var shader = gl.createProgram();
		gl.attachShader(shader, vertexShader);
		gl.attachShader(shader, fragmentShader);
		gl.linkProgram(shader);

		if (!gl.getProgramParameter(shader, gl.LINK_STATUS)) {
			alert("Could not initialise shaders");
		}

		gl.useProgram(shader);

		shader.vertexPositionAttribute = gl.getAttribLocation(shader, "aVertexPosition");
		gl.enableVertexAttribArray(shader.vertexPositionAttribute);

		shader.textureCoordAttribute = gl.getAttribLocation(shader, "aTextureCoord");
		gl.enableVertexAttribArray(shader.textureCoordAttribute);

		shader.pMatrixUniform = gl.getUniformLocation(shader, "uPMatrix");
		shader.mvMatrixUniform = gl.getUniformLocation(shader, "uMVMatrix");
		shader.samplerUniform = gl.getUniformLocation(shader, "uSampler");
		return shader;
	}


  	function handleLoadedTexture(image, texture) {
    	gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
/*
		// nearest neighour sampling -> aliasing
    	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

		// linear sampling with mipmapping -> nicest, but only works for power-of-two textures
    	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
		gl.generateMipmap(gl.TEXTURE_2D);
*/
		// linear sampling -> also allowed for non-power-of-two textures
    	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		
		// edge clamping is required for non-power-of-two textures
		// bonus: no edge artefacts between faces
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);		

    	gl.bindTexture(gl.TEXTURE_2D, null);
  	}


    
  
  	function initTexture( gl ){
  		var cubeTexture = new Array(6);
   		for(var i=0; i<6; i++){
 			cubeTexture[i] = gl.createTexture();
		}
		return cubeTexture;	
  	}
  	
  	function loadImage(name) {
  		var srcImage 	= new Array(6);
  		var tex = cubeTexture;

  		for(var i=0; i<6; i++){
 			srcImage[i] = new Image();
		}
	
		srcImage[0].src = name+".front.jpg";
 		srcImage[0].onload = function() {
      				handleLoadedTexture(srcImage[0], tex[0]); }
		srcImage[1].src = name+".left.jpg";
 		srcImage[1].onload = function() {
      				handleLoadedTexture(srcImage[1], tex[1]); }
		srcImage[2].src = name+".right.jpg";
 		srcImage[2].onload = function() {
      				handleLoadedTexture(srcImage[2], tex[2]); }
		srcImage[3].src = name+".back.jpg";
 		srcImage[3].onload = function() {
      				handleLoadedTexture(srcImage[3], tex[3]); }
		srcImage[4].src = name+".top.jpg";
 		srcImage[4].onload = function() {
      				handleLoadedTexture(srcImage[4], tex[4]); }
		srcImage[5].src = name+".bottom.jpg";
 		srcImage[5].onload = function() {
      				handleLoadedTexture(srcImage[5], tex[5]); }
	}

  	var mvMatrix;
  	var mvMatrixStack = [];

  	function mvPushMatrix(m) {
    	if (m) {
      		mvMatrixStack.push(m.dup());
      		mvMatrix = m.dup();
    	} else {
      		mvMatrixStack.push(mvMatrix.dup());
    	}
  	}

  	function mvPopMatrix() {
    	if (mvMatrixStack.length == 0) {
      		throw "Invalid popMatrix!";
    	}
    	mvMatrix = mvMatrixStack.pop();
    	return mvMatrix;
  	}

  	function loadIdentity() {
    	mvMatrix = Matrix.I(4);
  	}


  	function multMatrix(m) {
    	mvMatrix = mvMatrix.x(m);
  	}

  	function mvTranslate(v) {
    	var m = Matrix.Translation($V([v[0], v[1], v[2]])).ensure4x4();
    	multMatrix(m);
  	}

  	function mvRotate(ang, v) {
    	var arad = ang * Math.PI / 180.0;
    	var m = Matrix.Rotation(arad, $V([v[0], v[1], v[2]])).ensure4x4();
    	multMatrix(m);
  	}

  	var pMatrix;
  	function perspective(fovy, aspect, znear, zfar) {
    	pMatrix = makePerspective(fovy, aspect, znear, zfar);
  	}


  	function setMatrixUniforms() {
    	gl.uniformMatrix4fv(shader.pMatrixUniform, false, new Float32Array(pMatrix.flatten()));
    	gl.uniformMatrix4fv(shader.mvMatrixUniform, false, new Float32Array(mvMatrix.flatten()));
  	}


 
  
  

	function initVertexPositions( gl ){
		var cubeVertexPositionBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);

		vertices = [
		// Front face
       -1.0, -1.0,  1.0,
        1.0, -1.0,  1.0,
        1.0,  1.0,  1.0,
       -1.0,  1.0,  1.0,

       // Back face
       -1.0, -1.0, -1.0,
       -1.0,  1.0, -1.0,
        1.0,  1.0, -1.0,
        1.0, -1.0, -1.0,

       // Top face
       -1.0,  1.0, -1.0,
       -1.0,  1.0,  1.0,
        1.0,  1.0,  1.0,
        1.0,  1.0, -1.0,

       // Bottom face
       -1.0, -1.0, -1.0,
        1.0, -1.0, -1.0,
        1.0, -1.0,  1.0,
       -1.0, -1.0,  1.0,

       // Right face
        1.0, -1.0, -1.0,
        1.0,  1.0, -1.0,
        1.0,  1.0,  1.0,
        1.0, -1.0,  1.0,

       // Left face
       -1.0, -1.0, -1.0,
       -1.0, -1.0,  1.0,
       -1.0,  1.0,  1.0,
       -1.0,  1.0, -1.0,
		];
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
		cubeVertexPositionBuffer.itemSize = 3;
		cubeVertexPositionBuffer.numItems = 24;
		return cubeVertexPositionBuffer;
	}

	function initVertexTexture( gl ){
    	cubeVertexTextureCoordBuffer = gl.createBuffer();
    	gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexTextureCoordBuffer);
   		 var textureCoords = [
        // Front face
        1.0, 0.0,
        0.0, 0.0,
        0.0, 1.0,
        1.0, 1.0,

        // Back face
        0.0, 0.0,
        0.0, 1.0,
        1.0, 1.0,
        1.0, 0.0,

        // Top face
        1.0, 1.0,
        1.0, 0.0,
        0.0, 0.0,
        0.0, 1.0,

        // Bottom face
        1.0, 0.0,
        0.0, 0.0,
        0.0, 1.0,
        1.0, 1.0,

        // Right face
        0.0, 0.0,
        0.0, 1.0,
        1.0, 1.0,
        1.0, 0.0,

        // Left face
        1.0, 0.0,
        0.0, 0.0,
        0.0, 1.0,
        1.0, 1.0,
    	];
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
		cubeVertexTextureCoordBuffer.itemSize = 2;
		cubeVertexTextureCoordBuffer.numItems = 24;
		return cubeVertexTextureCoordBuffer;
	}


	function initIndex( gl ){
		var cubeIndexBuffer= new Array(6);

		for( var i=0; i<6; i++){
    		cubeIndexBuffer[i] = gl.createBuffer();
    		cubeIndexBuffer[i].itemSize = 1;
    		cubeIndexBuffer[i].numItems = 6;	
		}

    	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndexBuffer[0]);
    	var cubeVertexIndices = [ 0, 1, 2, 0, 2, 3 ]; // Front face
    	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndexBuffer[1]);    
    	cubeVertexIndices = [ 16, 17, 18, 16, 18, 19 ]; // Right face
    	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndexBuffer[2]);
    	cubeVertexIndices = [ 20, 21, 22, 20, 22, 23]; // Left face
    	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);

    	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndexBuffer[3]);
		cubeVertexIndices = [ 4, 5, 6, 4, 6, 7];// Back face
    	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndexBuffer[4]);    
    	cubeVertexIndices = [ 8, 9, 10, 8, 10, 11 ];// Top face
    	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndexBuffer[5]);   
    	cubeVertexIndices = [ 12, 13, 14,   12, 14, 15]; // Bottom face
 	    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);
 	    
 	    return cubeIndexBuffer;
	}


  	var fov  = 70;
  	var xRot = 0;
  	var yRot = 0;
  	var zRot = 0;
  	function drawScene() {
    	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

		if(isFullscreen) {
			if(canvas.width != document.body.clientWidth || canvas.height != document.body.clientHeight) {
				canvas.width = document.body.clientWidth;
				canvas.height = document.body.clientHeight;
			}
		}
		
		var aspect = canvas.width / canvas.height;
		gl.viewport(0, 0, canvas.width, canvas.height);
		
    	perspective(fov, aspect, 0.1, 100.0);
    	loadIdentity();

    	mvTranslate([0.0, 0.0, 0.0])

    	mvRotate(xRot, [1, 0, 0]);
    	mvRotate(yRot, [0, 1, 0]);
    	mvRotate(zRot, [0, 0, 1]);

    	gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
    	gl.vertexAttribPointer(shader.vertexPositionAttribute, cubeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    	gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexTextureCoordBuffer);
    	gl.vertexAttribPointer(shader.textureCoordAttribute, cubeVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

    	gl.activeTexture(gl.TEXTURE0);
    
    	for(var i=0; i<6; i++){
    		gl.bindTexture(gl.TEXTURE_2D, cubeTexture[i]);
    		gl.uniform1i(shader.samplerUniform, 0);

    		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndexBuffer[i]);
    		setMatrixUniforms();
    		gl.drawElements(gl.TRIANGLES, cubeIndexBuffer[i].numItems, gl.UNSIGNED_SHORT, 0);
    	}
	}


	var xSpeed = 0;
	var xSpeed_max = 1;
	var ySpeed = 0.4;
	var ySpeed_max = 3;
	var fovmax = 110;
	var fovmin = 5;

	var forcedSpeed = true;
	
	this.panLeft 	= panLeft;
	this.panRight 	= panRight;
	this.panUp 		= panUp;
	this.panDown 	= panDown;
	this.zoomIn 	= zoomIn;
	this.zoomOut 	= zoomOut;
	this.stop 		= stop;
	
	
	function panLeft(){
		if( ySpeed*45/fov > -ySpeed_max )
			ySpeed -= 0.05*fov/45;
		forcedSpeed = true;
	}
	function panRight(){
      	if(ySpeed*45/fov < ySpeed_max )
      		ySpeed += 0.05*fov/45;
      	forcedSpeed = true;
	}
	function panUp(){
      	if(xSpeed*45/fov > -xSpeed_max )
      		xSpeed -= 0.05*fov/45;
      	forcedSpeed = true;
	}
	function panDown(){
       	if(xSpeed*45/fov < xSpeed_max )
     		xSpeed += 0.05*fov/45;
      	forcedSpeed = true;
	}
	function zoomIn(){	
		if( fov > fovmin ){
			fov = fov-1;
			xSpeed *= fov/(fov+1);
			ySpeed *= fov/(fov+1);
		}
     }
	function zoomOut(){	
      	if( fov < fovmax ){
      		fov = fov+1;
      		xSpeed *= fov/(fov-1);
     		ySpeed *= fov/(fov-1);
     	}
     }
	function stop(){	
      	xSpeed = 0;
      	ySpeed = 0;
      	forcedSpeed = false;
     }


	var panLeftKeys 	= [	37, 100 ];
	var panRightKeys 	= [	39, 102 ];
	var panUpKeys 		= [	38, 104 ];
	var panDownKeys 	= [	40, 98 ];
	var zoomInKeys 		= [	16, 65, 107, 61, 187 ];
	var zoomOutKeys 	= [	17, 90, 109, 189 ];
	var stopKeys 		= [	67,32,101 ];
	var fullscreenKeys  = [ 70 ];
	
	function pressedOneOf( keylist ){
		for(var i=0; i< keylist.length; i++)
			if( currentlyPressedKeys[keylist[i]] )
				return true;
		return false;
	}

	var fullscreenKeyDown;
	
	function handleKeys() {
		if( pressedOneOf( panLeftKeys ) )
			panLeft();
		if( pressedOneOf( panRightKeys ) )
			panRight();
		if( pressedOneOf( panUpKeys ) )
			panUp();
		if( pressedOneOf( panDownKeys ) )
			panDown();
		if( pressedOneOf( zoomInKeys ) )
			zoomIn();
		if( pressedOneOf( zoomOutKeys ) )
			zoomOut();
		if( pressedOneOf( stopKeys ) )
			stop();
			
		if( pressedOneOf( fullscreenKeys ) ) {
			if(!fullscreenKeyDown) {
				fullscreenKeyDown = true;
				toggleFullscreen();
			}		
		} else 
			fullscreenKeyDown = false;
  	}


  	var currentlyDragging = false;
  	var currentDragX =0;
  	var currentDragY = 0;
  	var startDragX = 0;
  	var startDragY = 0;
  

  	function handleMouse() {
    	if (currentlyDragging) {
     		xSpeed = (currentDragY - startDragY) / 100;	  
     		ySpeed = (currentDragX - startDragX) / 100;
		}else {
      		if(!forcedSpeed) {	
       			xSpeed *= 0.8;
        		ySpeed *= 0.8;
      		}
		}
  	}


  	var lastTime = 0;
  	function animate() {
    	var timeNow = new Date().getTime();
   		if (lastTime != 0) {
      		var elapsed = timeNow - lastTime;
	  		var xRot_new = xRot + xSpeed*(90 * elapsed) / 3000.0;
	  		if( xRot_new <= 90.0 && xRot_new >= -90.0 )
	        	xRot = xRot_new
      		yRot += ySpeed*(90 * elapsed) / 3000.0;
      		//zRot += (90 * elapsed) / 10000.0;
    	}
    	lastTime = timeNow;
	}




  	function tick() {
  		handleKeys();
		handleMouse();
    	drawScene();
    	animate();
  	}

 	var currentlyPressedKeys = Object();

  	function handleKeyDown(event) {
    	currentlyPressedKeys[event.keyCode] = true;
		return false
  	}

  	function handleKeyUp(event) {
    	currentlyPressedKeys[event.keyCode] = false;
		return false
  	}

  
  	function handleMouseDown(event) {

    	startDragX = event.clientX;
    	startDragY = event.clientY;

    	currentDragX = event.clientX;
    	currentDragY = event.clientY;
    	currentlyDragging = true;  
		forcedSpeed = false;
		return false;
  	}
  
  	function handleMouseUp(event) {
   		currentlyDragging = false;
		forcedSpeed = false;
		return false;
  	}
  
  	function handleMouseMove(event) {
    	if(currentlyDragging) {
      		currentDragX = event.clientX;
      		currentDragY = event.clientY;
		}
		return false;
  	}

	
	this.toggleFullscreen = toggleFullscreen;
	var isFullscreen = false;
	var canvasStylesStore = Object();
	
	function toggleFullscreen() {
		if(!isFullscreen) {
			canvasStylesStore = Object( {
				position: ( canvas.style.position != "" ) ? canvas.style.position : "static",
				top: ( canvas.style.top != "" ) ? canvas.style.top : "0px",
				left: ( canvas.style.left != "" ) ? canvas.style.left : "0px",
				width: ( canvas.style.width != "" ) ? canvas.style.width : "auto",
				height: ( canvas.style.height != "" ) ? canvas.style.height : "auto",
				canvaswidth: canvas.width, 
				canvasheight: canvas.height,
			} );
			
			canvas.style.position = "fixed";
			canvas.style.top = "0px";
			canvas.style.left = "0px";
			canvas.style.width = "100%";
			canvas.style.height = "100%";
		} else {
			canvas.style.position = canvasStylesStore.position;
			canvas.style.top = canvasStylesStore.top;
			canvas.style.left = canvasStylesStore.left;
			canvas.style.width = canvasStylesStore.width;
			canvas.style.height = canvasStylesStore.height;
			canvas.width = canvasStylesStore.canvaswidth;
			canvas.height = canvasStylesStore.canvasheight;
			
		}
		isFullscreen = !isFullscreen;
	}
 }
