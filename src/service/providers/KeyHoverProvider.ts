/*!--------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CancellationToken, Hover, HoverParams } from 'vscode-languageserver';
import { CST } from 'yaml';
import { CachedDocument } from '../CachedDocument';
import { ExtendedPosition } from '../ExtendedPosition';
import { yamlRangeToLspRange } from '../utils/yamlRangeToLspRange';

export class KeyHoverProvider {
    public static async onHover(params: HoverParams & { cachedDocument: CachedDocument }, token: CancellationToken): Promise<Hover | undefined> {
        const extendedPosition = new ExtendedPosition(params.cachedDocument, params.position);

        if (extendedPosition.type === 'key' && CST.isScalar(extendedPosition.item.key)) {
            const key = extendedPosition.item.key;
            const keyName = key.source;

            return {
                contents: {
                    kind: 'markdown',
                    value: 'TODO'
                },
                range: yamlRangeToLspRange(params.cachedDocument.textDocument, [key.offset, key.offset + keyName.length]),
            };
        }

        return undefined;
    }
}
