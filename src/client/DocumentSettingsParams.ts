/*!--------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { TextDocumentIdentifier } from "vscode-languageserver-types";

export interface DocumentSettingsParams {
    textDocument: TextDocumentIdentifier;
}
