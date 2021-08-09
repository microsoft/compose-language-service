/*!--------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { expect } from 'chai';
import { DocumentLink, DocumentLinkRequest, Position, Range } from 'vscode-languageserver';
import { TestConnection } from './utils/TestConnection';

// TODO: remove this
/* eslint-disable @typescript-eslint/no-empty-function */

describe('ImageLinkProvider', () => {
    let testConnection: TestConnection;

    before('Populate the language server with a compose document', async () => {
        testConnection = new TestConnection();
    });

    describe('Common scenarios', async () => {
        let result: DocumentLink[];

        before(async () => {
            const sampleFileUri = await testConnection.preloadSampleFile('imageLinks/common.yml');
            result = await testConnection.client.sendRequest(DocumentLinkRequest.type, { textDocument: { uri: sampleFileUri } }) as DocumentLink[];

            expect(result).to.be.ok;
            result.should.not.be.empty;
        });

        it('Should provide links for general Docker Hub images', () => {
            result.should.deep.include.members(
                [
                    {
                        range: Range.create(
                            Position.create(4, 11),
                            Position.create(4, 17)
                        ),
                        target: 'https://hub.docker.com/_/alpine'
                    },
                    {
                        range: Range.create(
                            Position.create(7, 11),
                            Position.create(7, 16)
                        ),
                        target: 'https://hub.docker.com/_/mysql'
                    },
                ]
            );
        });

        it('Should provide links for namespaced Docker Hub images', () => {
            result.should.deep.include.members(
                [
                    {
                        range: Range.create(
                            Position.create(10, 11),
                            Position.create(10, 25)
                        ),
                        target: 'https://hub.docker.com/r/library/alpine'
                    },
                    {
                        range: Range.create(
                            Position.create(13, 11),
                            Position.create(13, 24)
                        ),
                        target: 'https://hub.docker.com/r/library/mysql'
                    }
                ]
            );
        });

        it('Should provide links for MCR images', () => {
            // Single-part namespace: mcr.microsoft.com/dotnet/sdk[:5.0]
            result.should.deep.include.members(
                [
                    {
                        range: Range.create(
                            Position.create(16, 11),
                            Position.create(16, 39)
                        ),
                        target: 'https://hub.docker.com/_/microsoft-dotnet-sdk'
                    },
                    {
                        range: Range.create(
                            Position.create(19, 11),
                            Position.create(19, 39)
                        ),
                        target: 'https://hub.docker.com/_/microsoft-dotnet-sdk'
                    }
                ]
            );

            // Multi-part namespace: mcr.microsoft.com/dotnet/core/sdk[:5.0]
            result.should.deep.include.members(
                [
                    {
                        range: Range.create(
                            Position.create(22, 11),
                            Position.create(22, 44)
                        ),
                        target: 'https://hub.docker.com/_/microsoft-dotnet-core-sdk'
                    },
                    {
                        range: Range.create(
                            Position.create(25, 11),
                            Position.create(25, 44)
                        ),
                        target: 'https://hub.docker.com/_/microsoft-dotnet-core-sdk'
                    }
                ]
            );
        });

        it('Should NOT provide links for services with `build` section', () => {
            result.some(r => r.target && r.target?.indexOf('buildcanary') >= 0).should.be.false;
        });

        it('Should NOT provide links for other hosts', () => {
            result.some(r => r.target && r.target?.indexOf('hostcanary') >= 0).should.be.false;
            result.some(r => r.target && r.target?.indexOf('anotherhost') >= 0).should.be.false;
        });

        it('Should NOT provide links for multi-namespaced images', () => {
            result.some(r => r.target && r.target?.indexOf('multinscanary') >= 0).should.be.false;
        });

        it('Should NOT provide links for services without image tag', () => {

        });
    });

    describe('Error scenarios', async () => {
        let result: DocumentLink[];

        before(async () => {
            const sampleFileUri = await testConnection.preloadSampleFile('imageLinks/error.yml');
            result = await testConnection.client.sendRequest(DocumentLinkRequest.type, { textDocument: { uri: sampleFileUri } }) as DocumentLink[];

            expect(result).to.be.ok;
            result.should.not.be.empty;
        });

        it('Should return an error for nonexistent files', async () => {

        });

        it('Should NOT return links if `services` isn\'t a map', async () => {

        });

        it('Should NOT return links if the service isn\'t a map', async () => {

        });

        it('Should NOT return links if the image isn\'t a scalar', async () => {

        });

        it('Should NOT return links if the image isn\'t a string scalar', async () => {

        });
    });

    after('Cleanup', () => {
        testConnection.dispose();
    });
});

// TODO: remove this
/* eslint-enable @typescript-eslint/no-empty-function */
