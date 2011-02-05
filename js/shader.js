
document.writeln('<'+'script id="shader-fs" type="x-shader/x-fragment"'+'>');
document.writeln('  #ifdef GL_ES');
document.writeln('  precision highp float;');
document.writeln('  #endif');
document.writeln('  varying vec2 vTextureCoord;');
document.writeln('  uniform sampler2D uSampler;');
document.writeln('  void main(void) {');
document.writeln('    gl_FragColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));');
document.writeln('  }');
document.writeln('<'+'/script'+'>');

document.writeln('<'+'script id="shader-vs" type="x-shader/x-vertex"'+'>');
document.writeln('attribute vec3 aVertexPosition;');
document.writeln('attribute vec2 aTextureCoord;');
document.writeln('uniform mat4 uMVMatrix;');
document.writeln('uniform mat4 uPMatrix;');
document.writeln('  varying vec2 vTextureCoord;');
document.writeln('  void main(void) {');
document.writeln('    gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);');
document.writeln('    vTextureCoord = aTextureCoord;');
document.writeln('  }');
document.writeln('<'+'/script'+'>');
