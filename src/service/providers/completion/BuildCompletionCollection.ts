/*!--------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { InsertTextFormat } from 'vscode-languageserver';
import { CompletionCollection } from './CompletionCollection';

export const BuildCompletionCollection = new CompletionCollection(
    'build',
    { logicalPaths: [/^\/services\/[.\w-]+\/build$/i], indentationDepth: 3 },
    ...[
        {
            label: 'context:',
            insertText: 'context: ${1:buildContext}$0',
            insertTextFormat: InsertTextFormat.Snippet,
        },
        {
            label: 'dockerfile:',
            insertText: 'dockerfile: ${1:dockerfile}$0',
            insertTextFormat: InsertTextFormat.Snippet,
        },
    ]
);
