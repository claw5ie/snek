class DoublyLinkedListNode<T> {
    data: T;
    next: DoublyLinkedListNode<T> | null = null;
    previous: DoublyLinkedListNode<T> | null = null;

    constructor(data: T)
    {
        this.data = data;
    }
};

class DoublyLinkedList<T> {
    first: DoublyLinkedListNode<T> | null = null;
    last: DoublyLinkedListNode<T> | null = null;
    count: number = 0;

    constructor(elements: T[])
    {
        for (const element of elements) {
            this.insert_last(element);
        }
    }

    insert_last(data: T): void
    {
        const node = new DoublyLinkedListNode(data);

        if (this.count > 0)
        {
            this.last!.next = node;
            node.previous = this.last;
            this.last = node;
            this.count += 1;
        }
        else
        {
            this.first = node;
            this.last = node;
            this.count = 1;
        }
    }

    insert_first(data: T): void
    {
        const node = new DoublyLinkedListNode(data);

        if (this.count > 0)
        {
            this.first!.previous = node;
            node.next = this.first;
            this.first = node;
            this.count += 1;
        }
        else
        {
            this.first = node;
            this.last = node;
            this.count = 1;
        }
    }
};

class Vec2 {
    x: number;
    y: number;

    constructor(x: number, y: number)
    {
        this.x = x;
        this.y = y;
    }

    copy(): Vec2
    {
        return new Vec2(this.x, this.y);
    }

    copy_from_vec2(v: Vec2)
    {
        this.x = v.x;
        this.y = v.y;
    }

    put(x: number, y: number): void
    {
        this.x = x;
        this.y = y;
    }

    add(v: Vec2): void
    {
        this.x += v.x;
        this.y += v.y;
    }

    equal(v: Vec2): boolean
    {
        return this.x === v.x && this.y === v.y;
    }
};

class VertexArrayAttribute {
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

class Uniform {
    location: WebGLUniformLocation;
    matrix: Mat4;

    constructor(location: WebGLUniformLocation,
                matrix: Mat4) {
        this.location = location;
        this.matrix   = matrix;
    }
};

const LEFT = -8;
const RIGHT = 8;
const BOTTOM = -6;
const TOP = 6;

class VertexArrayBuffer {
    buffer: WebGLBuffer;
    buffer_size: number;
    attributes: VertexArrayAttribute[];

    constructor(buffer: WebGLBuffer, buffer_size: number, attributes: VertexArrayAttribute[]) {
        this.buffer = buffer;
        this.buffer_size = buffer_size;
        this.attributes = attributes;
    }
};

class Renderer {
    gl: WebGLRenderingContext;
    buffers: VertexArrayBuffer[];
    program: WebGLProgram;
    uniforms: Map<string, Uniform>;

    constructor(gl: WebGLRenderingContext)
    {
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
            const fragment_shader_source = "void main()\n"
                + "{\n"
                + "  gl_FragColor = vec4(70.0/255.0, 70.0/255.0, 70.0/255.0, 1.0);\n"
                + "}\n";

            const vertex_shader = create_shader(gl, gl.VERTEX_SHADER, vertex_shader_source);
            const fragment_shader = create_shader(gl, gl.FRAGMENT_SHADER, fragment_shader_source);
            const program = create_program(gl, vertex_shader, fragment_shader);

            gl.deleteShader(vertex_shader);
            gl.deleteShader(fragment_shader);

            return program;
        }();

        const uniforms = function(): Map<string, Uniform> {
            gl.useProgram(program);

            const transform_uniform_name = "transform";
            const projection_uniform_name = "projection";

            const transform_loc = gl.getUniformLocation(program, transform_uniform_name);
            const projection_loc = gl.getUniformLocation(program, projection_uniform_name);

            if (!transform_loc)
                alert("couldn't find uniform \"" + transform_uniform_name + "\"");

            if (!projection_loc)
                alert("couldn't find uniform \"" + projection_uniform_name + "\"");

            const transform_matrix = new Mat4([
                1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0,
                0, 0, 0, 1,
            ]);

            const projection_matrix = new Mat4([
                2.0 / (RIGHT - LEFT), 0, 0, 0,
                0, 2.0 / (TOP - BOTTOM), 0, 0,
                0, 0, 1, 0,
                (-1.0) * (RIGHT + LEFT) / (RIGHT - LEFT), (-1.0) * (TOP + BOTTOM) / (TOP - BOTTOM), 0, 1,
            ]);

            return new Map<string, Uniform>([
                [transform_uniform_name, new Uniform(transform_loc!, transform_matrix)],
                [projection_uniform_name, new Uniform(projection_loc!, projection_matrix)]
            ]);
        }();

        this.gl = gl;
        this.buffers = buffers;
        this.program = program;
        this.uniforms = uniforms;
    }

