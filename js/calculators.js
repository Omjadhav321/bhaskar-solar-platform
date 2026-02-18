/**
 * Bhaskar Solar Platform - Calculators Module
 * Solar calculation tools with history and recommendations
 */

const Calculators = {
    // Calculation history
    history: [],

    // Initialize
    init() {
        this.loadHistory();
    },

    // Load history from localStorage
    loadHistory() {
        const stored = localStorage.getItem('bs_calc_history');
        this.history = stored ? JSON.parse(stored) : [];
    },

    // Save history to localStorage
    saveHistory() {
        localStorage.setItem('bs_calc_history', JSON.stringify(this.history));
    },

    // Add to history
    addToHistory(type, inputs, result) {
        const entry = {
            id: Date.now(),
            type,
            inputs,
            result,
            timestamp: new Date().toISOString()
        };
        this.history.unshift(entry);
        if (this.history.length > 50) {
            this.history = this.history.slice(0, 50);
        }
        this.saveHistory();
    },

    // Energy Calculator
    calculateEnergy() {
        const systemSize = parseFloat(document.getElementById('energySysSize')?.value);
        const sunHours = parseFloat(document.getElementById('sunHours')?.value) || 5;

        if (!systemSize || systemSize <= 0) {
            App.showToast('Please enter a valid system size', 'warning');
            return;
        }

        // Calculate daily energy production
        const dailyEnergy = systemSize * sunHours * 0.85; // 85% efficiency factor
        const monthlyEnergy = dailyEnergy * 30;
        const yearlyEnergy = dailyEnergy * 365;

        // Environmental impact
        const co2SavedYearly = yearlyEnergy * 0.85; // kg CO2 per kWh
        const treesEquivalent = Math.round(co2SavedYearly / 22); // Average tree absorbs ~22kg CO2/year

        const result = {
            daily: dailyEnergy.toFixed(2),
            monthly: monthlyEnergy.toFixed(2),
            yearly: yearlyEnergy.toFixed(2),
            co2Saved: co2SavedYearly.toFixed(0),
            trees: treesEquivalent
        };

        this.addToHistory('energy', { systemSize, sunHours }, result);

        const resultDiv = document.getElementById('energyResult');
        if (resultDiv) {
            resultDiv.innerHTML = `
                <div class="calc-result-content">
                    <div class="result-row">
                        <span class="result-label">Daily Production</span>
                        <span class="result-value">${result.daily} kWh</span>
                    </div>
                    <div class="result-row">
                        <span class="result-label">Monthly Production</span>
                        <span class="result-value">${result.monthly} kWh</span>
                    </div>
                    <div class="result-row highlight">
                        <span class="result-label">Yearly Production</span>
                        <span class="result-value">${result.yearly} kWh</span>
                    </div>
                    <div class="result-divider"></div>
                    <div class="result-row">
                        <span class="result-label">CO₂ Saved/Year</span>
                        <span class="result-value green">${result.co2Saved} kg</span>
                    </div>
                    <div class="result-row">
                        <span class="result-label">Trees Equivalent</span>
                        <span class="result-value green">${result.trees} trees</span>
                    </div>
                </div>
            `;
            resultDiv.style.display = 'block';
        }

        App.showToast('Calculation complete!', 'success');
    },

    // Savings Calculator
    calculateSavings() {
        const monthlyBill = parseFloat(document.getElementById('monthlyBill')?.value);
        const elecRate = parseFloat(document.getElementById('elecRate')?.value) || 6;

        if (!monthlyBill || monthlyBill <= 0) {
            App.showToast('Please enter a valid monthly bill amount', 'warning');
            return;
        }

        // Calculate consumption
        const monthlyConsumption = monthlyBill / elecRate; // kWh

        // Assume 70% offset from solar (typical)
        const solarOffset = 0.70;
        const solarGeneration = monthlyConsumption * solarOffset;

        // Calculate savings
        const monthlySavings = monthlyBill * solarOffset;
        const yearlySavings = monthlySavings * 12;

        // System size needed
        const systemSizeNeeded = solarGeneration / (5 * 30 * 0.85); // 5 sun hours, 85% efficiency

        // Payback calculation (assuming ₹50,000/kW installed cost)
        const installedCost = systemSizeNeeded * 50000;
        const paybackYears = installedCost / yearlySavings;

        const result = {
            monthlyConsumption: monthlyConsumption.toFixed(1),
            solarGeneration: solarGeneration.toFixed(1),
            monthlySavings: monthlySavings.toFixed(0),
            yearlySavings: yearlySavings.toFixed(0),
            systemSize: systemSizeNeeded.toFixed(2),
            estimatedCost: (installedCost / 100000).toFixed(2),
            paybackYears: paybackYears.toFixed(1)
        };

        this.addToHistory('savings', { monthlyBill, elecRate }, result);

        const resultDiv = document.getElementById('savingsResult');
        if (resultDiv) {
            resultDiv.innerHTML = `
                <div class="calc-result-content">
                    <div class="result-row">
                        <span class="result-label">Monthly Consumption</span>
                        <span class="result-value">${result.monthlyConsumption} kWh</span>
                    </div>
                    <div class="result-row">
                        <span class="result-label">Solar Generation</span>
                        <span class="result-value">${result.solarGeneration} kWh</span>
                    </div>
                    <div class="result-divider"></div>
                    <div class="result-row highlight">
                        <span class="result-label">Monthly Savings</span>
                        <span class="result-value">₹${result.monthlySavings}</span>
                    </div>
                    <div class="result-row highlight">
                        <span class="result-label">Yearly Savings</span>
                        <span class="result-value green">₹${result.yearlySavings}</span>
                    </div>
                    <div class="result-divider"></div>
                    <div class="result-row">
                        <span class="result-label">System Size Needed</span>
                        <span class="result-value">${result.systemSize} kW</span>
                    </div>
                    <div class="result-row">
                        <span class="result-label">Estimated Cost</span>
                        <span class="result-value">₹${result.estimatedCost} Lakhs</span>
                    </div>
                    <div class="result-row">
                        <span class="result-label">Payback Period</span>
                        <span class="result-value">${result.paybackYears} years</span>
                    </div>
                </div>
            `;
            resultDiv.style.display = 'block';
        }

        App.showToast('Savings calculated!', 'success');
    },

    // Watts Converter
    convertWatts() {
        const watts = parseFloat(document.getElementById('watts')?.value);

        if (!watts || watts < 0) {
            App.showToast('Please enter a valid watt value', 'warning');
            return;
        }

        const kilowatts = watts / 1000;
        const megawatts = watts / 1000000;
        const horsepower = watts / 745.7;
        const btuPerHour = watts * 3.412;

        const result = {
            watts: watts.toLocaleString(),
            kilowatts: kilowatts.toFixed(4),
            megawatts: megawatts.toFixed(7),
            horsepower: horsepower.toFixed(3),
            btu: btuPerHour.toFixed(2)
        };

        this.addToHistory('watts', { watts }, result);

        const resultDiv = document.getElementById('wattsResult');
        if (resultDiv) {
            resultDiv.innerHTML = `
                <div class="calc-result-content">
                    <div class="result-row">
                        <span class="result-label">Watts</span>
                        <span class="result-value">${result.watts} W</span>
                    </div>
                    <div class="result-row">
                        <span class="result-label">Kilowatts</span>
                        <span class="result-value">${result.kilowatts} kW</span>
                    </div>
                    <div class="result-row">
                        <span class="result-label">Megawatts</span>
                        <span class="result-value">${result.megawatts} MW</span>
                    </div>
                    <div class="result-row">
                        <span class="result-label">Horsepower</span>
                        <span class="result-value">${result.horsepower} HP</span>
                    </div>
                    <div class="result-row">
                        <span class="result-label">BTU/hour</span>
                        <span class="result-value">${result.btu}</span>
                    </div>
                </div>
            `;
            resultDiv.style.display = 'block';
        }

        App.showToast('Conversion complete!', 'success');
    },

    // Battery Sizing Calculator
    calculateBattery() {
        const dailyUsage = parseFloat(document.getElementById('dailyUsage')?.value);
        const backupDays = parseInt(document.getElementById('backupDays')?.value) || 1;

        if (!dailyUsage || dailyUsage <= 0) {
            App.showToast('Please enter a valid daily usage', 'warning');
            return;
        }

        // Total energy needed
        const totalEnergy = dailyUsage * backupDays;

        // Battery sizing (accounting for depth of discharge - 80% for lithium, 50% for lead-acid)
        const lithiumCapacity = totalEnergy / 0.80;
        const leadAcidCapacity = totalEnergy / 0.50;

        // Recommended inverter size (peak load + 25% margin)
        const peakLoad = dailyUsage / 5; // Assume 5 hours of peak usage
        const inverterSize = peakLoad * 1.25;

        // Cost estimation
        const lithiumCost = lithiumCapacity * 15000; // ~₹15,000 per kWh for lithium
        const leadAcidCost = leadAcidCapacity * 8000; // ~₹8,000 per kWh for lead-acid

        const result = {
            totalEnergy: totalEnergy.toFixed(1),
            lithiumCapacity: lithiumCapacity.toFixed(1),
            leadAcidCapacity: leadAcidCapacity.toFixed(1),
            inverterSize: inverterSize.toFixed(2),
            lithiumCost: (lithiumCost / 100000).toFixed(2),
            leadAcidCost: (leadAcidCost / 100000).toFixed(2)
        };

        this.addToHistory('battery', { dailyUsage, backupDays }, result);

        const resultDiv = document.getElementById('batteryResult');
        if (resultDiv) {
            resultDiv.innerHTML = `
                <div class="calc-result-content">
                    <div class="result-row">
                        <span class="result-label">Total Energy Needed</span>
                        <span class="result-value">${result.totalEnergy} kWh</span>
                    </div>
                    <div class="result-divider"></div>
                    <div class="result-row">
                        <span class="result-label">Lithium Battery (80% DoD)</span>
                        <span class="result-value">${result.lithiumCapacity} kWh</span>
                    </div>
                    <div class="result-row">
                        <span class="result-label">Lead-Acid Battery (50% DoD)</span>
                        <span class="result-value">${result.leadAcidCapacity} kWh</span>
                    </div>
                    <div class="result-divider"></div>
                    <div class="result-row">
                        <span class="result-label">Recommended Inverter</span>
                        <span class="result-value">${result.inverterSize} kW</span>
                    </div>
                    <div class="result-row">
                        <span class="result-label">Lithium Battery Cost</span>
                        <span class="result-value">₹${result.lithiumCost} Lakhs</span>
                    </div>
                    <div class="result-row">
                        <span class="result-label">Lead-Acid Cost</span>
                        <span class="result-value">₹${result.leadAcidCost} Lakhs</span>
                    </div>
                </div>
            `;
            resultDiv.style.display = 'block';
        }

        App.showToast('Battery sizing calculated!', 'success');
    },

    // Roof Area Calculator
    calculateRoofArea() {
        const systemSize = parseFloat(document.getElementById('roofSysSize')?.value);
        const panelType = document.getElementById('panelType')?.value || 'mono';

        if (!systemSize || systemSize <= 0) {
            App.showToast('Please enter a valid system size', 'warning');
            return;
        }

        // Panel efficiency and area by type
        const panelSpecs = {
            mono: { efficiency: 0.20, wattsPerSqm: 200, name: 'Monocrystalline' },
            poly: { efficiency: 0.16, wattsPerSqm: 160, name: 'Polycrystalline' },
            thin: { efficiency: 0.12, wattsPerSqm: 120, name: 'Thin-Film' }
        };

        const spec = panelSpecs[panelType];

        // Calculate number of panels (assuming 400W panels for mono/poly, 300W for thin-film)
        const panelWattage = panelType === 'thin' ? 300 : 400;
        const numPanels = Math.ceil((systemSize * 1000) / panelWattage);

        // Calculate area needed
        const panelArea = panelWattage / spec.wattsPerSqm; // sqm per panel
        const totalPanelArea = numPanels * panelArea;

        // Add spacing (30% extra for maintenance access)
        const totalAreaNeeded = totalPanelArea * 1.3;

        // Calculate usable roof percentage
        const typicalRoofSize = 100; // sqm average
        const roofPercentage = (totalAreaNeeded / typicalRoofSize) * 100;

        const result = {
            panelType: spec.name,
            numPanels: numPanels,
            panelWattage: panelWattage,
            panelArea: panelArea.toFixed(2),
            totalPanelArea: totalPanelArea.toFixed(1),
            totalAreaNeeded: totalAreaNeeded.toFixed(1),
            roofPercentage: roofPercentage.toFixed(0)
        };

        this.addToHistory('roof', { systemSize, panelType }, result);

        const resultDiv = document.getElementById('roofResult');
        if (resultDiv) {
            resultDiv.innerHTML = `
                <div class="calc-result-content">
                    <div class="result-row">
                        <span class="result-label">Panel Type</span>
                        <span class="result-value">${result.panelType}</span>
                    </div>
                    <div class="result-row">
                        <span class="result-label">Number of Panels</span>
                        <span class="result-value">${result.numPanels}</span>
                    </div>
                    <div class="result-row">
                        <span class="result-label">Panel Wattage</span>
                        <span class="result-value">${result.panelWattage}W each</span>
                    </div>
                    <div class="result-divider"></div>
                    <div class="result-row highlight">
                        <span class="result-label">Total Panel Area</span>
                        <span class="result-value">${result.totalPanelArea} m²</span>
                    </div>
                    <div class="result-row highlight">
                        <span class="result-label">Area with Spacing</span>
                        <span class="result-value green">${result.totalAreaNeeded} m²</span>
                    </div>
                    <div class="result-row">
                        <span class="result-label">% of Typical Roof</span>
                        <span class="result-value">${result.roofPercentage}%</span>
                    </div>
                </div>
            `;
            resultDiv.style.display = 'block';
        }

        App.showToast('Roof area calculated!', 'success');
    },

    // Temperature Derating Calculator
    calculateTempDerate() {
        const panelRating = parseFloat(document.getElementById('panelRating')?.value) || 400;
        const ambientTemp = parseFloat(document.getElementById('ambientTemp')?.value) || 35;

        // Standard Test Conditions: 25°C, 1000 W/m²
        const stcTemp = 25;

        // Temperature coefficient (typical for silicon panels: -0.4%/°C)
        const tempCoeff = -0.004;

        // Cell temperature (typically 25-30°C above ambient in full sun)
        const cellTemp = ambientTemp + 28;

        // Calculate derating
        const tempDiff = cellTemp - stcTemp;
        const derateFactor = 1 + (tempCoeff * tempDiff);
        const actualOutput = panelRating * derateFactor;
        const powerLoss = panelRating - actualOutput;
        const lossPercentage = ((powerLoss / panelRating) * 100);

        const result = {
            cellTemp: cellTemp.toFixed(1),
            stcTemp: stcTemp,
            tempDiff: tempDiff.toFixed(1),
            ratedPower: panelRating,
            actualOutput: actualOutput.toFixed(1),
            powerLoss: powerLoss.toFixed(1),
            lossPercentage: lossPercentage.toFixed(1)
        };

        this.addToHistory('temperature', { panelRating, ambientTemp }, result);

        const resultDiv = document.getElementById('tempResult');
        if (resultDiv) {
            resultDiv.innerHTML = `
                <div class="calc-result-content">
                    <div class="result-row">
                        <span class="result-label">Cell Temperature</span>
                        <span class="result-value">${result.cellTemp}°C</span>
                    </div>
                    <div class="result-row">
                        <span class="result-label">Temperature Difference</span>
                        <span class="result-value">+${result.tempDiff}°C from STC</span>
                    </div>
                    <div class="result-divider"></div>
                    <div class="result-row">
                        <span class="result-label">Rated Power</span>
                        <span class="result-value">${result.ratedPower}W</span>
                    </div>
                    <div class="result-row ${lossPercentage > 10 ? 'warning' : ''}">
                        <span class="result-label">Actual Output</span>
                        <span class="result-value">${result.actualOutput}W</span>
                    </div>
                    <div class="result-row ${lossPercentage > 10 ? 'warning' : ''}">
                        <span class="result-label">Power Loss</span>
                        <span class="result-value red">-${result.powerLoss}W (${result.lossPercentage}%)</span>
                    </div>
                </div>
                ${lossPercentage > 15 ? `
                    <div class="calc-recommendation">
                        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                        </svg>
                        High temperature losses detected. Consider panel cooling or installing in a shaded area.
                    </div>
                ` : ''}
            `;
            resultDiv.style.display = 'block';
        }

        App.showToast('Temperature derating calculated!', 'success');
    },

    // Clear history
    clearHistory() {
        this.history = [];
        this.saveHistory();
        App.showToast('Calculation history cleared', 'info');
    },

    // Export results as PDF (simplified - creates printable HTML)
    exportAsPDF(type) {
        const historyItems = this.history.filter(h => h.type === type);
        if (!historyItems.length) {
            App.showToast('No calculations to export', 'warning');
            return;
        }

        const printWindow = window.open('', '_blank');
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Solar Calculations Report - Bhaskar Solar</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    h1 { color: #F4A523; }
                    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background: #F4A523; color: white; }
                    .timestamp { color: #666; font-size: 0.9em; }
                </style>
            </head>
            <body>
                <h1>Bhaskar Solar - ${type.charAt(0).toUpperCase() + type.slice(1)} Calculations</h1>
                <p>Generated on: ${new Date().toLocaleString()}</p>
                <table>
                    <tr>
                        <th>Date</th>
                        <th>Inputs</th>
                        <th>Results</th>
                    </tr>
                    ${historyItems.map(item => `
                        <tr>
                            <td class="timestamp">${new Date(item.timestamp).toLocaleString()}</td>
                            <td>${JSON.stringify(item.inputs)}</td>
                            <td>${JSON.stringify(item.result)}</td>
                        </tr>
                    `).join('')}
                </table>
            </body>
            </html>
        `;
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.print();
    }
};

// Initialize calculators on load
document.addEventListener('DOMContentLoaded', () => {
    Calculators.init();
});
