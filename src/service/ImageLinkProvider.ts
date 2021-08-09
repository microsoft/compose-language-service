/*!--------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CancellationToken, DocumentLink, DocumentLinkParams } from 'vscode-languageserver';
import { isMap, isScalar } from 'yaml';
import { ProviderParams } from './ProviderParams';
import { cstRangeToLspRange } from './utils/cstRangeToLspRange';

const dockerHubImageRegex = /^(?<image>[\w.-]+)(?<tag>:[\w.-]+)?$/i;
const dockerHubNamespacedImageRegex = /^(?<namespace>[a-z0-9]+)\/(?<image>[\w.-]+)(?<tag>:[\w.-]+)?$/i;
const mcrImageRegex = /^mcr.microsoft.com\/(?<namespace>[a-z0-9]+\/)+(?<image>[\w.-]+)(?<tag>:[\w.-]+)?$/i;

export class ImageLinkProvider {
    public static async onDocumentLinks(params: DocumentLinkParams & ProviderParams, token: CancellationToken): Promise<DocumentLink[] | undefined> {
        const results: DocumentLink[] = [];
        const serviceMap = params.parsedDocument.getIn(['services']);
        if (isMap(serviceMap)) {
            for (const service of serviceMap.items) {
                if (isMap(service.value)) {
                    const image = service.value.getIn(['image'], true);
                    const hasBuild = service.value.has('build');
                    if (!hasBuild && isScalar(image) && typeof image.value === 'string') {
                        const link = ImageLinkProvider.getLinkForImage(image.value);

                        if (link && image.range) {
                            results.push(DocumentLink.create(cstRangeToLspRange(params.textDocument, [image.range[0] + link.start, image.range[0] + link.start + link.length]), link.uri));
                        }
                    }
                }
            }
        }

        return results;
    }

    private static getLinkForImage(image: string): { uri: string, start: number, length: number } | undefined {
        let match: RegExpExecArray | null;
        let namespace: string | undefined;
        let imageName: string | undefined;
        if ((match = dockerHubImageRegex.exec(image)) &&
            (imageName = match.groups?.['image'])) {
            return {
                uri: `https://hub.docker.com/_/${image}`,
                start: 0,
                length: image.length
            };
        } else if ((match = dockerHubNamespacedImageRegex.exec(image)) &&
            (namespace = match.groups?.['namespace']) &&
            (imageName = match.groups?.['image'])) {
            return {
                uri: `https://hub.docker.com/r/${namespace}/${imageName}`,
                start: 0,
                length: namespace.length + imageName.length
            };
        } else if ((match = mcrImageRegex.exec(image)) &&
            (namespace = match.groups?.['namespace']) &&
            (imageName = match.groups?.['image'])) {
            return {
                uri: `https://hub.docker.com/_/microsoft-${namespace.replace('/', '-')}/${imageName}`,
                start: 0,
                length: 18 + namespace.length + imageName.length // 18 is the length of 'mcr.microsoft.com/'
            };
        }
        return undefined;
    }
}
