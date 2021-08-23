/*!--------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ClientCapabilities, Connection } from 'vscode-languageserver';
import { ComposeDocument } from './ComposeDocument';

export interface ExtendedParams {
    document: ComposeDocument,
    clientCapabilities: ClientCapabilities,
    connection: Connection,
}
