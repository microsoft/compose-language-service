/*!--------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { AlternateYamlLanguageServiceClientCapabilities } from '../../../dist/esm/client/AlternateYamlLanguageServiceClientCapabilities';
import * as vscode from 'vscode';
import type { ClientCapabilities, DocumentSelector, FeatureState, InitializeParams, ServerCapabilities, StaticFeature } from 'vscode-languageclient';

/**
 * This class will note the features covered by an alternate YAML language service,
 * that the compose language service can disable
 */
export class AlternateYamlLanguageServiceClientFeature implements StaticFeature, vscode.Disposable {
    fillInitializeParams?: ((params: InitializeParams) => void) | undefined;
    preInitialize?: ((capabilities: ServerCapabilities, documentSelector: DocumentSelector | undefined) => void) | undefined;
    clear(): void {
        throw new Error('Method not implemented.');
    }
    public getState(): FeatureState {
        return {
            kind: 'static'
        };
    }

    public fillClientCapabilities(capabilities: ClientCapabilities): void {
        // If the RedHat YAML extension is present, we can disable many of the compose language service features
        if (vscode.extensions.getExtension('redhat.vscode-yaml')) {
            const altYamlClientCapabilities: AlternateYamlLanguageServiceClientCapabilities = {
                syntaxValidation: true,
                schemaValidation: true,
                basicCompletions: true,
                advancedCompletions: false, // YAML extension does not have advanced completions for compose docs
                serviceStartupCodeLens: false, // YAML extension does not have service startup for compose docs
                hover: false, // YAML extension provides hover, but the compose spec lacks descriptions -- https://github.com/compose-spec/compose-spec/issues/138
                imageLinks: false, // YAML extension does not have image hyperlinks for compose docs
                formatting: true,
            };

            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            capabilities.experimental = {
                ...capabilities.experimental,
                alternateYamlLanguageService: altYamlClientCapabilities,
            };
        }
    }

    public initialize(): void {
        // Noop
    }

    public dispose(): void {
        // Noop
    }
}
