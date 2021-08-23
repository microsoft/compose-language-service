/*!--------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
    // CancellationToken,
    Connection,
    Diagnostic,
    DiagnosticSeverity,
    Disposable,
    ErrorCodes,
    Event,
    InitializeParams,
    ResponseError,
    ServerCapabilities,
    ServerRequestHandler,
    TextDocumentChangeEvent,
    TextDocumentIdentifier,
    TextDocuments,
    TextDocumentSyncKind,
}
    from 'vscode-languageserver';
import { ComposeDocument } from './ComposeDocument';
import { ImageLinkProvider } from './providers/ImageLinkProvider';
import { KeyHoverProvider } from './providers/KeyHoverProvider';
import { debounce } from './utils/debounce';
import { yamlRangeToLspRange } from './utils/yamlRangeToLspRange';

export class ComposeLanguageService implements Disposable {
    private readonly documentManager: TextDocuments<ComposeDocument> = new TextDocuments(ComposeDocument.DocumentManagerConfig);
    private readonly subscriptions: Disposable[] = [];

    public constructor(private readonly connection: Connection, private readonly clientParams: InitializeParams) {
        // Hook up the document listener, which creates a Disposable which will be added to this.subscriptions
        this.createDocumentManagerHandler(this.documentManager.onDidChangeContent, this.onDidChangeContent);

        // Hook up all the LSP listeners, which do not create Disposables
        // this.createLspHandler(this.connection.onCompletion, this.onCompletion);
        this.createLspHandler(this.connection.onHover, KeyHoverProvider.onHover);
        // this.createLspHandler(this.connection.onSignatureHelp, this.onSignatureHelp);
        this.createLspHandler(this.connection.onDocumentLinks, ImageLinkProvider.onDocumentLinks);
        // this.createLspHandler(this.connection.onDocumentFormatting, DocumentFormattingProvider.onDocumentFormatting);
        // this.createLspHandler(this.connection.languages.semanticTokens.on, this.onSemanticTokens);

        // Start the document listener
        this.documentManager.listen(this.connection);
    }

    public dispose(): void {
        for (const subscription of this.subscriptions) {
            subscription.dispose();
        }
    }

    public get capabilities(): ServerCapabilities {
        return {
            textDocumentSync: {
                openClose: false,
                change: TextDocumentSyncKind.Incremental,
                willSave: false,
                willSaveWaitUntil: false,
                save: false,
            },
            // completionProvider: {
            //     triggerCharacters: ['-', ':'],
            //     resolveProvider: false,
            // },
            hoverProvider: true,
            // signatureHelpProvider: {
            //     triggerCharacters: ['-', ':'],
            // },
            documentLinkProvider: {
                resolveProvider: false,
            },
            // documentFormattingProvider: true,
            // semanticTokensProvider: {
            //     full: {
            //         delta: false,
            //     },
            //     legend: {
            //         tokenTypes: [
            //             SemanticTokenTypes.variable,
            //         ],
            //         tokenModifiers: [],
            //     },
            // },
            workspace: {
                workspaceFolders: {
                    supported: true,
                },
            },
        };
    }

    public async onDidChangeContent(changed: TextDocumentChangeEvent<ComposeDocument>): Promise<void> {
        this.sendDiagnostics(changed.document);
    }

    public sendDiagnostics(doc: ComposeDocument): void {
        if (!this.clientParams.capabilities.textDocument?.publishDiagnostics) {
            return;
        }

        // Diagnostics will be sent half a second after the changes stop
        debounce(500, { uri: doc.textDocument.uri, callId: 'diagnostics' }, async () => {
            const diagnostics: Diagnostic[] = [];

            for (const error of [...doc.yamlDocument.errors, ...doc.yamlDocument.warnings]) {
                diagnostics.push(
                    Diagnostic.create(
                        yamlRangeToLspRange(doc.textDocument, error.pos),
                        error.message,
                        error.name === 'YAMLWarning' ? DiagnosticSeverity.Warning : DiagnosticSeverity.Error,
                        error.code
                    )
                );
            }

            this.connection.sendDiagnostics({
                uri: doc.textDocument.uri,
                diagnostics: diagnostics,
            });
        }, this);
    }

    private createLspHandler<P extends { textDocument: TextDocumentIdentifier }, R, PR, E>(
        event: (handler: ServerRequestHandler<P, R, PR, E>) => void,
        handler: ServerRequestHandler<P & { doc: ComposeDocument }, R, PR, E>
    ): void {
        event(async (params, token, workDoneProgress, resultProgress) => {
            try {
                const doc = this.documentManager.get(params.textDocument.uri);
                if (!doc) {
                    throw new ResponseError(ErrorCodes.ParseError, 'Document not found in cache.');
                }

                return await handler.call(this, { ...params, doc }, token, workDoneProgress, resultProgress);
            } catch (error) {
                if (error instanceof ResponseError) {
                    return error;
                } else if (error instanceof Error) {
                    return new ResponseError(ErrorCodes.UnknownErrorCode, error.message, error);
                }

                return new ResponseError(ErrorCodes.InternalError, error.toString());
            }
        });
    }

    private createDocumentManagerHandler(
        event: Event<TextDocumentChangeEvent<ComposeDocument>>,
        handler: (params: TextDocumentChangeEvent<ComposeDocument>) => Promise<void>
    ): void {
        event(async (params: TextDocumentChangeEvent<ComposeDocument>) => {
            try {
                return await handler.call(this, params);
            } catch (error) {
                if (error instanceof ResponseError) {
                    return error;
                } else if (error instanceof Error) {
                    return new ResponseError(ErrorCodes.UnknownErrorCode, error.message, error);
                }

                return new ResponseError(ErrorCodes.InternalError, error.toString());
            }
        }, this, this.subscriptions);
    }
}
