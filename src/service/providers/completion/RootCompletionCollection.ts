/*!--------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { InsertTextFormat } from 'vscode-languageserver';
import { CompletionCollection } from './CompletionCollection';

const PositionAtRootRegex = /^\/$/i; // e.g. `/`

export const RootCompletionCollection = new CompletionCollection(
    [PositionAtRootRegex],
    ...[
        {
            label: 'services:',
            insertText: 'services:\n',
        },
        {
            label: 'version:',
            insertText: 'version: \'${1:version}\'$0',
            insertTextFormat: InsertTextFormat.Snippet,
        },
        {
            label: 'volumes:',
            insertText: 'volumes:\n',
        },
        {
            label: 'networks:',
            insertText: 'networks:\n',
        },
    ]
);
