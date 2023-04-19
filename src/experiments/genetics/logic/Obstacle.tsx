
class AABB {
    start: Vec2
    end: Vec2

    constructor(start: Vec2, end: Vec2) {
        this.start = start;
        this.end = end;

        if (end.x < start.x || end.y < start.y)
            throw new Error("invalid argument");
    }

    testCollision(prev: Vec2, next: Vec2) {

    }
}

class Vec2 {
    x: number
    y: number

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    equals(o: Vec2) {
        return this.x === o.x && this.y === o.y;
    }
}


class Collision {
    point: Vec2
    normal: Vec2

    constructor(point: Vec2, normal: Vec2) {
        this.point = point;
        this.normal = normal;
    }
}

class BoxObstacle {
    aabb: AABB

    constructor(aabb: AABB) {
        this.aabb = aabb;
    }

    testCollision(prev: Vec2, next: Vec2) {

    }
}

export { BoxObstacle, AABB, Collision, Vec2 }