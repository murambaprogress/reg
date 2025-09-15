import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts';
import Icon from '../../../components/AppIcon';

const ServiceAnalytics = ({ reportRows = [], serviceTrends = null }) => {
  const [chartType, setChartType] = useState('pie');

  // Prefer server-side serviceTrends when provided. Expected shape:
  // { distribution: [{ name, value, revenue, jobs, color }, ...], monthly: [{ month: '2025-09-01T00:00:00Z', categories: { OilChange: 10, BrakeService: 5 } }, ...] }
  let serviceData = [];
  let monthlyTrends = [];

  if (serviceTrends && typeof serviceTrends === 'object') {
    serviceData = Array.isArray(serviceTrends.distribution) ? serviceTrends.distribution : [];
    monthlyTrends = Array.isArray(serviceTrends.monthly) ? serviceTrends.monthly.map(m => {
      // normalize month label
      let label = m.month;
      try { label = new Date(m.month).toLocaleString(undefined, { month: 'short', year: 'numeric' }); } catch(e){}
      return { ...m, month: label };
    }) : [];
  } else {
    // Aggregate services and monthly trends locally
    const serviceMap = {};
    const monthlyMap = {};
    reportRows.forEach(r => {
      const services = (r.service_description || '').split(',').map(s => s.trim()).filter(Boolean);
      const serviceKey = services.length ? services[0] : 'Other';
      const srec = serviceMap[serviceKey] = serviceMap[serviceKey] || { name: serviceKey, value: 0, revenue: 0, jobs: 0, color: '' };
      srec.value += 1;
      srec.revenue += Number(r.actual_cost || 0) + Number(r.parts_cost || 0);
      srec.jobs += 1;

      try {
        const d = new Date(r.created_at);
        const month = d.toLocaleString(undefined, { month: 'short', year: 'numeric' });
        monthlyMap[month] = monthlyMap[month] || { month };
        const key = serviceKey.replace(/\s+/g,'');
        monthlyMap[month][key] = (monthlyMap[month][key] || 0) + 1;
      } catch (e) {}
    });

    serviceData = Object.values(serviceMap).map((s, i) => ({ ...s, color: ['#4A90E2','#10B981','#F59E0B','#EF4444'][i % 4] }));
    monthlyTrends = Object.values(monthlyMap).sort((a,b) => new Date(a.month) - new Date(b.month));
  }

  const chartTypes = [
    { value: 'pie', label: 'Pie Chart', icon: 'PieChart' },
    { value: 'bar', label: 'Bar Chart', icon: 'BarChart3' },
    { value: 'line', label: 'Line Chart', icon: 'TrendingUp' }
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-surface border border-border rounded-lg p-3 shadow-modal">
          <p className="text-sm font-body-medium text-text-primary mb-2">{data.name}</p>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-text-secondary">Percentage:</span>
              <span className="font-body-medium text-text-primary">{data.value}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Revenue:</span>
              <span className="font-body-medium text-text-primary">${data.revenue?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Jobs:</span>
              <span className="font-body-medium text-text-primary">{data.jobs}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const TrendTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface border border-border rounded-lg p-3 shadow-modal">
          <p className="text-sm font-body-medium text-text-primary mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center space-x-2 text-xs">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              ></div>
              <span className="text-text-secondary">{entry.name}:</span>
              <span className="font-body-medium text-text-primary">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Service Distribution */}
      <div className="bg-surface rounded-lg p-6 shadow-card border border-border">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-heading-medium text-text-primary">Service Type Distribution</h3>
            <p className="text-sm text-text-secondary mt-1">Breakdown by service category</p>
          </div>
          <div className="flex items-center space-x-2">
            {chartTypes.map(type => (
              <button
                key={type.value}
                onClick={() => setChartType(type.value)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-body-medium transition-all duration-200 ${
                  chartType === type.value
                    ? 'bg-accent text-accent-foreground'
                    : 'text-text-secondary hover:text-text-primary hover:bg-background'
                }`}
              >
                <Icon name={type.icon} size={16} />
                <span>{type.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart */}
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'pie' ? (
                <PieChart>
                  <Pie
                    data={serviceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {serviceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              ) : chartType === 'bar' ? (
                <BarChart data={serviceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis 
                    dataKey="name" 
                    stroke="var(--color-text-secondary)"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="var(--color-text-secondary)"
                    fontSize={12}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="jobs" fill="var(--color-accent)" name="Jobs" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : (
                <LineChart data={serviceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis 
                    dataKey="name" 
                    stroke="var(--color-text-secondary)"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="var(--color-text-secondary)"
                    fontSize={12}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="jobs" 
                    stroke="var(--color-accent)" 
                    strokeWidth={3}
                    name="Jobs"
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Service Details */}
          <div className="space-y-3">
            {serviceData.map((service, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-background rounded-lg">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: service.color }}
                  ></div>
                  <span className="text-sm font-body-medium text-text-primary">{service.name}</span>
                </div>
                <div className="flex items-center space-x-4 text-xs text-text-secondary">
                  <span>{service.value}%</span>
                  <span>${service.revenue.toLocaleString()}</span>
                  <span>{service.jobs} jobs</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Trends */}
      <div className="bg-surface rounded-lg p-6 shadow-card border border-border">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-heading-medium text-text-primary">Service Trends</h3>
            <p className="text-sm text-text-secondary mt-1">Monthly service volume by category</p>
          </div>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis 
                dataKey="month" 
                stroke="var(--color-text-secondary)"
                fontSize={12}
              />
              <YAxis 
                stroke="var(--color-text-secondary)"
                fontSize={12}
              />
              <Tooltip content={<TrendTooltip />} />
              <Bar dataKey="oilChange" stackId="a" fill="#4A90E2" name="Oil Change" />
              <Bar dataKey="brakeService" stackId="a" fill="#10B981" name="Brake Service" />
              <Bar dataKey="tireService" stackId="a" fill="#F59E0B" name="Tire Service" />
              <Bar dataKey="engineRepair" stackId="a" fill="#EF4444" name="Engine Repair" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Services Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface rounded-lg p-4 shadow-card border border-border">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center">
              <Icon name="Wrench" size={16} className="text-accent" />
            </div>
            <div>
              <h4 className="text-sm font-body-medium text-text-primary">Most Popular</h4>
              <p className="text-xs text-text-secondary">Oil Change Service</p>
            </div>
          </div>
          <div className="text-2xl font-heading-semibold text-text-primary">35%</div>
          <div className="text-xs text-success">+5% from last month</div>
        </div>

        <div className="bg-surface rounded-lg p-4 shadow-card border border-border">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 bg-success/10 rounded-lg flex items-center justify-center">
              <Icon name="DollarSign" size={16} className="text-success" />
            </div>
            <div>
              <h4 className="text-sm font-body-medium text-text-primary">Highest Revenue</h4>
              <p className="text-xs text-text-secondary">Oil Change Service</p>
            </div>
          </div>
          <div className="text-2xl font-heading-semibold text-text-primary">$45K</div>
          <div className="text-xs text-success">+12% from last month</div>
        </div>

        <div className="bg-surface rounded-lg p-4 shadow-card border border-border">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 bg-warning/10 rounded-lg flex items-center justify-center">
              <Icon name="TrendingUp" size={16} className="text-warning" />
            </div>
            <div>
              <h4 className="text-sm font-body-medium text-text-primary">Fastest Growing</h4>
              <p className="text-xs text-text-secondary">Electrical Service</p>
            </div>
          </div>
          <div className="text-2xl font-heading-semibold text-text-primary">+25%</div>
          <div className="text-xs text-success">Growth this quarter</div>
        </div>
      </div>
    </div>
  );
};

export default ServiceAnalytics;