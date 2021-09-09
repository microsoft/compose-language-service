/*!--------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CancellationToken, CompletionItem, CompletionParams, InsertTextMode } from 'vscode-languageserver';
import { ExtendedPositionParams } from '../../ExtendedParams';
import { SubproviderBase } from '../MultiProviderBase';
import { CompletionCollection } from './CompletionCollection';

const ServiceCompletions = new CompletionCollection(...[
    {
        label: 'build:',
        insertionText: 'build: ${1:path}$0',
        detail: 'Short form',
        documentation: 'build: <path>',
        filterText: 'build',
    },
    {
        label: 'build:',
        insertionText: 'build:\n  context: ${1:contextPath}\n  dockerfile: ${2:Dockerfile}',
        insertTextMode: InsertTextMode.adjustIndentation,
        detail: 'Long form',
        documentation: 'build:\n  context: <contextPath>\n  dockerfile: <Dockerfile>',
    },
    {
        label: 'image:',
        insertionText: 'image: ${1:imageName}$0',
    },
]);

export class ServiceCompletionProvider implements SubproviderBase<CompletionParams & ExtendedPositionParams, CompletionItem[] | undefined, never> {
    public on(params: CompletionParams & ExtendedPositionParams, token: CancellationToken): CompletionItem[] | undefined {
        if (!/^\/services\/[^/]*$/i.test(params.extendedPosition.value.logicalPath)) {
            return undefined;
        }

        return ServiceCompletions.getActiveCompletionItems(params);
    }
}
