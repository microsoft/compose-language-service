/*!--------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Connection, Disposable } from 'vscode-languageserver';
import { initEvent, TelemetryEvent } from '../../../client/TelemetryEvent';

// One minute flush interval
const FlushIntervalMilliseconds = 60 * 1000;

export class TelemetryAggregator implements Disposable {
    private eventBuffer: TelemetryEvent[] = [];
    private readonly timer: NodeJS.Timeout;

    public constructor(private readonly connection: Connection, private readonly interval: number = FlushIntervalMilliseconds) {
        this.timer = setInterval(this.flush, this.interval);
    }

    public dispose(): void {
        clearInterval(this.timer);

        // Flush one last time
        this.flush();
    }

    public logEvent(event: TelemetryEvent): void {
        if (event.suppressAll) {
            // Do nothing, this event is suppressed
        } else if (event.properties.result === 'Succeeded' && event.suppressIfSuccessful) {
            // Do nothing, the event succeeded and has suppressIfSuccessful === true
        } else if (event.properties.result === 'Failed') {
            // Event is an error, send immediately rather than buffering
            this.connection.telemetry.logEvent(event);
        } else {
            // Add it to the event buffer to be flushed on the interval
            this.eventBuffer.push(event);
        }
    }

    private flush(): void {
        try {
            const aggregated: TelemetryEvent[] = [];
            const eventGroups = new Map<string, TelemetryEvent[]>();

            // Group events by their name and key properties
            for (const evt of this.eventBuffer) {
                const key = evt.eventName; // TODO

                if (!eventGroups.has(key)) {
                    eventGroups.set(key, []);
                }

                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                eventGroups.get(key)!.push(evt);
            }

            // Aggregate and add performance statistics
            for (const key of eventGroups.keys()) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                const events = eventGroups.get(key)!;
                const aggregatedEvent = initEvent(key);

                aggregatedEvent.measurements.count = events.length;

                // If events somehow don't have a duration we shouldn't count them when it comes to duration avg, stdev, etc.
                // So, get an array of durations only
                const durations = events.map(e => e.measurements.duration ?? undefined).filter(d => d !== undefined) as number[];

                aggregatedEvent.measurements.durationAvg = 0; // TODO
                aggregatedEvent.measurements.durationStdev = 0; // TODO
                aggregatedEvent.measurements.durationMedian = 0; // TODO
                aggregatedEvent.measurements.duration95th = 0; // TODO

                aggregated.push(aggregatedEvent);
            }

            // Send!
            for (const evt of aggregated) {
                this.connection.telemetry.logEvent(evt);
            }
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const error = err instanceof Error ? err : Error((err as any).toString());
            const telemetryFailedEvent = initEvent('telemetryaggregatorfailure');

            telemetryFailedEvent.properties.result = 'Failed';
            telemetryFailedEvent.properties.error = error.name;
            telemetryFailedEvent.properties.errorMessage = error.message;

            this.connection.telemetry.logEvent(telemetryFailedEvent);
        } finally {
            // Finally, clear out the buffer
            this.eventBuffer = [];
        }
    }
}
