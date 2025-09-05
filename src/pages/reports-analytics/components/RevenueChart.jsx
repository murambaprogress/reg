import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import Icon from '../../../components/AppIcon';

const RevenueChart = ({ chartType, setChartType }) => {
  // Revenue data should be provided from backend or context
  const revenueData = [];

  const chartTypes = [
    { value: 'line', label: 'Line Chart', icon: 'TrendingUp' },
    { value: 'bar', label: 'Bar Chart', icon: 'BarChart3' }
  ];

  const CustomTooltip = ({ active, payload, label }) => {
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
              <span className="font-body-medium text-text-primary">
                ${entry.value?.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-surface rounded-lg p-6 shadow-card border border-border">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-heading-medium text-text-primary">Revenue Analysis</h3>
          <p className="text-sm text-text-secondary mt-1">Monthly revenue vs targets</p>
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

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'line' ? (
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis 
                dataKey="month" 
                stroke="var(--color-text-secondary)"
                fontSize={12}
              />
              <YAxis 
                stroke="var(--color-text-secondary)"
                fontSize={12}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="var(--color-accent)" 
                strokeWidth={3}
                dot={{ fill: 'var(--color-accent)', strokeWidth: 2, r: 4 }}
                name="Revenue"
              />
              <Line 
                type="monotone" 
                dataKey="target" 
                stroke="var(--color-warning)" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: 'var(--color-warning)', strokeWidth: 2, r: 3 }}
                name="Target"
              />
            </LineChart>
          ) : (
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis 
                dataKey="month" 
                stroke="var(--color-text-secondary)"
                fontSize={12}
              />
              <YAxis 
                stroke="var(--color-text-secondary)"
                fontSize={12}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="revenue" fill="var(--color-accent)" name="Revenue" radius={[4, 4, 0, 0]} />
              <Bar dataKey="target" fill="var(--color-warning)" name="Target" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-border">
        <div className="text-center">
          <div className="text-2xl font-heading-semibold text-success">$785K</div>
          <div className="text-sm text-text-secondary">Total Revenue</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-heading-semibold text-accent">$425K</div>
          <div className="text-sm text-text-secondary">Services Revenue</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-heading-semibold text-warning">$360K</div>
          <div className="text-sm text-text-secondary">Parts Revenue</div>
        </div>
      </div>
    </div>
  );
};

export default RevenueChart;