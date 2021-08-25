/*!--------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CancellationToken, DocumentLink, DocumentLinkParams } from 'vscode-languageserver';
import { isMap, isScalar } from 'yaml';
import { ExtendedParams } from '../ExtendedParams';
import { yamlRangeToLspRange } from '../utils/yamlRangeToLspRange';
import { ProviderBase } from './ProviderBase';

const dockerHubImageRegex = /^(?<imageName>[\w.-]+)(?<tag>:[\w.-]+)?$/i;
const dockerHubNamespacedImageRegex = /^(?<namespace>[a-z0-9]+)\/(?<imageName>[\w.-]+)(?<tag>:[\w.-]+)?$/i;
const mcrImageRegex = /^mcr.microsoft.com\/(?<namespace>([a-z0-9]+\/)+)(?<imageName>[\w.-]+)(?<tag>:[\w.-]+)?$/i;

export class ImageLinkProvider extends ProviderBase {
    public onDocumentLinks(params: DocumentLinkParams & ExtendedParams, token: CancellationToken): DocumentLink[] | undefined {
        if (!this.clientCapabilities.textDocument?.documentLink) {
            return undefined;
        }

        const results: DocumentLink[] = [];

        const serviceMap = params.document.yamlDocument.getIn(['services']);
        if (isMap(serviceMap)) {
            for (const service of serviceMap.items) {
                // Within each loop we'll check for cancellation (though this is expected to be very fast)
                if (token.isCancellationRequested) {
                    return undefined;
                }

                if (isMap(service.value)) {
                    const image = service.value.getIn(['image'], true);
                    const hasBuild = service.value.has('build');
                    if (!hasBuild && isScalar(image) && typeof image.value === 'string') {
                        const link = ImageLinkProvider.getLinkForImage(image.value);

                        if (link && image.range) {
                            results.push(DocumentLink.create(yamlRangeToLspRange(params.document.textDocument, [image.range[0] + link.start, image.range[0] + link.start + link.length]), link.uri));
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
            (imageName = match.groups?.['imageName'])) {
            return {
                uri: `https://hub.docker.com/_/${imageName}`,
                start: 0,
                length: imageName.length
            };
        } else if ((match = dockerHubNamespacedImageRegex.exec(image)) &&
            (namespace = match.groups?.['namespace']) &&
            (imageName = match.groups?.['imageName'])) {
            return {
                uri: `https://hub.docker.com/r/${namespace}/${imageName}`,
                start: 0,
                length: namespace.length + 1 + imageName.length // 1 is the length of the '/' after namespace
            };
        } else if ((match = mcrImageRegex.exec(image)) &&
            (namespace = match.groups?.['namespace']?.replace(/\/$/, '')) &&
            (imageName = match.groups?.['imageName'])) {
            return {
                uri: `https://hub.docker.com/_/microsoft-${namespace.replace('/', '-')}-${imageName}`,
                start: 0,
                length: 18 + namespace.length + 1 + imageName.length // 18 is the length of 'mcr.microsoft.com/', 1 is the length of the '/' after namespace
            };
        }
        return undefined;
    }
}