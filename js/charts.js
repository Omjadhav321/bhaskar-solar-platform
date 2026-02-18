/**
 * Bhaskar Solar Platform - Charts Module
 * Handles production monitoring charts and visualizations
 */

const Charts = {
    // Chart colors
    colors: {
        primary: '#F4A523',
        primaryLight: 'rgba(244, 165, 35, 0.3)',
        secondary: '#2C3E50',
        success: '#27AE60',
        warning: '#F39C12',
        danger: '#E74C3C',
        info: '#3498DB',
        gradient: null
    },

    // Current period
    currentPeriod: 'week',

    // Initialize charts
    init() {
        this.createGradient();
    },

    createGradient() {
        // Will be used for canvas gradients
        this.colors.gradient = ['#F4A523', '#FF6B35', '#F7931E'];
    },

    // Render production chart
    renderProductionChart(containerId, data, period = 'week') {
        const container = document.getElementById(containerId);
        if (!container) return;

        this.currentPeriod = period;

        let chartData;
        let labels;

        if (period === 'day') {
            // Hourly data for today
            const hourlyData = data.hourlyData || this.generateHourlyData();
            chartData = hourlyData.map(h => h.output);
            labels = hourlyData.map(h => `${h.hour}:00`);
        } else if (period === 'week') {
            // Last 7 days
            const weekData = data.weekData || this.generateWeekData();
            chartData = weekData.map(d => d.total);
            labels = weekData.map(d => d.dayName);
        } else {
            // Last 30 days
            const monthData = data.monthData || this.generateMonthData();
            chartData = monthData.map(d => d.total);
            labels = monthData.map((d, i) => i % 5 === 0 ? d.date.split('-')[2] : '');
        }

        this.renderBarChart(container, chartData, labels, 'kWh');
    },

    // Render bar chart
    renderBarChart(container, data, labels, unit) {
        const maxValue = Math.max(...data) || 1;

        // Create chart HTML
        let html = '<div class="chart-bars">';

        data.forEach((value, index) => {
            const height = (value / maxValue) * 100;
            const isToday = index === data.length - 1;

            html += `
                <div class="chart-bar-container">
                    <div class="chart-bar-wrapper">
                        <div class="chart-bar ${isToday ? 'highlight' : ''}"
                             style="height: 0%"
                             data-target-height="${height}">
                            <span class="chart-bar-value">${value.toFixed(1)}</span>
                        </div>
                    </div>
                    <span class="chart-bar-label">${labels[index]}</span>
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;

        // Animate bars
        setTimeout(() => {
            container.querySelectorAll('.chart-bar').forEach(bar => {
                const targetHeight = bar.dataset.targetHeight;
                bar.style.height = targetHeight + '%';
            });
        }, 100);
    },

    // Generate simulated hourly data
    generateHourlyData() {
        const data = [];
        for (let hour = 5; hour <= 19; hour++) {
            const sunFactor = Math.sin((hour - 5) * Math.PI / 14);
            const output = (5 * sunFactor * (0.8 + Math.random() * 0.4)).toFixed(2);
            data.push({ hour, output: parseFloat(output) });
        }
        return data;
    },

    // Generate simulated week data
    generateWeekData() {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const today = new Date().getDay();
        const data = [];

        for (let i = 6; i >= 0; i--) {
            const dayIndex = (today - i + 7) % 7;
            const output = 10 + Math.random() * 8;
            data.push({
                dayName: days[dayIndex],
                total: parseFloat(output.toFixed(1))
            });
        }
        return data;
    },

    // Generate simulated month data
    generateMonthData() {
        const data = [];
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const output = 8 + Math.random() * 10;
            data.push({
                date: date.toISOString().split('-')[0],
                total: parseFloat(output.toFixed(1))
            });
        }
        return data;
    },

    // Render donut chart for efficiency
    renderDonutChart(containerId, value, maxValue, label) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const percentage = (value / maxValue) * 100;
        const circumference = 2 * Math.PI * 45; // radius = 45
        const offset = circumference - (percentage / 100) * circumference;

        container.innerHTML = `
            <div class="donut-chart">
                <svg viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" class="donut-bg"/>
                    <circle cx="50" cy="50" r="45" class="donut-fill"
                            style="stroke-dasharray: ${circumference};
                                   stroke-dashoffset: ${offset};"
                            transform="rotate(-90 50 50)"/>
                </svg>
                <div class="donut-center">
                    <span class="donut-value">${value}</span>
                    <span class="donut-label">${label}</span>
                </div>
            </div>
        `;
    },

    // Render stat card with animation
    renderStatCard(elementId, value, trend = null) {
        const element = document.getElementById(elementId);
        if (!element) return;

        // Animate counter
        this.animateCounter(element, value);

        // Add trend indicator if provided
        if (trend && element.parentElement) {
            const trendEl = element.parentElement.querySelector('.stat-trend');
            if (trendEl) {
                trendEl.className = `stat-trend ${trend > 0 ? 'up' : 'down'}`;
                trendEl.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                        <path d="${trend > 0 ? 'M7 14l5-5 5 5z' : 'M7 10l5 5 5-5z'}"/>
                    </svg>
                    ${Math.abs(trend)}%
                `;
            }
        }
    },

    // Animate number counter
    animateCounter(element, targetValue) {
        const isDecimal = targetValue.toString().includes('.');
        const target = parseFloat(targetValue.toString().replace(/,/g, ''));
        const duration = 1500;
        const startTime = performance.now();
        const startValue = 0;

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const currentValue = startValue + (target - startValue) * easeOutQuart;

            if (isDecimal) {
                element.textContent = currentValue.toFixed(1);
            } else {
                element.textContent = Math.round(currentValue).toLocaleString();
            }

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                element.textContent = targetValue;
            }
        };

        requestAnimationFrame(animate);
    },

    // Update all stats with animation
    updateStats(stats) {
        if (stats.todayProduction !== undefined) {
            this.renderStatCard('todayProduction', stats.todayProduction, stats.todayTrend || 12);
        }
        if (stats.monthProduction !== undefined) {
            this.renderStatCard('monthProduction', stats.monthProduction, stats.monthTrend || 8);
        }
        if (stats.efficiency !== undefined) {
            this.renderStatCard('efficiencyRate', stats.efficiency, stats.efficiencyTrend || -2);
        }
        if (stats.co2Saved !== undefined) {
            this.renderStatCard('co2Saved', stats.co2Saved.toLocaleString(), stats.co2Trend || 15);
        }
    },

    // Render live indicator
    renderLiveIndicator(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <span class="live-indicator"></span>
            <span>Live</span>
        `;
    },

    // Render progress bar
    renderProgressBar(containerId, value, maxValue, label, color = null) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const percentage = (value / maxValue) * 100;
        const barColor = color || this.colors.primary;

        container.innerHTML = `
            <div class="progress-bar-container">
                <div class="progress-bar-header">
                    <span class="progress-bar-label">${label}</span>
                    <span class="progress-bar-value">${value} / ${maxValue}</span>
                </div>
                <div class="progress-bar-track">
                    <div class="progress-bar-fill" style="width: 0%; background: ${barColor};"
                         data-target-width="${percentage}"></div>
                </div>
            </div>
        `;

        // Animate
        setTimeout(() => {
            const fill = container.querySelector('.progress-bar-fill');
            if (fill) {
                fill.style.width = fill.dataset.targetWidth + '%';
            }
        }, 100);
    },

    // Render sparkline (mini chart)
    renderSparkline(containerId, data, width = 100, height = 30) {
        const container = document.getElementById(containerId);
        if (!container || !data.length) return;

        const max = Math.max(...data);
        const min = Math.min(...data);
        const range = max - min || 1;

        const points = data.map((value, index) => {
            const x = (index / (data.length - 1)) * width;
            const y = height - ((value - min) / range) * height;
            return `${x},${y}`;
        }).join(' ');

        container.innerHTML = `
            <svg viewBox="0 0 ${width} ${height}" class="sparkline">
                <polyline fill="none" stroke="${this.colors.primary}" stroke-width="2" points="${points}"/>
            </svg>
        `;
    },

    // Set chart period and re-render
    setChartPeriod(period, customerId) {
        this.currentPeriod = period;

        // Update button states
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');

        // Get data and render
        const customer = DataStore.customers.getById(customerId);
        if (customer) {
            const data = {
                hourlyData: DataStore.production.generateDailyData(customerId, customer.systemCapacity).hourlyData,
                weekData: DataStore.production.getWeeklyData(customerId),
                monthData: DataStore.production.getMonthlyData(customerId)
            };
            this.renderProductionChart('productionChartArea', data, period);
        }
    },

    // Initialize real-time updates
    startRealTimeUpdates(customerId, intervalMs = 30000) {
        this.updateInterval = setInterval(() => {
            const customer = DataStore.customers.getById(customerId);
            if (!customer) return;

            // Generate new data
            const stats = DataStore.production.getStats(customerId);
            this.updateStats({
                todayProduction: stats.today.toFixed(1),
                monthProduction: stats.thisMonth.toFixed(1),
                efficiency: stats.efficiency,
                co2Saved: stats.co2Saved
            });
        }, intervalMs);
    },

    // Stop real-time updates
    stopRealTimeUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
    }
};

// Initialize charts on load
document.addEventListener('DOMContentLoaded', () => {
    Charts.init();
});
