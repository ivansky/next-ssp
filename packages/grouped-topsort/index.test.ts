import { SortTreeNode, topologicalGroupedSort } from "./index";

function getValuesLayers(layers: Array<SortTreeNode<string>[]>): Array<string[]> {
    return layers.map(layer => layer.map(node => node.value));
}

describe('topologicalGroupedSort', () => {
    it('should sort and group nodes', () => {
        const a = new SortTreeNode('a');
        const b = new SortTreeNode('b', [a]);
        const c = new SortTreeNode('c', [a]);
        const d = new SortTreeNode('d', [b, c]);

        expect(getValuesLayers(topologicalGroupedSort([
            c,
            a,
            d,
            b
        ]))).toEqual([
          ['a'],
          ['c', 'b'],
          ['d']
        ])
    });

    it('should sort complex trees', () => {
        const a = new SortTreeNode('a');
        const b = new SortTreeNode('b', [a]);
        const c = new SortTreeNode('c', [a]);
        const d = new SortTreeNode('d', [b]);
        const e = new SortTreeNode('e', [c]);
        const f = new SortTreeNode('f', [d, e]);
        const g = new SortTreeNode('g', [c, b]);

        expect(getValuesLayers(topologicalGroupedSort([
            a,
            b,
            c,
            d,
            e,
            f,
            g,
        ]))).toEqual([
            ['a'],
            ['b', 'c'],
            ['d', 'e', 'g'],
            ['f']
        ])
    });

    it('should throw an exception for cycled deps', () => {
        const a = new SortTreeNode('a', []);
        const b = new SortTreeNode('b', [a]);
        const c = new SortTreeNode('c', [b]);

        function run() {
            topologicalGroupedSort([
                c,
                a.addDep(c),
                b
            ]);
        }
        expect(run).toThrow('Cycled paths: \nc->a->b->c');
    });
});
