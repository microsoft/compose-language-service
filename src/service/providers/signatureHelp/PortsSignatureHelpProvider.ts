/*!--------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CancellationToken, ParameterInformation, SignatureHelp, SignatureHelpParams, SignatureInformation } from 'vscode-languageserver';
import { ExtendedPositionParams } from '../../ExtendedParams';
import { SubproviderBase } from '../MultiProviderBase';

export class PortsSignatureHelpProvider implements SubproviderBase<SignatureHelpParams & ExtendedPositionParams, SignatureHelp, never> {
    public on(params: SignatureHelpParams & ExtendedPositionParams, token: CancellationToken): SignatureHelp | undefined {
        if (!/^\/services\/\w+\/ports\/.+$/i.test(params.extendedPosition.logicalPath)) {
            return undefined;
        }

        const result: SignatureHelp = {
            signatures: [],
            activeSignature: null,
            activeParameter: null,
        };

        result.signatures.push(
            SignatureInformation.create('- 5000:5001', undefined,
                ParameterInformation.create('5000'),
                ParameterInformation.create('5001'),
            ),
            SignatureInformation.create('- 5000/tcp:5001/tcp', undefined,
                ParameterInformation.create('5000/tcp'),
                ParameterInformation.create('5001/tcp'),
            ),
        );

        result.activeSignature = 0;
        //result.activeParameter = CST.isScalar(params.extendedPosition.item.value)

        return result;
    }
}
