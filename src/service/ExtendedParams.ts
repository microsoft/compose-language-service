/*!--------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ClientCapabilities, Connection, Position } from 'vscode-languageserver';
import { DocumentSettingsClientCapabilities } from '../client/DocumentSettings';
import { ComposeDocument } from './ComposeDocument';
import { ExtendedPosition } from './ExtendedPosition';
import { Lazy } from './utils/Lazy';

export interface ExtendedParams {
    document: ComposeDocument;
    clientCapabilities: ClientCapabilities & { experimental?: { documentSettings?: DocumentSettingsClientCapabilities } };
    connection: Connection;
}

export interface ExtendedPositionParams extends ExtendedParams {
    position: Position;
    extendedPosition: Lazy<ExtendedPosition>;
    path?: string;
}
