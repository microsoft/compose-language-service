/*!--------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * Fits a lognormal distribution to the given data and returns the mu, sigma, and median of the data.
 * Lognormal is a decent approximation of performance (i.e. durations of things).
 * @see https://en.wikipedia.org/wiki/Log-normal_distribution
 * @param values The list of values to fit a lognormal distribution to
 * @returns The mu (log of median), sigma (stdev), and median, fit with a lognormal distribution
 */
export function logNormal(values: number[]): { mu: number, sigma: number, median: number } {
    if (!values?.length) {
        return { mu: 0, sigma: 0, median: 0 };
    }

    const n = values.length;
    const lnValues = values.map(a => ln(a));
    const sqLnValues = lnValues.map(a => sq(a));

    // Mu is the mean of the natural logs of the values
    const mu = sum(lnValues) / n;

    // Sigma is calculated from the natural logs and their squares
    // If there's only 1 element sigma must be 0
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
        mu: round(mu, 3),
        sigma: round(sigma, 3),
        median: round(Math.pow(Math.E, mu), 0),
    };
}

/**
 * Adds all elements of an array
 */
function sum(values: number[]): number {
    return values.reduce((a, b) => a + b, 0);
}

/**
 * Squares the number. This function is added to make the above sigma calculation more readable.
 */
function sq(value: number): number {
    return Math.pow(value, 2);
}

/**
 * Gets the natural log of a number. This function is added to make the above sigma calculation more readable.
 */
function ln(value: number): number {
    return Math.log(value);
}

/**
 * Rounds a number to a given decimal precision
 * @param value The value to round
 * @param precision The number of places after the decimal to keep
 * @returns The rounded number
 */
function round(value: number, precision: number = 3): number {
    const multiplier = Math.pow(10, precision);
    return Math.round(value * multiplier) / multiplier;
}
