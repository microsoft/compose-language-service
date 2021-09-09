/*!--------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CancellationToken, Hover, HoverParams, MarkupContent, MarkupKind } from 'vscode-languageserver';
import { CST } from 'yaml';
import { ExtendedParams } from '../ExtendedParams';
import { ExtendedPosition } from '../ExtendedPosition';
import { yamlRangeToLspRange } from '../utils/yamlRangeToLspRange';
import { ProviderBase } from './ProviderBase';

export class KeyHoverProvider extends ProviderBase<HoverParams & ExtendedParams, Hover | undefined, never, never> {
    public on(params: HoverParams & ExtendedParams, token: CancellationToken): Hover | undefined {
        if (!params.clientCapabilities.textDocument?.hover) {
            return undefined;
        }

        const contentFormat = params.clientCapabilities.textDocument.hover.contentFormat;
        const preferMarkdown = contentFormat?.length ? contentFormat?.[0] === MarkupKind.Markdown : false;

        const extendedPosition = ExtendedPosition.build(params.document, params.position);

        if (extendedPosition.itemType === 'key' && CST.isScalar(extendedPosition.parent.key)) {
            const keyInfo = ComposeKeyInfo.find((k) => k.pathRegex.test(extendedPosition.logicalPath));

            if (keyInfo) {
                return {
                    contents: (preferMarkdown && keyInfo.markdownContents) || keyInfo.plaintextContents,
                    range: yamlRangeToLspRange(params.document.textDocument, [extendedPosition.parent.key.offset, extendedPosition.parent.key.offset + extendedPosition.parent.key.source.length]),
                };
            }
        }

        return undefined;
    }
}

interface ComposeKeyInformation {
    pathRegex: RegExp,
    plaintextContents: MarkupContent,
    markdownContents?: MarkupContent,
}

const ComposeKeyInfo: ComposeKeyInformation[] = [
    {
        pathRegex: /^\/services$/i,
        plaintextContents: {
            kind: 'plaintext',
            value: 'The services in your compose project',
        },
        markdownContents: {
            kind: 'markdown',
            value: 'The services in your compose project',
        },
    },
];
