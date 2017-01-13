"use strict";
/**
 * A TypeScript Port of IglooJS - taken from https://github.com/skeeto/igloojs
 *
 */
exports.GL_RGBA = 0x1908;
exports.GL_CLAMP_TO_EDGE = 0x812F;
exports.GL_LINEAR = 0x2601;
var Igloo = (function () {
    /** Wrap WebGLRenderingContext objects with useful behavior.
     * @param {WebGLRenderingContext|HTMLCanvasElement} gl
     * @param {Object} [options] to pass to getContext() */
    function Igloo(gl, options) {
        if (gl instanceof HTMLCanvasElement) {
            this.canvas = gl;
            this.gl = Igloo.getContext(gl, options);
        }
        else {
            this.canvas = gl.canvas;
            this.gl = gl;
        }
        this.defaultFramebuffer = new Framebuffer(this.gl, null);
    }
    /**
     * @param {HTMLCanvasElement} canvas
     * @param {Object} [options] to pass to getContext()
     * @param {boolean} [noerror] If true, return null instead of throwing
     * @returns {?WebGLRenderingContext} a WebGL rendering context.
     */
    Igloo.getContext = function (canvas, options, noerror) {
        if (noerror === void 0) { noerror = false; }
        var gl;
        try {
            gl = canvas.getContext('webgl', options || {}) ||
                canvas.getContext('experimental-webgl', options || {});
        }
        catch (e) {
            gl = null;
        }
        if (gl == null && !noerror) {
            throw new Error('Could not create WebGL context.');
        }
        else {
            return gl;
        }
    };
    ;
    /**
     * @param {*} object
     * @returns {boolean} true if object is an array or typed array
     */
    Igloo.isArray = function (object) {
        var name = Object.prototype.toString.apply(object, []);
        var re = / (Float(32|64)|Int(16|32|8)|Uint(16|32|8(Clamped)?))?Array]$/;
        return re.exec(name) != null;
    };
    ;
    /** Creates a program from a program configuration.
     * @param {string} vertex URL or source of the vertex shader
     * @param {string} fragment URL or source of the fragment shader
     * @param {Function} [transform] Transforms the shaders before compilation
     * @returns {Igloo.Program}
     */
    Igloo.prototype.program = function (vertex, fragment, transform) {
        // if (Igloo.looksLikeURL(vertex)) vertex = Igloo.fetch(vertex);
        // if (Igloo.looksLikeURL(fragment)) fragment = Igloo.fetch(fragment);
        if (transform != null) {
            vertex = transform(vertex);
            fragment = transform(fragment);
        }
        return new Program(this.gl, vertex, fragment);
    };
    ;
    /** Create a new GL_ARRAY_BUFFER with optional data. */
    Igloo.prototype.array = function (data, usage) {
        if (data === void 0) { data = null; }
        if (usage === void 0) { usage = null; }
        var gl = this.gl;
        var buffer = new Buffer(gl, gl.ARRAY_BUFFER);
        if (data != null) {
            buffer.update(data, usage == null ? gl.STATIC_DRAW : usage);
        }
        return buffer;
    };
    ;
    /** Create a new GL_ELEMENT_ARRAY_BUFFER with optional data.*/
    Igloo.prototype.elements = function (data, usage) {
        if (data === void 0) { data = null; }
        if (usage === void 0) { usage = null; }
        var gl = this.gl, buffer = new Buffer(gl, gl.ELEMENT_ARRAY_BUFFER);
        if (data != null) {
            buffer.update(data, usage == null ? gl.STATIC_DRAW : usage);
        }
        return buffer;
    };
    ;
    /** */
    Igloo.prototype.texture = function (source, format, wrap, filter) {
        if (format === void 0) { format = exports.GL_RGBA; }
        if (wrap === void 0) { wrap = exports.GL_CLAMP_TO_EDGE; }
        if (filter === void 0) { filter = exports.GL_LINEAR; }
        var texture = new Texture(this.gl, format, wrap, filter);
        if (source != null) {
            texture.set(source);
        }
        return texture;
    };
    ;
    /** */
    Igloo.prototype.framebuffer = function (texture) {
        var framebuffer = new Framebuffer(this.gl);
        if (texture != null)
            framebuffer.attach(texture);
        return framebuffer;
    };
    ;
    return Igloo;
}());
/** To be used in a vec2 GL_TRIANGLE_STRIP draw. */
Igloo.QUAD2 = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
exports.__esModule = true;
exports["default"] = Igloo;
var Program = (function () {
    /**
     * Fluent WebGLProgram wrapper for managing variables and data. The
     * constructor compiles and links a program from a pair of shaders.
     * Throws an exception if compiling or linking fails.
     * @param {WebGLRenderingContext} gl
     * @param {string} vertex Shader source
     * @param {string} fragment Shader source
     * @constructor
     */
    function Program(gl, vertex, fragment) {
        this.gl = gl;
        this.vars = {};
        this.gl = gl;
        var p = this.program = gl.createProgram();
        gl.attachShader(p, this.makeShader(gl.VERTEX_SHADER, vertex));
        gl.attachShader(p, this.makeShader(gl.FRAGMENT_SHADER, fragment));
        gl.linkProgram(p);
        if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
            throw new Error(gl.getProgramInfoLog(p));
        }
    }
    ;
    /** Compile a shader from source.*/
    Program.prototype.makeShader = function (type, source) {
        var gl = this.gl;
        var shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            return shader;
        }
        else {
            throw new Error(gl.getShaderInfoLog(shader));
        }
    };
    ;
    /** Tell WebGL to use this program right now. */
    Program.prototype.use = function () {
        this.gl.useProgram(this.program);
        return this;
    };
    ;
    /**
     * Declare/set a uniform or set a uniform's data.
     * @param {string} name uniform variable name
     * @param {number|Array|ArrayBufferView} [value]
     * @param {boolean} [i] if true use the integer version
     * @returns {Igloo.Program} this
     */
    Program.prototype.uniform = function (name, value, i) {
        if (value === void 0) { value = null; }
        if (i === void 0) { i = false; }
        if (value == null) {
            this.vars[name] = this.gl.getUniformLocation(this.program, name);
        }
        else {
            if (this.vars[name] == null)
                this.uniform(name);
            var v = this.vars[name];
            if (Igloo.isArray(value)) {
                var method = 'uniform' + value.length + (i ? 'i' : 'f') + 'v';
                this.gl[method](v, value);
            }
            else if (typeof value === 'number' || typeof value === 'boolean') {
                if (i) {
                    this.gl.uniform1i(v, value);
                }
                else {
                    this.gl.uniform1f(v, value);
                }
            }
            else {
                throw new Error('Invalid uniform value: ' + value);
            }
        }
        return this;
    };
    ;
    Program.prototype.isArrayBufferView = function (matrix) {
        return (typeof matrix === "ArrayBufferView");
    };
    /**
     * Set a uniform's data to a specific matrix.
     * @param {string} name uniform variable name
     * @param {Array|ArrayBufferView} matrix
     * @param {boolean} [transpose=false]
     * @returns {Igloo.Program} this
     */
    Program.prototype.matrix = function (name, matrix, transpose) {
        if (transpose === void 0) { transpose = false; }
        if (this.vars[name] == null)
            this.uniform(name);
        var length = 0;
        if (this.isArrayBufferView(matrix)) {
            length = matrix.byteLength;
        }
        else {
            length = matrix.length;
        }
        var method = 'uniformMatrix' + Math.sqrt(length) + 'fv';
        this.gl[method](this.vars[name], Boolean(transpose), matrix);
        return this;
    };
    ;
    /**
     * Like the uniform() method, but using integers.
     * @returns {Igloo.Program} this
     */
    Program.prototype.uniformi = function (name, value) {
        return this.uniform(name, value, true);
    };
    ;
    /**
     * Declare an attrib or set an attrib's buffer.
     * @param {string} name attrib variable name
     * @param {WebGLBuffer} [value]
     * @param {number} [size] element size (required if value is provided)
     * @param {number} [stride=0]
     * @returns {Igloo.Program} this
     */
    Program.prototype.attrib = function (name, value, size, stride) {
        if (value === void 0) { value = null; }
        if (size === void 0) { size = null; }
        if (stride === void 0) { stride = null; }
        var gl = this.gl;
        if (value == null) {
            this.vars[name] = gl.getAttribLocation(this.program, name);
        }
        else {
            if (this.vars[name] == null)
                this.attrib(name); // get location
            value.bind();
            gl.enableVertexAttribArray(this.vars[name]);
            gl.vertexAttribPointer(this.vars[name], size, gl.FLOAT, false, stride == null ? 0 : stride, 0);
        }
        return this;
    };
    ;
    /**
     * Call glDrawArrays or glDrawElements with this program.
     * @param {number} mode
     * @param {number} count the number of vertex attribs to render
     * @param {GLenum} [type] use glDrawElements of this type
     * @returns {Igloo.Program} this
     */
    Program.prototype.draw = function (mode, count, type) {
        if (type === void 0) { type = null; }
        var gl = this.gl;
        if (type == null) {
            gl.drawArrays(mode, 0, count);
        }
        else {
            gl.drawElements(mode, count, type, 0);
        }
        if (gl.getError() !== gl.NO_ERROR) {
            throw new Error('WebGL rendering error');
        }
        return this;
    };
    ;
    /**
     * Disables all attribs from this program.
     * @returns {Igloo.Program} this
     */
    Program.prototype.disable = function () {
        for (var attrib in this.vars) {
            var location_1 = this.vars[attrib];
            if (this.vars.hasOwnProperty(attrib)) {
                if (typeof location_1 === 'number') {
                    this.gl.disableVertexAttribArray(location_1);
                }
            }
        }
        return this;
    };
    ;
    return Program;
}());
exports.Program = Program;
var Buffer = (function () {
    /** Fluent WebGLBuffer wrapper.
     * @param {WebGLRenderingContext} gl
     * @param {GLenum} [target] either GL_ARRAY_BUFFER or GL_ELEMENT_ARRAY_BUFFER
     * @returns {WebGLProgram}
     * @constructor
     */
    function Buffer(gl, target) {
        this.gl = gl;
        this.buffer = gl.createBuffer();
        this.target = (target == null ? gl.ARRAY_BUFFER : target);
        this.size = -1;
    }
    ;
    /**
     * Binds this buffer to ARRAY_BUFFER.
     * @returns {Buffer} this
     */
    Buffer.prototype.bind = function () {
        this.gl.bindBuffer(this.target, this.buffer);
        return this;
    };
    /**
     * @param
     * @param {ArrayBuffer|ArrayBufferView} data
     * @param {GLenum} [usage]
     * @returns {Buffer} this
     */
    Buffer.prototype.update = function (data, usage) {
        var gl = this.gl;
        if (data instanceof Array) {
            data = new Float32Array(data);
        }
        usage = usage == null ? gl.DYNAMIC_DRAW : usage;
        this.bind();
        if (this.size !== data.byteLength) {
            gl.bufferData(this.target, data, usage);
            this.size = data.byteLength;
        }
        else {
            gl.bufferSubData(this.target, 0, data);
        }
        return this;
    };
    ;
    return Buffer;
}());
exports.Buffer = Buffer;
var Texture = (function () {
    /**
     * Create a new texture, optionally filled blank.
     * @param {WebGLRenderingContext} gl
     * @param {GLenum} [format=GL_RGBA]
     * @param {GLenum} [wrap=GL_CLAMP_TO_EDGE]
     * @param {GLenum} [filter=GL_LINEAR]
     * @returns {Igloo.Texture}
     */
    function Texture(gl, format, wrap, filter) {
        if (format === void 0) { format = gl.RGBA; }
        if (wrap === void 0) { wrap = gl.CLAMP_TO_EDGE; }
        if (filter === void 0) { filter = gl.LINEAR; }
        this.gl = gl;
        var texture = this.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        wrap = wrap == null ? gl.CLAMP_TO_EDGE : wrap;
        filter = filter == null ? gl.LINEAR : filter;
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
        this.format = format = format == null ? gl.RGBA : format;
    }
    ;
    /**
     * @param {number} [unit] active texture unit to bind
     * @returns {Igloo.Texture}
     */
    Texture.prototype.bind = function (unit) {
        if (unit === void 0) { unit = null; }
        var gl = this.gl;
        if (unit != null) {
            gl.activeTexture(gl.TEXTURE0 + unit);
        }
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        return this;
    };
    ;
    /**
     * Set texture to particular size, filled with vec4(0, 0, 0, 1).
     * @param {number} width
     * @param {number} height
     * @returns {Igloo.Texture}
     */
    Texture.prototype.blank = function (width, height) {
        var gl = this.gl;
        this.bind();
        gl.texImage2D(gl.TEXTURE_2D, 0, this.format, width, height, 0, this.format, gl.UNSIGNED_BYTE, null);
        return this;
    };
    ;
    Texture.isArrayBufferView = function (source) {
        return (typeof source === "ArrayBufferView");
    };
    /** Set the texture to a particular image.
     * @param {Array|ArrayBufferView|TexImageSource} source
     * @param {number} [width]
     * @param {number} [height]
     * @returns {Igloo.Texture}
     */
    Texture.prototype.set = function (source, width, height) {
        if (width === void 0) { width = null; }
        if (height === void 0) { height = null; }
        var gl = this.gl;
        this.bind();
        if (source instanceof Array) {
            source = new Uint8Array(source);
        }
        else if (Texture.isArrayBufferView(source)) {
            gl.texImage2D(gl.TEXTURE_2D, 0, this.format, width, height, 0, this.format, gl.UNSIGNED_BYTE, source);
        }
        else {
            gl.texImage2D(gl.TEXTURE_2D, 0, this.format, this.format, gl.UNSIGNED_BYTE, source);
        }
        return this;
    };
    ;
    /** Set part of the texture to a particular image.    */
    Texture.prototype.subset = function (source, xoff, yoff, width, height) {
        var gl = this.gl;
        this.bind();
        if (source instanceof Array)
            source = new Uint8Array(source);
        if (source instanceof Uint8Array) {
            if (width == null && height == null)
                throw Error("Must supply width or height when using an array");
            gl.texSubImage2D(gl.TEXTURE_2D, 0, xoff, yoff, width, height, this.format, gl.UNSIGNED_BYTE, source);
        }
        else {
            gl.texSubImage2D(gl.TEXTURE_2D, 0, xoff, yoff, this.format, gl.UNSIGNED_BYTE, source);
        }
        return this;
    };
    ;
    /** Copy part/all of the current framebuffer to this image */
    Texture.prototype.copy = function (x, y, width, height) {
        this.gl.copyTexImage2D(this.gl.TEXTURE_2D, 0, this.format, x, y, width, height, 0);
        return this;
    };
    ;
    return Texture;
}());
exports.Texture = Texture;
var Framebuffer = (function () {
    /**
     * @param {WebGLRenderingContext} gl
     * @param {WebGLFramebuffer} [framebuffer] to be wrapped (null for default)
     */
    function Framebuffer(gl, framebuffer) {
        this.gl = gl;
        this.framebuffer = arguments.length == 2 ? framebuffer : gl.createFramebuffer();
        this.renderbuffer = null;
    }
    ;
    Framebuffer.prototype.bind = function () {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffer);
        return this;
    };
    ;
    Framebuffer.prototype.unbind = function () {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        return this;
    };
    ;
    Framebuffer.prototype.attach = function (texture) {
        var gl = this.gl;
        this.bind();
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture.texture, 0);
        return this;
    };
    ;
    /**
     * Attach a renderbuffer as a depth buffer for depth-tested rendering.
     * @param {number} width
     * @param {number} height
     * @returns {Igloo.Framebuffer}
     */
    Framebuffer.prototype.attachDepth = function (width, height) {
        var gl = this.gl;
        this.bind();
        if (this.renderbuffer == null) {
            this.renderbuffer = gl.createRenderbuffer();
            gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.renderbuffer);
        }
        return this;
    };
    return Framebuffer;
}());
exports.Framebuffer = Framebuffer;