    bind(buffer_index: number): void
    {
        const array_buffer = this.buffers[buffer_index];

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

    draw_rect(position: Vec2, width: number, height: number): void
    {
        const uniform = this.uniforms.get("transform");

        if (uniform) { // Why can it be undefined?
            let data = uniform.matrix.data;
            data[4 * 0 + 0] = width;
            data[4 * 1 + 1] = height;
            data[4 * 3 + 0] = position.x;
            data[4 * 3 + 1] = position.y;
        }

        // TODO: remove magic number (buffer index == 0).
        this.bind(0);
        this.draw(this.gl.TRIANGLE_STRIP, 0, 4);
    }

    draw_lines(points: Float32Array)
    {
        if (points.length % 4 != 0) {
            alert("expected 4 points per line (start.x, start.y, end.x, end.y)");
            return;
        }


        // TODO: remove magic number (buffer index == 1).
        const array_buffer = this.buffers[1];

        if (array_buffer.buffer_size < points.length * 4)
        {
            alert("drawing too many lines");
            return;
        }

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, array_buffer.buffer);
        this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, points);

        const uniform = this.uniforms.get("transform");

        if (uniform) { // Why can it be undefined?
            let data = uniform.matrix.data;
            data[4 * 0 + 0] = 1;
            data[4 * 1 + 1] = 1;
            data[4 * 3 + 0] = 0;
            data[4 * 3 + 1] = 0;
        }

        this.bind(1);
        this.draw(this.gl.LINES, 0, points.length / 2);
    }

    // NOTE: need to bind desired vertex buffer before calling.
    draw(mode: number, start: number, count: number): void
    {
        this.gl.useProgram(this.program);
        for (const [_, info] of this.uniforms)
        {
            this.gl.uniformMatrix4fv(info.location, false, info.matrix.data);
        }

        this.gl.drawArrays(mode, start, count);
    }
};

class Mat4 {
    data: Float32Array;

    constructor(array: number[])
    {
        if (array.length != 16)
            alert("expected 16 values, but got " + array.length);
        this.data = new Float32Array(array);
    }
};

class SnakeSegment {
    position: Vec2;
    direction: Vec2;

    constructor(position: Vec2, direction: Vec2)
    {
        this.position = position;
        this.direction = direction;
    }
};

class Snake {
    body: DoublyLinkedList<SnakeSegment>;

    constructor()
    {
        this.body = new DoublyLinkedList<SnakeSegment>([
            new SnakeSegment(new Vec2(2, 0), new Vec2(1, 0)),
            new SnakeSegment(new Vec2(1, 0), new Vec2(1, 0)),
            new SnakeSegment(new Vec2(0, 0), new Vec2(1, 0)),
        ]);
    }

    move(): void
    {
        let it = this.body.last;
        for (let i = this.body.count; i-- > 1; it = it!.previous)
        {
            let node = it!;

            const segment = node.data;
            segment.position.add(segment.direction);
            segment.direction.copy_from_vec2(node.previous!.data.direction);
        }

        const segment = it!.data;
        segment.position.add(segment.direction);
    }

    is_position_occupied(position: Vec2): boolean
    {
        for (let it = this.body.first; it != null; it = it.next)
        {
            if (it.data.position.equal(position)) {
                return true;
            }
        }
        return false;
    }
};

type Food = Vec2;

enum GameStatus {
    Going,
    Lost,
    Won,
};

class Game {
    x_slices: number;
    y_slices: number;

    snake: Snake;
    food: Food;
    status: GameStatus;

    grid: Float32Array;

    constructor(x_slices: number, y_slices: number) {
        const snake = new Snake();

        document.addEventListener('keydown', function(event) {
            const segment = snake.body.first!.data;

            switch (event.key)
            {
                case "s": {
                    if (!segment.direction.equal(new Vec2(0, 1)))
                        segment.direction.put(0, -1);
                } break;
                case "w": {
                    if (!segment.direction.equal(new Vec2(0, -1)))
                        segment.direction.put(0, 1);
                } break;
                case "a": {
                    if (!segment.direction.equal(new Vec2(1, 0)))
                        segment.direction.put(-1, 0);
                } break;
                case "d": {
                    if (!segment.direction.equal(new Vec2(-1, 0)))
                        segment.direction.put(1, 0);
                } break;
            }
        });

        const grid = function(): Float32Array {
            const x_line_count = x_slices + 1;
            const y_line_count = y_slices + 1;

            const x_offset = (RIGHT - LEFT) / (x_line_count - 1);
            const y_offset = (TOP - BOTTOM) / (y_line_count - 1);

            const grid = new Float32Array((x_line_count + y_line_count) * 4);

            let point_count = 0;

            for (let i = 0; i < x_line_count; i++)
            {
                const x = LEFT + i * x_offset;
                grid[point_count + 0] = x;
                grid[point_count + 1] = BOTTOM;
                grid[point_count + 2] = x;
                grid[point_count + 3] = TOP;
                point_count += 4;
            }

            for (let i = 0; i < y_line_count; i++)
            {
                const y = BOTTOM + i * y_offset;
                grid[point_count + 0] = LEFT;
                grid[point_count + 1] = y;
                grid[point_count + 2] = RIGHT;
                grid[point_count + 3] = y;
                point_count += 4;
            }

            return grid;
        }();

        this.x_slices = x_slices;
        this.y_slices = y_slices;
        this.snake = snake;
        this.food = this.find_food_position()!;
        this.status = GameStatus.Going;
        this.grid = grid;
    }

