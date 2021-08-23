/*!--------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CancellationToken, CompletionList, CompletionParams } from 'vscode-languageserver';
import { ExtendedParams } from '../../ExtendedParams';

/**
 * Completions are by far the most involved thing so we split into many providers for code cleanliness' sake, and aggregate their individual results
 * Importantly, if any fail, we will throw an error--all other results will be ignored
 */
export class AggregateCompletionProvider {
    public static async onCompletion(params: CompletionParams & ExtendedParams, token: CancellationToken): Promise<CompletionList | undefined> {
        // const extendedPosition = ExtendedPosition.build(params.document, params.position);
        return undefined;
    }
}
