import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import Icon from '../../../components/AppIcon';

const ServiceAnalytics = () => {
  // Service data and monthly trends should be provided from backend or context
  const serviceData = [];
  const monthlyTrends = [];

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
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
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