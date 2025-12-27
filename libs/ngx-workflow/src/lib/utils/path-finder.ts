import { XYPosition } from '../models';

interface GridNode {
    x: number;
    y: number;
    walkable: boolean;
    g: number; // Cost from start
    h: number; // Heuristic cost to end
    f: number; // Total cost
    parent: GridNode | null;
    opened: boolean;
    closed: boolean;
}

class MinHeap {
    private heap: GridNode[] = [];

    push(node: GridNode): void {
        this.heap.push(node);
        this.bubbleUp(this.heap.length - 1);
    }

    pop(): GridNode | undefined {
        if (this.heap.length === 0) return undefined;
        const top = this.heap[0];
        const bottom = this.heap.pop();
        if (this.heap.length > 0 && bottom) {
            this.heap[0] = bottom;
            this.sinkDown(0);
        }
        return top;
    }

    size(): number {
        return this.heap.length;
    }

    private bubbleUp(index: number): void {
        const element = this.heap[index];
        while (index > 0) {
            const parentIndex = Math.floor((index - 1) / 2);
            const parent = this.heap[parentIndex];
            if (element.f >= parent.f) break;
            this.heap[parentIndex] = element;
            this.heap[index] = parent;
            index = parentIndex;
        }
    }

    private sinkDown(index: number): void {
        const length = this.heap.length;
        const element = this.heap[index];
        while (true) {
            const leftChildIndex = 2 * index + 1;
            const rightChildIndex = 2 * index + 2;
            let leftChild: GridNode | undefined, rightChild: GridNode | undefined;
            let swap = null;

            if (leftChildIndex < length) {
                leftChild = this.heap[leftChildIndex];
                if (leftChild.f < element.f) {
                    swap = leftChildIndex;
                }
            }

            if (rightChildIndex < length) {
                rightChild = this.heap[rightChildIndex];
                if (
                    (swap === null && rightChild.f < element.f) ||
                    (swap !== null && rightChild.f < leftChild!.f)
                ) {
                    swap = rightChildIndex;
                }
            }

            if (swap === null) break;
            this.heap[index] = this.heap[swap];
            this.heap[swap] = element;
            index = swap;
        }
    }

    rescoreElement(node: GridNode): void {
        const index = this.heap.indexOf(node);
        if (index !== -1) {
            // Since f usually decreases in A*, we bubble up
            this.bubbleUp(index);
        }
    }
}

export class PathFinder {
    private gridSize = 20; // Size of each grid cell
    private grid: GridNode[][] = [];
    private width = 0;
    private height = 0;
    private bounds = { minX: 0, minY: 0, maxX: 0, maxY: 0 };

    constructor(
        private nodes: { x: number; y: number; width: number; height: number; id: string }[],
        private graphWidth: number = 2000,
        private graphHeight: number = 2000
    ) {
        this.initializeGrid();
    }

    private initializeGrid() {
        // Determine bounds based on nodes, with some padding
        if (this.nodes.length === 0) return;

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

        this.nodes.forEach(node => {
            minX = Math.min(minX, node.x);
            minY = Math.min(minY, node.y);
            maxX = Math.max(maxX, node.x + node.width);
            maxY = Math.max(maxY, node.y + node.height);
        });

        // Add padding
        const padding = 100;
        this.bounds = {
            minX: Math.floor((minX - padding) / this.gridSize) * this.gridSize,
            minY: Math.floor((minY - padding) / this.gridSize) * this.gridSize,
            maxX: Math.ceil((maxX + padding) / this.gridSize) * this.gridSize,
            maxY: Math.ceil((maxY + padding) / this.gridSize) * this.gridSize
        };

        this.width = Math.ceil((this.bounds.maxX - this.bounds.minX) / this.gridSize);
        this.height = Math.ceil((this.bounds.maxY - this.bounds.minY) / this.gridSize);

        // Initialize grid
        this.grid = [];
        for (let y = 0; y < this.height; y++) {
            const row: GridNode[] = [];
            for (let x = 0; x < this.width; x++) {
                row.push({
                    x,
                    y,
                    walkable: true,
                    g: 0,
                    h: 0,
                    f: 0,
                    parent: null,
                    opened: false,
                    closed: false
                });
            }
            this.grid.push(row);
        }

        // Mark obstacles
        this.nodes.forEach(node => {
            // Add path finding buffer (1 grid unit) so lines don't touch nodes
            const buffer = 1;
            const startX = Math.floor((node.x - this.bounds.minX) / this.gridSize) - buffer;
            const startY = Math.floor((node.y - this.bounds.minY) / this.gridSize) - buffer;
            const endX = Math.ceil((node.x + node.width - this.bounds.minX) / this.gridSize) + buffer;
            const endY = Math.ceil((node.y + node.height - this.bounds.minY) / this.gridSize) + buffer;

            for (let y = Math.max(0, startY); y < Math.min(this.height, endY); y++) {
                for (let x = Math.max(0, startX); x < Math.min(this.width, endX); x++) {
                    this.grid[y][x].walkable = false;
                }
            }
        });
    }

