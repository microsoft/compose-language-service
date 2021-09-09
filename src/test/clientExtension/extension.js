/*!--------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

const langClient = require("vscode-languageclient/node");
const vscode = require("vscode");

let client;

exports.activate = function activate(context) {
    const serverModule = context.asAbsolutePath('../../../lib/server.js');

    const serverOptions = {
        run: {
            module: serverModule,
            transport: langClient.TransportKind.ipc,
        },
        debug: {
            module: serverModule,
            transport: langClient.TransportKind.ipc,
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

    client = new langClient.LanguageClient('compose-language-server', serverOptions, clientOptions, true);

    client.registerFeature(DocumentSettingsFeature);

    context.subscriptions.push(client.start());
}

exports.deactivate = function deactivate() { }

let disposable;

const DocumentSettingsFeature = {
    fillClientCapabilities: (clientCapabilities) => {
        clientCapabilities.experimental = {
            documentSettings: {}
        };
    },

    initialize: (serverCapabilities, documentSelector) => {
        disposable = client.onRequest('$/documentSettings', (p) => {
            const editorWindow = vscode.window.visibleTextEditors.find(e => e.document.uri.toString() === p.textDocument.uri);
            return {
                tabSize: editorWindow.options.tabSize,
                lineEndings: '\n',
            };
        });
    },

    dispose: () => {
        disposable.dispose();
    },
};