    find_food_position(): Vec2 | null
    {
        const free_block_count = this.x_slices * this.y_slices - this.snake.body.count;

        if (free_block_count == 0) {
            return null;
        }

        let free_blocks_to_skip = rand_range(0, free_block_count);
        for (const position = new Vec2(0, 0); position.y < this.y_slices; position.y++)
        {
            for (position.x = 0; position.x < this.x_slices; position.x++)
            {
                if (!this.snake.is_position_occupied(position))
                {
                    if (free_blocks_to_skip == 0) {
                        return position;
                    }
                    free_blocks_to_skip--;
                }
            }
        }

        // unreachable.
        return null;
    }

    is_valid_head_position(head_position: Vec2): boolean {
        let it = this.snake.body.first;
        let node = it!;

        for (it = node.next; it != null; it = node.next)
        {
            node = it!;
            if (node.data.position.equal(head_position)) {
                return false;
            }
        }

        return !(head_position.x < 0
            || head_position.x >= this.x_slices
            || head_position.y < 0
            || head_position.y >= this.y_slices);
    }

    move(): void
    {
        const segment = this.snake.body.first!.data;
        const head = segment.position.copy();

        head.add(segment.direction);

        if (head.equal(this.food))
        {
            this.snake.body.insert_first(new SnakeSegment(head, segment.direction.copy()));

            const new_food = this.find_food_position();

            if (new_food) {
                this.food = new_food!;
            } else {
                this.status = GameStatus.Won;
            }
        }
        else
        {
            if (this.is_valid_head_position(head)) {
                this.snake.move();
            } else {
                this.status = GameStatus.Lost;
            }
        }
    }

    render(renderer: Renderer): void
    {
        const x_scale = (RIGHT - LEFT) / this.x_slices;
        const y_scale = (TOP - BOTTOM) / this.y_slices;

        renderer.draw_lines(this.grid);

        for (let it = this.snake.body.first; it != null; it = it.next)
        {
            const segment = it.data;
            const position = segment.position.copy();
            position.x *= x_scale;
            position.x += LEFT + x_scale * 0.01;
            position.y *= y_scale;
            position.y += BOTTOM + y_scale * 0.01;
            renderer.draw_rect(position, x_scale * 0.98, y_scale * 0.98);
        }

        const position = this.food.copy();
        position.x *= x_scale;
        position.x += LEFT + x_scale / 4;
        position.y *= y_scale;
        position.y += BOTTOM + y_scale / 4;

        renderer.draw_rect(position, x_scale / 2, y_scale / 2);
    }
};

main();

function main(): void
{
    const renderer = function(): Renderer {
        const canvas = document.getElementById("canvas") as HTMLCanvasElement;
        const gl = canvas.getContext("webgl");

        if (!gl)
        {
            // TODO: handle alerts somehow.
            alert("Unable to initialize WebGL. Your browser or machine may not support it.");
        }

        return new Renderer(gl!);
    }();

    const game = new Game(4, 3);

    renderer.gl.clearColor(73/255.0, 89/255.0, 81/255.0, 1.0);

    let i = 0;

    function go()
    {
        renderer.gl.clear(renderer.gl.COLOR_BUFFER_BIT);

        switch (game.status)
        {
            case GameStatus.Going: {
                if (i % 32 == 0) {
                    game.move();
                }
            } break;
            case GameStatus.Lost:
            case GameStatus.Won:
                break;
        }

        game.render(renderer);

        i += 1;

        window.requestAnimationFrame(go);
    }

    go();
}

function create_shader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader
{
    const has_shader = gl.createShader(type);

    if (!has_shader) {
        // TODO: Handle alerts.
        alert("failed to create shader");
    }

    const shader = has_shader!;

    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
    {
        alert("failed to compile shader: \n" + gl.getShaderInfoLog(shader));
    }

    return shader;
}

function create_program(gl: WebGLRenderingContext, vertex_shader: WebGLShader, fragment_shader: WebGLShader): WebGLProgram
{
    const program = gl.createProgram();

    gl.attachShader(program, vertex_shader);
    gl.attachShader(program, fragment_shader);
    gl.linkProgram(program);
    gl.detachShader(program, vertex_shader);
    gl.detachShader(program, fragment_shader);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
    {
        alert("failed to link program: \n" + gl.getProgramInfoLog(program));
    }

    return program;
}

function rand_range(min: number, max: number): number
{
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1) + min);
}
