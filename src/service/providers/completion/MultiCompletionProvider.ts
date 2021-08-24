/*!--------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CancellationToken, CompletionItem, CompletionParams, WorkDoneProgressReporter } from 'vscode-languageserver';
import { ExtendedPositionParams } from '../../ExtendedParams';
import { MultiProviderBase } from '../MultiProviderBase';

/**
 * Completions are one of the more involved features so we will split up the code, with this multi-provider calling each of them
 * Most will no-op but the results will all be aggregated upon return
 * Importantly, if any fail, we will throw an error--all other results will be ignored
 */
export class MultiCompletionProvider extends MultiProviderBase<CompletionParams & ExtendedPositionParams, CompletionItem[], never> {
    public override async on(params: CompletionParams & ExtendedPositionParams, token: CancellationToken, workDoneProgress: WorkDoneProgressReporter): Promise<CompletionItem[] | undefined> {
        if (!this.clientCapabilities.textDocument?.completion) {
            return undefined;
        }

        return super.on(params, token, workDoneProgress);
    }

    protected reduce(subresults: (CompletionItem[] | undefined)[]): CompletionItem[] | undefined {
        const results: CompletionItem[] = [];

        for (const s of subresults) {
            if (s) {
                results.push(...s);
            }
        }

        if (results.length) {
            return results;
        }

        return undefined;
    }
}
