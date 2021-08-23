/*!--------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CancellationToken, DocumentFormattingParams, TextEdit } from 'vscode-languageserver';
import { ExtendedParams } from '../ExtendedParams';

export class DocumentFormattingProvider {
    public static async onDocumentFormatting(params: DocumentFormattingParams & ExtendedParams, token: CancellationToken): Promise<TextEdit[] | undefined> {
        return undefined;
    }
}
