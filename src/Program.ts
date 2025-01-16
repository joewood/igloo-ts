import { Igloo } from "./Igloo";
import { Buffer } from "./Buffer";

export class Program {
    #vars: { [index: string]: WebGLUniformLocation | number } = {};
    #program: WebGLProgram;
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
        var p = (this.#program = gl.createProgram());
        gl.attachShader(p, this.makeShader(gl.VERTEX_SHADER, vertex));
        gl.attachShader(p, this.makeShader(gl.FRAGMENT_SHADER, fragment));
        gl.linkProgram(p);
        if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
            throw new Error(gl.getProgramInfoLog(p));
        }
    }

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
    }

    /** Tell WebGL to use this program right now. */
    public use(): Program {
        this.gl.useProgram(this.#program);
        return this;
    }

    public get program(): WebGLProgram {
        return this.#program;
    }

    /**
     * Declare/set a uniform or set a uniform's data.
     * @param {string} name uniform variable name
     * @param {number|Array|ArrayBufferView} [value]
     * @param {boolean} [i] if true use the integer version
     * @returns {Igloo.Program} this
     */
    public uniform(
        name: string,
        value: number | Array<number> | boolean | ArrayBufferView | Float32Array = null,
        i: boolean = false
    ): Program {
        if (value == null) {
            this.#vars[name] = this.gl.getUniformLocation(this.#program, name);
        } else {
            if (this.#vars[name] == null) this.uniform(name);
            const v = this.#vars[name];
            if (Igloo.isArray(value)) {
                const method = "uniform" + value.length + (i ? "i" : "f") + "v";
                this.gl[method](v, value);
            } else if (typeof value === "number" || typeof value === "boolean") {
                if (i) {
                    this.gl.uniform1i(v, <number>value);
                } else {
                    this.gl.uniform1f(v, <number>value);
                }
            } else {
                throw new Error("Invalid uniform value: " + value);
            }
        }
        return this;
    }

    private isArrayBufferView(matrix: Array<number> | ArrayBufferView): matrix is ArrayBufferView {
        return ArrayBuffer.isView(matrix);
    }

    /**
     * Set a uniform's data to a specific matrix.
     * @param {string} name uniform variable name
     * @param {Array|ArrayBufferView} matrix
     * @param {boolean} [transpose=false]
     * @returns {Igloo.Program} this
     */
    private matrix(name: string, matrix: Array<number> | ArrayBufferView, transpose = false): Program {
        if (this.#vars[name] == null) this.uniform(name);
        let length = 0;
        if (this.isArrayBufferView(matrix)) {
            length = matrix.byteLength;
        } else {
            length = matrix.length;
        }
        var method = "uniformMatrix" + Math.sqrt(length) + "fv";
        this.gl[method](this.#vars[name], Boolean(transpose), matrix);
        return this;
    }

    /**
     * Like the uniform() method, but using integers.
     * @returns {Igloo.Program} this
     */
    private uniformi(name: string, value: number): Program {
        return this.uniform(name, value, true);
    }

    /**
     * Declare an attrib or set an attrib's buffer.
     * @param {string} name attrib variable name
     * @param {WebGLBuffer} [value]
     * @param {number} [size] element size (required if value is provided)
     * @param {number} [stride=0]
     * @returns {Igloo.Program} this
     */
    public attrib(
        name: string,
        value: Buffer = null,
        size: number | null = null,
        stride: number | null = null
    ): Program {
        const gl = this.gl;
        if (value === null) {
            this.#vars[name] = gl.getAttribLocation(this.#program, name);
        } else {
            if (this.#vars[name] == null) this.attrib(name); // get location
            value.bind();
            gl.enableVertexAttribArray(this.#vars[name] as any);
            gl.vertexAttribPointer(this.#vars[name] as any, size, gl.FLOAT, false, stride == null ? 0 : stride, 0);
        }
        return this;
    }

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
            throw new Error("WebGL rendering error");
        }
        return this;
    }

    /**
     * Disables all attribs from this program.
     * @returns {Igloo.Program} this
     */
    private disable(): Program {
        for (let attrib in this.#vars) {
            const location = this.#vars[attrib];
            if (this.#vars.hasOwnProperty(attrib)) {
                if (typeof location === "number") {
                    this.gl.disableVertexAttribArray(location);
                }
            }
        }
        return this;
    }
}