    findPath(start: XYPosition, end: XYPosition): XYPosition[] {
        const startGridX = Math.floor((start.x - this.bounds.minX) / this.gridSize);
        const startGridY = Math.floor((start.y - this.bounds.minY) / this.gridSize);
        const endGridX = Math.floor((end.x - this.bounds.minX) / this.gridSize);
        const endGridY = Math.floor((end.y - this.bounds.minY) / this.gridSize);

        // Check if start or end are out of bounds
        if (!this.isValid(startGridX, startGridY) || !this.isValid(endGridX, endGridY)) {
            return [start, end]; // Fallback to straight line
        }

        // Reset grid state for new search (optimization: use a search ID instead of clearing all?)
        // For now, simple reset is safer, but O(W*H). 
        // Optimization: Only reset nodes we touch? 
        // Let's iterate over the grid to reset. This is slow if grid is huge.
        // Better: Use a 'visitedToken' on GridNode and increment it per search.
        // But I can't easily change GridNode interface without touching everything.
        // Let's stick to resetting for now, but maybe optimize later.
        // Actually, since we create a NEW PathFinder on drag stop, the grid is fresh.
        // But findPath is called multiple times (once per edge).
        // So we MUST reset.
        // Optimization: Keep a list of visited nodes and reset only them.

        // We'll use a `resetList` to track modified nodes and reset them at the end.
        const resetList: GridNode[] = [];

        const startNode = this.grid[startGridY][startGridX];
        const endNode = this.grid[endGridY][endGridX];

        // Temporarily make start and end walkable
        const startWasWalkable = startNode.walkable;
        const endWasWalkable = endNode.walkable;
        startNode.walkable = true;
        endNode.walkable = true;
        resetList.push(startNode, endNode);

        const openList = new MinHeap();
        startNode.g = 0;
        startNode.h = Math.abs(startNode.x - endNode.x) + Math.abs(startNode.y - endNode.y);
        startNode.f = startNode.g + startNode.h;
        startNode.opened = true;
        openList.push(startNode);
        resetList.push(startNode);

        let pathFound = false;

        while (openList.size() > 0) {
            const currentNode = openList.pop()!;
            currentNode.closed = true;

            if (currentNode === endNode) {
                pathFound = true;
                break;
            }

            const neighbors = this.getNeighbors(currentNode);
            for (const neighbor of neighbors) {
                if (neighbor.closed || !neighbor.walkable) {
                    continue;
                }

                const gScore = currentNode.g + 1;

                if (!neighbor.opened || gScore < neighbor.g) {
                    neighbor.g = gScore;
                    neighbor.h = Math.abs(neighbor.x - endNode.x) + Math.abs(neighbor.y - endNode.y);
                    neighbor.f = neighbor.g + neighbor.h;
                    neighbor.parent = currentNode;

                    if (!neighbor.opened) {
                        neighbor.opened = true;
                        openList.push(neighbor);
                        resetList.push(neighbor);
                    } else {
                        openList.rescoreElement(neighbor);
                    }
                }
            }
        }

        let resultPath: XYPosition[] = [start, end];

        if (pathFound) {
            const path: XYPosition[] = [];
            let curr: GridNode | null = endNode;
            while (curr) {
                path.unshift({
                    x: curr.x * this.gridSize + this.bounds.minX + this.gridSize / 2,
                    y: curr.y * this.gridSize + this.bounds.minY + this.gridSize / 2
                });
                curr = curr.parent;
            }
            path[0] = start;
            path[path.length - 1] = end;
            resultPath = this.simplifyPath(path);
        }

        // Cleanup
        startNode.walkable = startWasWalkable;
        endNode.walkable = endWasWalkable;

        // Reset modified nodes
        for (const node of resetList) {
            node.g = 0;
            node.h = 0;
            node.f = 0;
            node.parent = null;
            node.opened = false;
            node.closed = false;
        }

        return resultPath;
    }

    private isValid(x: number, y: number): boolean {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    private getNeighbors(node: GridNode): GridNode[] {
        const neighbors: GridNode[] = [];
        const dirs = [[0, 1], [1, 0], [0, -1], [-1, 0]]; // 4-directional

        for (const [dx, dy] of dirs) {
            const newX = node.x + dx;
            const newY = node.y + dy;

            if (this.isValid(newX, newY)) {
                neighbors.push(this.grid[newY][newX]);
            }
        }

        return neighbors;
    }

    private simplifyPath(path: XYPosition[]): XYPosition[] {
        if (path.length <= 2) return path;

        const simplified: XYPosition[] = [path[0]];
        let direction = {
            x: Math.sign(path[1].x - path[0].x),
            y: Math.sign(path[1].y - path[0].y)
        };

        for (let i = 1; i < path.length - 1; i++) {
            const nextPoint = path[i + 1];
            const currentPoint = path[i];

            const newDirection = {
                x: Math.sign(nextPoint.x - currentPoint.x),
                y: Math.sign(nextPoint.y - currentPoint.y)
            };

            // If direction changes, add the turning point
            if (newDirection.x !== direction.x || newDirection.y !== direction.y) {
                simplified.push(currentPoint);
                direction = newDirection;
            }
        }

        simplified.push(path[path.length - 1]);
        return simplified;
    }
}
