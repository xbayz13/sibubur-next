'use client';

import { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  type TooltipItem,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import Card from '@/components/ui/Card';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement
);

interface ChartData {
  date: string;
  revenue: number;
  orders: number;
}

interface DashboardChartsProps {
  chartData: ChartData[];
}

export default function DashboardCharts({ chartData }: DashboardChartsProps) {
  const revenueChartData = useMemo(
    () => ({
      labels:
        chartData.length > 0
          ? chartData.map((d) => {
              const date = new Date(d.date);
              const dayName = date.toLocaleDateString('id-ID', { weekday: 'short' });
              return `${dayName}\n${date.getDate()}`;
            })
          : [],
      datasets: [
        {
          label: 'Pendapatan (Rp)',
          data: chartData.length > 0 ? chartData.map((d) => Number(d.revenue) || 0) : [],
          backgroundColor: 'rgba(16, 185, 129, 0.8)',
          borderColor: 'rgba(16, 185, 129, 1)',
          borderWidth: 1,
          borderRadius: 4,
          hoverBackgroundColor: 'rgba(16, 185, 129, 0.95)',
          hoverBorderColor: 'rgba(16, 185, 129, 1)',
        },
      ],
    }),
    [chartData]
  );

  const ordersChartData = useMemo(
    () => ({
      labels:
        chartData.length > 0
          ? chartData.map((d) => {
              const date = new Date(d.date);
              const dayName = date.toLocaleDateString('id-ID', { weekday: 'short' });
              return `${dayName}\n${date.getDate()}`;
            })
          : [],
      datasets: [
        {
          label: 'Jumlah Pesanan',
          data: chartData.length > 0 ? chartData.map((d) => Number(d.orders) || 0) : [],
          backgroundColor: 'rgba(99, 102, 241, 0.8)',
          borderColor: 'rgba(99, 102, 241, 1)',
          borderWidth: 1,
          borderRadius: 4,
          hoverBackgroundColor: 'rgba(99, 102, 241, 0.95)',
          hoverBorderColor: 'rgba(99, 102, 241, 1)',
        },
      ],
    }),
    [chartData]
  );

  const revenueChartOptions = useMemo(
    () =>
      ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(30, 41, 59, 0.95)',
            padding: 12,
            titleFont: { size: 14, weight: 'bold' },
            bodyFont: { size: 13 },
            callbacks: {
              label: function (context: TooltipItem<'bar'>) {
                if (context.dataset.label === 'Pendapatan (Rp)') {
                  return `Rp ${Number(context.parsed.y).toLocaleString('id-ID')}`;
                }
                return `${context.parsed.y} pesanan`;
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function (value: string | number) {
                if (typeof value === 'number' && value >= 1000000) {
                  return `Rp ${(value / 1000000).toFixed(1)}M`;
                } else if (typeof value === 'number' && value >= 1000) {
                  return `Rp ${(value / 1000).toFixed(0)}K`;
                }
                return value;
              },
              color: '#64748b',
              font: { size: 11 },
            },
            grid: { color: 'rgba(148, 163, 184, 0.1)' },
          },
          x: {
            ticks: { color: '#64748b', font: { size: 11 } },
            grid: { display: false },
          },
        },
      }) as const,
    []
  );

  const ordersChartOptions = useMemo(
    () =>
      ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(30, 41, 59, 0.95)',
            padding: 12,
            titleFont: { size: 14, weight: 'bold' },
            bodyFont: { size: 13 },
            callbacks: {
              label: function (context: TooltipItem<'bar'>) {
                return `${context.parsed.y} pesanan`;
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              color: '#64748b',
              font: { size: 11 },
            },
            grid: { color: 'rgba(148, 163, 184, 0.1)' },
          },
          x: {
            ticks: { color: '#64748b', font: { size: 11 } },
            grid: { display: false },
          },
        },
      }) as const,
    []
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      <Card title="Pendapatan 7 Hari Terakhir">
        {chartData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
            Tidak ada data untuk ditampilkan
          </div>
        ) : (
          <>
            <div className="h-64">
              <Bar data={revenueChartData} options={revenueChartOptions} />
            </div>
            <div className="mt-4 flex justify-center">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Total: Rp {chartData.reduce((sum, d) => sum + (Number(d.revenue) || 0), 0).toLocaleString('id-ID')}
              </div>
            </div>
          </>
        )}
      </Card>

      <Card title="Pesanan 7 Hari Terakhir">
        {chartData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
            Tidak ada data untuk ditampilkan
          </div>
        ) : (
          <>
            <div className="h-64">
              <Bar data={ordersChartData} options={ordersChartOptions} />
            </div>
            <div className="mt-4 flex justify-center">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Total: {chartData.reduce((sum, d) => sum + (Number(d.orders) || 0), 0)} pesanan
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
