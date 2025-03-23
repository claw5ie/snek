import { Vec2, Vec4, Mat4, make_orthographic_projection, critical_error_if } from "./nostd.js"

export const red_color = new Vec4(1, 0, 0, 1.0);
export const green_color = new Vec4(0, 1, 0, 1.0);
export const dark_red_color = new Vec4(0x89/255.0, 0x01/255.0, 0x04/255.0, 1.0);

export class VertexArrayAttribute {
    location: number;
    components: number;
    typ: number;
    normalize: boolean;
    stride: number;
    offset: number;

    constructor(location: number,
                components: number,
                typ: number,
                normalize: boolean,
                stride: number,
                offset: number) {
        this.location   = location;
        this.components = components;
        this.typ        = typ;
        this.normalize  = normalize;
        this.stride     = stride;
        this.offset     = offset;
    }
};

export class UniformMat4 {
    tag: "matrix" = "matrix";
    matrix: Mat4;

    constructor(matrix: Mat4) {
        this.matrix = matrix;
    }
};

export class UniformVec4 {
    tag: "vector" = "vector";
    vector: Vec4;

    constructor(vector: Vec4) {
        this.vector = vector;
    }
};

export type UniformData = UniformMat4 | UniformVec4;

export class Uniform {
    location: WebGLUniformLocation;
    data: UniformData;

    constructor(location: WebGLUniformLocation,
                data: UniformData) {
        this.location = location;
        this.data     = data;
    }
};

export class VertexArrayBuffer {
    buffer: WebGLBuffer;
    buffer_size: number;
    attributes: VertexArrayAttribute[];

    constructor(buffer: WebGLBuffer, buffer_size: number, attributes: VertexArrayAttribute[]) {
        this.buffer = buffer;
        this.buffer_size = buffer_size;
        this.attributes = attributes;
    }
};

export class Renderer {
    canvas: HTMLCanvasElement;
    gl: WebGLRenderingContext;
    buffers: VertexArrayBuffer[];
    program: WebGLProgram;
    uniforms: Map<string, Uniform>;

    left: number = -8;
    right: number = 8;
    bottom: number = -6;
    top: number = 6;

    constructor(canvas: HTMLCanvasElement)
    {
        const has_gl = canvas.getContext("webgl");

        critical_error_if(!has_gl, "Unable to initialize WebGL. Your browser or machine may not support it");

        const gl = has_gl!;

        const buffers = function(): VertexArrayBuffer[] {
            const buffer0 = function() {
                const data = new Float32Array([
                    0, 0,
                    0, 1,
                    1, 0,
                    1, 1
                ]);
                const buffer_size = data.length * 4;
                const attribute = new VertexArrayAttribute(
                    0,
                    2,
                    gl.FLOAT,
                    false,
                    0,
                    0
                );

                const buffer = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
                gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

                return new VertexArrayBuffer(buffer, buffer_size, [attribute]);
            }();

            const buffer1 = function() {
                const buffer_size = 4 * 1024;
                const attribute = new VertexArrayAttribute(
                    0,
                    2,
                    gl.FLOAT,
                    false,
                    0,
                    0
                );

                const buffer = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
                gl.bufferData(gl.ARRAY_BUFFER, buffer_size, gl.DYNAMIC_DRAW);

                return new VertexArrayBuffer(buffer, buffer_size, [attribute]);
            }();

            return [buffer0, buffer1];
        }();

        const program = function(): WebGLProgram {
            const vertex_shader_source = "attribute vec2 position;\n"
                + "uniform mat4 transform;\n"
                + "uniform mat4 projection;\n"
                + "void main()\n"
                + "{\n"
                + "  gl_Position = projection * transform * vec4(position, 0.0, 1.0);\n"
                + "}\n";
            const fragment_shader_source = "precision highp float;\n"
                + "uniform vec4 color;\n"
                + "void main()\n"
                + "{\n"
                + "  gl_FragColor = color;\n"
                + "}\n";

            const vertex_shader = create_shader(gl, gl.VERTEX_SHADER, vertex_shader_source);
            const fragment_shader = create_shader(gl, gl.FRAGMENT_SHADER, fragment_shader_source);
            const program = create_program(gl, vertex_shader, fragment_shader);

            gl.deleteShader(vertex_shader);
            gl.deleteShader(fragment_shader);

            return program;
        }();

        const make_uniforms = (): Map<string, Uniform> => {
            gl.useProgram(program);

            const transform_uniform_name = "transform";
            const projection_uniform_name = "projection";
            const color_uniform_name = "color";

            const transform_loc = gl.getUniformLocation(program, transform_uniform_name);
            const projection_loc = gl.getUniformLocation(program, projection_uniform_name);
            const color_loc = gl.getUniformLocation(program, color_uniform_name);

            critical_error_if(!transform_loc, "couldn't find uniform \"" + transform_uniform_name + "\"");
            critical_error_if(!projection_loc, "couldn't find uniform \"" + projection_uniform_name + "\"");
            critical_error_if(!color_loc, "couldn't find uniform \"" + color_uniform_name + "\"");

            const transform_matrix = new Mat4([
                1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0,
                0, 0, 0, 1,
            ]);

            const projection_matrix = make_orthographic_projection(this.left, this.right, this.bottom, this.top);

            const color = new Vec4(0, 0, 0, 1);

            return new Map<string, Uniform>([
                [transform_uniform_name, new Uniform(transform_loc!, new UniformMat4(transform_matrix))],
                [projection_uniform_name, new Uniform(projection_loc!, new UniformMat4(projection_matrix))],
                [color_uniform_name, new Uniform(color_loc!, new UniformVec4(color))],
            ]);
        };
        const uniforms = make_uniforms();

        this.canvas = canvas;
        this.gl = gl;
        this.buffers = buffers;
        this.program = program;
        this.uniforms = uniforms;
    }

