import { critical_error_if, Vec2, Vec4 } from "./nostd.js"
import { Game, GameStatus } from "./game.js"
import { Renderer, red_color, green_color, dark_red_color } from "./opengl.js"

var ticks: number = 0;

function main(): void
{
    try
    {
        const renderer = function(): Renderer {
            const canvas = document.getElementById("canvas") as HTMLCanvasElement;
            critical_error_if(!canvas, "missing 'canvas' element");
            return new Renderer(canvas);
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

const backround_color = new Vec4(73/255.0, 89/255.0, 81/255.0, 1.0);
const default_color = new Vec4(70.0/255.0, 70.0/255.0, 70.0/255.0, 1.0);

const unit_down_vec2 = new Vec2(0, -1);
const unit_up_vec2 = new Vec2(0, 1);

const unit_left_vec2 = new Vec2(-1, 0);
const unit_right_vec2 = new Vec2(1, 0);


const MINIMUM_ROW_COUNT = 6;
const MINIMUM_COLUMN_COUNT = 8;

const MAXIMUM_ROW_COUNT = 32;
const MAXIMUM_COLUMN_COUNT = 32;

const DEFAULT_ROW_COUNT = MINIMUM_ROW_COUNT;
const DEFAULT_COLUMN_COUNT = MINIMUM_COLUMN_COUNT;

const MINIMUM_SPEED = 1;
const MAXIMUM_SPEED = 32;
const DEFAULT_SPEED = MINIMUM_SPEED;

// TODO: set sensible values
const MINIMUM_WIDTH = 400;
const MAXIMUM_WIDTH = 800;

// TODO: set sensible values
const MINIMUM_HEIGHT = 400;
const MAXIMUM_HEIGHT = 800;

class GameContext {
    game: Game;
    game_speed: number;

    grid: Float32Array;

    rows_form: HTMLFormElement;
    columns_form: HTMLFormElement;
    speed_form: HTMLFormElement;
    score_form: HTMLFormElement;
    maximum_score_form: HTMLFormElement;
    width_form: HTMLFormElement;
    height_form: HTMLFormElement;

    renderer: Renderer;

    constructor (renderer: Renderer)
    {
        const game = new Game(DEFAULT_COLUMN_COUNT, DEFAULT_ROW_COUNT);

        const grid = make_grid(renderer, game.x_slices, game.y_slices);

        const rows_form = document.getElementById("rows") as HTMLFormElement;
        const columns_form = document.getElementById("columns") as HTMLFormElement;
        const speed_form = document.getElementById("speed") as HTMLFormElement;
        const score_form = document.getElementById("score") as HTMLFormElement;
        const maximum_score_form = document.getElementById("maximum_score") as HTMLFormElement;
        const width_form = document.getElementById("width") as HTMLFormElement;
        const height_form = document.getElementById("height") as HTMLFormElement;

        critical_error_if(!rows_form, "missing 'rows' form");
        critical_error_if(!columns_form, "missing 'columns' form");
        critical_error_if(!speed_form, "missing 'speed' form");
        critical_error_if(!score_form, "missing 'score' form");
        critical_error_if(!maximum_score_form, "missing 'maximum score' form");
        critical_error_if(!width_form, "missing 'width' form");
        critical_error_if(!height_form, "missing 'height' form");

        rows_form.value = DEFAULT_ROW_COUNT.toString();
        columns_form.value = DEFAULT_COLUMN_COUNT.toString();
        speed_form.value = DEFAULT_SPEED.toString();
        score_form.value = "0";
        maximum_score_form.value = "0";
        width_form.value = renderer.canvas.width.toString();
        height_form.value = renderer.canvas.height.toString();

        this.game = game;
        this.game_speed = DEFAULT_SPEED;
        this.grid = grid;
        this.rows_form = rows_form;
        this.columns_form = columns_form;
        this.speed_form = speed_form;
        this.score_form = score_form;
        this.maximum_score_form = maximum_score_form;
        this.width_form = width_form;
        this.height_form = height_form;
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

                    {
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
                    }

                    let speed: number = +this.speed_form.value;

                    if (speed < MINIMUM_SPEED || speed > MAXIMUM_SPEED) {
                        alert(`The speed (${speed}) must be in range [${MINIMUM_SPEED}, ${MAXIMUM_SPEED}]`);
                        speed = this.game_speed;
                    }

                    let width: number = +this.width_form.value;
                    let height: number = +this.height_form.value;

                    {
                        let ok = true;

                        if (width < MINIMUM_WIDTH || width > MAXIMUM_WIDTH) {
                            alert(`The width (${width}) must be in range [${MINIMUM_WIDTH}, ${MAXIMUM_WIDTH}]`);
                            ok = false;
                        }

                        if (height < MINIMUM_HEIGHT || height > MAXIMUM_HEIGHT) {
                            alert(`The height (${height}) must be in range [${MINIMUM_HEIGHT}, ${MAXIMUM_HEIGHT}]`);
                            ok = false;
                        }

                        if (!ok) {
                            width = this.renderer.canvas.width;
                            height = this.renderer.canvas.height;
                        }
                    }

                    this.game_speed = speed;

                    this.rows_form.value = rows.toString();
                    this.columns_form.value = columns.toString();
                    this.speed_form.value = speed.toString();
                    this.score_form.value = "0";

                    const ratio = columns / rows;

                    this.renderer.canvas.width = width;
                    this.renderer.canvas.height = height;
                    this.renderer.rescale_canvas(ratio);
                    this.renderer.rescale_projection(ratio);

                    this.width_form.value = width.toString();
                    this.height_form.value = height.toString();

                    this.grid = make_grid(this.renderer, columns, rows);

                    this.game.reset(columns, rows);

                    ticks = 0;
                } break;
            }
        });
    }

    move(): void
    {
        switch (this.game.status)
        {
            case GameStatus.Going: {
                const moves_per_tick = (MAXIMUM_SPEED - this.game_speed + MINIMUM_SPEED);

                if (ticks % moves_per_tick == 0) {
                    this.game.move();
                    this.score_form.value = this.game.score.toString();
                    this.maximum_score_form.value = this.game.maximum_score.toString();
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

// TODO: put left, right, bottom, top into a class.
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

function debug_print(message: string): void
{
    if (ticks % 32 == 0) {
        console.log(message);
    }
}

main();
