/*!--------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CompletionItem, CompletionParams } from 'vscode-languageserver';
import { ExtendedPositionParams } from '../../ExtendedParams';

interface ExtendedCompletionItem extends CompletionItem {
    /**
     * The matching expression
     */
    matcher?: RegExp;

    // TODO: in the long run, we should use `InsertReplaceEdit` to avoid client-side interpretation and make a more client-agnostic server
    // TODO: However, using `insertText` instead of `textEdit`, the behavior for 24x7 completions is closer in-line to what we want at least in VSCode
}

export class CompletionCollection extends Array<ExtendedCompletionItem> {
    public constructor(private readonly validPositions: RegExp[], ...items: ExtendedCompletionItem[]) {
        super(...items);
    }

    public getActiveCompletionItems(params: CompletionParams & ExtendedPositionParams): CompletionItem[] | undefined {
        if (!this.validPositions.some(p => p.test(params.extendedPosition.value.logicalPath))) {
            return undefined;
        }

        const line = params.document.lineAt(params.position);
        return this.filter(eci => !eci.matcher || eci.matcher.test(line));
    }
}
