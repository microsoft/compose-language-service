/*!--------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CancellationToken, SignatureHelp, SignatureHelpParams, WorkDoneProgressReporter } from 'vscode-languageserver';
import { ExtendedPositionParams } from '../../ExtendedParams';
import { MultiProviderBase } from '../MultiProviderBase';

/**
 * Signatures are one of the more involved features so we will split up the code, with this multi-provider calling each of them
 * Most will no-op but the first to return a result will "win"
 * Importantly, if any fail before a result is found, we will throw an error--all other providers will be ignored
 */
export class MultiSignatureHelpProvider extends MultiProviderBase<SignatureHelpParams & ExtendedPositionParams, SignatureHelp, never> {
    public override async on(params: SignatureHelpParams & ExtendedPositionParams, token: CancellationToken, workDoneProgress: WorkDoneProgressReporter): Promise<SignatureHelp | undefined> {
        if (!this.clientCapabilities.textDocument?.signatureHelp) {
            return undefined;
        }

        return super.on(params, token, workDoneProgress);
    }

    protected reduce(subresults: (SignatureHelp | undefined)[]): SignatureHelp | undefined {
        for (const s of subresults) {
            if (s) {
                return s;
            }
        }

        return undefined;
    }
}
