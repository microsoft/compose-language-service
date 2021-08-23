/*!--------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CancellationToken, CompletionList, CompletionParams } from 'vscode-languageserver';
import { ExtendedParams } from '../ExtendedParams';

export class CompletionProvider {
    public static async onCompletion(params: CompletionParams & ExtendedParams, token: CancellationToken): Promise<CompletionList | undefined> {
        return undefined;
    }
}
