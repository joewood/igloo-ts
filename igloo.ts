/**
 * A TypeScript Port of IglooJS - taken from https://github.com/skeeto/igloojs
 * 
 */
export const GL_RGBA = 0x1908;
export const GL_CLAMP_TO_EDGE = 0x812F;
export const GL_LINEAR = 0x2601;

export default class Igloo {
    public gl: WebGLRenderingContext;
    private canvas: HTMLCanvasElement;

    /** To be used in a vec2 GL_TRIANGLE_STRIP draw. */
    private static readonly QUAD2 = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    public defaultFramebuffer: Framebuffer;

    /** Wrap WebGLRenderingContext objects with useful behavior.
     * @param {WebGLRenderingContext|HTMLCanvasElement} gl
     * @param {Object} [options] to pass to getContext() */
    constructor(gl: HTMLCanvasElement | WebGLRenderingContext, options?: WebGLContextAttributes) {
        if (gl instanceof HTMLCanvasElement) {
            this.canvas = gl;
            this.gl = Igloo.getContext(gl, options);
        } else {
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
    private static getContext(canvas: HTMLCanvasElement, options: WebGLContextAttributes, noerror = false): WebGLRenderingContext {
        let gl;
        try {
            gl = canvas.getContext('webgl', options || {}) ||
                canvas.getContext('experimental-webgl', options || {});
        } catch (e) {
            gl = null;
        }
        if (gl == null && !noerror) {
            throw new Error('Could not create WebGL context.');
        } else {
            return gl;
        }
    };

    /**
     * @param {*} object
     * @returns {boolean} true if object is an array or typed array
     */
    public static isArray(object: Object): object is Array<number> {
        const name = Object.prototype.toString.apply(object, []);
        const re = / (Float(32|64)|Int(16|32|8)|Uint(16|32|8(Clamped)?))?Array]$/;
        return re.exec(name) != null;
    };

    /** Creates a program from a program configuration.
     * @param {string} vertex URL or source of the vertex shader
     * @param {string} fragment URL or source of the fragment shader
     * @param {Function} [transform] Transforms the shaders before compilation
     * @returns {Igloo.Program}
     */
    public program(vertex: string, fragment: string, transform?: (shader: string) => string): Program {
        // if (Igloo.looksLikeURL(vertex)) vertex = Igloo.fetch(vertex);
        // if (Igloo.looksLikeURL(fragment)) fragment = Igloo.fetch(fragment);
        if (transform != null) {
            vertex = transform(vertex);
            fragment = transform(fragment);
        }
        return new Program(this.gl, vertex, fragment);
    };

    /** Create a new GL_ARRAY_BUFFER with optional data. */
    public array(data: ArrayBuffer | ArrayBufferView | null = null, usage: GLenum | null = null): Buffer {
        const gl = this.gl;
        const buffer = new Buffer(gl, gl.ARRAY_BUFFER);
        if (data != null) {
            buffer.update(data, usage == null ? gl.STATIC_DRAW : usage);
        }
        return buffer;
    };

    /** Create a new GL_ELEMENT_ARRAY_BUFFER with optional data.*/
    private elements(data: ArrayBuffer | ArrayBufferView | null = null, usage: GLenum | null = null): Buffer {
        var gl = this.gl,
            buffer = new Buffer(gl, gl.ELEMENT_ARRAY_BUFFER);
        if (data != null) {
            buffer.update(data, usage == null ? gl.STATIC_DRAW : usage);
        }
        return buffer;
    };

    /** */
    private texture(source: ImageData, format: GLenum = GL_RGBA, wrap: GLenum = GL_CLAMP_TO_EDGE, filter: GLenum = GL_LINEAR): Texture {
        var texture = new Texture(this.gl, format, wrap, filter);
        if (source != null) {
            texture.set(source);
        }
        return texture;
    };

    /** */
    private framebuffer(texture: Texture): Framebuffer {
        var framebuffer = new Framebuffer(this.gl);
        if (texture != null) framebuffer.attach(texture);
        return framebuffer;
    };
}


export class Program {
    private vars: { [index: string]: WebGLUniformLocation | number } = {};
    private program: WebGLProgram;
    /**
     * Fluent WebGLProgram wrapper for managing variables and data. The
     * constructor compiles and links a program from a pair of shaders.
     * Throws an exception if compiling or linking fails.
     * @param {WebGLRenderingContext} gl
     * @param {string} vertex Shader source
     * @param {string} fragment Shader source
     * @constructor
     */
    constructor(private gl: WebGLRenderingContext, vertex: string, fragment: string) {
        this.gl = gl;
        var p = this.program = gl.createProgram();
        gl.attachShader(p, this.makeShader(gl.VERTEX_SHADER, vertex));
        gl.attachShader(p, this.makeShader(gl.FRAGMENT_SHADER, fragment));
        gl.linkProgram(p);
        if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
            throw new Error(gl.getProgramInfoLog(p));
        }
    };

