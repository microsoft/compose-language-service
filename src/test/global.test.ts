/*!--------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import { CST, Parser } from 'yaml';
import { CollectionItem, VisitPath } from 'yaml/dist/parse/cst';

before('Global setup', function () {
    console.log('Global setup');
    chai.use(chaiAsPromised);
    chai.should();
});

const document = `version: 3.4
services:
  # Blep
  foo:
    image: bar
    ports:
      - 1
      - 2
    entrypoint: ['foo', 'bar', 'baz']
    boop:
      - boo:
          boo:baz
          new:naz
      - boo
          boo:two
          new:nah`;

describe('Parser test', () => {
    it('should even', async () => {
        const tokens = new Parser().parse(document);
        const [cstDocument] = tokens;
        //const composedTokens = new Composer().compose([cstDocument]);
        //const [parsedDocument] = composedTokens;

        // CST.visit(cstDocument as CST.Document, (item, path) => {
        //     console.log(CST.stringify(item));
        //     console.log(item);
        // });

        const { item, path } = itemAtOffset(cstDocument as CST.Document, 112);

        for (let i = path.length; i > 0; i--) {
            const step = CST.visit.itemAtPath(cstDocument as CST.Document, path.slice(0, i));

            console.log(step);
        }

        console.log(item);

        // console.log(determinePath(parsedDocument, 43).join('/'));
    });
});

function itemAtOffset(doc: CST.Document, offset: number): { item: CollectionItem | undefined, path: VisitPath } {
    let currentItem: CollectionItem | undefined;
    let currentPath: VisitPath = [];

    CST.visit(doc, (item, path) => {
        const itemStart = item.start?.[0]?.offset ?? item.key?.offset ?? item.sep?.[0]?.offset ?? item.value?.offset ?? -1;

        if (itemStart > offset) {
            return CST.visit.BREAK;
        }

        currentItem = item;
        currentPath = path;
        return;
    });

    return {
        item: currentItem,
        path: currentPath,
    };
}

// function determinePath(document: Document.Parsed, offset: number): string[] {
//     const result: string[] = [];
//     determinePathAtOffset(document.contents, offset, result);
//     return result;
// }

// function determinePathAtOffset(node: ParsedNode | null | undefined | Pair<ParsedNode, ParsedNode | null | undefined>, offset: number, path: string[]): void {
//     if (isPair(node) && (offset < node.key.range[0] || offset > (node.value?.range[2] ?? node.key.range[2]))) {
//         return;
//     } else if (!isPair(node) && (!node || offset < node.range[0] || offset > node.range[1])) {
//         return;
//     }

//     if (isMap(node)) {
//         for (const item of node.items) {
//             determinePathAtOffset(item, offset, path);
//         }
//     } else if (isSeq(node)) {
//         for (const item of node.items) {
//             determinePathAtOffset(item, offset, path);
//         }
//     } else if (isPair(node)) {
//         //path.push(node.key.source);
//     } else if (isScalar(node)) {
//         // if (isKey) {
//         //     path.push(node.source);
//         // } else {
//         path.push('<value>');
//         // }
//     }
// }

// interface RangedPair<K extends ParsedNode = ParsedNode, V extends ParsedNode | null = ParsedNode | null> extends Pair<K, V> {
//     range: Range;
// }
