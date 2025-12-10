/*!--------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import type { ClientCapabilities, DocumentSelector, FeatureState, InitializeParams, ServerCapabilities, StaticFeature } from 'vscode-languageclient';
import type { LanguageClient } from 'vscode-languageclient/node';
import type { DocumentSettings, DocumentSettingsClientCapabilities, DocumentSettingsNotificationParams, DocumentSettingsParams } from '../../../dist/esm/client/DocumentSettings'; // Dev-time-only imports, with `require` below for the real imports, to avoid desync issues or needing to actually install the langserver package

export class DocumentSettingsClientFeature implements StaticFeature, vscode.Disposable {
    private disposables: vscode.Disposable[] = [];

    public constructor(private readonly client: LanguageClient) { }
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
        const docSettingsClientCapabilities: DocumentSettingsClientCapabilities = {
            notify: true,
            request: true,
        };

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        capabilities.experimental = {
            ...capabilities.experimental,
            documentSettings: docSettingsClientCapabilities,
        };
    }

    public initialize(): void {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-require-imports
        const documentSettings: typeof import('../../../dist/esm/client/DocumentSettings') = require('../../../../dist/cjs/client/DocumentSettings');


        this.disposables.push(
            this.client.onRequest(
                documentSettings.DocumentSettingsRequest.method,
                (params: DocumentSettingsParams): DocumentSettings | undefined => {
                    const textEditor = vscode.window.visibleTextEditors.find(e => e.document.uri.toString() === params.textDocument.uri);

                    if (!textEditor) {
                        return undefined;
                    }

                    return {
                        eol: textEditor.document.eol,
                        tabSize: Number(textEditor.options.tabSize),
                    };
                }
            )
        );

        this.disposables.push(
            vscode.window.onDidChangeTextEditorOptions(
                (e: vscode.TextEditorOptionsChangeEvent) => {
                    const params: DocumentSettingsNotificationParams = {
                        textDocument: { uri: e.textEditor.document.uri.toString() },
                        eol: e.textEditor.document.eol,
                        tabSize: Number(e.options.tabSize),
                    };

                    void this.client.sendNotification(documentSettings.DocumentSettingsNotification.method, params);
                }
            )
        );
    }

    public dispose(): void {
        this.disposables.forEach(d => void d.dispose());
    }
}
