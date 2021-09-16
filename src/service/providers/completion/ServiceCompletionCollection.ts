/*!--------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { InsertTextFormat, InsertTextMode } from 'vscode-languageserver';
import { CompletionCollection } from './CompletionCollection';

/**
 * The position given when the cursor is inbetween the service key and first properties, i.e. at the | below:
services:
  foo:
    |
    a: b
 */
const PositionAfterServiceNamePathRegex = /^\/services\/<sep>$/i; // e.g. /services/<sep>

/**
 * The position given when the cursor is inbetween properties in a service, i.e. at the | below:
services:
  foo:
    a: b
    |
 */
const PositionInServiceConfigPathRegex = /^\/services\/[\w -]+\/<start>$/i; // e.g. /services/foo/<start>

export const ServiceCompletionCollection = new CompletionCollection(
    [PositionAfterServiceNamePathRegex, PositionInServiceConfigPathRegex],
    ...[
        {
            label: 'build:',
            insertText: 'build: ${1:path}$0',
            insertTextFormat: InsertTextFormat.Snippet,
            detail: 'Short form',
            documentation: 'build: <path>',
        },
        {
            label: 'build:',
            insertText: 'build:\n  context: ${1:contextPath}\n  dockerfile: ${2:Dockerfile}',
            insertTextFormat: InsertTextFormat.Snippet,
            insertTextMode: InsertTextMode.adjustIndentation,
            detail: 'Long form',
            documentation: 'build:\n  context: <contextPath>\n  dockerfile: <Dockerfile>',
        },
        {
            label: 'image:',
            insertText: 'image: ${1:imageName}$0',
            insertTextFormat: InsertTextFormat.Snippet,
        },
    ]
);
