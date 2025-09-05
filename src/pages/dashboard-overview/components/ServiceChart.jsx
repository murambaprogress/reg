import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const ServiceChart = () => {
  const dailyStats = [
    { day: 'Mon', completed: 12, pending: 5, revenue: 2400 },
    { day: 'Tue', completed: 15, pending: 3, revenue: 3200 },
    { day: 'Wed', completed: 8, pending: 7, revenue: 1800 },
    { day: 'Thu', completed: 18, pending: 4, revenue: 4100 },
    { day: 'Fri', completed: 22, pending: 6, revenue: 5200 },
    { day: 'Sat', completed: 25, pending: 2, revenue: 6800 },
    { day: 'Sun', completed: 10, pending: 8, revenue: 2100 }
  ];

  const serviceTypes = [
    { name: 'Oil Change', value: 35, color: '#4A90E2' },
    { name: 'Brake Service', value: 25, color: '#10B981' },
    { name: 'Tire Service', value: 20, color: '#F59E0B' },
    { name: 'Engine Repair', value: 15, color: '#EF4444' },
    { name: 'Other', value: 5, color: '#6B7280' }
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface border border-border rounded-lg p-3 shadow-modal">
          <p className="text-sm font-body-medium text-text-primary mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm text-text-secondary">
              <span className="capitalize">{entry.dataKey}:</span> {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-surface rounded-lg shadow-card border border-border">
      <div className="p-6 border-b border-border">
        <h2 className="text-lg font-heading-semibold text-text-primary">Service Statistics</h2>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Jobs Chart */}
          <div>
            <h3 className="text-sm font-heading-medium text-text-primary mb-4">Daily Job Completion</h3>
            <div className="w-full h-64" aria-label="Daily Job Completion Bar Chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis 
                    dataKey="day" 
                    tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }}
                    axisLine={{ stroke: 'var(--color-border)' }}
                  />
                  <YAxis 
                    tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }}
                    axisLine={{ stroke: 'var(--color-border)' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="completed" fill="var(--color-success)" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="pending" fill="var(--color-warning)" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center space-x-6 mt-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-success rounded"></div>
                <span className="text-sm text-text-secondary">Completed</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-warning rounded"></div>
                <span className="text-sm text-text-secondary">Pending</span>
              </div>
            </div>
          </div>

          {/* Service Types Pie Chart */}
          <div>
            <h3 className="text-sm font-heading-medium text-text-primary mb-4">Service Distribution</h3>
            <div className="w-full h-64" aria-label="Service Distribution Pie Chart">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={serviceTypes}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {serviceTypes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${value}%`, 'Percentage']}
                    contentStyle={{
                      backgroundColor: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      color: 'var(--color-text-primary)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {serviceTypes.map((service, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded" 
                    style={{ backgroundColor: service.color }}
                  ></div>
                  <span className="text-xs text-text-secondary">{service.name}</span>
                  <span className="text-xs font-data-normal text-text-primary ml-auto">{service.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceChart;