class DoublyLinkedListNode<T> {
    data: T;
    next: DoublyLinkedListNode<T> = null;
    prev: DoublyLinkedListNode<T> = null;

    constructor(data: T)
    {
        this.data = data;
    }
};

class DoublyLinkedList<T> {
    first: DoublyLinkedListNode<T> = null;
    last: DoublyLinkedListNode<T> = null;
    count: number = 0;

    constructor(elems: T[])
    {
        for (const elem of elems)
            this.insert_last(elem);
    }

    insert_last(data: T)
    {
        const node = new DoublyLinkedListNode(data);

        if (this.count > 0)
        {
            this.last.next = node;
            node.prev = this.last;
            this.last = node;
        }
        else
        {
            this.first = node;
            this.last = node;
        }

        this.count += 1;
    }

    insert_first(data: T)
    {
        const node = new DoublyLinkedListNode(data);

        if (this.count > 0)
        {
            this.first.prev = node;
            node.next = this.first;
            this.first = node;
        }
        else
        {
            this.first = node;
            this.last = node;
        }

        this.count += 1;
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

		copy(v: Vec2)
		{
				this.x = v.x;
				this.y = v.y;
		}

		put(x: number, y: number)
		{
				this.x = x;
				this.y = y;
		}

		add(v: Vec2)
		{
				this.x += v.x;
				this.y += v.y;
		}

		equal(v: Vec2): boolean
		{
				return this.x === v.x && this.y === v.y;
		}
};

class Mat4 {
		data: Float32Array;

		constructor(array: Float32Array)
		{
				this.data = array;
		}

		at(row: number, column: number): number
		{
				return this.data[4 * column + row];
		}

		set2(column: number, x: number, y: number)
		{
				const offset = 4 * column;
				this.data[offset + 0] = x;
				this.data[offset + 1] = y;
		}
};

class SnakeSegment {
		pos: Vec2;
		dir: Vec2;

		constructor(pos: Vec2, dir: Vec2)
		{
				this.pos = pos;
				this.dir = dir;
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

		move()
		{
        let segment = this.body.first.data;
				segment.pos.add(segment.dir);

        let it = this.body.last;
				for (let i = this.body.count; i-- > 1; )
				{
						segment = it.data;
						segment.pos.add(segment.dir);
						segment.dir.copy(it.prev.data.dir);
            it = it.prev;
				}
		}
};

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const gl = canvas.getContext("webgl");
const LEFT = -8;
const RIGHT = 8;
const BOTTOM = -6;
const TOP = 6;

main();

function main()
{
    if (gl === null)
    {
        alert("Unable to initialize WebGL. Your browser or machine may not support it.");
        return;
    }

		const snake = new Snake();

		const transform = new Mat4(
				new Float32Array([1, 0, 0, 0,
													0, 1, 0, 0,
													0, 0, 1, 0,
													0, 0, 0, 1])
		);

    document.addEventListener('keydown', function(event) {
        switch (event.key)
        {
            case "s": {
                snake.body.first.data.dir.put(0, -1);
            } break;
            case "w": {
                snake.body.first.data.dir.put(0, 1);
            } break;
            case "a": {
                snake.body.first.data.dir.put(-1, 0);
            } break;
            case "d": {
                snake.body.first.data.dir.put(1, 0);
            } break;
        }
    });

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER,
									new Float32Array([0, 0,
																		0, 1,
																		1, 0,
																		1, 1]),
									gl.STATIC_DRAW);

    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);

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

    const vertex_shader = create_shader(gl.VERTEX_SHADER, vertex_shader_source);
    const fragment_shader = create_shader(gl.FRAGMENT_SHADER, fragment_shader_source);
    const program = create_program(vertex_shader, fragment_shader);

    const transform_loc = gl.getUniformLocation(program, "transform");
    if (transform_loc === 0) {
        alert("couldn't find uniform \"transform\"");
    }
		const projection_loc = gl.getUniformLocation(program, "projection");
    if (projection_loc === 0)
        alert("couldn't find uniform \"projection\"");

		const projection = new Float32Array([ 2.0 / (RIGHT - LEFT), 0, 0, -1.0 * (RIGHT + LEFT) / (RIGHT - LEFT),
																					0, 2.0 / (TOP - BOTTOM), 0, -1.0 * (TOP + BOTTOM) / (TOP - BOTTOM),
																					0, 0, 1, 0,
																					0, 0, 0, 1, ]);

		gl.useProgram(program);
    gl.uniformMatrix4fv(projection_loc, false, projection);

    gl.clearColor(73/255.0, 89/255.0, 81/255.0, 1.0);

		let i = 0;

    function go()
    {
        gl.clear(gl.COLOR_BUFFER_BIT);

				if (i % 32 === 0)
						snake.move();

				gl.useProgram(program);

				for (let it = snake.body.first; it != null; it = it.next)
				{
						const segment = it.data;
						transform.set2(3, segment.pos.x, segment.pos.y);
						gl.uniformMatrix4fv(transform_loc, false, transform.data);
						gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
				}

				i += 1;

        window.requestAnimationFrame(go);
    }

    go();
}

function create_shader(type: number, source: string): WebGLShader
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

function create_program(vertex_shader: WebGLShader, fragment_shader: WebGLShader): WebGLProgram
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
