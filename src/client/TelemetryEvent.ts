/*!--------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// These interfaces are loosely copied from https://github.com/microsoft/vscode-azuretools/blob/be03d9a57f66bb25efdd6f2e281052d05b0ec01b/ui/index.d.ts#L536-L592
// Ideally they would just be used directly but I'm reluctant to add the dependency on vscode-azureextensionui, given how much unrelated stuff it contains...

export interface TelemetryEvent {
    eventName: string;
    properties: TelemetryProperties;
    measurements: TelemetryMeasurements;

    suppressIfSuccessful?: boolean;
    suppressAll?: boolean;
}

interface TelemetryProperties {
    result?: 'Succeeded' | 'Failed' | 'Canceled';
    error?: string;
    errorMessage?: string;

    [key: string]: string | undefined;
}

interface TelemetryMeasurements {
    duration?: number;
    [key: string]: number | undefined;
}

export function initEvent(eventName: string): TelemetryEvent {
    return {
        eventName: eventName,
        properties: {
            result: 'Succeeded',
        },
        measurements: {},
    };
}
