/*!--------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { TestConnection } from '../TestConnection';

// TODO
describe('DocumentFormattingProvider', () => {
    let testConnection: TestConnection;
    before('Populate the language server with a compose document', async () => {
        testConnection = new TestConnection();
    });

    xit('Should fix up bad spacing without semantically changing anything');

    xit('Should not try formatting unless the document is syntactically correct');

    after('Cleanup', () => {
        testConnection.dispose();
    });
});
