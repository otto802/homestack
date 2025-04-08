const ecoflowTarget = 'ecoflow-mqtt.0.HW51xxx.inverter_heartbeat.permanentWatts';
const solarPower = 'ecoflow-mqtt.0.HW51xxx.inverter_heartbeat.pvToInvWatts';
const netPower = 'mqtt.0.vzlogger.data.chn1.agg';

const maxPowerFromBattery = 300;
const intervalSec = 30;
const gain = 0.5;
const smoothingWindow = 5;
const maxStep = 100; // maximale Änderung in W pro Intervall

let currentOutput = 0;
let netHistory = [];

schedule(`*/${intervalSec} * * * * *`, () => {
    const net = getState(netPower).val;
    const solar = getState(solarPower).val;

    if (typeof net !== 'number' || typeof solar !== 'number') {
        log('Ungültiger Wert – Netz oder Solar', 'warn');
        return;
    }

    // Historie pflegen
    netHistory.push(net);
    if (netHistory.length > smoothingWindow) netHistory.shift();

    const avgNet = netHistory.reduce((sum, val) => sum + val, 0) / netHistory.length;

    // Kombinierte Regelgröße: 70% Durchschnitt + 30% aktueller Wert
    const combinedNet = avgNet * 0.7 + net * 0.3;
    const adjustment = combinedNet * gain;

    // Vorschlag berechnen
    let proposedOutput = currentOutput + adjustment;

    // Änderung begrenzen
    if (Math.abs(proposedOutput - currentOutput) > maxStep) {
        proposedOutput = currentOutput + Math.sign(proposedOutput - currentOutput) * maxStep;
    }

    // Dynamische Maximalleistung
    let dynamicMax = (solar > 20 && solar > maxPowerFromBattery)
        ? solar + maxPowerFromBattery
        : maxPowerFromBattery;

    currentOutput = Math.max(0, Math.min(dynamicMax, Math.round(proposedOutput)));

    setState(ecoflowTarget, currentOutput);
    log(`Netz: ${net} W | Mittel: ${avgNet.toFixed(1)} | Ziel: ${combinedNet.toFixed(1)} | Solar: ${solar} W | EcoFlow: ${currentOutput} W`, 'info');
});
