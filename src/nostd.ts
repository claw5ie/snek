export class DoublyLinkedListNode<T> {
    data: T;
    next: DoublyLinkedListNode<T> | null = null;
    previous: DoublyLinkedListNode<T> | null = null;

    constructor(data: T)
    {
        this.data = data;
    }
};

export class DoublyLinkedList<T> {
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

export class Vec2 {
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

export class Vec4 {
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

export class Mat4 {
    data: Float32Array;

    constructor(array: number[])
    {
        critical_error_if(array.length != 16, `expected 16 values, but got ${array.length}`);

        this.data = new Float32Array(array);
    }
};

export function make_orthographic_projection(left: number, right: number, bottom: number, top: number): Mat4
{
    return new Mat4([
        2.0 / (right - left), 0, 0, 0,
        0, 2.0 / (top - bottom), 0, 0,
        0, 0, 1, 0,
        (-1.0) * (right + left) / (right - left), (-1.0) * (top + bottom) / (top - bottom), 0, 1,
    ]);
}

export function rand_range(min: number, max: number): number
{
    return Math.floor(Math.random() * (max - min) + min);
}

export function critical_error_if(condition: boolean, message: string): void
{
    if (condition) {
        throw new Error(message);
    }
}

export function critical_error(message: string): void
{
    critical_error_if(true, message);
}
