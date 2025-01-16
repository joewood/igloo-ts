export class Texture {
  public texture: WebGLTexture;
  private format: GLenum;
  /**
   * Create a new texture, optionally filled blank.
   * @param {WebGLRenderingContext} gl
   * @param {GLenum} [format=GL_RGBA]
   * @param {GLenum} [wrap=GL_CLAMP_TO_EDGE]
   * @param {GLenum} [filter=GL_LINEAR]
   */
  constructor(
    private gl: WebGLRenderingContext,
    format: number = gl.RGBA,
    wrap: number = gl.CLAMP_TO_EDGE,
    filter: number = gl.LINEAR
  ) {
    var texture = (this.texture = gl.createTexture());
    gl.bindTexture(gl.TEXTURE_2D, texture);
    wrap = wrap == null ? gl.CLAMP_TO_EDGE : wrap;
    filter = filter == null ? gl.LINEAR : filter;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    this.format = format = format == null ? gl.RGBA : format;
  }

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
  }

  /**
   * Set texture to particular size, filled with vec4(0, 0, 0, 1).
   * @param {number} width
   * @param {number} height
   * @returns {Igloo.Texture}
   */
  private blank(width: number, height: number): Texture {
    var gl = this.gl;
    this.bind();
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      this.format,
      width,
      height,
      0,
      this.format,
      gl.UNSIGNED_BYTE,
      null
    );
    return this;
  }

  private static isArrayBufferView(
    source: Array<number> | ArrayBufferView | ImageData
  ): source is ArrayBufferView {
    return  ArrayBuffer.isView(source);
  }

  /** Set the texture to a particular image.
   * @param {Array|ArrayBufferView|TexImageSource} source
   * @param {number} [width]
   * @param {number} [height]
   * @returns {Igloo.Texture}
   */
  public set(
    source: Array<number> | ArrayBufferView | ImageData,
    width: number | null = null,
    height: number | null = null
  ): Texture {
    var gl = this.gl;
    this.bind();
    if (source instanceof Array) {
      source = new Uint8Array(source);
    } else if (Texture.isArrayBufferView(source)) {
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        this.format,
        width,
        height,
        0,
        this.format,
        gl.UNSIGNED_BYTE,
        source
      );
    } else {
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        this.format,
        this.format,
        gl.UNSIGNED_BYTE,
        source
      );
    }
    return this;
  }

  /** Set part of the texture to a particular image.    */
  private subset(
    source: Array<number> | Uint8Array | ImageData,
    xoff: number,
    yoff: number,
    width?: number,
    height?: number
  ): Texture {
    var gl = this.gl;
    this.bind();
    if (source instanceof Array) source = new Uint8Array(source);
    if (source instanceof Uint8Array) {
      if (width == null && height == null)
        throw Error("Must supply width or height when using an array");
      gl.texSubImage2D(
        gl.TEXTURE_2D,
        0,
        xoff,
        yoff,
        width,
        height,
        this.format,
        gl.UNSIGNED_BYTE,
        source
      );
    } else {
      gl.texSubImage2D(
        gl.TEXTURE_2D,
        0,
        xoff,
        yoff,
        this.format,
        gl.UNSIGNED_BYTE,
        source
      );
    }
    return this;
  }

  /** Copy part/all of the current framebuffer to this image */
  private copy(x: number, y: number, width: number, height: number): Texture {
    this.gl.copyTexImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.format,
      x,
      y,
      width,
      height,
      0
    );
    return this;
  }
}
