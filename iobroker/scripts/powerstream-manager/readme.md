# ⚡ EcoFlow Smart Feed-In Control for ioBroker (Zero Export)

This script enables **intelligent control of feed-in power** from an EcoFlow battery system, using live power consumption data (e.g., from `vzlogger`).  
The goal: Achieve **zero export** – meaning the battery (and optionally solar) covers household demand without feeding energy into or drawing from the public grid.

## 🚀 Features

- Automatically adjusts the EcoFlow `permanentWatts` value
- Smooths consumption via rolling average (load smoothing)
- Dynamically reacts to available solar power
- Respects max battery discharge limits
- Optional control switch for enabling/disabling automation

## ⚙️ Requirements

- ioBroker with installed [`ecoflow-mqtt`](https://github.com/Apollon77/ioBroker.ecoflow-mqtt) adapter
- Power consumption data available in ioBroker (e.g., via `mqtt.0.vzlogger.data.chn1.agg`)
- EcoFlow battery system (e.g., PowerStream) with MQTT integration
- A writable data point for `permanentWatts` (e.g., `ecoflow-mqtt.0.<SERIAL>.inverter_heartbeat.permanentWatts`)

## 📦 Installation

1. Create a new JavaScript script under `javascript.0` in ioBroker
2. Copy and paste the contents of `script.js`
3. Configure the following constants in the script:
   ```javascript
   const ecoflowTarget = 'ecoflow-mqtt.0.<SERIAL>.inverter_heartbeat.permanentWatts';
   const netPower = 'mqtt.0.vzlogger.data.chn1.agg';
   const solarPower = 'ecoflow-mqtt.0.<SERIAL>.inverter_heartbeat.pvToInvWatts';
   const maxPowerFromBattery = 300;