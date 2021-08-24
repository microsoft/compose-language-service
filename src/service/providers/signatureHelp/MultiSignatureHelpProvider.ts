/*!--------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CancellationToken, SignatureHelp, SignatureHelpParams } from 'vscode-languageserver';
import { ExtendedParams } from '../../ExtendedParams';

/**
 * Signatures are one of the more involved features so we will split up the code, with this multi-provider calling each of them
 * Most will no-op but the first to return a result will "win"
 * Importantly, if any fail before a result is found, we will throw an error--all other providers will be ignored
 */
export class MultiSignatureHelpProvider {
    public static async onSignatureHelp(params: SignatureHelpParams & ExtendedParams, token: CancellationToken): Promise<SignatureHelp | undefined> {
        return undefined;
    }
}
