/*!--------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CancellationToken, SignatureHelp, SignatureHelpParams } from 'vscode-languageserver';
import { ExtendedParams } from '../ExtendedParams';

export class SignatureHelpProvider {
    public static async onSignatureHelp(params: SignatureHelpParams & ExtendedParams, token: CancellationToken): Promise<SignatureHelp | undefined> {
        return undefined;
    }
}