    /** Compile a shader from source.*/
    private makeShader(type: number, source: string): WebGLShader {
        var gl = this.gl;
        var shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            return shader;
        } else {
            throw new Error(gl.getShaderInfoLog(shader));
        }
    };

    /** Tell WebGL to use this program right now. */
    public use(): Program {
        this.gl.useProgram(this.program);
        return this;
    };

    /**
     * Declare/set a uniform or set a uniform's data.
     * @param {string} name uniform variable name
     * @param {number|Array|ArrayBufferView} [value]
     * @param {boolean} [i] if true use the integer version
     * @returns {Igloo.Program} this
     */
    public uniform(name: string, value: number | Array<number> | boolean | ArrayBufferView | Float32Array = null, i: boolean = false): Program {
        if (value == null) {
            this.vars[name] = this.gl.getUniformLocation(this.program, name);
        } else {
            if (this.vars[name] == null) this.uniform(name);
            const v = this.vars[name];
            if (Igloo.isArray(value)) {
                const method = 'uniform' + value.length + (i ? 'i' : 'f') + 'v';
                this.gl[method](v, value);
            } else if (typeof value === 'number' || typeof value === 'boolean') {
                if (i) {
                    this.gl.uniform1i(v, <number>value);
                } else {
                    this.gl.uniform1f(v, <number>value);
                }
            } else {
                throw new Error('Invalid uniform value: ' + value);
            }
        }
        return this;
    };

    private isArrayBufferView(matrix: Array<number> | ArrayBufferView): matrix is ArrayBufferView {
        return (typeof matrix === "ArrayBufferView");
    }

    /**
     * Set a uniform's data to a specific matrix.
     * @param {string} name uniform variable name
     * @param {Array|ArrayBufferView} matrix
     * @param {boolean} [transpose=false]
     * @returns {Igloo.Program} this
     */
    private matrix(name: string, matrix: Array<number> | ArrayBufferView, transpose = false): Program {
        if (this.vars[name] == null) this.uniform(name);
        let length = 0;
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

    /**
     * Like the uniform() method, but using integers.
     * @returns {Igloo.Program} this
     */
    private uniformi(name: string, value: number): Program {
        return this.uniform(name, value, true);
    };

    /**
     * Declare an attrib or set an attrib's buffer.
     * @param {string} name attrib variable name
     * @param {WebGLBuffer} [value]
     * @param {number} [size] element size (required if value is provided)
     * @param {number} [stride=0]
     * @returns {Igloo.Program} this
     */
    public attrib(name: string, value: Buffer = null, size: number | null = null, stride: number | null = null): Program {
        const gl = this.gl;
        if (value == null) {
            this.vars[name] = gl.getAttribLocation(this.program, name);
        } else {
            if (this.vars[name] == null) this.attrib(name); // get location
            value.bind();
            gl.enableVertexAttribArray(this.vars[name] as any);
            gl.vertexAttribPointer(this.vars[name] as any, size, gl.FLOAT,
                false, stride == null ? 0 : stride, 0);
        }
        return this;
    };

    /**
     * Call glDrawArrays or glDrawElements with this program.
     * @param {number} mode
     * @param {number} count the number of vertex attribs to render
     * @param {GLenum} [type] use glDrawElements of this type
     * @returns {Igloo.Program} this
     */
    public draw(mode: number, count: number, type: GLenum | null = null): Program {
        const gl = this.gl;
        if (type == null) {
            gl.drawArrays(mode, 0, count);
        } else {
            gl.drawElements(mode, count, type, 0);
        }
        if (gl.getError() !== gl.NO_ERROR) {
            throw new Error('WebGL rendering error');
        }
        return this;
    };

    /**
     * Disables all attribs from this program.
     * @returns {Igloo.Program} this
     */
    private disable(): Program {
        for (let attrib in this.vars) {
            const location = this.vars[attrib];
            if (this.vars.hasOwnProperty(attrib)) {
                if (typeof location === 'number') {
                    this.gl.disableVertexAttribArray(location);
                }
            }
        }
        return this;
    };

}

export class Buffer {
    private target: GLenum;
    private buffer: WebGLBuffer;
    private size: number;

    /** Fluent WebGLBuffer wrapper.
     * @param {WebGLRenderingContext} gl
     * @param {GLenum} [target] either GL_ARRAY_BUFFER or GL_ELEMENT_ARRAY_BUFFER
     * @returns {WebGLProgram}
     * @constructor
     */
    constructor(private gl: WebGLRenderingContext, target: GLenum) {
        this.buffer = gl.createBuffer();
        this.target = (target == null ? gl.ARRAY_BUFFER : target);
        this.size = -1;
    };

    /**
     * Binds this buffer to ARRAY_BUFFER.
     * @returns {Buffer} this
     */
    public bind(): Buffer {
        this.gl.bindBuffer(this.target, this.buffer);
        return this;
    }

    /**
     * @param
     * @param {ArrayBuffer|ArrayBufferView} data
     * @param {GLenum} [usage]
     * @returns {Buffer} this
     */
    public update(data: ArrayBuffer | ArrayBufferView, usage: GLenum): Buffer {
        const gl = this.gl;
        if (data instanceof Array) {
            data = new Float32Array(data);
        }
        usage = usage == null ? gl.DYNAMIC_DRAW : usage;
        this.bind();
        if (this.size !== data.byteLength) {
            gl.bufferData(this.target, data, usage);
            this.size = data.byteLength;
        } else {
            gl.bufferSubData(this.target, 0, data);
        }
        return this;
    };
}

