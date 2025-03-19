import { critical_error_if, Vec2, Vec4 } from "./src/nostd.js"
import { Game, GameStatus } from "./src/game.js"
import { Renderer, red_color, green_color, dark_red_color } from "./src/opengl.js"

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

function debug_print(message: string): void
{
    if (ticks % 32 == 0) {
        console.log(message);
    }
}

main();
