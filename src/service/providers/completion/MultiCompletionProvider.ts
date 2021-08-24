/*!--------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CancellationToken, CompletionList, CompletionParams } from 'vscode-languageserver';
import { ExtendedParams } from '../../ExtendedParams';

/**
 * Completions are one of the more involved features so we will split up the code, with this multi-provider calling each of them
 * Most will no-op but the results will all be aggregated upon return
 * Importantly, if any fail, we will throw an error--all other results will be ignored
 */
export class MultiCompletionProvider {
    public static async onCompletion(params: CompletionParams & ExtendedParams, token: CancellationToken): Promise<CompletionList | undefined> {
        // const extendedPosition = ExtendedPosition.build(params.document, params.position);
        return undefined;
    }
}
