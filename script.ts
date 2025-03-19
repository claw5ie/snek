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

class Vec4 {
    x: number;
    y: number;
    z: number;
    w: number;

    constructor(x: number,
                y: number,
                z: number,
                w: number)
    {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
    }

    copy_from_vec4(vector: Vec4): void
    {
        this.x = vector.x;
        this.y = vector.y;
        this.z = vector.z;
        this.w = vector.w;
    }
};

const backround_color = new Vec4(73/255.0, 89/255.0, 81/255.0, 1.0);
const default_color = new Vec4(70.0/255.0, 70.0/255.0, 70.0/255.0, 1.0);
const red_color = new Vec4(1, 0, 0, 1.0);
const green_color = new Vec4(0, 1, 0, 1.0);
const dark_red_color = new Vec4(0x89/255.0, 0x01/255.0, 0x04/255.0, 1.0);

const unit_down_vec2 = new Vec2(0, -1);
const unit_up_vec2 = new Vec2(0, 1);
const unit_left_vec2 = new Vec2(-1, 0);
const unit_right_vec2 = new Vec2(1, 0);

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

class UniformMat4 {
    tag: "matrix" = "matrix";
    matrix: Mat4;

    constructor(matrix: Mat4) {
        this.matrix = matrix;
    }
};

class UniformVec4 {
    tag: "vector" = "vector";
    vector: Vec4;

    constructor(vector: Vec4) {
        this.vector = vector;
    }
};

type UniformData = UniformMat4 | UniformVec4;

class Uniform {
    location: WebGLUniformLocation;
    data: UniformData;

