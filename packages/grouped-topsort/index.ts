
export class SortTreeNode<T = any, N extends SortTreeNode<T> = any> {
    __degree = 0;
    __dependants: N[] = [];

    public deps: N[] = [];

    constructor(public value: T, deps: N[] = []) {
        this.addDeps(deps);
    }

    addDeps(deps: N[]) {
        deps.forEach(dep => this.addDep(dep));
        return this;
    }

    addDep(dep: N) {
        if (this.deps.includes(dep)) return this;
        this.deps.push(dep);
        dep.__dependants.push(this);
        this.__degree++;
        return this;
    }
}

export class CycleDepsError<T extends SortTreeNode> extends Error {
    constructor(lefts: T[]) {
        const first = lefts[0];
        const visited = [first];
        const cycled: Array<T[]> = [];

        function visit(node, paths: Array<T[]>) {
            node.__dependants.forEach(next => {
                const nextPaths = paths.map(
                  path => path.slice(0).concat([next])
                );

                if (visited.includes(next)) {
                    cycled.push(...nextPaths);
                    return;
                }

                visit(next, nextPaths);
            });
        }

        visit(first, [[first]]);

        super('Cycled paths: \n' + cycled.map(path => path.map(item => item.value).join('->')).join(';\n'));
    }
}

export function topologicalGroupedSort<T extends SortTreeNode>(nodes: T[]): Array<T[]> {
    if (!nodes.length) return [];

    let round: T[] = [...nodes];
    let nextRound: T[] = [];
    const sorted: Array<T[]> = [];
    let roundIndex = 0;

    while (nextRound.length || round.length) {
        const roundSorted = [];

        while (round.length) {
            const node = round.shift();
            if (node.__degree > 0) {
                nextRound.push(node);
                continue;
            }

            roundSorted.push(node);
        }

        if (!roundSorted.length) {
            throw new CycleDepsError(nextRound);
        }

        roundSorted.forEach(node => {
            node.__dependants.forEach(dependant => dependant.__degree--);
        })

        sorted[roundIndex] = roundSorted;
        round = nextRound;
        nextRound = [];
        roundIndex++;
    }

    return sorted;
}
