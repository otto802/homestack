const ecoflowTarget = 'ecoflow-mqtt.0.HW51xxx.inverter_heartbeat.permanentWatts';
const solarPower = 'ecoflow-mqtt.0.HW51xxx.inverter_heartbeat.pvToInvWatts';
const netPower = 'mqtt.0.vzlogger.data.chn1.agg';

const maxPowerFromBattery = 300;
const intervalSec = 30;
const smoothingWindow = 5;
const maxStep = 100;

const gainNormal = 0.5;     // Standard regulation when grid power is positive (grid import)
const gainFastDown = 1.2;   // Faster reaction when feeding into the grid (negative grid power)
const deadband = 15;        // Deadband in watts – no regulation within ±15 W

let currentOutput = 0;
let netHistory = [];

schedule(`*/${intervalSec} * * * * *`, () => {
    const net = getState(netPower).val;
    const solar = getState(solarPower).val;

    if (typeof net !== 'number' || typeof solar !== 'number') {
        log('Invalid value – net or solar is not a number', 'warn');
        return;
    }

    // Keep a rolling history of grid values
    netHistory.push(net);
    if (netHistory.length > smoothingWindow) netHistory.shift();

    const avgNet = netHistory.reduce((sum, val) => sum + val, 0) / netHistory.length;

    // Combine average and current value for responsiveness
    const combinedNet = avgNet * 0.7 + net * 0.3;

    // Deadband: do nothing if combined net power is within ±15 W
    if (Math.abs(combinedNet) < deadband) {
        log(`Deadband active: Net=${net} W | Combined=${combinedNet.toFixed(1)} W → no change`, 'info');
        return;
    }

    // Use faster gain when feeding power into the grid
    const gain = combinedNet < 0 ? gainFastDown : gainNormal;
    const adjustment = combinedNet * gain;

    // Calculate proposed new output
    let proposedOutput = currentOutput + adjustment;

    // Limit max step change per cycle
    if (Math.abs(proposedOutput - currentOutput) > maxStep) {
        proposedOutput = currentOutput + Math.sign(proposedOutput - currentOutput) * maxStep;
    }

    // Dynamic power limit based on solar input
    let dynamicMax = (solar > 20 && solar > maxPowerFromBattery)
        ? solar + maxPowerFromBattery
        : maxPowerFromBattery;

    // Clamp final output
    currentOutput = Math.max(0, Math.min(dynamicMax, Math.round(proposedOutput)));

    setState(ecoflowTarget, currentOutput);
    log(`Net: ${net} W | Avg: ${avgNet.toFixed(1)} W | Combined: ${combinedNet.toFixed(1)} W | Gain: ${gain} | Solar: ${solar} W | EcoFlow output: ${currentOutput} W`, 'info');
});