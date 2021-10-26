/*!--------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export function logNormal(values: number[]): { mu: number, sigma: number, median: number } {
    if (!values?.length) {
        return { mu: 0, sigma: 0, median: 0 };
    }

    const n = values.length;
    const lnValues = values.map(a => ln(a));
    const sqLnValues = lnValues.map(a => sq(a));

    const mu = sum(lnValues) / n;

    let sigma: number;
    if (n > 1) {
        sigma = Math.sqrt(
            (n * sum(sqLnValues) - sq(sum(lnValues))) /
            (n * (n - 1))
        );
    } else {
        sigma = 0;
    }

    return {
        mu,
        sigma,
        median: Math.pow(Math.E, mu),
    };
}

function sum(values: number[]): number {
    return values.reduce((a, b) => a + b, 0);
}

function sq(value: number): number {
    return Math.pow(value, 2);
}

function ln(value: number): number {
    return Math.log(value);
}
