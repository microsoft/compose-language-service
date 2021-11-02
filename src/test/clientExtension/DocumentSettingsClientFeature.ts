/*!--------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { ClientCapabilities, StaticFeature } from 'vscode-languageclient';
import { LanguageClient } from 'vscode-languageclient/node';
import { DocumentSettings, DocumentSettingsNotificationParams, DocumentSettingsParams } from '../../../lib/client/DocumentSettings'; // Dev-time-only imports, with `require` below for the real imports, to avoid desync issues or needing to actually install the langserver package

export class DocumentSettingsClientFeature implements StaticFeature, vscode.Disposable {
    private disposables: vscode.Disposable[] = [];

    public constructor(private readonly client: LanguageClient) { }

    public fillClientCapabilities(capabilities: ClientCapabilities): void {
        const documentSettings = {
            notify: true,
            request: true,
        };

        capabilities.experimental = {
            ...capabilities.experimental,
            documentSettings,
        };
    }

    public initialize(): void {
        this.disposables.push(
            this.client.onRequest(
                require('../../../../lib/client/DocumentSettings').DocumentSettingsRequest.type,
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

                    this.client.sendNotification(require('../../../../lib/client/DocumentSettings').DocumentSettingsNotification.type, params);
                }
            )
        );
    }

    public dispose(): void {
        this.disposables.forEach(d => d.dispose());
    }
}