    constructor(location: WebGLUniformLocation,
                data: UniformData) {
        this.location = location;
        this.data     = data;
    }
};

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

    left: number = -8;
    right: number = 8;
    bottom: number = -6;
    top: number = 6;

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

            const projection_matrix = new Mat4([
                2.0 / (this.right - this.left), 0, 0, 0,
                0, 2.0 / (this.top - this.bottom), 0, 0,
                0, 0, 1, 0,
                (-1.0) * (this.right + this.left) / (this.right - this.left), (-1.0) * (this.top + this.bottom) / (this.top - this.bottom), 0, 1,
            ]);

            const color = new Vec4(0, 0, 0, 1);

            return new Map<string, Uniform>([
                [transform_uniform_name, new Uniform(transform_loc!, new UniformMat4(transform_matrix))],
                [projection_uniform_name, new Uniform(projection_loc!, new UniformMat4(projection_matrix))],
                [color_uniform_name, new Uniform(color_loc!, new UniformVec4(color))],
            ]);
        };
        const uniforms = make_uniforms();

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

    draw_rect(position: Vec2, color: Vec4, width: number, height: number): void
    {
        {
            const uniform = this.uniforms.get("transform");

            if (uniform) // Why can it be undefined?
            {
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
        }

        {
            const uniform = this.uniforms.get("color");

            if (uniform) // Why can it be undefined?
            {
                switch (uniform.data.tag)
                {
                    case "vector": {
                        const vector: Vec4 = uniform.data.vector;
                        vector.copy_from_vec4(color);
                    } break;
                }
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
        const array_buffer = this.buffers[1];

        critical_error_if(array_buffer.buffer_size < points.length * 4, `drawing too many lines (${points.length} points)`)

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, array_buffer.buffer);
        this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, points);

        {
            const uniform = this.uniforms.get("transform");

            if (uniform) // Why can it be undefined?
            {
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
        }

        {
            const uniform = this.uniforms.get("color");

            if (uniform) // Why can it be undefined?
            {
                switch (uniform.data.tag)
                {
                    case "vector": {
                        const vector: Vec4 = uniform.data.vector;
                        vector.copy_from_vec4(color);
                    } break;
                }
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

class Mat4 {
    data: Float32Array;

    constructor(array: number[])
    {
        critical_error_if(array.length != 16, `expected 16 values, but got ${array.length}`);

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

    constructor(position: Vec2)
    {
        // TODO: assert that the snake doesn't go outside of the bounds.
        this.body = new DoublyLinkedList<SnakeSegment>([
            new SnakeSegment(new Vec2(position.x - 0, position.y + 0), new Vec2(1, 0)),
            new SnakeSegment(new Vec2(position.x - 1, position.y + 0), new Vec2(1, 0)),
            new SnakeSegment(new Vec2(position.x - 2, position.y + 0), new Vec2(1, 0)),
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
    Defeat,
    Victory,
};

const MINIMUM_ROW_COUNT = 6;
const MINIMUM_COLUMN_COUNT = 8;

const MAXIMUM_ROW_COUNT = 32;
const MAXIMUM_COLUMN_COUNT = 32;

const DEFAULT_ROW_COUNT = MINIMUM_ROW_COUNT;
const DEFAULT_COLUMN_COUNT = MINIMUM_COLUMN_COUNT;

class Game {
    x_slices: number;
    y_slices: number;

    snake: Snake;
    food: Food;
    status: GameStatus;
    score: number;

    constructor(x_slices: number, y_slices: number)
    {
        this.reset(x_slices, y_slices);
    }

    reset(x_slices: number, y_slices: number): void
    {
        const snake = new Snake(new Vec2(x_slices / 2, y_slices / 2));

        this.x_slices = x_slices;
        this.y_slices = y_slices;
        this.snake = snake;
        this.food = this.find_food_position()!;
        this.status = GameStatus.Going;
        this.score = 0;
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

    is_valid_head_position(head_position: Vec2): boolean
    {
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
            this.score += 1;

            this.snake.body.insert_first(new SnakeSegment(head, segment.direction.copy()));

            const new_food = this.find_food_position();

            if (new_food) {
                this.food = new_food!;
            } else {
                this.status = GameStatus.Victory;
            }
        }
        else
        {
            if (this.is_valid_head_position(head)) {
                this.snake.move();
            } else {
                this.status = GameStatus.Defeat;
            }
        }
    }
};

class GameContext {
    game: Game;

    grid: Float32Array;

    rows_form: HTMLFormElement;
    columns_form: HTMLFormElement;
    score_form: HTMLFormElement;

    renderer: Renderer;

    constructor (renderer: Renderer)
    {
        const game = new Game(DEFAULT_COLUMN_COUNT, DEFAULT_ROW_COUNT);

        const grid = make_grid(renderer, game.x_slices, game.y_slices);

        const rows_form = document.getElementById("rows") as HTMLFormElement;
        const columns_form = document.getElementById("columns") as HTMLFormElement;
        const score_form = document.getElementById("score") as HTMLFormElement;

        critical_error_if(!rows_form, "missing 'rows' form");
        critical_error_if(!columns_form, "missing 'columns' form");
        critical_error_if(!score_form, "missing 'score' form");

        rows_form.value = DEFAULT_ROW_COUNT.toString();
        columns_form.value = DEFAULT_COLUMN_COUNT.toString();
        score_form.value = "0";

        this.game = game;
        this.grid = grid;
        this.rows_form = rows_form;
        this.columns_form = columns_form;
        this.score_form = score_form;
        this.renderer = renderer;

        this.finish_initialization();
    }

    // NOTE: don't want to accept inputs before fields are initialized.
    finish_initialization(): void
    {
        document.addEventListener('keydown', (event) => {
            const set_direction = (direction: Vec2): void => {
                let head = this.game.snake.body.first;
                let after_head = head!.next;

                if (!after_head) {
                    return;
                }

                const head_segment = head!.data;
                const head_position = head_segment.position.copy();

                const after_head_segment = after_head.data;

                head_position.add(direction);

                if (!head_position.equal(after_head_segment.position)) {
                    head_segment.direction.copy_from_vec2(direction);
                }
            };

            switch (event.key)
            {
                case "s": set_direction(unit_down_vec2);  break;
                case "w": set_direction(unit_up_vec2);    break;
                case "a": set_direction(unit_left_vec2);  break;
                case "d": set_direction(unit_right_vec2); break;
                case "r": {
                    let rows: number = +this.rows_form.value;
                    let columns: number = +this.columns_form.value;
                    let ok = true;

                    if (rows < MINIMUM_ROW_COUNT || rows > MAXIMUM_ROW_COUNT) {
                        alert(`The number of rows (${rows}) must be in range [${MINIMUM_ROW_COUNT}, ${MAXIMUM_ROW_COUNT}]`);
                        ok = false;
                    }

                    if (columns < MINIMUM_COLUMN_COUNT || columns > MAXIMUM_COLUMN_COUNT) {
                        alert(`The number of columns (${columns}) must be in range [${MINIMUM_COLUMN_COUNT}, ${MAXIMUM_COLUMN_COUNT}]`);
                        ok = false;
                    }

                    if (!ok) {
                        columns = this.game.x_slices;
                        rows = this.game.y_slices;
                    }

                    this.rows_form.value = rows.toString();
                    this.columns_form.value = columns.toString();
                    this.score_form.value = "0";

                    this.reset(columns, rows);
                    ticks = 0;
                } break;
            }
        });
    }

    reset(columns: number, rows: number): void
    {
        this.game.reset(columns, rows);
        this.grid = make_grid(this.renderer, columns, rows);
    }

    move(): void
    {
        switch (this.game.status)
        {
            case GameStatus.Going: {
                if (ticks % 32 == 0) {
                    this.game.move();
                    this.score_form.value = this.game.score.toString();
                }
            } break;
            case GameStatus.Defeat:
            case GameStatus.Victory: break;
        }
    }

    render(): void
    {
        let body_color = default_color;

        switch (this.game.status)
        {
            case GameStatus.Going: break;
            case GameStatus.Defeat: {
                body_color = red_color;
            } break;
            case GameStatus.Victory: {
                body_color = green_color;
            } break;
        }

        const width = (this.renderer.right - this.renderer.left) / this.game.x_slices;
        const height = (this.renderer.top - this.renderer.bottom) / this.game.y_slices;

        const to_local_coordinated = (position: Vec2): Vec2 => {
            const p = position.copy();
            p.x *= width;
            p.x += this.renderer.left;
            p.y *= height;
            p.y += this.renderer.bottom;
            return p;
        };

        this.renderer.draw_lines(default_color, this.grid);

        for (let it = this.game.snake.body.first; it != null; it = it.next)
        {
            const segment = it.data;
            const position = segment.position.copy();
            const actual_position = to_local_coordinated(position);
            this.renderer.draw_rect_centered(actual_position, body_color, width, height, 0.92);
        }

        switch (this.game.status)
        {
            case GameStatus.Going:
            case GameStatus.Defeat: {
                const position = this.game.food;
                const actual_position = to_local_coordinated(position);
                this.renderer.draw_rect_centered(actual_position, dark_red_color, width, height, 0.5);
            } break;
            case GameStatus.Victory: break;
        }
    }
};

function make_grid(renderer: Renderer, x_slices: number, y_slices: number): Float32Array
{
    const x_line_count = x_slices + 1;
    const y_line_count = y_slices + 1;

    const x_offset = (renderer.right - renderer.left) / (x_line_count - 1);
    const y_offset = (renderer.top - renderer.bottom) / (y_line_count - 1);

    const grid = new Float32Array((x_line_count + y_line_count) * 4);

    let comp_count = 0;

    for (let i = 0; i < x_line_count; i++)
    {
        const x = renderer.left + i * x_offset;
        grid[comp_count + 0] = x;
        grid[comp_count + 1] = renderer.bottom;
        grid[comp_count + 2] = x;
        grid[comp_count + 3] = renderer.top;
        comp_count += 4;
    }

    for (let i = 0; i < y_line_count; i++)
    {
        const y = renderer.bottom + i * y_offset;
        grid[comp_count + 0] = renderer.left;
        grid[comp_count + 1] = y;
        grid[comp_count + 2] = renderer.right;
        grid[comp_count + 3] = y;
        comp_count += 4;
    }

    return grid;
}

var ticks: number = 0;

function main(): void
{
    try
    {
        const renderer = function(): Renderer {
            const canvas = document.getElementById("canvas") as HTMLCanvasElement;
            const gl = canvas.getContext("webgl");

            critical_error_if(!gl, "Unable to initialize WebGL. Your browser or machine may not support it");

            return new Renderer(gl!);
        }();

        const game_context = new GameContext(renderer);

        game_context.renderer.gl.clearColor(backround_color.x, backround_color.y, backround_color.z, backround_color.w);

        function go()
        {
            game_context.renderer.gl.clear(renderer.gl.COLOR_BUFFER_BIT);

            game_context.move();
            game_context.render();

            ticks += 1;

            window.requestAnimationFrame(go);
        }

        go();
    } catch (err) {
        alert(err);
    }
}

main();

function critical_error_if(condition: boolean, message: string): void
{
    if (condition) {
        throw new Error(message);
    }
}

function critical_error(message: string): void
{
    critical_error_if(true, message);
}

function debug_print(message: string): void
{
    if (ticks % 32 == 0) {
        console.log(message);
    }
}

function create_shader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader
{
    const has_shader = gl.createShader(type);

    critical_error_if(!has_shader, "failed to create shader");

    const shader = has_shader!;

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    critical_error_if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS), "failed to compile shader: \n" + gl.getShaderInfoLog(shader));

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

    critical_error_if(!gl.getProgramParameter(program, gl.LINK_STATUS), "failed to link program: \n" + gl.getProgramInfoLog(program));

    return program;
}

function rand_range(min: number, max: number): number
{
    return Math.floor(Math.random() * (max - min) + min);
}
