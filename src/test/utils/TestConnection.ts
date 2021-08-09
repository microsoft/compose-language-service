/*!--------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as fs from 'fs';
import * as path from 'path';
import { PassThrough } from 'stream';
import { Connection, DidOpenTextDocumentNotification, DidOpenTextDocumentParams, Disposable, InitializeParams, TextDocumentItem } from 'vscode-languageserver';
import { DocumentUri } from 'vscode-languageserver-textdocument';
import { createConnection } from 'vscode-languageserver/node';
import { URI } from 'vscode-uri';
import { ComposeLanguageService } from '../../service/ComposeLanguageService';
import { DefaultInitializeParams } from './DefaultInitializeParams';

export class TestConnection implements Disposable {
    public readonly server: Connection;
    public readonly client: Connection;
    public readonly languageService: ComposeLanguageService;

    public constructor(public readonly initParams: InitializeParams = DefaultInitializeParams) {
        const up = new PassThrough();
        const down = new PassThrough();

        this.server = createConnection(up, down);
        this.client = createConnection(down, up);

        this.languageService = new ComposeLanguageService(this.server, initParams);

        this.server.listen();
        this.client.listen();
    }

    public dispose(): void {
        this.languageService?.dispose();
        this.server?.dispose();
        this.client?.dispose();
    }

    public async preloadSampleFile(sampleFileRelativePath: string): Promise<DocumentUri> {
        const sampleFileUri = URI.file(path.join(process.cwd(), 'src', 'test', 'samples', path.normalize(sampleFileRelativePath)));
        const sampleFileContent = fs.readFileSync(sampleFileUri.fsPath, { encoding: 'utf-8' });

        const openParams: DidOpenTextDocumentParams = {
            textDocument: TextDocumentItem.create(sampleFileUri.toString(), 'dockercompose', 1, sampleFileContent),
        };
        this.client.sendNotification(DidOpenTextDocumentNotification.type, openParams);

        return sampleFileUri.toString();
    }
}
