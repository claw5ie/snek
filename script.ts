class DoublyLinkedListNode<T> {
    data: T;
    next: DoublyLinkedListNode<T> = null;
    previous: DoublyLinkedListNode<T> = null;

    constructor(data: T)
    {
        this.data = data;
    }
};

class DoublyLinkedList<T> {
    first: DoublyLinkedListNode<T> = null;
    last: DoublyLinkedListNode<T> = null;
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
            this.last.next = node;
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
            this.first.previous = node;
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

class Renderer {
    gl: WebGLRenderingContext;
    buffer: WebGLBuffer;
    attributes: VertexArrayAttribute[];
    program: WebGLProgram;
    uniforms: Map<string, Uniform>;

    constructor(gl: WebGLRenderingContext)
    {
        const buffer = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER,
									    new Float32Array([0, 0,
																		    0, 1,
																		    1, 0,
																		    1, 1]),
									    gl.STATIC_DRAW);

        const attribute = new VertexArrayAttribute(
            0,
            2,
            gl.FLOAT,
            false,
            0,
            0
        );

        const program = function(gh: WebGLRenderingContext) {
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
        }(this.gl);

        const transform_uniform_name = "transform";
        const projection_uniform_name = "projection";

        gl.useProgram(program);
        const transform_loc = gl.getUniformLocation(program, transform_uniform_name);
        const projection_loc = gl.getUniformLocation(program, projection_uniform_name);

        if (transform_loc === 0)
            alert("couldn't find uniform \"transform\"");

        if (projection_loc === 0)
            alert("couldn't find uniform \"projection\"");

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

        const uniforms = new Map<string, Uniform>([
            [transform_uniform_name, new Uniform(transform_loc, transform_matrix)],
            [projection_uniform_name, new Uniform(projection_loc, projection_matrix)],
        ]);

        this.gl = gl;
        this.buffer = buffer;
        this.attributes = [attribute];
        this.program = program;
        this.uniforms = uniforms;
    }

    bind(): void
    {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
        for (const attribute of this.attributes)
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

        let data = uniform.matrix.data;
        data[4 * 0 + 0] = width;
        data[4 * 1 + 1] = height;
        data[4 * 3 + 0] = position.x;
        data[4 * 3 + 1] = position.y;

        this.draw(this.gl.TRIANGLE_STRIP, 0, 4);
    }

    draw(mode: number, start: number, count: number): void
    {
        this.bind();

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
            new SnakeSegment(new Vec2(0, 0), new Vec2(-1, 0)),
            new SnakeSegment(new Vec2(1, 0), new Vec2(-1, 0)),
            new SnakeSegment(new Vec2(2, 0), new Vec2(-1, 0)),
        ]);
		}

		move(): void
		{
        let it = this.body.last;
				for (let i = this.body.count; i-- > 1; it = it.previous)
				{
						let segment = it.data;
						segment.position.add(segment.direction);
						segment.direction.copy_from_vec2(it.previous.data.direction);
				}

        let segment = it.data;
				segment.position.add(segment.direction);
		}

    is_position_occupied(position: Vec2): boolean
    {
        let it = this.body.first;
				while (it != null)
				{
            if (it.data.position.equal(position))
                return true;
            it = it.next;
				}
        return false;
    }
};

const LEFT = -8;
const RIGHT = 8;
const BOTTOM = -6;
const TOP = 6;

class Game {
    snake: Snake;
    food_position: Vec2;

    constructor() {
        this.snake = new Snake();
        this.food_position = this.find_food_position();

        const snake = this.snake;

        document.addEventListener('keydown', function(event) {
            const segment = snake.body.first.data;

            switch (event.key)
            {
                case "s": {
                    if (!segment.direction.equal(new Vec2(0, 1)))
                        snake.body.first.data.direction.put(0, -1);
                } break;
                case "w": {
                    if (!segment.direction.equal(new Vec2(0, -1)))
                        snake.body.first.data.direction.put(0, 1);
                } break;
                case "a": {
                    if (!segment.direction.equal(new Vec2(1, 0)))
                        snake.body.first.data.direction.put(-1, 0);
                } break;
                case "d": {
                    if (!segment.direction.equal(new Vec2(-1, 0)))
                        snake.body.first.data.direction.put(1, 0);
                } break;
            }
        });
    }

    find_food_position(): Vec2
    {
        const free_block_count = (RIGHT - LEFT) * (TOP - BOTTOM) - this.snake.body.count;

        let index = rand_range(0, free_block_count);
        for (const pos = new Vec2(LEFT, BOTTOM); pos.y < TOP; pos.y++)
        {
            for (pos.x = LEFT; pos.x < RIGHT; pos.x++)
            {
                if (!this.snake.is_position_occupied(pos))
                {
                    if (index == 0)
                        return pos;
                    index--;
                }
            }
        }

        return null;
    }

    move(): void
    {
        const segment = this.snake.body.first.data;
        const head = segment.position.copy();

        head.add(segment.direction);

        if (head.equal(this.food_position))
        {
            this.snake.body.insert_first(new SnakeSegment(head, segment.direction.copy()));
            this.food_position = this.find_food_position();
        }
        else
        {
            this.snake.move();
        }
    }

    render(renderer: Renderer): void
    {
        for (let it = this.snake.body.first; it != null; it = it.next)
				{
            const segment = it.data;
            renderer.draw_rect(segment.position, 1, 1);
				}

        renderer.draw_rect(this.food_position, 1, 1);
    }
};

main();

function main(): void
{
    let renderer = function (){
        const canvas = document.getElementById("canvas") as HTMLCanvasElement;
        const gl = canvas.getContext("webgl");

        if (gl === null)
        {
            alert("Unable to initialize WebGL. Your browser or machine may not support it.");
            return;
        }

        return new Renderer(gl);
    }();
    let game = new Game();

    renderer.gl.clearColor(73/255.0, 89/255.0, 81/255.0, 1.0);

		let i = 0;

    function go()
    {
        renderer.gl.clear(renderer.gl.COLOR_BUFFER_BIT);

				if (i % 32 == 0)
        {
            game.move();
        }

        game.render(renderer);

				i += 1;

        window.requestAnimationFrame(go);
    }

    go();
}

function create_shader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader
{
    const shader = gl.createShader(type);

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
