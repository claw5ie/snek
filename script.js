const canvas = document.getElementById("canvas");
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

    const transform = new Float32Array([1, 0, 0, 0,
                                        0, 1, 0, 0,
                                        0, 0, 1, 0,
                                        0, 0, 0, 1]);
		var direction = new Float32Array([0, 0]);

    document.addEventListener('keydown', function(event) {
        switch (event.key)
        {
            case "s":
            {
                direction[0] = 0;
                direction[1] = -1;
            } break;
            case "w":
            {
                direction[0] = 0;
                direction[1] = 1;
            } break;
            case "a":
            {
                direction[0] = -1;
                direction[1] = 0;
            } break;
            case "d":
            {
                direction[0] = 1;
                direction[1] = 0;
            } break;
        }
    });

    const data = new Float32Array([0, 0,
                                   0, 1,
                                   1, 0,
                                   1, 1]);
    const buffer = gl.createBuffer(1);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

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
    if (transform_loc === 0)
        alert("couldn't find uniform \"transform\"");
		const projection_loc = gl.getUniformLocation(program, "projection");
    if (transform_loc === 0)
        alert("couldn't find uniform \"projection\"");

		const projection = new Float32Array([ 2.0 / (RIGHT - LEFT), 0, 0, -1.0 * (RIGHT + LEFT) / (RIGHT - LEFT),
																					0, 2.0 / (TOP - BOTTOM), 0, -1.0 * (TOP + BOTTOM) / (TOP - BOTTOM),
																					0, 0, 1, 0,
																					0, 0, 0, 1, ]);

		gl.useProgram(program);
    gl.uniformMatrix4fv(projection_loc, false, projection);

    gl.clearColor(73/255.0, 89/255.0, 81/255.0, 1.0);

		var i = 0;

    function go()
    {
        gl.clear(gl.COLOR_BUFFER_BIT);

				if (i % 32 == 0)
				{
						transform[12] += direction[0];
						transform[13] += direction[1];
				}

        gl.useProgram(program);
        gl.uniformMatrix4fv(transform_loc, false, transform);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        window.requestAnimationFrame(go);

				i += 1;
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
