const ecoflowTarget = 'ecoflow-mqtt.0.HW51xxx.inverter_heartbeat.permanentWatts';
const netPower = 'mqtt.0.vzlogger.data.chn1.agg';
const solarPower = 'ecoflow-mqtt.0.HW51xxx.inverter_heartbeat.pvToInvWatts'
const maxPowerFromBattery = 300;
const intervalSec = 30;
const gain = 0.5;

let currentOutput = 0;

schedule(`*/${intervalSec} * * * * *`, () => {
    const net = getState(netPower).val;
    if (typeof net !== 'number') {
        log('Ungültiger Netzleistungswert', 'warn');
        return;
    }

    const solar = getState(solarPower).val;
    if (typeof net !== 'number') {
        log('Ungültiger Solarleistungswert', 'warn');
        return;
    }


    // Positiver Wert = Netzbezug → Akku-Leistung erhöhen
    // Negativer Wert = Einspeisung → Akku-Leistung senken
    const adjustment = net * gain;
    currentOutput += adjustment;

    // Begrenzen
    currentOutput = Math.max(0, Math.min(maxPowerFromBattery, Math.round(currentOutput)));

    setState(ecoflowTarget, currentOutput);
    log(`Netzleistung: ${net} W | Neue EcoFlow-Leistung: ${currentOutput} W`, 'info');
});