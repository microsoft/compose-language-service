/*!--------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CancellationToken, Hover, HoverParams, MarkupKind } from 'vscode-languageserver';
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

        if (extendedPosition.itemType === 'key' && CST.isScalar(extendedPosition.item.key)) {
            const keyInfo = ComposeKeyInfo.find((k) => k.pathRegex.test(extendedPosition.logicalPath));

            if (keyInfo) {
                return {
                    contents: {
                        kind: preferMarkdown ? MarkupKind.Markdown : MarkupKind.PlainText, // If Markdown is preferred, even plaintext will be treated as Markdown--it renders better, has line wrapping, etc.
                        value: (preferMarkdown && keyInfo.markdownContents) || keyInfo.plaintextContents,
                    },
                    range: yamlRangeToLspRange(params.document.textDocument, [extendedPosition.item.key.offset, extendedPosition.item.key.offset + extendedPosition.item.key.source.length]),
                };
            }
        }

        return undefined;
    }
}

interface ComposeKeyInformation {
    pathRegex: RegExp,
    plaintextContents: string,
    markdownContents?: string,
}

const ComposeKeyInfo: ComposeKeyInformation[] = [
    {
        pathRegex: /^\/version$/i,
        plaintextContents: 'The version of the Docker Compose document',
    },
    {
        pathRegex: /^\/services$/i,
        plaintextContents: 'The services in your project',
    },
    {
        pathRegex: /^\/services\/[\w-]+\/build$/i,
        plaintextContents: 'The context used for building the image',
    },
    {
        pathRegex: /^\/services\/[\w-]+\/build\/args$/i,
        plaintextContents: 'Arguments used during the image build process',
    },
    {
        pathRegex: /^\/services\/[\w-]+\/build\/context$/i,
        plaintextContents: 'The context used for building the image',
    },
    {
        pathRegex: /^\/services\/[\w-]+\/build\/dockerfile$/i,
        plaintextContents: 'The Dockerfile used for building the image',
    },
    {
        pathRegex: /^\/services\/[\w-]+\/command$/i,
        plaintextContents: 'The command that will be run in the container',
    },
    {
        pathRegex: /^\/services\/[\w-]+\/container_name$/i,
        plaintextContents: 'The name that will be given to the container',
    },
    {
        pathRegex: /^\/services\/[\w-]+\/depends_on$/i,
        plaintextContents: 'Other services that this service depends on, which will be started before this one',
    },
    {
        pathRegex: /^\/services\/[\w-]+\/entrypoint$/i,
        plaintextContents: 'The entrypoint to the application in the container',
    },
    {
        pathRegex: /^\/services\/[\w-]+\/env_file$/i,
        plaintextContents: 'Files containing environment variables that will be included',
    },
    {
        pathRegex: /^\/services\/[\w-]+\/environment$/i,
        plaintextContents: 'Environment variables that will be included',
    },
    {
        pathRegex: /^\/services\/[\w-]+\/expose$/i,
        plaintextContents: 'Ports exposed to the other services but not to the host machine',
    },
    {
        pathRegex: /^\/services\/[\w-]+\/healthcheck$/i,
        plaintextContents: 'A command for checking if the container is healthy',
    },
    {
        pathRegex: /^\/services\/[\w-]+\/image$/i,
        plaintextContents: 'The image that will be pulled for the service. If `build` is specified, the built image will be given this tag.',
    },
    {
        pathRegex: /^\/services\/[\w-]+\/labels$/i,
        plaintextContents: 'Labels that will be given to the container',
    },
    {
        pathRegex: /^\/services\/[\w-]+\/logging$/i,
        plaintextContents: 'Settings for logging for this service',
    },
    {
        pathRegex: /^\/services\/[\w-]+\/networks$/i,
        plaintextContents: 'The service will be included in these networks, allowing it to reach other containers on the same network',
    },
    {
        pathRegex: /^\/services\/[\w-]+\/ports$/i,
        plaintextContents: 'Ports that will be exposed to the host',
    },
    {
        pathRegex: /^\/services\/[\w-]+\/profiles$/i,
        plaintextContents: 'Profiles that this service is a part of. When the profile is started, this service will be started.',
    },
    {
        pathRegex: /^\/services\/[\w-]+\/secrets$/i,
        plaintextContents: 'Secrets the service will have access to',
    },
    {
        pathRegex: /^\/services\/[\w-]+\/user$/i,
        plaintextContents: 'The username under which the app in the container will be started',
    },
    {
        pathRegex: /^\/services\/[\w-]+\/volumes$/i,
        plaintextContents: 'Named volumes and paths on the host mapped to paths in the container',
    },
    {
        pathRegex: /^\/services\/[\w-]+\/working_dir$/i,
        plaintextContents: 'The working directory in which the entrypoint or command will be run',
    },
    {
        pathRegex: /^\/volumes$/i,
        plaintextContents: 'Named volumes that are shared among multiple services',
    },
    {
        pathRegex: /^\/volumes\/[\w-]+\/driver$/i,
        plaintextContents: 'The driver used for this volume',
    },
    {
        pathRegex: /^\/networks$/i,
        plaintextContents: 'Networks that are shared among multiple services',
    },
    {
        pathRegex: /^\/networks\/[\w-]+\/driver$/i,
        plaintextContents: 'The driver used for this network',
    },
    {
        pathRegex: /^\/configs$/i,
        plaintextContents: 'Configurations for services in the project',
    },
    {
        pathRegex: /^\/secrets$/i,
        plaintextContents: 'Secrets that are shared among multiple services',
    },
];
