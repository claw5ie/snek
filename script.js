const canvas = document.getElementById("canvas");
const gl = canvas.getContext("webgl");
const LEFT = -8;
const RIGHT = 8;
const BOTTOM = -6;
const TOP = 6;

class Mat4
{
		data;

		constructor(float32array)
		{
				this.data = float32array;
		}

		at(row, column)
		{
				return this.data[4 * column + row];
		}

		set2(column, x, y)
		{
				const offset = 4 * column;
				this.data[offset + 0] = x;
				this.data[offset + 1] = y;
		}
};

class Vec2
{
		x;
		y;

		constructor(x, y)
		{
				this.x = x;
				this.y = y;
		}

		copy(v)
		{
				this.x = v.x;
				this.y = v.y;
		}

		set(x, y)
		{
				this.x = x;
				this.y = y;
		}

		add(v)
		{
				this.x += v.x;
				this.y += v.y;
		}

		equal(v)
		{
				return this.x === v.x && this.y === v.y;
		}
};

class Segment
{
		pos;
		dir;

		constructor(pos, dir)
		{
				this.pos = pos;
				this.dir = dir;
		}
};

class Snake
{
		body;
		count;
		capacity;

		constructor()
		{
				this.count = 3;
				this.capacity = (RIGHT - LEFT) * (TOP - BOTTOM) * 4;
				this.body = new Array(this.capacity);

				for (let i = 0; i < this.capacity; i++)
						this.body[i] = new Segment(new Vec2(0, 0), new Vec2(0, 0));

				this.body[0].pos.set( 0, 0);
				this.body[0].dir.set(-1, 0);

				this.body[1].pos.set( 1, 0);
				this.body[1].dir.set(-1, 0);

				this.body[2].pos.set( 2, 0);
				this.body[2].dir.set(-1, 0);
		}

		move()
		{
				this.body[0].pos.add(this.body[0].dir);

				for (let i = this.count; i-- > 1; )
				{
						const segment = this.body[i];
						segment.pos.add(segment.dir);
						segment.dir.copy(this.body[i - 1].dir);
				}
		}
};

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
            case "s":
            {
								snake.body[0].dir.set(0, -1);
            } break;
            case "w":
            {
								snake.body[0].dir.set(0, 1);
            } break;
            case "a":
            {
								snake.body[0].dir.set(-1, 0);
            } break;
            case "d":
            {
								snake.body[0].dir.set(1, 0);
            } break;
        }
    });

    const buffer = gl.createBuffer(1);
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
				for (let i = 0; i < snake.count; i++)
				{
						const segment = snake.body[i];
						transform.set2(3, segment.pos.x, segment.pos.y);
						gl.uniformMatrix4fv(transform_loc, false, transform.data);
						gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
				}

				i += 1;

        window.requestAnimationFrame(go);
    }

    go();
}

function create_shader(type, source)
{
    const shader = gl.createShader(type);

    gl.shaderSource(shader, source);
    gl.compileShader(shader, source);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
    {
        alert("failed to compile shader: \n" + gl.getShaderInfoLog(shader));
    }

    return shader;
}

function create_program(vertex_shader, fragment_shader)
{
    const program = gl.createProgram();

    gl.attachShader(program, vertex_shader);
    gl.attachShader(program, fragment_shader);
    gl.linkProgram(program, vertex_shader, fragment_shader);
    gl.detachShader(program, vertex_shader);
    gl.detachShader(program, fragment_shader);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
    {
        alert("failed to link program: \n" + gl.getProgramInfoLog(program));
    }

    return program;
}
