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
    public constructor(private readonly locationRequirements: CompletionLocationRequirements, ...items: ExtendedCompletionItem[]) {
        super(...items);
    }

    public async getActiveCompletionItems(params: CompletionParams & ExtendedPositionParams): Promise<CompletionItem[] | undefined> {
        if (this.locationRequirements.logicalPaths !== undefined && !this.locationRequirements.logicalPaths.some(p => p.test(params.path ?? ''))) {
            return undefined;
        }

        if (this.locationRequirements.indentationDepth !== undefined && this.locationRequirements.indentationDepth !== (await params.document.indentationDepthAt(params))) {
            return undefined;
        }

        const line = params.document.lineAt(params.position);
        return this.filter(eci => !eci.matcher || eci.matcher.test(line));
    }
}

interface CompletionLocationRequirements {
    logicalPaths?: RegExp[];
    indentationDepth?: number;
}
