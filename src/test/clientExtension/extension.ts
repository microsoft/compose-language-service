/*!--------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { LanguageClient, TransportKind } from 'vscode-languageclient/node';

export function activate(context: vscode.ExtensionContext): void {
    const serverModule = context.asAbsolutePath('../../../lib/server.js');

    const serverOptions = {
        run: {
            module: serverModule,
            transport: TransportKind.ipc,
        },
        debug: {
            module: serverModule,
            transport: TransportKind.ipc,
            options: { execArgv: ['--nolazy', '--inspect=6009'] },
        },
    };

    const clientOptions = {
        documentSelector: [
            {
                language: 'dockercompose'
            },
        ],
    };

    const client = new LanguageClient('compose-language-server', serverOptions, clientOptions, true);

    context.subscriptions.push(client.start());
}

export function deactivate(): void {
    // Do nothing
}
