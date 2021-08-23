/*!--------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Position } from 'vscode-languageserver-textdocument';
import { CachedDocument } from './CachedDocument';
import { CST } from 'yaml';

type ItemType = 'start' | 'key' | 'sep' | 'value';

export class ExtendedPosition {
    private readonly item: CST.CollectionItem;
    private readonly path: CST.VisitPath;
    private readonly offset: number;

    public readonly type: ItemType;
    public readonly logicalPath: string;

    public constructor(private readonly cachedDocument: CachedDocument, private readonly position: Position) {
        this.offset = this.cachedDocument.textDocument.offsetAt(this.position);

        const { item, path } = this.loadItemAndPath();
        if (!item || !path) {
            throw new Error(`Failed to load item at position (${position.line}, ${position.character}).`);
        }

        this.item = item;
        this.path = path;

        this.type = this.loadType();
        this.logicalPath = this.loadLogicalPath();
    }

    private loadItemAndPath(): { item: CST.CollectionItem | undefined, path: CST.VisitPath | undefined } {
        let currentItem: CST.CollectionItem | undefined;
        let currentPath: CST.VisitPath | undefined;

        CST.visit(this.cachedDocument.cst, (item, path) => {
            const itemStart =
                item.start?.[0]?.offset ??
                item.key?.offset ??
                item.sep?.[0]?.offset ??
                item.value?.offset ??
                -1;

            if (itemStart > this.offset) {
                // As soon as we get past the offset, break;
                // The previous item is the `CollectionItem` at the position specified
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

    private loadType(): ItemType {
        for (const start of this.item.start) {
            if (start.offset <= this.offset &&
                start.offset + start.source.length > this.offset) {
                return 'start';
            }
        }

        if (CST.isScalar(this.item.key) &&
            this.item.key.offset <= this.offset &&
            this.item.key.offset + this.item.key.source.length > this.offset) {
            return 'key';
        }

        for (const sep of this.item.sep ?? []) {
            if (sep.offset <= this.offset &&
                sep.offset + sep.source.length > this.offset) {
                return 'sep';
            }
        }

        // If it's not on the start, key, or separator, the only possible position is in the value
        return 'value';
    }

    private loadLogicalPath(): string {
        const resultParts: string[] = [];

        // If it's a key, we want the actual key text as the logical path
        // Otherwise we just put <theType>
        if (this.type === 'key' && CST.isScalar(this.item.key)) {
            resultParts.unshift(this.item.key.source);
        } else {
            resultParts.unshift(`<${this.type}>`);
        }

        // To get the rest of the logical path, we must step backward to the root
        // In properly formatted compose documents it will be keys the rest of the way up
        for (let i = this.path.length - 1; i > 0; i--) {
            const parentPath = this.path.slice(0, i);
            const parent = CST.visit.itemAtPath(this.cachedDocument.cst, parentPath);
            if (CST.isScalar(parent?.key)) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                resultParts.unshift(parent!.key.source);
            }
        }

        return `/${resultParts.join('/')}`;
    }
}