    rescale_projection(width_to_height_ratio: number): void
    {
        const uniform = this.uniforms.get("projection")!;

        switch (uniform.data.tag)
        {
            case "matrix": {
                // TODO: assumes ortho projection is at the center.
                const left = this.left;
                const right = this.right;
                const bottom = this.bottom;
                const top = this.top;

                // (right - left) / (top - bottom) == width_to_height_ratio     =>
                // (top - bottom) / (right - left) == 1 / width_to_height_ratio =>
                // (top - bottom) == (right - left) / width_to_height_ratio     =>

                const old_y_length = top - bottom;
                const new_y_length = (right - left) / width_to_height_ratio;
                const scale = new_y_length / old_y_length;
                const new_bottom = bottom * scale;
                const new_top = top * scale;

                this.bottom = new_bottom;
                this.top = new_top;

                uniform.data.matrix = make_orthographic_projection(left, right, new_bottom, new_top);
            } break;
        }
    }

    rescale_canvas(width_to_height_ratio: number): void
    {
        this.canvas.height = this.canvas.width / width_to_height_ratio;
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }

    bind(buffer_index: number): void
    {
        const array_buffer = this.buffers[buffer_index]!;

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, array_buffer.buffer);
        for (const attribute of array_buffer.attributes)
        {
            this.gl.vertexAttribPointer(
                attribute.location,
                attribute.components,
                attribute.typ,
                attribute.normalize,
                attribute.stride,
                attribute.offset);
            this.gl.enableVertexAttribArray(attribute.location);
        }
    }

    draw_rect(position: Vec2, color: Vec4, width: number, height: number): void
    {
        {
            const uniform = this.uniforms.get("transform")!;

            switch (uniform.data.tag)
            {
                case "matrix": {
                    const matrix: Mat4 = uniform.data.matrix;
                    matrix.data[4 * 0 + 0] = width;
                    matrix.data[4 * 1 + 1] = height;
                    matrix.data[4 * 3 + 0] = position.x;
                    matrix.data[4 * 3 + 1] = position.y;
                } break;
            }
        }

        {
            const uniform = this.uniforms.get("color")!;

            switch (uniform.data.tag)
            {
                case "vector": {
                    const vector: Vec4 = uniform.data.vector;
                    vector.copy_from_vec4(color);
                } break;
            }
        }

        // TODO: remove magic number (buffer index == 0).
        this.bind(0);
        this.draw(this.gl.TRIANGLE_STRIP, 0, 4);
    }

    draw_rect_centered(position: Vec2, color: Vec4, width: number, height: number, scale: number): void
    {
        const _position = position.copy();
        const half_inverse_scale = (1.0 - scale) / 2;
        _position.x += width * half_inverse_scale;
        _position.y += height * half_inverse_scale;
        this.draw_rect(_position, color, width * scale, height * scale);
    }

    draw_lines(color: Vec4, points: Float32Array)
    {
        critical_error_if(points.length % 4 != 0, "expected 4 points per line (start.x, start.y, end.x, end.y)");

        // TODO: remove magic number (buffer index == 1).
        const array_buffer = this.buffers[1]!;

        critical_error_if(array_buffer.buffer_size < points.length * 4, `drawing too many lines (${points.length} points)`)

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, array_buffer.buffer);
        this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, points);

        {
            const uniform = this.uniforms.get("transform")!;

            switch (uniform.data.tag)
            {
                case "matrix": {
                    const matrix: Mat4 = uniform.data.matrix;
                    matrix.data[4 * 0 + 0] = 1;
                    matrix.data[4 * 1 + 1] = 1;
                    matrix.data[4 * 3 + 0] = 0;
                    matrix.data[4 * 3 + 1] = 0;
                } break;
            }
        }

        {
            const uniform = this.uniforms.get("color")!;

            switch (uniform.data.tag)
            {
                case "vector": {
                    const vector: Vec4 = uniform.data.vector;
                    vector.copy_from_vec4(color);
                } break;
            }
        }

        this.bind(1);
        this.draw(this.gl.LINES, 0, points.length / 2);
    }

    // NOTE: need to bind desired vertex buffer before calling.
    draw(mode: number, start: number, count: number): void
    {
        this.gl.useProgram(this.program);
        for (const [_, uniform] of this.uniforms)
        {
            switch (uniform.data.tag)
            {
                case "matrix": {
                    const matrix: Mat4 = uniform.data.matrix;
                    this.gl.uniformMatrix4fv(uniform.location, false, matrix.data);
                } break;
                case "vector": {
                    const vector: Vec4 = uniform.data.vector;
                    this.gl.uniform4f(uniform.location, vector.x, vector.y, vector.z, vector.w);
                } break;
            }

        }

        this.gl.drawArrays(mode, start, count);
    }
};

export function create_shader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader
{
    const has_shader = gl.createShader(type);

    critical_error_if(!has_shader, "failed to create shader");

    const shader = has_shader!;

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    critical_error_if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS), "failed to compile shader: \n" + gl.getShaderInfoLog(shader));

    return shader;
}

export function create_program(gl: WebGLRenderingContext, vertex_shader: WebGLShader, fragment_shader: WebGLShader): WebGLProgram
{
    const program = gl.createProgram();

    gl.attachShader(program, vertex_shader);
    gl.attachShader(program, fragment_shader);
    gl.linkProgram(program);
    gl.detachShader(program, vertex_shader);
    gl.detachShader(program, fragment_shader);

    critical_error_if(!gl.getProgramParameter(program, gl.LINK_STATUS), "failed to link program: \n" + gl.getProgramInfoLog(program));

    return program;
}
