/*!--------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Position, TextDocumentIdentifier } from 'vscode-languageserver';
import { ComposeDocument } from './ComposeDocument';
import { ExtendedPosition } from './ExtendedPosition';
import { Lazy } from './utils/Lazy';

export interface TextDocumentParams {
    textDocument: TextDocumentIdentifier;
}

export interface ExtendedParams extends TextDocumentParams {
    document: ComposeDocument;
}

export interface PositionParams extends TextDocumentParams {
    position: Position;
}

export interface ExtendedPositionParams extends ExtendedParams, PositionParams {
    extendedPosition: Lazy<ExtendedPosition>;
    path?: string;
}