export class Texture {
    public texture: WebGLTexture;
    private format: GLenum;
    /**
     * Create a new texture, optionally filled blank.
     * @param {WebGLRenderingContext} gl
     * @param {GLenum} [format=GL_RGBA]
     * @param {GLenum} [wrap=GL_CLAMP_TO_EDGE]
     * @param {GLenum} [filter=GL_LINEAR]
     * @returns {Igloo.Texture}
     */
    constructor(private gl: WebGLRenderingContext, format = gl.RGBA, wrap = gl.CLAMP_TO_EDGE, filter = gl.LINEAR) {
        var texture = this.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        wrap = wrap == null ? gl.CLAMP_TO_EDGE : wrap;
        filter = filter == null ? gl.LINEAR : filter;
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
        this.format = format = format == null ? gl.RGBA : format;
    };

    /**
     * @param {number} [unit] active texture unit to bind
     * @returns {Igloo.Texture}
     */
    private bind(unit: number | null = null): Texture {
        var gl = this.gl;
        if (unit != null) {
            gl.activeTexture(gl.TEXTURE0 + unit);
        }
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        return this;
    };

    /**
     * Set texture to particular size, filled with vec4(0, 0, 0, 1).
     * @param {number} width
     * @param {number} height
     * @returns {Igloo.Texture}
     */
    private blank(width: number, height: number): Texture {
        var gl = this.gl;
        this.bind();
        gl.texImage2D(gl.TEXTURE_2D, 0, this.format, width, height,
            0, this.format, gl.UNSIGNED_BYTE, null);
        return this;
    };


    private static isArrayBufferView(source: Array<number> | ArrayBufferView | ImageData): source is ArrayBufferView {
        return (typeof source === "ArrayBufferView");
    }

    /** Set the texture to a particular image.
     * @param {Array|ArrayBufferView|TexImageSource} source
     * @param {number} [width]
     * @param {number} [height]
     * @returns {Igloo.Texture}
     */
    public set(source: Array<number> | ArrayBufferView | ImageData,
        width: number | null = null,
        height: number | null = null): Texture {
        var gl = this.gl;
        this.bind();
        if (source instanceof Array) {
            source = new Uint8Array(source);
        } else if (Texture.isArrayBufferView(source)) {
            gl.texImage2D(gl.TEXTURE_2D, 0, this.format, width, height, 0, this.format, gl.UNSIGNED_BYTE, source);
        } else {
            gl.texImage2D(gl.TEXTURE_2D, 0, this.format, this.format, gl.UNSIGNED_BYTE, source);
        }
        return this;
    };

    /** Set part of the texture to a particular image.    */
    private subset(source: Array<number> | Uint8Array | ImageData, xoff: number, yoff: number, width?: number, height?: number): Texture {
        var gl = this.gl;
        this.bind();
        if (source instanceof Array) source = new Uint8Array(source);
        if (source instanceof Uint8Array) {
            if (width == null && height == null) throw Error("Must supply width or height when using an array");
            gl.texSubImage2D(gl.TEXTURE_2D, 0, xoff, yoff,
                width, height, this.format, gl.UNSIGNED_BYTE, source);
        } else {
            gl.texSubImage2D(gl.TEXTURE_2D, 0, xoff, yoff, this.format, gl.UNSIGNED_BYTE, source);
        }
        return this;
    };

    /** Copy part/all of the current framebuffer to this image */
    private copy(x: number, y: number, width: number, height: number): Texture {
        this.gl.copyTexImage2D(this.gl.TEXTURE_2D, 0, this.format, x, y, width, height, 0);
        return this;
    };
}

export class Framebuffer {
    private framebuffer: WebGLFramebuffer;
    private renderbuffer: WebGLRenderbuffer;

    /**
     * @param {WebGLRenderingContext} gl
     * @param {WebGLFramebuffer} [framebuffer] to be wrapped (null for default)
     */
    constructor(private gl: WebGLRenderingContext, framebuffer?: WebGLFramebuffer) {
        this.framebuffer = arguments.length == 2 ? framebuffer : gl.createFramebuffer();
        this.renderbuffer = null;
    };

    public bind(): Framebuffer {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffer);
        return this;
    };

    private unbind(): Framebuffer {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        return this;
    };

    public attach(texture: Texture): Framebuffer {
        const gl = this.gl;
        this.bind();
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
            gl.TEXTURE_2D, texture.texture, 0);
        return this;
    };

    /**
     * Attach a renderbuffer as a depth buffer for depth-tested rendering.
     * @param {number} width
     * @param {number} height
     * @returns {Igloo.Framebuffer}
     */
    private attachDepth(width: number, height: number): Framebuffer {
        const gl = this.gl;
        this.bind();
        if (this.renderbuffer == null) {
            this.renderbuffer = gl.createRenderbuffer();
            gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16,
                width, height);
            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT,
                gl.RENDERBUFFER, this.renderbuffer);
        }
        return this;
    }
}