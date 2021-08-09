/*!--------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { expect } from 'chai';
import { DocumentLink, DocumentLinkParams, DocumentLinkRequest } from 'vscode-languageserver';
import { DocumentUri } from 'vscode-languageserver-textdocument';
import { TestConnection } from './utils/TestConnection';

describe('(Unit) `image:` tag', () => {
    const testConnection = new TestConnection();
    let sampleFileUri: DocumentUri;

    before('Populate the language server with a compose document', async () => {
        sampleFileUri = await testConnection.preloadSampleFile('imageLinks/docker-compose.yml');
    });

    it('Should provide links for general Docker Hub images', async () => {
        const params: DocumentLinkParams = {
            textDocument: { uri: sampleFileUri }
        };

        const result = await testConnection.client.sendRequest(DocumentLinkRequest.type, params) as DocumentLink[];
        expect(result).to.be.ok;
        result.should.not.be.empty;
    });

    it('Should provide links for namespaced Docker Hub images', async () => {
        const params: DocumentLinkParams = {
            textDocument: { uri: sampleFileUri }
        };

        const result = await testConnection.client.sendRequest(DocumentLinkRequest.type, params) as DocumentLink[];
        expect(result).to.be.ok;
    });

    it('Should provide links for MCR images', async () => {
        const params: DocumentLinkParams = {
            textDocument: { uri: sampleFileUri }
        };

        const result = await testConnection.client.sendRequest(DocumentLinkRequest.type, params) as DocumentLink[];
        expect(result).to.be.ok;
    });

    after('Cleanup', () => {
        testConnection.dispose();
    });
});
