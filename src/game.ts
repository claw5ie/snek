import { DoublyLinkedList, Vec2, rand_range } from "./nostd.js"

export class SnakeSegment {
    position: Vec2;
    direction: Vec2;

    constructor(position: Vec2, direction: Vec2)
    {
        this.position = position;
        this.direction = direction;
    }
};

export class Snake {
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

export type Food = Vec2;

export enum GameStatus {
    Going,
    Defeat,
    Victory,
};

export class Game {
    x_slices: number;
    y_slices: number;

    snake: Snake;
    food: Food;
    status: GameStatus;
    score: number;
    maximum_score: number;

    constructor(x_slices: number, y_slices: number)
    {
        const snake = new Snake(new Vec2(x_slices / 2, y_slices / 2));

        this.x_slices = x_slices;
        this.y_slices = y_slices;
        this.snake = snake;
        this.food = this.find_food_position()!;
        this.status = GameStatus.Going;
        this.score = 0;
        this.maximum_score = 0;
    }

    // NOTE: doesn't reset maximum score.
    reset(x_slices: number, y_slices: number): void
    {
        const new_game = new Game(x_slices, y_slices);

        this.x_slices = new_game.x_slices;
        this.y_slices = new_game.y_slices;
        this.snake = new_game.snake;
        this.food = new_game.food;
        this.status = new_game.status;
        this.score = new_game.score;
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
            if (this.maximum_score < this.score) {
                this.maximum_score = this.score;
            }

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
